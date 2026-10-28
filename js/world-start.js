// Start here: the handful of entries GMs want newcomers to read first (the home town, the patron, the big threat).
// They show on the world's front page (open for anyone new, folded for everyone else) and on the session zero page.
// GMs add or remove an entry from its page and reorder the list on the front page.
import { el, toast } from './dom.js';
import { api, isGm, isMember } from './api.js';
import { world, getEntry, link, kindLabel } from './world-store.js';

const ids = () => (Array.isArray(world.info?.start_here) ? world.info.start_here : []);
async function send(body, msg) {
  try { const r = await api('settings', { method: 'PATCH', body: { start_here: body } }); world.info = { ...world.info, start_here: r.start_here }; toast(msg); window.dispatchEvent(new Event('world:rerender')); }
  catch (err) { toast(err.message, 'bad'); }
}

export function startHereButton(e) {
  if (!isGm() || e.status === 'suggested') return null;
  const on = ids().includes(e.id);
  return el('button', { class: 'btn small', type: 'button', 'aria-pressed': String(on), title: 'Entries newcomers should read first, on the front page and the session zero page',
    onclick: () => send({ id: e.id, on: !on }, on ? `${e.name} taken off Start here` : `${e.name} added to Start here`) }, on ? '✓ In “Start here”' : '+ Start here');
}

// The list itself; `fresh` opens it (someone new to the world).
export function startHereCard({ fresh = false } = {}) {
  const list = ids().map(getEntry).filter(Boolean);
  if (!list.length || !isMember()) return null;
  const move = (i, by) => { const order = list.map((e) => e.id); [order[i], order[i + by]] = [order[i + by], order[i]]; send({ order }, 'Order saved'); };
  const items = el('ol', { class: 'start-list' }, list.map((e, i) => el('li', {},
    isGm() ? el('span', { class: 'btnrow' },
      el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move ${e.name} up`, disabled: i === 0 || null, onclick: () => move(i, -1) }, '↑'),
      el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move ${e.name} down`, disabled: i === list.length - 1 || null, onclick: () => move(i, 1) }, '↓')) : null,
    el('div', {}, link(e), el('span', { class: 'kind-tag' }, kindLabel(e.kind)), e.summary ? el('p', { class: 'small' }, e.summary.length > 160 ? `${e.summary.slice(0, 158)}…` : e.summary) : null))));
  return el('details', { class: 'card start-here', open: fresh || null },
    el('summary', {}, el('strong', {}, `Start here (${list.length})`), el('span', { class: 'muted small' }, ' · what to read first if you’re new')),
    items);
}
