// Traps on a place's page: GMs keep the list (add, mark armed/found/disarmed/sprung, remove); players see only the traps
// already found, disarmed or sprung (the server never sends armed ones). Plus the armed traps at and inside a place,
// for session prep and the map.
import { el, toast } from './dom.js';
import { isGm } from './api.js';
import { getEntry, patchEntry, worldEntries, link } from './world-store.js';
import { sessionOrder } from './appearances.js';
import { readTraps, addTrap, setTrap, removeTrap, TRAP_STATES } from './traps.js';

const ICON = { armed: '⚠', found: '👁', disarmed: '✔', sprung: '💥' };
const PLACES = ['location', 'area'];

export function trapsCard(place, rerender) {
  if (!PLACES.includes(place.kind)) return null;
  const list = readTraps(place), gm = isGm();
  if (!list.length && !gm) return null;
  const save = async (next, msg) => { try { await patchEntry(getEntry(place.id) || place, { fields: { traps: JSON.stringify(next) } }); if (msg) toast(msg); rerender(); } catch (err) { toast(err.message, 'bad'); } };
  const text = el('input', { type: 'text', id: 'trap-new', maxlength: 300, placeholder: 'A trap: “Pit under the rug, DC 15 to spot”', 'aria-label': 'New trap' });
  const add = gm ? el('form', { class: 'controls trap-add' }, text, el('button', { class: 'btn small', type: 'submit' }, 'Add trap')) : null;
  add?.addEventListener('submit', (ev) => { ev.preventDefault(); if (!text.value.trim()) { text.focus(); return; } save(addTrap(list, text.value), 'Trap added'); });
  return el('section', { class: 'card traps' }, el('h3', {}, gm ? 'Traps' : 'Traps found here'),
    gm ? el('p', { class: 'muted small' }, 'Players only see a trap once it’s found, disarmed or sprung.') : null,
    list.length ? el('ul', { class: 'plain trap-list' }, list.map((t) => el('li', { class: `trap ${t.state}` }, el('span', { 'aria-hidden': 'true' }, `${ICON[t.state]} `), t.text,
      gm ? el('span', { class: 'trap-tools' }, ' ',
        el('select', { 'aria-label': `State of: ${t.text}`, onchange: async (ev) => { const st = ev.target.value; await save(setTrap(list, t.id, st)); if (st === 'sprung' || st === 'found') noteTrap(place, t.text, st); } }, TRAP_STATES.map((s) => el('option', { value: s, selected: s === t.state || null }, s))),
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove trap: ${t.text}`, onclick: () => save(removeTrap(list, t.id)) }, '✕'))
        : el('span', { class: 'muted small' }, ` · ${t.state}`)))) : el('p', { class: 'muted small' }, 'No traps here.'),
    add);
}

// The armed traps at a place and anywhere inside it: [{ place, trap }].
export function armedTrapsIn(place) {
  if (!place) return [];
  const inside = (p) => { for (let x = p, i = 0; x && i < 12; x = x.parent_id && getEntry(x.parent_id), i++) if (x.id === place.id) return true; return false; };
  return worldEntries().filter((p) => PLACES.includes(p.kind) && inside(p)).flatMap((p) => readTraps(p).filter((t) => t.state === 'armed').map((trap) => ({ place: p, trap })));
}

// Traps in prep: the armed traps where the party is.
export function trapsPrepLine(here) {
  if (!isGm()) return null;
  const ts = armedTrapsIn(here); if (!ts.length) return null;
  return el('div', { class: 'small prep-traps' }, el('strong', {}, `⚠ Armed traps here (${ts.length}): `),
    el('ul', { class: 'plain' }, ts.slice(0, 10).map(({ place, trap }) => el('li', {}, place.id === here.id ? '' : [link(place), ': '], trap.text))));
}

// It went off: a trap sprung (or found) can be noted in the latest session's log.
async function noteTrap(place, text, state) {
  const last = sessionOrder(worldEntries())[0];
  if (!last || !confirm(`Note it in ${last.name}’s log?`)) return;
  const line = `${state === 'sprung' ? 'A trap went off' : 'A trap was found'} at [[${place.name}]]: ${text}`;
  try { await patchEntry(getEntry(last.id) || last, { body: `${String(last.body || '').replace(/\s+$/, '')}${last.body ? '\n\n' : ''}${line}` }); toast(`Noted in ${last.name}`); } catch (err) { toast(err.message, 'bad'); }
}

// Trap tally: the traps found, disarmed and sprung across the world (GMs also see the armed ones). → { armed, found, disarmed, sprung }.
export function trapTally() {
  const n = { armed: 0, found: 0, disarmed: 0, sprung: 0 };
  for (const p of worldEntries().filter((x) => PLACES.includes(x.kind))) for (const t of readTraps(p)) n[t.state] += 1;
  return n;
}
