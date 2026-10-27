// Page routing. Sections: #tools/<tool> · #characters · #world/... · #reference/<tab> · #admin
import { $, $$, el } from './dom.js';
import { TOOLS } from './tools.js';
import { mountCharacters } from './character-ui.js';
import { mountWorld, showWorld, acceptDraft } from './world-ui.js';
import { mountReference, showReference } from './reference-ui.js';
import { mountAdmin, showAdmin } from './admin-ui.js';
import { initNotebook } from './notebook.js';
import { initSignIn } from './signin.js';
import { loadSession, onSession } from './api.js';
import { initPalette, openPalette } from './palette.js';

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
}

function route() {
  const h = location.hash.replace(/^#/, '');
  const [section, ...rest] = h.split('/');
  const known = ['tools', 'characters', 'world', 'reference', 'admin'];
  show(known.includes(section) ? section : 'tools', rest.join('/'));
}

$('#toolnav').append(...TOOLS.map((t) => el('a', { href: `#tools/${t.id}`, 'data-tool': t.id }, t.label)));
initNotebook();
initSignIn();
initPalette();
$('#search-btn').addEventListener('click', openPalette);
if (/Mac|iPhone|iPad/.test(navigator.platform)) $('#search-btn kbd').textContent = '⌘K';
addEventListener('hashchange', route);
window.addEventListener('world:draft', (ev) => acceptDraft(ev.detail));
onSession((s) => {
  if (location.hash.startsWith('#admin')) showAdmin(location.hash.split('/')[1]);
  $('.mainnav [data-section="admin"]').textContent = s.gm?.role === 'admin' ? 'Admin' : 'Build';
});
route();
loadSession();
