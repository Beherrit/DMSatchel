// Suggest an edit: players propose changes to an entry they can see but not edit (a correction, what they learned);
// GMs see each suggestion as a difference on the Suggestions page and accept or decline it.
import { el, toast, setKids } from './dom.js';
import { api, isGm, isMember } from './api.js';
import { world, getEntry, link, kindFields, whenTime } from './world-store.js';
import { suggestableFields, applyProposal } from './edit-suggest.js';
import { diffVersions } from './versions.js';

export function suggestEditButton(e) {
  if (!isMember() || isGm() || e.can_edit || e.status !== 'live') return null;
  return el('button', { class: 'btn small', type: 'button', title: 'Propose a change for the GMs to look at', onclick: () => openDialog(e) }, 'Suggest an edit');
}

function openDialog(e) {
  const area = (id, label, value, rows) => el('div', { class: 'field wide' }, el('label', { for: id }, label), el('textarea', { id, rows }, value || ''));
  const fields = suggestableFields(kindFields(e.kind));
  const fieldBoxes = fields.map(([k, label, type, opts]) => {
    const v = e.fields?.[k] || '', id = `se-${k}`;
    if (type === 'select') {
      const s = el('select', { id, 'data-field': k }, el('option', { value: '' }, '—'), (opts || []).map((o) => el('option', { value: o }, o)));
      s.value = v; return el('div', { class: 'field' }, el('label', { for: id }, label), s);
    }
    return type === 'long' ? el('div', { class: 'field wide' }, el('label', { for: id }, label), el('textarea', { id, 'data-field': k, rows: 3 }, v))
      : el('div', { class: 'field' }, el('label', { for: id }, label), el('input', { type: 'text', id, 'data-field': k, value: v }));
  });
  const status = el('p', { class: 'form-status', role: 'status' });
  const d = el('dialog', { class: 'dialog se-dialog', 'aria-labelledby': 'se-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'se-title' }, `Suggest an edit to ${e.name}`),
    el('p', { class: 'muted small' }, 'Change what you think is wrong or missing. The GMs see exactly what you changed and decide; nothing changes until they accept.'),
    area('se-summary', 'Summary', e.summary, 2), area('se-body', 'Description', e.body, 6),
    el('div', { class: 'edit-fields' }, fieldBoxes),
    el('div', { class: 'field wide' }, el('label', { for: 'se-note' }, 'Why (optional)'), el('input', { type: 'text', id: 'se-note', maxlength: 1000, placeholder: 'e.g. We learned this in session 12' })),
    status,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Send to the GMs'), el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = {};
    for (const x of d.querySelectorAll('[data-field]')) f[x.dataset.field] = x.value;
    try {
      await api('entries', { method: 'POST', body: { suggest_edit: { entry_id: e.id, summary: d.querySelector('#se-summary').value, body: d.querySelector('#se-body').value, fields: f, note: d.querySelector('#se-note').value } } });
      toast('Sent: the GMs will take a look'); d.close();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}

const diffList = (cur, proposal) => el('ul', { class: 'plain diff-list' }, diffVersions(cur, applyProposal(cur, proposal)).map((x) => el('li', {}, el('strong', {}, `${x.label}: `),
  el('del', {}, String(x.before ?? '') || '(empty)'), ' → ', el('ins', {}, String(x.after ?? '') || '(empty)'))));

// GMs, on the Suggestions page: every open suggested edit with its difference, to accept or decline.
export function editsSection(rerender) {
  if (!isGm()) return null;
  const box = el('section', { class: 'edits-section' });
  api('entries', { query: { edits: 1 } }).then(({ edits }) => {
    world.info = { ...world.info, edits_open: edits.length };
    if (!edits.length) { setKids(box); return; }
    const decide = async (s, decision) => {
      try {
        const r = await api('entries', { method: 'PATCH', body: { edit_id: s.id, decision } });
        if (r.entry) world.entries.set(r.entry.id, r.entry);
        toast(decision === 'accept' ? `Applied ${s.by || 'the player'}’s edit` : 'Declined'); rerender();
      } catch (err) { toast(err.message, 'bad'); }
    };
    setKids(box, el('h3', { class: 'section-title' }, `Suggested edits (${edits.length})`),
      el('ul', { class: 'plain edit-list' }, edits.map((s) => {
        const cur = getEntry(s.entry_id);
        return el('li', { class: 'card' },
          el('div', { class: 'entry-head' }, el('div', {}, cur ? link(cur) : el('strong', {}, 'A deleted entry'), el('span', { class: 'muted small' }, ` · ${s.by || 'A player'}, ${whenTime(s.created_at)}`))),
          s.note ? el('p', { class: 'small' }, el('em', {}, `“${s.note}”`)) : null,
          cur && cur.version !== s.base_version ? el('p', { class: 'muted small' }, 'The entry has changed since they wrote this; the difference below is against how it is now.') : null,
          cur ? diffList(cur, s.proposal) : null,
          el('div', { class: 'btnrow' }, cur ? el('button', { class: 'btn small primary', type: 'button', onclick: () => decide(s, 'accept') }, 'Accept') : null,
            el('button', { class: 'btn small ghost', type: 'button', onclick: () => decide(s, 'decline') }, 'Decline')));
      })));
  }).catch((err) => setKids(box, el('p', { class: 'muted small' }, err.message)));
  return box;
}

// Players, on My things: the edits they suggested and how they went.
export function myEditsSection() {
  if (!isMember() || isGm()) return null;
  const box = el('section', {});
  api('entries', { query: { edits: 1 } }).then(({ edits }) => {
    if (!edits.length) return;
    const word = { open: 'Waiting for a GM', accepted: 'Accepted', declined: 'Declined' };
    setKids(box, el('h3', { class: 'section-title' }, 'Edits you suggested'),
      el('ul', { class: 'entry-list' }, edits.map((s) => { const e = getEntry(s.entry_id); return el('li', {}, e ? link(e) : el('span', {}, 'An entry'), el('span', { class: `tag edit-${s.status}` }, word[s.status] || s.status), el('span', { class: 'muted small' }, whenTime(s.created_at))); })));
  }).catch(() => {});
  return box;
}
