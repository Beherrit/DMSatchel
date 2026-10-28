// Search everything: Ctrl+K (⌘K on a Mac) or "/" opens one box for pages, actions, world entries and rules.
import { el, setKids } from './dom.js';
import { TOOL_LIST } from './tool-list.js';
import { KINDS, KIND_ORDER } from './world-schema.js';
import { session, isGm, isAdmin, isOwner, isPlayer } from './api.js';

// The rules, magic items and the world load the first time the palette opens, not with every page.
let M = null;
async function loadData() {
  if (!M) {
    const [rules, items, store] = await Promise.all([import('./rules2024.js'), import('./magic-items.js'), import('./world-store.js')]);
    M = { ...rules, MAGIC_ITEMS: items.MAGIC_ITEMS, store };
  }
  return M;
}

let dialog, input, list, items = [], active = 0;

function baseItems() {
  const out = [
    ...TOOL_LIST.map((t) => ({ label: t.label, group: 'Table tools', href: `#tools/${t.id}` })),
    { label: 'Character Forge', group: 'Pages', href: '#characters', hint: 'Roll a 2024-rules character' },
    { label: 'World', group: 'Pages', href: '#world' },
    { label: 'The Party', group: 'World', href: '#world/party', hint: 'Party members, treasury, loot log, handouts' },
    { label: 'Calendar', group: 'World', href: '#world/calendar', hint: 'Today’s date, moons, holidays, days pass' },
    { label: 'Export & print', group: 'World', href: '#world/export', hint: 'Markdown or a print page, GM or player copy' },
    { label: 'Your library', group: 'World', href: '#world/library', hint: 'Monsters, items, classes and species from your books' },
    { label: 'Who stands where', group: 'World', href: '#world/powers', hint: 'Faction relationship grid: allies, rivals, wars' },
    { label: 'Faction clocks', group: 'World', href: '#world/clocks', hint: 'Plans in motion; run a faction turn' },
    { label: 'Table talk', group: 'World', href: '#world/table', hint: 'What players and GMs are saying' },
    { label: 'Maps', group: 'World', href: '#world/maps' },
    { label: 'Relationship web', group: 'World', href: '#world/web' },
    { label: 'Party standing', group: 'World', href: '#world/standings' },
    ...KIND_ORDER.map((k) => ({ label: KINDS[k].plural, group: 'World', href: `#world/k/${k}` })),
    ...['classes', 'species', 'backgrounds', 'feats', 'spells', 'items', 'slots'].map((t) => ({ label: `Reference: ${t === 'slots' ? 'spell slots' : t === 'items' ? 'magic items' : t}`, group: 'Pages', href: `#reference/${t}` })),
    ...Object.keys(M.CLASSES).map((c) => ({ label: c, group: 'Class', href: '#reference/classes', filter: c })),
    ...Object.keys(M.SPECIES).map((c) => ({ label: c, group: 'Species', href: '#reference/species', filter: c })),
    ...Object.keys(M.BACKGROUNDS).map((c) => ({ label: c, group: 'Background', href: '#reference/backgrounds', filter: c })),
    ...Object.keys(M.ORIGIN_FEATS).map((c) => ({ label: c, group: 'Feat', href: '#reference/feats', filter: c })),
    ...M.MAGIC_ITEMS.map((i) => ({ label: i.name, group: i.cursed ? 'Cursed item' : 'Magic item', href: '#reference/items', filter: i.name, hint: i.summary })),
  ];
  if (isGm()) {
    out.push({ label: 'GM discussions', group: 'World', href: '#world/talk' });
    for (const k of KIND_ORDER) out.push({ label: `New ${KINDS[k].label === 'NPC' ? 'NPC' : KINDS[k].label.toLowerCase()}`, group: 'Create', href: `#world/new/${k}` });
  }
  if (isPlayer()) out.push({ label: 'New character', group: 'Create', href: '#world/new/character' }, { label: 'New journal entry', group: 'Create', href: '#world/new/journal' }, { label: 'My things', group: 'World', href: '#world/mine' });
  if (isGm()) out.push({ label: 'Import notes', group: 'World', href: '#world/import', hint: 'Markdown files, an Obsidian folder, or pasted text' }, { label: 'Suggestions from players', group: 'World', href: '#world/suggestions' }, { label: 'Session prep', group: 'World', href: '#world/prep', hint: 'Everything for next session on one page' });
  if (isOwner() || isAdmin()) out.push({ label: 'Admin', group: 'Pages', href: '#admin' }, { label: 'Members & invites', group: 'Admin', href: '#admin/members' });
  out.push({ label: 'Worlds', group: 'Pages', href: '#worlds', hint: 'Switch, create or join a world' });
  return out;
}

function entryItems() {
  return M.store.worldEntries().map((e) => ({ label: e.name, group: M.store.kindLabel(e.kind), href: `#world/e/${e.id}`, hint: e.summary, haystack: `${e.name} ${(e.tags || []).join(' ')} ${Object.values(e.fields || {}).join(' ')}` }));
}

function score(item, q) {
  const name = item.label.toLowerCase();
  if (!q) return item.group === 'Table tools' || item.group === 'Pages' ? 1 : 0;
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.split(/[\s’'-]+/).some((w) => w.startsWith(q))) return 60;
  if (name.includes(q)) return 40;
  if ((item.haystack || '').toLowerCase().includes(q)) return 15;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => `${name} ${(item.haystack || '').toLowerCase()} ${item.group.toLowerCase()}`.includes(w))) return 20;
  return 0;
}

function render() {
  if (!M) return;
  const q = input.value.trim().toLowerCase();
  const all = [...baseItems(), ...entryItems()];
  items = all.map((it) => [score(it, q), it]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0] || a[1].label.localeCompare(b[1].label)).slice(0, 40).map(([, it]) => it);
  active = Math.min(active, Math.max(0, items.length - 1));
  setKids(list, ...(items.length ? items.map((it, i) => el('li', { role: 'option', id: `pal-${i}`, 'aria-selected': String(i === active), class: i === active ? 'active' : '', onmousedown: (ev) => { ev.preventDefault(); go(it); }, onmousemove: () => { if (active !== i) { active = i; mark(); } } },
    el('span', { class: 'pal-label' }, it.label), it.hint ? el('span', { class: 'pal-hint' }, it.hint.length > 70 ? `${it.hint.slice(0, 68)}…` : it.hint) : null, el('span', { class: 'pal-group' }, it.group)))
    : [el('li', { class: 'pal-empty' }, M.store.world.loaded || session.configured !== true ? 'Nothing matches.' : 'Nothing matches yet. The world is still loading…')]));
  input.setAttribute('aria-activedescendant', items.length ? `pal-${active}` : '');
}
function mark() { [...list.children].forEach((li, i) => { li.classList.toggle('active', i === active); li.setAttribute('aria-selected', String(i === active)); }); input.setAttribute('aria-activedescendant', `pal-${active}`); list.children[active]?.scrollIntoView({ block: 'nearest' }); }

function go(it) {
  dialog.close();
  location.hash = it.href.slice(1);
  if (it.filter) setTimeout(() => { const f = document.getElementById('ref-filter'); if (f) { f.value = it.filter; f.dispatchEvent(new Event('input')); } }, 50);
}

export async function openPalette() {
  input.value = ''; active = 0; dialog.showModal(); input.focus();
  setKids(list, el('li', { class: 'pal-empty' }, 'Loading…'));
  await loadData();
  render();
  if (session.configured === true && !M.store.world.loaded) M.store.loadWorld().then(() => { if (dialog.open) render(); });
}

export function initPalette() {
  input = el('input', { type: 'search', id: 'pal-input', placeholder: 'Search tools, world entries, classes, feats…', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'pal-list', autocomplete: 'off', spellcheck: 'false' });
  list = el('ul', { id: 'pal-list', role: 'listbox', class: 'pal-list' });
  dialog = el('dialog', { class: 'dialog palette', 'aria-label': 'Search everything' }, input, list, el('p', { class: 'pal-foot muted small' }, '↑ ↓ to move · Enter to open · Esc to close'));
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown') { active = Math.min(items.length - 1, active + 1); mark(); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp') { active = Math.max(0, active - 1); mark(); ev.preventDefault(); }
    else if (ev.key === 'Enter' && items[active]) { go(items[active]); ev.preventDefault(); }
  });
  document.body.append(dialog);
  document.addEventListener('keydown', (ev) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((ev.key === 'k' || ev.key === 'K') && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); if (dialog.open) dialog.close(); else openPalette(); }
    else if (ev.key === '/' && !typing && !dialog.open) { ev.preventDefault(); openPalette(); }
  });
}
