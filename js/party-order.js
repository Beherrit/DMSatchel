// The party's orders: marching order (front to back) and the night's watch order, as lists of character ids, and the
// watches' hours. Pure, shared by the page and the server.

// A clean list: up to 12 distinct ids (strings), in the order given.
export const cleanOrder = (list) => [...new Set((Array.isArray(list) ? list : []).map((x) => String(x || '').slice(0, 40)).filter(Boolean))].slice(0, 12);

// The night's watches: the night (from `start`, `hours` long) split evenly between the watchers, in order.
// → [{ id, from, to }] in minutes past midnight (to may pass 1440 into the next day).
export function watchShifts(ids, start = 22 * 60, hours = 8) {
  const list = cleanOrder(ids);
  if (!list.length) return [];
  const each = Math.round((hours * 60) / list.length);
  return list.map((id, i) => ({ id, from: start + i * each, to: i === list.length - 1 ? start + hours * 60 : start + (i + 1) * each }));
}

// Whose watch it is at a time (minutes past midnight, any day): → the shift, or null outside the night.
export function onWatch(shifts, minutes) {
  if (!shifts.length) return null;
  const m = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  for (const s of shifts) for (const x of [m, m + 1440]) if (x >= s.from && x < s.to) return s;
  return null;
}

export const hhmm = (m) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// The orders as plain text: "Marching order (front to back): Bo, Ann\nWatches: 22:00–02:00 Ann; 02:00–06:00 Bo".
// nameOf(id) → a name ('' to leave someone out).
export function ordersText(march, watch, nameOf) {
  const m = cleanOrder(march).map(nameOf).filter(Boolean), w = watchShifts(watch).map((s) => ({ ...s, name: nameOf(s.id) })).filter((s) => s.name);
  return [m.length ? `Marching order (front to back): ${m.join(', ')}` : '', w.length ? `Watches: ${w.map((s) => `${hhmm(s.from)}–${hhmm(s.to)} ${s.name}`).join('; ')}` : ''].filter(Boolean).join('\n');
}
