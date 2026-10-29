// Their story so far: one character's thread through the campaign, from what the world already records. Pure, so it
// can be tested; idsIn(text) → the ids a text links (an array or a Set).
import { sessionsPlayed } from './hall.js';
import { readGoals } from './goals.js';
import { readWishes } from './wishes.js';

const textOf = (e) => [e.summary, e.body, ...Object.values(e.fields || {}).filter((v) => typeof v === 'string')].join('\n');

export function storyOf(c, entries, idsIn = () => []) {
  const sessions = sessionsPlayed(c, entries, idsIn);
  const touches = (e) => (e.links || []).some((l) => l.id === c.id) || new Set(idsIn(textOf(e))).has(c.id);
  const name = c.name.toLowerCase();
  return {
    sessions, first: sessions[0] || null, last: sessions.at(-1) || null,
    quests: (entries || []).filter((e) => e.kind === 'quest' && e.fields?.status === 'Completed' && touches(e)),
    goals: readGoals(c).filter((g) => g.state === 'done'),
    wishes: readWishes(c).filter((w) => w.got),
    items: (entries || []).filter((e) => e.kind === 'item' && String(e.fields?.holder || '').trim().toLowerCase() === name),
  };
}

export const storyEmpty = (s) => !s.sessions.length && !s.quests.length && !s.goals.length && !s.wishes.length && !s.items.length;
