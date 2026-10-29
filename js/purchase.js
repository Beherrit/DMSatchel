// Buy from a shop: the shop's stock (the plain text a stocked shop keeps: "Name | 5 gp | 3 in stock | note" under
// "## Category" headings) as items with prices in copper, and what's left after a purchase. Pure, so it can be
// tested: the server uses it to sell, the page to offer.
import { parsePrice } from './economy.js';

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
