// The world's own fields (GMs): a dialog to add, rename, reorder or remove extra fields on one kind of entry, like
// "Deity" on NPCs or "Danger level" on locations. They show on the form and the entry page like built-in ones.
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { world } from './world-store.js';
import { KINDS } from './world-schema.js';
import { CUSTOM_TYPES, MAX_PER_KIND } from './custom-fields.js';

export function customFieldsButton(kind, after, cls = 'btn small ghost') {
  if (!isGm() || !KINDS[kind]) return null;
  const n = world.info?.custom_fields?.[kind]?.length || 0;
  return el('button', { class: cls, type: 'button', onclick: () => openDialog(kind, after) },
    n ? `Your own fields (${n})` : `+ Your own fields for ${KINDS[kind].plural}`);
}

function openDialog(kind, after) {
  const rows = el('ol', { class: 'cf-rows plain' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const addBtn = el('button', { class: 'btn small', type: 'button', onclick: () => { rows.append(row()); sync(); rows.lastChild.querySelector('input').focus(); } }, '+ Add a field');
  const sync = () => {
    addBtn.disabled = rows.children.length >= MAX_PER_KIND;
    [...rows.children].forEach((r, i, all) => { r.querySelector('.cf-up').disabled = !i; r.querySelector('.cf-down').disabled = i === all.length - 1; });
  };

  function row(f = { label: '', type: 'text', options: [], gmOnly: false }) {
    const label = el('input', { type: 'text', class: 'cf-label', value: f.label, maxlength: 60, placeholder: 'e.g. Deity', 'aria-label': 'Field name' });
    const type = el('select', { class: 'cf-type', 'aria-label': 'Kind of field' }, CUSTOM_TYPES.map(([v, t]) => el('option', { value: v }, t)));
    type.value = f.type;
    const options = el('input', { type: 'text', class: 'cf-options', value: (f.options || []).join(', '), placeholder: 'Choices, separated by commas', 'aria-label': 'Choices' });
    const who = el('select', { class: 'cf-who', 'aria-label': 'Who sees it' }, el('option', { value: '' }, 'Everyone sees it'), el('option', { value: 'gm' }, 'GMs only'));
    who.value = f.gmOnly ? 'gm' : '';
    const showOptions = () => { options.hidden = type.value !== 'select'; };
    type.addEventListener('change', showOptions); showOptions();
    const r = el('li', { class: 'cf-row', 'data-key': f.key || '' }, label, type, who,
      el('span', { class: 'cf-move' },
        el('button', { class: 'btn small ghost cf-up', type: 'button', 'aria-label': 'Move up', onclick: () => { r.previousSibling?.before(r); sync(); } }, '↑'),
        el('button', { class: 'btn small ghost cf-down', type: 'button', 'aria-label': 'Move down', onclick: () => { r.nextSibling?.after(r); sync(); } }, '↓'),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': 'Remove field', onclick: () => { r.remove(); sync(); } }, '✕')),
      options);
    return r;
  }

  for (const f of world.info?.custom_fields?.[kind] || []) rows.append(row(f));
  if (!rows.children.length) rows.append(row());
  const d = el('dialog', { class: 'dialog cf-dialog', 'aria-labelledby': 'cf-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'cf-title' }, `Your own fields for ${KINDS[kind].plural}`),
    el('p', { class: 'muted small' }, `Extra fields every ${/^[A-Z]+$/.test(KINDS[kind].label) ? KINDS[kind].label : KINDS[kind].label.toLowerCase()} in this world gets, after the usual ones. “GMs only” fields are never sent to players. Removing a field hides it but keeps what was written in it, so adding it back brings the values back.`),
    rows, el('div', { class: 'btnrow' }, addBtn), status,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Save fields'), el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const list = [...rows.children].map((r) => ({ key: r.dataset.key || undefined, label: r.querySelector('.cf-label').value, type: r.querySelector('.cf-type').value,
      options: r.querySelector('.cf-options').value, gmOnly: r.querySelector('.cf-who').value === 'gm' })).filter((f) => f.label.trim());
    status.textContent = 'Saving…'; status.className = 'form-status';
    try {
      const r = await api('settings', { method: 'PATCH', body: { custom_fields: { kind, list } } });
      world.info = { ...world.info, custom_fields: r.custom_fields };
      toast(list.length ? `Saved ${list.length} field${list.length === 1 ? '' : 's'} for ${KINDS[kind].plural}` : `${KINDS[kind].plural} have only the usual fields now`);
      d.close(); after?.();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); sync(); d.showModal();
}
