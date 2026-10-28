// Handouts for one player (GMs): give a hidden entry to chosen players, who see it marked "Just for you" while
// everyone else, other players included, still can't. Revealing it to players later works as usual.
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { world, getEntry } from './world-store.js';

export function shareButton(e, rerender) {
  if (!isGm() || e.visibility !== 'gm' || e.status === 'suggested') return null;
  const n = e.shared_with?.length || 0;
  return el('button', { class: 'btn small', type: 'button', title: 'Let chosen players see this while it stays hidden from the rest', onclick: () => openDialog(e, rerender) },
    n ? `Given to ${n} player${n === 1 ? '' : 's'}` : 'Give to players…');
}

async function openDialog(e, rerender) {
  let members;
  try { members = (await api('party', { query: { members: 1 } })).members.filter((m) => m.role === 'player'); } catch (err) { toast(err.message, 'bad'); return; }
  const have = new Set(e.shared_with || []);
  const boxes = members.map((m) => el('input', { type: 'checkbox', value: m.id, checked: have.has(m.id), id: `sh-${m.id}` }));
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'sh-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'sh-title' }, `Give “${e.name}” to…`),
    el('p', { class: 'muted small' }, 'The players you tick can open it (it shows as “Just for you”); everyone else still can’t, other players included. The GM secret stays with the GMs.'),
    members.length ? el('ul', { class: 'plain share-list' }, members.map((m, i) => el('li', {}, el('label', { class: 'check', for: `sh-${m.id}` }, boxes[i], ` ${m.name}`, m.pronouns ? el('span', { class: 'muted small' }, ` (${m.pronouns})`) : null))))
      : el('p', { class: 'muted' }, 'This world has no players yet. Invite some from the Admin page.'),
    el('div', { class: 'btnrow' }, members.length ? el('button', { class: 'btn primary', type: 'submit' }, 'Save') : null, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const share = boxes.filter((b) => b.checked).map((b) => Number(b.value));
    try {
      const r = await api('entries', { method: 'PATCH', body: { id: e.id, share } });
      world.entries.set(r.entry.id, r.entry);
      const names = members.filter((m) => share.includes(m.id)).map((m) => m.name);
      toast(names.length ? `${getEntry(e.id).name} given to ${names.join(', ')}` : 'Taken back: only the GMs can see it');
      d.close(); rerender();
    } catch (err) { toast(err.message, 'bad'); }
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}
