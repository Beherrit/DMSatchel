// Quest chains: a quest can follow another (fields.follows, the earlier quest's name). From any quest, what came
// before it (oldest first) and what follows it. Pure, so it can be tested.

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// → { before: [quests, oldest first], after: [quests that follow this one directly] }
export function chainOf(q, entries) {
  const quests = (entries || []).filter((e) => e.kind === 'quest');
  const byName = new Map(quests.map((e) => [norm(e.name), e]));
  const before = [], seen = new Set([q.id]);
  for (let cur = byName.get(norm(q.fields?.follows)); cur && !seen.has(cur.id); cur = byName.get(norm(cur.fields?.follows))) { seen.add(cur.id); before.unshift(cur); }
  const after = quests.filter((e) => e.id !== q.id && norm(e.fields?.follows) && norm(e.fields.follows) === norm(q.name)).sort((a, b) => a.name.localeCompare(b.name));
  return { before, after };
}

// Followers worth opening once this quest is done: ones the party can't take up yet (still a rumor, or hidden).
export const waitingNext = (after) => after.filter((e) => e.visibility === 'gm' || (e.fields?.status || 'Available') === 'Rumor');
