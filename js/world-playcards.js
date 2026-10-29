// Cards to hand across the table, poker-card size and nine to a page.
// Magic items: #world/itemcards/<which>: nothing for every item, "held" for what the party's treasury holds, i:<id> for
// one item, t:<tag> for a tag. Spells: #world/spellcards/<which>: c:<id> for one character (their spells with slots to
// tick, plus cards for any of them from the world's library), "library" for the library's spells, nothing for every
// caster in the party.
import { el, setKids } from './dom.js';
import { api, isMember } from './api.js';
import { worldEntries, getEntry, byName, notice } from './world-store.js';
import { itemCard, itemsNamed, spellListCard, librarySpellCard } from './play-cards.js';
import { characterOf } from './sheet-ui.js';

function playCard(c, onRemove) {
  return el('article', { class: 'play-card' },
    el('header', {}, el('h3', {}, c.title), onRemove ? el('button', { class: 'btn small ghost card-x', type: 'button', 'aria-label': `Leave out ${c.title}`, onclick: onRemove }, '✕') : null),
    c.sub ? el('p', { class: 'pc-sub' }, c.sub) : null,
    c.image ? el('img', { class: 'pc-pic', src: c.image, alt: '' }) : null,
    c.slots?.length ? el('div', { class: 'pc-slots' }, c.slots.map(([label, n]) => el('span', { class: 'pc-slot' }, `${label} `, el('span', { class: 'sr-only' }, `${n} slots`),
      el('span', { 'aria-hidden': 'true' }, Array.from({ length: n }, () => el('span', { class: 'pc-box' })))))) : null,
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

const librarySpells = () => worldEntries().filter((e) => e.kind === 'rule' && e.fields?.category === 'Spell');
const casters = () => worldEntries().filter((e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status))
  .map((e) => ({ e, sb: characterOf(e)?.stats?.spellbook })).filter((x) => x.sb);

export async function viewSpellCards(arg = '') {
  const lib = librarySpells();
  let cards = [], title = 'Spell cards';
  if (arg.startsWith('c:')) {
    const e = getEntry(arg.slice(2)), sb = e && characterOf(e)?.stats?.spellbook;
    if (!sb) return notice('No spells to print', 'This character doesn’t cast spells (or wasn’t made in the Character Forge).');
    const known = new Set([...sb.cantrips, ...Object.values(sb.byLevel).flat()].map((n) => n.toLowerCase()));
    cards = [spellListCard(e.name, sb), ...lib.filter((s) => known.has(s.name.toLowerCase())).sort(byName).map(librarySpellCard)];
    title = `${e.name}: spell cards`;
  } else if (arg === 'library') { cards = [...lib].sort(byName).map(librarySpellCard); title = 'Spell cards: your library'; }
  else cards = casters().sort((a, b) => byName(a.e, b.e)).map(({ e, sb }) => spellListCard(e.name, sb));
  return cardSheet(title, 'Each caster’s spells with slot boxes to tick in pencil, and full cards for spells from your world’s library. Poker-card size, nine to a page. ✕ leaves one out.', cards);
}

// "Spell cards" on a caster's page.
export const spellCardButton = (e) => (e.kind === 'character' && isMember() && characterOf(e)?.stats?.spellbook ? el('a', { class: 'btn small ghost', href: `#world/spellcards/c:${e.id}` }, 'Spell cards') : null);
