// Private notes: anyone in the world can keep their own notes on an entry ("I think she's lying"). Only the writer
// sees them, not even the GMs. Stored by the comments API in its own 'note' room.
import { el, toast, setKids } from './dom.js';
import { api, isMember } from './api.js';
import { getEntry, link, when, richText, kindLabel } from './world-store.js';

export function noteBox(e) {
  if (!isMember()) return null;
  const text = el('textarea', { rows: 3, id: `note-${e.id}`, placeholder: 'Your own notes on this: theories, reminders, what you promised. Only you can see them.' });
  const status = el('span', { class: 'muted small', role: 'status' });
  let saved = '';
  const save = async () => {
    const v = text.value.trim();
    if (v === saved) return;
    status.textContent = 'Saving…';
    try { await api('comments', { method: 'PUT', body: { entry_id: e.id, body: v } }); saved = v; status.textContent = v ? `Saved ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Removed'; }
    catch (err) { status.textContent = ''; toast(err.message, 'bad'); }
  };
  text.addEventListener('blur', save);
  text.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); save(); } });
  const box = el('details', { class: 'card my-notes' }, el('summary', {}, 'My notes ', el('span', { class: 'muted small' }, '(only you see these)')),
    el('label', { class: 'sr-only', for: `note-${e.id}` }, `My notes on ${e.name}`), text,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn small', type: 'button', onclick: save }, 'Save'), status));
  api('comments', { query: { entry_id: e.id, audience: 'note' } }).then((r) => {
    const n = r.notes?.[0];
    if (n && !text.value) { text.value = n.body; saved = n.body; box.open = true; status.textContent = `Last saved ${when(n.edited_at || n.created_at)}`; }
  }).catch(() => {});
  return box;
}

// For "My things": every note this person has written in the world.
export function myNotesSection() {
  const box = el('section', {}, el('h3', { class: 'section-title' }, 'My notes'), el('p', { class: 'muted small' }, 'Loading…'));
  api('comments', { query: { notes: 'mine' } }).then((r) => {
    const list = (r.notes || []).filter((n) => getEntry(n.entry_id));
    setKids(box, el('h3', { class: 'section-title' }, `My notes (${list.length})`),
      list.length ? el('ul', { class: 'plain my-notes-list' }, list.map((n) => el('li', { class: 'card' },
        el('div', { class: 'entry-head' }, link(getEntry(n.entry_id)), el('span', { class: 'muted small' }, `${kindLabel(n.kind)} · ${when(n.edited_at || n.created_at)}`)),
        richText(n.body))))
        : el('p', { class: 'muted small' }, 'None yet. Open any page in the world and use “My notes” at the bottom.'));
  }).catch((err) => setKids(box, el('p', { class: 'muted small' }, err.message)));
  return box;
}
