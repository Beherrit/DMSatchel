// Hand out to everyone: the same item (and/or coin) to each of several characters at once. Pure, so it can be tested.
import { parseCoins } from './economy.js';

// { item, qty, coin (coin text, each) } → { item, qty, cp } or { error }
export function readHandOut({ item = '', qty = 1, coin = '' } = {}) {
  const name = String(item).replace(/\s+/g, ' ').trim().slice(0, 200);
  const n = Math.max(1, Math.min(100, Math.round(Number(qty) || 1)));
  const cp = Math.max(0, parseCoins(coin) || 0);
  if (!name && !cp) return { error: 'Say what to hand out: an item, some coin, or both.' };
  return { item: name, qty: name ? n : 0, cp };
}

// What it takes from the treasury for this many characters.
export const handOutTotal = (h, people) => ({ qty: h.qty * people, cp: h.cp * people });
