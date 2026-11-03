// Job board poster: #world/poster/<placeId>, a town's open jobs as a notice-board poster to print or show to the
// table (each person sees it built from the jobs they can see).
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, getEntry, descendantsOf, notice, findByName } from './world-store.js';
import { ownerDay } from './routine.js';
import { isHired } from './hirelings.js';
import { worldCalendar, todayText } from './world-calendar.js';
import { posterOf, wantedFor } from './poster.js';

// Where to ask: a patron's usual place, from the first part of their day their routine names ("by day at The Forge").
function whereToAsk(name) {
  const npc = findByName(String(name).replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1').split(/[,(;]/)[0].trim());
  if (!npc || npc.kind !== 'npc' || !npc.fields?.routine || isHired(npc)) return '';
  const g = ownerDay(npc.fields.routine, () => false).find((x) => x.place && !/^(at )?home$/i.test(x.place));
  if (!g) return '';
  const when = g.labels.length === 2 && g.labels[0] === 'Morning' && g.labels[1] === 'Afternoon' ? 'by day' : g.labels.map((l) => `${l.toLowerCase()}s`).join(' and ');
  return `${when} at ${g.place.replace(/^(at|in) /i, '')}`;
}

export const posterFor = (place) => posterOf(place, descendantsOf(place.id, ['quest']), { date: worldCalendar() ? todayText() : '', wanted: wantedFor(place, worldEntries(), descendantsOf(place.id), { claimed: true }), where: whereToAsk });

export function posterNode(p) {
  return el('article', { class: 'poster', 'aria-label': p.title },
    el('header', { class: 'poster-head' }, el('h2', {}, p.title), p.by || p.date ? el('p', {}, [p.by, p.date].filter(Boolean).join(' · ')) : null),
    p.jobs.length ? el('ul', { class: 'poster-jobs' }, p.jobs.map((j) => el('li', { class: 'poster-job' },
      el('p', { class: 'poster-headline' }, j.headline),
      el('h3', {}, j.name),
      j.text ? el('p', {}, j.text) : null,
      j.reward ? el('p', { class: 'poster-reward' }, `Reward: ${j.reward}`) : null,
      j.ask ? el('p', { class: 'poster-ask' }, `Ask for ${j.ask}${j.where ? `, ${j.where}` : ''}`) : null)))
      : p.wanted.length ? null : el('p', { class: 'poster-empty' }, 'Nothing posted. Come back on market day.'),
    p.wanted.length ? el('ul', { class: 'poster-jobs poster-wanted', 'aria-label': 'Wanted' }, p.wanted.map((w) => el('li', { class: `poster-job${w.claimed ? ' claimed' : ''}` },
      el('p', { class: 'poster-headline' }, w.claimed ? 'CLAIMED' : 'WANTED'),
      el('h3', {}, w.name),
      w.text ? el('p', {}, w.text) : null,
      // Wanted posters link the bounty: to the party page's Wanted card (and it's crossed out once claimed).
      el('p', { class: 'poster-reward' }, 'Reward: ', w.claimed ? el('s', {}, w.reward) : el('a', { href: '#world/party' }, w.reward), w.claimed ? ' (claimed)' : ''),
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

// A wanted poster: one NPC with a bounty, on their own poster (claimed ones are crossed out).
export function wantedPoster(npc) {
  const wanted = wantedFor(npc, [npc], [npc], { claimed: true });
  if (!wanted.length) return null;
  return { title: `Wanted: ${npc.name}`, by: '', date: worldCalendar() ? todayText() : '', jobs: [], wanted, more: 0 };
}

export function viewPoster(id) {
  const place = getEntry(id);
  if (!place) return notice('Not found', 'That place doesn’t exist, or you can’t see it.');
  if (place.kind === 'npc') {
    const p = wantedPoster(place);
    if (!p) return notice('No bounty', `There’s no bounty on ${place.name} to put on a poster.`);
    return el('div', { class: 'w-view poster-view' },
      el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, `Wanted poster: ${place.name}`), el('p', {}, 'A poster for the table: print it, or pin it on the notice board.')),
        el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print'), el('a', { class: 'btn ghost', href: `#world/e/${place.id}` }, `Back to ${place.name}`))),
      posterNode(p));
  }
  return el('div', { class: 'w-view poster-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, `Job board: ${place.name}`), el('p', {}, 'The open jobs and wanted notices as a poster for the table. Print it, or show it on everyone’s screen.')),
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print'),
        isGm() ? el('button', { class: 'btn', type: 'button', onclick: () => showPoster(place) }, 'Show to the table') : null,
        el('a', { class: 'btn ghost', href: `#world/e/${place.id}/quests` }, 'Back to the board'))),
    posterNode(posterFor(place)));
}
