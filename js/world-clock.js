// Time of day and light: the in-world hour and the lights burning down, on the world's front page and in session
// prep. GMs move time on (10 minutes, an hour, a rest), set the hour, and light or put out torches, lanterns and
// spells; when time passes midnight the calendar moves on a day. Players see it all, updated live.
import { el, toast, setKids } from './dom.js';
import { api, isGm, isMember } from './api.js';
import { world, worldEntries } from './world-store.js';
import { readClock, LIGHTS, STEPS, partOfDay, hhmm, leftText, fuelFor, lightName, JUMPS, untilNext } from './clock.js';
import { changePlay } from './sheet-ui.js';
import { takeItem } from './handover.js';
import { outAndAbout, partyTown, townSnapshot } from './world-routine.js';
import { clockDiff, diffText } from './clock-diff.js';
import { formatDate, today, cleanCalendar } from './calendar.js';
import { holidayToday, holidayTomorrow } from './shop-hours.js';

// What changed when time last moved (kept across redraws: a new day redraws the whole page).
let lastChange = '';

export function clockCard() {
  if (!isMember()) return null;
  const box = el('section', { class: 'card clock-card', 'aria-labelledby': 'clock-h' });
  const send = async (clock, msg) => {
    try {
      // What changed when time moves: the party's town before and after.
      const town = clock.advance || clock.set !== undefined ? partyTown() : null, before = town && townSnapshot(town);
      const r = await api('settings', { method: 'PATCH', body: { clock } });
      world.info = { ...world.info, clock: r.clock, ...(r.cal ? { cal: r.cal } : {}) };
      const changed = before ? diffText(clockDiff(before, townSnapshot(town))) : '';
      // A quiet night: past midnight, say who's still out and about at this hour.
      const late = r.days && r.clock ? outAndAbout(r.clock.minutes) : [];
      const notes = [msg, r.out?.length ? `${r.out.join(', ')} went out` : '', r.days && r.cal ? `a new day: ${formatDate(r.cal, today(r.cal), { weekday: true })}` : '',
        r.days ? (late.length ? `out at this hour: ${late.slice(0, 4).map((x) => `${x.npc.name} (${x.place.name})`).join(', ')}${late.length > 4 ? ` and ${late.length - 4} more` : ''}` : 'a quiet night: nobody is about') : '',
        changed ? `in ${town.name}: ${changed}` : ''].filter(Boolean);
      if (before) lastChange = changed ? `${hhmm(r.clock.minutes)} in ${town.name}: ${changed}.` : ''; // a move that changed nothing clears it
      if (notes.length) toast(notes.join(' · '));
      draw();
      if (r.days) window.dispatchEvent(new Event('world:rerender'));
    } catch (err) { toast(err.message, 'bad'); }
  };
  function draw() {
    const c = readClock(world.info?.clock);
    const gm = isGm();
    const lights = el('ul', { class: 'plain clock-lights' }, c.lights.map((l) => el('li', { class: !l.forever && l.left <= 10 ? 'low' : '' },
      el('span', {}, `🔥 ${l.name}`), el('span', { class: 'muted small' }, l.forever ? 'until put out' : `${leftText(l.left)} left`),
      l.forever ? null : el('div', { class: 'clock-bar', 'aria-hidden': 'true' }, el('span', { style: `width:${l.total ? Math.round((l.left / l.total) * 100) : 0}%` })),
      gm ? el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Put out ${l.name}`, onclick: () => send({ remove_light: l.id }, `${l.name} put out`) }, '✕') : null)));
    let tools = null;
    if (gm) {
      const time = el('input', { type: 'time', id: 'clock-set', value: hhmm(c.minutes), 'aria-label': 'Set the time' });
      time.addEventListener('change', () => { const [h, m] = time.value.split(':').map(Number); if (Number.isFinite(h)) send({ set: h * 60 + (m || 0) }); });
      const pick = el('select', { 'aria-label': 'Light' }, LIGHTS.map(([n, mins]) => el('option', { value: `${mins}|${n}` }, mins ? `${n} (${leftText(mins)})` : `${n} (lasts)`)));
      // Lights from the pack: a torch or candle (or a lantern's flask of oil) can come out of a character's inventory.
      const chars = worldEntries().filter((e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status)).sort((a, b) => a.name.localeCompare(b.name));
      const from = chars.length ? el('select', { 'aria-label': 'From whose pack' }, el('option', { value: '' }, 'from nobody’s pack'), chars.map((c) => el('option', { value: c.id }, `from ${c.name}’s pack`))) : null;
      const syncFrom = () => { if (from) from.hidden = !fuelFor(pick.value.split('|').slice(1).join('|')); };
      pick.addEventListener('change', syncFrom); syncFrom();
      const light = async () => {
        const [mins, ...n] = pick.value.split('|'); const name = n.join('|');
        const fuel = fuelFor(name), who = from && !from.hidden && from.value ? world.entries.get(from.value) : null;
        if (fuel && who) {
          try {
            await changePlay(who, (play) => { const t = takeItem(play.inventory, fuel); if (t.error) throw new Error(`${who.name} has no ${{ oil: 'oil for the lantern', torch: 'torches', candle: 'candles' }[fuel] || fuel}`); play.inventory = t.text; }, name === 'Lantern' ? 'Filled a lantern with a flask of oil' : `Lit a ${name.toLowerCase()}`);
          } catch (err) { toast(err.message, 'bad'); return; }
        }
        const called = fuel && who ? lightName(name, who.name) : name;
        send({ add_light: { name: called, minutes: Number(mins) } }, `${called} lit`);
      };
      tools = el('div', { class: 'clock-tools' },
        // Jump to a time of day: the next morning, midday, evening or night (always forward, so days roll on).
        el('div', { class: 'btnrow clock-jumps', role: 'group', 'aria-label': 'Jump to a time of day' }, JUMPS.map(([label, t]) => el('button', { class: 'btn small ghost', type: 'button', title: `On to the next ${label.toLowerCase()} (${hhmm(t)})`, onclick: () => send({ advance: untilNext(c.minutes, t) }, `On to ${label.toLowerCase()}`) }, `→ ${label}`))),
        el('div', { class: 'btnrow' }, STEPS.map(([m, label]) => el('button', { class: 'btn small', type: 'button', onclick: () => send({ advance: m }) }, label)),
          el('label', { class: 'check', for: 'clock-set' }, 'Time ', time)),
        el('div', { class: 'btnrow' }, pick, from, el('button', { class: 'btn small', type: 'button', onclick: light }, 'Light it')));
    }
    setKids(box,
      el('h3', { id: 'clock-h' }, 'Time and light'),
      el('p', { class: 'clock-now' }, el('strong', {}, hhmm(c.minutes)), ` · ${partOfDay(c.minutes)}`),
      // What changed when time last moved (this browser), in the party's town.
      lastChange ? el('p', { class: 'small clock-changed' }, `⏩ ${lastChange}`) : null,
      // Holidays on the clock: a holiday shuts the shops (the taverns stay open).
      (() => { const h = holidayToday(cleanCalendar(world.info?.cal)); return h ? el('p', { class: 'small clock-holiday' }, `🎉 ${h}: the shops are shut today; the taverns are open.`) : null; })(),
      // Eve of a holiday on the clock: festive goods cost more today, and the shops shut tomorrow.
      (() => { const h = holidayTomorrow(cleanCalendar(world.info?.cal)); return h ? el('p', { class: 'small clock-eve' }, `🎉 ${h} tomorrow: festive goods cost a quarter more today, and the shops will be shut.`) : null; })(),
      // Last orders on the clock: late at night, when the world's taverns call last orders and shut.
      (() => {
        const m = c.minutes % 1440, taverns = worldEntries().some((e) => e.kind === 'location' && e.fields?.type === 'Tavern');
        if (!taverns || !(m >= 22 * 60 || m < 120)) return null;
        return el('p', { class: 'small clock-last' }, '🍺 ', m >= 60 && m < 120 ? `Last orders at the taverns: they shut in ${leftText(120 - m)}.` : 'The taverns call last orders at 01:00 and shut at 02:00.');
      })(),
      c.lights.length ? lights : el('p', { class: 'muted small' }, gm ? 'No lights burning. Light a torch when the party goes somewhere dark.' : 'No lights burning.'),
      tools);
  }
  draw();
  addEventListener('world:clock', () => { if (box.isConnected) draw(); });
  return box;
}
