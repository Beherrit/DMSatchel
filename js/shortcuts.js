// Keyboard shortcuts: "?" lists them; "g" then a letter jumps to a page; "n" starts a new world entry (GMs).
import { el } from './dom.js';
import { isGm, isMember } from './api.js';

const GO = { t: ['#tools', 'Table tools'], c: ['#characters', 'Character Forge'], w: ['#world', 'World'], p: ['#world/party', 'The Party'], m: ['#world/maps', 'Maps'],
  a: ['#world/atlas', 'Atlas'], d: ['#world/calendar', 'Calendar'], r: ['#reference', 'Reference'], e: ['#tools/encounters', 'Encounters & Travel'], x: ['#admin', 'Admin / Build'], s: ['#world/prep', 'Session prep'] };

let dialog;
function help() {
  if (!dialog) {
    const row = (keys, what) => el('tr', {}, el('td', {}, keys.map((k, i) => [i ? ' then ' : '', el('kbd', {}, k)])), el('td', {}, what));
    dialog = el('dialog', { class: 'dialog', 'aria-labelledby': 'keys-title' },
      el('div', { class: 'dialog-body' }, el('h2', { id: 'keys-title' }, 'Keyboard shortcuts'),
        el('table', { class: 'keys' }, el('tbody', {},
          row(['Ctrl K'], 'Search everything (⌘K on a Mac)'), row(['/'], 'Search everything'), row(['?'], 'This list'),
          row(['n'], 'New world entry (GMs; players get a new journal entry)'),
          row(['j'], 'Quick note: a journal entry about the page you’re on'),
          row(['['], 'Previous entry of the same kind'), row([']'], 'Next entry of the same kind'),
          row(['e'], 'Edit the entry you’re on'), row(['s'], 'Star it (your favorites)'), row(['f'], 'Follow it (hear about changes)'),
          Object.entries(GO).map(([k, [, label]]) => row(['g', k], `Go to ${label}`)),
          row(['Esc'], 'Close a dialog or a map pin'))),
        el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => dialog.close() }, 'Close'))));
    document.body.append(dialog);
  }
  dialog.showModal();
}

export function initShortcuts() {
  let pendingG = 0;
  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const a = document.activeElement;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(a?.tagName) || a?.isContentEditable || document.querySelector('dialog[open]')) return;
    if (pendingG && Date.now() - pendingG < 1200 && GO[ev.key]) { location.hash = GO[ev.key][0].slice(1); pendingG = 0; ev.preventDefault(); return; }
    pendingG = 0;
    if (ev.key === 'g') { pendingG = Date.now(); return; }
    if (ev.key === '?') { ev.preventDefault(); help(); return; }
    // On an entry's page: e edits, s stars, f follows (when that's open to you).
    if (['e', 's', 'f'].includes(ev.key) && location.hash.startsWith('#world/e/')) {
      const target = { e: '.entry-view .panel-head a.btn[href^="#world/edit/"]', s: '.entry-view .panel-head button.star', f: '.entry-view .panel-head button.follow' }[ev.key];
      const b = document.querySelector(target);
      if (b) { ev.preventDefault(); b.click(); }
      return;
    }
    if ((ev.key === '[' || ev.key === ']') && location.hash.startsWith('#world/e/')) { const a = document.querySelector(`.entry-nav a[rel="${ev.key === '[' ? 'prev' : 'next'}"]`); if (a) { ev.preventDefault(); location.hash = a.getAttribute('href').slice(1); } return; }
    if (ev.key === 'j' && isMember() && location.hash.startsWith('#world')) { ev.preventDefault(); import('./world-quicknote.js').then((m) => m.openQuickNote()); return; }
    if (ev.key === 'n' && isMember()) { ev.preventDefault(); location.hash = isGm() ? 'world/new/npc' : 'world/new/journal'; }
  });
}
