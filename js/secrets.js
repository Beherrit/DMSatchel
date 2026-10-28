// Secrets and clues (GMs, in session prep): things the party could find out, each written as one line that can
// [[link]] the entries it's about. Tick one when the party finds it; the rest carry over to the next session.
// Changes arrive as single operations so two GMs prepping at once don't overwrite each other. Pure, for tests.

export const MAX_SECRETS = 150;
const newId = () => Math.random().toString(36).slice(2, 10);
const text = (t) => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, 600);

export function readSecrets(list) {
  return (Array.isArray(list) ? list : []).filter((s) => s && s.id && s.text).slice(0, MAX_SECRETS);
}

// op: { add: text } | { id, found: true|false, session } | { id, text } | { remove: id }
export function applySecret(list, op, who, now = new Date().toISOString()) {
  const cur = readSecrets(list);
  if (op?.add !== undefined) {
    const t = text(op.add);
    if (!t) return { error: 'Write the secret first.' };
    if (cur.length >= MAX_SECRETS) return { error: `That’s ${MAX_SECRETS} secrets already. Remove a few the party found long ago.` };
    return { list: [...cur, { id: newId(), text: t, added_by: who, added_at: now }] };
  }
  if (op?.remove) return { list: cur.filter((s) => s.id !== op.remove) };
  const i = cur.findIndex((s) => s.id === op?.id);
  if (i < 0) return { error: 'That secret was removed.' };
  const s = { ...cur[i] };
  if (typeof op.found === 'boolean') {
    if (op.found) Object.assign(s, { found_at: now, found_by: who, ...(op.session ? { found_in: String(op.session).slice(0, 20) } : {}) });
    else { delete s.found_at; delete s.found_by; delete s.found_in; }
  }
  if (op.text !== undefined) { const t = text(op.text); if (!t) return { error: 'A secret can’t be empty.' }; s.text = t; }
  return { list: cur.map((x, j) => (j === i ? s : x)) };
}

// Open ones first (oldest first, they've waited longest), then what was found, newest first.
export function sortSecrets(list) {
  const all = readSecrets(list);
  return { open: all.filter((s) => !s.found_at), found: all.filter((s) => s.found_at).sort((a, b) => String(b.found_at).localeCompare(String(a.found_at))) };
}

// Open secrets that mention an entry by [[name]] (for its page or the session sheet).
export function secretsAbout(list, name) {
  const n = String(name || '').toLowerCase();
  return sortSecrets(list).open.filter((s) => [...s.text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].some((m) => m[1].trim().toLowerCase() === n));
}
