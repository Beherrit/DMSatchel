// The treasury over time: a small step chart of the party's coin after each change in the loot log, on the party
// page. Hover (or arrow keys) reads out any point; "As a table" lists them all.
import { el, setKids } from './dom.js';
import { whenTime, when } from './world-store.js';
import { coinText } from './economy.js';
import { balanceSeries, coinTicks } from './treasury-series.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const short = (cp) => (Math.abs(cp) >= 100 ? `${Math.round(cp / 100).toLocaleString('en-US')} gp` : coinText(cp));

export function coinChart(lines) {
  const pts = balanceSeries(lines);
  if (pts.length < 2) return null;
  const now = pts.at(-1).cp;
  const plot = el('div', { class: 'coin-plot' });
  const tip = el('div', { class: 'coin-tip', role: 'status', hidden: true });
  const wrap = el('div', { class: 'coin-chart-wrap' }, plot, tip);
  let at = null;

  function draw() {
    const W = Math.max(260, plot.clientWidth || 520), H = 150, L = 52, R = 64, T = 10, B = 22;
    const ticks = coinTicks(Math.min(...pts.map((p) => p.cp)), Math.max(...pts.map((p) => p.cp)));
    const lo = ticks[0], hi = ticks.at(-1);
    const x = (i) => L + (i / (pts.length - 1)) * (W - L - R), y = (v) => T + (1 - (v - lo) / (hi - lo || 1)) * (H - T - B);
    const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'coin-svg', tabindex: 0, role: 'img',
      'aria-label': `The party's coin over ${pts.length} changes, from ${short(pts[0].cp)} to ${short(now)}. Use the arrow keys to read each change.` });
    for (const t of ticks) {
      svg.append(svgEl('line', { x1: L, x2: W - R, y1: y(t), y2: y(t), class: t === 0 ? 'coin-base' : 'coin-grid' }));
      const lab = svgEl('text', { x: L - 6, y: y(t) + 4, 'text-anchor': 'end', class: 'coin-axis' }); lab.textContent = short(t); svg.append(lab);
    }
    // Step after: the balance holds until the next change.
    let d = `M${x(0)},${y(pts[0].cp)}`;
    for (let i = 1; i < pts.length; i++) d += `H${x(i)}V${y(pts[i].cp)}`;
    const base = y(Math.max(lo, Math.min(0, hi)));
    svg.append(svgEl('path', { d: `${d}V${base}H${x(0)}Z`, class: 'coin-area' }), svgEl('path', { d, class: 'coin-line' }));
    svg.append(svgEl('circle', { cx: x(pts.length - 1), cy: y(now), r: 4, class: 'coin-dot' }));
    const end = svgEl('text', { x: x(pts.length - 1) + 8, y: y(now) + 4, class: 'coin-end' }); end.textContent = short(now); svg.append(end);
    for (const [i, anchor] of [[0, 'start'], [pts.length - 1, 'end']]) { const t = svgEl('text', { x: x(i), y: H - 6, 'text-anchor': anchor, class: 'coin-axis' }); t.textContent = when(pts[i].at); svg.append(t); }
    const hair = svgEl('line', { y1: T, y2: H - B, class: 'coin-hair', visibility: 'hidden' }), mark = svgEl('circle', { r: 4, class: 'coin-dot', visibility: 'hidden' });
    svg.append(hair, mark);
    const show = (i) => {
      at = Math.max(0, Math.min(pts.length - 1, i));
      const p = pts[at];
      for (const [k, v] of [['x1', x(at)], ['x2', x(at)]]) hair.setAttribute(k, v);
      mark.setAttribute('cx', x(at)); mark.setAttribute('cy', y(p.cp));
      hair.setAttribute('visibility', 'visible'); mark.setAttribute('visibility', 'visible');
      setKids(tip, el('strong', {}, coinText(p.cp)), el('span', {}, `${p.change > 0 ? '+' : '−'}${coinText(Math.abs(p.change))}${p.note ? ` · ${p.note}` : ''}`), el('span', { class: 'muted' }, whenTime(p.at)));
      tip.hidden = false;
      tip.style.left = `${Math.min(Math.max(0, x(at) - 90), W - 190)}px`;
    };
    const hide = () => { hair.setAttribute('visibility', 'hidden'); mark.setAttribute('visibility', 'hidden'); tip.hidden = true; };
    svg.addEventListener('pointermove', (ev) => { const r = svg.getBoundingClientRect(); show(Math.round(((ev.clientX - r.left - L) / (W - L - R)) * (pts.length - 1))); });
    svg.addEventListener('pointerleave', hide);
    svg.addEventListener('blur', hide);
    svg.addEventListener('keydown', (ev) => {
      const k = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[ev.key];
      if (k === undefined) return;
      ev.preventDefault();
      show(k === -Infinity ? 0 : k === Infinity ? pts.length - 1 : (at ?? pts.length - 1) + (at === null ? 0 : k));
    });
    setKids(plot, svg);
  }
  requestAnimationFrame(draw);
  if (typeof ResizeObserver === 'function') { let w = 0; new ResizeObserver(() => { if (plot.clientWidth !== w) { w = plot.clientWidth; draw(); } }).observe(plot); }

  return el('div', { class: 'coin-chart' },
    el('span', { class: 'eyebrow' }, 'Coin over time'),
    wrap,
    el('details', { class: 'small' }, el('summary', {}, 'As a table'),
      el('div', { class: 'table-wrap' }, el('table', { class: 'coin-table' },
        el('thead', {}, el('tr', {}, el('th', {}, 'When'), el('th', {}, 'Change'), el('th', {}, 'Coin after'), el('th', {}, 'Note'))),
        el('tbody', {}, [...pts].reverse().map((p) => el('tr', {}, el('td', { class: 'nowrap' }, when(p.at)), el('td', { class: 'num' }, `${p.change > 0 ? '+' : '−'}${coinText(Math.abs(p.change))}`), el('td', { class: 'num' }, coinText(p.cp)), el('td', {}, p.note))))))));
}
