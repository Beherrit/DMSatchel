// Search the talk: the words in a world search also looked for in table talk, GM discussions (GMs) and your own
// private notes. Each match links to its entry and scrolls to the comment there.
import { el, setKids } from './dom.js';
import { api, isMember } from './api.js';
import { getEntry, kindLabel, whenTime } from './world-store.js';
import { focusComment } from './world-talk.js';

const ROOM = { table: 'Table talk', gm: 'GM discussion', note: 'Your private note' };

// The text around the first match, with the match marked.
function snippet(body, q) {
  const text = String(body).replace(/\s+/g, ' ');
  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return [text.length > 160 ? `${text.slice(0, 158)}…` : text];
  const from = Math.max(0, at - 60), to = Math.min(text.length, at + q.length + 90);
  return [from ? '…' : '', text.slice(from, at), el('mark', {}, text.slice(at, at + q.length)), text.slice(at + q.length, to), to < text.length ? '…' : ''];
}

export function talkResults(q) {
  const words = String(q || '').trim();
  if (!isMember() || words.length < 2 || /^#\S+$/.test(words)) return null;
  const box = el('section', { class: 'talk-results', 'aria-labelledby': 'talk-results-h' }, el('h3', { class: 'section-title', id: 'talk-results-h' }, 'In the talk'), el('p', { class: 'muted small' }, 'Looking…'));
  api('comments', { query: { search: words } }).then(({ comments }) => {
    setKids(box, el('h3', { class: 'section-title', id: 'talk-results-h' }, `In the talk (${comments.length}${comments.length === 40 ? '+' : ''})`),
      comments.length ? el('ul', { class: 'entry-list talk-list' }, comments.map((c) => {
        const e = getEntry(c.entry_id);
        return el('li', {},
          el('a', { href: `#world/e/${c.entry_id}`, onclick: () => { if (c.audience !== 'note') focusComment(c.id); } }, e?.name || c.entry_name),
          el('span', { class: 'kind-tag' }, ROOM[c.audience] || c.audience),
          el('span', { class: 'talk-snippet' }, c.audience === 'note' ? '' : `${c.gm || 'Someone'}: `, ...snippet(c.body, words)),
          el('span', { class: 'muted small' }, `${kindLabel(c.kind)} · ${whenTime(c.created_at)}`));
      })) : el('p', { class: 'muted small' }, 'Nobody has said that in any comment.'));
  }).catch((err) => setKids(box, el('p', { class: 'muted small' }, err.message)));
  return box;
}
