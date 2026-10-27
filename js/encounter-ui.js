// Encounters, weather and travel: the Table Tool, and the Encounters tab on regions, areas and places.
import { el, toast, copyText, setKids, fresh } from './dom.js';
import { TERRAINS, TERRAIN_LABEL, DIFFICULTIES, SEASONS, rollEncounter, encounterTable, tableText, meeting, rollWeather, seasonOf, terrainsFor, xpFor, crText, travelText } from './encounters.js';
import { saveNote } from './notebook.js';
import { worldEntries, patchEntry } from './world-store.js';
import { worldCalendar } from './world-calendar.js';
import { isGm } from './api.js';

// The party's size and average level, from active player characters (or 4 at level 3).
export function partyDefaults() {
  const pcs = worldEntries().filter((e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status));
  const levels = pcs.map((e) => parseInt(e.fields?.level, 10)).filter((n) => n > 0);
  return { size: pcs.length || 4, level: levels.length ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) : 3 };
}

const ddb = (name) => `https://www.dndbeyond.com/monsters?filter-search=${encodeURIComponent(name)}`;

export function encounterCard(enc, { title = 'Encounter' } = {}) {
  if (!enc) return el('div', { class: 'card' }, el('p', { class: 'muted' }, 'Nothing in that terrain fits a party this size. Try another difficulty or terrain.'));
  const pct = Math.round((enc.xp / enc.budget) * 100);
  return el('article', { class: 'card enc-card' },
    el('div', { class: 'eyebrow' }, `${title} · ${enc.difficulty}`),
    el('ul', { class: 'enc-list' }, enc.groups.map((g) => el('li', {},
      el('strong', {}, g.count > 1 ? `${g.count} × ${g.name}` : g.name),
      el('span', { class: 'muted small' }, ` CR ${crText(g.cr)} ${g.type}, ${(xpFor(g.cr) * g.count).toLocaleString('en-US')} XP`),
      el('a', { class: 'small ext', href: ddb(g.name), target: '_blank', rel: 'noopener' }, 'stat block ↗')))),
    el('p', {}, `They’re ${enc.activity}.`),
    el('p', { class: 'muted small' }, `Before the party sees them: ${enc.sign}.`),
    el('div', { class: 'xp-bar', title: `${pct}% of the budget` }, el('span', { style: `width:${Math.min(100, pct)}%` })),
    el('p', { class: 'muted small' }, `${enc.xp.toLocaleString('en-US')} XP of a ${enc.budget.toLocaleString('en-US')} XP budget.`));
}

const encText = (enc) => [`${enc.difficulty} encounter (${enc.xp} XP of ${enc.budget})`, ...enc.groups.map((g) => `${g.count > 1 ? `${g.count} × ` : ''}${g.name} (CR ${crText(g.cr)})`), `They’re ${enc.activity}.`, `Signs: ${enc.sign}.`].join('\n');

function weatherCard(w, season) {
  return el('article', { class: 'card weather-card' }, el('div', { class: 'eyebrow' }, `Weather · ${season}`), el('p', { class: 'lede' }, w.line),
    w.rules.length ? el('ul', { class: 'plain' }, w.rules.map((r) => el('li', { class: 'small' }, r))) : el('p', { class: 'muted small' }, 'No weather effects worth a rule.'));
}

function currentSeason() {
  const cal = worldCalendar();
  return cal ? seasonOf(cal.month, cal.months.length) : null;
}

function controls(terrain, defaults) {
  const party = defaults || partyDefaults();
  const terr = el('select', { id: 'en-terrain', 'aria-label': 'Terrain' }, TERRAINS.map((t) => el('option', { value: t }, TERRAIN_LABEL[t])));
  terr.value = terrain?.[0] || 'forest';
  const level = el('select', { id: 'en-level', 'aria-label': 'Party level' }, Array.from({ length: 20 }, (_, i) => el('option', { value: i + 1 }, `Level ${i + 1}`)));
  level.value = String(party.level);
  const size = el('select', { id: 'en-size', 'aria-label': 'Party size' }, Array.from({ length: 8 }, (_, i) => el('option', { value: i + 1 }, `${i + 1} character${i ? 's' : ''}`)));
  size.value = String(Math.min(8, party.size));
  const diff = el('select', { id: 'en-diff', 'aria-label': 'Difficulty' }, DIFFICULTIES.map((d) => el('option', { value: d }, d)));
  diff.value = 'Moderate';
  const season = el('select', { id: 'en-season', 'aria-label': 'Season' }, SEASONS.map((s) => el('option', { value: s }, s)));
  season.value = currentSeason() || 'Summer';
  const lab = (l, x) => el('div', { class: 'field' }, el('label', { for: x.id }, l), x);
  return { terr, level, size, diff, season, row: el('div', { class: 'controls' }, lab('Terrain', terr), lab('Party level', level), lab('Party size', size), lab('Difficulty', diff), lab('Season', season)),
    read: () => ({ terrain: [terr.value], level: +level.value, size: +size.value, difficulty: diff.value, season: season.value }) };
}

// ---- the Table Tool -------------------------------------------------------------------------------

export function mountEncounters(root) {
  const c = controls(['forest']);
  const out = el('div', { class: 'enc-out' });
  const milesIn = el('input', { type: 'number', id: 'tr-miles', min: 1, value: 60, class: 'hp-amt' });
  const diffT = el('input', { type: 'checkbox', id: 'tr-diff' });
  const travelOut = el('p', { class: 'travel-out' });
  const showTravel = () => { travelOut.textContent = travelText(Math.max(0, +milesIn.value || 0), { difficult: diffT.checked }); };
  milesIn.addEventListener('input', showTravel); diffT.addEventListener('change', showTravel);
  const show = (node) => { setKids(out, node); fresh(node); };
  const encounter = () => {
    const o = c.read(); const enc = rollEncounter(o);
    show(el('div', { class: 'stack' }, encounterCard(enc), enc ? el('div', { class: 'btnrow' },
      el('button', { class: 'btn', type: 'button', onclick: () => saveNote('Encounter', `${enc.groups.map((g) => g.name).join(' & ')}`, encText(enc)) }, 'Save to notebook'),
      el('button', { class: 'btn', type: 'button', onclick: () => copyText(encText(enc)) }, 'Copy')) : null));
  };
  root.append(
    el('div', { class: 'panel-head' }, el('h2', {}, 'Encounters & Travel'),
      el('p', {}, 'Fights fitted to your party with the 2024 encounter budget, chance meetings on the road, weather with its rules, and how long a journey takes. Stat blocks open on D&D Beyond.')),
    c.row,
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary', type: 'button', onclick: encounter }, 'Roll encounter'),
      el('button', { class: 'btn', type: 'button', onclick: () => show(el('article', { class: 'card' }, el('div', { class: 'eyebrow' }, 'On the road'), el('p', { class: 'lede' }, meeting()))) }, 'Chance meeting'),
      el('button', { class: 'btn', type: 'button', onclick: () => {
        const o = c.read(); const rows = encounterTable({ ...o, seed: Math.random().toString(36).slice(2) });
        show(el('article', { class: 'card' }, el('div', { class: 'eyebrow' }, `d${rows.length} ${TERRAIN_LABEL[o.terrain[0]].toLowerCase()} encounters · level ${o.level}`),
          el('ol', { class: 'enc-table' }, rows.map((r) => el('li', {}, r))),
          el('div', { class: 'btnrow' }, el('button', { class: 'btn', type: 'button', onclick: () => saveNote('Encounter table', `${TERRAIN_LABEL[o.terrain[0]]} encounters`, tableText(rows)) }, 'Save to notebook'),
            el('button', { class: 'btn', type: 'button', onclick: () => copyText(tableText(rows)) }, 'Copy'))));
      } }, 'd12 encounter table'),
      el('button', { class: 'btn', type: 'button', onclick: () => { const o = c.read(); show(weatherCard(rollWeather(o), o.season)); } }, 'Weather')),
    out,
    el('section', { class: 'card travel' }, el('h3', {}, 'Travel time'),
      el('div', { class: 'controls' }, el('label', { class: 'check' }, 'Distance ', milesIn, ' miles'), el('label', { class: 'check' }, diffT, ' Difficult terrain (half speed)')),
      travelOut, el('p', { class: 'muted small' }, 'Paces from the 2024 rules: fast 4 mph / 30 miles a day (−5 passive Perception), normal 3 mph / 24 miles, slow 2 mph / 18 miles (can move stealthily). Set a map’s scale to measure between pins.')));
  showTravel();
  encounter();
}

// ---- the Encounters tab on a place ------------------------------------------------------------------

export function placeTerrains(place) {
  const f = place.fields || {};
  return terrainsFor(f.type, f.terrain, f.climate, place.kind === 'settlement' ? 'town' : '', place.name);
}

export function wildsSection(place, rerender) {
  const terrains = placeTerrains(place);
  const c = controls(terrains);
  const out = el('div', { class: 'enc-out' });
  const table = place.fields?.encounters;
  const roll = () => { const enc = rollEncounter({ ...c.read(), terrain: [c.terr.value] }); setKids(out, encounterCard(enc, { title: `Encounter near ${place.name}` })); };
  const saveTable = async () => {
    const rows = encounterTable({ ...c.read(), terrain: [c.terr.value], seed: Math.random().toString(36).slice(2) });
    try { await patchEntry(place, { fields: { encounters: tableText(rows) } }); toast(`Saved a d${rows.length} table to ${place.name}`); rerender(); } catch (err) { toast(err.message, 'bad'); }
  };
  const rollFromTable = () => {
    const rows = String(table).split('\n').map((l) => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    const i = Math.floor(Math.random() * rows.length);
    setKids(out, el('article', { class: 'card' }, el('div', { class: 'eyebrow' }, `Rolled ${i + 1} on d${rows.length}`), el('p', { class: 'lede' }, rows[i])));
  };
  const season = currentSeason();
  if (!table) roll();
  return el('div', { class: 'wilds' },
    el('p', { class: 'muted' }, `Terrain here looks like ${terrains.map((t) => TERRAIN_LABEL[t].toLowerCase()).join(', ')}. The party: ${c.size.value} at level ${c.level.value}.`),
    c.row,
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary small', type: 'button', onclick: roll }, 'Roll encounter'),
      table ? el('button', { class: 'btn small', type: 'button', onclick: rollFromTable }, 'Roll on this area’s table') : null,
      el('button', { class: 'btn small', type: 'button', onclick: () => setKids(out, el('article', { class: 'card' }, el('div', { class: 'eyebrow' }, 'Chance meeting'), el('p', { class: 'lede' }, meeting()))) }, 'Chance meeting'),
      el('button', { class: 'btn small', type: 'button', onclick: () => setKids(out, weatherCard(rollWeather({ terrain: [c.terr.value], season: c.season.value }), c.season.value)) }, season ? `Weather (${season.toLowerCase()})` : 'Weather'),
      isGm() ? el('button', { class: 'btn small ghost', type: 'button', onclick: saveTable }, table ? 'New encounter table' : 'Make an encounter table') : null),
    out,
    table ? el('section', { class: 'card' }, el('h3', {}, 'Encounter table'), el('ol', { class: 'enc-table' }, String(table).split('\n').map((l) => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean).map((r) => el('li', {}, r)))) : null);
}

