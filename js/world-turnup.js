// Who might turn up: the people in a place the party has met before but not lately (or key people not met yet), with
// where and when each was last seen. Session prep shows it for where the party is; a settlement's page for GMs.
import { el } from './dom.js';
import { worldEntries, getEntry, link, descendantsOf, mentions } from './world-store.js';
import { PLACE_KINDS } from './world-schema.js';
import { appearances, dueBack, sceneOf, quoteOf } from './appearances.js';

// → [{ person, seen }] (seen: appearances' { count, last, ago } or undefined), at most `max`.
export function turnUp(town, max = 8) {
  const people = descendantsOf(town.id).filter((e) => e.kind === 'npc' && e.fields?.status !== 'Dead');
  const seen = appearances(worldEntries(), mentions);
  return dueBack(people, seen).slice(0, max).map((person) => ({ person, seen: seen.get(person.id) }));
}

// "Last seen in Session 4, at The Bell, 3 sessions ago · met 2 times" (the place from that session's log).
function lastSeenBits(p, s) {
  const at = sceneOf(s.last, mentions, getEntry, PLACE_KINDS, p);
  return ['Last seen in ', link(s.last), at ? [', at ', link(at)] : '', `, ${s.ago} sessions ago`, s.count > 1 ? ` · met ${s.count} times` : ''];
}

export const turnUpNote = 'People here the party has met before but not in the last two sessions, then key people they haven’t met yet.';

export const turnUpList = (due) => el('ul', { class: 'plain prep-list turn-up-list' }, due.map(({ person: p, seen: s }) => el('li', {},
  link(p), p.fields?.role ? el('span', { class: 'muted small' }, ` ${p.fields.role}`) : null,
  el('div', { class: 'muted small prep-last-seen' }, s ? lastSeenBits(p, s) : 'Key person, not met yet'),
  // What happened, in prep: the line from when they were last seen.
  (() => { const q = s && quoteOf(s.last, p, 160); return q ? el('q', { class: 'small last-seen-quote' }, q) : null; })())));
