// Quest chains on the page: what came before a quest and what it leads to; when one is done, GMs can open up the
// quests that follow (a rumor becomes a posted job, a hidden one is revealed).
import { el, toast } from './dom.js';
import { isGm, previewing } from './api.js';
import { worldEntries, link, patchEntry, setEntryState, getEntry } from './world-store.js';
import { chainOf, waitingNext } from './quest-chain.js';


async function openUp(list, rerender) {
  try {
    for (const q of list) {
      const cur = getEntry(q.id) || q;
      if ((cur.fields?.status || 'Available') === 'Rumor') await patchEntry(cur, { fields: { status: 'Available' } });
      if ((getEntry(q.id) || cur).visibility === 'gm') await setEntryState(getEntry(q.id) || cur, { visibility: 'all' });
    }
    toast(`Opened up ${list.map((q) => q.name).join(', ')}`);
    rerender();
  } catch (err) { toast(err.message, 'bad'); }
}

const why = (q) => [q.visibility === 'gm' ? 'hidden' : '', (q.fields?.status || 'Available') === 'Rumor' ? 'a rumor' : ''].filter(Boolean).join(', ');

export function chainSection(q, rerender) {
  if (q.kind !== 'quest') return null;
  const { before, after } = chainOf(q, worldEntries());
  if (!before.length && !after.length) return null;
  const waiting = isGm() && !previewing() && q.fields?.status === 'Completed' ? waitingNext(after) : [];
  const step = (e) => el('li', {}, link(e), el('span', { class: 'muted small' }, ` ${e.fields?.status || 'Available'}`));
  return el('section', { class: 'card chain-card' },
    el('h3', {}, 'Quest chain'),
    el('ol', { class: 'plain quest-chain' }, before.map(step), el('li', { class: 'chain-here', 'aria-current': 'step' }, el('strong', {}, q.name), el('span', { class: 'muted small' }, ` ${q.fields?.status || 'Available'}`)),
      after.length ? el('li', { class: 'chain-next' }, 'Leads to: ', after.flatMap((e, i) => [i ? ', ' : '', link(e)])) : null),
    waiting.length ? el('div', { class: 'btnrow' }, el('button', { class: 'btn small primary', type: 'button', onclick: () => openUp(waiting, rerender) }, `Open the next quest${waiting.length === 1 ? '' : 's'}`),
      el('span', { class: 'muted small' }, waiting.map((e) => `${e.name} (${why(e)})`).join(', '))) : null);
}

// After a quest is marked Completed on the board: offer to open up what follows.
export function offerNext(q, rerender) {
  const waiting = waitingNext(chainOf(q, worldEntries()).after);
  if (!waiting.length || q.fields?.status !== 'Completed') return;
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'qn-title' }, el('div', { class: 'dialog-body' },
    el('h2', { id: 'qn-title' }, `${q.name} is done. What next?`),
    el('p', {}, 'It leads to ', waiting.flatMap((e, i) => [i ? ', ' : '', el('strong', {}, e.name), ` (${why(e)})`]), '. Open it up for the party?'),
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: async () => { await openUp(waiting, rerender); d.close(); } }, 'Open it up'),
      el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'))));
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}
