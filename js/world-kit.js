// Everything the party carries: one list, printable, of every active character's gear and the treasury's, merged by
// name, with who has how many. Route: #world/kit
import { el } from './dom.js';
import { api } from './api.js';
import { worldEntries, getEntry, link, notice } from './world-store.js';
import { playOf } from './sheet-ui.js';
import { everything } from './who-has.js';

const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);

export async function viewKit() {
  const chars = worldEntries().filter(ACTIVE).sort((a, b) => a.name.localeCompare(b.name));
  let stash = [];
  try { stash = (await api('party')).items || []; } catch { /* the list shows the characters' gear alone */ }
  const list = everything(chars.map((c) => ({ id: c.id, name: c.name, inventory: playOf(c).inventory })), stash);
  const head = el('div', { class: 'panel-head row card-tools' },
    el('div', {}, el('h2', {}, 'Everything the party carries'), el('p', {}, `Every character’s gear and the treasury’s, in one list${list.length ? ` (${list.length} things)` : ''}.`)),
    el('div', { class: 'btnrow' }, list.length ? el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print') : null, el('a', { class: 'btn', href: '#world/party' }, 'Back to the party')));
  if (!list.length) return el('div', { class: 'w-view' }, head, notice('Nothing carried yet', 'When the characters’ sheets list their gear, or the treasury holds things, they show here.'));
  return el('div', { class: 'w-view kit-view' }, head,
    el('div', { class: 'table-wrap' }, el('table', { class: 'kit-table' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Item'), el('th', { scope: 'col', class: 'num' }, 'In all'), el('th', { scope: 'col' }, 'Who has it'))),
      el('tbody', {}, list.map((x) => el('tr', {},
        el('th', { scope: 'row' }, x.item),
        el('td', { class: 'num' }, String(x.total)),
        el('td', {}, x.holders.map((h, i) => [i ? ', ' : '', h.id ? link(getEntry(h.id) || { id: h.id, name: h.who }) : h.who, h.qty > 1 ? ` ${h.qty}` : '']))))))));
}
