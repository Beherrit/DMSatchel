// Comments on entries, in two rooms: GM discussion (GMs only, with resolvable threads) and table talk
// (players and GMs together; GMs can hide or delete). Also the GM inbox (#world/talk) and the table talk
// feed (#world/table).
import { el, toast, confirmButton, setKids } from './dom.js';
import { api, session, isGm, isMember, isOwner } from './api.js';
import { getEntry, link, kindLabel, whenTime, notice, richText } from './world-store.js';

const ROOMS = {
  gm: { title: 'GM discussion', note: 'Only GMs can see this', start: 'Start thread', empty: 'No open threads. Plan with the other GMs here: “I’m bringing her back in session 14” or “Don’t kill him yet, I need him.”' },
  table: { title: 'Table talk', note: 'Players and GMs', start: 'Post', empty: 'No comments yet. Ask a question, share a theory, or tell the GM what your character does next.' },
};

function commentNode(c, reload, { isReply, audience }) {
  const mine = c.gm_id === session.gm?.id;
  const act = (body, msg) => async () => { try { await api('comments', { method: 'PATCH', body: { id: c.id, ...body } }); if (msg) toast(msg); reload(); } catch (err) { toast(err.message, 'bad'); } };
  const bodyBox = el('div', { class: 'comment-body' }, richText(c.body));
  const edit = () => {
    const ta = el('textarea', { rows: 3, 'aria-label': 'Edit comment' }, c.body);
    setKids(bodyBox, ta, el('div', { class: 'btnrow' },
      el('button', { class: 'btn small primary', type: 'button', onclick: () => act({ body: ta.value }, 'Saved')() }, 'Save'),
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => setKids(bodyBox, richText(c.body)) }, 'Cancel')));
    ta.focus();
  };
  const canDelete = mine || isOwner() || (audience === 'table' && isGm());
  return el('div', { class: `comment${isReply ? ' reply' : ''}${c.resolved ? ' resolved' : ''}${c.hidden ? ' hidden-comment' : ''}` },
    el('div', { class: 'comment-head' }, el('strong', {}, c.gm || 'Someone'), el('span', { class: 'muted small' }, whenTime(c.created_at), c.edited_at ? ' (edited)' : ''),
      c.hidden ? el('span', { class: 'tag hidden-tag' }, isGm() ? 'Hidden from players' : 'Hidden by a GM') : null,
      el('span', { class: 'comment-actions' },
        audience === 'gm' && !isReply ? el('button', { class: 'btn small ghost', type: 'button', onclick: act({ resolved: !c.resolved }) }, c.resolved ? 'Reopen' : 'Resolve') : null,
        audience === 'table' && isGm() ? el('button', { class: 'btn small ghost', type: 'button', onclick: act({ hidden: !c.hidden }, c.hidden ? 'Shown again' : 'Hidden from players') }, c.hidden ? 'Show' : 'Hide') : null,
        mine ? el('button', { class: 'btn small ghost', type: 'button', onclick: edit }, 'Edit') : null,
        canDelete ? confirmButton('Delete', async () => { try { await api('comments', { method: 'DELETE', query: { id: c.id } }); reload(); } catch (err) { toast(err.message, 'bad'); } }) : null)),
    bodyBox);
}

function composer(entryId, parentId, reload, placeholder, audience) {
  const ta = el('textarea', { rows: parentId ? 2 : 3, placeholder, 'aria-label': placeholder });
  const form = el('form', { class: 'composer' }, ta, el('div', { class: 'btnrow' },
    el('button', { class: 'btn small primary', type: 'submit' }, parentId ? 'Reply' : ROOMS[audience].start),
    el('span', { class: 'muted small' }, 'Ctrl+Enter to send. [[Names]] link to entries.')));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!ta.value.trim()) return;
    try { await api('comments', { method: 'POST', body: { entry_id: entryId, body: ta.value, parent_id: parentId, audience } }); ta.value = ''; reload(); }
    catch (err) { toast(err.message, 'bad'); }
  });
  ta.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) form.requestSubmit(); });
  return form;
}

function widget(e, audience) {
  const R = ROOMS[audience];
  const box = el('section', { class: `talk card talk-${audience}` }, el('div', { class: 'entry-head' }, el('h3', {}, R.title), el('span', { class: 'muted small' }, R.note)));
  const list = el('div', { class: 'threads' }, el('p', { class: 'muted small' }, 'Loading…'));
  let showResolved = false;
  const toggle = el('button', { class: 'btn small ghost', type: 'button', hidden: true, onclick: () => { showResolved = !showResolved; reload(); } });
  async function reload() {
    try {
      const { comments } = await api('comments', { query: { entry_id: e.id, audience } });
      const threads = comments.filter((c) => !c.parent_id);
      const resolved = threads.filter((t) => t.resolved).length;
      toggle.textContent = showResolved ? 'Hide resolved' : `Show resolved (${resolved})`; toggle.hidden = !resolved;
      const visible = threads.filter((t) => showResolved || !t.resolved);
      setKids(list, ...(visible.length ? visible.map((t) => el('div', { class: 'thread' }, commentNode(t, reload, { audience }),
        comments.filter((r) => r.parent_id === t.id).map((r) => commentNode(r, reload, { isReply: true, audience })),
        t.resolved || !isMember() ? null : composer(e.id, t.id, reload, 'Reply…', audience)))
        : [el('p', { class: 'muted small' }, isMember() ? R.empty : 'No comments yet.')]));
    } catch (err) { setKids(list, el('p', { class: 'error' }, err.message)); }
  }
  box.append(list, toggle, isMember() ? composer(e.id, null, reload, audience === 'gm' ? `Start a thread about ${e.name}…` : `Say something about ${e.name}…`, audience) : null);
  reload();
  // Pick up new comments while the page is open, unless a reply is being written (redrawing would lose it).
  const timer = setInterval(() => {
    if (!box.isConnected) { clearInterval(timer); return; }
    if (document.hidden || [...list.querySelectorAll('textarea')].some((t) => t.value.trim() || t === document.activeElement)) return;
    reload();
  }, 30000);
  return box;
}

export const talkWidget = (e) => widget(e, 'gm');

// Table talk shows on anything players can see. Hidden and suggested entries are GM business.
export function tableWidget(e) {
  if (e.visibility === 'gm' || e.status === 'suggested') return null;
  return widget(e, 'table');
}

export async function viewTalk() {
  try {
    const { threads } = await api('comments');
    const count = document.getElementById('w-talk-count'); if (count) count.textContent = threads.length || '';
    return el('div', { class: 'w-view' },
      el('div', { class: 'panel-head' }, el('h2', {}, 'GM discussions'), el('p', {}, 'Open threads across the world, newest activity first. Resolve a thread on its entry once it’s settled.')),
      threads.length ? el('ul', { class: 'entry-list talk-list' }, threads.map((t) => {
        const e = getEntry(t.entry_id);
        return el('li', {}, e ? link(e) : el('span', {}, t.entry_name || 'Deleted entry'), e ? el('span', { class: 'kind-tag' }, kindLabel(e.kind)) : null,
          el('span', { class: 'talk-snippet' }, `${t.gm || 'Someone'}: ${t.body.length > 140 ? `${t.body.slice(0, 138)}…` : t.body}`),
          el('span', { class: 'muted small' }, `${t.replies} repl${t.replies === 1 ? 'y' : 'ies'} · ${whenTime(t.last_at)}`));
      })) : notice('Nothing open', 'No GM threads need attention. Start one from any entry’s page.'));
  } catch (err) { return notice('Couldn’t load discussions', err.message); }
}

// The latest table talk across the world, newest first.
export async function viewTable() {
  try {
    const { comments } = await api('comments', { query: { recent: 'table' } });
    return el('div', { class: 'w-view' },
      el('div', { class: 'panel-head' }, el('h2', {}, 'Table talk'), el('p', {}, 'What players and GMs are saying about quests, handouts, rumors and everything else, newest first. Reply on the entry’s page.')),
      comments.length ? el('ul', { class: 'entry-list talk-list' }, comments.map((c) => {
        const e = getEntry(c.entry_id);
        return el('li', { class: c.hidden ? 'hidden-comment' : '' }, e ? link(e) : el('span', {}, c.entry_name), el('span', { class: 'kind-tag' }, kindLabel(c.kind)),
          el('span', { class: 'talk-snippet' }, `${c.gm || 'Someone'}${c.parent_id ? ' (reply)' : ''}: ${c.body.length > 160 ? `${c.body.slice(0, 158)}…` : c.body}`),
          el('span', { class: 'muted small' }, whenTime(c.created_at)));
      })) : notice('Quiet so far', isMember() ? 'Open a quest, a handout or a rumor and say something about it.' : 'Nobody has said anything yet.'));
  } catch (err) { return notice('Couldn’t load table talk', err.message); }
}
