// Who's who: the people the party has met, from the session log (a session counts someone when its log links
// them, or they're among its connections). Pure, so it can be tested; idsIn reads [[links]] from text.
import { appearances } from './appearances.js';

// → [{ entry, count, last }] alphabetical; the dead stay on the list (marked by the page).
export function castList(entries, idsIn) {
  const seen = appearances(entries, idsIn);
  return (entries || []).filter((e) => e.kind === 'npc' && seen.has(e.id))
    .map((e) => ({ entry: e, count: seen.get(e.id).count, last: seen.get(e.id).last, ago: seen.get(e.id).ago, first: seen.get(e.id).first }))
    .sort((a, b) => a.entry.name.localeCompare(b.entry.name, undefined, { sensitivity: 'base' }));
}

// Sort the cast: 'name' (A to Z), 'unseen' (longest since last seen first) or 'seen' (met in the most sessions first);
// ties by name.
export function sortCast(list, by = 'name') {
  const name = (a, b) => a.entry.name.localeCompare(b.entry.name, undefined, { sensitivity: 'base' });
  const cmp = by === 'unseen' ? (a, b) => (b.ago ?? 0) - (a.ago ?? 0) || name(a, b) : by === 'seen' ? (a, b) => b.count - a.count || name(a, b) : name;
  return [...(list || [])].sort(cmp);
}

// Copy the cast as text: one line each, "Ann (AN) — innkeeper · met in 2 sessions, last in Session 2", to paste into
// a chat. say(entry) → how to say the name ('' if none).
export function castText(list, say = () => '') {
  return (list || []).map(({ entry: e, count, last }) => {
    const s = say(e), role = e.fields?.role;
    return `${e.name}${s ? ` (${s})` : ''}${role ? ` — ${role}` : ''} · met in ${count} session${count === 1 ? '' : 's'}${last ? `, last in ${last.name}` : ''}${e.fields?.status === 'Dead' ? ' · dead' : ''}`;
  }).join('\n');
}
