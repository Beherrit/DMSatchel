// Keep going offline: character sheet changes and private notes made without a connection wait in this browser's
// outbox and are sent when the connection comes back (checked on reconnecting and every 20 seconds). A small marker
// says how many are waiting. Only the latest change to each sheet or note is kept.
import { el, toast } from './dom.js';
import { api, session } from './api.js';
import { enqueue, remove, isOffline } from './outbox-core.js';

const KEY = 'satchel-outbox';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const write = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private window: kept for this page only */ } memory = list; };
let memory = null, sending = false;
const list = () => memory ?? (memory = read());

export { isOffline };
export const waiting = () => list().length;

function pill() {
  let p = document.getElementById('outbox-pill');
  const n = waiting();
  if (!n) { p?.remove(); return; }
  if (!p) { p = el('div', { id: 'outbox-pill', class: 'outbox-pill', role: 'status' }); document.body.append(p); }
  p.textContent = `⏳ ${n} change${n === 1 ? '' : 's'} waiting to send`;
  p.title = 'You seem to be offline. Your changes are kept on this device and sent when the connection is back.';
}

export function queuePlay(id, play) { write(enqueue(list(), { world: session.worldKey, kind: 'play', id, data: play })); pill(); }
export function queueNote(entryId, body) { write(enqueue(list(), { world: session.worldKey, kind: 'note', id: entryId, data: body })); pill(); }

async function sendOne(item) {
  const query = { world: item.world };
  if (item.kind === 'note') { await api('comments', { method: 'PUT', query, body: { entry_id: item.id, body: item.data } }); return; }
  // A sheet: put the waiting play state onto the entry as it is now (the sheet's own last change wins).
  for (let attempt = 0; attempt < 2; attempt++) {
    const { entry } = await api('entries', { query: { ...query, id: item.id } });
    try { await api('entries', { method: 'PUT', query: { ...query, id: item.id }, body: { entry: { ...entry, fields: { ...entry.fields, play: JSON.stringify(item.data) } } } }); return; }
    catch (err) { if (err.status !== 409 || attempt) throw err; }
  }
}

export async function flush() {
  if (sending || !waiting()) return;
  sending = true;
  let sent = 0;
  try {
    for (const item of [...list()]) {
      try { await sendOne(item); write(remove(list(), item.key)); sent++; }
      catch (err) {
        if (isOffline(err)) break; // still offline: try again later
        write(remove(list(), item.key)); toast(`A change made offline couldn’t be saved: ${err.message}`, 'bad'); // the server said no; don't retry forever
      }
    }
  } finally { sending = false; pill(); }
  if (sent) { toast(`Back online: sent ${sent} change${sent === 1 ? '' : 's'} made offline`); window.dispatchEvent(new Event('world:rerender')); }
}

export function initOutbox() {
  pill();
  addEventListener('online', flush);
  setInterval(() => { if (waiting() && navigator.onLine !== false) flush(); }, 20000);
  flush();
}
