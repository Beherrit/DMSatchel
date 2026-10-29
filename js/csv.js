// Spreadsheet import: read CSV (or semicolon- or tab-separated) text, guess which column goes where, and turn rows
// into the same drafts the Markdown import makes, so they share its preview and checks. Pure, so it can be tested.
import { kindFromWords } from './md-import.js';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Rows of cells. Quotes may wrap commas, line breaks and doubled quotes ("").
export function parseCSV(text) {
  const t = String(text || '').replace(/^﻿/, '');
  const head = t.split(/\r?\n/, 1)[0] || '';
  const sep = [',', ';', '\t'].map((c) => [c, head.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (quoted) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.map((r) => r.map((x) => x.trim())).filter((r) => r.some(Boolean));
}

const TARGETS = {
  name: ['name', 'title', 'npc', 'character', 'item', 'place', 'entry'],
  kind: ['kind', 'entry type', 'category kind'],
  summary: ['summary', 'short description', 'one line', 'blurb', 'tagline'],
  body: ['description', 'body', 'notes', 'details', 'text', 'background', 'history'],
  tags: ['tags', 'tag', 'keywords', 'labels'],
  parent: ['located in', 'location', 'where', 'town', 'city', 'region', 'parent', 'lives in', 'part of'],
  secret: ['secret', 'gm notes', 'gm only', 'dm notes', 'secrets'],
};

// fields: [[key, label], ...] of the kind being imported. → for each header: 'name' | 'summary' | … | 'f:<key>' | ''.
export function guessMapping(headers, fields) {
  const used = new Set();
  return headers.map((h) => {
    const n = norm(h);
    let pick = '';
    const field = fields.find(([k, l]) => norm(l) === n || norm(k) === n);
    if (field) pick = `f:${field[0]}`;
    else for (const [target, words] of Object.entries(TARGETS)) if (words.includes(n)) { pick = target; break; }
    if (!pick || used.has(pick)) return '';
    used.add(pick); return pick;
  });
}

// rows (without the header) + mapping → drafts like md-import's: { name, kind, summary, body, fields, secret, tags,
// parentName, linkNames, source }. Rows without a name are left out.
export function rowsToDrafts(rows, mapping, defaultKind, source = 'spreadsheet') {
  return rows.map((r, i) => {
    const d = { name: '', kind: defaultKind, summary: '', body: '', fields: {}, secret: '', tags: [], parentName: '', linkNames: [], source: `${source}, row ${i + 2}` };
    mapping.forEach((m, j) => {
      const v = String(r[j] ?? '').trim();
      if (!m || !v) return;
      if (m.startsWith('f:')) d.fields[m.slice(2)] = v;
      else if (m === 'tags') d.tags = [...new Set(v.split(/[,;|]/).map((x) => x.trim().replace(/^#/, '').toLowerCase()).filter(Boolean))].slice(0, 30);
      else if (m === 'kind') d.kind = kindFromWords(v) || defaultKind;
      else if (m === 'parent') d.parentName = v;
      else d[m] = v;
    });
    d.name = d.name.slice(0, 200);
    return d;
  }).filter((d) => d.name);
}

// ---- export ---------------------------------------------------------------------------------------------------

// One CSV cell: quoted when it holds a comma, quote or line break; text a spreadsheet would run as a formula
// (=, +, @, or - before a number or bracket) gets a leading apostrophe.
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+@]/.test(s) || /^-[\d.(]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCSV = (rows) => rows.map((r) => r.map(cell).join(',')).join('\r\n');

// Entries of one kind as a spreadsheet the importer reads back: Name, Kind, Summary, Located in, Tags, each field
// (by its label), Description, and the GM secret (as Secret) for GMs. fields: [[key, label, type], …]; nameOf(id) → a place's
// name. Starts with a byte-order mark so spreadsheet apps read accents right.
export function entriesCSV(entries, kindLabel, fields, nameOf, { gm = false } = {}) {
  const cols = fields.filter(([, , type]) => type !== 'hidden' && type !== 'image');
  const head = ['Name', 'Kind', 'Summary', 'Located in', 'Tags', ...cols.map(([, l]) => l), 'Description', ...(gm ? ['Secret'] : [])];
  const rows = entries.map((e) => [e.name, kindLabel, e.summary || '', e.parent_id ? nameOf(e.parent_id) || '' : '', (e.tags || []).join(', '),
    ...cols.map(([k]) => e.fields?.[k] ?? ''), e.body || '', ...(gm ? [e.secret || ''] : [])]);
  return `﻿${toCSV([head, ...rows])}\r\n`;
}
