// Job board poster: #world/poster/<placeId>, a town's open jobs as a notice-board poster to print or show to the
// table (each person sees it built from the jobs they can see).
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, getEntry, descendantsOf, notice } from './world-store.js';
import { worldCalendar, todayText } from './world-calendar.js';
import { posterOf, wantedFor } from './poster.js';

export const posterFor = (place) => posterOf(place, descendantsOf(place.id, ['quest']), { date: worldCalendar() ? todayText() : '', wanted: wantedFor(place, worldEntries(), descendantsOf(place.id)) });

export function posterNode(p) {
  return el('article', { class: 'poster', 'aria-label': p.title },
    el('header', { class: 'poster-head' }, el('h2', {}, p.title), p.by || p.date ? el('p', {}, [p.by, p.date].filter(Boolean).join(' · ')) : null),
    p.jobs.length ? el('ul', { class: 'poster-jobs' }, p.jobs.map((j) => el('li', { class: 'poster-job' },
      el('p', { class: 'poster-headline' }, j.headline),
      el('h3', {}, j.name),
      j.text ? el('p', {}, j.text) : null,
      j.reward ? el('p', { class: 'poster-reward' }, `Reward: ${j.reward}`) : null,
      j.ask ? el('p', { class: 'poster-ask' }, `Ask for ${j.ask}`) : null)))
      : p.wanted.length ? null : el('p', { class: 'poster-empty' }, 'Nothing posted. Come back on market day.'),
    p.wanted.length ? el('ul', { class: 'poster-jobs poster-wanted', 'aria-label': 'Wanted' }, p.wanted.map((w) => el('li', { class: 'poster-job' },
      el('p', { class: 'poster-headline' }, 'WANTED'),
      el('h3', {}, w.name),
      w.text ? el('p', {}, w.text) : null,
      el('p', { class: 'poster-reward' }, `Reward: ${w.reward}`),
      w.by ? el('p', { class: 'poster-ask' }, `Offered by ${w.by}`) : null))) : null,
    p.more ? el('p', { class: 'poster-more' }, `…and ${p.more} more on the board.`) : null);
}

export async function showPoster(place) {
  try {
    const r = await api('settings', { method: 'PATCH', body: { show: place.id, as: 'poster' } });
    world.info = { ...world.info, shown: r.shown };
    toast(`Showing the ${place.name} job board to the table`);
  } catch (err) { toast(err.message, 'bad'); }
}

export function viewPoster(id) {
  const place = getEntry(id);
  if (!place) return notice('Not found', 'That place doesn’t exist, or you can’t see it.');
  return el('div', { class: 'w-view poster-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, `Job board: ${place.name}`), el('p', {}, 'The open jobs and wanted notices as a poster for the table. Print it, or show it on everyone’s screen.')),
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print'),
        isGm() ? el('button', { class: 'btn', type: 'button', onclick: () => showPoster(place) }, 'Show to the table') : null,
        el('a', { class: 'btn ghost', href: `#world/e/${place.id}/quests` }, 'Back to the board'))),
    posterNode(posterFor(place)));
}
