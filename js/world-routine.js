// Where are they now?: an NPC's page says where their daily routine puts them at the world's current hour, and a
// place's page lists who is there now. Read from the clock the GMs move on (Time and light).
import { el, setKids, toast } from './dom.js';
import { world, worldEntries, link, findByName, getEntry, patchEntry } from './world-store.js';
import { whereAt, aboutTown, regularsAt, unreadable, townByHour, rollRoutine } from './routine.js';
import { makeRng, randomSeed } from './rng.js';
import { isHired } from './hirelings.js';
import { isGm, previewing } from './api.js';
import { hhmm, partOfDay } from './clock.js';

const now = () => world.info?.clock?.minutes ?? null;
// The place a routine names: as written, then without "at"/"in", then without "the" ("at the Bell" → The Bell).
const placeOf = (name) => {
  const a = name.replace(/^(at|in) /i, '');
  for (const n of [name, a, a.replace(/^the /i, '')]) { const p = findByName(n); if (p && !['npc', 'character'].includes(p.kind)) return p; }
  return null;
};

// Hirelings go with the party: a hired NPC is wherever the party is (session prep's "where the party is"), whatever
// their routine says; on the road, nowhere in particular.
const partyPlace = () => (world.info?.party_at ? getEntry(world.info.party_at) : null);
const nowRoutine = (x) => (isHired(x) ? (partyPlace() ? `Always: ${partyPlace().name}` : '') : String(x.fields?.routine || ''));

export function routineNow(e) {
  if (e.kind === 'npc' && isHired(e)) { const p = partyPlace(); return el('p', { class: 'routine-now small' }, '🕰 With the party', p ? [': ', link(p)] : ', on the road', '.'); }
  if (e.kind !== 'npc' || !e.fields?.routine || ['Dead', 'Missing'].includes(e.fields?.status)) return null;
  const m = now();
  if (m === null) return null;
  const w = whereAt(e.fields.routine, m);
  if (!w) return el('p', { class: 'routine-now small muted' }, `🕰 ${hhmm(m)}, ${partOfDay(m)}: their routine doesn’t say where they are.`);
  const p = placeOf(w.place);
  return el('p', { class: 'routine-now small' }, `🕰 Now (${hhmm(m)}, ${partOfDay(m)}): `, p ? link(p) : el('strong', {}, w.place), w.until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(w.until)}`) : null);
}

// Who's here now: the NPCs whose routine puts them at this place at the current hour (as the viewer can see them).
export function hereNow(place) {
  if (['region', 'area', 'settlement'].includes(place.kind)) return aboutTownLine(place);
  if (['npc', 'character', 'session', 'quest', 'item', 'journal', 'event'].includes(place.kind)) return null;
  const m = now();
  if (m === null) return null;
  const here = worldEntries().filter((x) => x.kind === 'npc' && nowRoutine(x) && !['Dead', 'Missing'].includes(x.fields?.status))
    .map((x) => ({ x, w: whereAt(nowRoutine(x), m) })).filter(({ w }) => w && placeOf(w.place)?.id === place.id)
    .sort((a, b) => a.x.name.localeCompare(b.x.name));
  if (!here.length) return null;
  return el('p', { class: 'routine-here small' }, `🕰 Here now (${hhmm(m)}): `, here.map(({ x, w }, i) => [i ? ', ' : '', link(x), w.until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(w.until)}`) : null]));
}

// Who's about town: for a settlement, region or area, everyone whose routine puts them somewhere inside it now.
// Everyone whose routine puts them at this place or anywhere inside it at the current hour → { m, list } (list:
// [{ npc: { entry, … }, place, until }]), or null when the world has no clock.
export function aroundNow(town) {
  const m = now();
  if (m === null) return null;
  const inside = (p) => { for (let x = p, i = 0; x && i < 12; x = x.parent_id && getEntry(x.parent_id), i++) if (x.id === town.id) return true; return false; };
  const npcs = worldEntries().filter((x) => x.kind === 'npc' && nowRoutine(x) && !['Dead', 'Missing'].includes(x.fields?.status)).map((x) => ({ id: x.id, name: x.name, routine: nowRoutine(x), entry: x }));
  return { m, list: aboutTown(npcs, m, placeOf, inside) };
}

function aboutTownLine(town) {
  const a = aroundNow(town);
  if (!a?.list.length) return null;
  const { m, list } = a;
  return el('p', { class: 'routine-here small' }, `🕰 About ${town.kind === 'settlement' ? 'town' : 'here'} now (${hhmm(m)}): `,
    list.map(({ npc, place, until }, i) => [i ? '; ' : '', link(npc.entry), place.id === town.id ? '' : [' at ', link(place)], until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(until)}`) : null]));
}

// The regulars: for a single place (a tavern, a shop), the NPCs whose routine brings them here at some hour, and when.
export function regularsLine(place) {
  if (place.kind !== 'location') return null;
  const npcs = worldEntries().filter((x) => x.kind === 'npc' && x.fields?.routine && !isHired(x) && !['Dead', 'Missing'].includes(x.fields?.status)).map((x) => ({ id: x.id, name: x.name, routine: x.fields.routine, entry: x }));
  const list = regularsAt(npcs, (name) => placeOf(name)?.id === place.id);
  if (!list.length) return null;
  return el('p', { class: 'routine-regulars small' }, el('strong', {}, 'Regulars: '), list.map(({ npc, when }, i) => [i ? ', ' : '', link(npc.entry), el('span', { class: 'muted' }, ` (${when.join(', ').toLowerCase()})`)]));
}

// Routine as you type: under the field on an NPC's form, where the routine puts them right now, and the lines it
// can't read. box: the textarea.
export function routinePreview(box) {
  const out = el('p', { class: 'small routine-preview', 'aria-live': 'polite' });
  const draw = () => {
    const text = box.value, m = now() ?? 480;
    if (!text.trim()) { out.textContent = 'Write it like “Mornings: the Forge; evenings: the Bell; nights: home”, or with hours (“8-12: the market”), and “Otherwise:” for the rest.'; out.className = 'small muted routine-preview'; return; }
    const w = whereAt(text, m), bad = unreadable(text);
    const p = w ? placeOf(w.place) : null;
    setKids(out, `At ${hhmm(m)} (${partOfDay(m)}): `, w ? (p ? link(p) : el('strong', {}, w.place)) : 'nowhere it says', w && !p ? el('span', { class: 'muted' }, ' (not a place in the world yet)') : null,
      bad.length ? el('span', { class: 'bad-line' }, ` · Can’t read: ${bad.map((x) => `“${x}”`).join(', ')}`) : null);
    out.className = 'small routine-preview';
  };
  box.addEventListener('input', draw); draw();
  return out;
}

// Minding the shop: whether a place's owner (its Owner field naming an NPC with a routine) is there right now.
export function mindingLine(place) {
  if (place.kind !== 'location' || !place.fields?.owner) return null;
  const m = now();
  if (m === null) return null;
  const name = String(place.fields.owner).replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1').trim();
  const owner = findByName(name);
  if (!owner || owner.kind !== 'npc' || !owner.fields?.routine || ['Dead', 'Missing'].includes(owner.fields?.status)) return null;
  const w = whereAt(owner.fields.routine, m);
  if (!w) return null;
  const at = placeOf(w.place);
  if (at?.id === place.id) return el('p', { class: 'routine-minding small' }, '🛎 ', link(owner), ' is here, behind the counter', w.until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(w.until)}`) : null, '.');
  return el('p', { class: 'routine-minding small' }, '🛎 ', link(owner), ' is out: ', at ? link(at) : w.place, w.until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(w.until)}`) : null, '.');
}

// The town by the hour: for a settlement (or region or area), a table of who is where through the day, from routines.
export function townHoursBox(town) {
  if (!['region', 'area', 'settlement'].includes(town.kind)) return null;
  const inside = (p) => { for (let x = p, i = 0; x && i < 12; x = x.parent_id && getEntry(x.parent_id), i++) if (x.id === town.id) return true; return false; };
  const npcs = worldEntries().filter((x) => x.kind === 'npc' && x.fields?.routine && !isHired(x) && !['Dead', 'Missing'].includes(x.fields?.status)).map((x) => ({ id: x.id, name: x.name, routine: x.fields.routine, entry: x }));
  const t = townByHour(npcs, placeOf, inside);
  if (!t.rows.length) return null;
  return el('details', { class: 'town-hours' }, el('summary', {}, `The ${town.kind === 'settlement' ? 'town' : 'place'} by the hour (${t.rows.length})`),
    el('div', { class: 'table-wrap' }, el('table', { class: 'glance-table town-hours-table' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Who'), t.hours.map((h) => el('th', { scope: 'col' }, `${h.label} (${hhmm(h.m)})`)))),
      el('tbody', {}, t.rows.map((r) => el('tr', {}, el('th', { scope: 'row' }, link(r.npc.entry)), r.cells.map((c) => el('td', {}, c ? (c.id === town.id ? 'about town' : link(c)) : el('span', { class: 'muted' }, '—')))))))));
}

// Is a place's owner (its Owner field naming an NPC with a routine) there right now? → { owner, here } or null.
export function ownerIn(place) {
  const m = now();
  if (m === null || !place.fields?.owner) return null;
  const owner = findByName(String(place.fields.owner).replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1').trim());
  if (!owner || owner.kind !== 'npc' || !owner.fields?.routine || ['Dead', 'Missing'].includes(owner.fields?.status)) return null;
  const w = whereAt(owner.fields.routine, m);
  return w ? { owner, here: placeOf(w.place)?.id === place.id } : null;
}

// Routines for the whole town (GMs): roll a daily routine for every NPC in a settlement who hasn't one, check them in
// a dialog (each editable, each can be left out), and save the ones kept.
export function rollTownButton(town, rerender) {
  if (town.kind !== 'settlement' || !isGm() || previewing()) return null;
  const inside = (p) => { for (let x = p, i = 0; x && i < 12; x = x.parent_id && getEntry(x.parent_id), i++) if (x.id === town.id) return true; return false; };
  const npcs = worldEntries().filter((x) => x.kind === 'npc' && !String(x.fields?.routine || '').trim() && !['Dead', 'Missing'].includes(x.fields?.status) && x.parent_id && inside(getEntry(x.parent_id))).sort((a, b) => a.name.localeCompare(b.name));
  if (!npcs.length) return null;
  const open = () => {
    const places = worldEntries().filter((x) => x.kind === 'location' && inside(x)).map((x) => ({ name: x.name, type: x.fields?.type || '' }));
    const rng = makeRng(randomSeed());
    const rows = npcs.map((n) => ({ n, keep: el('input', { type: 'checkbox', id: `rt-${n.id}`, checked: true }), text: el('textarea', { rows: 2, 'aria-label': `Routine for ${n.name}` }, rollRoutine(rng, n.fields?.role || '', places)) }));
    const go = el('button', { class: 'btn primary', type: 'submit' }, 'Save these');
    const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'rt-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
      el('h2', { id: 'rt-title' }, `Routines for ${town.name}`),
      el('p', { class: 'muted small' }, 'A likely day for each, from their role and the places in town. Change any, or untick one to leave it out.'),
      el('ul', { class: 'plain routine-rolls' }, rows.map((r) => el('li', {}, el('label', { class: 'check', for: `rt-${r.n.id}` }, r.keep, ` ${r.n.name}${r.n.fields?.role ? ` (${r.n.fields.role})` : ''}`), r.text))),
      el('div', { class: 'btnrow' }, go, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
    d.querySelector('form').addEventListener('submit', async (ev) => {
      ev.preventDefault(); go.disabled = true;
      let saved = 0; const failed = [];
      for (const r of rows.filter((x) => x.keep.checked && x.text.value.trim())) {
        try { await patchEntry(world.entries.get(r.n.id) || r.n, { fields: { routine: r.text.value.trim().slice(0, 2000) } }); saved++; } catch { failed.push(r.n.name); }
      }
      toast([saved ? `${saved} routine${saved === 1 ? '' : 's'} saved` : '', failed.length ? `not saved: ${failed.join(', ')}` : ''].filter(Boolean).join(' · ') || 'Nothing saved', failed.length ? 'bad' : undefined);
      d.close(); rerender();
    });
    d.addEventListener('close', () => d.remove());
    document.body.append(d); d.showModal();
  };
  return el('p', { class: 'small' }, el('button', { class: 'btn small ghost', type: 'button', onclick: open }, `Roll routines for ${npcs.length} NPC${npcs.length === 1 ? '' : 's'} here without one`));
}
