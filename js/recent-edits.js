// Recently changed, for GMs: the world's latest changes by anyone, from the history log (newest first). Saves of the
// same entry by the same person one after another fold into one line ("edited ×3"), so a busy evening of tweaks
// doesn't push everything else off the list. Pure, so it can be tested.

export const VERBS = { create: 'created', edit: 'edited', delete: 'deleted', restore: 'restored', import: 'imported', suggest: 'suggested', approve: 'approved',
  unapprove: 'un-approved', reject: 'turned down', reveal: 'revealed', hide: 'hid', claim: 'claimed', unassign: 'unassigned', buy: 'went shopping for', sale: 'bought from' };

// rows: [{ entry_id, action, at, gm, entry_name, kind }] → [{ entry_id, action, verb, at, gm, name, kind, times }]
export function recentEdits(rows, n = 12) {
  const out = [];
  for (const h of rows || []) {
    const last = out[out.length - 1];
    if (last && last.entry_id === h.entry_id && last.gm === (h.gm || 'Someone') && last.action === h.action) { last.times++; continue; }
    if (out.length >= n) break;
    out.push({ entry_id: h.entry_id, action: h.action, verb: VERBS[h.action] || h.action, at: h.at, gm: h.gm || 'Someone', name: h.entry_name || 'an entry', kind: h.kind || null, times: 1 });
  }
  return out;
}
