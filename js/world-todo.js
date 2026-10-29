// "What needs writing" (GMs): thin spots to fill in before the party gets there. Route: #world/todo
import { el } from './dom.js';
import { isGm } from './api.js';
import { worldEntries, link, kindLabel, byName, getEntry, notice } from './world-store.js';
import { thinSpots } from './thin.js';

const GROUPS = [
  ['undescribed', 'No summary or description', 'A line or two each is enough to run them at the table.'],
  ['flatNpcs', 'NPCs without a voice or wants', 'How they sound and what they want makes them easy to play.'],
  ['emptyPlaces', 'Places with nobody in them', 'Towns and locations with no NPCs inside yet.'],
  ['questsNoSteps', 'Open quests with no objectives', 'A few steps make progress easy to see.'],
  ['unconnected', 'Not connected to anything', 'Not inside a place and with no connections, so nothing leads to them.'],
  ['longHidden', 'Hidden from players for over a month', 'Still secret, or ready to reveal?'],
];

export function viewTodo() {
  if (!isGm()) return notice('GMs only', 'This page finds thin spots in the world for the GMs to fill in.');
  const spots = thinSpots(worldEntries());
  const total = GROUPS.reduce((t, [k]) => t + spots[k].length, 0);
  return el('div', { class: 'w-view todo-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'What needs writing'), el('p', {}, total ? `${total} thin spot${total === 1 ? '' : 's'} to fill in, most useful first.` : 'Nothing thin: every entry has something written, every place has people in it.'),
      el('p', { class: 'small' }, el('a', { href: '#world/dupes' }, 'Likely duplicates'), ': entries that may be the same thing, to merge.')),
    GROUPS.map(([k, title, hint]) => {
      const list = [...spots[k]].sort(byName);
      return list.length ? el('section', { class: 'card todo-group' }, el('h3', {}, `${title} (${list.length})`), el('p', { class: 'muted small' }, hint),
        el('ul', { class: 'plain todo-list' }, list.slice(0, 40).map((e) => el('li', {}, link(e), el('span', { class: 'muted small' }, ` ${kindLabel(e.kind)}${getEntry(e.parent_id) ? ` · in ${getEntry(e.parent_id).name}` : ''}`),
          el('a', { class: 'btn small ghost', href: `#world/edit/${e.id}` }, 'Edit')))),
        list.length > 40 ? el('p', { class: 'muted small' }, `and ${list.length - 40} more`) : null) : null;
    }));
}
