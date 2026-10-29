// An entry's history (GMs): who changed what and when, what each edit changed, and putting the entry back the way
// it was at any version (saved as a new edit, so nothing is lost).
import { el, toast, setKids, confirmButton } from './dom.js';
import { api } from './api.js';
import { world, getEntry, when } from './world-store.js';
import { diffVersions, restoreFrom, brief } from './versions.js';

const ACTIONS = { create: 'created it', edit: 'edited it', import: 'imported it', reveal: 'revealed it to players', hide: 'hid it from players', approve: 'approved it',
  unapprove: 'sent it back to suggestions', suggest: 'suggested it', delete: 'deleted it', restore: 'restored it from the bin', reject: 'turned it down', claim: 'claimed the character', unassign: 'unassigned the player', buy: 'went shopping', sale: 'bought something here', give: 'handed something over' };

export async function fillHistory(box, id, rerender) {
  setKids(box, el('p', { class: 'muted' }, 'Loading history…'));
  let rows;
  try { rows = (await api('activity', { query: { id } })).activity; } catch (err) { setKids(box, el('p', { class: 'error' }, err.message)); return; }
  // Snapshots are newest first; each one is compared with the next older snapshot.
  const snaps = rows.filter((h) => h.snapshot && ['create', 'edit', 'import'].includes(h.action));
  const olderOf = (h) => snaps[snaps.indexOf(h) + 1] || null;
  setKids(box, el('h4', {}, 'History'),
    rows.length ? el('ol', { class: 'plain history-list' }, rows.map((h) => {
      const isSnap = snaps.includes(h), diff = isSnap ? diffVersions(olderOf(h)?.snapshot, h.snapshot) : [];
      const latest = snaps[0] === h;
      return el('li', {},
        el('div', {}, el('strong', {}, h.gm || 'Someone'), ` ${ACTIONS[h.action] || h.action} `, el('span', { class: 'muted small' }, when(h.at)), latest ? el('span', { class: 'tag' }, 'current') : null),
        isSnap && diff.length ? el('details', { class: 'small' }, el('summary', {}, `${olderOf(h) ? 'Changed' : 'Started with'}: ${diff.map((d) => d.label).slice(0, 6).join(', ')}${diff.length > 6 ? '…' : ''}`),
          el('ul', { class: 'plain diff-list' }, diff.map((d) => el('li', {}, el('strong', {}, `${d.label}: `), olderOf(h) ? [el('del', {}, brief(d.before)), ' → '] : null, el('ins', {}, brief(d.after)))))) : null,
        isSnap && !latest ? confirmButton('Restore this version', async () => {
          const cur = getEntry(id);
          if (!cur) return;
          try {
            const r = await api('entries', { method: 'PUT', query: { id }, body: { entry: restoreFrom(cur, h.snapshot) } });
            world.entries.set(r.entry.id, r.entry); toast(`Restored the version from ${when(h.at)}`); rerender();
          } catch (err) { toast(err.message, 'bad'); }
        }, 'btn small ghost') : null);
    })) : el('p', { class: 'muted small' }, 'No history recorded yet.'));
}
