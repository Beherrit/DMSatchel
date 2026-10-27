// The world switcher in the header, the Worlds page (create, join, browse) and invite links (#join/<code>).
import { $, el, toast, copyText, setKids } from './dom.js';
import { api, session, onSession, setWorld, currentWorld, joinWorld, refreshWorlds, signedIn, sessionReady } from './api.js';
import { openSignIn } from './signin.js';

const ROLE_LABEL = { owner: 'Owner', gm: 'GM', player: 'Player' };

export function initWorldSwitcher() {
  const box = $('#world-switch');
  const render = () => {
    if (session.configured !== true) { box.hidden = true; return; }
    box.hidden = false;
    const cur = currentWorld();
    const menu = el('div', { class: 'ws-menu', role: 'menu' },
      session.worlds.length ? session.worlds.map((w) => el('button', { type: 'button', role: 'menuitem', class: `ws-item${cur?.id === w.id ? ' current' : ''}`, onclick: () => { close(); setWorld(w.slug); location.hash = 'world'; } },
        el('span', {}, w.name), el('span', { class: 'role' }, ROLE_LABEL[w.role] || w.role))) : el('p', { class: 'muted small ws-empty' }, signedIn() ? 'You’re not in any world yet.' : 'Sign in or use an invite link to join a world.'),
      el('hr'),
      el('a', { class: 'ws-item', href: '#worlds', role: 'menuitem', onclick: close }, 'All worlds…'),
      signedIn() ? el('a', { class: 'ws-item', href: '#worlds/new', role: 'menuitem', onclick: close }, '+ Create a world') : null,
      el('a', { class: 'ws-item', href: '#join', role: 'menuitem', onclick: close }, 'Join with an invite'));
    const btn = el('button', { class: 'btn ws-btn', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', onclick: () => { const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); } },
      el('span', { class: 'ws-label' }, cur?.name || session.worldInfo?.name || 'Worlds'), el('span', { 'aria-hidden': 'true' }, '▾'));
    menu.hidden = true;
    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    setKids(box, btn, menu);
  };
  document.addEventListener('click', (e) => { if (!box.contains(e.target)) { const m = box.querySelector('.ws-menu'); if (m) m.hidden = true; } });
  onSession(render);
  render();
}

// ---- Worlds page ---------------------------------------------------------------------------------

let root;
export function mountWorlds(r) { root = r; }

function codeCard(code, world) {
  return el('div', { class: 'code-box', role: 'status' },
    el('p', {}, el('strong', {}, 'Your personal code'), ' (shown once). Keep it somewhere safe: it signs you in on other devices.'),
    el('div', { class: 'code-row' }, el('code', {}, code), el('button', { class: 'btn small', type: 'button', onclick: () => copyText(code) }, 'Copy')),
    el('a', { class: 'btn primary', href: '#world', onclick: () => setWorld(world.slug) }, `Go to ${world.name}`));
}

export function joinForm(prefill) {
  const status = el('p', { class: 'form-status', role: 'status' });
  const invite = el('input', { type: 'text', id: 'j-invite', value: prefill || '', placeholder: 'XXXX-XXXX-XXXX', spellcheck: 'false', autocomplete: 'off' });
  const name = el('input', { type: 'text', id: 'j-name', placeholder: 'How the others will see you', maxlength: 60 });
  const out = el('div');
  const form = el('form', { class: 'card edit-form join-form' },
    el('h3', {}, 'Join a world'),
    el('p', { class: 'muted' }, signedIn() ? `You’ll join as ${session.gm.name}.` : 'Your invite link or code makes you a GM or a player in that world. New here? Pick a name and you’ll get your own sign-in code.'),
    el('div', { class: 'field' }, el('label', { for: 'j-invite' }, 'Invite code'), invite),
    signedIn() ? null : el('div', { class: 'field' }, el('label', { for: 'j-name' }, 'Your name'), name),
    status, el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Join'),
      signedIn() ? null : el('button', { class: 'btn ghost', type: 'button', onclick: openSignIn }, 'I already have a code')), out);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Joining…'; status.className = 'form-status';
    try {
      const r = await joinWorld(invite.value, name.value);
      status.textContent = `You’re in ${r.world.name} as ${ROLE_LABEL[r.role] || r.role}.`;
      if (r.code) setKids(out, codeCard(r.code, r.world));
      else { toast(`Welcome to ${r.world.name}`); location.hash = 'world'; }
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

function createForm() {
  const status = el('p', { class: 'form-status', role: 'status' });
  const name = el('input', { type: 'text', id: 'c-wname', required: true, maxlength: 120, placeholder: 'e.g. The Shattered Coast' });
  const tagline = el('input', { type: 'text', id: 'c-wtag', maxlength: 240, placeholder: 'One line that sets the tone (optional)' });
  const pub = el('input', { type: 'checkbox', id: 'c-wpub' });
  const form = el('form', { class: 'card edit-form', id: 'create-world' },
    el('h3', {}, 'Create a world'),
    el('p', { class: 'muted' }, 'You’ll be its owner. Then share a GM invite with your co-GMs and a player invite with your players.'),
    el('div', { class: 'field' }, el('label', { for: 'c-wname' }, 'Name'), name),
    el('div', { class: 'field' }, el('label', { for: 'c-wtag' }, 'Tagline'), tagline),
    el('label', { class: 'check' }, pub, ' Anyone with the link can read it (players still need an invite to add things)'),
    status, el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Create world')));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await api('worlds', { method: 'POST', body: { name: name.value, tagline: tagline.value, public: pub.checked } });
      await refreshWorlds(); setWorld(r.world.slug);
      toast(`Created ${r.world.name}`); location.hash = 'admin/members';
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

export async function showWorlds(sub) {
  const [view, arg] = (sub || '').split('/');
  if (session.configured === null) { setKids(root, el('p', { class: 'muted' }, 'Loading…')); await sessionReady; }
  if (session.configured !== true) {
    setKids(root, el('div', { class: 'card empty-state' }, el('h3', {}, 'Worlds aren’t available here'), el('p', {}, 'This copy of the app isn’t connected to its server.')));
    return;
  }
  if (view === 'join') { setKids(root, el('div', { class: 'panel-head' }, el('h2', {}, 'You’ve been invited')), joinForm(arg)); return; }
  setKids(root, el('div', { class: 'panel-head' }, el('h2', {}, 'Worlds'), el('p', {}, 'Every world has its own GMs, players, maps and lore. Switch between them from the menu at the top.')), el('p', { class: 'muted' }, 'Loading…'));
  let data = { mine: session.worlds, public: [] };
  try { data = await api('worlds'); } catch { /* show what we know */ }
  const card = (w, mine) => el('li', { class: `world-card card${currentWorld()?.id === w.id ? ' current' : ''}` },
    el('div', { class: 'entry-head' }, el('h3', {}, w.name), mine ? el('span', { class: 'role' }, ROLE_LABEL[w.role] || w.role) : el('span', { class: 'muted small' }, `${w.entries} entries`)),
    w.tagline ? el('p', { class: 'muted' }, w.tagline) : null,
    el('div', { class: 'btnrow' }, el('a', { class: 'btn primary small', href: '#world', onclick: () => setWorld(w.slug) }, mine ? 'Open' : 'Browse'),
      mine && w.role === 'owner' ? el('a', { class: 'btn small ghost', href: '#admin/members', onclick: () => setWorld(w.slug, { silent: true }) }, 'Members & invites') : null));
  root.lastChild.replaceWith(el('div', { class: 'worlds-page' },
    data.mine.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Your worlds'), el('ul', { class: 'world-grid' }, data.mine.map((w) => card(w, true))))
      : el('div', { class: 'card empty-state' }, el('h3', {}, signedIn() ? 'You’re not in a world yet' : 'Sign in or join'), el('p', {}, signedIn() ? 'Create one below, or join a friend’s with their invite code.' : 'Use an invite link from your GM, or sign in with your personal code.'),
        signedIn() ? null : el('button', { class: 'btn primary', type: 'button', onclick: openSignIn }, 'Sign in')),
    el('div', { class: 'admin-grid' }, signedIn() ? createForm() : null, joinForm()),
    data.public.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Open worlds'), el('p', { class: 'muted' }, 'Worlds their owners have opened for anyone to read.'), el('ul', { class: 'world-grid' }, data.public.map((w) => card(w, false)))) : null));
  if (view === 'new') document.getElementById('c-wname')?.focus();
}
