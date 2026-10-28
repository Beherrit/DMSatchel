// Tag pages: every tag in the world with how many entries carry it (#world/tags), and on a tag's own page (the
// tagged search) a short description GMs can write, so "#smugglers" can say who the smugglers are.
import { el, toast, setKids } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, richText, notice } from './world-store.js';
import { stripMarks } from './rich.js';

const plain = (t) => stripMarks(t);
const tagHref = (t) => `#world/q/${encodeURIComponent(`#${t}`)}`;

export function viewTags() {
  const counts = new Map();
  for (const e of worldEntries()) for (const t of e.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
  if (!counts.size) return notice('No tags yet', 'Tags are added on an entry’s form (or to many at once with Select on a list). Then they show here.');
  const notes = world.info?.tag_notes || {};
  const list = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Tags'), el('p', {}, `${list.length} tag${list.length === 1 ? '' : 's'} in this world, most used first.`)),
    el('ul', { class: 'tag-cloud' }, list.map(([t, n]) => el('li', {},
      el('a', { class: 'tagchip', href: tagHref(t) }, `#${t}`), el('span', { class: 'muted small' }, ` ${n}`),
      notes[t] ? el('span', { class: 'small tag-note-short' }, ` · ${plain(notes[t]).split('\n')[0].slice(0, 90)}`) : null))));
}

// On a tag's page: its description, and (GMs) a way to write it.
export function tagNote(tag, rerender) {
  const t = String(tag || '').toLowerCase();
  const text = world.info?.tag_notes?.[t] || '';
  if (!text && !isGm()) return null;
  const box = el('section', { class: 'card tag-note' });
  const show = () => setKids(box, text ? richText(text) : el('p', { class: 'muted small' }, `No description yet. Say what #${t} means in this world.`),
    isGm() ? el('div', { class: 'btnrow' }, el('button', { class: 'btn small ghost', type: 'button', onclick: edit }, text ? 'Edit description' : 'Describe this tag')) : null);
  function edit() {
    const ta = el('textarea', { rows: 3, 'aria-label': `Description of #${t}`, maxlength: 2000 }, text);
    setKids(box, ta, el('p', { class: 'muted small' }, 'Everyone who can see the tag sees this. [[Links]] work.'),
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn small primary', type: 'button', onclick: async () => {
          try { const r = await api('settings', { method: 'PATCH', body: { tag_note: { tag: t, text: ta.value } } }); world.info = { ...world.info, tag_notes: r.tag_notes }; toast('Saved'); rerender(); }
          catch (err) { toast(err.message, 'bad'); }
        } }, 'Save'),
        el('button', { class: 'btn small ghost', type: 'button', onclick: show }, 'Cancel')));
    ta.focus();
  }
  show();
  return box;
}
