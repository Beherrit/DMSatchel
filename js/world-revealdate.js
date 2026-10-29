// Reveal on a date (GMs): under a hidden entry's title, pick a day for it to reveal itself to players, or cancel one.
import { el, toast } from './dom.js';
import { api, isGm, previewing } from './api.js';
import { world } from './world-store.js';
import { startOfLocalDay } from './reveal-date.js';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function setReveal(e, at, rerender) {
  try {
    const r = await api('entries', { method: 'PATCH', body: { id: e.id, reveal_at: at } });
    world.entries.set(r.entry.id, r.entry);
    toast(at ? `${e.name} will reveal itself on ${new Date(at).toLocaleDateString(undefined, { dateStyle: 'medium' })}` : 'No longer set to reveal itself');
    rerender();
  } catch (err) { toast(err.message, 'bad'); }
}

export function revealDateLine(e, rerender) {
  if (!isGm() || previewing() || e.visibility !== 'gm' || e.status === 'suggested') return null;
  if (e.reveal_at) {
    return el('p', { class: 'reveal-date small' }, el('span', { 'aria-hidden': 'true' }, '⏳ '),
      'Reveals itself to players on ', el('strong', {}, new Date(e.reveal_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })), '. ',
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => setReveal(e, null, rerender) }, 'Cancel'));
  }
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const day = el('input', { type: 'date', id: 'rv-day', min: ymd(tomorrow), value: ymd(tomorrow) });
  const form = el('form', { class: 'controls' }, el('label', { for: 'rv-day' }, 'Reveal to players on'), day, el('button', { class: 'btn small', type: 'submit' }, 'Set'));
  form.addEventListener('submit', (ev) => { ev.preventDefault(); const at = startOfLocalDay(day.value); if (!at) { day.focus(); return; } setReveal(e, at, rerender); });
  return el('details', { class: 'reveal-date small' }, el('summary', {}, 'Reveal on a date…'),
    el('p', { class: 'muted' }, 'For a letter that arrives or a festival that’s announced: it shows itself to players from the start of that day.'), form);
}
