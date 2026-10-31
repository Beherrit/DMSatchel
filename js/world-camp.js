// Make camp (GMs, on the party page): those who rest get a long rest, the clock moves on eight hours, and maybe
// something comes in the night: a line from the area's encounter table if it has one, else an encounter rolled for
// its terrain and the party.
import { el, toast, setKids } from './dom.js';
import { api, isGm, previewing } from './api.js';
import { world, worldEntries, getEntry } from './world-store.js';
import { restOf } from './sheet-ui.js';
import { makeRng } from './rng.js';
import { nightRoll, tableRows, CAMP_MINUTES } from './camp.js';
import { encounterCard, partyDefaults, placeTerrains, monsterSource } from './encounter-ui.js';
import { rollEncounter } from './encounters.js';
import { formatDate, today } from './calendar.js';

const ACTIVE = (c) => c.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status);

// The nearest place, from where the party is outwards, with an encounter table.
function tableFor(here) {
  for (let p = here, guard = 0; p && guard < 12; p = getEntry(p.parent_id), guard++) if (p.fields?.encounters) return { place: p, rows: tableRows(p.fields.encounters) };
  return null;
}

export function campButton(rerender) {
  if (!isGm() || previewing()) return null;
  return el('button', { class: 'btn small', type: 'button', onclick: () => campDialog(rerender) }, '⛺ Make camp…');
}

function campDialog(rerender) {
  const chars = worldEntries().filter(ACTIVE).sort((a, b) => a.name.localeCompare(b.name));
  const here = getEntry(world.info?.party_at);
  const table = here ? tableFor(here) : null;
  const boxes = chars.map((c) => ({ c, cb: el('input', { type: 'checkbox', id: `cp-${c.id}`, checked: true }) }));
  const odds = el('select', { id: 'cp-odds' }, [[0, 'No roll'], [6, '1 in 6'], [3, '1 in 3']].map(([v, t]) => el('option', { value: v, selected: v === 6 || null }, t)));
  const result = el('div', { class: 'camp-night' });
  const go = el('button', { class: 'btn primary', type: 'submit' }, 'Make camp');
  const form = el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'cp-title' }, here ? `Camp near ${here.name}` : 'Make camp'),
    chars.length ? el('fieldset', { class: 'plain-fieldset' }, el('legend', {}, 'Who rests (a long rest)'), boxes.map(({ c, cb }) => el('label', { class: 'check', for: `cp-${c.id}` }, cb, ` ${c.name}`))) : el('p', { class: 'muted small' }, 'No characters to rest.'),
    el('div', { class: 'field' }, el('label', { for: 'cp-odds' }, 'Trouble in the night'), odds),
    el('p', { class: 'muted small' }, table ? `Rolled on ${table.place.name}’s encounter table.` : here ? `No encounter table here: an encounter for ${here.name}’s terrain is rolled.` : 'The party isn’t anywhere on the map: an encounter for open road is rolled.'),
    el('p', { class: 'muted small' }, 'The clock moves on eight hours.'),
    result,
    el('div', { class: 'btnrow' }, go, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now')));
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'cp-title' }, form);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    go.disabled = true;
    const failed = [];
    for (const { c, cb } of boxes) if (cb.checked) { try { await restOf(c); } catch { failed.push(c.name); } }
    let woke = '';
    try {
      const r = await api('settings', { method: 'PATCH', body: { clock: { advance: CAMP_MINUTES } } });
      world.info = { ...world.info, clock: r.clock, ...(r.cal ? { cal: r.cal } : {}) };
      woke = r.cal && r.days ? ` It’s ${formatDate(r.cal, today(r.cal), { weekday: true })}.` : '';
    } catch (err) { toast(`Rested, but the clock didn’t move: ${err.message}`, 'bad'); }
    const night = nightRoll(makeRng(`${Date.now()}-${Math.random()}`), Number(odds.value), table?.rows || []);
    toast(`The party made camp and rested${failed.length ? ` (these sheets didn’t update: ${failed.join(', ')})` : ''}.${woke}`, failed.length ? 'bad' : undefined);
    rerender();
    if (!night.happens) { d.close(); return; }
    // Something comes in the night: show it here, for the GM to run.
    const party = partyDefaults();
    setKids(result, el('h3', {}, 'In the night…'),
      night.row ? el('article', { class: 'card' }, el('div', { class: 'eyebrow' }, `Rolled ${night.roll} on d${night.die}`), el('p', { class: 'lede' }, night.row))
        : encounterCard(rollEncounter({ terrain: here ? placeTerrains(here) : ['road'], level: party.level, size: party.size, difficulty: 'Moderate', ...monsterSource() }), { title: here ? `Night near ${here.name}` : 'Night on the road', place: here }));
    go.replaceWith(el('button', { class: 'btn primary', type: 'button', onclick: () => d.close() }, 'Done'));
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}
