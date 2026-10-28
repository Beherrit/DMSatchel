// Merge two entries (GMs): when the world has two entries for the same thing, fold this one into the other. Its text,
// fields, tags, connections, what's inside it, mentions, comments, standing, clocks and map pins move over, and
// this one goes to the bin.
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { worldEntries, findByName, loadWorld, kindLabel, byName } from './world-store.js';
import { similarNames } from './name-check.js';

export function mergeButton(e) {
  if (!isGm() || e.status === 'suggested') return null;
  return el('button', { class: 'btn small', type: 'button', title: 'Fold this entry into another one for the same thing', onclick: () => openDialog(e) }, 'Merge into…');
}

function openDialog(from) {
  const all = worldEntries().filter((x) => x.id !== from.id && x.status !== 'suggested');
  const near = similarNames(from.name, all, from.id), likely = [...near.exact, ...near.close];
  const sameKind = all.filter((x) => x.kind === from.kind).sort(byName);
  const target = el('input', { type: 'text', id: 'mg-into', list: 'mg-names', value: likely[0]?.name || '', placeholder: 'The entry to keep', autocomplete: 'off' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'mg-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'mg-title' }, `Merge ${from.name} into…`),
    el('div', { class: 'field' }, el('label', { for: 'mg-into' }, 'The entry to keep'), target,
      el('datalist', { id: 'mg-names' }, [...new Set([...likely, ...sameKind, ...all])].map((x) => el('option', { value: x.name }, kindLabel(x.kind))))),
    likely.length ? el('p', { class: 'small' }, 'Looks like the same thing: ', likely.slice(0, 3).map((x, i) => [i ? ', ' : '', el('button', { class: 'linkish', type: 'button', onclick: () => { target.value = x.name; } }, x.name)])) : null,
    el('p', { class: 'muted small' }, `${from.name}’s text, GM secret, fields, tags and connections are added to the one you keep; what’s inside ${from.name}, other entries’ connections and [[mentions]], table talk, GM discussion, standing, clocks and map pins move over. Then ${from.name} goes to the bin.`),
    status,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Merge'), el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const into = findByName(target.value.trim());
    if (!into || into.id === from.id) { status.textContent = 'Pick another entry from the world by its name.'; status.className = 'form-status error'; target.focus(); return; }
    status.textContent = 'Merging…'; status.className = 'form-status';
    try {
      const r = await api('entries', { method: 'PATCH', body: { merge: { from: from.id, into: into.id } } });
      await loadWorld(true);
      toast(`Merged ${from.name} into ${into.name}${r.moved ? ` (${r.moved} other entr${r.moved === 1 ? 'y' : 'ies'} updated)` : ''}`);
      d.close(); location.hash = `world/e/${into.id}`;
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal(); target.focus();
}
