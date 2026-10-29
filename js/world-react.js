// A row of reactions under table talk and quotes: the ones people used (press yours again to take it back), and
// a small "+" that offers the five. send(emoji, on) saves and resolves to the new reactions.
import { el, toast, setKids } from './dom.js';
import { isMember, session } from './api.js';
import { REACTIONS, reactionsOut } from './reactions.js';

export function reactionBar(raw, send) {
  let current = raw || {};
  const box = el('div', { class: 'react-bar', role: 'group', 'aria-label': 'Reactions' });
  const go = async (emoji, on) => {
    try { current = await send(emoji, on); draw(false); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const draw = (picking) => {
    const used = reactionsOut(current, session.gm?.id);
    const who = (r) => `${r.names.join(', ')} reacted ${r.emoji}`;
    setKids(box,
      used.map((r) => el('button', { class: `react${r.mine ? ' mine' : ''}`, type: 'button', title: who(r), 'aria-pressed': String(r.mine), 'aria-label': `${r.emoji} ${r.count}: ${who(r)}`, disabled: isMember() ? null : true,
        onclick: () => go(r.emoji, !r.mine) }, r.emoji, el('span', { class: 'react-n' }, r.count))),
      isMember() ? (picking
        ? el('span', { class: 'react-pick' }, REACTIONS.map((e) => el('button', { class: 'react', type: 'button', 'aria-label': `React ${e}`, onclick: () => go(e, true) }, e)),
          el('button', { class: 'react', type: 'button', 'aria-label': 'Close reactions', onclick: () => draw(false) }, '✕'))
        : el('button', { class: 'react react-add', type: 'button', 'aria-label': 'Add a reaction', title: 'Add a reaction', onclick: () => { draw(true); box.querySelector('.react-pick button')?.focus(); } }, '☺+')) : null);
  };
  draw(false);
  return box;
}
