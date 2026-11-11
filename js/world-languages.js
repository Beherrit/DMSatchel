// Who speaks what, in the world: the party's languages (its active characters, from their "Languages" field and their
// Forge sheets, and its hired NPCs), who in the party can talk to an NPC, and the party's tongues.
import { el } from './dom.js';
import { worldEntries, link, getEntry } from './world-store.js';
import { characterOf } from './sheet-ui.js';
import { isHired } from './hirelings.js';
import { languagesOf, sharedWith, tongues } from './languages.js';

// An entry's languages, its Forge sheet's included.
export const languagesOfEntry = (e) => { let sheet = []; if (e.kind === 'character') { try { sheet = characterOf(e)?.languages || []; } catch { sheet = []; } } return languagesOf(e, sheet); };

// The party: active characters and hired NPCs, each with their languages. → [{ who, languages }].
export const partySpeakers = () => worldEntries().filter((c) => (c.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status)) || isHired(c))
  .map((who) => ({ who, languages: languagesOfEntry(who) })).filter((p) => p.languages.length);

// Who can talk to them: on an NPC's page, the party members who share a language (or that nobody does).
export function talkLine(npc) {
  if (npc.kind !== 'npc' || isHired(npc)) return null;
  const mine = languagesOfEntry(npc); if (!mine.length) return null;
  const party = partySpeakers(); if (!party.length) return null;
  const can = sharedWith(mine, party);
  return el('p', { class: 'small talk-line' }, `🗣 Speaks ${mine.join(', ')}. `, can.length
    ? ['The party can talk with them: ', can.map((x, i) => [i ? ', ' : '', link(x.who), el('span', { class: 'muted' }, ` (${x.shared.join(', ')})`)]), '.']
    : [el('strong', {}, 'Nobody in the party shares a language with them.'), interpreters(npc, mine, party)]);
}

// An interpreter: NPCs who speak one of this NPC's languages and one of the party's, those in the same town first.
const townOf = (e) => { for (let p = e?.parent_id && getEntry(e.parent_id), i = 0; p && i < 12; p = p.parent_id && getEntry(p.parent_id), i++) if (p.kind === 'settlement') return p.id; return null; };
function interpreters(npc, mine, party) {
  const partyLangs = party.flatMap((p) => p.languages), here = townOf(npc);
  const can = worldEntries().filter((x) => x.kind === 'npc' && x.id !== npc.id && !isHired(x) && !['Dead', 'Missing'].includes(x.fields?.status))
    .map((x) => ({ x, langs: languagesOfEntry(x) })).filter(({ langs }) => sharedWith(mine, [{ who: 0, languages: langs }]).length && sharedWith(partyLangs, [{ who: 0, languages: langs }]).length)
    .sort((a, b) => Number(townOf(b.x) === here && here !== null) - Number(townOf(a.x) === here && here !== null) || a.x.name.localeCompare(b.x.name)).slice(0, 3);
  return can.length ? [' An interpreter? ', can.map(({ x, langs }, i) => [i ? ', ' : '', link(x), el('span', { class: 'muted' }, ` (${langs.join(', ')})`)]), '.'] : null;
}

// The party's tongues: the languages the party speaks between them, and who speaks each.
export function tonguesCard() {
  const t = tongues(partySpeakers()); if (!t.length) return null;
  return el('details', { class: 'party-tongues' }, el('summary', {}, `🗣 Languages the party speaks (${t.length})`),
    el('ul', { class: 'plain small' }, t.map((x) => el('li', {}, el('strong', {}, `${x.language}: `), x.speakers.map((w, i) => [i ? ', ' : '', link(w)])))));
}
