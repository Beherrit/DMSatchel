// Who and what a session's log names (or connects to), as the viewer can see them: the entries, sessions left out.
import { getEntry, mentions } from './world-store.js';

export function namedIn(session) {
  if (!session) return [];
  const ids = [...new Set([...mentions([session.summary, session.body, ...Object.values(session.fields || {})].join('\n')), ...(session.links || []).map((l) => l.id)])];
  return ids.map((id) => getEntry(id)).filter((x) => x && x.id !== session.id && x.kind !== 'session');
}
