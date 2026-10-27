// Renders markets and shop stock (from the plain text saved on entries) with haggle and buy-back helpers.
import { el, setKids } from './dom.js';
import { ECONOMIES, parsePrice, fmtPrice } from './economy.js';

const ICON = { shortage: '▲', surplus: '▼', embargo: '⊘' };
export function renderMarket(m) {
  if (!m) return null;
  const eco = ECONOMIES[m.economy] || ECONOMIES.Stable;
  return el('div', { class: `market eco-${m.economy.toLowerCase()}` },
    el('div', { class: 'market-head' }, el('span', { class: 'eco-pill' }, m.economy), el('span', { class: 'muted small' }, eco.note),
      el('span', { class: `inflation ${m.inflation > 0 ? 'up' : m.inflation < 0 ? 'down' : ''}` }, `Prices ${m.inflation >= 0 ? '+' : ''}${m.inflation}%`)),
    m.conditions.length ? el('ul', { class: 'conditions' }, m.conditions.map((c) => el('li', { class: `cond ${c.kind}` },
      el('span', { class: 'cond-kind' }, `${ICON[c.kind]} ${c.kind[0].toUpperCase()}${c.kind.slice(1)}`), el('strong', {}, c.category),
      el('span', { class: 'muted small' }, c.kind === 'embargo' ? 'Banned (black market only)' : `prices ×${c.factor}`), c.reason ? el('span', { class: 'cond-reason' }, c.reason) : null))) : el('p', { class: 'muted small' }, 'No shortages or gluts right now.'),
    m.festival ? el('p', { class: 'festival' }, m.festival) : null);
}

const NOTE_CLASS = { Shortage: 'bad', Surplus: 'good', Banned: 'muted', Contraband: 'warn', Festival: 'warn' };

export function renderStock(text) {
  const lines = String(text || '').split('\n');
  if (!lines.some((l) => l.includes('|'))) return null;
  const box = el('div', { class: 'stock' });
  let head = '', table = null, tbody = null;
  const sections = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^Attitude:/.test(line)) { head = line; continue; }
    if (line.startsWith('## ')) {
      tbody = el('tbody');
      table = el('section', { class: 'stock-sec' }, el('h5', {}, line.slice(3)), el('div', { class: 'table-wrap' }, el('table', { class: 'stock-table' }, el('thead', {}, el('tr', {}, ['Item', 'Price', 'Stock', ''].map((h) => el('th', {}, h)))), tbody)));
      sections.push(table); continue;
    }
    if (line.includes('|') && tbody) {
      const [name, priceCell = '', stock = '', note = ''] = line.split('|').map((x) => x.trim());
      const m = priceCell.match(/^(.*?)\s*\(usually (.*)\)$/);
      const now = parsePrice(m ? m[1] : priceCell), usual = m ? parsePrice(m[2]) : now;
      const dir = now > usual * 1.08 ? 'up' : now < usual * 0.92 ? 'down' : '';
      tbody.append(el('tr', { class: /out of stock/.test(stock) ? 'oos' : '', 'data-name': name.toLowerCase() },
        el('td', {}, name), el('td', { class: `price ${dir}` }, m ? m[1] : priceCell, m ? el('s', { class: 'usual' }, m[2]) : null),
        el('td', { class: 'qty' }, stock), el('td', {}, note ? el('span', { class: `note-pill ${NOTE_CLASS[note.split(' ')[0]] || (/Cursed/.test(note) ? 'bad' : '')}` }, note) : null)));
      continue;
    }
    sections.push(el('p', { class: 'stock-note muted' }, line));
  }
  const [, attitude, dc, buy] = head.match(/Attitude: (.*?) · Haggle DC (\d+) · Buys at (\d+)%/) || [];
  const filter = el('input', { type: 'search', placeholder: 'Find an item…', 'aria-label': 'Find an item' });
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    for (const tr of box.querySelectorAll('tbody tr')) tr.hidden = q && !tr.dataset.name.includes(q);
    for (const sec of box.querySelectorAll('.stock-sec')) sec.hidden = ![...sec.querySelectorAll('tbody tr')].some((tr) => !tr.hidden);
  });
  // Haggling: roll Persuasion (or Deception) against the shopkeeper's DC.
  const roll = el('input', { type: 'number', min: '1', max: '40', placeholder: 'Roll', 'aria-label': 'Persuasion roll', class: 'num-in' });
  const haggleOut = el('span', { class: 'helper-out' });
  roll.addEventListener('input', () => {
    const v = +roll.value, d = +dc;
    if (!v || !d) { haggleOut.textContent = ''; return; }
    if (v >= d + 10) haggleOut.textContent = '30% off. They’re charmed, or cornered.';
    else if (v >= d + 5) haggleOut.textContent = '20% off.';
    else if (v >= d) haggleOut.textContent = '10% off.';
    else if (v <= d - 5) haggleOut.textContent = 'Insulted: prices go up 10%, or they refuse to deal today.';
    else haggleOut.textContent = 'No deal. The price stands.';
  });
  const value = el('input', { type: 'text', placeholder: 'Item’s value, e.g. 50 gp', 'aria-label': 'Value of an item to sell', class: 'val-in' });
  const sellOut = el('span', { class: 'helper-out' });
  value.addEventListener('input', () => { const v = parsePrice(value.value) || parseFloat(value.value); sellOut.textContent = v ? `They offer ${fmtPrice(v * (+buy || 50) / 100)}.` : ''; });
  setKids(box,
    head ? el('div', { class: 'shop-meta' }, el('span', {}, el('strong', {}, 'Shopkeeper: '), attitude), el('span', {}, el('strong', {}, 'Haggle DC '), dc), el('span', {}, el('strong', {}, 'Buys loot at '), `${buy}% of value`)) : null,
    el('div', { class: 'shop-helpers' },
      dc ? el('label', { class: 'helper' }, 'Haggle (Persuasion): ', roll, haggleOut) : null,
      buy ? el('label', { class: 'helper' }, 'Sell something: ', value, sellOut) : null,
      filter),
    sections);
  return box;
}
