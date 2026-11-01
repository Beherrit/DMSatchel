// Sheets keep outside changes: an open character sheet saves only what it changed itself since it was drawn (or
// last saved), on top of what's stored now, so coin from a split, rations eaten or a rest at an inn made meanwhile
// aren't overwritten. Compared key by key (hp, cp, inventory, slots…). Pure, so it can be tested.
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// base: the sheet's play when it was drawn or last saved; mine: the sheet's play now; stored: what's saved now.
export function mergePlay(base, mine, stored) {
  const out = { ...(stored || {}) };
  for (const k of Object.keys(mine || {})) if (!same(mine[k], base?.[k])) out[k] = mine[k];
  return out;
}
