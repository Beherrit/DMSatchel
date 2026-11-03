// "What's new in the Satchel": every shipped roadmap item, newest first, read from ROADMAP.md (the same list the
// builders tick). Route: #news, linked from the footer.
import { el, setKids } from './dom.js';
import { changelog } from './changelog.js';

const PAGE = 40;

export function mountNews(box) {
  box.append(el('div', { class: 'w-view news-view' }, el('p', { class: 'muted' }, 'Loading what’s new…')));
}

export async function showNews(panel) {
  const view = panel.querySelector('.news-view');
  let items;
  try {
    const res = await fetch('/ROADMAP.md', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    items = changelog(await res.text());
  } catch {
    setKids(view, el('h2', {}, 'What’s new in the Satchel'), el('p', { class: 'muted' }, 'Couldn’t load the list of changes. Check your connection and try again.'));
    return;
  }
  const list = el('ol', { class: 'news-list', reversed: true });
  const filter = el('input', { type: 'search', class: 'news-filter', placeholder: 'Filter changes…', 'aria-label': 'Filter changes' });
  const more = el('button', { class: 'btn small', type: 'button' }, 'Show more');
  const count = el('p', { class: 'muted news-count' });
  let shown = PAGE;
  const draw = () => {
    const q = filter.value.trim().toLowerCase();
    const hits = q ? items.filter((i) => `${i.title} ${i.text}`.toLowerCase().includes(q)) : items;
    setKids(list, ...hits.slice(0, shown).map((i) => el('li', { class: 'news-item', value: i.n, id: `news-${i.n}` },
      el('h3', {}, el('span', { class: 'news-n muted' }, `#${i.n}`), ' ', i.title), i.text ? el('p', {}, i.text) : null)));
    count.textContent = q ? `${hits.length} of ${items.length} changes match.` : `${items.length} changes so far, newest first.`;
    more.hidden = hits.length <= shown;
  };
  filter.addEventListener('input', () => { shown = PAGE; draw(); });
  more.addEventListener('click', () => { shown += PAGE; draw(); });
  setKids(view,
    el('div', { class: 'panel-head' }, el('h2', {}, 'What’s new in the Satchel'), el('p', {}, 'Everything that’s been added, newest first.')),
    filter, count, list, el('div', { class: 'btnrow' }, more));
  draw();
}
