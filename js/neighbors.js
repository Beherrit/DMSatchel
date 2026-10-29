// Next and previous: the entries either side of one, among its own kind in reading order (sessions by number,
// everything else by name). Pure, so it can be tested.

const num = (e) => parseFloat(e.fields?.number);

export function neighbors(entries, e) {
  const list = (entries || []).filter((x) => x.kind === e.kind && (x.status || 'live') === (e.status || 'live'));
  list.sort(e.kind === 'session'
    ? (a, b) => (num(a) || 0) - (num(b) || 0) || String(a.created_at).localeCompare(String(b.created_at))
    : (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || String(a.id).localeCompare(String(b.id)));
  const i = list.findIndex((x) => x.id === e.id);
  return i < 0 ? { prev: null, next: null } : { prev: list[i - 1] || null, next: list[i + 1] || null };
}
