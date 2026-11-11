// The objectives checklist on a quest's page (GMs tick, add, hide, reorder; players see the open steps), and a small
// progress badge for quest boards and the party page.
import { el, toast } from './dom.js';
import { isGm } from './api.js';
import { getEntry, patchEntry, richText, richInline, worldEntries } from './world-store.js';
import { sessionOrder } from './appearances.js';
import { worldCalendar } from './world-calendar.js';
import { formatDate, today } from './calendar.js';

const inWorldToday = () => { const cal = worldCalendar(); try { return cal ? formatDate(cal, today(cal)) : undefined; } catch { return undefined; } };
import { stripMarks } from './rich.js';
import { readObjectives, progress, addObjective, updateObjective, removeObjective, moveObjective } from './objectives.js';

export function progressBadge(q) {
  const p = progress(readObjectives(q));
  if (!p.total) return null;
  return el('span', { class: `obj-badge${p.done === p.total ? ' complete' : ''}`, title: `${p.done} of ${p.total} objectives done` },
    el('span', { class: 'obj-bar', 'aria-hidden': 'true' }, el('span', { style: `width:${p.pct}%` })), ` ${p.done}/${p.total}`);
}

export const isProphecy = (e) => e?.kind === 'lore' && e.fields?.category === 'Prophecy';

export function objectivesSection(q, rerender) {
  // Prophecies: lore whose checklist is its signs, ticked off as they come to pass.
  const signs = isProphecy(q);
  if (q.kind !== 'quest' && !signs) return null;
  const list = readObjectives(q), gm = isGm();
  const W = signs ? { title: 'Signs', done: 'come to pass', add: 'Add sign', ph: 'A sign: “The bells ring with no one to ring them”', empty: 'No signs yet. What will show the prophecy is coming true?', tick: 'Come to pass', bar: 'Signs come to pass' }
    : { title: 'Objectives', done: 'done', add: 'Add step', ph: 'A step: “Find out who drowned the bell”', empty: 'No steps yet. Break the quest into a few objectives the party can tick off.', tick: 'Done', bar: 'Objectives done' };
  if (!list.length && !gm) return null;
  const save = async (next, msg) => {
    try { await patchEntry(getEntry(q.id) || q, { fields: { objectives: JSON.stringify(next) } }); if (msg) toast(msg); rerender(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const p = progress(list);
  const text = el('input', { type: 'text', id: 'obj-new', placeholder: W.ph, 'aria-label': signs ? 'New sign' : 'New objective' });
  const secret = el('input', { type: 'checkbox', id: 'obj-secret' });
  const add = gm ? el('form', { class: 'obj-add controls' }, text, el('label', { class: 'check' }, secret, ' Secret for now'), el('button', { class: 'btn small', type: 'submit' }, W.add)) : null;
  add?.addEventListener('submit', (ev) => { ev.preventDefault(); if (!text.value.trim()) { text.focus(); return; } save(addObjective(list, text.value, secret.checked)); });
  return el('section', { class: 'card objectives' },
    el('div', { class: 'entry-head' }, el('h3', {}, W.title), list.length ? el('span', { class: 'muted small' }, `${p.done} of ${p.total} ${W.done}`) : null),
    // Fulfilled: every sign has come to pass.
    signs && p.total && p.done === p.total ? el('p', { class: 'prophecy-fulfilled' }, el('strong', {}, '✨ Fulfilled: '), 'every sign has come to pass.') : null,
    list.length ? el('div', { class: 'obj-bar big', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': p.total, 'aria-valuenow': p.done, 'aria-label': W.bar }, el('span', { style: `width:${p.pct}%` })) : null,
    list.length ? el('ol', { class: 'obj-list' }, list.map((o, i) => el('li', { class: `${o.done ? 'done' : ''}${o.secret ? ' is-secret' : ''}` },
      gm ? el('input', { type: 'checkbox', checked: o.done || null, 'aria-label': `${W.tick}: ${o.text}`, onchange: async (ev) => { const done = ev.target.checked; await save(updateObjective(list, o.id, { done, when: done && signs ? inWorldToday() : undefined })); if (signs && done) noteSign(q, o.text); } })
        : el('span', { class: 'obj-tick', 'aria-label': o.done ? 'done' : 'not done yet' }, o.done ? '✔' : '○'),
      el('span', { class: 'obj-text' }, richText(o.text)),
      // When it came to pass: the in-world date a sign was ticked off.
      o.done && o.when ? el('span', { class: 'muted small obj-when' }, ` · came to pass ${o.when}`) : null,
      o.secret ? el('span', { class: 'tag' }, 'secret') : null,
      gm ? el('span', { class: 'obj-tools' },
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => save(updateObjective(list, o.id, { secret: !o.secret }), o.secret ? 'Revealed to players' : 'Hidden from players') }, o.secret ? 'Reveal' : 'Hide'),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move up: ${o.text}`, disabled: i === 0 || null, onclick: () => save(moveObjective(list, o.id, -1)) }, '↑'),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove: ${o.text}`, onclick: () => save(removeObjective(list, o.id)) }, '✕')) : null)))
      : el('p', { class: 'muted small' }, W.empty),
    add);
}

// Signs in the log: when a sign comes to pass, offer to note it in the latest session's log.
async function noteSign(prophecy, text) {
  const last = sessionOrder(worldEntries())[0];
  if (!last || !confirm(`Note it in ${last.name}’s log?`)) return;
  const line = `A sign came to pass ([[${prophecy.name}]]): ${stripMarks(text)}`;
  try { await patchEntry(getEntry(last.id) || last, { body: `${String(last.body || '').replace(/\s+$/, '')}${last.body ? '\n\n' : ''}${line}` }); toast(`Noted in ${last.name}`); } catch (err) { toast(err.message, 'bad'); }
}

// Omens: on the front page, each prophecy this person knows, with the next sign still to come (what they can see of it).
export function omensCard() {
  const ps = worldEntries().filter(isProphecy).map((p) => ({ p, list: readObjectives(p) })).filter((x) => x.list.length);
  if (!ps.length) return null;
  return el('section', { class: 'card omens' }, el('h3', {}, '🔮 Omens'),
    el('ul', { class: 'plain small' }, ps.map(({ p, list }) => { const pr = progress(list), next = list.find((o) => !o.done);
      return el('li', {}, el('a', { href: `#world/e/${p.id}` }, p.name), el('span', { class: 'muted' }, ` (${pr.done} of ${pr.total})`), ': ',
        next ? ['still to come: ', richInline(next.text)] : el('strong', {}, 'fulfilled')); })));
}
