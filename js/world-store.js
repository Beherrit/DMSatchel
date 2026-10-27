// Shared world state and small helpers used by every world view.
import { el } from './dom.js';
import { api } from './api.js';
import { KINDS } from './world-schema.js';

export const world = { entries: new Map(), info: null, loaded: false, loading: null, error: null, standings: null, maps: null };

export const worldEntries = () => [...world.entries.values()];
export const getEntry = (id) => world.entries.get(id);

export async function loadWorld(force) {
  if (world.loading && !force) return world.loading;
  world.loading = (async () => {
    try {
      const [r, s, m] = await Promise.all([api('entries'), api('standings').catch(() => null), api('maps').catch(() => null)]);
      world.entries = new Map(r.entries.map((e) => [e.id, e]));
      world.info = r.world; world.role = r.role || null; world.standings = s; world.maps = m?.maps || [];
      world.loaded = true; world.error = null;
    } catch (e) { world.error = e; }
    world.loading = null;
  })();
  return world.loading;
}

export const byName = (a, b) => a.name.localeCompare(b.name);
export const kindLabel = (k) => KINDS[k]?.label || k;
export const link = (e, text) => el('a', { href: `#world/e/${e.id}`, class: `elink k-${e.kind}` }, text || e.name);
export const when = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');
export const whenTime = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

export function findByName(name) {
  const n = String(name).trim().toLowerCase();
  return worldEntries().find((e) => e.name.toLowerCase() === n);
}

// Ids of entries mentioned in text with [[Name]] or [[Name|label]].
export function mentions(text) {
  const ids = new Set();
  for (const m of String(text || '').matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) { const e = findByName(m[1]); if (e) ids.add(e.id); }
  return ids;
}

// Body text with [[Entry Name]] links.
export function richText(text) {
  const out = el('div', { class: 'rich' });
  for (const para of String(text || '').split(/\n{2,}/)) {
    const p = el('p');
    String(para).split(/(\[\[[^\]]+\]\])/).forEach((part) => {
      const m = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
      if (!m) { p.append(part); return; }
      const target = findByName(m[1]);
      p.append(target ? link(target, m[2] || m[1]) : el('span', { class: 'missing', title: 'No entry with this name yet' }, m[2] || m[1]));
    });
    out.append(p);
  }
  return out;
}

export function notice(title, text, ...extra) { return el('div', { class: 'card empty-state' }, el('h3', {}, title), el('p', {}, text), ...extra); }

export function nameList(id = 'w-names') {
  return el('datalist', { id }, worldEntries().sort(byName).map((e) => el('option', { value: e.name }, kindLabel(e.kind))));
}

// ---- saving ------------------------------------------------------------------------------------

export async function createEntry(draft) {
  const r = await api('entries', { method: 'POST', body: { entry: draft } });
  world.entries.set(r.entry.id, r.entry);
  return r.entry;
}

export async function createEntries(drafts) {
  if (drafts.length === 1) return [await createEntry(drafts[0])];
  const r = await api('entries', { method: 'POST', body: { mode: 'batch', entries: drafts } });
  for (const e of r.entries) world.entries.set(e.id, e);
  return r.entries;
}

// Change some fields of an entry, keeping everything else. Stops if another GM saved first.
export async function patchEntry(entry, patch) {
  const next = { ...entry, ...patch, fields: { ...(entry.fields || {}), ...(patch.fields || {}) } };
  const r = await api('entries', { method: 'PUT', query: { id: entry.id }, body: { entry: next } });
  world.entries.set(r.entry.id, r.entry);
  return r.entry;
}

// GM quick changes: reveal or hide an entry, approve a suggestion.
export async function setEntryState(entry, { visibility, status }) {
  const r = await api('entries', { method: 'PATCH', body: { id: entry.id, visibility, status } });
  world.entries.set(r.entry.id, r.entry);
  return r.entry;
}

// Little markers for entries players can't see, or that wait for a GM.
export function stateBadges(e) {
  return [e.visibility === 'gm' ? el('span', { class: 'tag hidden-tag', title: 'Only GMs can see this entry' }, 'GMs only') : null,
    e.status === 'suggested' ? el('span', { class: 'tag suggest-tag', title: 'Suggested by a player; a GM hasn’t approved it yet' }, 'Suggested') : null].filter(Boolean);
}

// ---- place helpers -----------------------------------------------------------------------------

export const childrenOf = (id, kinds) => worldEntries().filter((e) => e.parent_id === id && (!kinds || kinds.includes(e.kind))).sort(byName);

// Every entry inside a place, at any depth.
export function descendantsOf(id, kinds) {
  const out = [], seen = new Set([id]);
  let frontier = [id];
  while (frontier.length) {
    const next = [];
    for (const e of worldEntries()) if (frontier.includes(e.parent_id) && !seen.has(e.id)) { seen.add(e.id); next.push(e.id); if (!kinds || kinds.includes(e.kind)) out.push(e); }
    frontier = next;
  }
  return out.sort(byName);
}

export function trail(e) {
  const out = []; let p = e?.parent_id && getEntry(e.parent_id), guard = 0;
  while (p && guard++ < 12) { out.unshift(p); p = p.parent_id && getEntry(p.parent_id); }
  return out;
}

// Entries connected to a place by a link ("headquartered in", "located in"…) rather than nesting.
export const linkedTo = (id, kinds) => worldEntries().filter((e) => (!kinds || kinds.includes(e.kind)) && (e.links || []).some((l) => l.id === id));

export const mapsOf = (id) => (world.maps || []).filter((m) => m.entry_id === id);
