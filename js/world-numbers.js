// The world in numbers: counts and fun facts from what this person can see. Route: #world/numbers
import { el } from './dom.js';
import { worldEntries, link, kindLabel, mentions, notice } from './world-store.js';
import { KINDS } from './world-schema.js';
import { worldStats } from './world-stats.js';

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
      tile('Quests completed', s.questsDone)),
    el('div', { class: 'num-grid' },
      ranked('Most talked-about NPCs', s.mentionedNpcs, (n) => `in ${plural(n, 'entry', 'entries')}`),
      ranked('Busiest places', s.busiestPlaces, (n) => `${n} inside`),
      ranked('Who has written the most', s.writers, (n) => plural(n, 'entry', 'entries')),
      el('section', { class: 'card num-card' }, el('h3', {}, 'Records'),
        el('ul', { class: 'num-list plain-list' },
          s.mostConnected ? el('li', {}, 'Most connected: ', link(s.mostConnected[0]), el('span', { class: 'muted small' }, ` (${plural(s.mostConnected[1], 'entry', 'entries')} point to it)`)) : null,
          s.longestQuest ? el('li', {}, 'Longest-running quest: ', link(s.longestQuest.quest), el('span', { class: 'muted small' }, ` (open ${plural(s.longestQuest.days, 'day')})`)) : null,
          el('li', {}, 'Most common: ', s.kinds.slice(0, 3).map(([k, n], i) => [i ? ', ' : '', `${(KINDS[k]?.plural || kindLabel(k)).toLowerCase()} (${n})`])))),
    ));
}
