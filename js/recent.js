// Recently viewed entries, newest first, kept in this browser per world (no account needed).
export const MAX_RECENT = 10;
const keyOf = (world) => `satchel-recent-${world || 'default'}`;

export function readRecent(store, world) {
  try { const v = JSON.parse(store.getItem(keyOf(world)) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, MAX_RECENT) : []; } catch { return []; }
}

export function pushRecent(store, world, id) {
  const next = [id, ...readRecent(store, world).filter((x) => x !== id)].slice(0, MAX_RECENT);
  try { store.setItem(keyOf(world), JSON.stringify(next)); } catch { /* private window */ }
  return next;
}
