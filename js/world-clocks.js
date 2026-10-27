// Progress clocks: what a faction (or anyone) is working toward, filled a segment at a time between sessions.
// On entry pages, and gathered on #world/clocks with a "faction turn" button for GMs.
import { el, toast, confirmButton } from './dom.js';
import { api, isGm } from './api.js';
import { world, getEntry, link, kindLabel, notice } from './world-store.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

// A round clock: `size` wedges, `filled` of them shaded.
export function clockFace(size, filled, { r = 26 } = {}) {
  const svg = svgEl('svg', { viewBox: `${-r - 2} ${-r - 2} ${r * 2 + 4} ${r * 2 + 4}`, width: r * 2 + 4, height: r * 2 + 4, class: 'clock-face', role: 'img', 'aria-label': `${filled} of ${size} filled` });
  for (let i = 0; i < size; i++) {
    const a0 = (i / size) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / size) * Math.PI * 2 - Math.PI / 2;
    const p = `M0 0 L${(Math.cos(a0) * r).toFixed(2)} ${(Math.sin(a0) * r).toFixed(2)} A${r} ${r} 0 0 1 ${(Math.cos(a1) * r).toFixed(2)} ${(Math.sin(a1) * r).toFixed(2)} Z`;
    svg.append(svgEl('path', { d: p, class: i < filled ? 'seg on' : 'seg' }));
  }
  return svg;
}

const clocks = () => world.standings?.clocks || [];
export const clocksFor = (id) => clocks().filter((c) => c.entry_id === id);

async function refresh() {
  try { world.standings = await api('standings'); } catch { /* keep what we have */ }
}

async function saveClock(clock, msg) {
  try { await api('standings', { method: 'POST', body: { clock } }); await refresh(); if (msg) toast(msg); window.dispatchEvent(new Event('world:rerender')); }
  catch (err) { toast(err.message, 'bad'); }
}

function clockRow(c, { showEntry = false } = {}) {
  const e = getEntry(c.entry_id);
  const full = c.filled >= c.size;
  return el('li', { class: `clock${full ? ' full' : ''}${c.secret ? ' clock-secret' : ''}` },
    clockFace(c.size, c.filled),
    el('div', { class: 'clock-body' },
      el('strong', {}, c.name), showEntry && e ? el('span', { class: 'muted small' }, ' · ', link(e)) : null,
      el('div', { class: 'muted small' }, `${c.filled} / ${c.size}${c.per_turn ? ` · +${c.per_turn} each faction turn` : ''}${c.secret ? ' · GM only' : ''}`),
      c.note ? el('p', { class: 'small' }, c.note) : null,
      full ? el('p', { class: 'clock-done' }, 'Complete: what happens now?') : null,
      isGm() ? el('div', { class: 'btnrow' },
        el('button', { class: 'btn small', type: 'button', 'aria-label': `Advance ${c.name}`, disabled: full ? true : null, onclick: () => saveClock({ ...c, filled: c.filled + 1 }) }, '+1'),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Wind back ${c.name}`, disabled: c.filled ? null : true, onclick: () => saveClock({ ...c, filled: c.filled - 1 }) }, '−1'),
        confirmButton('Remove', async () => { try { await api('standings', { method: 'DELETE', query: { clock: c.id } }); await refresh(); window.dispatchEvent(new Event('world:rerender')); } catch (err) { toast(err.message, 'bad'); } }, 'btn small ghost')) : null));
}

function addForm(entryId) {
  const name = el('input', { type: 'text', placeholder: 'What they’re working toward, e.g. “Seize the river toll”', 'aria-label': 'Clock name', maxlength: 200 });
  const size = el('select', { 'aria-label': 'Segments' }, [4, 6, 8, 10, 12].map((n) => el('option', { value: n }, `${n} segments`)));
  size.value = '6';
  const per = el('select', { 'aria-label': 'Each faction turn' }, [0, 1, 2].map((n) => el('option', { value: n }, n ? `+${n} each faction turn` : 'Only when you advance it')));
  per.value = '1';
  const secret = el('input', { type: 'checkbox', checked: true });
  const form = el('form', { class: 'controls clock-add' }, name, size, per, el('label', { class: 'check' }, secret, ' GM only'), el('button', { class: 'btn small primary', type: 'submit' }, 'Add clock'));
  form.addEventListener('submit', (ev) => { ev.preventDefault(); if (!name.value.trim()) { name.focus(); return; } saveClock({ entry_id: entryId, name: name.value, size: +size.value, filled: 0, per_turn: +per.value, secret: secret.checked }, 'Clock added'); });
  return form;
}

// The section on an entry page.
export function clocksWidget(e) {
  const list = clocksFor(e.id);
  if (!list.length && !isGm()) return null;
  return el('section', { class: 'card clocks-card' },
    el('div', { class: 'entry-head' }, el('h3', {}, 'Clocks'), el('a', { class: 'small', href: '#world/clocks' }, 'All clocks')),
    list.length ? el('ul', { class: 'clock-list' }, list.map((c) => clockRow(c))) : el('p', { class: 'muted small' }, 'Track a plan in motion: a cult’s ritual, a guild’s takeover, a plague spreading. Fill a segment whenever the party gives them time.'),
    isGm() ? addForm(e.id) : null);
}

export function viewClocks() {
  const list = clocks();
  const byEntry = new Map();
  for (const c of list) { if (!byEntry.has(c.entry_id)) byEntry.set(c.entry_id, []); byEntry.get(c.entry_id).push(c); }
  const groups = [...byEntry.entries()].map(([id, cs]) => [getEntry(id), cs]).filter(([e]) => e).sort(([a], [b]) => a.name.localeCompare(b.name));
  const ticking = list.filter((c) => c.per_turn > 0 && c.filled < c.size).length;
  const turn = async () => {
    try {
      const r = await api('standings', { method: 'POST', body: { turn: true } });
      await refresh();
      const done = r.moved.filter((c) => c.filled >= c.size);
      toast(r.moved.length ? `${r.moved.length} clock${r.moved.length === 1 ? '' : 's'} moved${done.length ? `; finished: ${done.map((c) => c.name).join(', ')}` : ''}` : 'Nothing was ticking');
      window.dispatchEvent(new Event('world:rerender'));
    } catch (err) { toast(err.message, 'bad'); }
  };
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, 'Faction clocks'), el('p', {}, 'Plans in motion across the world. Between sessions, run a faction turn: every clock that ticks moves on, and the finished ones tell you what changed.')),
      isGm() ? el('button', { class: 'btn primary', type: 'button', disabled: ticking ? null : true, onclick: turn }, `Faction turn (${ticking})`) : null),
    groups.length ? el('div', { class: 'clock-groups' }, groups.map(([e, cs]) => el('section', { class: 'card' },
      el('div', { class: 'entry-head' }, el('h3', {}, link(e)), el('span', { class: 'kind-tag' }, kindLabel(e.kind))),
      el('ul', { class: 'clock-list' }, cs.map((c) => clockRow(c))))))
      : notice('No clocks yet', isGm() ? 'Open a faction, guild, villain or town and add a clock: what they want, and how close they are to getting it.' : 'The GMs haven’t shared any clocks.'));
}

