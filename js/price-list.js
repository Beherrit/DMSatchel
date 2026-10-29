// Price list: everything the shops price (SRD 5.1 equipment, food, lodging and services), grouped by kind and
// filtered by a search, cheapest first within each kind. Pure, so it can be tested.
import { GOODS, CATEGORIES } from './economy.js';

// Words, for matching at the start of each ("ale" finds Ale, not Scale mail).
const tokens = (s) => s.toLowerCase().split(/[^a-z0-9’']+/).filter(Boolean);

// → [{ cat, rows: [[name, gp]] }]; q matches names or the kind ("ale", "armor").
export function priceGroups(q = '', goods = GOODS) {
  const words = String(q).toLowerCase().split(/\s+/).filter(Boolean);
  const cats = [...new Set(goods.map((g) => g[2]))].sort((a, b) => CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b));
  return cats.map((cat) => ({
    cat,
    rows: goods.filter((g) => g[2] === cat && words.every((w) => tokens(`${g[0]} ${cat}`).some((t) => t.startsWith(w))))
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).map(([n, p]) => [n, p]),
  })).filter((g) => g.rows.length);
}
