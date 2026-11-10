// The printable session sheet (GMs): one page for the table, built from session prep. Where the party is, the
// party's numbers, who's around and how they feel about the characters, jobs, rumors, today's weather, quests with
// their open steps, clocks about to finish, a rolled encounter and the GMs' notes. Route: #world/sheet
import { el, setKids } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, getEntry, byName, descendantsOf, trail, notice, mentions } from './world-store.js';
import { worldCalendar, todayText } from './world-calendar.js';
import { rumorsAt } from './world-rumors.js';
import { encounterCard, partyDefaults, placeTerrains, monsterSource } from './encounter-ui.js';
import { rollEncounter } from './encounters.js';
import { vitals } from './sheet-ui.js';
import { towards } from './attitudes.js';
import { readObjectives, progress } from './objectives.js';
import { sortSecrets } from './secrets.js';
import { stripMarks } from './rich.js';
import { sayOf } from './say.js';
import { readAloudPrint } from './world-readaloud.js';
import { remindersPrint } from './world-reminders.js';
import { musicFor } from './music.js';
import { dayWeather } from './forecast.js';
import { deadlineOf, deadlineText } from './deadline.js';
import { holidayToday, holidayTomorrow, EVE_MARKUP, openText } from './shop-hours.js';
import { aroundNow, dueInHere, partyTown, townWeek } from './world-routine.js';
import { weekDayText } from './week-in-town.js';
import { dayLine } from './routine.js';
import { isHired } from './hirelings.js';
import { hhmm, readClock, leftText, partOfDay } from './clock.js';
import { dayFor } from './world-hours.js';
import { moonlight } from './moonlight.js';
import { today } from './calendar.js';
import { sceneFor } from './world-scene.js';
import { appearances, quoteOf } from './appearances.js';

const ACTIVE_PC = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);
const townOf = (place) => (place?.kind === 'settlement' ? place : [...trail(place)].reverse().find((p) => p.kind === 'settlement') || null);
const plain = (t) => stripMarks(t);
const cut = (t, n) => { const s = plain(t).replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
const block = (title, ...kids) => el('section', { class: 'ss-block' }, el('h3', {}, title), ...kids);

export async function viewSessionSheet() {
  if (!isGm()) return notice('GMs only', 'The session sheet is made from the GMs’ prep.');
  let prep = {};
  try { prep = (await api('settings')).world?.prep || {}; } catch { /* print without notes */ }
  const all = worldEntries();
  const here = prep.location_id && getEntry(prep.location_id);
  const n = Math.max(0, ...all.filter((e) => e.kind === 'session').map((s) => parseInt(s.fields?.number, 10) || 0)) + 1;
  const cal = worldCalendar();
  const pcs = all.filter(ACTIVE_PC).sort(byName);
  const inside = here ? descendantsOf(here.id) : [];
  const seen = appearances(all, mentions);
  const people = inside.filter((e) => e.kind === 'npc' && e.fields?.status !== 'Dead')
    .sort((a, b) => Number((b.tags || []).includes('key')) - Number((a.tags || []).includes('key')) || byName(a, b)).slice(0, 14);
  const jobs = inside.filter((e) => e.kind === 'quest' && ['Available', 'Rumor'].includes(e.fields?.status)).slice(0, 8);
  const town = here && townOf(here);
  const rumors = town ? rumorsAt(town.id).slice(0, 6) : [];
  const shops = inside.filter((e) => e.kind === 'location' && (e.fields?.type === 'Shop' || e.fields?.stock)).slice(0, 10);
  // Deadlines on the sheet: quests with one come first, soonest first.
  const due = (q) => deadlineOf(cal, q);
  const quests = all.filter((e) => e.kind === 'quest' && e.fields?.status === 'Active').sort((a, b) => (due(a)?.left ?? 1e9) - (due(b)?.left ?? 1e9) || byName(a, b));
  const clocks = (world.standings?.clocks || []).filter((c) => c.filled < c.size).sort((a, b) => (a.size - a.filled) - (b.size - b.filled)).slice(0, 6);
  // The same weather as session prep shows today (seeded by place and in-world date).
  const terrain = here ? placeTerrains(here) : ['road'];
  const weather = here ? dayWeather(here.id, terrain, cal) : null;
  const party = partyDefaults();
  const encBox = el('div', { class: 'ss-enc' });
  const roll = () => setKids(encBox, encounterCard(rollEncounter({ terrain, level: party.level, size: party.size, difficulty: 'Moderate', ...monsterSource() }), { title: here ? `Near ${here.name}` : 'On the road', place: here }));
  roll();

  return el('div', { class: 'w-view session-sheet' },
    el('div', { class: 'ss-tools btnrow' },
      el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print'),
      el('button', { class: 'btn', type: 'button', onclick: roll }, 'Another encounter'),
      el('a', { class: 'btn ghost', href: '#world/prep' }, 'Back to prep')),
    el('header', { class: 'ss-head' },
      el('h2', {}, `${world.info?.name || 'The world'}: session ${n}`),
      el('p', {}, [cal ? todayText(cal) : '', new Date().toLocaleDateString(undefined, { dateStyle: 'medium' }), here ? `The party is in ${here.name}` : 'The party is on the road'].filter(Boolean).join(' · ')),
      holidayNote(cal),
      // The scene on the sheet: the scene-setter line to read out.
      (() => { const t = here ? sceneFor(here) : ''; return t ? el('p', { class: 'ss-scene' }, `🎬 ${t}`) : null; })()),
    el('div', { class: 'ss-grid' },
      (() => { const r = remindersPrint(prep); return r.length ? block('📌 Remember', el('ul', { class: 'ss-steps' }, r)) : null; })(),
      // Lights on the sheet: the time, and what's burning and for how long.
      (() => { if (!world.info?.clock) return null; const c = readClock(world.info.clock);
        // Moonlight on the sheet: at night, tonight's moonlight (behind the clouds, if the weather says so).
        const mm = c.minutes % 1440, ml = cal && (mm >= 20 * 60 || mm < 5 * 60) ? moonlight(cal, today(cal), weather?.sky || '') : null;
        return block('🔥 Time and light', el('p', {}, el('strong', {}, hhmm(c.minutes)), ` · ${partOfDay(c.minutes)}`), ml ? el('p', { class: 'small ss-moon' }, `${ml.icon} ${ml.text}.`) : null,
          c.lights.length ? el('ul', { class: 'ss-list ss-lights' }, c.lights.map((l) => el('li', {}, l.name, l.forever ? ' (until put out)' : ` (${leftText(l.left)} left)`))) : el('p', { class: 'small' }, 'No lights burning.')); })(),
      block('The party', pcs.length ? el('table', { class: 'ss-table' },
        el('thead', {}, el('tr', {}, ['Character', 'Player', 'AC', 'HP', 'Notes'].map((h) => el('th', { scope: 'col' }, h)))),
        el('tbody', {}, pcs.map((c) => { const v = vitals(c); return el('tr', {}, el('td', {}, c.name, sayOf(c) ? el('span', { class: 'small' }, ` (${sayOf(c)})`) : null), el('td', {}, c.owner || c.fields?.player || ''), el('td', { class: 'num' }, v.ac ?? '—'), el('td', { class: 'num' }, v.max ? `${v.hp}/${v.max}` : '—'), el('td', { class: 'small' }, [...(v.conditions || []), v.exhaustion ? `exhaustion ${v.exhaustion}` : '', v.inspiration ? 'inspired' : ''].filter(Boolean).join(', '))); })))
        : el('p', { class: 'muted' }, 'No active characters.')),
      here ? block(here.name, here.summary ? el('p', {}, cut(here.summary, 300)) : null,
        weather ? el('p', {}, el('strong', {}, 'Weather: '), weather.line) : null,
        // Tomorrow's weather on the sheet: the next day's forecast, the same seeded roll as prep's week ahead.
        (() => { try { const t = here && dayWeather(here.id, terrain, cal, 1); return t ? el('p', { class: 'small ss-tomorrow' }, el('strong', {}, 'Tomorrow: '), t.line) : null; } catch { return null; } })(),
        (() => { const m = musicFor([here, ...trail(here).reverse()]); return m ? el('p', { class: 'small' }, el('strong', {}, 'Music: '), m.url) : null; })(),
        // Open or shut on the sheet: each shop's hours by the world's clock, today.
        shops.length ? el('p', { class: 'small ss-shops' }, el('strong', {}, 'Shops: '), shops.map((s) => { const m = world.info?.clock?.minutes; if (m === undefined) return s.name; const o = openText(s, m, dayFor(s)); return `${s.name} (${o.text})`; }).join(', ')) : null) : null,
      // Around now: who the routines put where the party is (or somewhere inside), at the world's hour.
      (() => { const a = here ? aroundNow(here) : null; return a?.list.length ? block(`🕰 Around now (${hhmm(a.m)})`, el('ul', { class: 'ss-list ss-around' }, a.list.map(({ npc, place, until }) =>
        el('li', {}, el('strong', {}, npc.entry.name), place.id === here.id ? '' : ` at ${place.name}`, until !== null ? ` until ${hhmm(until)}` : '')))) : null; })(),
      // Due in later: who the routines bring here before the night's out, and about when.
      (() => { const d = here ? dueInHere(here) : []; return d.length ? block('🌙 Due in later', el('ul', { class: 'ss-list ss-later' }, d.slice(0, 10).map(({ npc, at, place }) =>
        el('li', {}, el('strong', {}, npc.entry.name), ` about ${hhmm(at)}`, place && place.id !== here.id ? ` at ${place.name}` : '')))) : null; })(),
      // The week on the sheet: the coming week in the party's town (holidays, market day, shops shut).
      (() => { const t = partyTown(), tw = t && townWeek(t); return tw ? block(`📅 The week in ${t.name}`, el('ul', { class: 'ss-list ss-week' }, tw.week.map((d) => el('li', {}, el('strong', {}, `${tw.label(d)}: `), weekDayText(d))))) : null; })(),
      people.length ? block(`Who’s around (${people.length})`, el('ul', { class: 'ss-list' }, people.map((p) => {
        const att = towards(all, p.id);
        return el('li', {}, el('strong', {}, p.name), sayOf(p) ? ` [${sayOf(p)}]` : '', p.fields?.role ? ` (${p.fields.role})` : '', p.summary ? `: ${cut(p.summary, 110)}` : '',
          // Where they'll be: their usual day, from their routine (hirelings go with the party).
          (() => { const d = isHired(p) ? 'with the party' : dayLine(p.fields?.routine); return d ? el('div', { class: 'small ss-day' }, `🕰 ${d}`) : null; })(),
          // Last time, on the sheet: the line from the last session that named them.
          (() => { const sn = seen.get(p.id), q = sn && quoteOf(sn.last, p, 120); return q ? el('div', { class: 'small ss-last' }, `${sn.last.name}: “${q}”`) : null; })(),
          att.length ? el('div', { class: 'small' }, att.map((x) => `${x.character.name}: ${x.a}`).join(' · ')) : null);
      }))) : null,
      jobs.length || rumors.length ? block('Jobs and rumors',
        jobs.length ? el('ul', { class: 'ss-list' }, jobs.map((q) => el('li', {}, el('strong', {}, q.name), q.fields?.reward ? ` (${q.fields.reward})` : '', q.summary ? `: ${cut(q.summary, 100)}` : ''))) : null,
        rumors.length ? el('ul', { class: 'ss-list' }, rumors.map(({ v }) => el('li', {}, el('q', {}, cut(v.text, 160))))) : null) : null,
      quests.length ? block('Quests in play', el('ul', { class: 'ss-list' }, quests.map((q) => {
        const steps = readObjectives(q), p = progress(steps), open = steps.filter((o) => !o.done);
        const d = due(q);
        return el('li', {}, el('strong', {}, q.name), p.total ? ` (${p.done}/${p.total})` : '', d ? el('span', { class: `ss-due${d.left <= 3 ? ' soon' : ''}` }, ` ⏳ ${deadlineText(d.left, d.holiday)}`) : '', q.fields?.stakes ? `: ${cut(q.fields.stakes, 120)}` : '',
          open.length ? el('ul', { class: 'ss-steps' }, open.slice(0, 5).map((o) => el('li', {}, `☐ ${plain(o.text)}${o.secret ? ' (secret)' : ''}`))) : null);
      }))) : null,
      sortSecrets(prep.secrets).open.length ? block('Secrets and clues', el('ul', { class: 'ss-steps' }, sortSecrets(prep.secrets).open.slice(0, 12).map((s) => el('li', {}, `☐ ${plain(s.text)}`)))) : null,
      clocks.length ? block('Clocks', el('ul', { class: 'ss-list' }, clocks.map((c) => el('li', {}, el('strong', {}, c.name), ` ${c.filled}/${c.size}`, getEntry(c.entry_id) ? ` · ${getEntry(c.entry_id).name}` : '')))) : null,
      (() => { const ra = readAloudPrint(prep); return ra.length ? block('Read-aloud', ...ra) : null; })(),
      block('If trouble comes', encBox),
      prep.notes ? block('GM notes', el('div', { class: 'ss-notes' }, plain(prep.notes))) : null));
}

// Holidays on the sheet: today's holiday (shops shut, taverns open) or tomorrow's (festive goods cost more today).
function holidayNote(cal) {
  if (!cal) return null;
  const today = holidayToday(cal), tomorrow = !today && holidayTomorrow(cal);
  if (today) return el('p', { class: 'ss-holiday' }, el('strong', {}, `🎉 ${today} today: `), 'the shops are shut; the taverns are open.');
  if (tomorrow) return el('p', { class: 'ss-holiday' }, el('strong', {}, `🎉 ${tomorrow} tomorrow: `), `festive goods cost ${EVE_MARKUP}% more today, and the shops shut tomorrow.`);
  return null;
}
