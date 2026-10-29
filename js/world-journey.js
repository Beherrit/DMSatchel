// Where the party has been: the journey list on the party page, and keeping it current when GMs move the party.
import { el, toast, confirmButton, setKids } from './dom.js';
import { api, isGm, session } from './api.js';
import { world, getEntry, link, when, trail } from './world-store.js';
import { worldCalendar } from './world-calendar.js';
import { formatDate, today } from './calendar.js';
import { addStop, removeStop } from './journey.js';

export const journey = () => (Array.isArray(world.info?.journey) ? world.info.journey : []);

// The place, then each place above it (to find a pin for it on a map).
export const chainOf = (id) => { const e = getEntry(id); return e ? [e.id, ...trail(e).reverse().map((p) => p.id)] : [id]; };

// After a GM moves the party: the same stop the server keeps, so the map and party page update without a reload.
export function notePartyMove(id) {
  const cal = worldCalendar();
  world.info = { ...world.info, journey: addStop(journey(), { id, at: new Date().toISOString(), day: cal ? formatDate(cal, today(cal)) : '', by: session.gm?.name }) };
}

export function journeySection() {
  const box = el('section', { class: 'journey' });
  const draw = () => {
    const stops = journey().filter((s) => getEntry(s.id)).slice().reverse();
    const item = (s, i) => el('li', {}, el('span', { class: 'jn-place' }, link(getEntry(s.id))), i === 0 ? el('span', { class: 'tag' }, 'now') : null,
      el('span', { class: 'muted small' }, ` ${[s.day, when(s.at)].filter(Boolean).join(' · ')}`),
      isGm() ? confirmButton('Strike', async () => {
        try { await api('settings', { method: 'PATCH', body: { journey_remove: s.at } }); world.info = { ...world.info, journey: removeStop(journey(), s.at) }; draw(); }
        catch (err) { toast(err.message, 'bad'); }
      }) : null);
    setKids(box, el('h3', { class: 'section-title' }, 'The journey'),
      stops.length ? el('ol', { class: 'plain journey-list', reversed: true }, stops.slice(0, 10).map(item)) : el('p', { class: 'muted' }, isGm() ? 'Set where the party is (in session prep, or “The party is here” on a map pin) and each move is kept here.' : 'Where the party goes shows here as the GMs move them.'),
      stops.length > 10 ? el('details', {}, el('summary', {}, `Earlier stops (${stops.length - 10})`), el('ol', { class: 'plain journey-list', reversed: true, start: stops.length - 10 }, stops.slice(10).map((s, i) => item(s, i + 10)))) : null,
      stops.length > 1 ? el('p', { class: 'muted small' }, 'Maps draw the route so far.') : null);
  };
  draw();
  return box;
}
