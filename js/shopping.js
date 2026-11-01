// A shopping list: what a character means to buy (kept in their sheet's play state, play.shopping), matched against
// a shop's stock so the buy panel can offer it first. Pure, so it can be tested.

export const MAX_SHOPPING = 20;
const words = (s) => String(s || '').toLowerCase().split(/[^a-z0-9’']+/).filter(Boolean);

export const readList = (play) => (Array.isArray(play?.shopping) ? play.shopping.map((x) => String(x).slice(0, 80)).filter(Boolean) : []);

export function addToList(list, text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!t || list.some((x) => x.toLowerCase() === t.toLowerCase())) return list;
  return [...list, t].slice(0, MAX_SHOPPING);
}
export const removeFromList = (list, i) => list.filter((_, n) => n !== i);

// Does a stocked item answer a line on the list? Every word on the line starts a word of the item's name
// ("rope" finds "Hempen rope", "healing potion" finds "Potion of healing").
// Bare numbers on the line ("Rations × 3") are how many, not part of the name.
export const answers = (line, itemName) => { const want = words(line).filter((w) => !/^\d+$/.test(w)), have = words(itemName); return want.length > 0 && want.every((w) => have.some((h) => h.startsWith(w))); };

// The stock's items with the ones on the list first, each marked: items [{ name, … }] → [{ …item, wanted }]
export function listFirst(items, list) {
  const marked = (items || []).map((it) => ({ ...it, wanted: list.some((l) => answers(l, it.name)) }));
  return [...marked.filter((x) => x.wanted), ...marked.filter((x) => !x.wanted)];
}

// A packing list: put "Rations × n" on the list for a trip, in place of any rations line already there.
export function withRations(list, n) {
  const rest = (list || []).filter((l) => !answers(l, 'Rations (1 day)'));
  return n > 0 ? addToList(rest, `Rations × ${n}`) : rest;
}
