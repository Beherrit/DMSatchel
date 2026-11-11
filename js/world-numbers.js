// The world in numbers: counts and fun facts from what this person can see. Route: #world/numbers
import { el } from './dom.js';
import { worldEntries, link, kindLabel, mentions, notice, getEntry, findByName } from './world-store.js';
import { appearances, sessionOrder } from './appearances.js';
import { sessionGaps, pace, playingSince } from './session-gaps.js';
import { worldCalendar } from './world-calendar.js';
import { KINDS } from './world-schema.js';
import { worldStats } from './world-stats.js';
import { journalWriters } from './journal-streaks.js';
import { isProphecy } from './world-objectives.js';
import { readObjectives, progress } from './objectives.js';
import { readSolved } from './riddle.js';
import { averageLength, lengthText } from './session-timer.js';
import { spending, topGoods, spots, purchases } from './purchases.js';
import { coinText } from './economy.js';

const compact = (n) => (n >= 10000 ? new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n) : n.toLocaleString());
const tile = (label, value, sub) => el('div', { class: 'stat-tile card' }, el('span', { class: 'stat-label' }, label), el('span', { class: 'stat-value' }, compact(value)), sub ? el('span', { class: 'stat-sub small' }, sub) : null);
const ranked = (title, rows, unit) => (rows.length ? el('section', { class: 'card num-card' }, el('h3', {}, title),
  el('ol', { class: 'num-list' }, rows.map(([who, n]) => el('li', {}, typeof who === 'string' ? el('span', {}, who) : link(who), el('span', { class: 'muted small' }, ` ${unit(n)}`))))) : null);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function viewNumbers() {
  const s = worldStats(worldEntries(), mentions);
  const head = el('div', { class: 'panel-head' }, el('h2', {}, 'The world in numbers'), el('p', {}, 'Counts and fun facts from everything you can see in this world.'));
  if (!s.entries) return el('div', { class: 'w-view' }, head, notice('Nothing to count yet', 'Add a few entries and the numbers start here.'));
  return el('div', { class: 'w-view numbers-view' }, head,
    el('div', { class: 'stat-grid' },
      tile('Entries', s.entries, plural(s.kinds.length, 'kind')),
      tile('Words written', s.words),
      tile('Sessions played', s.sessions.count, s.sessions.first && s.sessions.last && s.sessions.count > 1 ? `${s.sessions.first.name} to ${s.sessions.last.name}` : null),
      tile('Player characters', s.characters, s.fallen ? `${s.fallen} fallen` : null),
      tile('Quests completed', s.questsDone),
      // Playing since: the first session played, and how long ago.
      (() => { const p = playingSince(sessionOrder(worldEntries()), new Date().toISOString().slice(0, 10)); return p ? tile('Playing since', p.date, p.ago) : null; })(),
      // Average session: how long sessions run, from the lengths written on their logs.
      (() => { const a = averageLength(worldEntries().filter((x) => x.kind === 'session').map((x) => x.fields?.length)); return a ? tile('Average session', lengthText(a.minutes), `over ${plural(a.count, 'session')}`) : null; })(),
      // Pace of play: how often the table meets, and how many in-world days pass per session.
      (() => { const p = pace(sessionGaps(sessionOrder(worldEntries()), worldCalendar())); if (p.real === null && p.world === null) return null;
        return tile('Pace of play', p.real !== null ? (p.real === 0 ? 'Same day' : `Every ${p.real} day${p.real === 1 ? '' : 's'}`) : '—', p.world !== null ? `${p.world} in-world day${p.world === 1 ? '' : 's'} a session` : null); })()),
    el('div', { class: 'num-grid' },
      ranked('Most talked-about NPCs', s.mentionedNpcs, (n) => `in ${plural(n, 'entry', 'entries')}`),
      // Who comes up most: the people, places and quests the session logs name in the most sessions.
      ranked('Who comes up most in the logs', [...appearances(worldEntries(), mentions)].map(([id, a]) => [getEntry(id), a.count])
        .filter(([x, n]) => x && n > 1 && ['npc', 'character', 'location', 'settlement', 'region', 'area', 'quest', 'faction'].includes(x.kind))
        .sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name)).slice(0, 8), (n) => `in ${plural(n, 'session')}`),
      // Who writes the journals: entries per writer, and their best run of sessions in a row written about.
      (() => { const ss = sessionOrder(worldEntries()).slice().reverse(), ids = new Set(ss.map((x) => x.id));
        const js = worldEntries().filter((x) => x.kind === 'journal').map((x) => ({ author: x.owner || x.fields?.character || '', about: [...new Set([...mentions([x.summary, x.body].join('\n')), ...(x.links || []).map((l) => l.id)])].filter((id) => ids.has(id)) }));
        const w = journalWriters(ss.map((x) => x.id), js).slice(0, 8);
        return w.length ? el('section', { class: 'card num-card journal-writers' }, el('h3', {}, 'Who writes the journals'),
          el('ol', { class: 'num-list' }, w.map((x) => el('li', {}, el('span', {}, x.author), el('span', { class: 'muted small' }, ` ${plural(x.entries, 'entry', 'entries')}${x.best > 1 ? ` · ${x.best} sessions in a row${x.now > 1 && x.now < x.best ? ` (${x.now} now)` : x.now === x.best ? ', going now' : ''}` : ''}`))))) : null; })(),
      // Coin spent: what each character has spent at shops, stalls and taverns (from their logs, the last 30 lines each).
      (() => { const sp = spending(worldEntries().filter((c) => c.kind === 'character')).filter((x) => x.cp > 0).slice(0, 8);
        return sp.length ? el('section', { class: 'card num-card coin-spent' }, el('h3', {}, 'Coin spent'),
          el('ol', { class: 'num-list' }, sp.map((x) => el('li', {}, link(x.who), el('span', { class: 'muted small' }, ` ${coinText(x.cp)} on ${plural(x.count, 'purchase')}`)))),
          el('p', { class: 'muted small' }, 'From each sheet’s recent log: shops, market stalls and taverns.')) : null; })(),
      // Most-bought goods: what the party buys most, from the characters' recent logs.
      ranked('Most-bought goods', topGoods(worldEntries().filter((c) => c.kind === 'character')).slice(0, 8).map((g) => [g.name, g]), (g) => `bought ${g.times === 1 ? 'once' : g.times === 2 ? 'twice' : `${g.times} times`}${g.qty !== g.times ? ` (${g.qty} in all)` : ''}`),
      // Busiest taverns: the party's orders at each tavern (from the characters' logs), linked when it's in the world.
      ranked('Busiest taverns', spots(purchases(worldEntries().filter((c) => c.kind === 'character')), 'tavern').slice(0, 8).map((x) => [findByName(x.place) || x.place, x]), (x) => plural(x.count, 'order')),
      // What the party has made: crafting downtime that's done (resolved, or the item handed over), newest first.
      (() => { const made = worldEntries().filter((d) => d.kind === 'downtime' && d.fields?.craft && (d.fields.resolved || d.fields.handed)).sort((a, b) => String(b.fields.resolved || b.updated_at).localeCompare(String(a.fields.resolved || a.updated_at)));
        return made.length ? el('section', { class: 'card num-card crafted' }, el('h3', {}, `What the party has made (${made.length})`),
          el('ul', { class: 'num-list plain-list' }, made.slice(0, 10).map((d) => { const c = getEntry(d.fields.character); return el('li', {}, `🔨 ${d.fields.craft}`, el('span', { class: 'muted small' }, ' by '), c ? link(c) : 'someone'); }))) : null; })(),
      // Prophecies: how close each is, by its signs come to pass.
      ranked('Prophecies', worldEntries().filter(isProphecy).map((p) => [p, progress(readObjectives(p))]).filter(([, pr]) => pr.total).sort((a, b) => b[1].pct - a[1].pct || a[0].name.localeCompare(b[0].name)).slice(0, 8),
        (pr) => (pr.done === pr.total ? '✨ fulfilled' : `${pr.done} of ${pr.total} signs`)),
      // Riddles solved: each riddle (a handout with an answer) and who solved it, solved ones first.
      (() => { const rs = worldEntries().filter((h) => h.kind === 'handout' && (h.fields?.answer || h.fields?.riddle === 'yes')).map((h) => ({ h, by: readSolved(h.fields?.solved) }))
        .sort((a, b) => b.by.length - a.by.length || a.h.name.localeCompare(b.h.name));
        if (!rs.length) return null; const done = rs.filter((r) => r.by.length).length;
        return el('section', { class: 'card num-card riddles' }, el('h3', {}, `Riddles solved (${done} of ${rs.length})`),
          el('ul', { class: 'num-list plain-list' }, rs.slice(0, 10).map((r) => el('li', {}, `🧩 `, link(r.h), el('span', { class: 'muted small' }, r.by.length ? ` solved by ${r.by.map((x) => x.name).join(', ')}` : ' unsolved'))))); })(),
      ranked('Busiest places', s.busiestPlaces, (n) => `${n} inside`),
      ranked('Who has written the most', s.writers, (n) => plural(n, 'entry', 'entries')),
      el('section', { class: 'card num-card' }, el('h3', {}, 'Records'),
        el('ul', { class: 'num-list plain-list' },
          s.mostConnected ? el('li', {}, 'Most connected: ', link(s.mostConnected[0]), el('span', { class: 'muted small' }, ` (${plural(s.mostConnected[1], 'entry', 'entries')} point to it)`)) : null,
          s.longestQuest ? el('li', {}, 'Longest-running quest: ', link(s.longestQuest.quest), el('span', { class: 'muted small' }, ` (open ${plural(s.longestQuest.days, 'day')})`)) : null,
          el('li', {}, 'Most common: ', s.kinds.slice(0, 3).map(([k, n], i) => [i ? ', ' : '', `${(KINDS[k]?.plural || kindLabel(k)).toLowerCase()} (${n})`])))),
    ));
}
