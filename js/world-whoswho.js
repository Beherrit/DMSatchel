// Who's who: a printable cast list of the people the party has met (from the session log), with pictures,
// pronunciations and one line each. Built from what the viewer can see, so a player's copy is safe to hand round.
// Route: #world/whoswho
import { el } from './dom.js';
import { worldEntries, getEntry, link, mentions, notice } from './world-store.js';
import { thumb } from './image-ui.js';
import { sayOf } from './say.js';
import { castList } from './cast.js';
import { stripMarks } from './rich.js';
import { ageOf, ageText } from './birthdays.js';
import { worldCalendar } from './world-calendar.js';

const line = (e) => { const s = stripMarks(e.summary || '').replace(/\s+/g, ' ').trim(); return s.length > 150 ? `${s.slice(0, 149)}…` : s; };

export function viewWhosWho() {
  const cast = castList(worldEntries(), mentions);
  const head = el('div', { class: 'panel-head row card-tools' },
    el('div', {}, el('h2', {}, 'Who’s who'), el('p', {}, 'Everyone the party has met, from the session log: who they are, how to say their name, and when they were last seen.')),
    cast.length ? el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print')) : null);
  if (!cast.length) return el('div', { class: 'w-view' }, head, notice('Nobody yet', 'When a session’s log links an NPC ([[Name]]) or connects to them, they join the cast here.'));
  return el('div', { class: 'w-view whoswho-view' }, head,
    el('ul', { class: 'plain cast-list' }, cast.map(({ entry: e, count, last }) => {
      const f = e.fields || {};
      const where = getEntry(e.parent_id);
      return el('li', { class: `cast${f.status === 'Dead' ? ' dead' : ''}` },
        thumb(e, 'avatar') || el('span', { class: 'avatar cast-blank', 'aria-hidden': 'true' }, e.name.slice(0, 1)),
        el('div', {},
          el('div', { class: 'cast-name' }, link(e), f.status === 'Dead' ? [' ', el('span', { class: 'tag' }, 'dead')] : null, sayOf(e) ? el('span', { class: 'cast-say' }, ` (${sayOf(e)})`) : null),
          el('div', { class: 'small muted' }, [f.role, ageOf(worldCalendar(), e) ? ageText(ageOf(worldCalendar(), e)) : '', where?.name].filter(Boolean).join(' · ')),
          line(e) ? el('p', { class: 'small' }, line(e)) : null,
          el('div', { class: 'small muted' }, `Met in ${count} session${count === 1 ? '' : 's'} · last in `, link(last))));
    })));
}
