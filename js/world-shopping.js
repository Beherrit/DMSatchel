// A shopping list on a character's page (their player and GMs edit it); GMs see everyone's in session prep. The buy
// panel at a shop offers what's on the list first (see world-buy.js).
import { el, toast, setKids } from './dom.js';
import { isGm } from './api.js';
import { world, worldEntries, getEntry, link } from './world-store.js';
import { playOf, changePlay } from './sheet-ui.js';
import { readList, addToList, removeFromList, shopsFor, tripPlan } from './shopping.js';
import { openText, holidayToday } from './shop-hours.js';
import { cleanCalendar } from './calendar.js';
import { ownerIn } from './world-routine.js';
import { coinText } from './economy.js';

// Open now?: under a line on the list, the shops that stock it (cheapest first), whether they're open at the world's
// hour, and whether the owner is behind the counter.
function whereToBuy(line) {
  const shops = worldEntries().filter((s) => s.kind === 'location' && s.fields?.stock).map((s) => ({ ...s, stock: s.fields.stock }));
  const found = shopsFor(line, shops).slice(0, 3);
  if (!found.length) return null;
  const m = world.info?.clock?.minutes ?? 480, holiday = holidayToday(cleanCalendar(world.info?.cal));
  return el('div', { class: 'small muted where-to-buy' }, found.map((f, i) => {
    const open = openText(f.shop, m, holiday), who = ownerIn(f.shop);
    return [i ? ' · ' : '', link(getEntry(f.shop.id) || f.shop), ` ${coinText(f.cp)}, `, open.open ? el('span', { class: 'open-now' }, open.text) : open.text,
      who && open.open ? (who.here ? `, ${who.owner.name} is in` : `, ${who.owner.name} is out`) : ''];
  }));
}

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
      list.length ? el('ul', { class: 'plain ck-list' }, list.map((t, i) => el('li', {}, el('span', {}, t, whereToBuy(t)),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Take ${t} off the list`, onclick: () => save((l) => removeFromList(l, i)) }, '✕'))))
        : el('p', { class: 'muted small' }, 'What you mean to buy next time you’re in town. Shops that stock it will offer it first.'),
      list.length ? tripBox([{ c: e, list }], true) : null,
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
    el('ul', { class: 'plain' }, lists.map(({ c, list }) => el('li', {}, link(getEntry(c.id) || c), ':',
      el('ul', { class: 'plain shopping-prep-lines' }, list.map((t) => el('li', {}, t, whereToBuy(t))))))),
    tripBox(lists));
}

// A shopping trip: the shops in town (where the party is; else anywhere) that stock something on someone's list,
// most wanted first, with what and for whom, and whether each is open now.
function tripBox(lists, mine = false) {
  let town = null;
  for (let p = world.info?.party_at && getEntry(world.info.party_at), i = 0; p && i < 12; p = p.parent_id && getEntry(p.parent_id), i++) if (p.kind === 'settlement') { town = p; break; }
  const inTown = (x) => { for (let p = x, i = 0; p && i < 12; p = p.parent_id && getEntry(p.parent_id), i++) if (p.id === town.id) return true; return false; };
  const shops = worldEntries().filter((s) => s.kind === 'location' && s.fields?.stock && (!town || inTown(s))).map((s) => ({ ...s, stock: s.fields.stock }));
  const plan = tripPlan(lists.map(({ c, list }) => ({ who: c.name, lines: list })), shops);
  if (!plan.stops.length) return null;
  const m = world.info?.clock?.minutes ?? 480, holiday = holidayToday(cleanCalendar(world.info?.cal));
  // Your own trip: only worth a route when there's more than one stop or more than one thing to fetch.
  if (mine && plan.stops.length < 2 && plan.stops.every((x) => x.wants.length < 2)) return null;
  return el(mine ? 'details' : 'div', { class: 'shopping-trip' }, el(mine ? 'summary' : 'h4', {}, `${mine ? 'Your shopping trip' : 'A shopping trip'}${town ? ` in ${town.name}` : ''}`),
    el('ol', { class: 'trip-stops' }, plan.stops.map(({ shop, wants }) => { const o = openText(shop, m, holiday); return el('li', {},
      link(getEntry(shop.id) || shop), ' ', el('span', { class: `small ${o.open ? 'open-now' : 'muted'}` }, o.text),
      el('div', { class: 'small' }, wants.map((w, i) => [i ? '; ' : '', mine ? `${w.item} ` : `${w.item} for ${w.who} `, el('span', { class: 'muted' }, `(${coinText(w.cp)})`)]))); })),
    plan.missing.length ? el('p', { class: 'small muted' }, `Nowhere${town ? ' here' : ''} stocks: `, plan.missing.map((x) => (mine ? x.line : `${x.line} (${x.who})`)).join(', '), '.') : null);
}
