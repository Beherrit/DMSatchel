// Tavern menu: on a tavern's page, its bill of fare (if it has one) for everyone; GMs roll one priced to suit the
// town, roll again, keep it, or take it down. Print gives just the menu, to put on the table.
import { el, toast, setKids } from './dom.js';
import { isGm, previewing } from './api.js';
import { patchEntry } from './world-store.js';
import { makeRng } from './rng.js';
import { rollMenu, readMenu } from './menu.js';
import { coinText } from './economy.js';

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
        m && !draft ? el('button', { class: 'btn small ghost', type: 'button', onclick: print }, 'Print') : null),
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
