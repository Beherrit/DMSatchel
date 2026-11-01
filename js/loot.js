// Loot: a pocketful from one creature or a full hoard, by challenge tier (coins, gems or art, SRD magic items, now and
// then a trinket). Shared by the Table Tools loot roller and encounters ("Treasure from a fight"). Pure, so it can be
// tested: rng from rng.js makeRng.
import * as D from './tables.js';
import { randomItem, RARITY_KEYS } from './magic-items.js';

const RARITY_CODE = { common: 'c', uncommon: 'u', rare: 'r', veryrare: 'v', legendary: 'l' };

// A catalog item for a loot tier; now and then a cursed one sneaks in.
export function magicItem(r, tier) {
  const rr = r.pickW(D.RARITY_W[tier]);
  const it = (r.chance(0.06) && randomItem(r, { cursed: true })) || randomItem(r, { rarity: RARITY_CODE[rr], cursed: false });
  return { r: RARITY_KEYS[it.rarity], name: it.name, item: it };
}

// The loot tier for a challenge rating: 0 (CR 0–4), 1 (5–10), 2 (11–16), 3 (17+).
export const tierForCR = (cr) => (cr >= 17 ? 3 : cr >= 11 ? 2 : cr >= 5 ? 1 : 0);

// → { tier, hoard, coins: [[coin, qty]], vals: [{ name, each, value, kind }], items, extra, where, total (gp) }
export function rollLoot(r, { tier = 0, hoard = false } = {}) {
  const mode = hoard ? 'hoard' : 'pocket', d = r.dice, pick = r.pick;
  const coins = [];
  for (const [c, n, s, m, ch] of D.COINS[mode][tier]) if (r.chance(ch)) coins.push([c, d(n, s) * m]);
  if (!coins.length) { const [c, n, s, m] = D.COINS[mode][tier][0]; coins.push([c, d(n, s) * m]); }
  const vals = [];
  if (hoard && r.chance(tier === 0 ? 0.6 : 0.85)) {
    const [table, values, [n, s]] = pick(D.VALUABLES[tier]); const v = pick(values); const count = d(n, s);
    const tally = {}; for (let i = 0; i < count; i++) { const nm = pick(table[v]); tally[nm] = (tally[nm] || 0) + 1; }
    for (const [nm, q] of Object.entries(tally)) vals.push({ name: (q > 1 ? `${q} × ` : '') + nm, each: v, value: v * q, kind: table === D.GEMS ? 'gem' : 'art' });
  }
  const items = [];
  const nItems = hoard ? [Math.max(0, d(1, 4) - 2), d(1, 3), d(1, 4), d(1, 4) + 1][tier] : (r.chance(0.12) ? 1 : 0);
  for (let i = 0; i < nItems; i++) items.push(magicItem(r, hoard ? tier : 0));
  const extra = r.chance(hoard ? 0.5 : 0.35) ? pick(D.TABLES.trinket.items) : null;
  const total = coins.reduce((a, [c, q]) => a + q * D.GP[c], 0) + vals.reduce((a, v) => a + v.value, 0);
  return { tier, hoard, coins, vals, items, extra, where: pick(D.CONTAINERS), total };
}

// Loot as lines for the party's loot log: the coins as one amount in copper, and each valuable, item and trinket.
export function lootLog(l, note) {
  const cp = Math.round(l.coins.reduce((a, [c, q]) => a + q * D.GP[c] * 100, 0));
  const lines = cp ? [{ cp, note }] : [];
  for (const v of l.vals) { const m = /^(\d+) × (.*)$/.exec(v.name); lines.push({ item: m ? m[2] : v.name, qty: m ? +m[1] : 1, note: `${note} (${v.each} gp each)` }); }
  for (const it of l.items) lines.push({ item: it.name, qty: 1, note });
  if (l.extra) lines.push({ item: l.extra, qty: 1, note: `${note} (a trinket)` });
  return lines;
}
