// Markdown import: turn notes into entry drafts. Handles three shapes:
//  • one file per entry (Obsidian and similar): file name = entry name, optional YAML front matter, folder = kind hint;
//  • one document with many entries: "## Kind" sections holding "### Entry" headings (this app's own export), or
//    plain "## Entry" headings;
//  • fields written as "**Label:** value", "Label:: value" (Dataview) or front matter keys.
// Pure functions, so they can be tested without the page.
import { KINDS, KIND_ORDER } from './world-schema.js';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Words that point at a kind, from its key, label and plural, plus a few common folder names.
const KIND_WORDS = (() => {
  const extra = { settlement: ['town', 'towns', 'city', 'cities', 'village', 'villages'], npc: ['people', 'person', 'characters npc', 'npcs'], region: ['regions', 'kingdom', 'kingdoms', 'country'],
    location: ['places', 'place', 'locations', 'dungeons', 'dungeon', 'shops', 'taverns'], faction: ['organizations', 'organisations', 'orgs'], character: ['pcs', 'pc', 'party', 'player characters'],
    deity: ['gods', 'god', 'religion', 'pantheon'], item: ['items', 'magic items', 'loot', 'treasure'], event: ['history', 'timeline', 'events'], session: ['sessions', 'session notes', 'recaps'],
    quest: ['quests', 'adventures', 'plots', 'hooks'], lore: ['lore', 'notes', 'world', 'cultures', 'rules'], creature: ['monsters', 'monster', 'bestiary', 'creatures'], journal: ['journals', 'diary'],
    clan: ['families', 'houses', 'clans', 'noble houses'], guild: ['guilds'], area: ['areas', 'districts', 'wilderness'], rumor: ['rumors', 'rumours', 'gossip'], handout: ['handouts'] };
  const map = new Map();
  for (const k of KIND_ORDER) for (const w of [k, KINDS[k].label, KINDS[k].plural, ...(extra[k] || [])]) map.set(norm(w), k);
  return map;
})();

export function kindFromWords(...hints) {
  for (const h of hints) {
    const n = norm(h);
    if (!n) continue;
    if (KIND_WORDS.has(n)) return KIND_WORDS.get(n);
    // "NPCs & Allies", "02 Towns": try each word, then each pair.
    const words = n.split(' ');
    for (let i = 0; i < words.length; i++) for (const w of [words.slice(i, i + 2).join(' '), words[i]]) if (KIND_WORDS.has(w)) return KIND_WORDS.get(w);
  }
  return null;
}

// "key: value" lines between --- fences at the top. Lists ("- a" or "[a, b]") become arrays.
export function frontMatter(text) {
  const m = String(text).match(/^﻿?---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!m) return { meta: {}, rest: String(text) };
  const meta = {}; let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w][\w -]*):\s*(.*)$/);
    if (kv) {
      key = kv[1].trim().toLowerCase(); let v = kv[2].trim();
      if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      else v = v.replace(/^["']|["']$/g, '');
      meta[key] = v === '' ? [] : v;
    } else if (key && /^\s*-\s+/.test(line)) {
      if (!Array.isArray(meta[key])) meta[key] = meta[key] ? [meta[key]] : [];
      meta[key].push(line.replace(/^\s*-\s+/, '').trim().replace(/^["']|["']$/g, ''));
    }
  }
  return { meta, rest: String(text).slice(m[0].length) };
}

const FIELD_LINE = /^\s*(?:\*\*([^*:]{1,40}):\*\*|([A-Za-z][\w ’'&/-]{0,39})::)\s*(.*)$/;

// Field label or key → field key for a kind ("Role or job", "role", "Role" all → role).
function fieldKey(kind, label) {
  const n = norm(label);
  for (const [k, l] of KINDS[kind].fields) if (norm(k) === n || norm(l) === n || norm(l).startsWith(`${n} `)) return k;
  return null;
}

// Body text → {fields, secret, tags, links, body}: pulls out field lines, "> **GM:**" secrets, "Tags:" and
// "Connections:" lines (this app's export), and #hashtags.
function readBody(kind, text) {
  const fields = {}, secret = [], links = [], tags = new Set(), out = [];
  const lines = String(text || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const f = line.match(FIELD_LINE);
    if (f) {
      const key = fieldKey(kind, f[1] || f[2]);
      if (key) {
        let v = f[3].trim();
        // "**Label:**" alone on a line: the value is the paragraph that follows.
        if (!v) { const para = []; while (i + 1 < lines.length && !lines[i + 1].trim()) i++; while (i + 1 < lines.length && lines[i + 1].trim() && !FIELD_LINE.test(lines[i + 1])) para.push(lines[++i]); v = para.join('\n'); }
        fields[key] = v; continue;
      }
    }
    const gm = line.match(/^>\s*\*\*GM:\*\*\s?(.*)$/);
    if (gm) { secret.push(gm[1]); continue; }
    const tg = line.match(/^Tags:\s*(.+)$/);
    if (tg) { for (const t of tg[1].match(/#[\w/-]+/g) || []) tags.add(t.slice(1).toLowerCase()); continue; }
    const cn = line.match(/^Connections:\s*(.+)$/);
    if (cn) { for (const part of cn[1].split(';')) { const m = part.match(/^\s*(.+?)\s+\[([^\]]+)\]/); if (m) links.push({ label: m[1].trim(), name: m[2].trim(), secret: /GM only/.test(part) }); } continue; }
    for (const t of line.match(/(?:^|\s)#([A-Za-z][\w/-]{1,39})/g) || []) tags.add(t.trim().slice(1).toLowerCase());
    out.push(line);
  }
  return { fields, secret: secret.join('\n'), links, tags: [...tags], body: out.join('\n').trim() };
}

// The first paragraph becomes the summary when it's short; the rest stays as the description.
function splitSummary(body) {
  const paras = body.split(/\n{2,}/);
  const first = (paras[0] || '').trim();
  if (first && first.length <= 400 && !/^[#>|-]/.test(first)) return { summary: first, body: paras.slice(1).join('\n\n').trim() };
  return { summary: '', body };
}

// [[Name]] stays as is (this app reads it); Obsidian's [[Name|label]] and [[Name#heading]] are tidied.
const tidyLinks = (t) => String(t || '').replace(/\[\[([^\]|#]+)#[^\]|]*(\|[^\]]+)?\]\]/g, '[[$1$2]]').replace(/!\[\[[^\]]+\]\]/g, '');

function draft({ name, kind, text, meta = {}, parentName = '', source }) {
  const k = KINDS[kind] ? kind : 'lore';
  const r = readBody(k, tidyLinks(text));
  for (const [key, v] of Object.entries(meta)) {
    const fk = fieldKey(k, key);
    if (fk && v && !r.fields[fk]) r.fields[fk] = Array.isArray(v) ? v.join(', ') : String(v);
  }
  const metaTags = [].concat(meta.tags || [], meta.tag || []).flatMap((t) => String(t).split(/[\s,]+/)).map((t) => t.replace(/^#/, '').toLowerCase()).filter(Boolean);
  const { summary, body } = meta.summary || meta.description ? { summary: String(meta.summary || meta.description), body: r.body } : splitSummary(r.body);
  const parent = parentName || meta.location || meta.parent || meta['located in'] || meta.region || '';
  return {
    name: String(name).trim().slice(0, 200), kind: k, summary: summary.slice(0, 4000), body, fields: r.fields, secret: r.secret,
    tags: [...new Set([...r.tags, ...metaTags])].slice(0, 30), linkNames: r.links, parentName: Array.isArray(parent) ? parent[0] || '' : String(parent).replace(/^\[\[|\]\]$/g, ''), source,
  };
}

// One file per entry. `path` like "World/NPCs/Mabel.md".
export function parseFile(path, text) {
  const parts = String(path).split('/');
  const file = parts.pop().replace(/\.(md|markdown|txt)$/i, '');
  const { meta, rest } = frontMatter(text);
  const h1 = rest.match(/^#\s+(.+)$/m);
  const name = meta.title || meta.name || (h1 && rest.trim().startsWith('#') ? h1[1] : file);
  const kind = kindFromWords(meta.kind, meta.type, meta.category, ...[...parts].reverse()) || 'lore';
  const text2 = h1 && rest.trim().startsWith('#') ? rest.replace(/^\s*#\s+.+\n?/, '') : rest;
  return [draft({ name, kind, text: text2, meta, source: path })];
}

// One document holding many entries.
export function parseDocument(text, { source = 'pasted' } = {}) {
  const { rest } = frontMatter(text);
  const lines = rest.split('\n');
  const out = [];
  const hasThree = lines.some((l) => /^###\s+/.test(l));
  let kind = null, cur = null;
  const flush = () => { if (cur) out.push(draft({ ...cur, text: cur.lines.join('\n'), source })); cur = null; };
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/), h3 = line.match(/^###\s+(.+)$/);
    if (h2 && hasThree) { flush(); kind = kindFromWords(h2[1]) || kind; continue; }
    if ((hasThree && h3) || (!hasThree && h2)) {
      flush();
      const name = (h3 || h2)[1].trim();
      cur = { name, kind: kind || kindFromWords(name) || 'lore', lines: [], parentName: '' };
      continue;
    }
    if (!cur) continue;
    // This app's export: "*NPC · Innkeeper · in Brindle*" right under the heading.
    const meta = !cur.lines.some((l) => l.trim()) && line.match(/^\*([^*]+)\*\s*$/);
    if (meta) {
      const bits = meta[1].split('·').map((b) => b.trim());
      const k = kindFromWords(bits[0]); if (k) cur.kind = k;
      const inPart = bits.find((b) => /^in\s+/.test(b)); if (inPart) cur.parentName = inPart.replace(/^in\s+/, '');
      continue;
    }
    cur.lines.push(line);
  }
  flush();
  return out.filter((d) => d.name);
}

// Mark drafts that already exist in the world (same name and kind), and ones repeated within the import.
// A name used by an entry of another kind is flagged too: links and "located in" match by name.
export function checkDrafts(drafts, existing) {
  const have = new Set(existing.map((e) => `${e.kind}|${e.name.toLowerCase()}`));
  const names = new Map(existing.map((e) => [e.name.toLowerCase(), e.kind]));
  const seen = new Set();
  return drafts.map((d) => {
    const key = `${d.kind}|${d.name.toLowerCase()}`;
    const status = have.has(key) ? 'exists' : seen.has(key) ? 'duplicate' : names.has(d.name.toLowerCase()) ? 'name' : 'new';
    seen.add(key);
    return { ...d, status, otherKind: status === 'name' ? names.get(d.name.toLowerCase()) : null };
  });
}
