// Recently changed, for GMs on the front page: the last dozen changes by anyone (from the history log, so deletes,
// reveals and approvals show too), with who and when, each linking to that entry's history.
import { el, setKids } from './dom.js';
import { api } from './api.js';
import { getEntry, whenTime } from './world-store.js';
import { KINDS } from './world-schema.js';
import { recentEdits } from './recent-edits.js';

let cache = null; // { at, rows }: the front page redraws often, so the log is fetched at most every 30 seconds

export function changesCard() {
  const list = el('div', {}, el('p', { class: 'muted small' }, 'Loading…'));
  const box = el('section', { class: 'changes' }, el('h3', { class: 'section-title' }, 'Recently changed'), list);
  const fill = (rows) => {
    const items = recentEdits(rows);
    setKids(list, items.length ? el('ul', { class: 'entry-list changes-list' }, items.map((r) => {
      const there = getEntry(r.entry_id);
      return el('li', {}, there ? el('a', { href: `#world/e/${r.entry_id}` }, there.name) : el('span', {}, r.name),
        r.kind ? el('span', { class: 'kind-tag' }, KINDS[r.kind]?.label || r.kind) : null,
        el('span', { class: 'muted small' }, `${r.gm} ${r.verb}${r.times > 1 ? ` ×${r.times}` : ''}, ${whenTime(r.at)}`),
        there ? el('a', { class: 'small changes-history', href: `#world/e/${r.entry_id}/history`, 'aria-label': `History of ${there.name}` }, 'History') : null);
    })) : el('p', { class: 'muted small' }, 'No changes yet.'));
  };
  if (cache && Date.now() - cache.at < 30000) fill(cache.rows);
  else api('activity').then((r) => { cache = { at: Date.now(), rows: r.activity }; fill(r.activity); }).catch((err) => setKids(list, el('p', { class: 'error' }, err.message)));
  return box;
}
