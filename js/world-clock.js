// Time of day and light: the in-world hour and the lights burning down, on the world's front page and in session
// prep. GMs move time on (10 minutes, an hour, a rest), set the hour, and light or put out torches, lanterns and
// spells; when time passes midnight the calendar moves on a day. Players see it all, updated live.
import { el, toast, setKids } from './dom.js';
import { api, isGm, isMember } from './api.js';
import { world, worldEntries } from './world-store.js';
import { readClock, LIGHTS, STEPS, partOfDay, hhmm, leftText, fuelFor, lightName } from './clock.js';
import { changePlay } from './sheet-ui.js';
import { takeItem } from './handover.js';
import { formatDate, today } from './calendar.js';

export function clockCard() {
  if (!isMember()) return null;
  const box = el('section', { class: 'card clock-card', 'aria-labelledby': 'clock-h' });
  const send = async (clock, msg) => {
    try {
      const r = await api('settings', { method: 'PATCH', body: { clock } });
      world.info = { ...world.info, clock: r.clock, ...(r.cal ? { cal: r.cal } : {}) };
      const notes = [msg, r.out?.length ? `${r.out.join(', ')} went out` : '', r.days && r.cal ? `a new day: ${formatDate(r.cal, today(r.cal), { weekday: true })}` : ''].filter(Boolean);
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
        el('div', { class: 'btnrow' }, STEPS.map(([m, label]) => el('button', { class: 'btn small', type: 'button', onclick: () => send({ advance: m }) }, label)),
          el('label', { class: 'check', for: 'clock-set' }, 'Time ', time)),
        el('div', { class: 'btnrow' }, pick, from, el('button', { class: 'btn small', type: 'button', onclick: light }, 'Light it')));
    }
    setKids(box,
      el('h3', { id: 'clock-h' }, 'Time and light'),
      el('p', { class: 'clock-now' }, el('strong', {}, hhmm(c.minutes)), ` · ${partOfDay(c.minutes)}`),
      c.lights.length ? lights : el('p', { class: 'muted small' }, gm ? 'No lights burning. Light a torch when the party goes somewhere dark.' : 'No lights burning.'),
      tools);
  }
  draw();
  addEventListener('world:clock', () => { if (box.isConnected) draw(); });
  return box;
}
