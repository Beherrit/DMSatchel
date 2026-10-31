// "Draft recap": gathers what changed since the last session and opens it as a new session-log entry to edit.
import { el, toast } from './dom.js';
import { api, isGm, session } from './api.js';
import { worldEntries } from './world-store.js';
import { KINDS } from './world-schema.js';
import { worldCalendar, todayText } from './world-calendar.js';
import { buildRecap, lastSession } from './recap.js';

export async function draftRecap() {
  const last = lastSession(worldEntries());
  const since = last ? new Date(last.created_at).toISOString() : null;
  const [act, party, standings] = await Promise.allSettled([api('activity', { query: since ? { since } : {} }), api('party'), api('standings')]);
  const r = buildRecap({
    entries: worldEntries(), activity: act.value?.activity || [], ledger: party.value?.lines || [], standings: standings.value || {},
    labels: Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.label])), today: new Date().toISOString().slice(0, 10), worldDate: worldCalendar() ? todayText() : '', cal: worldCalendar(),
  });
  const { since: _s, counts, ...draft } = r;
  draft.fields.gm = session.gm?.name || '';
  const n = Object.values(counts).reduce((t, x) => t + x, 0);
  toast(n ? `Drafted from ${n} change${n === 1 ? '' : 's'}${last ? ` since ${last.name}` : ''}: write the story, then save` : 'Nothing changed since the last session yet: the draft is just the outline');
  window.dispatchEvent(new CustomEvent('world:draft', { detail: draft }));
}

export const recapButton = (cls = 'btn small') => (isGm() ? el('button', { class: cls, type: 'button', title: 'A new session-log entry, filled in from what changed since the last one', onclick: async (ev) => {
  ev.target.disabled = true;
  try { await draftRecap(); } catch (err) { toast(err.message, 'bad'); } finally { ev.target.disabled = false; }
} }, 'Draft recap') : null);
