// Our next move: each member can pick the quest they want to pursue next; GMs see the tally in session prep, and
// whether the party is split. Picks of finished or vanished quests don't count. Pure, so it can be tested.

const DONE = ['Completed', 'Failed', 'Abandoned'];

// rows: [{ name, quest_id }]; getQuest(id) → the quest entry or nothing.
// → { picks: [{ quest, names }] (most wanted first), split, total }
export function tallyMoves(rows, getQuest) {
  const by = new Map();
  for (const r of rows || []) {
    const q = r?.quest_id && getQuest(r.quest_id);
    if (!q || q.kind !== 'quest' || DONE.includes(q.fields?.status)) continue;
    if (!by.has(q.id)) by.set(q.id, { quest: q, names: [] });
    by.get(q.id).names.push(r.name);
  }
  const picks = [...by.values()].map((p) => ({ ...p, names: p.names.sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => b.names.length - a.names.length || a.quest.name.localeCompare(b.quest.name));
  return { picks, split: picks.length > 1, total: picks.reduce((t, p) => t + p.names.length, 0) };
}
