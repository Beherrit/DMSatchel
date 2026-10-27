// The members-only screen: when the site admin locks the site, signed-out visitors see only this (sign in, or
// join with an invite link) instead of the tools and worlds. The server refuses their requests either way.
import { $, el, setKids } from './dom.js';
import { session, onSession } from './api.js';
import { openSignIn } from './signin.js';
import { joinForm } from './worlds-ui.js';

export function initGate() {
  const box = $('#gate');
  let gated = false;
  const show = () => {
    const code = location.hash.startsWith('#join/') ? decodeURIComponent(location.hash.slice(6)) : '';
    setKids(box, el('div', { class: 'gate-inner' },
      el('section', { class: 'card gate-card' }, el('h2', {}, 'Members only'),
        el('p', {}, 'This table’s satchel is private. Sign in with your personal code, or use the invite link your GM sent you.'),
        el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: openSignIn }, 'Sign in'))),
      joinForm(code)));
  };
  const open = () => { gated = false; document.body.classList.remove('gated'); box.hidden = true; setKids(box); };
  const render = () => {
    if (session.locked && !session.gm) {
      if (!gated) { gated = true; document.body.classList.add('gated'); box.hidden = false; show(); }
      return;
    }
    if (!gated) return;
    // Just signed in or joined. A newcomer's personal code appears in the join form a moment later and is shown
    // only once, so if it's there, stay on this screen until they follow the link to their world.
    setTimeout(() => { if (!box.querySelector('.code-box')) open(); });
  };
  box.addEventListener('click', (ev) => { if (ev.target.closest('.code-box a')) open(); });
  addEventListener('hashchange', () => { if (gated && !session.gm) show(); });
  onSession(render);
  render();
}
