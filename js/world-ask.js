// Ask the GM: a private thread between each player and the world's GMs, for questions between sessions (rules,
// backstory, plans to keep from the table). Routes: #world/ask (a player's thread, or the GMs' list of players),
// #world/ask/<playerId> (GMs: one player's thread), #world/ask/about/<entryId> (a player asking about an entry).
import { el, toast, confirmButton, setKids } from './dom.js';
import { api, isGm, isMember, session } from './api.js';
import { world, getEntry, whenTime, richText, notice } from './world-store.js';
import { stripMarks } from './rich.js';

const setUnread = (n) => { if (typeof n === 'number') { world.info = { ...world.info, ask_unread: n }; window.dispatchEvent(new CustomEvent('world:ask', { detail: { more: false } })); } };

// The sidebar link: "Ask the GM" for players, "Player questions" for GMs, with what's waiting.
export function askNav() {
  if (!isMember()) return null;
  const n = world.info?.ask_unread || 0;
  return el('a', { href: '#world/ask', 'data-view': 'ask' }, el('span', {}, isGm() ? 'Player questions' : 'Ask the GM'),
    el('span', { class: `count${n ? ' new' : ''}` }, n ? `${n} new` : ''));
}

// On an entry page, for players: ask about this.
export const askAboutLink = (e) => (isMember() && !isGm() ? el('a', { class: 'btn small ghost', href: `#world/ask/about/${e.id}` }, 'Ask the GM about this') : null);

function thread(messages, me, playerName, reload) {
  if (!messages.length) return el('p', { class: 'muted' }, isGm() ? `Nothing yet. Write to ${playerName} below; only they and the GMs see it.` : 'Nothing yet. Ask below: only you and the GMs see it.');
  return el('ol', { class: 'plain ask-thread' }, messages.map((m) => el('li', { class: `ask-msg${m.from_gm ? ' from-gm' : ''}${m.gm_id === me ? ' mine' : ''}` },
    el('div', { class: 'ask-meta small' }, el('strong', {}, m.gm_id === me ? 'You' : m.by || (m.from_gm ? 'A GM' : playerName)), m.from_gm && m.gm_id !== me ? ' (GM)' : '', ` · ${whenTime(m.created_at)}`,
      !isGm() && m.from_gm && !m.seen ? el('span', { class: 'tag' }, 'new') : null),
    el('div', { class: 'ask-body' }, richText(m.body)),
    m.gm_id === me ? confirmButton('Take back', async () => { try { await api('party', { method: 'DELETE', query: { ask: m.id } }); reload(); } catch (err) { toast(err.message, 'bad'); } }) : null)));
}

function composer(player, about, reload) {
  const ta = el('textarea', { id: 'ask-text', rows: 4, maxlength: 4000, placeholder: isGm() ? 'Your answer, a hint, or a question back' : 'e.g. Could my character have grown up in [[Brindle]]?' }, about ? `About [[${about.name}]]: ` : '');
  const status = el('p', { class: 'form-status', role: 'status' });
  const f = el('form', { class: 'ask-form' }, el('label', { for: 'ask-text' }, isGm() ? 'Reply' : 'Ask the GMs'), ta,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Send'), status));
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!ta.value.trim()) { ta.focus(); return; }
    status.textContent = 'Sending…'; status.className = 'form-status';
    try { await api('party', { method: 'POST', body: { ask: { body: ta.value, ...(player ? { player } : {}) } } }); ta.value = ''; status.textContent = ''; toast(isGm() ? 'Sent' : 'Sent to the GMs'); reload(); }
    catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return f;
}

async function playerList() {
  const box = el('div');
  const r = await api('party', { query: { ask: 1 } });
  setKids(box, r.players.length ? el('ul', { class: 'plain ask-players' }, r.players.map((p) => el('li', { class: 'card' },
    el('a', { href: `#world/ask/${p.id}` }, el('strong', {}, p.name)), p.unread ? el('span', { class: 'tag new' }, `${p.unread} new`) : null,
    p.last ? el('p', { class: 'muted small' }, `${p.last.from_gm ? 'GMs: ' : ''}${(() => { const s = stripMarks(p.last.body).replace(/\s+/g, ' '); return s.length > 120 ? `${s.slice(0, 119)}…` : s; })()} · ${whenTime(p.last.created_at)}`)
      : el('p', { class: 'muted small' }, 'No messages yet.')))) : notice('No players yet', 'Invite players to the world and their questions arrive here.'));
  return box;
}

export async function viewAsk(arg, third) {
  if (!isMember()) return notice('Members only', 'Sign in to this world to ask its GMs something.');
  const head = (title, sub, back) => el('div', { class: 'panel-head' }, back ? el('p', { class: 'small' }, el('a', { href: '#world/ask' }, '← All players')) : null, el('h2', {}, title), el('p', {}, sub));
  try {
    if (isGm() && !arg) {
      return el('div', { class: 'w-view ask-view' }, head('Player questions', 'Each player’s private thread with the GMs: questions between sessions, backstory, plans they want kept from the table. Only that player and the GMs see it.'), await playerList());
    }
    const playerId = isGm() ? Number(arg) : null;
    const about = !isGm() && arg === 'about' ? getEntry(third) : null;
    const box = el('div');
    let name = 'the player';
    const load = async () => {
      const r = await api('party', { query: { ask: 1, ...(playerId ? { player: playerId } : {}) } });
      if (isGm()) setUnread(r.unread); else setUnread(0);
      setKids(box, thread(r.messages, r.me ?? session.gm?.id, name, load));
      box.lastElementChild?.lastElementChild?.scrollIntoView?.({ block: 'nearest' });
    };
    if (playerId) {
      const members = (await api('party', { query: { members: 1 } })).members || [];
      name = members.find((m) => m.id === playerId)?.name || 'the player';
    }
    await load();
    // A new answer or question arriving while this page is open shows straight away.
    const onAsk = (ev) => { if (!box.isConnected) { window.removeEventListener('world:ask', onAsk); return; } if (ev.detail?.more) load(); };
    window.addEventListener('world:ask', onAsk);
    return el('div', { class: 'w-view ask-view' },
      isGm() ? head(`Questions from ${name}`, `Only ${name} and the GMs see this thread.`, true) : head('Ask the GM', 'Questions between sessions: rules, your backstory, plans you’d rather keep from the table. Only you and the GMs see this.'),
      box, composer(playerId, about, load));
  } catch (err) { return notice('Couldn’t load the questions', err.message); }
}
