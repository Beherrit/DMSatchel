// Not yet visited: which places the party has set foot in, from where the party has been (the journey's stops) and
// where it is now. Being somewhere counts for every place around it (a tavern in Brindle means Brindle, its area
// and its region too). Pure, so it can be tested. byId: Map(id → entry).
export function visitedPlaces(stopIds, byId, here = null) {
  const seen = new Set();
  for (const id of [...(stopIds || []), here].filter(Boolean)) {
    let e = byId.get(id), guard = 0;
    while (e && !seen.has(e.id) && guard++ < 30) { seen.add(e.id); e = e.parent_id ? byId.get(e.parent_id) : null; }
  }
  return seen;
}
