// The printable session sheet (GMs): one page for the table, built from session prep. Where the party is, the
// party's numbers, who's around and how they feel about the characters, jobs, rumors, today's weather, quests with
// their open steps, clocks about to finish, a rolled encounter and the GMs' notes. Route: #world/sheet
import { el, setKids } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, getEntry, byName, descendantsOf, trail, notice } from './world-store.js';
import { worldCalendar, todayText } from './world-calendar.js';
import { rumorsAt } from './world-rumors.js';
import { encounterCard, partyDefaults, placeTerrains, monsterSource } from './encounter-ui.js';
import { rollEncounter, rollWeather, seasonOf } from './encounters.js';
import { vitals } from './sheet-ui.js';
import { towards } from './attitudes.js';
import { readObjectives, progress } from './objectives.js';
import { sortSecrets } from './secrets.js';
import { stripMarks } from './rich.js';
import { sayOf } from './say.js';
import { readAloudPrint } from './world-readaloud.js';

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
  const people = inside.filter((e) => e.kind === 'npc' && e.fields?.status !== 'Dead')
    .sort((a, b) => Number((b.tags || []).includes('key')) - Number((a.tags || []).includes('key')) || byName(a, b)).slice(0, 14);
  const jobs = inside.filter((e) => e.kind === 'quest' && ['Available', 'Rumor'].includes(e.fields?.status)).slice(0, 8);
  const town = here && townOf(here);
  const rumors = town ? rumorsAt(town.id).slice(0, 6) : [];
  const shops = inside.filter((e) => e.kind === 'location' && (e.fields?.type === 'Shop' || e.fields?.stock)).slice(0, 10);
  const quests = all.filter((e) => e.kind === 'quest' && e.fields?.status === 'Active').sort(byName);
  const clocks = (world.standings?.clocks || []).filter((c) => c.filled < c.size).sort((a, b) => (a.size - a.filled) - (b.size - b.filled)).slice(0, 6);
  // The same weather as session prep shows today (seeded by place and in-world date).
  const terrain = here ? placeTerrains(here) : ['road'];
  const weather = here ? rollWeather({ terrain, season: cal ? seasonOf(cal.month, cal.months.length) : 'Summer', seed: `${here.id}:${cal ? todayText(cal) : new Date().toDateString()}` }) : null;
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
      el('p', {}, [cal ? todayText(cal) : '', new Date().toLocaleDateString(undefined, { dateStyle: 'medium' }), here ? `The party is in ${here.name}` : 'The party is on the road'].filter(Boolean).join(' · '))),
    el('div', { class: 'ss-grid' },
      block('The party', pcs.length ? el('table', { class: 'ss-table' },
        el('thead', {}, el('tr', {}, ['Character', 'Player', 'AC', 'HP', 'Notes'].map((h) => el('th', { scope: 'col' }, h)))),
        el('tbody', {}, pcs.map((c) => { const v = vitals(c); return el('tr', {}, el('td', {}, c.name, sayOf(c) ? el('span', { class: 'small' }, ` (${sayOf(c)})`) : null), el('td', {}, c.owner || c.fields?.player || ''), el('td', { class: 'num' }, v.ac ?? '—'), el('td', { class: 'num' }, v.max ? `${v.hp}/${v.max}` : '—'), el('td', { class: 'small' }, [...(v.conditions || []), v.exhaustion ? `exhaustion ${v.exhaustion}` : '', v.inspiration ? 'inspired' : ''].filter(Boolean).join(', '))); })))
        : el('p', { class: 'muted' }, 'No active characters.')),
      here ? block(here.name, here.summary ? el('p', {}, cut(here.summary, 300)) : null,
        weather ? el('p', {}, el('strong', {}, 'Weather: '), weather.line) : null,
        shops.length ? el('p', { class: 'small' }, el('strong', {}, 'Shops: '), shops.map((s) => s.name).join(', ')) : null) : null,
      people.length ? block(`Who’s around (${people.length})`, el('ul', { class: 'ss-list' }, people.map((p) => {
        const att = towards(all, p.id);
        return el('li', {}, el('strong', {}, p.name), sayOf(p) ? ` [${sayOf(p)}]` : '', p.fields?.role ? ` (${p.fields.role})` : '', p.summary ? `: ${cut(p.summary, 110)}` : '',
          att.length ? el('div', { class: 'small' }, att.map((x) => `${x.character.name}: ${x.a}`).join(' · ')) : null);
      }))) : null,
      jobs.length || rumors.length ? block('Jobs and rumors',
        jobs.length ? el('ul', { class: 'ss-list' }, jobs.map((q) => el('li', {}, el('strong', {}, q.name), q.fields?.reward ? ` (${q.fields.reward})` : '', q.summary ? `: ${cut(q.summary, 100)}` : ''))) : null,
        rumors.length ? el('ul', { class: 'ss-list' }, rumors.map(({ v }) => el('li', {}, el('q', {}, cut(v.text, 160))))) : null) : null,
      quests.length ? block('Quests in play', el('ul', { class: 'ss-list' }, quests.map((q) => {
        const steps = readObjectives(q), p = progress(steps), open = steps.filter((o) => !o.done);
        return el('li', {}, el('strong', {}, q.name), p.total ? ` (${p.done}/${p.total})` : '', q.fields?.stakes ? `: ${cut(q.fields.stakes, 120)}` : '',
          open.length ? el('ul', { class: 'ss-steps' }, open.slice(0, 5).map((o) => el('li', {}, `☐ ${plain(o.text)}${o.secret ? ' (secret)' : ''}`))) : null);
      }))) : null,
      sortSecrets(prep.secrets).open.length ? block('Secrets and clues', el('ul', { class: 'ss-steps' }, sortSecrets(prep.secrets).open.slice(0, 12).map((s) => el('li', {}, `☐ ${plain(s.text)}`)))) : null,
      clocks.length ? block('Clocks', el('ul', { class: 'ss-list' }, clocks.map((c) => el('li', {}, el('strong', {}, c.name), ` ${c.filled}/${c.size}`, getEntry(c.entry_id) ? ` · ${getEntry(c.entry_id).name}` : '')))) : null,
      (() => { const ra = readAloudPrint(prep); return ra.length ? block('Read-aloud', ...ra) : null; })(),
      block('If trouble comes', encBox),
      prep.notes ? block('GM notes', el('div', { class: 'ss-notes' }, plain(prep.notes))) : null));
}
