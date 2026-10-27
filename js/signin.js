// The GM sign-in dialog and the account button in the header.
import { $, el, toast, setKids } from './dom.js';
import { session, signIn, signOut, onSession, loadSession } from './api.js';

let dialog;

export async function openSignIn() {
  const status = dialog.querySelector('.form-status');
  // The page may have loaded before the database was connected, so ask the server again.
  if (session.configured !== true) await loadSession();
  const offline = session.configured === false || session.configured === 'offline';
  status.textContent = offline
    ? (session.configured === false
      ? 'Sign-in isn’t available yet: the shared world’s database isn’t connected. The site owner needs to connect Neon Postgres to this Vercel project and redeploy.'
      : 'Sign-in isn’t available in this copy of the app: it’s running without its server.')
    : '';
  status.className = offline ? 'form-status error' : 'form-status';
  dialog.querySelector('input').disabled = offline;
  dialog.querySelector('button[type="submit"]').disabled = offline;
  dialog.showModal();
  if (!offline) dialog.querySelector('input').focus();
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
