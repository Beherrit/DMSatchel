// Wish lists on a character's page: what the player hopes the character finds or earns. Only the player and the
// GMs see the list; either ticks a wish off when it comes true. GMs see open wishes in session prep and beside loot.
import { el, toast } from './dom.js';
import { isGm, session } from './api.js';
import { getEntry, patchEntry, richText } from './world-store.js';
import { readWishes, addWish, setGot, removeWish, wishersFor } from './wishes.js';

export function wishesSection(c, rerender) {
  if (c.kind !== 'character') return null;
  const can = isGm() || (session.gm && c.owner_id === session.gm.id);
  if (!can) return null;
  const list = readWishes(c);
  const save = async (next, msg) => {
    try { await patchEntry(getEntry(c.id) || c, { fields: { wishes: JSON.stringify(next) } }); if (msg) toast(msg); rerender(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const text = el('input', { type: 'text', maxlength: 200, placeholder: 'e.g. A Cloak of Elvenkind, a ship of my own', 'aria-label': 'New wish' });
  const add = el('form', { class: 'wish-add controls' }, text, el('button', { class: 'btn small', type: 'submit' }, 'Add wish'));
  add.addEventListener('submit', (ev) => { ev.preventDefault(); if (!text.value.trim()) { text.focus(); return; } save(addWish(list, text.value), 'Wish added'); });
  const order = [...list].sort((a, b) => a.got - b.got);
  return el('section', { class: 'card wishes' },
    el('h3', {}, 'Wish list ', el('span', { class: 'muted small' }, '(only you and the GMs see this)')),
    order.length ? el('ul', { class: 'plain wish-list' }, order.map((w) => {
      const box = el('input', { type: 'checkbox', checked: w.got || null, 'aria-label': `Came true: ${w.text}` });
      box.addEventListener('change', () => save(setGot(list, w.id, box.checked), box.checked ? 'Wish come true!' : null));
      return el('li', { class: `wish${w.got ? ' got' : ''}` }, box, el('span', { class: 'wish-text' }, richText(w.text)),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove wish: ${w.text}`, onclick: () => save(removeWish(list, w.id)) }, '✕'));
    })) : el('p', { class: 'muted small' }, 'Magic items, places, titles, people: what would this character love to find or earn? The GMs can weave it in.'),
    add);
}

// "Pip wishes for this" beside an item, for GMs.
export function wishedBy(itemName, characters) {
  if (!isGm()) return null;
  const who = wishersFor(itemName, characters);
  return who.length ? el('span', { class: 'wished small', title: who.map((x) => `${x.character.name}: ${x.wish.text}`).join('\n') }, ` ★ ${who.map((x) => x.character.name).join(', ')} wish${who.length === 1 ? 'es' : ''} for this`) : null;
}
