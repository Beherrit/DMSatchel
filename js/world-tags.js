// Tag pages: every tag in the world with how many entries carry it (#world/tags), and on a tag's own page (the
// tagged search) a short description GMs can write, so "#smugglers" can say who the smugglers are.
import { el, toast, setKids } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, richText, notice, loadWorld, tagChip } from './world-store.js';
import { TAG_COLORS, tagSlot } from './tag-colors.js';
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
      tagChip(t, tagHref(t)), el('span', { class: 'muted small' }, ` ${n}`),
      notes[t] ? el('span', { class: 'small tag-note-short' }, ` · ${plain(notes[t]).split('\n')[0].slice(0, 90)}`) : null))));
}

// On a tag's page: its description, and (GMs) a way to write it.
// GMs: rename a tag on every entry (or fold it into another tag); its description moves with it.
function renameDialog(from) {
  const input = el('input', { type: 'text', id: 'rt-to', list: 'rt-tags', value: from, maxlength: 40, autocomplete: 'off' });
  const n = worldEntries().filter((e) => (e.tags || []).includes(from)).length;
  const status = el('p', { class: 'form-status', role: 'status' });
  const dlg = el('dialog', { class: 'dialog', 'aria-labelledby': 'rt-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'rt-title' }, `Rename #${from}`),
    el('p', {}, `On ${n} entr${n === 1 ? 'y' : 'ies'}. Pick an existing tag to fold #${from} into it.`),
    el('div', { class: 'field' }, el('label', { for: 'rt-to' }, 'New name'), input,
      el('datalist', { id: 'rt-tags' }, [...new Set(worldEntries().flatMap((e) => e.tags || []))].filter((t) => t !== from).sort().map((t) => el('option', { value: t })))),
    status,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Rename'), el('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, 'Cancel'))));
  dlg.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const to = input.value.trim().replace(/^#+/, '').toLowerCase();
    if (!to || to === from) { input.focus(); return; }
    status.textContent = 'Renaming…'; status.className = 'form-status';
    try {
      const r = await api('entries', { method: 'PATCH', body: { rename_tag: { from, to } } });
      // The description moves too, unless the other tag has its own.
      const notes = world.info?.tag_notes || {};
      if (notes[from] && !notes[to]) {
        const a = await api('settings', { method: 'PATCH', body: { tag_note: { tag: to, text: notes[from] } } });
        const b = await api('settings', { method: 'PATCH', body: { tag_note: { tag: from, text: '' } } });
        world.info = { ...world.info, tag_notes: b.tag_notes || a.tag_notes };
      }
      // So does its colour.
      const colors = world.info?.tag_colors || {};
      if (colors[from] !== undefined && colors[to] === undefined) {
        await api('settings', { method: 'PATCH', body: { tag_color: { tag: to, color: colors[from] } } });
        const c = await api('settings', { method: 'PATCH', body: { tag_color: { tag: from, color: null } } });
        world.info = { ...world.info, tag_colors: c.tag_colors };
      }
      await loadWorld(true);
      toast(`#${from} is now #${to} on ${r.renamed} entr${r.renamed === 1 ? 'y' : 'ies'}`);
      dlg.close(); location.hash = `world/q/${encodeURIComponent(`#${to}`)}`;
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg); dlg.showModal(); input.select();
}

// GMs: the tag's colour, from the eight in the palette, or none.
function colorPicker(t, rerender) {
  const cur = tagSlot(world.info?.tag_colors, t);
  const set = async (color) => {
    try { const r = await api('settings', { method: 'PATCH', body: { tag_color: { tag: t, color } } }); world.info = { ...world.info, tag_colors: r.tag_colors }; toast(color === null ? 'Colour taken off' : `#${t} is ${TAG_COLORS[color].toLowerCase()} now`); rerender(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  return el('fieldset', { class: 'tag-colors' }, el('legend', { class: 'small' }, 'Colour'),
    TAG_COLORS.map((name, i) => el('button', { class: `swatch hold-${i}`, type: 'button', 'aria-pressed': String(cur === i), 'aria-label': name, title: name, onclick: () => set(i) })),
    el('button', { class: 'btn small ghost', type: 'button', 'aria-pressed': String(cur < 0), onclick: () => set(null) }, 'None'));
}

export function tagNote(tag, rerender) {
  const t = String(tag || '').toLowerCase();
  const text = world.info?.tag_notes?.[t] || '';
  if (!text && !isGm()) return null;
  const box = el('section', { class: 'card tag-note' });
  const show = () => setKids(box, text ? richText(text) : el('p', { class: 'muted small' }, `No description yet. Say what #${t} means in this world.`),
    isGm() ? el('div', { class: 'btnrow' }, el('button', { class: 'btn small ghost', type: 'button', onclick: edit }, text ? 'Edit description' : 'Describe this tag'),
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => renameDialog(t) }, 'Rename tag')) : null,
    isGm() ? colorPicker(t, rerender) : null);
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
