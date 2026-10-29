// Likely duplicates (GMs): entries that look like the same thing, to merge or mark as different. Route: #world/dupes
import { el, toast, setKids } from './dom.js';
import { api, isGm } from './api.js';
import { worldEntries, link, kindLabel, notice } from './world-store.js';
import { likelyDuplicates, pairKey } from './duplicates.js';
import { openMergeDialog } from './world-merge.js';
import { stripMarks } from './rich.js';

const SHOW = 60;
const blurb = (e) => { const s = stripMarks(e.summary || e.body || '').replace(/\s+/g, ' ').trim(); return s.length > 120 ? `${s.slice(0, 119)}…` : s; };

export async function viewDupes() {
  if (!isGm()) return notice('GMs only', 'Tidying the world is for its GMs.');
  let dismissed = [];
  try { dismissed = (await api('settings')).world?.prep?.not_dupes || []; } catch { /* show everything */ }
  const box = el('div');
  // keep: this side stays and the other is merged into it.
  const side = (keep, other) => el('div', { class: 'dp-side' }, el('div', {}, link(keep), el('span', { class: 'kind-tag' }, kindLabel(keep.kind))),
    el('p', { class: 'muted small' }, blurb(keep) || 'Nothing written yet.'),
    el('button', { class: 'btn small', type: 'button', onclick: () => openMergeDialog(other, keep, draw) }, 'Keep this one…'));
  const draw = () => {
    const pairs = likelyDuplicates(worldEntries(), dismissed);
    setKids(box, pairs.length ? [
      el('p', {}, `${pairs.length} pair${pairs.length === 1 ? '' : 's'} that may be the same thing${pairs.length > SHOW ? ` (the first ${SHOW} shown)` : ''}.`),
      el('ul', { class: 'plain dp-list' }, pairs.slice(0, SHOW).map(({ a, b, exact }) => el('li', { class: 'card dp-pair' },
        el('span', { class: 'eyebrow' }, exact ? 'Same name' : 'Similar names'),
        el('div', { class: 'dp-sides' }, side(a, b), side(b, a)),
        el('div', { class: 'btnrow' },
          el('button', { class: 'btn small ghost', type: 'button', onclick: async () => {
            try { dismissed = (await api('settings', { method: 'PATCH', body: { not_dupe: pairKey(a.id, b.id) } })).not_dupes; toast(`${a.name} and ${b.name} are different`); draw(); }
            catch (err) { toast(err.message, 'bad'); }
          } }, 'Not the same')))))]
      : notice('No likely duplicates', 'No two entries have the same or a near name (apart from ones you marked as different).'));
  };
  draw();
  return el('div', { class: 'w-view dupes-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Likely duplicates'),
      el('p', {}, 'Entries with the same name, or a near one (a typo, “The”, a plural), that may be the same thing. Merging keeps one and moves everything from the other into it.')),
    box);
}
