// Where are they now?: an NPC's page says where their daily routine puts them at the world's current hour, and a
// place's page lists who is there now. Read from the clock the GMs move on (Time and light).
import { el, setKids, toast } from './dom.js';
import { world, worldEntries, link, findByName, getEntry, patchEntry } from './world-store.js';
import { whereAt, aboutTown, regularsAt, townByHour, rollRoutine, dayOf, dueLater, busiestHour, crossPaths, atTaverns, ownerDay, timeAt, routineCheck } from './routine.js';
import { holidayToday, nextHoliday, tradingHours } from './shop-hours.js';
import { openBounties } from './bounty.js';
import { cleanCalendar } from './calendar.js';
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
  // The NPC's day: where they are through the day, under where they are now.
  const day = dayOf(e.fields.routine).filter((x) => x.place);
  const dayLine = day.length ? el('p', { class: 'routine-day small muted' }, 'Their day: ', day.map((x, i) => { const p = placeOf(x.place); return [i ? ' · ' : '', `${x.label.toLowerCase()} `, p ? link(p) : x.place]; })) : null;
  if (!w) return [el('p', { class: 'routine-now small muted' }, `🕰 ${hhmm(m)}, ${partOfDay(m)}: their routine doesn’t say where they are.`), dayLine];
  const p = placeOf(w.place);
  return [el('p', { class: 'routine-now small' }, `🕰 Now (${hhmm(m)}, ${partOfDay(m)}): `, p ? link(p) : el('strong', {}, w.place), w.until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(w.until)}`) : null), dayLine];
}

// Who's here now: the NPCs whose routine puts them at this place at the current hour (as the viewer can see them).
export function hereNow(place) {
  if (['region', 'area', 'settlement'].includes(place.kind)) return aboutTownLine(place);
  if (['npc', 'character', 'session', 'quest', 'item', 'journal', 'event'].includes(place.kind)) return null;
  // Who's in the back room: people in places inside this one (a back room, a cellar) count too, saying where.
  const a = aroundNow(place);
  if (!a?.list.length) return null;
  const { m, list } = a;
  return el('p', { class: 'routine-here small' }, `🕰 Here now (${hhmm(m)}): `, list.map(({ npc, place: at, until }, i) => [i ? ', ' : '', link(npc.entry), at.id === place.id ? null : [' (in ', link(at), ')'], until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(until)}`) : null]));
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
    const w = whereAt(text, m), { bad, unknown } = routineCheck(text, placeOf);
    const p = w ? placeOf(w.place) : null;
    // Unknown places as you type: the other places it names that aren't in the world (everyday ones like "home" aside).
    const others = unknown.filter((x) => !w || x.toLowerCase() !== w.place.toLowerCase());
    setKids(out, `At ${hhmm(m)} (${partOfDay(m)}): `, w ? (p ? link(p) : el('strong', {}, w.place)) : 'nowhere it says', w && !p ? el('span', { class: 'muted' }, ' (not a place in the world yet)') : null,
      bad.length ? el('span', { class: 'bad-line' }, ` · Can’t read: ${bad.map((x) => `“${x}”`).join(', ')}`) : null,
      others.length ? el('span', { class: 'unknown-places' }, ` · Not in the world yet: ${others.join(', ')}`) : null);
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
  // Who minds it meanwhile: the Minder field (linked when it names someone in the world).
  const minds = String(place.fields?.minder || '').replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1').trim(), mp = minds && findByName(minds);
  return el('p', { class: 'routine-minding small' }, '🛎 ', link(owner), ' is out: ', at ? link(at) : w.place, w.until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(w.until)}`) : null,
    minds ? ['; ', mp ? link(mp) : minds, ' minds the counter'] : '', '.');
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

// A quiet night: who's out at a place in the world at this minute (not "home"), for the clock's midnight toast.
export function outAndAbout(m) {
  return worldEntries().filter((x) => x.kind === 'npc' && nowRoutine(x) && !['Dead', 'Missing'].includes(x.fields?.status))
    .map((x) => { const w = whereAt(nowRoutine(x), m); const p = w && placeOf(w.place); return p ? { npc: x, place: p } : null; })
    .filter(Boolean).sort((a, b) => a.npc.name.localeCompare(b.npc.name));
}

// A night out: on a tavern's page, who's due in later tonight (before it shuts at 2), from their routines.
export function laterLine(place) {
  if (place.kind !== 'location' || place.fields?.type !== 'Tavern') return null;
  const m = now();
  if (m === null || (m >= 120 && m < 480)) return null; // shut: nobody's coming in
  const npcs = worldEntries().filter((x) => x.kind === 'npc' && x.fields?.routine && !isHired(x) && !['Dead', 'Missing'].includes(x.fields?.status)).map((x) => ({ id: x.id, name: x.name, routine: x.fields.routine, entry: x }));
  const list = dueLater(npcs, (name) => placeOf(name)?.id === place.id, m, 120);
  if (!list.length) return null;
  return el('p', { class: 'routine-later small' }, '🌙 Due in later: ', list.map(({ npc, at }, i) => [i ? ', ' : '', link(npc.entry), el('span', { class: 'muted' }, ` (about ${hhmm(at)})`)]));
}

// Who's around on the front page: who's about where the party is right now (as the viewer can see them).
export function aroundPartyCard() {
  const at = partyPlace();
  const a = at ? aroundNow(at) : null;
  // Due in later, on the front page: at a tavern, who's coming in later tonight too.
  const later = at ? laterLine(at) : null;
  if (!a?.list.length && !later) return null;
  return el('section', { class: 'card around-party' }, el('h3', {}, `Around the party in ${at.name} (${hhmm(a.m)})`),
    a.list.length ? el('p', { class: 'small' }, a.list.slice(0, 8).map(({ npc, place, until }, i) => [i ? ', ' : '', link(npc.entry), place.id === at.id ? null : el('span', { class: 'muted' }, ` at ${place.name}`), until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(until)}`) : null]), a.list.length > 8 ? ` and ${a.list.length - 8} more` : '') : el('p', { class: 'small muted' }, 'Nobody about just now.'), later);
}

// A tavern's busiest hour, from the regulars' routines (not hirelings, who are off with the party).
export function busiestLine(place) {
  if (place.kind !== 'location' || place.fields?.type !== 'Tavern') return null;
  const npcs = worldEntries().filter((x) => x.kind === 'npc' && x.fields?.routine && !isHired(x) && !['Dead', 'Missing'].includes(x.fields?.status)).map((x) => ({ routine: x.fields.routine }));
  const b = busiestHour(npcs, (name) => placeOf(name)?.id === place.id);
  return b && b.count > 1 ? el('p', { class: 'small muted routine-busiest' }, `🍺 Busiest around ${hhmm(b.m)} (${b.count} regulars in).`) : null;
}

// Who knows whom: on an NPC's page, the others whose routines put them in the same places at the same hours.
export function crossPathsLine(npc) {
  if (npc.kind !== 'npc' || !npc.fields?.routine || isHired(npc)) return null;
  const others = worldEntries().filter((x) => x.kind === 'npc' && x.fields?.routine && !isHired(x) && !['Dead', 'Missing'].includes(x.fields?.status)).map((x) => ({ id: x.id, name: x.name, routine: x.fields.routine, entry: x }));
  const list = crossPaths({ id: npc.id, name: npc.name, routine: npc.fields.routine }, others, placeOf).slice(0, 6);
  if (!list.length) return null;
  return el('p', { class: 'small routine-cross' }, 'Often crosses paths with: ', list.map((x, i) => [i ? ', ' : '', link(x.other.entry), el('span', { class: 'muted' }, ` (at ${x.place.name}, ${x.hours} h a day)`)]));
}

// The place a routine names, for other views (the relationship web).
export const routinePlace = (name) => placeOf(name);

// Festival day in town (and the next one, on other days): on one of the world's holidays, a settlement's page says so (the shops are shut, the taverns
// are not) and who's at each tavern in town right now, from routines.
export function festivalLine(town) {
  if (town.kind !== 'settlement') return null;
  const cal = cleanCalendar(world.info?.cal);
  const holiday = holidayToday(cal);
  // The next festival: when today isn't one, when the next is (within a month).
  if (!holiday) {
    const next = nextHoliday(cal, 30);
    if (!next) return null;
    return el('p', { class: 'small festival-next' }, '🎉 ', el('strong', {}, next.name), next.days === 1 ? ' tomorrow: festive goods cost a quarter more today, and the shops will be shut.' : ` in ${next.days} days.`);
  }
  const inside = (p) => { for (let x = p, i = 0; x && i < 12; x = x.parent_id && getEntry(x.parent_id), i++) if (x.id === town.id) return true; return false; };
  const isTavern = (p) => p?.kind === 'location' && p.fields?.type === 'Tavern';
  const tavernOf = (p) => { for (let x = p, i = 0; x && i < 12; x = x.parent_id && getEntry(x.parent_id), i++) { if (isTavern(x)) return x; if (x.id === town.id) return null; } return null; };
  const taverns = worldEntries().filter((x) => isTavern(x) && x.id !== town.id && inside(x));
  const a = aroundNow(town);
  const groups = a ? atTaverns(a.list, taverns, tavernOf) : taverns.map((t) => ({ tavern: t, people: [] }));
  const head = el('p', { class: 'festival-head' }, el('strong', {}, `🎉 ${holiday} today`), ': a festival day. The shops are shut', taverns.length ? '; the taverns are open.' : '.');
  if (!groups.length) return el('section', { class: 'card festival-card', 'aria-label': 'Festival day' }, head);
  return el('section', { class: 'card festival-card', 'aria-label': 'Festival day' }, head,
    el('ul', { class: 'festival-taverns small' }, groups.map(({ tavern, people }) => el('li', {}, link(tavern), ': ',
      people.length ? people.map(({ npc, until }, i) => [i ? ', ' : '', link(npc.entry), until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(until)}`) : null])
        : el('span', { class: 'muted' }, a ? 'no regulars in just now' : 'set the world’s clock to see who’s in')))));
}

// When the owner's in: on a shop's (or any place's) page, the owner's usual day there, from their routine:
// "🛎 Bramwell is usually in mornings and afternoons; evenings at the Bell; nights at home."
export function ownerDayLine(place) {
  if (place.kind !== 'location' || !place.fields?.owner) return null;
  const owner = findByName(String(place.fields.owner).replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1').trim());
  if (!owner || owner.kind !== 'npc' || !owner.fields?.routine || isHired(owner) || ['Dead', 'Missing'].includes(owner.fields?.status)) return null;
  const day = ownerDay(owner.fields.routine, (name) => placeOf(name)?.id === place.id);
  const when = (labels) => labels.map((l) => `${l.toLowerCase()}s`).join(labels.length > 2 ? ', ' : ' and ').replace(/, ([^,]+)$/, ' and $1');
  const ins = day.filter((g) => g.here), outs = day.filter((g) => !g.here && g.place);
  if (!ins.length && !outs.length) return null;
  const away = outs.map((g, i) => { const p = placeOf(g.place); return [i || ins.length ? '; ' : '', `${when(g.labels)} at `, p ? link(p) : g.place]; });
  return el('p', { class: 'small muted routine-owner-day' }, '🛎 ', link(owner),
    ins.length ? ` is usually in ${ins.map((g) => when(g.labels)).join(' and ')}` : ' isn’t usually here: ', away, '.');
}

// A place's owner, when they're an NPC with a routine who could be behind the counter (not a hireling, not dead or
// missing), or null.
export function ownerNpc(place) {
  if (!place?.fields?.owner) return null;
  const owner = findByName(String(place.fields.owner).replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1').trim());
  return owner && owner.kind === 'npc' && owner.fields?.routine && !isHired(owner) && !['Dead', 'Missing'].includes(owner.fields?.status) ? owner : null;
}

// Nobody at the counter: a shop whose owner's routine never has them there in trading hours → { owner, from, to },
// else null.
export function counterGap(shop) {
  const owner = ownerNpc(shop);
  if (!owner || String(shop.fields?.minder || '').trim()) return null; // someone minds it
  const [from, to] = tradingHours(shop);
  return timeAt(owner.fields.routine, (name) => placeOf(name)?.id === shop.id, from, to) ? null : { owner, from, to };
}

// Wanted in town: open bounties on people who live in a settlement or whose routine brings them into it at some hour,
// with where they are now when that's in town. → [{ bounty, now: { place, until } | null }]
export function wantedIn(town) {
  const inside = (p) => { for (let x = p, i = 0; x && i < 12; x = x.parent_id && getEntry(x.parent_id), i++) if (x.id === town.id) return true; return false; };
  const visits = (e) => !isHired(e) && e.fields?.routine && dayOf(e.fields.routine).some((h) => h.place && inside(placeOf(h.place)));
  const a = aroundNow(town);
  const here = new Map((a?.list || []).map((x) => [x.npc.entry.id, x]));
  // …or due in later today (before midnight), when they're not in town now.
  const later = (e) => (a && e.fields?.routine && !isHired(e) ? dueLater([{ id: e.id, name: e.name, routine: e.fields.routine }], (name) => inside(placeOf(name)), a.m, 1439)[0]?.at ?? null : null);
  return openBounties(worldEntries()).filter((b) => inside(b.entry) || visits(b.entry) || here.has(b.entry.id))
    .map((bounty) => { const now = here.get(bounty.entry.id) || null; return { bounty, now, later: now ? null : later(bounty.entry) }; });
}

// Bounties in session prep: anyone wanted who's about in the party's town now, or due in later today.
export function wantedPrepLine(town) {
  if (!town || town.kind !== 'settlement') return null;
  const list = wantedIn(town).filter((w) => w.now || w.later !== null);
  if (!list.length) return null;
  return el('div', { class: 'wanted-prep small' }, el('strong', {}, '🎯 Wanted, and about: '),
    list.map(({ bounty: b, now: n, later: l }, i) => [i ? '; ' : '', link(b.entry), ` (${b.text})`,
      n ? [' is in town now', n.place.id === town.id ? '' : [', at ', link(n.place)], n.until !== null ? ` until ${hhmm(n.until)}` : ''] : ` is due in town around ${hhmm(l)}`]), '.');
}

export function wantedCard(town) {
  if (town.kind !== 'settlement') return null;
  const list = wantedIn(town);
  if (!list.length) return null;
  return el('section', { class: 'card wanted-here', 'aria-label': 'Wanted here' }, el('h3', {}, `🎯 Wanted in ${town.name}`),
    el('ul', { class: 'plain' }, list.slice(0, 8).map(({ bounty: b, now: n }) => el('li', {}, link(b.entry), `: ${b.text}`, b.by ? el('span', { class: 'muted small' }, ` (from ${b.by})`) : null,
      n ? el('div', { class: 'small' }, `🕰 About town now: `, n.place.id === town.id ? 'somewhere in town' : link(n.place), n.until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(n.until)}`) : null) : null))));
}

// Routines that don't read (GMs): every NPC whose routine has lines the clock can't read or names places that
// aren't in the world. → [{ entry, bad, unknown }]
export function routineIssues() {
  return worldEntries().filter((x) => x.kind === 'npc' && String(x.fields?.routine || '').trim() && !['Dead'].includes(x.fields?.status))
    .map((entry) => ({ entry, ...routineCheck(entry.fields.routine, placeOf) })).filter((x) => x.bad.length || x.unknown.length)
    .sort((a, b) => a.entry.name.localeCompare(b.entry.name));
}
