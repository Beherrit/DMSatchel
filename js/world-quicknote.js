// Quick journal note from anywhere in a world: a floating "Note" button (and the j key) opens a small box; the note
// is saved as a journal entry, linked to the page you were on, without leaving it.
import { el, toast } from './dom.js';
import { isMember, isGm, session, onSession } from './api.js';
import { worldEntries, getEntry, createEntry, byName } from './world-store.js';
import { worldCalendar, todayText } from './world-calendar.js';
import { KINDS } from './world-schema.js';
import { titleFrom } from './note-title.js';

// The entry the person is looking at, if any (#world/e/<id>).
const currentEntry = () => { const m = location.hash.match(/^#world\/e\/([^/]+)/); return m ? getEntry(decodeURIComponent(m[1])) : null; };

export function openQuickNote() {
  if (!isMember()) return;
  const about = currentEntry();
  const mine = worldEntries().filter((e) => e.kind === 'character' && e.owner_id === session.gm?.id && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status)).sort(byName);
  const text = el('textarea', { id: 'qn-text', rows: 5, placeholder: about ? `What you noticed about ${about.name}…` : 'What happened, what you suspect, what to remember…' });
  const link = about ? el('input', { type: 'checkbox', id: 'qn-link', checked: true }) : null;
  const who = mine.length ? el('select', { id: 'qn-who', 'aria-label': 'Written by' }, el('option', { value: '' }, 'Just me'), mine.map((c) => el('option', { value: c.name }, c.name))) : null;
  if (who && mine.length === 1) who.value = mine[0].name;
  const kind = el('select', { id: 'qn-kind', 'aria-label': 'Kind of note' }, KINDS.journal.fields[0][3].map((k) => el('option', { value: k }, k)));
  kind.value = 'Session notes';
  const d = el('dialog', { class: 'dialog quicknote', 'aria-labelledby': 'qn-title' }, el('div', { class: 'dialog-body' },
    el('h2', { id: 'qn-title' }, 'Quick note'),
    el('label', { class: 'sr-only', for: 'qn-text' }, 'Note'), text,
    link ? el('label', { class: 'check' }, link, ` About ${about.name}`) : null,
    el('div', { class: 'controls' }, kind, who),
    el('p', { class: 'muted small' }, `Saved as a journal entry${isGm() ? '' : ' everyone in the world can read'}. Ctrl+Enter saves.`),
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: save }, 'Save note'), el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
  text.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); save(); } });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal(); text.focus();

  async function save() {
    const body = text.value.trim();
    if (!body) { text.focus(); return; }
    const linked = about && link.checked;
    try {
      await createEntry({ kind: 'journal', name: titleFrom(body), body: linked && !body.includes(`[[${about.name}]]`) ? `${body}\n\nAbout [[${about.name}]].` : body,
        links: linked ? [{ id: about.id, label: 'about', secret: false }] : [],
        fields: { kind: kind.value, character: who?.value || '', date: worldCalendar() ? todayText() : '' } });
      toast('Note saved to the journal'); d.close();
      window.dispatchEvent(new Event('world:rerender'));
    } catch (err) { toast(err.message, 'bad'); }
  }
}

// The floating button: shown on world pages to members.
export function quickNoteButton() {
  const b = el('button', { class: 'btn quicknote-btn', type: 'button', 'aria-label': 'Quick note (j)', title: 'Quick note (j)', onclick: openQuickNote }, '✎ Note');
  const sync = () => { b.hidden = !(location.hash.startsWith('#world') && isMember()); };
  window.addEventListener('hashchange', sync); onSession(sync); sync();
  return b;
}
