// Page routing. Sections: #tools/<tool> · #characters · #world/... · #reference/<tab> · #admin
import { $, $$, el, toast } from './dom.js';
import { TOOL_LIST } from './tool-list.js';
import { initNotebook } from './notebook.js';
import { initSignIn } from './signin.js';
import { loadSession, onSession, isOwner, isAdmin, isGm } from './api.js';
import { initPalette, openPalette } from './palette.js';
import { initWorldSwitcher, mountWorlds, showWorlds } from './worlds-ui.js';
import { initShortcuts } from './shortcuts.js';
import { initGate } from './gate.js';
import { initTheme, initTextSize } from './theme.js';
import { initOutbox } from './outbox.js';

const mounted = new Set();
const panels = {};

// Each section's code loads the first time it's opened, so the first page shows sooner (above all on phones).
const lazy = (load) => { let p = null; return () => (p ||= load()); };
const sections = {
  tools: lazy(() => import('./tools.js')), characters: lazy(() => import('./character-ui.js')), world: lazy(() => import('./world-ui.js')),
  reference: lazy(() => import('./reference-ui.js')), admin: lazy(() => import('./admin-ui.js')),
};
let showing = 0;

function panel(id, mount) {
  if (!panels[id]) {
    panels[id] = el('section', { class: 'panel', id: `panel-${id}`, hidden: true });
    $('#panels').append(panels[id]);
  }
  if (!mounted.has(id)) { mounted.add(id); mount(panels[id]); }
  return panels[id];
}

async function show(section, sub) {
  const mine = ++showing;
  const mod = sections[section] ? await sections[section]().catch(() => null) : null;
  if (mine !== showing) return; // another page was opened while this one loaded
  if (sections[section] && !mod) { toast('Couldn’t load that page. Check your connection and try again.', 'bad'); return; }
  for (const p of Object.values(panels)) p.hidden = true;
  for (const a of $$('.mainnav a')) a.setAttribute('aria-current', a.dataset.section === section ? 'page' : 'false');
  $('#toolnav').hidden = section !== 'tools';
  document.body.dataset.section = section;
  $('#notebook').hidden = !['tools', 'characters'].includes(section);

  if (section === 'tools') {
    const tool = mod.TOOLS.find((t) => t.id === sub) || mod.TOOLS[0];
    for (const a of $$('#toolnav a')) a.setAttribute('aria-current', a.dataset.tool === tool.id ? 'page' : 'false');
    panel(`tool-${tool.id}`, tool.mount).hidden = false;
  } else if (section === 'characters') panel('characters', mod.mountCharacters).hidden = false;
  else if (section === 'world') { panel('world', mod.mountWorld).hidden = false; mod.showWorld(sub ? sub.split('/') : []); }
  else if (section === 'reference') { panel('reference', mod.mountReference).hidden = false; mod.showReference(sub); }
  else if (section === 'admin') { panel('admin', mod.mountAdmin).hidden = false; mod.showAdmin(sub); }
  else if (section === 'worlds' || section === 'join') { panel('worlds', mountWorlds).hidden = false; showWorlds(section === 'join' ? `join/${sub}` : sub); }
}

function route() {
  const h = location.hash.replace(/^#/, '');
  const [section, ...rest] = h.split('/');
  const known = ['tools', 'characters', 'world', 'reference', 'admin', 'worlds', 'join'];
  show(known.includes(section) ? section : 'tools', rest.join('/'));
}

$('#toolnav').append(...TOOL_LIST.map((t) => el('a', { href: `#tools/${t.id}`, 'data-tool': t.id }, t.label)));
initNotebook();
initSignIn();
initPalette();
initWorldSwitcher();
initShortcuts();
initGate();
initTheme();
initTextSize();
initOutbox();
$('#search-btn').addEventListener('click', openPalette);
if (/Mac|iPhone|iPad/.test(navigator.platform)) $('#search-btn kbd').textContent = '⌘K';
addEventListener('hashchange', route);
window.addEventListener('world:draft', (ev) => { sections.world().then((m) => m.acceptDraft(ev.detail)); });
onSession((s) => {
  if (location.hash.startsWith('#admin')) sections.admin().then((m) => m.showAdmin(location.hash.split('/')[1]));
  if (location.hash.startsWith('#worlds')) showWorlds(location.hash.split('/').slice(1).join('/'));
  $('.mainnav [data-section="admin"]').textContent = isOwner() || isAdmin() ? 'Admin' : isGm() ? 'Build' : 'World info';
});
route();
loadSession();
// Once the first page is up, fetch the other sections quietly, so they open instantly and (with the service worker)
// still work offline even if they were never opened.
const warm = () => { for (const load of Object.values(sections)) load().catch(() => {}); };
addEventListener('load', () => setTimeout(() => (window.requestIdleCallback || setTimeout)(warm), 2500), { once: true });

// Offline and install: the tools keep working without a connection; the shared world needs one.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => { /* fine without it */ });
addEventListener('offline', () => toast('You’re offline. Table tools, the Character Forge and Reference still work; the world needs a connection.'));
addEventListener('online', () => toast('Back online.'));
let installPrompt = null;
addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); installPrompt = ev; $('#install-btn').hidden = false; });
$('#install-btn').addEventListener('click', async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice.catch(() => null); installPrompt = null; $('#install-btn').hidden = true; });
addEventListener('appinstalled', () => { $('#install-btn').hidden = true; });
