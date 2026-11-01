// Where are they now?: an NPC's page says where their daily routine puts them at the world's current hour, and a
// place's page lists who is there now. Read from the clock the GMs move on (Time and light).
import { el } from './dom.js';
import { world, worldEntries, link, findByName } from './world-store.js';
import { whereAt } from './routine.js';
import { hhmm, partOfDay } from './clock.js';

const now = () => world.info?.clock?.minutes ?? null;
// The place a routine names: as written, then without "at"/"in", then without "the" ("at the Bell" → The Bell).
const placeOf = (name) => {
  const a = name.replace(/^(at|in) /i, '');
  for (const n of [name, a, a.replace(/^the /i, '')]) { const p = findByName(n); if (p && !['npc', 'character'].includes(p.kind)) return p; }
  return null;
};

export function routineNow(e) {
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
  if (['npc', 'character', 'session', 'quest', 'item', 'journal', 'event'].includes(place.kind)) return null;
  const m = now();
  if (m === null) return null;
  const here = worldEntries().filter((x) => x.kind === 'npc' && x.fields?.routine && !['Dead', 'Missing'].includes(x.fields?.status))
    .map((x) => ({ x, w: whereAt(x.fields.routine, m) })).filter(({ w }) => w && placeOf(w.place)?.id === place.id)
    .sort((a, b) => a.x.name.localeCompare(b.x.name));
  if (!here.length) return null;
  return el('p', { class: 'routine-here small' }, `🕰 Here now (${hhmm(m)}): `, here.map(({ x, w }, i) => [i ? ', ' : '', link(x), w.until !== null ? el('span', { class: 'muted' }, ` until ${hhmm(w.until)}`) : null]));
}
