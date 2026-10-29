// Show an entry to the table: a GM picks a handout (or any entry), and it pops up for everyone who has the world
// open (picked up by the world sync within about 20 seconds). The last one shown stays on the party page.
import { el, toast } from './dom.js';
import { api, isGm, session } from './api.js';
import { world, getEntry, link, richText, whenTime } from './world-store.js';

const seenKey = () => `satchel-shown-${session.worldKey || 'default'}`;
const seen = () => { try { return localStorage.getItem(seenKey()) || ''; } catch { return ''; } };
const markSeen = (at) => { try { localStorage.setItem(seenKey(), at); } catch { /* private window */ } };

export function showButton(e) {
  if (!isGm() || e.status === 'suggested') return null;
  return el('button', { class: 'btn small', type: 'button', title: 'Pop this up on the screen of everyone who has the world open', onclick: async () => {
    try {
      const r = await api('settings', { method: 'PATCH', body: { show: e.id } });
      world.info = { ...world.info, shown: r.shown }; markSeen(r.shown.at);
      if (r.revealed) { const cur = getEntry(e.id); if (cur) world.entries.set(e.id, { ...cur, visibility: 'all' }); }
      toast(`Showing ${e.name} to the table${r.revealed ? ' (now revealed to players)' : ''}`);
      window.dispatchEvent(new Event('world:rerender'));
    } catch (err) { toast(err.message, 'bad'); }
  } }, 'Show to the table');
}

let dialog = null;
function popup(e, shown) {
  dialog?.remove();
  const img = e.fields?.image;
  const text = e.kind === 'handout' ? e.fields?.text || e.body : e.body;
  dialog = el('dialog', { class: 'dialog show-dialog', 'aria-labelledby': 'show-title' }, el('div', { class: 'dialog-body' },
    el('p', { class: 'eyebrow' }, `${shown.by || 'The GM'} is showing you`),
    el('h2', { id: 'show-title' }, e.name),
    img ? el('img', { class: 'show-img', src: img, alt: e.name }) : null,
    e.summary ? el('p', {}, e.summary) : null,
    text ? el('div', { class: 'show-text' }, richText(text)) : null,
    e.fields?.from ? el('p', { class: 'muted small' }, `From ${e.fields.from}`) : null,
    el('div', { class: 'btnrow' }, el('a', { class: 'btn primary', href: `#world/e/${e.id}`, onclick: () => dialog.close() }, 'Open the page'), el('button', { class: 'btn', type: 'button', onclick: () => dialog.close() }, 'Close'))));
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
}

// A place's job board, as a poster (built from the jobs this person can see).
async function posterPopup(place, shown) {
  const { posterFor, posterNode } = await import('./world-poster.js');
  dialog?.remove();
  dialog = el('dialog', { class: 'dialog show-dialog', 'aria-label': `${shown.by || 'The GM'} is showing you the ${place.name} job board` }, el('div', { class: 'dialog-body' },
    el('p', { class: 'eyebrow' }, `${shown.by || 'The GM'} is showing you`),
    posterNode(posterFor(place)),
    el('div', { class: 'btnrow' }, el('a', { class: 'btn primary', href: `#world/poster/${place.id}`, onclick: () => dialog.close() }, 'Open the poster'), el('button', { class: 'btn', type: 'button', onclick: () => dialog.close() }, 'Close'))));
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
}

// After a load or sync: pop up anything newly shown that this person hasn't seen (and didn't show themselves).
// Something shown more than two hours ago isn't news any more.
export function checkShown() {
  const s = world.info?.shown;
  if (!s?.at || s.at <= seen() || Date.parse(s.at) < Date.now() - 2 * 3600000) return;
  markSeen(s.at);
  const e = getEntry(s.entry_id);
  if (!e || s.by === session.gm?.name && isGm()) return;
  if (s.as === 'poster') { posterPopup(e, s); return; }
  popup(e, s);
}

// For the party page.
export function lastShownLine() {
  const s = world.info?.shown, e = s && getEntry(s.entry_id);
  if (!e) return null;
  return el('p', { class: 'last-shown' }, '🖼 Last shown at the table: ', s.as === 'poster' ? el('a', { href: `#world/poster/${e.id}` }, `the ${e.name} job board`) : link(e), el('span', { class: 'muted small' }, ` · ${s.by || 'a GM'}, ${whenTime(s.at)}`));
}
