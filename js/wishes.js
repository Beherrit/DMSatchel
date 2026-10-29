// Wish lists: what a player hopes their character will find or earn (a +1 sword, a ship, a seat on the council),
// stored on the character as JSON. Only its player and the GMs see them; either ticks a wish off when it comes
// true. Pure, shared by the page and the server.

const parse = (s) => { try { const v = typeof s === 'string' ? JSON.parse(s) : s; return Array.isArray(v) ? v : []; } catch { return []; } };

export const readWishes = (c) => parse(c?.fields?.wishes)
  .filter((w) => w && typeof w.text === 'string' && w.text.trim())
  .map((w) => ({ id: String(w.id || ''), text: w.text.slice(0, 200), got: Boolean(w.got), ...(w.at ? { at: String(w.at) } : {}) }));

const newId = () => `w${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
export const addWish = (list, text) => [...list, { id: newId(), text: String(text).trim().slice(0, 200), got: false }];
export const setGot = (list, id, got, now = new Date().toISOString()) => list.map((w) => {
  if (w.id !== id) return w;
  const { at, ...rest } = w;
  return got ? { ...rest, got: true, at: now } : { ...rest, got: false };
});
export const removeWish = (list, id) => list.filter((w) => w.id !== id);
export const openWishes = (list) => list.filter((w) => !w.got);

// Words worth matching ("a +1 longsword" → longsword); short and common words don't count.
const STOP = new Set(['the', 'and', 'with', 'from', 'for', 'some', 'that', 'this', 'into', 'their', 'magic', 'item', 'items', 'potion', 'scroll', 'ring']);
const words = (s) => String(s).toLowerCase().replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a).match(/[a-z][a-z'-]{3,}/g)?.filter((w) => !STOP.has(w)) || [];

// Does this loot (an item name) answer a wish? The whole name inside the wish, the wish inside the name, or every
// meaningful word of the wish in the name ("cloak of elvenkind" ↔ "an elvenkind cloak").
export function wishMatches(wishText, itemName) {
  const a = String(wishText).toLowerCase().trim(), b = String(itemName).toLowerCase().trim();
  if (b.length < 4 || a.length < 4) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const ww = words(a), iw = new Set(words(b));
  return ww.length > 0 && ww.every((w) => iw.has(w) || iw.has(w.replace(/s$/, '')) || iw.has(`${w}s`));
}

// Who hopes for this item: [{ character, wish }] over the characters given (open wishes only).
export const wishersFor = (itemName, characters) =>
  (characters || []).flatMap((c) => openWishes(readWishes(c)).filter((w) => wishMatches(w.text, itemName)).map((wish) => ({ character: c, wish })));
