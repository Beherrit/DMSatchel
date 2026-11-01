// Friends get a discount: shops in a place held by a power the party stands well with (+3 or better) give 10% off;
// where the party is hated (−3 or worse), 10% more. Only open standing counts (never a GM-only change), so the page
// and the server agree. Pure, so they share it.
import { controllers } from './control.js';

export const standingPct = (v) => (v >= 3 ? -10 : v <= -3 ? 10 : 0);

// log: standing changes, newest first. → the latest open value for this entry (0 if none).
export const openStanding = (log, entryId) => (log || []).find((r) => r.entry_id === entryId && !r.secret)?.value ?? 0;

// → { holder, value, pct } for the power holding this shop's place, or null when nobody holds it.
export function shopStanding(shop, entries, log) {
  const h = controllers(entries).get(shop.id);
  if (!h) return null;
  const value = Number(openStanding(log, h.by.id)) || 0;
  return { holder: h.by, value, pct: standingPct(value) };
}
