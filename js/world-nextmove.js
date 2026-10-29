// Our next move: players pick the quest they want to pursue next (on its page); GMs see the tally in session prep,
// and whether the party is split, and clear the picks once it's decided.
import { el, toast } from './dom.js';
import { api, isPlayer, previewing } from './api.js';
import { world, getEntry, link } from './world-store.js';
import { tallyMoves } from './next-move.js';

const DONE = ['Completed', 'Failed', 'Abandoned'];

export function nextMoveButton(q, rerender) {
  if (q.kind !== 'quest' || !isPlayer() || previewing() || DONE.includes(q.fields?.status)) return null;
  const mine = world.info?.next_move === q.id;
  return el('button', { class: `btn${mine ? ' primary' : ''}`, type: 'button', 'aria-pressed': String(mine), title: 'Tell the GMs this is what you want to do next', onclick: async () => {
    try {
      const r = await api('party', { method: 'PUT', body: { next_move: mine ? null : q.id } });
      world.info = { ...world.info, next_move: r.next_move };
      toast(mine ? 'Pick taken back' : 'The GMs will see this is your pick for what’s next');
      rerender();
    } catch (err) { toast(err.message, 'bad'); }
  } }, mine ? '★ Our next move' : '☆ Make this our next move');
}

// In session prep (GMs): what the players want to do next.
export function nextMovesCard(rerender) {
  const t = tallyMoves(world.info?.moves, getEntry);
  if (!t.picks.length) return null;
  return el('section', { class: 'card prep-card next-moves' },
    el('h3', {}, '★ What the players want next'),
    el('ul', { class: 'plain' }, t.picks.map((p) => el('li', {}, link(p.quest), el('span', { class: 'muted small' }, ` ${p.names.join(', ')}`)))),
    t.split ? el('p', { class: 'small' }, 'The party is split: worth talking about at the start of the session.') : null,
    el('button', { class: 'btn small ghost', type: 'button', onclick: async () => {
      try { await api('party', { method: 'DELETE', query: { moves: 1 } }); world.info = { ...world.info, moves: [] }; toast('Picks cleared'); rerender(); } catch (err) { toast(err.message, 'bad'); }
    } }, 'Clear the picks'));
}
