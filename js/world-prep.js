// Session prep (GMs): everything for the next session on one page. Last time, where the party is and what's there,
// quests in play, clocks about to finish, what's coming on the calendar, the party's state, loose threads, and a
// scratch pad the GMs share. Route: #world/prep
import { el, toast, setKids } from './dom.js';
import { recapButton } from './world-recap.js';
import { api, isGm, session } from './api.js';
import { world, worldEntries, getEntry, link, kindLabel, byName, descendantsOf, trail, whenTime, notice, richText } from './world-store.js';
import { PLACE_KINDS } from './world-schema.js';
import { worldCalendar, todayText, datedEntries } from './world-calendar.js';
import { toDays, fromDays, today, holidaysOn, formatDate } from './calendar.js';
import { clockFace } from './world-clocks.js';
import { rumorsAt, letRumorsSpread } from './world-rumors.js';
import { encounterCard, partyDefaults, placeTerrains, monsterSource } from './encounter-ui.js';
import { rollEncounter, rollWeather, seasonOf } from './encounters.js';
import { vitals } from './sheet-ui.js';

const ACTIVE_PC = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);
const card = (title, ...kids) => el('section', { class: 'card prep-card' }, el('h3', {}, title), ...kids);
const empty = (text) => el('p', { class: 'muted small' }, text);
const list = (items, row) => el('ul', { class: 'plain prep-list' }, items.map((x) => el('li', {}, row(x))));

async function savePrep(patch) {
  const r = await api('settings', { method: 'PATCH', body: { prep: patch } });
  return r.prep;
}

function sessions() {
  return worldEntries().filter((e) => e.kind === 'session').sort((a, b) => (parseFloat(b.fields?.number) || 0) - (parseFloat(a.fields?.number) || 0) || String(b.created_at).localeCompare(String(a.created_at)));
}

function lastTime() {
  const last = sessions()[0];
  if (!last) return card('Last time', empty('No sessions logged yet. Start the first one below and it’ll show here next time.'));
  return card(`Last time: ${last.name}`,
    el('p', { class: 'muted small' }, [last.fields?.played_on, last.fields?.world_date, last.fields?.gm && `GM ${last.fields.gm}`].filter(Boolean).join(' · ')),
    last.summary ? el('p', {}, last.summary) : null,
    last.fields?.next ? el('div', { class: 'prep-next' }, el('strong', {}, 'Next time: '), richText(last.fields.next)) : null,
    el('p', {}, link(last, 'Read the full session')));
}

// The nearest town at or above a place (rumors and markets live on towns).
const townOf = (place) => (place?.kind === 'settlement' ? place : [...trail(place)].reverse().find((p) => p.kind === 'settlement') || null);

function whereSection(prep, rerender) {
  const places = worldEntries().filter((e) => PLACE_KINDS.includes(e.kind) && e.fields?.type !== 'Room').sort(byName);
  const here = prep.location_id && getEntry(prep.location_id);
  const sel = el('select', { id: 'prep-where', 'aria-label': 'Where the party is' }, el('option', { value: '' }, 'Somewhere on the road'),
    places.map((p) => el('option', { value: p.id }, `${p.name} (${kindLabel(p.kind).toLowerCase()})`)));
  sel.value = here ? here.id : '';
  sel.addEventListener('change', async () => { try { await savePrep({ location_id: sel.value || null }); toast('Party location saved'); rerender(); } catch (err) { toast(err.message, 'bad'); } });
  const pick = el('div', { class: 'controls' }, el('label', { for: 'prep-where' }, 'The party is in'), sel);
  if (!here) return card('Where the party is', pick, empty('Pick where the party is to see who and what is around them.'));
  const inside = descendantsOf(here.id);
  const people = inside.filter((e) => e.kind === 'npc' && e.fields?.status !== 'Dead');
  const key = people.filter((e) => (e.tags || []).includes('key'));
  const jobs = inside.filter((e) => e.kind === 'quest' && ['Available', 'Rumor'].includes(e.fields?.status));
  const town = townOf(here);
  const rumors = town ? rumorsAt(town.id) : [];
  const shops = inside.filter((e) => e.kind === 'location' && (e.fields?.type === 'Shop' || e.fields?.stock));
  const cal = worldCalendar();
  const season = cal ? seasonOf(cal.month, cal.months.length) : 'Summer';
  const terrain = placeTerrains(here);
  // Same weather all (in-world) day: seeded by place and date, so redrawing the page doesn't change it.
  const weather = rollWeather({ terrain, season, seed: `${here.id}:${cal ? todayText(cal) : new Date().toDateString()}` });
  const encBox = el('div');
  const party = partyDefaults();
  return card(`Where the party is: ${here.name}`, pick,
    el('div', { class: 'prep-grid' },
      el('div', {}, el('h4', {}, `People (${people.length})`),
        people.length ? list([...key, ...people.filter((p) => !key.includes(p))].slice(0, 12), (p) => [link(p), el('span', { class: 'muted small' }, ` ${p.fields?.role || ''}`), key.includes(p) ? el('span', { class: 'tag' }, 'key') : null])
          : empty('Nobody recorded here.'),
        people.length > 12 ? el('a', { class: 'small', href: `#world/e/${here.id}/people` }, `All ${people.length}`) : null),
      el('div', {}, el('h4', {}, `Jobs on the board (${jobs.length})`),
        jobs.length ? list(jobs.slice(0, 8), (q) => [link(q), q.fields?.reward ? el('span', { class: 'muted small' }, ` ${q.fields.reward}`) : null]) : empty('Nothing posted.'),
        el('h4', {}, `Rumors going around${town && town !== here ? ` ${town.name}` : ''} (${rumors.length})`),
        rumors.length ? list(rumors.slice(0, 5), ({ r, v }) => [el('q', {}, v.text), ' ', link(r, '›')]) : empty('No rumors here.'),
        shops.length ? el('p', { class: 'small' }, `${shops.length} shop${shops.length === 1 ? '' : 's'}: `, shops.slice(0, 6).flatMap((s, i) => [i ? ', ' : '', link(s)])) : null),
      el('div', {}, el('h4', {}, 'Weather'), el('p', {}, weather.line), weather.rules.length ? el('p', { class: 'muted small' }, weather.rules[0]) : null,
        el('h4', {}, 'If trouble comes'),
        el('div', { class: 'btnrow' }, el('button', { class: 'btn small', type: 'button', onclick: () => setKids(encBox, encounterCard(rollEncounter({ terrain, level: party.level, size: party.size, difficulty: 'Moderate', ...monsterSource() }), { title: `Near ${here.name}` })) }, 'Roll an encounter'),
          el('a', { class: 'btn small ghost', href: `#world/e/${here.id}/wilds` }, 'Encounter table')),
        encBox)));
}

function questsSection() {
  const active = worldEntries().filter((e) => e.kind === 'quest' && e.fields?.status === 'Active').sort(byName);
  return card(`Quests in play (${active.length})`,
    active.length ? list(active, (q) => [link(q), q.fields?.patron ? el('span', { class: 'muted small' }, ` for ${q.fields.patron}`) : null,
      q.fields?.stakes ? el('div', { class: 'muted small' }, q.fields.stakes.length > 140 ? `${q.fields.stakes.slice(0, 138)}…` : q.fields.stakes) : null])
      : empty('No active quests. Mark a quest Active when the party takes it on.'));
}

function clocksSection() {
  const cs = (world.standings?.clocks || []).filter((c) => c.filled < c.size).map((c) => ({ ...c, left: c.size - c.filled }))
    .sort((a, b) => a.left - b.left || b.filled / b.size - a.filled / a.size).slice(0, 8);
  const done = (world.standings?.clocks || []).filter((c) => c.filled >= c.size);
  return card('Clocks to watch',
    cs.length ? el('ul', { class: 'clock-list' }, cs.map((c) => el('li', { class: 'clock' }, clockFace(c.size, c.filled, { r: 18 }),
      el('div', { class: 'clock-body' }, el('strong', {}, c.name), getEntry(c.entry_id) ? el('span', { class: 'muted small' }, ' · ', link(getEntry(c.entry_id))) : null,
        el('div', { class: 'muted small' }, `${c.left} to go${c.per_turn ? `, +${c.per_turn} each faction turn` : ''}`)))))
      : empty('No clocks running.'),
    done.length ? el('p', { class: 'clock-done small' }, `Finished: ${done.map((c) => c.name).join(', ')}. Decide what changed.`) : null,
    el('a', { class: 'small', href: '#world/clocks' }, 'All clocks and faction turn'));
}

function calendarSection() {
  const cal = worldCalendar();
  if (!cal) return card('Coming up', empty('Set up the calendar to see holidays and dated events here.'), el('a', { class: 'small', href: '#world/calendar' }, 'Set up the calendar'));
  const now = toDays(cal, today(cal));
  const soon = [];
  for (let i = 0; i <= 14; i++) for (const h of holidaysOn(cal, fromDays(cal, now + i))) soon.push({ n: now + i, text: `🎉 ${h.name}` });
  for (const x of datedEntries(cal)) if (x.n >= now && x.n <= now + 14) soon.push({ n: x.n, entry: x.entry });
  soon.sort((a, b) => a.n - b.n);
  return card('Coming up (next two weeks)', el('p', { class: 'muted small' }, `Today: ${todayText(cal)}`),
    soon.length ? list(soon, (s) => [el('span', { class: 'date' }, s.n === now ? 'Today' : `in ${s.n - now}d`), ' ', s.entry ? link(s.entry) : s.text])
      : empty('Nothing on the calendar.'),
    el('a', { class: 'small', href: '#world/calendar' }, 'Calendar'));
}

function partySection() {
  const pcs = worldEntries().filter(ACTIVE_PC).sort(byName);
  return card(`The party (${pcs.length})`,
    pcs.length ? el('ul', { class: 'plain prep-party' }, pcs.map((c) => {
      const v = vitals(c);
      const pct = v.max ? Math.max(0, Math.min(100, (v.hp / v.max) * 100)) : 100;
      return el('li', {}, el('div', { class: 'prep-pc' }, link(c), el('span', { class: 'muted small' }, [c.fields?.class, c.fields?.level && `L${c.fields.level}`, c.owner || c.fields?.player].filter(Boolean).join(' · ')),
        v.max ? el('span', { class: 'small prep-hp' }, `${v.hp}/${v.max} HP${v.temp ? ` +${v.temp}` : ''}`) : null),
        v.max ? el('div', { class: 'hp-bar small-bar' }, el('span', { style: `width:${pct}%` })) : null,
        v.conditions.length || v.exhaustion ? el('div', { class: 'small danger-line' }, [...v.conditions, v.exhaustion ? `Exhaustion ${v.exhaustion}` : ''].filter(Boolean).join(', ')) : null);
    })) : empty('No active characters yet.'),
    el('a', { class: 'small', href: '#world/party' }, 'Party page and treasury'));
}

function threadsSection(gmThreads, table) {
  const suggestions = worldEntries().filter((e) => e.status === 'suggested');
  const since = sessions()[0]?.created_at || '';
  const fresh = table.filter((c) => !since || c.created_at > since);
  return card('Loose threads',
    el('ul', { class: 'plain prep-list' },
      el('li', {}, el('a', { href: '#world/talk' }, `${gmThreads.length} open GM discussion${gmThreads.length === 1 ? '' : 's'}`)),
      el('li', {}, el('a', { href: '#world/suggestions' }, `${suggestions.length} player suggestion${suggestions.length === 1 ? '' : 's'} waiting`)),
      el('li', {}, el('a', { href: '#world/table' }, `${fresh.length} table talk comment${fresh.length === 1 ? '' : 's'}${since ? ' since last session' : ''}`))),
    fresh.length ? list(fresh.slice(0, 4), (c) => [el('strong', {}, c.gm || 'Someone'), ` on `, getEntry(c.entry_id) ? link(getEntry(c.entry_id)) : c.entry_name, `: ${c.body.length > 90 ? `${c.body.slice(0, 88)}…` : c.body}`]) : null,
    gmThreads.slice(0, 3).length ? list(gmThreads.slice(0, 3), (t) => [getEntry(t.entry_id) ? link(getEntry(t.entry_id)) : t.entry_name, el('span', { class: 'muted small' }, ` ${t.gm}: ${t.body.length > 80 ? `${t.body.slice(0, 78)}…` : t.body}`)]) : null);
}

function scratchPad(prep) {
  const ta = el('textarea', { rows: 10, id: 'prep-notes', placeholder: 'Plans for next session: scenes, names you’ll need, what the villain does if the party stalls…' }, prep.notes || '');
  const status = el('p', { class: 'muted small', role: 'status' }, prep.updated_by ? `Last saved by ${prep.updated_by} ${whenTime(prep.updated_at)}.` : 'Shared with the other GMs. Saves when you click away.');
  ta.addEventListener('change', async () => { try { const p = await savePrep({ notes: ta.value }); status.textContent = `Saved ${whenTime(p.updated_at)}.`; } catch (err) { status.textContent = err.message; } });
  return card('GM scratch pad', el('label', { class: 'sr-only', for: 'prep-notes' }, 'GM scratch pad'), ta, status);
}

function startSession(prep) {
  const n = Math.max(0, ...sessions().map((s) => parseInt(s.fields?.number, 10) || 0)) + 1;
  const cal = worldCalendar();
  const pcs = worldEntries().filter(ACTIVE_PC).sort(byName);
  const last = sessions()[0];
  const here = prep.location_id && getEntry(prep.location_id);
  return () => window.dispatchEvent(new CustomEvent('world:draft', { detail: {
    kind: 'session', name: `Session ${n}`,
    fields: { number: String(n), played_on: new Date().toISOString().slice(0, 10), world_date: cal ? formatDate(cal, today(cal)) : '', gm: session.gm?.name || '',
      players: pcs.map((c) => `${c.name}${c.owner || c.fields?.player ? ` (${c.owner || c.fields.player})` : ''}`).join('\n') },
    body: [last?.fields?.next ? `Picking up from last time: ${last.fields.next}` : '', here ? `The party is in [[${here.name}]].` : '', 'What happened:', '', 'Who the party met (use [[Names]] so the entries link back to this session):'].filter((x, i) => x || i > 1).join('\n\n'),
  } }));
}

export async function viewPrep(rerender) {
  if (!isGm()) return notice('GMs only', 'Session prep is the GMs’ planning page.');
  let prep = {}, gmThreads = [], table = [];
  const [s, t, c] = await Promise.allSettled([api('settings'), api('comments'), api('comments', { query: { recent: 'table' } })]);
  if (s.status === 'fulfilled') prep = s.value.world?.prep || {};
  if (t.status === 'fulfilled') gmThreads = t.value.threads || [];
  if (c.status === 'fulfilled') table = c.value.comments || [];
  const next = Math.max(0, ...sessions().map((x) => parseInt(x.fields?.number, 10) || 0)) + 1;
  return el('div', { class: 'w-view prep-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, `Prep for session ${next}`), el('p', {}, 'Everything you need before the table: where things stand, what’s about to happen, and your notes.')),
      el('div', { class: 'btnrow' }, recapButton('btn'), el('button', { class: 'btn primary', type: 'button', onclick: startSession(prep) }, `Start session ${next}`))),
    el('div', { class: 'btnrow prep-actions' }, el('span', { class: 'muted small' }, 'Between sessions:'),
      el('a', { class: 'btn small', href: '#world/clocks' }, 'Faction turn'),
      el('button', { class: 'btn small', type: 'button', onclick: async () => { await letRumorsSpread(); rerender(); } }, 'Let rumors spread'),
      el('a', { class: 'btn small', href: '#world/calendar' }, 'Move time on')),
    el('div', { class: 'prep-columns' },
      el('div', { class: 'prep-main' }, lastTime(), whereSection(prep, rerender), questsSection(), scratchPad(prep)),
      el('div', { class: 'prep-side' }, partySection(), clocksSection(), calendarSection(), threadsSection(gmThreads, table))));
}
