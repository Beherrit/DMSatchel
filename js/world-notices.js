// Notices from the GMs: on the world's front page, and as a banner over every world page until each person
// dismisses it (remembered in their browser) or it runs out. GMs post and remove them from the front page.
import { el, toast, setKids } from './dom.js';
import { api, isGm, isMember, session } from './api.js';
import { world, when } from './world-store.js';

const dismissedKey = () => `satchel-notices-${session.worldKey || 'default'}`;
const dismissed = () => { try { return new Set(JSON.parse(localStorage.getItem(dismissedKey()) || '[]')); } catch { return new Set(); } };
const dismiss = (id) => { try { localStorage.setItem(dismissedKey(), JSON.stringify([...dismissed(), id].slice(-50))); } catch { /* private window */ } };
const list = () => (Array.isArray(world.info?.notices) ? world.info.notices : []);

// The newest notice this person hasn't dismissed, over the world pages.
export function drawNoticeBanner() {
  let b = document.getElementById('notice-banner');
  const n = isMember() && location.hash.startsWith('#world') ? list().find((x) => !dismissed().has(x.id)) : null;
  if (!n) { b?.remove(); return; }
  if (b?.dataset.id === n.id) return;
  b?.remove();
  b = el('div', { id: 'notice-banner', class: 'notice-banner', role: 'status', 'data-id': n.id },
    el('span', { class: 'notice-icon', 'aria-hidden': 'true' }, '📣'),
    el('span', { class: 'notice-text' }, n.text, el('span', { class: 'notice-by' }, ` · ${n.by || 'The GMs'}`)),
    el('button', { class: 'btn small ghost', type: 'button', 'aria-label': 'Dismiss this notice', onclick: () => { dismiss(n.id); drawNoticeBanner(); } }, 'Got it'));
  document.querySelector('.w-main')?.prepend(b);
}

async function send(op, msg, rerender) {
  try {
    const r = await api('settings', { method: 'PATCH', body: { notice: op } });
    const today = new Date().toISOString().slice(0, 10);
    world.info = { ...world.info, notices: r.notices.filter((n) => !n.until || n.until >= today) };
    toast(msg); rerender(); return true;
  } catch (err) { toast(err.message, 'bad'); return false; }
}

// On the front page: every current notice, and (GMs) a form to post one.
export function noticesCard(rerender) {
  if (!isMember()) return null;
  const items = list();
  if (!items.length && !isGm()) return null;
  let form = null;
  if (isGm()) {
    const text = el('textarea', { id: 'nt-text', rows: 2, maxlength: 500, placeholder: 'e.g. No game this Friday. Back on the 14th!' });
    const until = el('input', { type: 'date', id: 'nt-until', min: new Date().toISOString().slice(0, 10) });
    form = el('form', { class: 'nt-form' },
      el('div', { class: 'field wide' }, el('label', { for: 'nt-text' }, 'Post a notice to everyone'), text),
      el('div', { class: 'nt-row' }, el('div', { class: 'field' }, el('label', { for: 'nt-until' }, 'Show until (optional)'), until),
        el('button', { class: 'btn small primary', type: 'submit' }, 'Post notice')));
    form.addEventListener('submit', async (ev) => { ev.preventDefault(); if (!text.value.trim()) { text.focus(); return; } await send({ add: { text: text.value, until: until.value || null } }, 'Notice posted', rerender); });
  }
  return el('section', { class: 'card notices-card', 'aria-labelledby': 'nt-h' },
    el('h3', { id: 'nt-h' }, '📣 Notices'),
    items.length ? el('ul', { class: 'plain nt-list' }, items.map((n) => el('li', {},
      el('p', { class: 'nt-text' }, n.text),
      el('span', { class: 'muted small' }, `${n.by || 'A GM'}, ${when(n.at)}${n.until ? ` · until ${when(`${n.until}T12:00:00`)}` : ''}`),
      isGm() ? el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Take down: ${n.text}`, onclick: () => send({ remove: n.id }, 'Notice taken down', rerender) }, 'Take down') : null)))
      : null,
    isGm() && !items.length ? el('details', { class: 'nt-new' }, el('summary', {}, 'Post a notice for the whole table'), form) : form);
}
