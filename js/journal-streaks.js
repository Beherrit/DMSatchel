// Who writes the journals: per writer, how many journal entries, and the longest run of sessions in a row they wrote
// about (and the run going now, up to the latest session). Pure, so it can be tested.
// sessions: session ids, oldest first. journals: [{ author, about: [session ids it's about] }].
// → [{ author, entries, best, now }], most entries first.
export function journalWriters(sessions, journals) {
  const by = new Map();
  for (const j of journals || []) {
    const a = String(j.author || '').trim();
    if (!a) continue;
    const x = by.get(a) || { author: a, entries: 0, about: new Set() };
    x.entries += 1; for (const id of j.about || []) x.about.add(id);
    by.set(a, x);
  }
  return [...by.values()].map(({ author, entries, about }) => {
    let best = 0, run = 0;
    for (const id of sessions) { run = about.has(id) ? run + 1 : 0; best = Math.max(best, run); }
    return { author, entries, best, now: run };
  }).sort((a, b) => b.entries - a.entries || b.best - a.best || a.author.localeCompare(b.author));
}
