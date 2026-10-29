// The quote wall: memorable lines from the table, with who said them and in which session. Route: #world/quotes.
// A random one greets members on the world's front page.
import { el, toast, confirmButton, setKids } from './dom.js';
import { api, isGm, isMember, session } from './api.js';
import { world, worldEntries, getEntry, link, when, notice } from './world-store.js';
import { sessionOrder } from './appearances.js';
import { quotedMost } from './quotes.js';
import { reactionBar } from './world-react.js';

const saidLine = (q) => [q.said_by ? `— ${q.said_by}` : '— someone at the table', getEntry(q.session_id) ? [', ', link(getEntry(q.session_id))] : null];

// The front page: one line from the wall.
export function quoteCard() {
  const q = world.info?.quote;
  if (!isMember() || !q) return null;
  return el('figure', { class: 'card quote-card' }, el('blockquote', {}, `“${q.text}”`), el('figcaption', { class: 'small' }, saidLine(q), ' · ', el('a', { href: '#world/quotes' }, 'The quote wall')));
}

function addForm(onAdd) {
  const sessions = sessionOrder(worldEntries());
  const names = [...new Set([...worldEntries().filter((e) => e.kind === 'character').map((e) => e.name), ...worldEntries().filter((e) => e.kind === 'npc' && (e.tags || []).includes('key')).map((e) => e.name), session.gm?.name].filter(Boolean))];
  const text = el('textarea', { id: 'qt-text', rows: 2, maxlength: 500, placeholder: 'I lick the door.', required: true });
  const who = el('input', { type: 'text', id: 'qt-who', list: 'qt-names', maxlength: 80, placeholder: 'A character, a player or an NPC' });
  const sess = el('select', { id: 'qt-session' }, el('option', { value: '' }, 'No particular session'), sessions.map((s) => el('option', { value: s.id }, s.name)));
  if (sessions[0]) sess.value = sessions[0].id;
  const status = el('p', { class: 'form-status', role: 'status' });
  const f = el('form', { class: 'card qt-form' }, el('h3', {}, 'Add a quote'),
    el('div', { class: 'field' }, el('label', { for: 'qt-text' }, 'What was said'), text),
    el('div', { class: 'qt-row' }, el('div', { class: 'field' }, el('label', { for: 'qt-who' }, 'Who said it'), who, el('datalist', { id: 'qt-names' }, names.map((n) => el('option', { value: n })))),
      el('div', { class: 'field' }, el('label', { for: 'qt-session' }, 'When'), sess)),
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Add to the wall'), status));
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try {
      const r = await api('party', { method: 'POST', body: { quote: { text: text.value, said_by: who.value, session_id: sess.value || null } } });
      // The world's first quote goes straight on the front page (later ones take turns at random).
      if (!world.info?.quote) world.info = { ...world.info, quote: r.quote };
      text.value = ''; who.value = ''; status.textContent = ''; toast('On the wall'); onAdd();
    }
    catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return f;
}

export async function viewQuotes() {
  if (!isMember()) return notice('Members only', 'The quote wall is for the people at this table.');
  const box = el('div');
  let quotes = [], only = '';
  const draw = () => {
    const most = quotedMost(quotes);
    const shown = only ? quotes.filter((q) => q.said_by.trim().toLowerCase() === only) : quotes;
    setKids(box,
      most.length > 1 ? el('div', { class: 'qt-people', role: 'group', 'aria-label': 'Show quotes by' },
        el('button', { class: 'btn small', type: 'button', 'aria-pressed': String(!only), onclick: () => { only = ''; draw(); } }, `Everyone (${quotes.length})`),
        most.map(([n, c]) => el('button', { class: 'btn small', type: 'button', 'aria-pressed': String(only === n.toLowerCase()), onclick: () => { only = n.toLowerCase(); draw(); } }, `${n} (${c})`))) : null,
      shown.length ? el('ul', { class: 'plain qt-list' }, shown.map((q) => el('li', {}, el('figure', { class: 'card quote-card' },
        el('blockquote', {}, `“${q.text}”`),
        el('figcaption', { class: 'small' }, saidLine(q), el('span', { class: 'muted' }, ` · added by ${q.added_by || 'someone'}, ${when(q.created_at)}`)),
        reactionBar(q.reactions, async (react, on) => { const r = (await api('party', { method: 'PATCH', body: { quote_id: q.id, react, on } })).reactions; q.reactions = r; return r; }),
        q.gm_id === session.gm?.id || isGm() ? confirmButton('Take down', async () => { try { await api('party', { method: 'DELETE', query: { quote: q.id } }); await load(); } catch (err) { toast(err.message, 'bad'); } }) : null))))
        : notice('Nothing on the wall yet', 'When someone says something worth remembering, put it here.'));
  };
  const load = async () => { quotes = (await api('party', { query: { quotes: 1 } })).quotes; draw(); };
  try { await load(); } catch (err) { return notice('Couldn’t load the quotes', err.message); }
  return el('div', { class: 'w-view quotes-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'The quote wall'), el('p', {}, 'Memorable lines from the table. A random one greets everyone on the world’s front page.')),
    addForm(load), box);
}
