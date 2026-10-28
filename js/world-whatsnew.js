// "Since your last visit" on the world home: what others added, changed, revealed or resolved since you were last
// here (the server keeps the mark per member; the site admin's browser keeps its own).
import { el, setKids } from './dom.js';
import { api, session, isMember } from './api.js';
import { world, worldEntries, link, when, kindLabel } from './world-store.js';
import { whatsNew } from './whatsnew.js';

const dismissKey = () => `satchel-new-seen-${world.info?.id || 'world'}`;

export function whatsNewCard() {
  const since = world.visitSince;
  if (!since || !isMember()) return null;
  try { if (sessionStorage.getItem(dismissKey()) === since) return null; } catch { /* ignore */ }
  const box = el('section', { class: 'card whats-new', 'aria-label': 'Since your last visit' });
  const draw = (talk) => {
    const me = session.gm?.name;
    const mine = worldEntries().filter((e) => e.kind === 'character' && e.owner_id === session.gm?.id).map((e) => e.id);
    const r = whatsNew({ entries: worldEntries(), since, me, myCharacterIds: mine, talk, following: world.info?.following || [] });
    if (!r.total) { box.hidden = true; return; }
    box.hidden = false;
    const group = (title, list, line) => (list.length ? el('div', { class: 'wn-group' }, el('h4', {}, `${title} (${list.length})`),
      el('ul', { class: 'plain' }, list.slice(0, 8).map(line)), list.length > 8 ? el('p', { class: 'muted small' }, `and ${list.length - 8} more`) : null) : null);
    const entryLine = (e) => el('li', {}, link(e), el('span', { class: 'muted small' }, ` ${kindLabel(e.kind)}${e.updated_by ? ` · ${e.updated_by}` : ''}`));
    setKids(box,
      el('div', { class: 'entry-head' }, el('h3', {}, `Since your last visit (${when(since)})`),
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => { try { sessionStorage.setItem(dismissKey(), since); } catch { /* ignore */ } box.remove(); } }, 'Got it')),
      el('div', { class: 'wn-grid' },
        group('🔔 You follow', r.followed, entryLine),
        group('Session logs', r.sessions, entryLine),
        group('Handouts', r.handouts, entryLine),
        group('Downtime resolved', r.downtime, (e) => el('li', {}, link(e), e.fields?.outcome ? el('span', { class: 'muted small' }, ` ${String(e.fields.outcome).slice(0, 80)}${String(e.fields.outcome).length > 80 ? '…' : ''}`) : null)),
        group('Quests', r.quests, (e) => el('li', {}, link(e), e.fields?.status ? el('span', { class: 'muted small' }, ` ${e.fields.status}`) : null)),
        group('New in the world', r.added, entryLine),
        group('Updated', r.changed, entryLine),
        group('Table talk', r.talk, (c) => el('li', {}, el('a', { href: `#world/e/${c.entry_id}` }, c.entry_name || 'an entry'), el('span', { class: 'muted small' }, ` ${c.gm || 'Someone'}: ${String(c.body).slice(0, 60)}${String(c.body).length > 60 ? '…' : ''}`)))));
  };
  draw([]);
  api('comments', { query: { recent: 'table' } }).then((r) => draw(r.comments || [])).catch(() => {});
  return box;
}
