// Tavern menu: on a tavern's page, its bill of fare (if it has one) for everyone; GMs roll one priced to suit the
// town, roll again, keep it, or take it down. Print gives just the menu, to put on the table.
import { el, toast, setKids } from './dom.js';
import { api, isGm, isMember, previewing, session } from './api.js';
import { tradeLedger } from './world-buy.js';
import { addTrade } from './shop-trade.js';
import { world, worldEntries, patchEntry, getEntry, link } from './world-store.js';
import { rumorsAt } from './world-rumors.js';
import { makeRng } from './rng.js';
import { rollMenu, readMenu } from './menu.js';
import { coinText } from './economy.js';
import { playOf, restOf } from './sheet-ui.js';
import { roomsOf, nightCosts, minutesToMorning } from './inn.js';
import { formatDate, today } from './calendar.js';

const ACTIVE = (c) => c.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status);

// GMs: the party takes rooms for the night. Each character pays from their own coin and gets a long rest, and the
// clock moves on to 8 in the morning (a new day on the calendar if it passes midnight; living costs aren't asked for, the room is the cost).
function stayDialog(inn, menu, rerender) {
  const rooms = roomsOf(menu);
  const chars = worldEntries().filter(ACTIVE).sort((a, b) => a.name.localeCompare(b.name));
  if (!chars.length) { toast('Nobody in the party has a character sheet to pay from.', 'bad'); return; }
  const room = el('select', { id: 'st-room' }, rooms.map((r, i) => el('option', { value: i }, `${r.name}: ${coinText(r.cp)} each`)));
  const boxes = chars.map((c) => ({ c, cb: el('input', { type: 'checkbox', id: `st-${c.id}`, checked: true }) }));
  const preview = el('p', { class: 'small', role: 'status' });
  const plan = () => nightCosts(boxes.filter((b) => b.cb.checked).map(({ c }) => ({ id: c.id, name: c.name, cp: playOf(c).cp || 0 })), rooms[Number(room.value)].cp);
  const show = () => { const p = plan(); preview.textContent = p.length ? p.map((x) => `${x.name} ${coinText(x.paid)}${x.short ? ` (${coinText(x.short)} short)` : ''}`).join(', ') + '.' : 'Nobody is staying.'; };
  for (const x of [room, ...boxes.map((b) => b.cb)]) x.addEventListener('change', show);
  show();
  const go = el('button', { class: 'btn primary', type: 'submit' }, 'Stay the night');
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'st-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'st-title' }, `A night at ${inn.name}`),
    el('div', { class: 'field' }, el('label', { for: 'st-room' }, 'Rooms'), room),
    el('fieldset', { class: 'plain-fieldset' }, el('legend', {}, 'Who stays'), boxes.map(({ c, cb }) => el('label', { class: 'check', for: `st-${c.id}` }, cb, ` ${c.name}`))),
    preview,
    el('p', { class: 'muted small' }, 'Those who stay get a long rest (hit points and spell slots back), and the clock moves on to 8 in the morning.'),
    el('div', { class: 'btnrow' }, go, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const p = plan();
    if (!p.length) { d.close(); return; }
    go.disabled = true;
    const failed = [];
    // Each pays for the room and gets a long rest, in one save of their sheet.
    for (const x of p) { try { await restOf(chars.find((c) => c.id === x.id), (play) => { play.cp -= x.paid; }, `A night at ${inn.name}: −${coinText(x.paid)} for ${rooms[Number(room.value)].name.toLowerCase()}, long rest`); } catch { failed.push(x.name); } }
    try {
      const r = await api('settings', { method: 'PATCH', body: { clock: { advance: minutesToMorning(world.info?.clock?.minutes ?? 480) } } });
      world.info = { ...world.info, clock: r.clock, ...(r.cal ? { cal: r.cal } : {}) };
      const notes = [`The party slept at ${inn.name} and woke rested (hit points and spell slots back)`, r.cal && r.days ? `it’s morning on ${formatDate(r.cal, today(r.cal), { weekday: true })}` : 'it’s morning', r.out?.length ? `${r.out.join(', ')} went out` : '', failed.length ? `these sheets didn’t update: ${failed.join(', ')}` : ''].filter(Boolean);
      toast(notes.join(' · '), failed.length ? 'bad' : undefined);
    } catch (err) { toast(`Paid, but the clock didn’t move: ${err.message}`, 'bad'); }
    rerender();
    // Over supper: a rumour going around this town, for the GM to pass on (or keep to themselves).
    const town = townOf(inn), heard = town ? rumorsAt(town.id) : [];
    if (!heard.length) { d.close(); return; }
    const { r, v } = heard[Math.floor(Math.random() * heard.length)];
    setKids(d.querySelector('form'), el('h2', { id: 'st-title' }, 'Over supper…'),
      el('p', {}, `Talk in the common room of ${inn.name}:`), el('blockquote', { class: 'rumor-heard' }, el('q', {}, v.text)),
      el('p', { class: 'muted small' }, 'Pass it on to the players, or keep it for later. ', link(r, 'The rumour’s page')),
      el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => d.close() }, 'Done')));
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}

const townOf = (e) => { let p = getEntry(e.parent_id), guard = 0; while (p && guard++ < 12) { if (p.kind === 'settlement') return p; p = getEntry(p.parent_id); } return null; };

const QUALITY = { poor: 'A poor alehouse', modest: 'A modest inn', comfortable: 'A comfortable inn', wealthy: 'A fine inn', aristocratic: 'A grand inn' };

function menuBody(m) {
  return el('div', { class: 'menu-body' },
    m.special ? el('p', { class: 'menu-special' }, el('strong', {}, 'Today: '), m.special.name, m.special.note ? el('em', {}, ` (${m.special.note})`) : null, ', ', el('span', { class: 'menu-price' }, coinText(m.special.cp))) : null,
    m.sections.map((s) => el('div', { class: 'menu-sec' }, el('h4', {}, s.title),
      el('ul', { class: 'plain menu-items' }, s.items.map((x) => el('li', {}, el('span', {}, x.name), el('span', { class: 'menu-price' }, coinText(x.cp))))))));
}

// Order from the menu: food or drink for a character (players: their own), paid from their sheet by the server.
function orderPart(inn, m, rerender) {
  if (!isMember() || previewing()) return null;
  const chars = worldEntries().filter((c) => c.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status) && (isGm() || c.owner_id === session.gm?.id)).sort((a, b) => a.name.localeCompare(b.name));
  const nights = new Set(roomsOf(m).map((x) => x.name));
  const items = [...(m.special ? [m.special] : []), ...m.sections.filter((s) => !/night/i.test(s.title)).flatMap((s) => s.items)].filter((x) => x.cp > 0 && !nights.has(x.name));
  if (!chars.length || !items.length) return null;
  const who = el('select', { 'aria-label': 'Who’s ordering' }, chars.map((c) => el('option', { value: c.id }, c.name)));
  const what = el('select', { 'aria-label': 'What to order' }, items.map((x) => el('option', { value: x.name }, `${x.name} (${coinText(x.cp)})`)));
  const qty = el('input', { type: 'number', min: 1, max: 20, value: 1, class: 'qty', 'aria-label': 'How many' });
  const go = el('button', { class: 'btn small', type: 'button', onclick: async () => {
    const c = world.entries.get(who.value);
    const base = playOf(c);
    go.disabled = true;
    try {
      const r = await api('entries', { method: 'PATCH', body: { order: { tavern: inn.id, character: c.id, item: what.value, qty: Number(qty.value) || 1, base: { cp: base.cp, inventory: base.inventory } } } });
      for (const x of r.entries) world.entries.set(x.id, x);
      toast(`${c.name}: ${r.ordered.qty > 1 ? `${r.ordered.qty} × ` : ''}${r.ordered.name}, ${coinText(r.ordered.cp)}`);
      rerender();
    } catch (err) { toast(err.message, 'bad'); go.disabled = false; }
  } }, 'Order');
  // A round on the house (GMs): the chosen dish or drink for every active character, from the treasury, in one line.
  const party = worldEntries().filter((c) => c.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status));
  const round = isGm() && party.length > 1 ? el('button', { class: 'btn small ghost', type: 'button', onclick: async () => {
    const it = items.find((x) => x.name === what.value);
    if (!it) return;
    const cp = it.cp * party.length;
    round.disabled = true;
    try {
      await api('party', { method: 'POST', body: { cp: -cp, note: `A round on the house at ${inn.name}: ${it.name} for ${party.length}` } });
      const cur = world.entries.get(inn.id) || inn;
      await patchEntry(cur, { fields: { trade: addTrade(cur.fields?.trade, { who: 'The party', dir: 'buy', item: it.name, qty: party.length, cp }) } });
      toast(`A round of ${it.name} for ${party.length}: ${coinText(cp)} from the treasury`);
      rerender();
    } catch (err) { toast(err.message, 'bad'); round.disabled = false; }
  } }, `A round for all ${party.length}`) : null;
  return el('div', { class: 'menu-order controls' }, el('span', { class: 'eyebrow' }, 'Order'), who, what, qty, go, round);
}

// town: the settlement the tavern is in (for its size and name), or null.
export function menuCard(e, town, rerender) {
  const saved = readMenu(e.fields?.menu);
  const gm = isGm() && !previewing();
  if (!saved && !gm) return null;
  const rng = makeRng(`${e.id}-${Date.now()}`);
  const roll = () => rollMenu(rng, { size: town?.fields?.size || 'Town', town: town?.name || '' });
  let draft = null;
  const box = el('section', { class: 'card menu-card', 'aria-labelledby': `mn-${e.id}` });
  const keep = async (m) => {
    try { await patchEntry(e, { fields: { menu: m ? JSON.stringify(m) : '' } }); toast(m ? 'Menu kept: players can see it' : 'Menu taken down'); rerender(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const print = () => { document.body.classList.add('print-menu'); window.print(); setTimeout(() => document.body.classList.remove('print-menu'), 500); };
  function draw() {
    const m = draft || saved;
    setKids(box,
      el('div', { class: 'entry-head' }, el('h3', { id: `mn-${e.id}` }, `Bill of fare${m ? `: ${QUALITY[m.quality]}` : ''}`),
        m && !draft ? el('div', { class: 'btnrow' }, gm && roomsOf(m).length ? el('button', { class: 'btn small', type: 'button', onclick: () => stayDialog(e, m, rerender) }, 'Stay the night…') : null,
          el('button', { class: 'btn small ghost', type: 'button', onclick: print }, 'Print')) : null),
      m ? menuBody(m) : el('p', { class: 'muted small' }, `What’s on the board tonight: drinks, dishes and a bed, priced for ${town ? town.name : 'a town this size'}.`),
      m && !draft ? orderPart(e, m, rerender) : null,
      m && !draft && !e.fields?.stock ? tradeLedger(e) : null,
      gm ? el('div', { class: 'btnrow' },
        draft ? [el('button', { class: 'btn small primary', type: 'button', onclick: () => keep(draft) }, 'Keep this menu'),
          el('button', { class: 'btn small', type: 'button', onclick: () => { draft = roll(); draw(); } }, '↻ Another'),
          el('button', { class: 'btn small ghost', type: 'button', onclick: () => { draft = null; draw(); } }, 'Cancel')]
          : [el('button', { class: 'btn small', type: 'button', onclick: () => { draft = roll(); draw(); } }, saved ? 'Roll a new menu' : 'Roll a menu'),
            saved ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => keep(null) }, 'Take it down') : null]) : null,
      draft ? el('p', { class: 'muted small' }, 'Only you see this until you keep it.') : null);
  }
  draw();
  return box;
}
