// Quest rewards for the party treasury: read "200 gp, a +1 longsword and 3 potions of healing" into coin and items
// the GM can check before they're added. Pure, so it can be tested.
import { parsePrice } from './economy.js';

const WORDS = { platinum: 'pp', gold: 'gp', silver: 'sp', copper: 'cp' };
const COIN = /([\d][\d,.]*)\s*(pp|gp|sp|cp)\b/g;
const LEAD = /^(?:a|an|the|one|some)\s+/i;
const NUMBER_WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };

export function parseReward(text) {
  let t = String(text || '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a);
  t = t.replace(/([\d][\d,.]*)\s*(platinum|gold|silver|copper)(?:\s*(?:pieces?|coins?|crowns?))?/gi, (_, n, w) => `${n} ${WORDS[w.toLowerCase()]}`);
  const cp = Math.round(parsePrice(t.toLowerCase()) * 100);
  const rest = t.replace(/([\d][\d,.]*)\s*(pp|gp|sp|cp)\b/gi, ' ').replace(/\b(each|apiece|per (?:person|head|hero))\b/gi, ' ');
  const items = [];
  for (let part of rest.split(/[,;\n]|\s+and\s+|\s+plus\s+/i)) {
    part = part.replace(/^[\s\-–—:.&]+|[\s\-–—:.&]+$/g, '').replace(/^(?:(?:and|or|plus)\s+)+/i, '').replace(LEAD, '').trim();
    if (!part || part.length < 3 || /^(and|or|in|of|with|the)$/i.test(part)) continue;
    let qty = 1;
    const n = part.match(/^(\d+)\s*[x×]?\s+(.+)$/i) || part.match(/^(two|three|four|five|six|seven|eight|nine|ten|twelve)\s+(.+)$/i);
    if (n) { qty = Number(n[1]) || NUMBER_WORDS[n[1].toLowerCase()]; part = n[2].trim(); }
    items.push({ item: part.slice(0, 200), qty });
  }
  return { cp, items };
}
