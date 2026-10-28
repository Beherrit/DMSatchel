// "Could be links" on an entry's page (GMs): names of other entries written as plain text in its summary,
// description, secret or long fields. Link one, or all of them at once; only the first mention of each becomes a
// [[link]], so the page doesn't turn into a sea of links.
import { el, toast } from './dom.js';
import { isGm } from './api.js';
import { worldEntries, getEntry, patchEntry, link, kindFields } from './world-store.js';
import { unlinkedMentions, linkMentions } from './mentions.js';

// The writable texts of an entry, as [where, text] pairs, in reading order.
function textsOf(e) {
  const long = kindFields(e.kind).filter(([k, , type]) => type === 'long' && e.fields?.[k]).map(([k]) => [`f:${k}`, e.fields[k]]);
  return [['summary', e.summary], ['body', e.body], ...long, ['secret', e.secret]].filter(([, t]) => t);
}

// Kept open across the redraw after linking, so several can be linked in a row.
const opened = new Set();

export function mentionsCard(e, rerender) {
  if (!isGm() || e.status === 'suggested') return null;
  const parts = textsOf(e);
  const found = unlinkedMentions(parts.map(([, t]) => t), worldEntries().filter((x) => x.status !== 'suggested'), e.id);
  if (!found.length) return null;
  const apply = async (names) => {
    const cur = getEntry(e.id) || e;
    const now = textsOf(cur);
    const out = linkMentions(now.map(([, t]) => t), names, worldEntries().map((x) => x.name));
    const patch = { fields: {} };
    now.forEach(([where], i) => { if (where.startsWith('f:')) patch.fields[where.slice(2)] = out[i]; else patch[where] = out[i]; });
    try { await patchEntry(cur, patch); toast(names.length === 1 ? `Linked ${names[0]}` : `Linked ${names.length} names`); rerender(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const card = el('details', { class: 'card mentions-card', open: opened.has(e.id) },
    el('summary', {}, `${found.length} name${found.length === 1 ? '' : 's'} here could be link${found.length === 1 ? '' : 's'}`),
    el('ul', { class: 'plain mention-list' }, found.map(({ entry, count }) => el('li', {}, link(entry), el('span', { class: 'muted small' }, ` mentioned ${count === 1 ? 'once' : `${count} times`}`), ' ',
      el('button', { class: 'btn small', type: 'button', onclick: () => apply([entry.name]) }, 'Link')))),
    found.length > 1 ? el('button', { class: 'btn small primary', type: 'button', onclick: () => apply(found.map((f) => f.entry.name)) }, `Link all ${found.length}`) : null);
  card.addEventListener('toggle', () => { if (card.open) opened.add(e.id); else opened.delete(e.id); });
  return card;
}
