// Who and what a session's log names (or connects to), as the viewer can see them: the entries, sessions left out.
import { getEntry, mentions, worldEntries } from './world-store.js';

export function namedIn(session) {
  if (!session) return [];
  const ids = [...new Set([...mentions([session.summary, session.body, ...Object.values(session.fields || {})].join('\n')), ...(session.links || []).map((l) => l.id)])];
  return ids.map((id) => getEntry(id)).filter((x) => x && x.id !== session.id && x.kind !== 'session');
}

// The journal entries that name (or connect to) an entry, oldest first.
export function journalsAbout(id) {
  return worldEntries().filter((x) => x.kind === 'journal' && (mentions([x.summary, x.body].join('\n')).has(id) || (x.links || []).some((l) => l.id === id)))
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
}
