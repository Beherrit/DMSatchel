// Page routing. Sections: #tools/<tool> · #characters · #world/... · #reference/<tab> · #admin
import { $, $$, el, toast } from './dom.js';
import { TOOLS } from './tools.js';
import { mountCharacters } from './character-ui.js';
import { mountWorld, showWorld, acceptDraft } from './world-ui.js';
import { mountReference, showReference } from './reference-ui.js';
import { mountAdmin, showAdmin } from './admin-ui.js';
import { initNotebook } from './notebook.js';
import { initSignIn } from './signin.js';
import { loadSession, onSession, isOwner, isAdmin, isGm } from './api.js';
import { initPalette, openPalette } from './palette.js';
import { initWorldSwitcher, mountWorlds, showWorlds } from './worlds-ui.js';

const mounted = new Set();
const panels = {};

function panel(id, mount) {
  if (!panels[id]) {
    panels[id] = el('section', { class: 'panel', id: `panel-${id}`, hidden: true });
    $('#panels').append(panels[id]);
  }
  if (!mounted.has(id)) { mounted.add(id); mount(panels[id]); }
  return panels[id];
}

function show(section, sub) {
  for (const p of Object.values(panels)) p.hidden = true;
  for (const a of $$('.mainnav a')) a.setAttribute('aria-current', a.dataset.section === section ? 'page' : 'false');
  $('#toolnav').hidden = section !== 'tools';
  document.body.dataset.section = section;
  $('#notebook').hidden = !['tools', 'characters'].includes(section);

  if (section === 'tools') {
    const tool = TOOLS.find((t) => t.id === sub) || TOOLS[0];
    for (const a of $$('#toolnav a')) a.setAttribute('aria-current', a.dataset.tool === tool.id ? 'page' : 'false');
    panel(`tool-${tool.id}`, tool.mount).hidden = false;
  } else if (section === 'characters') panel('characters', mountCharacters).hidden = false;
  else if (section === 'world') { panel('world', mountWorld).hidden = false; showWorld(sub ? sub.split('/') : []); }
  else if (section === 'reference') { panel('reference', mountReference).hidden = false; showReference(sub); }
  else if (section === 'admin') { panel('admin', mountAdmin).hidden = false; showAdmin(sub); }
  else if (section === 'worlds' || section === 'join') { panel('worlds', mountWorlds).hidden = false; showWorlds(section === 'join' ? `join/${sub}` : sub); }
}

function route() {
  const h = location.hash.replace(/^#/, '');
  const [section, ...rest] = h.split('/');
  const known = ['tools', 'characters', 'world', 'reference', 'admin', 'worlds', 'join'];
  show(known.includes(section) ? section : 'tools', rest.join('/'));
}

$('#toolnav').append(...TOOLS.map((t) => el('a', { href: `#tools/${t.id}`, 'data-tool': t.id }, t.label)));
initNotebook();
initSignIn();
initPalette();
initWorldSwitcher();
$('#search-btn').addEventListener('click', openPalette);
if (/Mac|iPhone|iPad/.test(navigator.platform)) $('#search-btn kbd').textContent = '⌘K';
addEventListener('hashchange', route);
window.addEventListener('world:draft', (ev) => acceptDraft(ev.detail));
onSession((s) => {
  if (location.hash.startsWith('#admin')) showAdmin(location.hash.split('/')[1]);
  if (location.hash.startsWith('#worlds')) showWorlds(location.hash.split('/').slice(1).join('/'));
  $('.mainnav [data-section="admin"]').textContent = isOwner() || isAdmin() ? 'Admin' : isGm() ? 'Build' : 'World info';
});
route();
loadSession();

// Offline and install: the tools keep working without a connection; the shared world needs one.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => { /* fine without it */ });
addEventListener('offline', () => toast('You’re offline. Table tools, the Character Forge and Reference still work; the world needs a connection.'));
addEventListener('online', () => toast('Back online.'));
let installPrompt = null;
addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); installPrompt = ev; $('#install-btn').hidden = false; });
$('#install-btn').addEventListener('click', async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice.catch(() => null); installPrompt = null; $('#install-btn').hidden = true; });
addEventListener('appinstalled', () => { $('#install-btn').hidden = true; });
