// The in-world calendar: today's date, a month grid with moons, holidays and dated entries, "days pass" for GMs,
// and a calendar editor. Route: #world/calendar[/<year>/<month>]
import { el, toast, setKids } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, link, kindLabel, notice } from './world-store.js';
import { birthdaysBetween, birthdayText } from './birthdays.js';
import { repeatsBetween } from './repeats.js';
import { onThisDay, yearsAgoText } from './onthisday.js';
import { PRESETS, makeCalendar, cleanCalendar, toDays, fromDays, advance, today, formatDate, parseDate, moonPhase, moonEvent, holidaysOn } from './calendar.js';

// Fields that hold an in-world date, by kind.
const DATE_FIELDS = { event: ['date'], session: ['world_date'], journal: ['date'], handout: ['found'], quest: ['deadline'] };

export const worldCalendar = () => cleanCalendar(world.info?.cal);

// Days went by (the calendar moved forward): living costs and the like listen for this.
export const daysPassed = (days) => window.dispatchEvent(new CustomEvent('world:days', { detail: { days } }));

export function todayText(cal = worldCalendar()) {
  return cal ? formatDate(cal, today(cal), { weekday: true }) : '';
}

// Every visible entry with a date this calendar understands, as {entry, date, n} (n = absolute day).
export function datedEntries(cal) {
  const out = [];
  for (const e of worldEntries()) {
    // A finished quest's deadline doesn't matter any more.
    if (e.kind === 'quest' && ['Completed', 'Failed', 'Abandoned'].includes(e.fields?.status)) continue;
    for (const f of DATE_FIELDS[e.kind] || []) {
      const d = parseDate(cal, e.fields?.[f]);
      if (d) { out.push({ entry: e, date: d, n: toDays(cal, d) }); break; }
    }
  }
  return out;
}

async function saveCal(cal, msg) {
  try {
    const r = await api('settings', { method: 'PATCH', body: { cal } });
    world.info = { ...world.info, cal: r.cal };
    if (msg) toast(msg);
    return true;
  } catch (err) { toast(err.message, 'bad'); return false; }
}

function setup(rerender) {
  if (!isGm()) return notice('No calendar yet', 'The GMs haven’t set up this world’s calendar.');
  const preset = el('select', { id: 'cal-preset' }, Object.entries(PRESETS).map(([k, p]) => el('option', { value: k }, p.label)));
  const year = el('input', { type: 'number', id: 'cal-year', value: 1000 });
  const era = el('input', { type: 'text', id: 'cal-era', placeholder: 'e.g. AR (optional)', maxlength: 12 });
  return el('div', { class: 'card edit-form' }, el('h3', {}, 'Set up the calendar'),
    el('p', { class: 'muted' }, 'Pick a starting point; you can rename months, change their lengths, and add moons and holidays afterwards. Dates written like “14 Highsun 1042” in events, sessions and journals then show up on the calendar.'),
    el('div', { class: 'controls' }, el('div', { class: 'field' }, el('label', { for: 'cal-preset' }, 'Calendar'), preset),
      el('div', { class: 'field' }, el('label', { for: 'cal-year' }, 'Current year'), year), el('div', { class: 'field' }, el('label', { for: 'cal-era' }, 'Era'), era)),
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: async () => {
      const cal = { ...makeCalendar(preset.value, Number(year.value) || 0), era: era.value.trim() };
      if (await saveCal(cal, 'Calendar ready')) rerender();
    } }, 'Create calendar')));
}

function editor(cal, rerender) {
  const months = el('textarea', { rows: Math.min(16, cal.months.length + 1), id: 'cal-months' }, cal.months.map((m) => `${m.name}, ${m.days}`).join('\n'));
  const weekdays = el('input', { type: 'text', id: 'cal-weekdays', value: cal.weekdays.join(', ') });
  const moons = el('textarea', { rows: 2, id: 'cal-moons' }, cal.moons.map((m) => `${m.name}, ${m.cycle}, ${m.offset}`).join('\n'));
  const holidays = el('textarea', { rows: 4, id: 'cal-holidays' }, cal.holidays.map((h) => `${h.name}, ${h.day} ${cal.months[h.month].name}`).join('\n'));
  const era = el('input', { type: 'text', id: 'cal-era2', value: cal.era, maxlength: 12 });
  const status = el('p', { class: 'form-status', role: 'status' });
  const field = (id, label, input, hint) => el('div', { class: 'field wide' }, el('label', { for: id }, label), input, hint ? el('small', { class: 'muted' }, hint) : null);
  return el('details', { class: 'card cal-editor' }, el('summary', {}, 'Edit the calendar'),
    el('div', { class: 'edit-form' },
      field('cal-months', 'Months', months, 'One per line: name, number of days.'),
      field('cal-weekdays', 'Days of the week', weekdays, 'Comma separated.'),
      field('cal-moons', 'Moons', moons, 'One per line: name, days per cycle, offset (shifts which day is new moon).'),
      field('cal-holidays', 'Holidays', holidays, 'One per line: name, then the date, e.g. “Midsummer, 15 Highsun”.'),
      field('cal-era2', 'Era', era),
      status,
      el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: async () => {
        const ms = months.value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [name, days] = l.split(/\s*,\s*/); return { name, days: Number(days) || 30 }; });
        const draft = { ...cal, months: ms, weekdays: weekdays.value.split(',').map((w) => w.trim()).filter(Boolean), era: era.value.trim(),
          moons: moons.value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [name, cycle, offset] = l.split(/\s*,\s*/); return { name, cycle: Number(cycle), offset: Number(offset) || 0 }; }) };
        const bad = [];
        draft.holidays = holidays.value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
          const i = l.indexOf(','); const name = i < 0 ? l : l.slice(0, i).trim();
          const d = i < 0 ? null : parseDate({ ...draft, year: cal.year }, l.slice(i + 1));
          if (!d) { bad.push(name); return null; }
          return { name, month: d.month, day: d.day };
        }).filter(Boolean);
        if (bad.length) { status.textContent = `Couldn’t read the date for: ${bad.join(', ')}.`; status.className = 'form-status error'; return; }
        const clean = cleanCalendar(draft);
        if (!clean) { status.textContent = 'Add at least one month.'; status.className = 'form-status error'; return; }
        if (await saveCal(clean, 'Calendar saved')) rerender();
      } }, 'Save calendar'))));
}

export function viewCalendar(arg, sub, rerender) {
  const cal = worldCalendar();
  const head = el('div', { class: 'panel-head' }, el('h2', {}, 'Calendar'), el('p', {}, 'The date in the world, its moons and holidays, and everything that happened when.'));
  if (!cal) return el('div', { class: 'w-view' }, head, setup(rerender));
  const now = today(cal);
  const shown = arg != null && sub != null && cal.months[Number(sub)] ? { year: Number(arg), month: Number(sub) } : { year: now.year, month: now.month };
  const go = (y, m) => { location.hash = `world/calendar/${y}/${m}`; };
  const prev = shown.month ? [shown.year, shown.month - 1] : [shown.year - 1, cal.months.length - 1];
  const next = shown.month < cal.months.length - 1 ? [shown.year, shown.month + 1] : [shown.year + 1, 0];
  const first = toDays(cal, { ...shown, day: 1 });
  // Dated entries, plus repeating events coming round again this month (marked ↻).
  const dated = [...datedEntries(cal), ...repeatsBetween(cal, worldEntries(), first, first + cal.months[shown.month].days - 1).map((x) => ({ ...x, repeat: true }))];
  const births = birthdaysBetween(cal, worldEntries(), first, first + cal.months[shown.month].days - 1);
  const offset = ((first % cal.weekdays.length) + cal.weekdays.length) % cal.weekdays.length;
  const nowN = toDays(cal, now);
  const detail = el('div', { class: 'cal-detail' });

  const showDay = (d) => {
    const n = toDays(cal, d);
    const items = dated.filter((x) => x.n === n);
    setKids(detail, el('div', { class: 'card' },
      el('div', { class: 'entry-head' }, el('h3', {}, formatDate(cal, d, { weekday: true })), n === nowN ? el('span', { class: 'tag' }, 'Today') : el('span', { class: 'muted small' }, `${Math.abs(n - nowN)} days ${n < nowN ? 'ago' : 'from now'}`)),
      cal.moons.length ? el('p', { class: 'small' }, cal.moons.map((m) => { const p = moonPhase(cal, m, d); return `${p.icon} ${m.name}: ${p.name.toLowerCase()}`; }).join(' · ')) : null,
      holidaysOn(cal, d).map((h) => el('p', { class: 'holiday' }, `🎉 ${h.name}`)),
      births.filter((x) => x.n === n).map((x) => el('p', { class: 'birthday' }, '🎂 ', link(x.entry), x.age ? ` turns ${x.age}` : '’s birthday')),
      items.length ? el('ul', { class: 'entry-list' }, items.map((x) => el('li', {}, x.repeat ? '↻ ' : '', link(x.entry), el('span', { class: 'kind-tag' }, x.repeat ? x.entry.fields.repeats.toLowerCase() : kindLabel(x.entry.kind))))) : el('p', { class: 'muted small' }, 'Nothing recorded on this day.'),
      isGm() ? el('div', { class: 'btnrow' },
        n !== nowN ? el('button', { class: 'btn small', type: 'button', onclick: async () => { if (await saveCal({ ...cal, ...d }, `Today is now ${formatDate(cal, d)}`)) rerender(); } }, 'Make this today') : null,
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => window.dispatchEvent(new CustomEvent('world:draft', { detail: { kind: 'event', name: '', fields: { date: formatDate(cal, d), sort: String(d.year) } } })) }, '+ Event on this day')) : null));
  };

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(el('div', { class: 'cal-cell blank', 'aria-hidden': 'true' }));
  for (let day = 1; day <= cal.months[shown.month].days; day++) {
    const d = { ...shown, day }, n = first + day - 1;
    const items = dated.filter((x) => x.n === n);
    const hol = holidaysOn(cal, d);
    const full = cal.moons.map((m) => ({ new: '🌑', full: '🌕' })[moonEvent(cal, m, d)]).filter(Boolean);
    cells.push(el('button', { type: 'button', class: `cal-cell${n === nowN ? ' today' : ''}${hol.length ? ' holiday' : ''}`, 'aria-label': formatDate(cal, d, { weekday: true }), onclick: (ev) => {
      ev.currentTarget.parentElement.querySelectorAll('.selected').forEach((c) => c.classList.remove('selected'));
      ev.currentTarget.classList.add('selected'); showDay(d);
    } },
      el('span', { class: 'cal-day' }, day, full.length ? el('span', { class: 'cal-moon' }, full.join('')) : null),
      hol.map((h) => el('span', { class: 'cal-hol' }, h.name)),
      births.filter((x) => x.n === n).map((x) => el('span', { class: 'cal-item cal-bday', title: birthdayText(x) }, `🎂 ${x.entry.name}`)),
      items.slice(0, 3).map((x) => el('span', { class: `cal-item k-${x.entry.kind}`, title: x.entry.kind === 'session' ? `Played: ${x.entry.name}` : x.entry.name }, x.entry.kind === 'session' ? `▶ ${x.entry.name}` : x.entry.kind === 'quest' ? `⏳ ${x.entry.name}` : x.repeat ? `↻ ${x.entry.name}` : x.entry.name)),
      items.length > 3 ? el('span', { class: 'cal-more' }, `+${items.length - 3} more`) : null));
  }

  const pass = (days, label) => el('button', { class: 'btn small', type: 'button', onclick: async () => {
    const c2 = advance(cal, days);
    if (await saveCal(c2, `${label}: it’s now ${formatDate(c2, today(c2), { weekday: true })}`)) { location.hash = `world/calendar/${c2.year}/${c2.month}`; rerender(); daysPassed(days); }
  } }, label);
  const custom = el('input', { type: 'number', class: 'hp-amt', 'aria-label': 'Days', placeholder: 'days' });

  // What's coming: holidays and dated entries in the next 60 days.
  const soon = [];
  for (let i = 1; i <= 60; i++) { const d = fromDays(cal, nowN + i); for (const h of holidaysOn(cal, d)) soon.push({ n: nowN + i, label: h.name, d }); }
  for (const x of dated) if (x.n > nowN && x.n <= nowN + 60) soon.push({ n: x.n, entry: x.entry, d: x.date });
  soon.sort((a, b) => a.n - b.n);

  const node = el('div', { class: 'w-view calendar-view' }, head,
    el('div', { class: 'card cal-today' },
      el('div', {}, el('span', { class: 'eyebrow' }, 'Today in the world'), el('strong', { class: 'cal-now' }, formatDate(cal, now, { weekday: true }))),
      cal.moons.length ? el('p', { class: 'small' }, cal.moons.map((m) => { const p = moonPhase(cal, m, now); return `${p.icon} ${m.name}: ${p.name.toLowerCase()}`; }).join(' · ')) : null,
      holidaysOn(cal, now).map((h) => el('p', { class: 'holiday' }, `🎉 Today is ${h.name}`)),
      isGm() ? el('div', { class: 'btnrow days-pass' }, el('span', { class: 'muted small' }, 'Time passes:'), pass(1, '+1 day'), pass(cal.weekdays.length, '+1 week'), pass(cal.months[now.month].days, '+1 month'),
        custom, el('button', { class: 'btn small ghost', type: 'button', onclick: async () => {
          const n = Math.round(Number(custom.value) || 0); if (!n) { custom.focus(); return; }
          const c2 = advance(cal, n);
          if (await saveCal(c2, `${Math.abs(n)} days ${n > 0 ? 'pass' : 'rewound'}: ${formatDate(c2, today(c2))}`)) { location.hash = `world/calendar/${c2.year}/${c2.month}`; rerender(); if (n > 0) daysPassed(n); }
        } }, 'Go')) : null),
    el('div', { class: 'cal-nav' },
      el('button', { class: 'btn small', type: 'button', 'aria-label': 'Previous month', onclick: () => go(...prev) }, '‹'),
      el('h3', {}, `${cal.months[shown.month].name} ${shown.year}${cal.era ? ` ${cal.era}` : ''}`),
      el('button', { class: 'btn small', type: 'button', 'aria-label': 'Next month', onclick: () => go(...next) }, '›'),
      shown.year !== now.year || shown.month !== now.month ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => go(now.year, now.month) }, 'Today') : null),
    el('div', { class: 'cal-grid', style: `--cols:${cal.weekdays.length}` },
      cal.weekdays.map((w) => el('div', { class: 'cal-wd' }, w.slice(0, 3))), cells),
    detail,
    soon.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Coming up'), el('ul', { class: 'entry-list' }, soon.slice(0, 12).map((s) => el('li', {},
      el('span', { class: 'date' }, `${s.d.day} ${cal.months[s.d.month].name}`), s.entry ? link(s.entry) : el('span', { class: 'holiday' }, `🎉 ${s.label}`), el('span', { class: 'muted small' }, `in ${s.n - nowN} day${s.n - nowN === 1 ? '' : 's'}`))))) : null,
    isGm() ? editor(cal, rerender) : null);
  if (shown.year === now.year && shown.month === now.month) showDay(now);
  return node;
}


// The front page's "On this day": what happened on today's in-world date in earlier years, birthdays and holidays.
export function onThisDayCard() {
  const cal = worldCalendar();
  if (!cal) return null;
  const { anniversaries, birthdays, holidays } = onThisDay(cal, worldEntries());
  if (!anniversaries.length && !birthdays.length && !holidays.length) return null;
  return el('section', { class: 'card on-this-day' }, el('h3', {}, `On this day: ${formatDate(cal, today(cal))}`),
    el('ul', { class: 'plain' },
      holidays.map((h) => el('li', {}, `🎉 ${h.name}`)),
      birthdays.map((b) => el('li', {}, '🎂 ', link(b.entry), b.age ? ` turns ${b.age}` : '’s birthday')),
      anniversaries.slice(0, 5).map((a) => el('li', {}, el('span', { class: 'muted' }, `${yearsAgoText(a.yearsAgo)}: `), link(a.entry)))));
}
