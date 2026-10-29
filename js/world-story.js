// "Their story so far" on a character's page: sessions played, quests finished, goals reached, wishes come true,
// and what they carry, from what the world already records.
import { el } from './dom.js';
import { worldEntries, link, mentions, richInline } from './world-store.js';
import { storyOf, storyEmpty } from './story.js';

export function storySection(c) {
  if (c.kind !== 'character') return null;
  const s = storyOf(c, worldEntries(), mentions);
  if (storyEmpty(s)) return null;
  const row = (label, kids) => el('div', { class: 'story-row' }, el('dt', {}, label), el('dd', {}, kids));
  const links = (list) => list.flatMap((e, i) => [i ? ', ' : '', link(e)]);
  return el('section', { class: 'card story' }, el('h3', {}, 'Their story so far'),
    el('dl', { class: 'story-list' },
      s.sessions.length ? row('Sessions', [`${s.sessions.length} played`, s.first !== s.last ? [': from ', link(s.first), ' to ', link(s.last)] : [': ', link(s.first)]]) : null,
      s.quests.length ? row('Quests finished', links(s.quests)) : null,
      s.goals.length ? row('Goals reached', s.goals.map((g, i) => [i ? ' · ' : '', richInline(g.text)])) : null,
      s.wishes.length ? row('Wishes come true', s.wishes.map((w) => w.text).join(' · ')) : null,
      s.items.length ? row('Carrying', links(s.items)) : null));
}
