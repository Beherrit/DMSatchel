// Attuned: which magic items on a sheet the character is attuned to (play.attuned, item names), against the limit of
// three (SRD 5.2). Pure.
export const ATTUNE_MAX = 3;

export const readAttuned = (play) => (Array.isArray(play?.attuned) ? play.attuned.map((x) => String(x).slice(0, 120)).filter(Boolean) : []);

// Tick or untick an item (by name, whatever the case); → the new list.
export function setAttuned(list, name, on) {
  const rest = (list || []).filter((x) => x.toLowerCase() !== String(name).toLowerCase());
  return on ? [...rest, String(name).slice(0, 120)].slice(0, 12) : rest;
}

// Of the items still on the sheet, which are attuned. names: the attunement items found on the sheet.
export const attunedOf = (list, names) => { const have = new Set((names || []).map((n) => n.toLowerCase())); return (list || []).filter((x) => have.has(x.toLowerCase())); };

// "Attuned to 2 of 3", "Attuned to 4 of 3: one too many".
export function attunedText(n) {
  const over = n - ATTUNE_MAX;
  return `Attuned to ${n} of ${ATTUNE_MAX}${over > 0 ? `: ${over === 1 ? 'one' : over} too many` : ''}`;
}
