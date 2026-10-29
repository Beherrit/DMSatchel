// World backups: one JSON file with the world's settings, entries, maps (with their images), standing, clocks,
// treasury and quote wall. A backup restores as a new world: every entry gets a fresh id (ids are global), so the
// original world, if it still exists, is never touched. Pure, so it can be tested.

export const BACKUP_FORMAT = 2;

const arr = (v) => (Array.isArray(v) ? v : []);

// Any backup this app has made (format 2, or the older entries-only file, or a bare list) → a normal shape,
// or { error }.
export function readBackup(data) {
  if (Array.isArray(data)) data = { entries: data };
  if (!data || typeof data !== 'object' || !Array.isArray(data.entries)) return { error: 'That file isn’t a world backup.' };
  return {
    format: Number(data.format) || 1, exported: data.exported || null, world: data.world && typeof data.world === 'object' ? data.world : {},
    entries: data.entries.filter((e) => e && typeof e === 'object' && e.kind && e.name),
    maps: arr(data.maps), standing: arr(data.standing), clocks: arr(data.clocks), ledger: arr(data.ledger), quotes: arr(data.quotes),
  };
}

// A fresh 16-hex id like the server's.
export function hexId(rand = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  return [...rand(8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Every entry id in the backup swapped for a fresh one, wherever it appears (parents, connections, pins, standing,
// prep, start here…). Ids are 16 random hex characters, so replacing them as whole words can't hit anything else.
export function remapIds(backup, make = hexId) {
  const ids = new Map(backup.entries.filter((e) => typeof e.id === 'string' && /^[\w-]{4,40}$/.test(e.id)).map((e) => [e.id, make()]));
  if (!ids.size) return { backup, ids };
  const re = new RegExp(`\\b(${[...ids.keys()].map((k) => k.replace(/[-]/g, '\\-')).join('|')})\\b`, 'g');
  return { backup: JSON.parse(JSON.stringify(backup).replace(re, (m) => ids.get(m))), ids };
}

export const chunks = (list, n) => { const out = []; for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n)); return out; };

// Parents before children, so every entry's "located in" exists when it arrives.
export function parentsFirst(entries) {
  const byId = new Map(entries.map((e) => [e.id, e])), depth = new Map();
  const d = (e, seen = new Set()) => { if (depth.has(e.id)) return depth.get(e.id); if (seen.has(e.id)) return 0; seen.add(e.id); const p = byId.get(e.parent_id); const v = p ? d(p, seen) + 1 : 0; depth.set(e.id, v); return v; };
  return [...entries].sort((a, b) => d(a) - d(b));
}
