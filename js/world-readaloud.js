// Read-aloud in prep: the "> " boxes from what's planned for the next session, in order: entries the GM scratch pad
// mentions, where the party is and what's inside it, then quests in play. Used by session prep and the sheet.
import { el } from './dom.js';
import { worldEntries, getEntry, findByName, descendantsOf, kindFields, link, richText, kindLabel } from './world-store.js';
import { mentionsIn, readAloudPlan } from './read-aloud.js';
import { stripMarks } from './rich.js';
import { sceneFor } from './world-scene.js';

const longKeysOf = (e) => kindFields(e.kind).filter((f) => f[2] === 'long').map((f) => f[0]);
const fromLabel = (e, k) => (k === 'body' ? '' : k === 'secret' ? 'GM secret' : kindFields(e.kind).find((f) => f[0] === k)?.[1] || k);

export function plannedReadAloud(prep) {
  const here = prep?.location_id && getEntry(prep.location_id);
  return readAloudPlan([
    mentionsIn(prep?.notes || '').map(findByName).filter(Boolean),
    here ? [here, ...descendantsOf(here.id)] : [],
    worldEntries().filter((e) => e.kind === 'quest' && e.fields?.status === 'Active'),
  ], longKeysOf);
}

// For the prep page: each entry with its boxes, formatted as on the entry page.
// The scene, read aloud: when the GM has added it, the scene-setter line opens the list.
const sceneBox = (prep) => (prep?.scene_aloud && prep.location_id ? sceneFor(getEntry(prep.location_id)) : '');

export function readAloudList(prep) {
  const plan = plannedReadAloud(prep), scene = sceneBox(prep);
  if (scene) return [el('div', { class: 'ra-box ra-scene' }, el('span', { class: 'eyebrow' }, 'The scene'), richText(`> ${scene}`)), ...readAloudRest(plan)];
  return readAloudRest(plan);
}
function readAloudRest(plan) {
  if (!plan.length) return [el('p', { class: 'muted small' }, 'Start a paragraph with “> ” in a description to mark text to read aloud. Boxes from the places the party is in, quests in play and entries your scratch pad [[mentions]] gather here.')];
  return [el('ol', { class: 'plain ra-list' }, plan.map(({ entry, boxes }) => el('li', {},
    el('h4', {}, link(entry), el('span', { class: 'muted small' }, ` ${kindLabel(entry.kind)}`)),
    boxes.map((b) => el('div', { class: 'ra-box' }, fromLabel(entry, b.from) ? el('span', { class: 'eyebrow' }, fromLabel(entry, b.from)) : null,
      richText(b.text.split('\n').map((l) => `> ${l}`).join('\n')))))))];
}

// For the printable sheet: plain text, every word kept.
export function readAloudPrint(prep) {
  const scene = sceneBox(prep);
  return [...(scene ? [el('div', { class: 'ss-ra' }, el('strong', {}, 'The scene'), el('blockquote', {}, scene))] : []), ...plannedReadAloud(prep).map(({ entry, boxes }) => el('div', { class: 'ss-ra' }, el('strong', {}, entry.name),
    boxes.map((b) => el('blockquote', {}, b.text.split('\n').map((l, i) => [i ? el('br') : null, stripMarks(l)])))))];
}
