// Next session: a GM proposes a few dates, everyone answers yes / maybe / no, the best date stands out, and a GM
// locks one in (it shows on the world home) and can post the poll or the date to Discord.
// Route: #world/schedule
import { el, toast, confirmButton, setKids, download } from './dom.js';
import { api, isGm, isMember } from './api.js';
import { world, notice } from './world-store.js';
import { tally, dateText, untilText, ANSWERS, MAX_DATES } from './schedule.js';
import { sessionIcs, googleCalendarUrl } from './ics.js';

const LABEL = { yes: 'Yes', maybe: 'Maybe', no: 'No' };
const pad = (n) => String(n).padStart(2, '0');
// A datetime-local value for a Date, in the browser's own time zone.
const localValue = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// "Next session: Saturday 14 November, 7:00 pm (in 3 days)" for the world home, or null when nothing's set.
export function nextSessionLine() {
  const at = world.info?.next_session;
  if (!at || Date.parse(at) < Date.now() - 86400000) return null;
  return el('p', { class: 'today-line next-session' }, el('a', { href: '#world/schedule' }, `🗓 Next session: ${dateText(at)} (${untilText(at)})`), ' ', addToCalendar(at));
}

// "Add to calendar": an .ics file (Apple, Outlook and most others) or a Google Calendar link, named for the world and
// linking back to it.
function addToCalendar(at) {
  const name = world.info?.name || 'Our game';
  const back = `${location.origin}/?w=${encodeURIComponent(world.info?.slug || '')}#world`;
  const ev = { start: at, title: `${name}: next session`, url: back, description: 'The table meets again. Session notes and prep are in the DM’s Satchel.' };
  const box = el('details', { class: 'add-cal' }, el('summary', {}, 'Add to calendar'),
    el('span', { class: 'add-cal-links' },
      el('button', { class: 'linkish', type: 'button', onclick: () => download(`${(world.info?.slug || 'session')}-next-session.ics`, sessionIcs({ ...ev, uid: `${world.info?.id || 'world'}-${Date.parse(at)}@dmsatchel` }), 'text/calendar') }, 'Calendar file (.ics)'),
      ' · ', el('a', { href: googleCalendarUrl(ev), target: '_blank', rel: 'noopener noreferrer' }, 'Google Calendar', el('span', { class: 'sr-only' }, ' (opens in a new tab)'))));
  return box;
}

function proposeForm(after) {
  const rows = el('div', { class: 'sched-dates' });
  // Start with the next three Saturdays at 7 pm as a suggestion.
  const sat = new Date(); sat.setHours(19, 0, 0, 0); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
  const addRow = (d) => {
    if (rows.children.length >= MAX_DATES) return;
    const n = rows.children.length + 1;
    const input = el('input', { type: 'datetime-local', 'aria-label': `Date ${n}`, value: d ? localValue(d) : '' });
    rows.append(el('div', { class: 'sched-date-row' }, input, el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove date ${n}`, onclick: (ev) => ev.target.closest('.sched-date-row').remove() }, '✕')));
  };
  for (let i = 0; i < 3; i++) addRow(new Date(sat.getTime() + i * 7 * 86400000));
  const title = el('input', { type: 'text', id: 'sched-title', placeholder: 'e.g. Session 12', maxlength: 120 });
  const note = el('textarea', { id: 'sched-note', rows: 2, placeholder: 'Anything to know: where, how long, who’s hosting…' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const form = el('form', { class: 'card edit-form sched-form' },
    el('h3', {}, 'Propose dates'),
    el('div', { class: 'field' }, el('label', { for: 'sched-title' }, 'Title'), title),
    el('div', { class: 'field wide' }, el('span', { class: 'label' }, 'Dates and times (in your time zone; everyone sees them in theirs)'), rows,
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => addRow() }, '+ Another date')),
    el('div', { class: 'field wide' }, el('label', { for: 'sched-note' }, 'Note'), note),
    status, el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Ask everyone')));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dates = [...rows.querySelectorAll('input')].map((i) => i.value).filter(Boolean).map((v) => new Date(v).toISOString());
    if (!dates.length) { status.textContent = 'Add at least one date and time.'; status.className = 'form-status error'; return; }
    try {
      await api('party', { method: 'POST', body: { schedule: { title: title.value.trim(), note: note.value.trim(), dates } } });
      toast('Dates proposed: everyone can answer now');
      after();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

function pollCard(poll, ctx) {
  const box = el('article', { class: `card sched-poll${poll.closed ? ' is-closed' : ''}` });
  const draw = () => {
    const t = tally(poll, ctx.members.map((m) => m.id));
    const mine = [...(poll.votes[ctx.me] || [])];
    const who = (ids) => ids.map((id) => ctx.names.get(String(id)) || 'Someone').join(', ');
    const vote = async (i, a) => {
      mine[i] = mine[i] === a ? '' : a;
      try { poll = (await api('party', { method: 'PATCH', body: { schedule_id: poll.id, vote: poll.dates.map((_, j) => mine[j] || '') } })).poll; draw(); }
      catch (err) { toast(err.message, 'bad'); }
    };
    const act = async (body, msg) => {
      try {
        const r = await api('party', { method: 'PATCH', body: { schedule_id: poll.id, ...body } });
        if (r.poll) poll = r.poll;
        if ('lock' in body && world.info) world.info.next_session = r.next_session;
        if (msg) toast(msg);
        ctx.changed();
      } catch (err) { toast(err.message, 'bad'); }
    };
    setKids(box,
      el('div', { class: 'entry-head' }, el('h3', {}, poll.title || 'When can we play?'),
        poll.closed ? el('span', { class: 'tag' }, 'Closed') : poll.locked !== null ? el('span', { class: 'tag sched-locked-tag' }, 'Date locked in') : null),
      poll.note ? el('p', {}, poll.note) : null,
      el('div', { class: 'table-wrap' }, el('table', { class: 'sched-table' },
        el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Date'), el('th', { scope: 'col' }, poll.closed ? 'Your answer' : 'Can you make it?'), el('th', { scope: 'col' }, 'Answers'), isGm() && !poll.closed ? el('th', { scope: 'col' }, el('span', { class: 'sr-only' }, 'Lock in')) : null)),
        el('tbody', {}, t.rows.map((r) => el('tr', { class: [r.i === t.best ? 'best' : '', poll.locked === r.i ? 'locked' : ''].filter(Boolean).join(' ') },
          el('td', {}, el('strong', {}, dateText(r.at)), el('div', { class: 'muted small' }, untilText(r.at),
            poll.locked === r.i ? ' · 🔒 locked in' : r.i === t.best && poll.locked === null ? ' · ★ best so far' : '')),
          el('td', {}, poll.closed ? (LABEL[mine[r.i]] || '—') : el('div', { class: 'seg', role: 'group', 'aria-label': `Your answer for ${dateText(r.at, { short: true })}` },
            ANSWERS.map((a) => el('button', { type: 'button', class: `seg-btn ans-${a}`, 'aria-pressed': String(mine[r.i] === a), onclick: () => vote(r.i, a) }, LABEL[a])))),
          el('td', { class: 'small' }, el('div', {}, `${r.yes.length} yes · ${r.maybe.length} maybe · ${r.no.length} no`),
            r.yes.length ? el('div', { class: 'muted' }, `Yes: ${who(r.yes)}`) : null, r.maybe.length ? el('div', { class: 'muted' }, `Maybe: ${who(r.maybe)}`) : null,
            r.no.length ? el('div', { class: 'muted' }, `Can’t: ${who(r.no)}`) : null),
          isGm() && !poll.closed ? el('td', {}, poll.locked === r.i
            ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => act({ lock: null }, 'Unlocked') }, 'Unlock')
            : el('button', { class: 'btn small', type: 'button', onclick: () => act({ lock: r.i }, 'Locked in: it shows on the world home') }, 'Lock in')) : null))))),
      t.missing.length && !poll.closed ? el('p', { class: 'muted small' }, `Still to answer: ${who(t.missing)}`) : null,
      isGm() ? el('div', { class: 'btnrow' },
        world.info?.discord ? el('button', { class: 'btn small', type: 'button', onclick: () => act({ post: true }, 'Posted to Discord') }, poll.locked !== null ? 'Post the date to Discord' : 'Post to Discord') : null,
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => act({ closed: !poll.closed }) }, poll.closed ? 'Reopen' : 'Close'),
        confirmButton('Delete', async () => { try { await api('party', { method: 'DELETE', query: { schedule: poll.id } }); ctx.changed(); } catch (err) { toast(err.message, 'bad'); } })) : null);
  };
  draw();
  return box;
}

export async function viewSchedule(rerender) {
  if (!isMember()) return notice('Members only', 'Join this world to see and answer the session schedule.');
  const body = el('div');
  const load = async () => {
    let r;
    try { r = await api('party', { query: { schedule: 1 } }); } catch (err) { setKids(body, notice('Couldn’t load the schedule', err.message)); return; }
    if (world.info) world.info.next_session = r.next_session;
    const ctx = { members: r.members, names: new Map(r.members.map((m) => [String(m.id), m.name])), me: String(r.me), changed: () => load() };
    const open = r.polls.filter((p) => !p.closed), closed = r.polls.filter((p) => p.closed);
    setKids(body,
      nextSessionLine(),
      open.length ? open.map((p) => pollCard(p, ctx)) : notice('No dates proposed', isGm() ? 'Propose a few dates below and everyone in the world can say which work.' : 'When a GM proposes dates, you can say which work for you here.'),
      isGm() ? proposeForm(load) : null,
      closed.length ? el('details', { class: 'card' }, el('summary', {}, `Past polls (${closed.length})`), closed.map((p) => pollCard(p, ctx))) : null);
  };
  await load();
  return el('div', { class: 'w-view schedule-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Next session'), el('p', {}, 'Find a date that works: GMs propose a few, everyone answers, and the best one stands out.')),
    body);
}
