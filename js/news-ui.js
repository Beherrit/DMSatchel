// "What's new in the Satchel": every shipped roadmap item, newest first, read from ROADMAP.md (the same list the
// builders tick). Route: #news, linked from the footer.
import { el, setKids, toast } from './dom.js';
import { changelog, newSince, newest } from './changelog.js';

const PAGE = 40;
const KEY = 'satchel-news-seen';
const readSeen = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const writeSeen = (n) => { try { localStorage.setItem(KEY, String(n)); } catch { /* fine without it */ } };
const load = async (cache = 'no-cache') => {
  const res = await fetch('/ROADMAP.md', { cache });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return changelog(await res.text());
};

// The footer link's count: what's shipped since this browser last opened the page (only for those who have).
export async function newsBadge(linkEl) {
  if (!linkEl || !readSeen()) return;
  const fresh = newSince(await load('default').catch(() => []), readSeen()).length;
  setBadge(linkEl, fresh);
}
function setBadge(linkEl, count) {
  linkEl.querySelector('.news-badge')?.remove();
  if (count > 0) linkEl.append(el('span', { class: 'news-badge', 'aria-label': `${count} new` }, ` (${count} new)`));
}

export function mountNews(box) {
  box.append(el('div', { class: 'w-view news-view' }, el('p', { class: 'muted' }, 'Loading what’s new…')));
}

export async function showNews(panel, sub = '') {
  const target = Number(String(sub).split('/')[0]) || 0;
  const view = panel.querySelector('.news-view');
  let items;
  try {
    items = await load();
  } catch {
    setKids(view, el('h2', {}, 'What’s new in the Satchel'), el('p', { class: 'muted' }, 'Couldn’t load the list of changes. Check your connection and try again.'));
    return;
  }
  // Since you looked: mark what's new to this browser, then remember the newest.
  const fresh = new Set(newSince(items, readSeen()).map((i) => i.n));
  writeSeen(newest(items));
  setBadge(document.querySelector('footer a[href="#news"]'), 0);
  const list = el('ol', { class: 'news-list', reversed: true });
  const filter = el('input', { type: 'search', class: 'news-filter', placeholder: 'Filter changes…', 'aria-label': 'Filter changes' });
  const more = el('button', { class: 'btn small', type: 'button' }, 'Show more');
  const count = el('p', { class: 'muted news-count' });
  // A link to one change (#news/305): show enough to include it, then scroll to it.
  const at = target ? items.findIndex((i) => i.n === target) : -1;
  let shown = Math.max(PAGE, at + 1);
  const draw = () => {
    const q = filter.value.trim().toLowerCase();
    const hits = q ? items.filter((i) => `${i.title} ${i.text}`.toLowerCase().includes(q)) : items;
    setKids(list, ...hits.slice(0, shown).map((i) => el('li', { class: `news-item${fresh.has(i.n) ? ' fresh' : ''}`, value: i.n, id: `news-${i.n}` },
      el('h3', {}, el('a', { class: 'news-n muted', href: `#news/${i.n}`, title: 'Link to this change' }, `#${i.n}`), ' ', i.title, fresh.has(i.n) ? el('span', { class: 'tag news-new' }, 'New') : null,
        el('button', { class: 'btn small ghost news-copy', type: 'button', 'aria-label': `Copy a link to change ${i.n}`, onclick: () => copyLink(i.n) }, 'Copy link')),
      i.text ? el('p', {}, i.text) : null)));
    count.textContent = q ? `${hits.length} of ${items.length} changes match.` : `${items.length} changes so far, newest first.${fresh.size ? ` ${fresh.size} new since you last looked.` : ''}`;
    more.hidden = hits.length <= shown;
  };
  filter.addEventListener('input', () => { shown = PAGE; draw(); });
  more.addEventListener('click', () => { shown += PAGE; draw(); });
  setKids(view,
    el('div', { class: 'panel-head' }, el('h2', {}, 'What’s new in the Satchel'), el('p', {}, 'Everything that’s been added, newest first.')),
    filter, count, list, el('div', { class: 'btnrow' }, more));
  draw();
  if (target) {
    const li = list.querySelector(`#news-${target}`);
    if (li) { li.classList.add('target'); requestAnimationFrame(() => li.scrollIntoView({ block: 'center' })); }
    else toast(`Change #${target} isn’t on the list (yet).`);
  }
}

async function copyLink(n) {
  const url = `${location.origin}${location.pathname}#news/${n}`;
  try { await navigator.clipboard.writeText(url); toast('Link copied.'); } catch { toast(url); }
}
