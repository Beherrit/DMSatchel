// "Where the party has been": each time the GMs move the party, a stop is kept with the real time and the in-world
// date. Kept in the world's session prep (prep.journey). Pure, so the server, the map and the tests share it.

export const JOURNEY_MAX = 300;

// stop: { id (place entry), at (ISO time), day (in-world date text), by } → the new list (oldest first). Staying put
// adds nothing; the oldest stops fall off past JOURNEY_MAX.
export function addStop(list, stop) {
  const cur = Array.isArray(list) ? list : [];
  if (!stop?.id || cur.at(-1)?.id === stop.id) return cur;
  const clean = { id: String(stop.id).slice(0, 40), at: String(stop.at || new Date().toISOString()).slice(0, 40) };
  if (stop.day) clean.day = String(stop.day).slice(0, 120);
  if (stop.by) clean.by = String(stop.by).slice(0, 80);
  return [...cur, clean].slice(-JOURNEY_MAX);
}

// Strike a stop (put there by mistake), named by its time.
export const removeStop = (list, at) => (Array.isArray(list) ? list : []).filter((s) => s.at !== at);

// What one person sees: stops at places they can see; a place hidden in between doesn't split a stay in two.
export function journeyFor(list, canSee) {
  const out = [];
  for (const s of Array.isArray(list) ? list : []) {
    if (!s?.id || !canSee(s.id)) continue;
    if (out.at(-1)?.id === s.id) continue;
    out.push(s);
  }
  return out;
}

// The route on one map: each stop drawn at its place's pin, or the pin of the nearest place containing it
// (chainOf(id) → [id, parent, grandparent…]). Stops with no pin on this map are skipped; stays at one pin merge.
// → [{ x, y, pin, stops: [stop…] }]
export function journeyOnMap(list, pins, chainOf) {
  const points = [];
  for (const s of list || []) {
    let pin = null;
    for (const id of chainOf(s.id)) { pin = (pins || []).find((p) => p.entry_id === id); if (pin) break; }
    if (!pin) continue;
    if (points.at(-1)?.pin === pin) points.at(-1).stops.push(s);
    else points.push({ x: pin.x, y: pin.y, pin, stops: [s] });
  }
  return points;
}
