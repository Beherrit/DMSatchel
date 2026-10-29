// Who's who: the people the party has met, from the session log (a session counts someone when its log links
// them, or they're among its connections). Pure, so it can be tested; idsIn reads [[links]] from text.
import { appearances } from './appearances.js';

// → [{ entry, count, last }] alphabetical; the dead stay on the list (marked by the page).
export function castList(entries, idsIn) {
  const seen = appearances(entries, idsIn);
  return (entries || []).filter((e) => e.kind === 'npc' && seen.has(e.id))
    .map((e) => ({ entry: e, count: seen.get(e.id).count, last: seen.get(e.id).last }))
    .sort((a, b) => a.entry.name.localeCompare(b.entry.name, undefined, { sensitivity: 'base' }));
}
