// The party's orders on the party page: marching order (front to back) and the night's watches, which GMs set and
// everyone sees. Stored with session prep (api/settings.js); the world's info carries what this person can see.
import { el, toast, copyText } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, getEntry, link } from './world-store.js';
import { cleanOrder, watchShifts, hhmm, ordersText, cleanWatchTime } from './party-order.js';
import { isHired } from './hirelings.js';

// Who can march and keep watch: active characters, and the NPCs hired to travel with the party.
const ACTIVE = (c) => (c.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status)) || isHired(c);
export const partyOrder = () => { const o = world.info?.party_order || {}, t = cleanWatchTime(o.watch_start, o.watch_hours);
  return { march: cleanOrder(o.march), watch: cleanOrder(o.watch), start: t.start, hours: t.hours }; };
// The night's watches, by the watch order and the watch's hours.
export const nightShifts = () => { const o = partyOrder(); return watchShifts(o.watch, o.start, o.hours); };

async function saveOrder(key, ids, rerender, more = {}) {
  try {
    const r = await api('settings', { method: 'PATCH', body: { prep: { [key]: ids, ...more } } });
    const o = world.info?.party_order || {};
    world.info = { ...world.info, party_order: { ...o, [key]: cleanOrder(r.prep?.[key]), ...(r.prep?.watch_start !== undefined ? { watch_start: r.prep.watch_start, watch_hours: r.prep.watch_hours } : {}) } };
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
    el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: x.on || null, onchange: (ev) => { x.on = ev.target.checked; } }), ` ${x.c.name}`, x.c.kind === 'npc' ? el('span', { class: 'muted small' }, ' (hired)') : null),
    el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move ${x.c.name} up`, disabled: i === 0 || null, onclick: () => { [order[i - 1], order[i]] = [order[i], order[i - 1]]; draw(); } }, '↑'),
    el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move ${x.c.name} down`, disabled: i === order.length - 1 || null, onclick: () => { [order[i + 1], order[i]] = [order[i], order[i + 1]]; draw(); } }, '↓'))));
  draw();
  // The watch's hours: when it starts and how long it lasts.
  const o = partyOrder(), hh = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const start = key === 'watch' ? el('input', { type: 'time', id: 'watch-start', value: hh(o.start), 'aria-label': 'The watch starts at' }) : null;
  const hours = key === 'watch' ? el('select', { id: 'watch-hours', 'aria-label': 'Hours of watch' }, Array.from({ length: 12 }, (_, i) => el('option', { value: i + 1, selected: i + 1 === o.hours || null }, `${i + 1} h`))) : null;
  const more = () => { if (key !== 'watch') return {}; const [h, m] = String(start.value || '22:00').split(':').map(Number); return { watch_start: (h || 0) * 60 + (m || 0), watch_hours: Number(hours.value) }; };
  return el('details', { class: `order-editor order-${key}` }, el('summary', { class: 'small' }, 'Change'), box,
    key === 'watch' ? el('div', { class: 'controls small watch-time' }, el('label', { for: 'watch-start' }, 'From'), start, el('label', { for: 'watch-hours' }, 'for'), hours) : null,
    el('button', { class: 'btn small primary', type: 'button', onclick: () => saveOrder(key, order.filter((x) => x.on).map((x) => x.c.id), rerender, more()) }, 'Save'));
}

export function ordersCard(rerender) {
  const { march, watch } = partyOrder();
  if (!march.length && !watch.length && !isGm()) return null;
  const shifts = nightShifts(), o = partyOrder();
  const text = ordersText(march, watch, (id) => getEntry(id)?.name || '', o.start, o.hours);
  return el('section', { class: 'card party-orders' }, el('div', { class: 'entry-head' }, el('h3', {}, 'Marching and watches'),
    text ? el('button', { class: 'btn small ghost orders-copy', type: 'button', onclick: () => copyText(text) }, 'Copy as text') : null),
    el('div', { class: 'order-march' }, el('strong', { class: 'small' }, '🥾 Marching order: '),
      march.length ? march.map((id, i) => [i ? ' → ' : '', link(getEntry(id))]) : el('span', { class: 'muted small' }, 'not set'), march.length ? el('span', { class: 'muted small' }, ' (front to back)') : null,
      isGm() ? editor('march', march, rerender) : null),
    el('div', { class: 'order-watch' }, el('strong', { class: 'small' }, '🌙 Night watches: '),
      shifts.length ? el('ul', { class: 'plain small watch-list' }, shifts.map((s) => el('li', {}, `${hhmm(s.from)}–${hhmm(s.to)}: `, link(getEntry(s.id))))) : el('span', { class: 'muted small' }, 'not set'),
      isGm() ? editor('watch', watch, rerender) : null));
}
