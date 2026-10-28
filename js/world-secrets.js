// Secrets and clues on the session prep page (GMs): a running list of things the party could find out, each one
// line that can [[link]] what it's about. Write about ten before a session, tick each one the party discovers (it's
// marked with the session it came out in), and whatever wasn't found carries over.
import { el, toast, setKids } from './dom.js';
import { api } from './api.js';
import { richText, when } from './world-store.js';
import { sortSecrets } from './secrets.js';

const AIM = 10;

export function secretsCard(prep, session) {
  let list = prep.secrets || [];
  const box = el('section', { class: 'card prep-card secrets-card', 'aria-labelledby': 'secrets-h' });
  const send = async (op) => {
    try { list = (await api('settings', { method: 'PATCH', body: { secret: op } })).secrets; draw(); return true; } catch (err) { toast(err.message, 'bad'); return false; }
  };
  let showFound = false;
  function row(s) {
    const tick = el('input', { type: 'checkbox', checked: Boolean(s.found_at), 'aria-label': s.found_at ? 'Not found after all' : 'The party found this out' });
    tick.addEventListener('change', () => send({ id: s.id, found: tick.checked, session }));
    const edit = el('button', { class: 'btn small ghost', type: 'button', 'aria-label': 'Edit secret', onclick: () => {
      const input = el('input', { type: 'text', value: s.text, 'aria-label': 'Secret', class: 'secret-edit' });
      const done = async () => { if (input.value.trim() !== s.text && !(await send({ id: s.id, text: input.value }))) return; draw(); };
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); done(); } if (ev.key === 'Escape') draw(); });
      setKids(li, input, el('button', { class: 'btn small', type: 'button', onclick: done }, 'Save'), el('button', { class: 'btn small ghost', type: 'button', onclick: draw }, 'Cancel'));
      input.focus();
    } }, '✎');
    const remove = el('button', { class: 'btn small ghost', type: 'button', 'aria-label': 'Remove secret', onclick: () => send({ remove: s.id }) }, '✕');
    const li = el('li', { class: `sc-item${s.found_at ? ' found' : ''}` }, el('label', { class: 'secret-tick' }, tick), el('div', { class: 'secret-text' }, richText(s.text),
      s.found_at ? el('span', { class: 'muted small' }, ` Found${s.found_in ? ` in session ${s.found_in}` : ''}, ${when(s.found_at)}`) : null), edit, remove);
    return li;
  }
  function draw() {
    const { open, found } = sortSecrets(list);
    const input = el('input', { type: 'text', id: 'secret-new', placeholder: 'e.g. The [[Mayor]] pays the bandits to stay away', maxlength: 600 });
    const add = el('form', { class: 'controls secret-add' }, el('label', { class: 'sr-only', for: 'secret-new' }, 'New secret'), input, el('button', { class: 'btn small', type: 'submit' }, 'Add'));
    add.addEventListener('submit', async (ev) => { ev.preventDefault(); if (!input.value.trim()) return; if (await send({ add: input.value })) document.getElementById('secret-new')?.focus(); });
    setKids(box, el('h3', { id: 'secrets-h' }, `Secrets and clues (${open.length})`),
      el('p', { class: 'muted small' }, open.length < AIM
        ? `Things the party could find out this session, from anyone or anywhere. About ${AIM} is plenty; ${open.length ? `${AIM - open.length} more would do it.` : 'write the first one.'} Tick one when it comes out; the rest carry over.`
        : 'Tick one when the party finds it out; the rest carry over to next time.'),
      open.length ? el('ul', { class: 'plain secret-list' }, open.map(row)) : null,
      add,
      found.length ? el('button', { class: 'btn small ghost', type: 'button', 'aria-expanded': String(showFound), onclick: () => { showFound = !showFound; draw(); } }, `${showFound ? 'Hide' : 'Show'} found (${found.length})`) : null,
      showFound && found.length ? el('ul', { class: 'plain secret-list' }, found.map(row)) : null);
  }
  draw();
  return box;
}
