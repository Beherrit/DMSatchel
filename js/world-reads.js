// Who has read it: a player opening a handout tells the server (once per visit); GMs see on the handout's page who
// has read it and who hasn't yet.
import { el, setKids } from './dom.js';
import { api, isGm, isPlayer, previewing } from './api.js';
import { when } from './world-store.js';

const sent = new Set();

export function noteRead(e) {
  if (e?.kind !== 'handout' || !isPlayer() || previewing() || sent.has(e.id)) return;
  sent.add(e.id);
  api('party', { method: 'POST', body: { read: e.id } }).catch(() => sent.delete(e.id));
}

export function readsLine(e) {
  if (e?.kind !== 'handout' || !isGm() || previewing()) return null;
  const box = el('p', { class: 'small reads-line', role: 'status' }, el('span', { class: 'muted' }, 'Checking who has read it…'));
  api('party', { query: { reads: e.id } }).then((r) => {
    if (!r.read.length && !r.unread.length) { setKids(box, el('span', { class: 'muted' }, 'No players in this world yet.')); return; }
    setKids(box, '👁 ', r.read.length ? ['Read by ', r.read.map((x, i) => [i ? ', ' : '', el('strong', {}, x.name), el('span', { class: 'muted' }, ` (${when(x.last_at)})`)])] : el('span', {}, 'No one has opened it yet'),
      r.unread.length && r.read.length ? el('span', { class: 'muted' }, ` · not yet: ${r.unread.join(', ')}`) : null);
  }).catch(() => setKids(box));
  return box;
}
