// A printable page for a world character (#world/print/<id>): who they are, the numbers from their saved sheet,
// their play state (hit points, coin, inventory, notes), goals and backstory, laid out for paper.
import { el } from './dom.js';
import { getEntry, notice, link } from './world-store.js';
import { characterOf, playOf, vitals, fullSheet } from './sheet-ui.js';
import { abilityMod, fmtMod } from './character.js';
import { ABILITIES, ABILITY_NAMES } from './rules2024.js';
import { coinText } from './economy.js';
import { readGoals } from './goals.js';
import { pictureOf } from './image-ui.js';
import { withPronouns } from './world-profiles.js';

const plain = (t) => String(t || '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a);
const box = (title, ...kids) => el('section', { class: 'pr-box' }, el('h3', {}, title), ...kids);
const lines = (t) => plain(t).split('\n').filter((x) => x.trim()).map((x) => el('li', {}, x));

export function viewPrintCharacter(id) {
  const e = getEntry(id);
  if (!e || e.kind !== 'character') return notice('Not found', 'That character doesn’t exist, or you can’t see it.');
  const ch = characterOf(e), s = ch?.stats, p = playOf(e), v = vitals(e);
  const pic = pictureOf(e);
  const goals = readGoals(e).filter((g) => g.state !== 'done');
  return el('div', { class: 'w-view print-char' },
    el('div', { class: 'btnrow pr-tools' }, el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print'), link(e, `Back to ${e.name}`)),
    el('header', { class: 'pr-head' },
      pic ? el('img', { class: 'pr-pic', src: pic, alt: '' }) : null,
      el('div', {}, el('h2', {}, e.name),
        el('p', {}, s ? `Level ${s.level} ${ch.species}${ch.lineage ? ` (${ch.lineage})` : ''} ${ch.cls}${ch.subclass ? `, ${ch.subclass}` : ''} · ${ch.background} · ${ch.alignment}`
          : [e.fields?.species, e.fields?.class, e.fields?.level && `level ${e.fields.level}`, e.fields?.background].filter(Boolean).join(' · ')),
        e.owner_id || e.fields?.player ? el('p', { class: 'small' }, `Player: ${e.owner_id ? withPronouns(e.owner_id, e.owner) : e.fields.player}`) : null)),
    el('div', { class: 'pr-stats' },
      [['AC', v.ac || '—'], ['Hit points', v.max ? `${v.hp} / ${v.max}${v.temp ? ` (+${v.temp} temp)` : ''}` : '—'],
        ...(s ? [['Initiative', fmtMod(s.initiative)], ['Speed', `${s.speed - (p.exhaustion || 0) * 5} ft`], ['Proficiency', fmtMod(s.pb)], ['Passive Perception', s.passive]] : [])]
        .map(([l, x]) => el('div', { class: 'pr-stat' }, el('span', {}, l), el('strong', {}, String(x))))),
    s ? el('div', { class: 'pr-abilities' }, ABILITIES.map((k) => el('div', { class: 'pr-ab' }, el('span', {}, ABILITY_NAMES[k]), el('strong', {}, fmtMod(abilityMod(ch.abilities.scores[k]))), el('span', { class: 'small' }, ch.abilities.scores[k])))) : null,
    v.conditions.length || v.exhaustion || v.inspiration ? el('p', { class: 'small' }, [...v.conditions, v.exhaustion ? `Exhaustion ${v.exhaustion}` : '', v.inspiration ? 'Heroic Inspiration' : ''].filter(Boolean).join(' · ')) : null,
    s ? el('div', { class: 'pr-sheet' }, fullSheet(ch)) : e.fields?.sheet ? box('Sheet', el('pre', { class: 'pr-pre' }, e.fields.sheet)) : null,
    el('div', { class: 'pr-cols' },
      box('Coin and gear', el('p', {}, el('strong', {}, coinText(p.cp))), p.inventory ? el('ul', { class: 'pr-list' }, lines(p.inventory)) : el('p', { class: 'muted' }, 'Nothing listed.')),
      box('Notes', p.notes ? el('ul', { class: 'pr-list' }, lines(p.notes)) : el('p', { class: 'muted' }, '—'))),
    goals.length ? box('Goals', el('ul', { class: 'pr-list' }, goals.map((g) => el('li', {}, `${plain(g.text)} (${g.term === 'long' ? 'long term' : 'short term'}${g.state === 'advanced' ? ', advanced' : ''})`)))) : null,
    e.summary || e.body ? box('Story', e.summary ? el('p', {}, plain(e.summary)) : null, e.body ? el('div', { class: 'pr-story' }, plain(e.body)) : null) : null);
}
