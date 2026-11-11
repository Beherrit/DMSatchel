// The session timer: the GM starts it when play begins and stops it at the end; it can save how long the session ran
// to the latest session's log, and suggests a break every ninety minutes. Kept in this browser (per world).
import { el, toast } from './dom.js';
import { session } from './api.js';
import { worldEntries, patchEntry, link } from './world-store.js';
import { sessionOrder } from './appearances.js';
import { lengthText, breakDue } from './session-timer.js';

const key = () => `dms-timer:${session.worldKey || 'world'}`;
const read = () => { try { return JSON.parse(localStorage.getItem(key()) || 'null'); } catch { return null; } };
const write = (v) => { try { if (v) localStorage.setItem(key(), JSON.stringify(v)); else localStorage.removeItem(key()); } catch { /* storage blocked */ } };
const elapsed = (t) => Math.floor((Date.now() - t.start) / 60000);

let tick = null;
export function timerCard(rerender) {
  const t = read();
  const box = el('section', { class: 'card session-timer' });
  const draw = () => {
    const cur = read();
    if (!cur) {
      box.replaceChildren(el('div', { class: 'entry-head' }, el('h3', {}, '⏱ Session timer'),
        el('button', { class: 'btn small primary timer-start', type: 'button', onclick: () => { write({ start: Date.now() }); draw(); box.startTick(); } }, 'Start the timer')),
        el('p', { class: 'muted small' }, 'Start it when play begins; it suggests a break every ninety minutes and can save how long the session ran.'));
      return;
    }
    const m = elapsed(cur), b = breakDue(m, 90, cur.breakAt || 0);
    const last = sessionOrder(worldEntries())[0];
    box.replaceChildren(el('div', { class: 'entry-head' }, el('h3', {}, '⏱ Session timer'), el('span', { class: 'timer-elapsed' }, lengthText(m))),
      // Time for a break: every ninety minutes of play, until dismissed.
      b.due ? el('p', { class: 'small timer-break' }, `☕ ${lengthText(Math.floor(m / 90) * 90)} in: time for a short break? `, el('button', { class: 'btn small ghost', type: 'button', onclick: () => { write({ ...cur, breakAt: Math.floor(m / 90) * 90 }); draw(); } }, 'Done')) : el('p', { class: 'muted small' }, `Next break at ${lengthText(b.next)}.`),
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn small timer-stop', type: 'button', onclick: async () => {
          const mins = elapsed(cur); write(null);
          if (last && confirm(`Stop at ${lengthText(mins)} and save that as how long ${last.name} ran?`)) {
            try { await patchEntry(last, { fields: { length: lengthText(mins) } }); toast(`${last.name} ran ${lengthText(mins)}`); } catch (err) { toast(err.message, 'bad'); }
          } else toast(`Stopped at ${lengthText(mins)}`);
          rerender();
        } }, last ? `Stop and save to ${last.name}` : 'Stop'),
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => { write(null); draw(); } }, 'Reset')));
  };
  const startTick = () => { clearInterval(tick); tick = setInterval(() => { if (!box.isConnected || !read()) { clearInterval(tick); tick = null; return; } draw(); }, 30000); };
  box.startTick = startTick;
  draw();
  if (t) startTick();
  return box;
}
