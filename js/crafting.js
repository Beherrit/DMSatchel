// Crafting estimates for downtime, by the SRD 5.2 rules (CC BY 4.0) for crafting nonmagical items: the raw materials
// cost half the item's price, and the work takes its price in GP ÷ 10 days (rounded up, at least one); characters
// working together divide the days. Prices come from the SRD price list in economy.js. Pure.
import { GOODS } from './economy.js';

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// The good on the price list by name (exact, or the one it starts with). → { name, gp, category } or null.
export function findGood(name, goods = GOODS) {
  const n = norm(name);
  if (!n) return null;
  const hit = goods.find((g) => norm(g[0]) === n) || goods.find((g) => norm(g[0]).startsWith(n)) || goods.find((g) => n.startsWith(norm(g[0])));
  return hit ? { name: hit[0], gp: hit[1], category: hit[2] } : null;
}

// → { name, gp, materialsCp, days (for one crafter), daysEach (with helpers), helpers } or null when it isn't listed.
export function craftEstimate(name, helpers = 1, goods = GOODS) {
  const g = findGood(name, goods);
  if (!g) return null;
  const n = Math.max(1, Math.min(20, Math.round(Number(helpers) || 1)));
  const days = Math.max(1, Math.ceil(g.gp / 10));
  return { name: g.name, gp: g.gp, materialsCp: Math.round(g.gp * 50), days, daysEach: Math.max(1, Math.ceil(days / n)), helpers: n };
}
