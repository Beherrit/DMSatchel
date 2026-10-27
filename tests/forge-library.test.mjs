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
