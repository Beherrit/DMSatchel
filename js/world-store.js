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
      world.info = r.world; world.standings = s; world.maps = m?.maps || [];
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
