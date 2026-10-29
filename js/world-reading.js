// Reading for next session: GMs pick a few entries (in session prep) for players to read before the table meets.
// Players see the list on the front page, ticked as they read (opening the entry counts, or "Mark as read"); GMs see
// who has read each one.
import { el, toast, setKids } from './dom.js';
import { api, isGm, isPlayer, previewing } from './api.js';
import { world, getEntry, link, kindLabel, findByName, nameList } from './world-store.js';
import { MAX_READING } from './reading.js';

const list = () => (Array.isArray(world.info?.reading) ? world.info.reading : []).filter((r) => getEntry(r.id));

// A player opened an entry: if it's on the list and not yet read, tell the server and tick it here.
export function noteReading(e) {
  if (!isPlayer() || previewing()) return;
  const item = list().find((r) => r.id === e?.id);
  if (!item || item.read) return;
  item.read = true;
  api('party', { method: 'POST', body: { read: e.id } }).catch(() => { item.read = false; });
}

// On the front page, for members.
export function readingCard() {
  const items = list();
  if (!items.length || (!isGm() && !isPlayer())) return null;
  const gm = isGm();
  const box = el('section', { class: 'card reading-card', 'aria-labelledby': 'rd-h' });
  const draw = () => setKids(box,
    el('h3', { id: 'rd-h' }, '📚 Reading for next session'),
    gm ? null : el('p', { class: 'muted small' }, items.some((r) => !r.read) ? `The GMs would like you to read ${items.length === 1 ? 'this' : 'these'} before the next session.` : 'All read. Thank you!'),
    el('ul', { class: 'plain reading-list' }, items.map((r) => {
      const e = getEntry(r.id);
      return el('li', { class: r.read ? 'done' : '' },
        gm ? null : el('span', { class: 'reading-tick', 'aria-hidden': 'true' }, r.read ? '✓' : '○'),
        link(e), el('span', { class: 'kind-tag' }, kindLabel(e.kind)),
        gm ? el('span', { class: 'muted small' }, r.read_by?.length ? `read by ${r.read_by.join(', ')}` : 'no one yet')
          : r.read ? el('span', { class: 'sr-only' }, ' (read)')
            : el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Mark ${e.name} as read`, onclick: () => { noteReading(e); draw(); } }, 'Mark as read'));
    })),
    gm ? el('a', { class: 'small', href: '#world/prep' }, 'Change the list in session prep') : null);
  draw();
  return box;
}

// In session prep, for GMs: add, remove and clear.
export function readingPrepCard() {
  const box = el('section', { class: 'card prep-card reading-prep' });
  const save = async (ids) => {
    try {
      const r = await api('settings', { method: 'PATCH', body: { reading: ids } });
      const old = new Map(list().map((x) => [x.id, x]));
      world.info = { ...world.info, reading: r.reading.map((id) => old.get(id) || { id, read_by: [] }) };
      draw();
    } catch (err) { toast(err.message, 'bad'); }
  };
  const input = el('input', { type: 'text', list: 'rd-names', placeholder: 'Name of an entry', 'aria-label': 'Add an entry to the reading list' });
  const form = el('form', { class: 'ck-add controls' }, input, nameList('rd-names'), el('button', { class: 'btn small', type: 'submit' }, 'Add'));
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const e = findByName(input.value);
    if (!e) { toast('No entry by that name', 'bad'); input.focus(); return; }
    if (list().length >= MAX_READING) { toast(`Keep it short: at most ${MAX_READING}`, 'bad'); return; }
    save([...list().map((r) => r.id), e.id]).then(() => { input.value = ''; input.focus(); });
  });
  function draw() {
    const items = list();
    setKids(box, el('h3', {}, '📚 Reading for next session'),
      items.length ? el('ul', { class: 'plain ck-list' }, items.map((r) => {
        const e = getEntry(r.id);
        return el('li', {}, link(e), el('span', { class: 'muted small' }, ` ${r.read_by?.length ? `read by ${r.read_by.join(', ')}` : 'no one yet'}`),
          el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Take ${e.name} off the list`, onclick: () => save(items.filter((x) => x.id !== r.id).map((x) => x.id)) }, '✕'));
      })) : el('p', { class: 'muted small' }, 'A few entries for players to read before the table meets: the town they’re heading for, a letter, the lore of a ruin. They’ll see the list on the front page.'),
      form,
      items.length ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => save([]) }, 'Clear the list') : null);
  }
  draw();
  return box;
}
