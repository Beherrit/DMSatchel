// "Previously on…": the world's front page opens with the latest session's summary and where the party left off,
// so everyone arrives remembering. Folded once the next session is more than a week away (or not set).
import { el } from './dom.js';
import { world, worldEntries, link, richText } from './world-store.js';
import { sessionOrder } from './appearances.js';

export function previouslyCard() {
  const last = sessionOrder(worldEntries().filter((e) => (e.status || 'live') === 'live'))[0];
  if (!last || !(last.summary || last.fields?.next || last.body)) return null;
  const next = Date.parse(world.info?.next_session || '');
  const soon = Number.isFinite(next) && next > Date.now() - 86400000 && next - Date.now() < 7 * 86400000;
  const body = [
    last.summary ? richText(last.summary) : null,
    last.fields?.next ? el('div', { class: 'prev-next' }, el('strong', {}, 'Where we left off: '), richText(last.fields.next)) : null,
    el('p', { class: 'small' }, link(last, `Read ${last.name}`), last.fields?.world_date ? el('span', { class: 'muted' }, ` · ${last.fields.world_date}`) : null),
  ];
  return el('details', { class: 'card previously', open: soon || null },
    el('summary', {}, el('span', { class: 'eyebrow' }, 'Previously on…'), ' ', el('strong', {}, last.name)), ...body);
}
