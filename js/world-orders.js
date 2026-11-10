// The party's orders on the party page: marching order (front to back) and the night's watches, which GMs set and
// everyone sees. Stored with session prep (api/settings.js); the world's info carries what this person can see.
import { el, toast, copyText } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, getEntry, link } from './world-store.js';
import { cleanOrder, watchShifts, hhmm, ordersText } from './party-order.js';

const ACTIVE = (c) => c.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status);
export const partyOrder = () => ({ march: cleanOrder(world.info?.party_order?.march), watch: cleanOrder(world.info?.party_order?.watch) });

async function saveOrder(key, ids, rerender) {
  try {
    const r = await api('settings', { method: 'PATCH', body: { prep: { [key]: ids } } });
    world.info = { ...world.info, party_order: { ...partyOrder(), [key]: cleanOrder(r.prep?.[key]) } };
    toast(key === 'march' ? 'Marching order saved' : 'Watch order saved'); rerender();
  } catch (err) { toast(err.message, 'bad'); }
}

// A GM's editor for one order: every active character, ticked if in it, with arrows to move them up and down.
function editor(key, ids, rerender) {
  const chars = worldEntries().filter(ACTIVE);
  const list = [...ids.map(getEntry).filter(Boolean), ...chars.filter((c) => !ids.includes(c.id)).sort((a, b) => a.name.localeCompare(b.name))];
  const order = list.map((c) => ({ c, on: ids.includes(c.id) }));
  const box = el('ol', { class: 'plain order-edit' });
  const draw = () => box.replaceChildren(...order.map((x, i) => el('li', {},
    el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: x.on || null, onchange: (ev) => { x.on = ev.target.checked; } }), ` ${x.c.name}`),
    el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move ${x.c.name} up`, disabled: i === 0 || null, onclick: () => { [order[i - 1], order[i]] = [order[i], order[i - 1]]; draw(); } }, '↑'),
    el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move ${x.c.name} down`, disabled: i === order.length - 1 || null, onclick: () => { [order[i + 1], order[i]] = [order[i], order[i + 1]]; draw(); } }, '↓'))));
  draw();
  return el('details', { class: `order-editor order-${key}` }, el('summary', { class: 'small' }, 'Change'), box,
    el('button', { class: 'btn small primary', type: 'button', onclick: () => saveOrder(key, order.filter((x) => x.on).map((x) => x.c.id), rerender) }, 'Save'));
}

export function ordersCard(rerender) {
  const { march, watch } = partyOrder();
  if (!march.length && !watch.length && !isGm()) return null;
  const shifts = watchShifts(watch);
  const text = ordersText(march, watch, (id) => getEntry(id)?.name || '');
  return el('section', { class: 'card party-orders' }, el('div', { class: 'entry-head' }, el('h3', {}, 'Marching and watches'),
    text ? el('button', { class: 'btn small ghost orders-copy', type: 'button', onclick: () => copyText(text) }, 'Copy as text') : null),
    el('div', { class: 'order-march' }, el('strong', { class: 'small' }, '🥾 Marching order: '),
      march.length ? march.map((id, i) => [i ? ' → ' : '', link(getEntry(id))]) : el('span', { class: 'muted small' }, 'not set'), march.length ? el('span', { class: 'muted small' }, ' (front to back)') : null,
      isGm() ? editor('march', march, rerender) : null),
    el('div', { class: 'order-watch' }, el('strong', { class: 'small' }, '🌙 Night watches: '),
      shifts.length ? el('ul', { class: 'plain small watch-list' }, shifts.map((s) => el('li', {}, `${hhmm(s.from)}–${hhmm(s.to)}: `, link(getEntry(s.id))))) : el('span', { class: 'muted small' }, 'not set'),
      isGm() ? editor('watch', watch, rerender) : null));
}
