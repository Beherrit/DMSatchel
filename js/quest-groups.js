// Quests by status: the quests list grouped so what's in play comes first and finished ones fold away. Pure, so it
// can be tested.

const GROUPS = [
  ['active', 'In play', ['Active'], true], ['available', 'On offer', ['Available'], true], ['rumor', 'Rumored', ['Rumor'], true],
  ['none', 'No status yet', [''], true], ['done', 'Done', ['Completed'], false], ['failed', 'Failed or abandoned', ['Failed', 'Abandoned'], false],
];

// → [{ key, title, open, entries }], only groups with something in them; entries keep the order they came in.
export function questGroups(quests) {
  return GROUPS.map(([key, title, statuses, open]) => ({ key, title, open, entries: (quests || []).filter((q) => statuses.includes(q.fields?.status || '') || (key === 'none' && !GROUPS.some(([, , s]) => s.includes(q.fields?.status || '')))) }))
    .filter((g) => g.entries.length);
}
