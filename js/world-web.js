// The relationship web: every entry as a node, every connection as a line.
// Routes: #world/web · #world/web/<entryId> (focus on one entry and its neighborhood)
import { el, setKids } from './dom.js';
import { KINDS, KIND_ORDER } from './world-schema.js';
import { worldEntries, getEntry, link, kindLabel, mentions, notice } from './world-store.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const DEFAULT_KINDS = new Set(['region', 'settlement', 'location', 'faction', 'guild', 'clan', 'npc', 'character', 'deity', 'item', 'quest']);
let shownKinds = new Set(DEFAULT_KINDS);
let useMentions = false, useParents = true;
const MAX_NODES = 250;
let truncated = 0;

function buildGraph(focusId, depth) {
  truncated = 0;
  const all = worldEntries().filter((e) => shownKinds.has(e.kind) || e.id === focusId);
  const ids = new Set(all.map((e) => e.id));
  const edges = [];
  const seen = new Set();
  const add = (a, b, label, type) => {
    if (a === b || !ids.has(a) || !ids.has(b)) return;
    const key = `${a}|${b}|${label}`; if (seen.has(key)) return; seen.add(key);
    edges.push({ a, b, label, type });
  };
  for (const e of all) {
    for (const l of e.links || []) add(e.id, l.id, l.label, l.secret ? 'secret' : 'link');
    if (useParents && e.parent_id) add(e.id, e.parent_id, 'in', 'parent');
    if (useMentions) for (const m of mentions(`${e.body}\n${e.summary}`)) add(e.id, m, 'mentions', 'mention');
  }
  let keep = ids;
  if (focusId && ids.has(focusId)) {
    keep = new Set([focusId]);
    for (let i = 0; i < depth; i++) for (const ed of edges) { if (keep.has(ed.a)) keep.add(ed.b); else if (keep.has(ed.b)) keep.add(ed.a); }
  } else {
    // Without a focus, leave out entries with no connections at all; they'd just float.
    // Big worlds show their most connected entries, so the picture stays readable and quick to lay out.
    const deg = new Map();
    for (const ed of edges) { deg.set(ed.a, (deg.get(ed.a) || 0) + 1); deg.set(ed.b, (deg.get(ed.b) || 0) + 1); }
    const linked = [...ids].filter((id) => deg.has(id));
    keep = new Set(linked.length > MAX_NODES ? linked.sort((a, b) => deg.get(b) - deg.get(a)).slice(0, MAX_NODES) : linked);
    truncated = linked.length > MAX_NODES ? linked.length : 0;
  }
  const nodes = all.filter((e) => keep.has(e.id)).map((e) => ({ id: e.id, e, x: 0, y: 0, vx: 0, vy: 0, deg: 0 }));
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const es = edges.filter((ed) => idx.has(ed.a) && idx.has(ed.b)).map((ed) => ({ ...ed, s: nodes[idx.get(ed.a)], t: nodes[idx.get(ed.b)] }));
  for (const ed of es) { ed.s.deg++; ed.t.deg++; }
  // Seed positions on a spiral so the layout settles quickly and the same way each time.
  nodes.forEach((n, i) => { const a = i * 2.399963, r = 30 * Math.sqrt(i + 1); n.x = Math.cos(a) * r; n.y = Math.sin(a) * r; });
  if (focusId && idx.has(focusId)) { const f = nodes[idx.get(focusId)]; f.x = 0; f.y = 0; f.fixed = true; }
  return { nodes, edges: es };
}

function simulate(g, steps) {
  const { nodes, edges } = g;
  const n = nodes.length; if (!n) return;
  for (let s = 0; s < steps; s++) {
    const alpha = 1 - s / steps;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = nodes[i], b = nodes[j];
      let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy || 0.01;
      if (d2 > 250000) continue;
      const f = (1800 / d2) * alpha, d = Math.sqrt(d2);
      dx /= d; dy /= d;
      a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
    }
    for (const e of edges) {
      const dx = e.t.x - e.s.x, dy = e.t.y - e.s.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 110) * 0.02 * alpha;
      e.s.vx += (dx / d) * f; e.s.vy += (dy / d) * f; e.t.vx -= (dx / d) * f; e.t.vy -= (dy / d) * f;
    }
    for (const p of nodes) {
      p.vx -= p.x * 0.004 * alpha; p.vy -= p.y * 0.004 * alpha;
      if (!p.fixed) { p.x += Math.max(-20, Math.min(20, p.vx)); p.y += Math.max(-20, Math.min(20, p.vy)); }
      p.vx *= 0.6; p.vy *= 0.6;
    }
  }
}

export function viewWeb(focusId) {
  const focus = focusId && getEntry(focusId);
  let depth = 2;
  const info = el('aside', { class: 'web-info card' }, el('p', { class: 'muted' }, 'Click a name to see how it connects. Drag to move things around; scroll or pinch to zoom.'));
  const svg = svgEl('svg', { class: 'web-svg', role: 'img', 'aria-label': 'Relationship web' });
  const wrap = el('div', { class: 'web-wrap' }, svg, info);
  const legend = el('div', { class: 'web-legend' });
  const counts = el('p', { class: 'muted small' });
  let g, vb = { x: -500, y: -350, w: 1000, h: 700 }, selected = null;

  const setVB = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  function fitView() {
    if (!g.nodes.length) return;
    const xs = g.nodes.map((n) => n.x), ys = g.nodes.map((n) => n.y);
    const pad = 80, minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
    const r = svg.getBoundingClientRect(), aspect = (r.width || 1000) / (r.height || 700);
    let w = Math.max(700, maxX - minX), h = Math.max(450, maxY - minY);
    if (w / h > aspect) h = w / aspect; else w = h * aspect;
    vb = { x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - h / 2, w, h }; setVB();
  }

  function select(node) {
    selected = node;
    const nbr = new Set(); if (node) { nbr.add(node.id); for (const e of g.edges) { if (e.s === node) nbr.add(e.t.id); if (e.t === node) nbr.add(e.s.id); } }
    for (const c of svg.querySelectorAll('.node')) c.classList.toggle('dim', Boolean(node) && !nbr.has(c.dataset.id));
    for (const c of svg.querySelectorAll('.edge')) c.classList.toggle('dim', Boolean(node) && !(c.dataset.a === node.id || c.dataset.b === node.id));
    for (const c of svg.querySelectorAll('.node')) c.classList.toggle('sel', node && c.dataset.id === node.id);
    if (!node) { setKids(info, el('p', { class: 'muted' }, 'Click a name to see how it connects.')); return; }
    const e = node.e;
    const rels = g.edges.filter((x) => x.s === node || x.t === node).map((x) => (x.s === node ? [`${x.label} →`, x.t.e] : [x.type === 'parent' ? 'contains' : `← ${x.label}`, x.s.e]));
    setKids(info, el('div', { class: 'eyebrow' }, kindLabel(e.kind)), el('h3', {}, link(e)), e.summary ? el('p', { class: 'muted small' }, e.summary) : null,
      el('ul', { class: 'links' }, rels.map(([l, t]) => el('li', {}, el('span', { class: 'rel' }, l), ' ', el('a', { href: '#', onclick: (ev) => { ev.preventDefault(); select(g.nodes.find((n) => n.id === t.id)); } }, t.name)))),
      el('div', { class: 'btnrow' }, el('a', { class: 'btn small', href: `#world/e/${e.id}` }, 'Open entry'), el('a', { class: 'btn small ghost', href: `#world/web/${e.id}` }, 'Focus here')));
  }

  function draw() {
    setKids(svg);
    const edgeLayer = svgEl('g'), nodeLayer = svgEl('g');
    for (const e of g.edges) {
      const line = svgEl('line', { class: `edge ${e.type}`, 'data-a': e.s.id, 'data-b': e.t.id, x1: e.s.x, y1: e.s.y, x2: e.t.x, y2: e.t.y });
      line.append(Object.assign(svgEl('title'), { textContent: `${e.s.e.name} — ${e.label} — ${e.t.e.name}` }));
      edgeLayer.append(line); e.line = line;
    }
    for (const n of g.nodes) {
      const r = 6 + Math.min(10, Math.sqrt(n.deg) * 2.2);
      const grp = svgEl('g', { class: `node k-${n.e.kind}`, 'data-id': n.id, transform: `translate(${n.x},${n.y})`, tabindex: '0', role: 'button', 'aria-label': `${n.e.name}, ${kindLabel(n.e.kind)}` });
      grp.append(svgEl('circle', { r }), Object.assign(svgEl('text', { y: r + 13, 'text-anchor': 'middle' }), { textContent: n.e.name.length > 26 ? `${n.e.name.slice(0, 24)}…` : n.e.name }));
      grp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') select(n); });
      nodeLayer.append(grp); n.el = grp;
    }
    svg.append(edgeLayer, nodeLayer);
    counts.textContent = `${g.nodes.length} entries, ${g.edges.length} connections${focus ? ` around ${focus.name}` : ''}.${truncated ? ` Showing the ${MAX_NODES} most connected of ${truncated}; open any entry’s web to see its own neighborhood.` : ''}`;
    if (!g.nodes.length) svg.append(Object.assign(svgEl('text', { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2, 'text-anchor': 'middle', class: 'empty-msg' }), { textContent: 'Nothing connected yet. Add connections on entries to see the web.' }));
  }
  const move = (n) => { n.el.setAttribute('transform', `translate(${n.x},${n.y})`); for (const e of g.edges) if (e.s === n || e.t === n) { e.line.setAttribute('x1', e.s.x); e.line.setAttribute('y1', e.s.y); e.line.setAttribute('x2', e.t.x); e.line.setAttribute('y2', e.t.y); } };

  function rebuild() {
    g = buildGraph(focus?.id, depth);
    simulate(g, Math.min(400, 120 + g.nodes.length * 2));
    draw(); requestAnimationFrame(fitView);
    if (focus) select(g.nodes.find((n) => n.id === focus.id)); else select(null);
  }

  // Pointer: drag nodes, pan the background, pinch or wheel to zoom.
  const toWorld = (ev) => { const r = svg.getBoundingClientRect(); return { x: vb.x + ((ev.clientX - r.left) / r.width) * vb.w, y: vb.y + ((ev.clientY - r.top) / r.height) * vb.h }; };
  let drag = null;
  svg.addEventListener('pointerdown', (ev) => {
    const nodeEl = ev.target.closest('.node');
    svg.setPointerCapture(ev.pointerId);
    drag = nodeEl ? { node: g.nodes.find((n) => n.id === nodeEl.dataset.id), moved: false, start: toWorld(ev) } : { pan: true, x: ev.clientX, y: ev.clientY, vb: { ...vb }, moved: false };
  });
  svg.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    if (drag.node) { const p = toWorld(ev); if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 3) drag.moved = true; drag.node.x = p.x; drag.node.y = p.y; move(drag.node); return; }
    const r = svg.getBoundingClientRect();
    const dx = ((ev.clientX - drag.x) / r.width) * drag.vb.w, dy = ((ev.clientY - drag.y) / r.height) * drag.vb.h;
    if (Math.abs(dx) + Math.abs(dy) > 1) drag.moved = true;
    vb.x = drag.vb.x - dx; vb.y = drag.vb.y - dy; setVB();
  });
  svg.addEventListener('pointerup', () => { if (drag && !drag.moved) select(drag.node || null); drag = null; });
  svg.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const p = toWorld(ev), f = ev.deltaY < 0 ? 0.87 : 1.15;
    vb = { x: p.x - (p.x - vb.x) * f, y: p.y - (p.y - vb.y) * f, w: vb.w * f, h: vb.h * f }; setVB();
  }, { passive: false });

  for (const k of KIND_ORDER) {
    const box = el('input', { type: 'checkbox', checked: shownKinds.has(k) || null });
    box.addEventListener('change', () => { if (box.checked) shownKinds.add(k); else shownKinds.delete(k); rebuild(); });
    legend.append(el('label', { class: `legend-item k-${k}` }, box, el('span', { class: 'swatch' }), KINDS[k].plural));
  }
  const opt = (label, get, set) => { const b = el('input', { type: 'checkbox', checked: get() || null }); b.addEventListener('change', () => { set(b.checked); rebuild(); }); return el('label', { class: 'check' }, b, ` ${label}`); };
  const depthSel = el('select', { 'aria-label': 'How far out' }, [1, 2, 3].map((n) => el('option', { value: n }, `${n} step${n > 1 ? 's' : ''} out`)));
  depthSel.value = '2'; depthSel.addEventListener('change', () => { depth = +depthSel.value; rebuild(); });

  const node = el('div', { class: 'w-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, focus ? `${focus.name}’s web` : 'Relationship web'),
      el('p', {}, focus ? 'Everything connected to this entry. Click any name to see its connections.' : 'Who is allied with whom, who serves whom, and what sits where. Lines come from each entry’s connections.')),
      el('div', { class: 'btnrow' }, focus ? depthSel : null, focus ? el('a', { class: 'btn small', href: '#world/web' }, 'Whole world') : null, el('button', { class: 'btn small', type: 'button', onclick: () => fitView() }, 'Fit'))),
    el('div', { class: 'controls web-opts' }, opt('“Located in” lines', () => useParents, (v) => { useParents = v; }), opt('[[Mentions]] in text', () => useMentions, (v) => { useMentions = v; })),
    legend, wrap, counts);
  if (!worldEntries().length) return notice('The web is empty', 'Add entries and connect them, and they’ll appear here.');
  requestAnimationFrame(rebuild);
  return node;
}
