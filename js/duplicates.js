// Likely duplicates: pairs of entries that look like the same thing (the same name, or a near one) so GMs can merge
// them or say they're different. Pure, so it can be tested.
import { normName, closeness } from './name-check.js';

// Kinds where alike names are expected (Session 4, a journal per sitting) are left out.
const SKIP = new Set(['session', 'journal', 'downtime']);

export const pairKey = (a, b) => [String(a), String(b)].sort().join('|');

// → [{ a, b, exact }], exact matches first, then by name. Near names only count within one kind; the same name
// counts across kinds. dismissed: pair keys GMs marked "not the same".
export function likelyDuplicates(entries, dismissed = []) {
  const skip = new Set(dismissed);
  const list = (entries || []).filter((e) => !SKIP.has(e.kind) && (e.status || 'live') === 'live')
    .map((e) => ({ e, n: normName(e.name) })).filter((x) => x.n.length >= 3);
  const out = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const x = list[i], y = list[j];
      if (x.e.kind !== y.e.kind && x.n !== y.n) continue;
      const c = closeness(x.n, y.n);
      if (!c || skip.has(pairKey(x.e.id, y.e.id))) continue;
      const [a, b] = x.e.name.localeCompare(y.e.name) <= 0 ? [x.e, y.e] : [y.e, x.e];
      out.push({ a, b, exact: c === 'exact' });
    }
  }
  return out.sort((p, q) => q.exact - p.exact || p.a.name.localeCompare(q.a.name) || p.b.name.localeCompare(q.b.name));
}
