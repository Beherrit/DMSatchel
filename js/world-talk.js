// GM discussion threads on entries. Players never see these.
import { el, toast, confirmButton, setKids } from './dom.js';
import { api, session } from './api.js';
import { getEntry, link, kindLabel, whenTime, notice, richText } from './world-store.js';

function commentNode(c, entryId, reload, isReply) {
  const mine = c.gm_id === session.gm?.id;
  const body = el('div', { class: 'comment-body' }, richText(c.body));
  return el('div', { class: `comment${isReply ? ' reply' : ''}${c.resolved ? ' resolved' : ''}` },
    el('div', { class: 'comment-head' }, el('strong', {}, c.gm || 'Someone'), el('span', { class: 'muted small' }, whenTime(c.created_at), c.edited_at ? ' (edited)' : ''),
      el('span', { class: 'comment-actions' },
        !isReply ? el('button', { class: 'btn small ghost', type: 'button', onclick: async () => { try { await api('comments', { method: 'PATCH', body: { id: c.id, resolved: !c.resolved } }); reload(); } catch (err) { toast(err.message, 'bad'); } } }, c.resolved ? 'Reopen' : 'Resolve') : null,
        mine || session.gm?.role === 'admin' ? confirmButton('Delete', async () => { try { await api('comments', { method: 'DELETE', query: { id: c.id } }); reload(); } catch (err) { toast(err.message, 'bad'); } }) : null)),
    body);
}

function composer(entryId, parentId, reload, placeholder) {
  const ta = el('textarea', { rows: parentId ? 2 : 3, placeholder, 'aria-label': placeholder });
  const form = el('form', { class: 'composer' }, ta, el('div', { class: 'btnrow' }, el('button', { class: 'btn small primary', type: 'submit' }, parentId ? 'Reply' : 'Start thread')));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!ta.value.trim()) return;
    try { await api('comments', { method: 'POST', body: { entry_id: entryId, body: ta.value, parent_id: parentId } }); ta.value = ''; reload(); }
    catch (err) { toast(err.message, 'bad'); }
  });
  ta.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) form.requestSubmit(); });
  return form;
}

export function talkWidget(e) {
  const box = el('section', { class: 'talk card' }, el('div', { class: 'entry-head' }, el('h3', {}, 'GM discussion'), el('span', { class: 'muted small' }, 'Only GMs can see this')));
  const list = el('div', { class: 'threads' }, el('p', { class: 'muted small' }, 'Loading…'));
  let showResolved = false;
  const toggle = el('button', { class: 'btn small ghost', type: 'button', onclick: () => { showResolved = !showResolved; reload(); } });
  async function reload() {
    try {
      const { comments } = await api('comments', { query: { entry_id: e.id } });
      const threads = comments.filter((c) => !c.parent_id);
      const resolved = threads.filter((t) => t.resolved).length;
      toggle.textContent = showResolved ? 'Hide resolved' : `Show resolved (${resolved})`; toggle.hidden = !resolved;
      const visible = threads.filter((t) => showResolved || !t.resolved);
      setKids(list, ...(visible.length ? visible.map((t) => el('div', { class: 'thread' }, commentNode(t, e.id, reload),
        comments.filter((r) => r.parent_id === t.id).map((r) => commentNode(r, e.id, reload, true)),
        t.resolved ? null : composer(e.id, t.id, reload, 'Reply…')))
        : [el('p', { class: 'muted small' }, 'No open threads. Plan with the other GMs here: “I’m bringing her back in session 14” or “Don’t kill him yet, I need him.”')]));
    } catch (err) { setKids(list, el('p', { class: 'error' }, err.message)); }
  }
  box.append(list, toggle, composer(e.id, null, reload, `Start a thread about ${e.name}…`));
  reload();
  return box;
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
