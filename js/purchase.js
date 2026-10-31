// Buy from a shop: the shop's stock (the plain text a stocked shop keeps: "Name | 5 gp | 3 in stock | note" under
// "## Category" headings) as items with prices in copper, and what's left after a purchase. Pure, so it can be
// tested: the server uses it to sell, the page to offer.
import { parsePrice, fmtPrice } from './economy.js';

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// → [{ name, cp, qty (a number, or -1 for "available"), line }] for what's on sale (out of stock left out).
export function stockItems(text) {
  const out = [];
  String(text || '').split('\n').forEach((raw, line) => {
    if (!raw.includes('|') || /^\s*Attitude:/.test(raw)) return;
    const [name, priceCell = '', stock = ''] = raw.split('|').map((x) => x.trim());
    const cp = Math.round(parsePrice(priceCell.replace(/\s*\(usually.*\)$/, '')) * 100);
    const qty = /available/i.test(stock) ? -1 : /out of stock/i.test(stock) ? 0 : Number((stock.match(/(\d+)/) || [])[1] || 0);
    if (name && cp > 0 && qty !== 0) out.push({ name, cp, qty, line });
  });
  return out;
}

// Buy qty of an item → { text (the stock after), name, qty, cp (the cost) } or { error }.
export function buyFrom(text, item, qty = 1) {
  const n = Math.max(1, Math.min(100, Math.round(Number(qty) || 1)));
  const it = stockItems(text).find((x) => norm(x.name) === norm(item));
  if (!it) return { error: `${item || 'That'} isn’t for sale here.` };
  if (it.qty > 0 && n > it.qty) return { error: `They only have ${it.qty} ${it.name}.` };
  const lines = String(text).split('\n');
  if (it.qty > 0) {
    const left = it.qty - n;
    const cells = lines[it.line].split('|');
    cells[2] = ` ${left ? `${left} in stock` : 'out of stock'} `;
    lines[it.line] = cells.map((c, i) => (i === 0 ? c.replace(/\s+$/, ' ') : i === cells.length - 1 ? c.replace(/^\s+/, ' ').replace(/\s+$/, '') : c)).join('|');
  }
  return { text: lines.join('\n'), name: it.name, qty: n, cp: it.cp * n };
}

// Sell to a shop: it pays its buy-back rate ("Buys at 50% of value" in the stock's first line) on the item's usual
// price, from its own shelf if it stocks the item, else from the price list (goods: [name, gp, category]); what it
// buys goes on the shelf. → { text, name, qty, cp (paid) } or { error }.
export function sellTo(text, item, qty = 1, goods = []) {
  const n = Math.max(1, Math.min(100, Math.round(Number(qty) || 1)));
  const rate = Number((String(text || '').match(/Buys at (\d+)%/) || [])[1]) || 50;
  const lines = String(text || '').split('\n');
  const idx = lines.findIndex((l) => l.includes('|') && !/^\s*Attitude:/.test(l) && norm(l.split('|')[0]) === norm(item));
  let each = 0, name = String(item || '').trim();
  if (idx >= 0) {
    const [shelfName, priceCell = ''] = lines[idx].split('|').map((x) => x.trim());
    const m = priceCell.match(/\(usually (.*)\)$/);
    each = Math.round(parsePrice(m ? m[1] : priceCell) * 100); name = shelfName;
  } else {
    const g = goods.find(([gn]) => norm(gn) === norm(item));
    if (g) { each = Math.round(g[1] * 100); name = g[0]; }
  }
  if (!each) return { error: `The shopkeeper doesn’t know what ${name || 'that'} is worth. Ask a GM.` };
  const cp = Math.max(1, Math.floor((each * rate / 100) * n));
  if (idx >= 0) {
    const cells = lines[idx].split('|');
    const stock = cells[2] || '';
    if (!/available/i.test(stock)) { const had = /out of stock/i.test(stock) ? 0 : Number((stock.match(/(\d+)/) || [])[1] || 0); cells[2] = ` ${had + n} in stock `; }
    lines[idx] = cells.map((c, i) => (i === 0 ? c.replace(/\s+$/, ' ') : i === cells.length - 1 ? c.replace(/^\s+/, ' ').replace(/\s+$/, '') : c)).join('|');
  } else {
    const head = '## Bought from adventurers';
    const line = `${name} | ${fmtPrice(each / 100)} | ${n} in stock`;
    const h = lines.indexOf(head);
    if (h >= 0) lines.splice(h + 1, 0, line); else lines.push('', head, line);
  }
  return { text: lines.join('\n'), name, qty: n, cp };
}

// Haggling: a GM grants a character a result at one shop (fields.haggle, JSON { characterId: percent }), used up by
// their next purchase there: -20 (a great haggle), -10 (a good one) or +10 (it went badly).
export const HAGGLES = [[-20, '20% off: a great haggle'], [-10, '10% off: a good haggle'], [10, '10% more: it went badly']];

export function readHaggle(raw) {
  try { const m = typeof raw === 'string' ? JSON.parse(raw) : raw; return Object.fromEntries(Object.entries(m && typeof m === 'object' ? m : {}).filter(([, v]) => HAGGLES.some(([p]) => p === v))); } catch { return {}; }
}
export const haggleFor = (raw, charId) => readHaggle(raw)[charId] || 0;
export function setHaggle(raw, charId, pct) {
  const m = readHaggle(raw);
  if (HAGGLES.some(([p]) => p === pct)) m[charId] = pct; else delete m[charId];
  return Object.keys(m).length ? JSON.stringify(m) : '';
}
export const withHaggle = (cp, pct) => (pct ? Math.max(1, Math.round(cp * (100 + pct) / 100)) : cp);
