// A party sheet for the GM's screen (GMs): every active character on one printable page: hit points, armour class,
// passive Perception, coin and what they carry, with exhaustion and conditions under the name.
// Route: #world/screen
import { el } from './dom.js';
import { isGm } from './api.js';
import { worldEntries, link, notice } from './world-store.js';
import { playOf, characterOf } from './sheet-ui.js';
import { coinText } from './economy.js';
import { screenRows } from './party-screen.js';
import { lbs } from './weights.js';
import { partyDebts } from './debts.js';

const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);

export function viewScreen() {
  if (!isGm()) return el('div', { class: 'w-view' }, notice('For the GMs', 'The party sheet for the GM’s screen is for the GMs. Your own sheet is on your character’s page.'));
  const chars = worldEntries().filter(ACTIVE).sort((a, b) => a.name.localeCompare(b.name));
  const head = el('div', { class: 'panel-head row card-tools' },
    el('div', {}, el('h2', {}, 'Party sheet'), el('p', {}, 'Every character on one page for behind the screen: hit points, armour class, passive Perception, coin (and what their gear would fetch), what they carry and what it weighs. It prints on a single sheet.')),
    chars.length ? el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print'), el('a', { class: 'btn', href: '#world/party' }, 'Back to the party')) : null);
  if (!chars.length) return el('div', { class: 'w-view' }, head, notice('No characters yet', 'When the party has characters, they line up here.'));
  const rows = screenRows(chars.map((e) => {
    const ch = characterOf(e), f = e.fields || {};
    return { id: e.id, name: e.name, about: [f.species, f.class, f.level && `level ${f.level}`, f.player && `(${f.player})`].filter(Boolean).join(' '), play: playOf(e), stats: ch?.stats || null, str: ch?.abilities?.scores?.Str ?? null, size: ch?.size || 'Medium' };
  }));
  const byId = new Map(chars.map((e) => [e.id, e]));
  const debts = partyDebts(chars.map((e) => ({ id: e.id, name: e.name, play: playOf(e) })));
  return el('div', { class: 'w-view screen-view' }, head,
    el('div', { class: 'table-wrap' }, el('table', { class: 'screen-table' },
      el('thead', {}, el('tr', {}, ['Character', 'HP', 'AC', 'Passive Perception', 'Coin', 'Load', 'Carrying'].map((h, i) => el('th', { scope: 'col', class: i && i < 6 ? 'num' : null }, h)))),
      el('tbody', {}, rows.map((r) => el('tr', {},
        el('th', { scope: 'row' }, link(byId.get(r.id)), r.about ? el('div', { class: 'small muted' }, r.about) : null,
          r.exhaustion || r.conditions.length ? el('div', { class: 'small screen-worry' }, [r.exhaustion ? `Exhaustion ${r.exhaustion}` : '', ...r.conditions].filter(Boolean).join(', ')) : null),
        el('td', { class: 'num' }, r.max ? `${r.hp} / ${r.max}` : r.hp || '—', r.temp ? el('div', { class: 'small muted' }, `+${r.temp} temp`) : null),
        el('td', { class: 'num' }, r.ac ?? '—'),
        el('td', { class: 'num' }, r.passive ?? '—'),
        el('td', { class: 'num' }, coinText(r.cp), r.goods ? el('div', { class: 'small muted' }, `+ ${coinText(r.goods)} in gear`) : null),
        el('td', { class: `num${r.load.over ? ' screen-worry' : ''}` }, r.load.capacity ? `${lbs(r.load.lb)} / ${lbs(r.load.capacity)}` : lbs(r.load.lb), r.load.over ? el('div', { class: 'small' }, 'over capacity') : null),
        el('td', { class: 'screen-carry small' }, r.carry || '—')))))),
    debts.length ? el('p', { class: 'small screen-debts' }, el('strong', {}, 'Who owes whom: '), debts.map((d) => `${d.from} owes ${d.to} ${coinText(d.cp)}${d.note ? ` (${d.note})` : ''}`).join('; '), '.') : null);
}
