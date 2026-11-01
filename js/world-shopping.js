// A shopping list on a character's page (their player and GMs edit it); GMs see everyone's in session prep. The buy
// panel at a shop offers what's on the list first (see world-buy.js).
import { el, toast, setKids } from './dom.js';
import { isGm } from './api.js';
import { world, worldEntries, getEntry, link } from './world-store.js';
import { playOf, changePlay } from './sheet-ui.js';
import { readList, addToList, removeFromList } from './shopping.js';

export function shoppingCard(e, rerender) {
  if (e.kind !== 'character' || !e.can_edit) return null;
  const box = el('section', { class: 'card shopping' });
  const save = async (fn, msg) => { try { await changePlay(world.entries.get(e.id) || e, (play) => { play.shopping = fn(readList(play)); }); if (msg) toast(msg); draw(); } catch (err) { toast(err.message, 'bad'); } };
  const input = el('input', { type: 'text', id: `sh-${e.id}`, maxlength: 80, placeholder: 'e.g. Healing potion, 50 ft of rope' });
  const form = el('form', { class: 'controls' }, el('label', { class: 'sr-only', for: `sh-${e.id}` }, 'Add to the shopping list'), input, el('button', { class: 'btn small', type: 'submit' }, 'Add'));
  form.addEventListener('submit', (ev) => { ev.preventDefault(); if (!input.value.trim()) { input.focus(); return; } save((l) => addToList(l, input.value)).then(() => { input.value = ''; input.focus(); }); });
  function draw() {
    const list = readList(playOf(world.entries.get(e.id) || e));
    setKids(box, el('h3', {}, '🛒 Shopping list'),
      list.length ? el('ul', { class: 'plain ck-list' }, list.map((t, i) => el('li', {}, el('span', {}, t),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Take ${t} off the list`, onclick: () => save((l) => removeFromList(l, i)) }, '✕'))))
        : el('p', { class: 'muted small' }, 'What you mean to buy next time you’re in town. Shops that stock it will offer it first.'),
      form);
  }
  draw();
  return box;
}

// In session prep (GMs): everyone's lists.
export function shoppingPrepCard() {
  if (!isGm()) return null;
  const lists = worldEntries().filter((c) => c.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status))
    .map((c) => ({ c, list: readList(playOf(c)) })).filter((x) => x.list.length);
  if (!lists.length) return null;
  return el('section', { class: 'card prep-card shopping-lists' }, el('h3', {}, '🛒 Shopping lists'),
    el('ul', { class: 'plain' }, lists.map(({ c, list }) => el('li', {}, link(getEntry(c.id) || c), `: ${list.join(', ')}`))));
}
