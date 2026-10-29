// Job board poster: a town's open jobs as notices pinned up in the square, each with a headline in the voice of the
// poster ("BOUNTY", "MISSING", "GUARDS WANTED"), the job, the reward and who to ask. Only jobs that are posted
// (status Available, the default) and players can see go up; nothing from the GM-only fields is used. Pure, so it can be tested.
import { stripMarks } from './rich.js';

export const MAX_ON_POSTER = 8;

const HEADLINES = [
  [/\b(bount|slay|kill|hunt|cull|beast|monster|wolf|wolves|bandit|raider|troll|ogre|goblin|orc|wyvern|dragon)/i, 'BOUNTY'],
  [/\b(missing|lost|find|search|recover|retriev|stolen|kidnap|rescue)/i, 'MISSING'],
  [/\b(escort|guard|protect|defend|watch|caravan)/i, 'GUARDS WANTED'],
  [/\b(deliver|carry|courier|message|letter|parcel|haul)/i, 'COURIER NEEDED'],
  [/\b(explore|map|survey|ruin|tomb|cave|delve|expedition)/i, 'EXPLORERS SOUGHT'],
  [/\b(investigat|mystery|strange|haunt|curse|disappear)/i, 'ANSWERS SOUGHT'],
];

export function headlineFor(q) {
  const text = `${q?.name || ''} ${q?.summary || ''}`;
  return HEADLINES.find(([re]) => re.test(text))?.[1] || 'HELP WANTED';
}

const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s);

// place: the settlement (or any place); quests: the jobs inside it, as this person can see them; date: today's date
// text, if any.
export function posterOf(place, quests, { date = '' } = {}) {
  const posted = (quests || []).filter((q) => q.kind === 'quest' && q.visibility !== 'gm' && q.status !== 'suggested' && (q.fields?.status || 'Available') === 'Available')
    .sort((a, b) => a.name.localeCompare(b.name));
  const ruler = String(place?.fields?.ruler || '').trim();
  return {
    title: `Notices of ${place?.name || 'the town'}`,
    by: ruler ? `By leave of ${ruler}` : '',
    date,
    jobs: posted.slice(0, MAX_ON_POSTER).map((q) => ({
      id: q.id, headline: headlineFor(q), name: q.name,
      text: short(stripMarks(String(q.summary || '')).trim(), 240),
      reward: String(q.fields?.reward || '').trim(),
      ask: String(q.fields?.patron || '').trim(),
    })),
    more: Math.max(0, posted.length - MAX_ON_POSTER),
  };
}
