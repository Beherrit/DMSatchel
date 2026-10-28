// Where to draw the party on a map: the pin for the place the party is in, or else the pin for the nearest place
// that contains it (a region map has the town pinned, not the inn). Pure, so it can be tested.
// chain: the party's place id first, then each place above it.
export function partyPin(pins, chain) {
  for (const id of chain || []) {
    const pin = (pins || []).find((p) => p.entry_id === id);
    if (pin) return { pin, exact: id === chain[0] };
  }
  return null;
}
