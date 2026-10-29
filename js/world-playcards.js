// Cards to hand across the table, poker-card size and nine to a page: magic items (#world/itemcards/<which>) and,
// later, spells. <which>: nothing for every item, "held" for what the party's treasury holds, i:<id> for one item,
// t:<tag> for a tag.
import { el, setKids } from './dom.js';
import { api, isMember } from './api.js';
import { worldEntries, getEntry, byName, notice } from './world-store.js';
import { itemCard, itemsNamed } from './play-cards.js';

function playCard(c, onRemove) {
  return el('article', { class: 'play-card' },
    el('header', {}, el('h3', {}, c.title), onRemove ? el('button', { class: 'btn small ghost card-x', type: 'button', 'aria-label': `Leave out ${c.title}`, onclick: onRemove }, '✕') : null),
    c.sub ? el('p', { class: 'pc-sub' }, c.sub) : null,
    c.image ? el('img', { class: 'pc-pic', src: c.image, alt: '' }) : null,
    c.text ? el('div', { class: 'pc-text' }, c.text.split(/\n{2,}/).map((p) => el('p', {}, p))) : null,
    c.foot ? el('footer', { class: 'pc-foot' }, c.foot) : null);
}

// A printable sheet of cards; ✕ leaves one out of this print.
export function cardSheet(title, intro, cards) {
  let list = [...cards];
  const grid = el('div', { class: 'play-cards' });
  const draw = () => setKids(grid, list.length ? list.map((c) => playCard(c, () => { list = list.filter((x) => x !== c); draw(); })) : notice('No cards', 'Nothing to print here.'));
  draw();
  return el('div', { class: 'w-view cards-view' },
    el('div', { class: 'panel-head row card-tools' }, el('div', {}, el('h2', {}, title), el('p', {}, intro)),
      el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print'))),
    grid);
}

export async function viewItemCards(arg = '') {
  const items = worldEntries().filter((e) => e.kind === 'item');
  let list = items, title = 'Item cards';
  if (arg === 'held') {
    let held = [];
    try { held = ((await api('party')).items || []).map((i) => i.item); } catch { /* no treasury */ }
    list = itemsNamed(items, held); title = 'Cards for what the party holds';
  } else if (arg.startsWith('i:')) { const e = getEntry(arg.slice(2)); list = e ? [e] : []; title = e ? `${e.name}: card` : title; }
  else if (arg.startsWith('t:')) { const t = decodeURIComponent(arg.slice(2)); list = items.filter((e) => (e.tags || []).includes(t)); title = `Item cards: ${t}`; }
  return cardSheet(title, 'Poker-card size, nine to a page, to cut out and hand across the table. Only what players can read goes on a card, never GM secrets. ✕ leaves one out.',
    [...list].sort(byName).map(itemCard));
}

// "Print card" on an item's page, for anyone in the world.
export const itemCardButton = (e) => (e.kind === 'item' && isMember() ? el('a', { class: 'btn small ghost', href: `#world/itemcards/i:${e.id}` }, 'Print card') : null);
