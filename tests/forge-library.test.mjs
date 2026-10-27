import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCharacter, setCharacterLibrary, characterText, speciesData } from '../js/character.js';

const LIB = {
  species: [{ name: 'Stormborn', size: 'Medium', speed: 35, darkvision: 60, like: 'Elf', traits: [['Storm Sense', 'You feel weather coming.']], source: 'Book of Storms' }],
  subclasses: [{ name: 'Path of the Storm', cls: 'Barbarian', features: 'Rage crackles with lightning.', source: 'Book of Storms' }],
};

test('a library species uses its own numbers and traits, and its "similar to" species for names', () => {
  setCharacterLibrary(() => LIB);
  const ch = generateCharacter({ species: 'Stormborn', cls: 'Fighter', level: 3 }, 'storm');
  assert.equal(ch.species, 'Stormborn');
  assert.equal(ch.stats.speed, 35); assert.equal(ch.stats.darkvision, 60);
  assert.deepEqual(ch.stats.speciesTraits.map((t) => t.name), ['Storm Sense']);
  assert.equal(ch.library.species.like, 'Elf');
  assert.ok(characterText(ch).includes('Storm Sense'));
});

test('"any from my library" picks from the library, and the resolved choice rebuilds identically', () => {
  setCharacterLibrary(() => LIB);
  const a = generateCharacter({ species: 'library', cls: 'Barbarian', subclass: 'library', level: 5 }, 'lib1');
  assert.equal(a.species, 'Stormborn'); assert.equal(a.subclass, 'Path of the Storm'); assert.equal(a.library.subclass.source, 'Book of Storms');
  const b = generateCharacter({ species: 'Stormborn', cls: 'Barbarian', subclass: 'Path of the Storm', level: 5 }, 'lib1');
  assert.equal(characterText(a), characterText(b));
});

test('an explicit SRD subclass and a missing library species both work', () => {
  setCharacterLibrary(() => LIB);
  const c = generateCharacter({ cls: 'Wizard', subclass: 'Evoker', level: 3 }, 'evo');
  assert.equal(c.subclass, 'Evoker');
  setCharacterLibrary(() => ({ species: [], subclasses: [] }));
  const gone = generateCharacter({ species: 'Stormborn', cls: 'Rogue', level: 2 }, 'gone');
  assert.equal(gone.species, 'Stormborn'); assert.equal(gone.stats.speed, 30);
  assert.equal(speciesData('Elf').speed, 30);
});

import { classFrom, classFeatures, libraryClasses } from '../js/library.js';

const ARTIFICER = { category: 'Class', die: 'd8', primary: 'Int', saves: 'Constitution and Intelligence', skills: 'Arcana, History, Investigation, Medicine, Nature, Perception, Sleight of Hand', skillCount: '2',
  wears: 'Leather and shield', weapon: 'Light crossbow 1d8', caster: 'Half caster', spellAbility: 'Int', gear: 'Tinker’s tools', source: 'My book',
  features: '1: Tinkerer’s Magic: Make tiny gadgets.\n1: Spellcasting\n2: Replicate Magic Item — Craft from plans.\nYou can keep two.\n3: Artificer Subclass\n5: Subclass feature\nLevel 7: Flash of Genius' };

test('class features read one level per line, with or without descriptions', () => {
  const { byLevel, list } = classFeatures('1: Rage, Unarmored Defense\n2nd level - Danger Sense: You sense traps.\nand ambushes.\n4: ASI\n3: Path subclass\nnot a level line');
  assert.deepEqual(byLevel[1], ['Rage', 'Unarmored Defense']);
  assert.deepEqual(byLevel[2], ['Danger Sense']);
  assert.equal(list.find((f) => f.name === 'Danger Sense').text, 'You sense traps. and ambushes.');
  assert.deepEqual(byLevel[4], ['Ability Score Improvement']);
  assert.deepEqual(byLevel[3], ['Subclass feature']);
});

test('a class from the library fills in sensible defaults', () => {
  const c = classFrom('Artificer', ARTIFICER);
  assert.equal(c.die, 8); assert.deepEqual(c.saves, ['Con', 'Int']); assert.equal(c.priority[0], 'Int');
  assert.equal(c.armor, 'leather-shield'); assert.equal(c.armorProf, 'Light armor, shields');
  assert.deepEqual(c.weapon, ['Light crossbow', '1d8', 'Dex']);
  assert.equal(c.caster, 'half'); assert.equal(c.spellsLike, 'Wizard');
  assert.deepEqual(c.features[4], ['Ability Score Improvement']); assert.deepEqual(c.features[19], ['Epic Boon']);
  assert.deepEqual(c.features[3], []); assert.deepEqual(c.features[5], ['Subclass feature']);
  const bare = classFrom('Mystery');
  assert.equal(bare.die, 8); assert.equal(bare.skills.length, 18); assert.equal(bare.caster, null);
});

test('the Forge builds library classes, with their subclasses, spells and feature notes', () => {
  const entries = [{ id: 'a', kind: 'rule', name: 'Artificer', fields: ARTIFICER }, { id: 'b', kind: 'rule', name: 'Blood Hunter', fields: { category: 'Class', die: 'd10', primary: 'Dex' } }];
  const classes = libraryClasses(entries);
  setCharacterLibrary(() => ({ species: [], subclasses: [{ name: 'Alchemist', cls: 'Artificer', features: 'Potions.', source: 'My book' }], classes }));
  const ch = generateCharacter({ cls: 'Artificer', level: 7 }, 'tink');
  assert.equal(ch.cls, 'Artificer'); assert.equal(ch.subclass, 'Alchemist');
  assert.equal(ch.stats.hitDice, '7d8'); assert.equal(ch.stats.acNote, 'leather armor and shield');
  assert.equal(ch.stats.spellbook.cls, 'Artificer'); assert.deepEqual(ch.stats.spellbook.slots, [4, 3]);
  assert.ok(ch.stats.features.some((f) => f.name === 'Replicate Magic Item' && f.text === 'Craft from plans. You can keep two.'));
  assert.ok(ch.stats.features.some((f) => f.name === 'Subclass: Alchemist' && f.level === 3));
  assert.ok(ch.stats.features.some((f) => f.name === 'Alchemist feature' && f.level === 5));
  assert.ok(ch.stats.saves.find((s) => s.ability === 'Int').prof);
  assert.ok(characterText(ch).includes('Artificer is from your library (My book); spells come from the Wizard list.'));
  // "Any from my library" resolves to a library class, which rebuilds identically by name.
  const any = generateCharacter({ cls: 'library', level: 4 }, 'pick');
  assert.ok(['Artificer', 'Blood Hunter'].includes(any.cls));
  assert.equal(characterText(any), characterText(generateCharacter({ cls: any.cls, level: 4 }, 'pick')));
  // A class with no subclasses yet, and one whose library entry is gone, still build.
  const bh = generateCharacter({ cls: 'Blood Hunter', level: 5 }, 'bh');
  assert.equal(bh.subclass, null); assert.equal(bh.stats.hitDice, '5d10'); assert.equal(bh.stats.spellcasting, null);
  setCharacterLibrary(() => ({ species: [], subclasses: [] }));
  const gone = generateCharacter({ cls: 'Artificer', level: 3 }, 'tink');
  assert.equal(gone.cls, 'Artificer'); assert.equal(gone.stats.hitDice, '3d8');
});

import { librarySpells } from '../js/library.js';
import { npcStats } from '../js/npc-stats.js';

test('library spells read their level and classes, and join spellbooks only when asked', () => {
  const entries = [
    { id: 's1', kind: 'rule', name: 'Storm Lance', fields: { category: 'Spell', class: 'wizard, sorcerer', level: '1', features: 'A bolt of lightning.' } },
    { id: 's2', kind: 'rule', name: 'Spark', fields: { category: 'Spell', class: 'Wizard', level: 'cantrip' } },
    { id: 's3', kind: 'rule', name: 'Gear Ward', fields: { category: 'Spell', class: 'Artificer', level: '2' } },
    { id: 's4', kind: 'rule', name: 'No Level', fields: { category: 'Spell', class: 'Wizard' } },
  ];
  const spells = librarySpells(entries, ['Wizard', 'Sorcerer', 'Artificer']);
  assert.deepEqual(spells.map((x) => [x.name, x.level, x.classes]), [['Storm Lance', 1, ['Wizard', 'Sorcerer']], ['Spark', 0, ['Wizard']], ['Gear Ward', 2, ['Artificer']]]);
  setCharacterLibrary(() => ({ species: [], subclasses: [], classes: [], spells }));
  // Off (characters saved before the option): the spellbook is the SRD one.
  const off = generateCharacter({ cls: 'Wizard', level: 5 }, 'w1');
  setCharacterLibrary(() => ({ species: [], subclasses: [], classes: [] }));
  assert.equal(JSON.stringify(off.stats.spellbook), JSON.stringify(generateCharacter({ cls: 'Wizard', level: 5 }, 'w1').stats.spellbook));
  // On: across a few seeds, library spells turn up, and only for their classes.
  setCharacterLibrary(() => ({ species: [], subclasses: [], classes: [], spells }));
  let seen = new Set();
  for (let i = 0; i < 12; i++) {
    const sb = generateCharacter({ cls: 'Wizard', level: 5, libSpells: true }, `w${i}`).stats.spellbook;
    for (const n of sb.fromLibrary || []) seen.add(n);
    const all = [...sb.cantrips, ...Object.values(sb.byLevel).flat()];
    assert.equal(all.length, new Set(all).size, 'no spell twice');
    assert.ok(!all.includes('Gear Ward'));
  }
  assert.ok(seen.has('Storm Lance') && seen.has('Spark'));
  const cleric = generateCharacter({ cls: 'Cleric', level: 5, libSpells: true }, 'c1').stats.spellbook;
  assert.equal(cleric.fromLibrary, undefined);
  // NPC spellcasters use them too.
  const texts = Array.from({ length: 15 }, (_, i) => npcStats({ role: 'wizard', cls: 'Wizard', level: 5 }, `npc${i}`).spells).join('\n');
  assert.ok(texts.includes('Storm Lance') || texts.includes('Spark'));
});

import { backgroundFrom, libraryFeats } from '../js/library.js';
import { CLASSES } from '../js/rules2024.js';

test('library backgrounds and feats join the Forge', () => {
  const storm = backgroundFrom('Storm Chaser', { abilities: 'Dex, Wis, Con', skills: 'Survival, Nature', tool: 'Navigator’s Tools', feat: 'Weather Eye', gear: 'Barometer, 20 GP', source: 'Book of Storms' }, { notes: 'You chase storms.' });
  const feats = libraryFeats([
    { id: 'f1', kind: 'rule', name: 'Weather Eye', fields: { category: 'Feat', featType: 'Origin', features: 'You always know the weather.' } },
    { id: 'f2', kind: 'rule', name: 'Lightning Reflexes', fields: { category: 'Feat', featType: 'General', level: '4', features: '+1 Dex; react to danger.' } },
    { id: 'f3', kind: 'rule', name: 'Storm Style', fields: { category: 'Feat', featType: 'Fighting Style' } },
  ]);
  setCharacterLibrary(() => ({ backgrounds: [storm], feats }));
  const ch = generateCharacter({ background: 'Storm Chaser', cls: 'Fighter', level: 1 }, 'bg1');
  assert.equal(ch.background, 'Storm Chaser');
  assert.deepEqual(ch.feats[0], { name: 'Weather Eye', text: 'You always know the weather.', kind: 'Origin' });
  assert.ok(ch.stats.skills.find((x) => x.name === 'Survival').prof);
  assert.ok(ch.tools.includes('Navigator’s Tools'));
  assert.ok(characterText(ch).includes('Storm Chaser is from your library (Book of Storms): You chase storms.'));
  const any = generateCharacter({ background: 'library', level: 1 }, 'bg2');
  assert.equal(any.background, 'Storm Chaser');
  // Feats only swap in with the library option on, and the SRD rolls underneath stay the same.
  const off = generateCharacter({ cls: 'Fighter', level: 12, species: 'Human' }, 'ft');
  assert.ok(!off.feats.some((f) => ['Lightning Reflexes', 'Storm Style'].includes(f.name)));
  let general = false, style = false;
  for (let i = 0; i < 15; i++) {
    const on = generateCharacter({ cls: 'Fighter', level: 12, species: 'Human', libSpells: true }, `ft${i}`);
    if (on.feats.some((f) => f.name === 'Lightning Reflexes' && f.text)) general = true;
    if (on.choices['Fighting Style'] === 'Storm Style') style = true;
  }
  assert.ok(general && style);
  // A general feat with a minimum level isn't taken before it.
  for (let i = 0; i < 10; i++) {
    const on = generateCharacter({ cls: 'Fighter', level: 12, libSpells: true }, `lv${i}`);
    assert.ok(!on.levelUps.some((n) => /Level [1-3]: Lightning/.test(n)));
  }
  setCharacterLibrary(() => ({}));
  assert.equal(generateCharacter({ background: 'Storm Chaser', cls: 'Wizard' }, 'gone').background, 'Storm Chaser');
  assert.ok(CLASSES.Fighter);
});
