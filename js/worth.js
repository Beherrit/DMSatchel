// What it's worth: what a character's gear would fetch at the shops: half the list price (the rate a shop buys at
// unless it says otherwise, as the sell route pays), from the price list in economy.js. Names are matched the way
// players write them ("Rope" → "Hempen rope (50 ft)", "20 arrows" → "Arrows (20)" a piece); magic "+1" gear is
// left to the GMs. Pure.
import { carried } from './weights.js';

const SKIP = new Set(['Lodging & services', 'Spellcasting']);
const norm = (s) => String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const bare = (s) => norm(s).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
const singular = (s) => s.replace(/ies$/, 'y').replace(/(ch|sh|x)es$/, '$1').replace(/([^s'])s$/, '$1');

// goods: [[name, gp, category]] → a lookup: name → { name, cp } for one of it (or null).
export function priceIndex(goods) {
  const exact = new Map(), loose = new Map(), list = [];
  for (const [name, gp, cat] of goods || []) {
    if (SKIP.has(cat) || !(gp > 0)) continue;
    const cp = gp * 100, bundle = /\((\d+)\)\s*$/.exec(name), each = bundle ? cp / Number(bundle[1]) : cp;
    exact.set(norm(name), { name, cp });
    const b = bare(name);
    for (const k of [b, singular(b)]) if (!loose.has(k) || loose.get(k).cp > each) loose.set(k, { name, cp: each });
    list.push({ key: b, name, cp: each });
  }
  const keys = [...loose.keys()].sort((a, b) => b.length - a.length);
  return (raw) => {
    // Magic gear ("+1 Longsword") is worth what the GMs say, not the plain thing's price.
    if (/(^|\s)\+\d/.test(String(raw))) return null;
    const n = norm(raw).replace(/^(a|an|the) /, '');
    if (exact.has(n)) return exact.get(n);
    const b = bare(n), s = singular(b);
    for (const k of [b, s]) if (loose.has(k)) return loose.get(k);
    // "Silvered longsword": a known name inside it; "Rope": the cheapest good whose name ends with it.
    const hit = keys.find((k) => ` ${s} `.includes(` ${k} `) || ` ${b} `.includes(` ${k} `));
    if (hit) return loose.get(hit);
    const ends = list.filter((x) => x.key.endsWith(` ${b}`) || x.key.endsWith(` ${s}`)).sort((x, y) => x.cp - y.cp)[0];
    return ends ? { name: ends.name, cp: ends.cp } : null;
  };
}

// → { cp (what the shops would pay), list (full price), priced: [{ name, qty, cp }], unknown: [names] }
export function worthOf(inventory, goods, rate = 50) {
  const price = priceIndex(goods);
  let list = 0; const priced = [], unknown = [];
  for (const x of carried(inventory).items) {
    const p = price(x.name);
    if (!p) { unknown.push(x.name); continue; }
    list += p.cp * x.qty; priced.push({ name: x.name, qty: x.qty, cp: Math.floor(p.cp * x.qty * rate / 100) });
  }
  return { cp: Math.floor(list * rate / 100), list: Math.round(list), priced, unknown };
}
