// Session prep's checklist: the GMs' own steps before each session, ticked off for this session and cleared when
// the next one is logged.
import { el, toast, setKids } from './dom.js';
import { api } from './api.js';
import { readChecklist } from './checklist.js';

export function checklistCard(prep, round) {
  let list = readChecklist(prep.checklist, round);
  const box = el('section', { class: 'card prep-card checklist' });
  const send = async (op) => {
    try { list = (await api('settings', { method: 'PATCH', body: { checklist: op, round } })).checklist; prep.checklist = list; draw(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const input = el('input', { type: 'text', maxlength: 200, placeholder: 'e.g. Print the session sheet', 'aria-label': 'New step' });
  const form = el('form', { class: 'ck-add controls' }, input, el('button', { class: 'btn small', type: 'submit' }, 'Add step'));
  form.addEventListener('submit', (ev) => { ev.preventDefault(); if (!input.value.trim()) { input.focus(); return; } send({ add: input.value }).then(() => { input.value = ''; input.focus(); }); });
  const move = (i, by) => { const ids = list.items.map((x) => x.id); const j = i + by; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; send({ order: ids }); };
  function draw() {
    const done = new Set(list.done);
    setKids(box, el('h3', {}, `Before the table${list.items.length ? ` (${done.size}/${list.items.length})` : ''}`),
      list.items.length ? el('ul', { class: 'plain ck-list' }, list.items.map((x, i) => {
        const cb = el('input', { type: 'checkbox', id: `ck-${x.id}`, checked: done.has(x.id) || null });
        cb.addEventListener('change', () => send({ done: x.id, on: cb.checked }));
        return el('li', { class: done.has(x.id) ? 'done' : '' }, cb, el('label', { for: `ck-${x.id}` }, x.text),
          el('span', { class: 'ck-tools' },
            el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move up: ${x.text}`, disabled: i ? null : true, onclick: () => move(i, -1) }, '↑'),
            el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove step: ${x.text}`, onclick: () => send({ remove: x.id }) }, '✕')));
      })) : el('p', { class: 'muted small' }, 'Your own steps before every session. Ticks clear by themselves when the next session is logged.'),
      form);
  }
  draw();
  return box;
}
