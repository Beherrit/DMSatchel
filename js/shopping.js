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
export const answers = (line, itemName) => { const want = words(line), have = words(itemName); return want.length > 0 && want.every((w) => have.some((h) => h.startsWith(w))); };

// The stock's items with the ones on the list first, each marked: items [{ name, … }] → [{ …item, wanted }]
export function listFirst(items, list) {
  const marked = (items || []).map((it) => ({ ...it, wanted: list.some((l) => answers(l, it.name)) }));
  return [...marked.filter((x) => x.wanted), ...marked.filter((x) => !x.wanted)];
}
