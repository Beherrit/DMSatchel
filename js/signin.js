// The GM sign-in dialog and the account button in the header.
import { $, el, toast, setKids } from './dom.js';
import { session, signIn, signOut, onSession } from './api.js';

let dialog;

export function openSignIn() {
  if (session.configured === false) { toast('The shared world isn’t connected yet. See the README to finish setup.'); return; }
  dialog.querySelector('.form-status').textContent = '';
  dialog.showModal();
  dialog.querySelector('input').focus();
}

function renderAccount() {
  const box = $('#account');
  setKids(box, session.gm
    ? el('span', { class: 'who' }, el('span', { class: 'who-name' }, session.gm.name), el('span', { class: 'role' }, session.gm.role === 'admin' ? 'Admin' : 'GM'),
      el('button', { class: 'btn small ghost', type: 'button', onclick: async () => { await signOut(); toast('Signed out'); } }, 'Sign out'))
    : el('button', { class: 'btn small', type: 'button', onclick: openSignIn }, 'GM sign in'));
  document.body.classList.toggle('is-gm', Boolean(session.gm));
  document.body.classList.toggle('is-admin', session.gm?.role === 'admin');
}

export function initSignIn() {
  const status = el('p', { class: 'form-status', role: 'status' });
  const input = el('input', { type: 'text', id: 'signin-code', autocomplete: 'one-time-code', placeholder: 'XXXX-XXXX-XXXX', spellcheck: 'false' });
  dialog = el('dialog', { class: 'dialog', 'aria-labelledby': 'signin-title' },
    el('form', { method: 'dialog', class: 'dialog-body' },
      el('h2', { id: 'signin-title' }, 'GM sign in'),
      el('p', { class: 'muted' }, 'Enter the invite code your admin gave you. You’ll stay signed in on this device for 60 days.'),
      el('div', { class: 'field' }, el('label', { for: 'signin-code' }, 'Invite code'), input),
      status,
      el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit', value: 'go' }, 'Sign in'), el('button', { class: 'btn ghost', type: 'button', onclick: () => dialog.close() }, 'Cancel'))));
  dialog.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Checking…'; status.className = 'form-status';
    try { const gm = await signIn(input.value); dialog.close(); input.value = ''; toast(`Welcome, ${gm.name}`); }
    catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  document.body.append(dialog);
  onSession(renderAccount);
  renderAccount();
}
