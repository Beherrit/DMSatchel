// The party's standing with factions, guilds, clans, gods, towns and people.
import { el, toast, confirmButton } from './dom.js';
import { api, isGm } from './api.js';
import { KINDS, STANDING_KINDS, standingLabel } from './world-schema.js';
import { world, worldEntries, getEntry, link, when, notice, byName } from './world-store.js';

const current = (id) => world.standings?.current?.[id];
const logFor = (id) => (world.standings?.log || []).filter((r) => r.entry_id === id);

export function meter(value, compact) {
  const v = Math.max(-5, Math.min(5, value ?? 0));
  const tone = v <= -3 ? 'bad' : v < 0 ? 'warn' : v === 0 ? 'neutral' : v < 3 ? 'ok' : 'good';
  return el('div', { class: `meter ${compact ? 'compact' : ''} tone-${tone}`, role: 'meter', 'aria-valuemin': '-5', 'aria-valuemax': '5', 'aria-valuenow': String(v), 'aria-label': `Standing ${v}: ${standingLabel(v)}` },
    el('div', { class: 'meter-track' }, Array.from({ length: 11 }, (_, i) => el('span', { class: `tick${i - 5 === 0 ? ' zero' : ''}` })), el('span', { class: 'meter-mark', style: `left:${((v + 5) / 10) * 100}%` })),
    el('div', { class: 'meter-label' }, el('strong', {}, standingLabel(v)), el('span', { class: 'meter-num' }, v > 0 ? `+${v}` : String(v))));
}

async function refresh() {
  try { world.standings = await api('standings'); } catch { /* keep what we have */ }
}

function sessionOptions() {
  return worldEntries().filter((e) => e.kind === 'session').sort((a, b) => (parseFloat(b.fields.number) || 0) - (parseFloat(a.fields.number) || 0))
    .map((s) => el('option', { value: s.id }, s.name));
}

function logList(rows, withEntry) {
  return el('ul', { class: 'standing-log' }, rows.map((r) => {
    const e = getEntry(r.entry_id), s = r.session_id && getEntry(r.session_id);
    return el('li', {},
      el('span', { class: `delta ${r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : ''}` }, r.delta > 0 ? `▲ ${r.delta}` : r.delta < 0 ? `▼ ${-r.delta}` : '•'),
      el('div', {}, withEntry && e ? [link(e), ' '] : null, el('span', {}, `${standingLabel(r.value)} (${r.value > 0 ? '+' : ''}${r.value})`), r.reason ? el('span', { class: 'muted' }, ` — ${r.reason}`) : null,
        el('div', { class: 'muted small' }, [when(r.at), r.gm].filter(Boolean).join(' · '), s ? [' · ', link(s)] : null, r.secret ? el('span', { class: 'tag' }, 'GM only') : null)),
      isGm() ? confirmButton('Undo', async () => {
        try { await api('standings', { method: 'DELETE', query: { id: r.id } }); await refresh(); toast('Change removed'); window.dispatchEvent(new HashChangeEvent('hashchange')); }
        catch (err) { toast(err.message, 'bad'); }
      }) : null);
  }));
}

export function standingWidget(e) {
  const cur = current(e.id);
  const box = el('section', { class: 'standing card' },
    el('div', { class: 'entry-head' }, el('h3', {}, 'Party standing'), cur ? el('span', { class: 'muted small' }, `since ${when(cur.at)}`) : null),
    meter(cur?.value ?? 0));
  const rows = logFor(e.id).slice(0, 6);
  if (rows.length) box.append(logList(rows));
  if (isGm()) {
    const slider = el('input', { type: 'range', min: '-5', max: '5', step: '1', value: String(cur?.value ?? 0), id: `st-${e.id}`, 'aria-label': 'New standing' });
    const out = el('output', { for: `st-${e.id}`, class: 'meter-num' });
    const sync = () => { const v = +slider.value; out.textContent = `${v > 0 ? '+' : ''}${v} ${standingLabel(v)}`; };
    slider.addEventListener('input', sync); sync();
    const sess = el('select', { 'aria-label': 'Session' }, el('option', { value: '' }, 'No session'), sessionOptions());
    const reason = el('input', { type: 'text', placeholder: 'Why? e.g. returned the stolen ledger', 'aria-label': 'Reason' });
    const secret = el('input', { type: 'checkbox' });
    const form = el('form', { class: 'standing-form' },
      el('div', { class: 'slider-row' }, el('span', { class: 'muted small' }, 'Hostile'), slider, el('span', { class: 'muted small' }, 'Allied'), out),
      el('div', { class: 'controls' }, el('div', { class: 'field grow' }, reason), sess, el('label', { class: 'check' }, secret, ' GM only'), el('button', { class: 'btn small primary', type: 'submit' }, 'Record change')));
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try {
        await api('standings', { method: 'POST', body: { entry_id: e.id, value: +slider.value, reason: reason.value, session_id: sess.value || null, secret: secret.checked } });
        await refresh(); toast('Standing recorded'); window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (err) { toast(err.message, 'bad'); }
    });
    box.append(el('details', {}, el('summary', {}, 'Change standing'), form));
  }
  return box;
}

export function viewStandings() {
  const entries = worldEntries().filter((e) => STANDING_KINDS.includes(e.kind));
  const tracked = entries.filter((e) => current(e.id)).sort((a, b) => current(b.id).value - current(a.id).value || byName(a, b));
  const groups = STANDING_KINDS.map((k) => [k, tracked.filter((e) => e.kind === k)]).filter(([, l]) => l.length);
  const recent = (world.standings?.log || []).slice(0, 15);
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Party standing'), el('p', {}, 'How every faction, guild, house, god, town and person feels about the party right now, from sworn enemies to champions. GMs change it from each entry’s page.')),
    tracked.length ? groups.map(([k, list]) => el('section', {}, el('h3', { class: 'section-title' }, KINDS[k].plural),
      el('ul', { class: 'standing-board' }, list.map((e) => el('li', { class: 'card' }, el('div', { class: 'entry-head' }, link(e), el('span', { class: 'muted small' }, when(current(e.id).at))), meter(current(e.id).value, true))))))
      : notice('Nobody is tracked yet', isGm() ? 'Open any faction, guild, clan, deity, settlement or NPC and use “Change standing”.' : 'The GMs haven’t recorded the party’s standing with anyone yet.'),
    recent.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Recent changes'), logList(recent, true)) : null,
    tracked.length && isGm() ? el('p', { class: 'muted small' }, `Untracked: ${entries.filter((e) => !current(e.id)).length} more ${entries.length - tracked.length === 1 ? 'entry' : 'entries'} could be tracked.`) : null);
}
