// Tavern menu: on a tavern's page, its bill of fare (if it has one) for everyone; GMs roll one priced to suit the
// town, roll again, keep it, or take it down. Print gives just the menu, to put on the table.
import { el, toast, setKids } from './dom.js';
import { api, isGm, previewing } from './api.js';
import { world, worldEntries, patchEntry } from './world-store.js';
import { makeRng } from './rng.js';
import { rollMenu, readMenu } from './menu.js';
import { coinText } from './economy.js';
import { playOf, addCoins } from './sheet-ui.js';
import { roomsOf, nightCosts, minutesToMorning } from './inn.js';
import { formatDate, today } from './calendar.js';

const ACTIVE = (c) => c.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status);

// GMs: the party takes rooms for the night. Each character pays from their own coin, and the clock moves on to 8 in
// the morning (a new day on the calendar if it passes midnight; living costs aren't asked for, the room is the cost).
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
    el('p', { class: 'muted small' }, 'The clock moves on to 8 in the morning.'),
    el('div', { class: 'btnrow' }, go, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const p = plan();
    if (!p.length) { d.close(); return; }
    go.disabled = true;
    const failed = [];
    for (const x of p) if (x.paid) { try { await addCoins(chars.find((c) => c.id === x.id), -x.paid); } catch { failed.push(x.name); } }
    try {
      const r = await api('settings', { method: 'PATCH', body: { clock: { advance: minutesToMorning(world.info?.clock?.minutes ?? 480) } } });
      world.info = { ...world.info, clock: r.clock, ...(r.cal ? { cal: r.cal } : {}) };
      const notes = [`The party slept at ${inn.name}`, r.cal && r.days ? `it’s morning on ${formatDate(r.cal, today(r.cal), { weekday: true })}` : 'it’s morning', r.out?.length ? `${r.out.join(', ')} went out` : '', failed.length ? `these sheets didn’t update: ${failed.join(', ')}` : ''].filter(Boolean);
      toast(notes.join(' · '), failed.length ? 'bad' : undefined);
    } catch (err) { toast(`Paid, but the clock didn’t move: ${err.message}`, 'bad'); }
    d.close();
    rerender();
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}

const QUALITY = { poor: 'A poor alehouse', modest: 'A modest inn', comfortable: 'A comfortable inn', wealthy: 'A fine inn', aristocratic: 'A grand inn' };

function menuBody(m) {
  return el('div', { class: 'menu-body' },
    m.special ? el('p', { class: 'menu-special' }, el('strong', {}, 'Today: '), m.special.name, m.special.note ? el('em', {}, ` (${m.special.note})`) : null, ', ', el('span', { class: 'menu-price' }, coinText(m.special.cp))) : null,
    m.sections.map((s) => el('div', { class: 'menu-sec' }, el('h4', {}, s.title),
      el('ul', { class: 'plain menu-items' }, s.items.map((x) => el('li', {}, el('span', {}, x.name), el('span', { class: 'menu-price' }, coinText(x.cp))))))));
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
