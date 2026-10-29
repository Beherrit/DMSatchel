// Reading for next session: a few entries the GMs ask players to read beforehand (kept in session prep as a list of
// ids). Players see it on the front page and tick off what they've read; GMs see who has. Pure, so it can be tested.

export const MAX_READING = 8;

// A raw list → unique, known ids, at most MAX_READING. exists(id) → whether the entry is there.
export function cleanReading(raw, exists = () => true) {
  const out = [];
  for (const x of Array.isArray(raw) ? raw : []) {
    const id = String(x || '').slice(0, 40);
    if (id && !out.includes(id) && exists(id)) out.push(id);
  }
  return out.slice(0, MAX_READING);
}

// The list as one person sees it: only entries they can see, each with whether they've read it (players) or who has
// (GMs). sees(id) → boolean; readers: Map(id → [names]) for GMs, or a Set of ids this player has read.
export function readingFor(raw, sees, readers) {
  return cleanReading(raw).filter(sees).map((id) => (readers instanceof Map ? { id, read_by: readers.get(id) || [] } : { id, read: Boolean(readers?.has(id)) }));
}
