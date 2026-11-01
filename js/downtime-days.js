// Downtime moves with the calendar: when days pass, each open (unresolved) activity that says how many days it takes
// (fields.days) counts them toward it (fields.done); the ones that reach their days are ready for a GM to resolve.
// Pure, so it can be tested.

// → [{ entry, done, ready }] for the activities that moved.
export function downtimeProgress(entries, days) {
  const n = Math.max(0, Math.round(Number(days) || 0));
  if (!n) return [];
  const out = [];
  for (const e of entries || []) {
    if (e.kind !== 'downtime' || e.fields?.resolved) continue;
    const need = parseInt(e.fields?.days, 10), had = parseInt(e.fields?.done, 10) || 0;
    if (!(need > 0) || had >= need) continue;
    const done = Math.min(need, had + n);
    out.push({ entry: e, done, ready: done >= need });
  }
  return out;
}
