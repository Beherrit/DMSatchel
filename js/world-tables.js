// Rolling your own tables: on a table's page, and in the "Your tables" tool (#tools/tables). Results can be copied,
// saved to the notebook or sent to the world as a new entry.
import { el, toast, setKids, copyText } from './dom.js';
import { isMember, session } from './api.js';
import { world, worldEntries, findByName, loadWorld, link, byName } from './world-store.js';
import { parseTable, rollTable, chances } from './rolltable.js';
import { makeRng } from './rng.js';
import { saveNote } from './notebook.js';

const rng = makeRng(`${Date.now()}:${Math.random()}`);
const rowsOf = (e) => parseTable(e?.fields?.rows);
// Other tables named in [[…]] inside a result.
const lookup = (name) => { const t = findByName(name); return t?.kind === 'table' ? rowsOf(t) : null; };
const sendToWorld = (entry) => window.dispatchEvent(new CustomEvent('world:draft', { detail: entry }));

function roller(table, { compact = false } = {}) {
  const results = el('ol', { class: 'roll-results', 'aria-live': 'polite' });
  const history = [];
  const roll = (n = 1) => {
    const rows = rowsOf(table);
    if (!rows.length) { toast('This table has no results yet'); return; }
    for (let i = 0; i < n; i++) { const r = rollTable(rows, rng, lookup); if (r) history.unshift(r.text); }
    history.splice(12);
    setKids(results, history.map((t, i) => el('li', { class: i < n ? 'new' : '' }, el('span', { class: 'roll-text' }, t),
      el('span', { class: 'roll-acts' },
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Copy: ${t}`, onclick: () => copyText(t) }, 'Copy'),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Save to notebook: ${t}`, onclick: () => { saveNote('Roll', `${table.name}: ${t.slice(0, 50)}`, t); } }, 'Notebook'),
        isMember() ? el('button', { class: 'btn small ghost world', type: 'button', 'aria-label': `Add to world: ${t}`, onclick: () => sendToWorld({ kind: 'lore', name: t.length > 60 ? `${t.slice(0, 57)}…` : t, body: `${t}\n\nRolled on [[${table.name}]].` }) }, 'Add to world') : null))));
  };
  return el('div', { class: `roller${compact ? ' compact' : ''}` },
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => roll(1) }, 'Roll'), el('button', { class: 'btn', type: 'button', onclick: () => roll(3) }, 'Roll 3')),
    results);
}

// On a table's page: the roller, then every line with its chance.
export function tableSection(e) {
  if (e.kind !== 'table') return null;
  const rows = rowsOf(e), odds = chances(rows);
  return el('section', { class: 'card roll-table' }, el('h3', {}, 'Roll it'), roller(e),
    rows.length ? el('details', {}, el('summary', {}, `All ${rows.length} results`),
      el('table', { class: 'odds' }, el('tbody', {}, rows.map((r, i) => el('tr', {}, el('td', { class: 'num' }, `${Math.round(odds[i] * 1000) / 10}%`), el('td', {}, r.text))))))
      : el('p', { class: 'muted small' }, 'Edit this table and write one result per line.'));
}

// The "Your tables" tool.
export function mountTables(root) {
  const head = el('div', { class: 'panel-head' }, el('h2', {}, 'Your tables'), el('p', {}, 'Random tables you and your group write in the world: roll them here during play. Weights (“3x …” or “1-4: …”), dice ({2d6}), choices ({red|blue}) and other tables ([[Name]]) all work.'));
  const body = el('div');
  root.append(head, body);
  let current = null;
  const draw = () => {
    const tables = world.loaded ? worldEntries().filter((e) => e.kind === 'table').sort(byName) : [];
    if (!tables.length) {
      setKids(body, el('div', { class: 'card' }, el('p', {}, session.configured === false ? 'Roll tables live in a world, which needs the database connected.' : world.loaded ? 'No roll tables in this world yet.' : 'Open a world to use its tables.'),
        isMember() ? el('a', { class: 'btn primary', href: '#world/new/table' }, 'Write a table') : null));
      return;
    }
    if (!current || !tables.some((t) => t.id === current)) current = tables[0].id;
    const sel = el('select', { id: 'tbl-pick', 'aria-label': 'Table' }, tables.map((t) => el('option', { value: t.id }, `${t.name}${t.fields?.category ? ` (${t.fields.category})` : ''}`)));
    sel.value = current;
    sel.addEventListener('change', () => { current = sel.value; draw(); });
    const t = tables.find((x) => x.id === current);
    setKids(body, el('div', { class: 'controls' }, sel, link(t, 'Open the table'), isMember() ? el('a', { class: 'btn small ghost', href: '#world/new/table' }, '+ New table') : null),
      el('div', { class: 'card' }, roller(t, { compact: true })));
  };
  draw();
  if (!world.loaded && session.configured !== false) loadWorld().then(draw).catch(() => {});
}
