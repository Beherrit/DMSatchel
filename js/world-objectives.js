// The objectives checklist on a quest's page (GMs tick, add, hide, reorder; players see the open steps), and a small
// progress badge for quest boards and the party page.
import { el, toast } from './dom.js';
import { isGm } from './api.js';
import { getEntry, patchEntry, richText } from './world-store.js';
import { readObjectives, progress, addObjective, updateObjective, removeObjective, moveObjective } from './objectives.js';

export function progressBadge(q) {
  const p = progress(readObjectives(q));
  if (!p.total) return null;
  return el('span', { class: `obj-badge${p.done === p.total ? ' complete' : ''}`, title: `${p.done} of ${p.total} objectives done` },
    el('span', { class: 'obj-bar', 'aria-hidden': 'true' }, el('span', { style: `width:${p.pct}%` })), ` ${p.done}/${p.total}`);
}

export function objectivesSection(q, rerender) {
  if (q.kind !== 'quest') return null;
  const list = readObjectives(q), gm = isGm();
  if (!list.length && !gm) return null;
  const save = async (next, msg) => {
    try { await patchEntry(getEntry(q.id) || q, { fields: { objectives: JSON.stringify(next) } }); if (msg) toast(msg); rerender(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const p = progress(list);
  const text = el('input', { type: 'text', id: 'obj-new', placeholder: 'A step: “Find out who drowned the bell”', 'aria-label': 'New objective' });
  const secret = el('input', { type: 'checkbox', id: 'obj-secret' });
  const add = gm ? el('form', { class: 'obj-add controls' }, text, el('label', { class: 'check' }, secret, ' Secret for now'), el('button', { class: 'btn small', type: 'submit' }, 'Add step')) : null;
  add?.addEventListener('submit', (ev) => { ev.preventDefault(); if (!text.value.trim()) { text.focus(); return; } save(addObjective(list, text.value, secret.checked)); });
  return el('section', { class: 'card objectives' },
    el('div', { class: 'entry-head' }, el('h3', {}, 'Objectives'), list.length ? el('span', { class: 'muted small' }, `${p.done} of ${p.total} done`) : null),
    list.length ? el('div', { class: 'obj-bar big', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': p.total, 'aria-valuenow': p.done, 'aria-label': 'Objectives done' }, el('span', { style: `width:${p.pct}%` })) : null,
    list.length ? el('ol', { class: 'obj-list' }, list.map((o, i) => el('li', { class: `${o.done ? 'done' : ''}${o.secret ? ' is-secret' : ''}` },
      gm ? el('input', { type: 'checkbox', checked: o.done || null, 'aria-label': `Done: ${o.text}`, onchange: (ev) => save(updateObjective(list, o.id, { done: ev.target.checked })) })
        : el('span', { class: 'obj-tick', 'aria-label': o.done ? 'done' : 'not done yet' }, o.done ? '✔' : '○'),
      el('span', { class: 'obj-text' }, richText(o.text)),
      o.secret ? el('span', { class: 'tag' }, 'secret') : null,
      gm ? el('span', { class: 'obj-tools' },
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => save(updateObjective(list, o.id, { secret: !o.secret }), o.secret ? 'Revealed to players' : 'Hidden from players') }, o.secret ? 'Reveal' : 'Hide'),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move up: ${o.text}`, disabled: i === 0 || null, onclick: () => save(moveObjective(list, o.id, -1)) }, '↑'),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove: ${o.text}`, onclick: () => save(removeObjective(list, o.id)) }, '✕')) : null)))
      : el('p', { class: 'muted small' }, 'No steps yet. Break the quest into a few objectives the party can tick off.'),
    add);
}
