// Notes pinned to the next session: one-off reminders for the GMs ("give Pip the letter"), at the top of session
// prep and on the printable sheet; tick them off as they're done.
import { el, toast, setKids } from './dom.js';
import { api } from './api.js';
import { readReminders, openReminders } from './reminders.js';

export function remindersCard(prep) {
  let list = readReminders(prep.reminders);
  const box = el('section', { class: 'card prep-card reminders' });
  const send = async (op) => {
    try { list = (await api('settings', { method: 'PATCH', body: { reminder: op } })).reminders; prep.reminders = list; draw(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const input = el('input', { type: 'text', maxlength: 300, placeholder: 'e.g. Give Pip the letter from the bishop', 'aria-label': 'New note for the next session' });
  const form = el('form', { class: 'ck-add controls' }, input, el('button', { class: 'btn small', type: 'submit' }, 'Pin it'));
  form.addEventListener('submit', (ev) => { ev.preventDefault(); if (!input.value.trim()) { input.focus(); return; } send({ add: input.value }).then(() => { input.value = ''; input.focus(); }); });
  function draw() {
    const done = list.filter((r) => r.done).length;
    setKids(box, el('h3', {}, '📌 For next session'),
      list.length ? el('ul', { class: 'plain ck-list' }, list.map((r) => {
        const cb = el('input', { type: 'checkbox', id: `rm-${r.id}`, checked: r.done || null });
        cb.addEventListener('change', () => send({ done: r.id, on: cb.checked }));
        return el('li', { class: r.done ? 'done' : '' }, cb, el('label', { for: `rm-${r.id}` }, r.text),
          el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove note: ${r.text}`, onclick: () => send({ remove: r.id }) }, '✕'));
      })) : el('p', { class: 'muted small' }, 'Things to remember at the table: a promise to a player, a clue to drop, a rule to check.'),
      form,
      done ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => send({ clear_done: true }) }, `Clear ${done} done`) : null);
  }
  draw();
  return box;
}

// For the printable sheet: what's still to do.
export const remindersPrint = (prep) => openReminders(prep.reminders).map((r) => el('li', {}, `☐ ${r.text}`));
