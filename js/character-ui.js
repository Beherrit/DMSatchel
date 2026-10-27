// The character generator page: options, the rules sheet, and the backstory with per-section rerolls.

import { $, el, cap, copyText, download, toast, fresh, setKids } from './dom.js';
import { randomSeed } from './rng.js';
import { generateCharacter, characterText, STORY_SECTIONS, abilityMod, fmtMod } from './character.js';
import { SPECIES, CLASSES, BACKGROUNDS, ABILITIES, ABILITY_NAMES, ALIGNMENTS } from './rules2024.js';
import { saveNote } from './notebook.js';
import { sendToWorld } from './tools.js';

let state = { opts: { level: 1, species: 'any', cls: 'any', background: 'any', gender: 'any', alignment: 'any', method: 'standard', name: '' }, seed: randomSeed(), salts: {} };
let ch = null;
let sheet;

const sel = (id, label, options, value) => el('div', { class: 'field' }, el('label', { for: id }, label),
  el('select', { id, value }, options.map((o) => (Array.isArray(o) ? el('option', { value: o[0] }, o[1]) : el('option', { value: o }, o)))));

function readOpts() {
  const o = state.opts;
  o.level = +$('#c-level').value; o.species = $('#c-species').value; o.cls = $('#c-class').value; o.background = $('#c-bg').value;
  o.gender = $('#c-gender').value; o.alignment = $('#c-align').value; o.method = $('#c-method').value; o.name = $('#c-name').value.trim();
}
function writeOpts() {
  const o = state.opts;
  $('#c-level').value = o.level; $('#c-species').value = o.species; $('#c-class').value = o.cls; $('#c-bg').value = o.background;
  $('#c-gender').value = o.gender; $('#c-align').value = o.alignment; $('#c-method').value = o.method; $('#c-name').value = o.name || '';
}

const bump = (...parts) => { for (const p of parts) state.salts[p] = (state.salts[p] || 0) + 1; generate(); };

function generate(isNew) {
  ch = generateCharacter(state.opts, state.seed, state.salts);
  render(isNew);
}

export function shareLink() {
  const data = btoa(unescape(encodeURIComponent(JSON.stringify({ o: state.opts, s: state.seed, x: state.salts })))).replace(/=+$/, '');
  return `${location.origin}${location.pathname}?char=${data}#characters`;
}
function readShared() {
  const p = new URLSearchParams(location.search).get('char');
  if (!p) return;
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(p))));
    state = { opts: { ...state.opts, ...d.o }, seed: String(d.s || randomSeed()), salts: d.x || {} };
  } catch { /* ignore a broken link */ }
}

function block(title, ...kids) { return el('section', { class: 'sheet-block' }, el('h4', {}, title), ...kids); }
const chip = (label, value, note) => el('div', { class: 'stat' }, el('span', { class: 'stat-l' }, label), el('span', { class: 'stat-v' }, value), note ? el('span', { class: 'stat-n' }, note) : null);

function render(isNew) {
  const s = ch.stats, a = ch.abilities;
  const title = `Level ${s.level} ${ch.lineage && ['Elf', 'Gnome'].includes(ch.species) ? ch.lineage : ch.species} ${ch.cls}`;
  const abilityBoxes = el('div', { class: 'abilities' }, ABILITIES.map((k) => el('div', { class: 'ability', title: ABILITY_NAMES[k] },
    el('span', { class: 'ab-name' }, k), el('span', { class: 'ab-mod' }, fmtMod(abilityMod(a.scores[k]))), el('span', { class: 'ab-score' }, a.scores[k]),
    a.bonus[k] ? el('span', { class: 'ab-note' }, `+${a.bonus[k]} ${ch.background}`) : null)));
  const stats = el('div', { class: 'stats' },
    chip('Hit points', s.hp), chip('Armor class', s.ac, s.acNote), chip('Initiative', fmtMod(s.initiative)), chip('Speed', `${s.speed} ft`),
    chip('Proficiency', fmtMod(s.pb)), chip('Passive Perception', s.passive), chip('Hit dice', s.hitDice), chip('Size', s.size), s.darkvision ? chip('Darkvision', `${s.darkvision} ft`) : null);

  const left = el('div', { class: 'sheet-col' },
    block('Saving throws', el('ul', { class: 'skill-list' }, s.saves.map((x) => el('li', { class: x.prof ? 'prof' : '' }, el('span', {}, ABILITY_NAMES[x.ability]), el('span', { class: 'v' }, fmtMod(x.mod)))))),
    block('Skills', el('ul', { class: 'skill-list' }, s.skills.map((x) => el('li', { class: x.expert ? 'prof expert' : x.prof ? 'prof' : '', title: x.source ? `From ${x.source}` : '' },
      el('span', {}, x.name, el('small', {}, ` ${x.ability}`)), el('span', { class: 'v' }, fmtMod(x.mod)))))),
    block('Attack', el('p', {}, `${s.weapon.name}: ${fmtMod(s.weapon.toHit)} to hit, ${s.weapon.damage} damage${s.weapon.attacks > 1 ? `, ${s.weapon.attacks} attacks per Attack action` : ''}.`)),
    s.spellcasting ? block('Spellcasting', el('p', {}, `${ABILITY_NAMES[s.spellcasting.ability]} · save DC ${s.spellcasting.dc} · spell attack ${fmtMod(s.spellcasting.attack)}`), el('p', { class: 'muted' }, `Slots: ${s.spellcasting.slots}`),
      ch.spells ? el('p', { class: 'muted' }, `Suggested: ${[...ch.spells.cantrips, ...ch.spells.first].join(', ')}`) : null) : null,
    s.resources.length ? block('Class resources', el('ul', { class: 'plain' }, s.resources.map((x) => el('li', {}, x)))) : null,
    block('Proficiencies', el('p', {}, `Armor: ${ch.armorProf}.`), el('p', {}, `Weapons: ${ch.weaponProf}.`), el('p', {}, `Tools: ${ch.tools.join(', ')}.`), el('p', {}, `Languages: ${ch.languages.join(', ')}.`)),
    block('Equipment', el('p', {}, `From class: ${ch.equipment.cls}.`), el('p', {}, `From background: ${ch.equipment.background}.`), el('p', { class: 'muted' }, 'Either can be swapped for gold: 50 GP for the background, or the class’s gold option.')));

  const right = el('div', { class: 'sheet-col' },
    block('Feats', el('ul', { class: 'feature-list' }, ch.feats.map((f) => el('li', {}, el('strong', {}, f.name), el('span', { class: 'tag' }, f.kind), f.text ? el('p', {}, f.text) : null)))),
    Object.keys(ch.choices).length ? block('Choices', el('ul', { class: 'plain' }, Object.entries(ch.choices).map(([k, v]) => el('li', {}, el('strong', {}, `${k}: `), v)))) : null,
    block(`${ch.species} traits`, el('ul', { class: 'feature-list' }, s.speciesTraits.map((t) => el('li', {}, el('strong', {}, t.name), el('p', {}, t.text))))),
    block(`${ch.cls} features`, el('ol', { class: 'level-list' }, s.features.map((f) => el('li', {}, el('span', { class: 'lv' }, f.level), f.name))),
      ch.subclass ? null : el('p', { class: 'muted' }, `At level 3 they will choose a subclass (rolled: ${ch.futureSubclass}).`)),
    ch.levelUps.length ? block('Level-ups', el('ul', { class: 'plain' }, ch.levelUps.map((x) => el('li', {}, x)))) : null);

  const story = el('div', { class: 'story' }, el('p', { class: 'summary' }, ch.summary),
    Object.entries(STORY_SECTIONS).map(([k, t]) => el('section', { class: 'story-sec' },
      el('div', { class: 'story-head' }, el('h4', {}, t), el('button', { class: 'reroll', type: 'button', title: `Reroll ${t.toLowerCase()}`, 'aria-label': `Reroll ${t}`, onclick: () => bump(k) }, '↻')),
      el('ul', {}, (ch.story[k] || []).map((x) => el('li', {}, x))))));

  setKids(sheet, 
    el('header', { class: 'sheet-head' },
      el('div', {}, el('div', { class: 'eyebrow' }, `${ch.background} · ${ch.alignment} · ${ch.pronouns}`),
        el('h3', { class: 'card-title' }, ch.name, ' ', el('button', { class: 'reroll', type: 'button', 'aria-label': 'New name', title: 'New name', onclick: () => bump('name') }, '↻')),
        el('p', { class: 'card-sub' }, `${title}${ch.subclass ? `, ${ch.subclass}` : ''}`),
        el('p', { class: 'muted' }, `Age ${ch.age}, ${ch.height}. ${cap(ch.looks)}.`))),
    abilityBoxes, stats,
    el('div', { class: 'sheet-cols' }, left, right),
    el('h3', { class: 'section-title' }, 'Backstory'), story,
    el('p', { class: 'muted small' }, `Seed ${ch.seed} · ability scores by ${{ standard: 'standard array', roll: '4d6 drop lowest', pointbuy: 'point buy' }[a.method]}. Rules summaries are short paraphrases; check the 2024 Player’s Handbook for full wording.`));
  if (isNew) fresh(sheet);
}

export function mountCharacters(root) {
  readShared();
  sheet = el('article', { class: 'card sheet fresh', id: 'c-sheet' });
  const levelOpts = Array.from({ length: 20 }, (_, i) => [String(i + 1), `Level ${i + 1}`]);
  root.append(
    el('div', { class: 'panel-head' }, el('h2', {}, 'Character Forge'),
      el('p', {}, 'A complete 2024-rules character in one roll: species, class, background, ability scores, features and spells, plus a life story with family, upbringing, the people they know and hooks for the DM. Reroll any part with ↻.')),
    el('div', { class: 'controls' },
      sel('c-level', 'Level', levelOpts), sel('c-species', 'Species', [['any', 'Any'], ...Object.keys(SPECIES).map((k) => [k, k])]),
      sel('c-class', 'Class', [['any', 'Any'], ...Object.keys(CLASSES).map((k) => [k, k])]), sel('c-bg', 'Background', [['any', 'Any'], ...Object.keys(BACKGROUNDS).map((k) => [k, k])]),
      sel('c-gender', 'Character', [['any', 'Any'], ['f', 'She/her'], ['m', 'He/him'], ['x', 'They/them']]),
      sel('c-align', 'Alignment', [['any', 'Any'], ...Object.keys(ALIGNMENTS).map((k) => [k, k])]),
      sel('c-method', 'Ability scores', [['standard', 'Standard array'], ['pointbuy', 'Point buy'], ['roll', '4d6 drop lowest']]),
      el('div', { class: 'field' }, el('label', { for: 'c-name' }, 'Name (optional)'), el('input', { type: 'text', id: 'c-name', placeholder: 'Leave blank to roll one' }))),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary', type: 'button', onclick: () => { readOpts(); state.seed = randomSeed(); state.salts = {}; generate(true); } }, 'Roll character'),
      el('button', { class: 'btn', type: 'button', onclick: () => bump('origins', 'upbringing', 'calling', 'life', 'people', 'personality', 'drives', 'hooks') }, 'New backstory'),
      el('button', { class: 'btn', type: 'button', onclick: () => bump('abilities', 'build') }, 'New stats'),
      el('button', { class: 'btn', type: 'button', onclick: () => saveNote('Character', ch.name, characterText(ch)) }, 'Save to notebook'),
      el('button', { class: 'btn world', type: 'button', onclick: () => sendToWorld({ kind: 'character', name: ch.name, summary: ch.summary,
        fields: { species: ch.lineage ? `${ch.species} (${ch.lineage})` : ch.species, class: ch.subclass ? `${ch.cls} (${ch.subclass})` : ch.cls, level: String(ch.stats.level), background: ch.background, status: 'Active', sheet: characterText(ch) },
        secret: ch.story.drives.find((x) => x.startsWith('Secret')) || '' }) }, 'Add to world'),
      el('button', { class: 'btn', type: 'button', onclick: () => copyText(characterText(ch)) }, 'Copy'),
      el('button', { class: 'btn', type: 'button', onclick: () => download(`${ch.name.replace(/[^\w]+/g, '-')}.txt`, characterText(ch)) }, 'Download'),
      el('button', { class: 'btn', type: 'button', onclick: () => window.print() }, 'Print'),
      el('button', { class: 'btn', type: 'button', onclick: () => { copyText(shareLink()); toast('Link copied: anyone who opens it sees this exact character'); } }, 'Share link')),
    sheet);
  // Changing an option rerolls with the same seed, so the character changes only where it must.
  for (const id of ['c-level', 'c-species', 'c-class', 'c-bg', 'c-gender', 'c-align', 'c-method']) $(`#${id}`, root).addEventListener('change', () => { readOpts(); generate(); });
  $('#c-name', root).addEventListener('change', () => { readOpts(); generate(); });
  writeOpts();
  generate();
}
