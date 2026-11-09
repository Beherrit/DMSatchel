// Who's who: a printable cast list of the people the party has met (from the session log), with pictures,
// pronunciations and one line each. Built from what the viewer can see, so a player's copy is safe to hand round.
// Route: #world/whoswho
import { el } from './dom.js';
import { world, worldEntries, getEntry, link, mentions, notice } from './world-store.js';
import { hhmm } from './clock.js';
import { thumb } from './image-ui.js';
import { sayOf } from './say.js';
import { castList, sortCast } from './cast.js';
import { stripMarks } from './rich.js';
import { ageOf, ageText } from './birthdays.js';
import { worldCalendar } from './world-calendar.js';
import { dayLine } from './routine.js';
import { isHired } from './hirelings.js';
import { sceneOf, quoteOf } from './appearances.js';
import { openBounties } from './bounty.js';
import { PLACE_KINDS } from './world-schema.js';
import { whereNow } from './world-routine.js';

// Routines on the cast list: where they're usually found by day (morning, else afternoon), from their routine.
const usually = (e) => { if (isHired(e)) return 'Travelling with the party'; const d = dayLine(e.fields?.routine); return d ? `Usually ${d}` : ''; };
const line = (e) => { const s = stripMarks(e.summary || '').replace(/\s+/g, ' ').trim(); return s.length > 150 ? `${s.slice(0, 149)}…` : s; };

export function viewWhosWho() {
  // Sort the cast: by name, by how long since each was last seen, or by how often (kept in this browser).
  let by = 'name';
  try { by = localStorage.getItem('satchel-cast-sort') || 'name'; } catch { /* fine */ }
  const cast = sortCast(castList(worldEntries(), mentions), by);
  const sortBtns = el('div', { class: 'seg small-seg cast-sort', role: 'group', 'aria-label': 'Sort the cast' }, [['name', 'By name'], ['unseen', 'Longest unseen'], ['seen', 'Most seen']].map(([v, t]) =>
    el('button', { type: 'button', 'aria-pressed': String(by === v), onclick: () => { try { localStorage.setItem('satchel-cast-sort', v); } catch { /* fine */ } window.dispatchEvent(new Event('world:rerender')); } }, t)));
  const head = el('div', { class: 'panel-head row card-tools' },
    el('div', {}, el('h2', {}, 'Who’s who'), el('p', {}, 'Everyone the party has met, from the session log: who they are, how to say their name, and when they were last seen.')),
    cast.length ? el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print')) : null);
  if (!cast.length) return el('div', { class: 'w-view' }, head, notice('Nobody yet', 'When a session’s log links an NPC ([[Name]]) or connects to them, they join the cast here.'));
  // Wanted on the cast list: open bounties, by who's wanted.
  const wanted = new Map(openBounties(worldEntries()).map((b) => [b.entry.id, b]));
  return el('div', { class: 'w-view whoswho-view' }, head, sortBtns,
    el('ul', { class: 'plain cast-list' }, cast.map(({ entry: e, count, last }) => {
      const f = e.fields || {};
      const where = getEntry(e.parent_id);
      return el('li', { class: `cast${f.status === 'Dead' ? ' dead' : ''}` },
        thumb(e, 'avatar') || el('span', { class: 'avatar cast-blank', 'aria-hidden': 'true' }, e.name.slice(0, 1)),
        el('div', {},
          el('div', { class: 'cast-name' }, link(e), f.status === 'Dead' ? [' ', el('span', { class: 'tag' }, 'dead')] : null,
            wanted.has(e.id) ? [' ', el('span', { class: 'tag cast-wanted' }, `🎯 wanted: ${wanted.get(e.id).text}`)] : null, sayOf(e) ? el('span', { class: 'cast-say' }, ` (${sayOf(e)})`) : null),
          el('div', { class: 'small muted' }, [f.role, ageOf(worldCalendar(), e) ? ageText(ageOf(worldCalendar(), e)) : '', where?.name].filter(Boolean).join(' · ')),
          usually(e) ? el('div', { class: 'small cast-where' }, usually(e)) : null,
          // Where they are now, by the world's clock.
          (() => { const w = whereNow(e); return w ? el('div', { class: 'small cast-now' }, `🕰 Now (${hhmm(world.info.clock.minutes)}): `, w.party ? 'with the party' : [typeof w.place === 'string' ? w.place : link(w.place), w.until !== null ? ` until ${hhmm(w.until)}` : '']) : null; })(),
          line(e) ? el('p', { class: 'small' }, line(e)) : null,
          el('div', { class: 'small muted' }, `Met in ${count} session${count === 1 ? '' : 's'} · last in `, link(last), (() => { const at = sceneOf(last, mentions, getEntry, PLACE_KINDS, e); return at ? [', at ', link(at)] : null; })()),
          // What happened, on the cast list: the line of that log that names them.
          (() => { const q = quoteOf(last, e, 160); return q ? el('q', { class: 'small cast-quote' }, q) : null; })()));
    })));
}
