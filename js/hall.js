// Hall of heroes: characters whose story ended (died, retired or went missing), with how and when, an epitaph from
// their player, and the sessions they played. Pure, so it can be tested.
import { readAttendance } from './advancement.js';
import { sessionOrder } from './appearances.js';

export const ENDED = ['Dead', 'Retired', 'Missing'];
export const hasEnded = (c) => c?.kind === 'character' && ENDED.includes(c.fields?.status);

// The sessions a character played, oldest first: on the attendance list, or linked from the session log.
// idsIn(text) → the ids the text links (an array or a Set).
export function sessionsPlayed(c, entries, idsIn = () => []) {
  return sessionOrder(entries).reverse().filter((s) => readAttendance(s).chars.some((x) => x.id === c.id)
    || (s.links || []).some((l) => l.id === c.id)
    || new Set(idsIn([s.summary, s.body, ...Object.values(s.fields || {}).filter((v) => typeof v === 'string')].join('\n'))).has(c.id));
}

// → [{ character, sessions, first, last }], the most recent farewells first (by their last session, then by when
// the entry last changed).
export function hallOfHeroes(entries, idsIn) {
  const order = new Map(sessionOrder(entries).reverse().map((s, i) => [s.id, i]));
  return (entries || []).filter(hasEnded).map((c) => {
    const sessions = sessionsPlayed(c, entries, idsIn);
    return { character: c, sessions, first: sessions[0] || null, last: sessions.at(-1) || null };
  }).sort((a, b) => (order.get(b.last?.id) ?? -1) - (order.get(a.last?.id) ?? -1) || String(b.character.updated_at).localeCompare(String(a.character.updated_at)));
}
