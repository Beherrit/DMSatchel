import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCharacter, characterText, PARTS } from '../js/character.js';
import { CLASSES, BACKGROUNDS, SPECIES, SKILLS } from '../js/rules2024.js';

const many = (n, opts = {}) => Array.from({ length: n }, (_, i) => generateCharacter({ level: 1 + (i % 20), method: ['standard', 'roll', 'pointbuy'][i % 3], ...opts }, `t${i}`));

test('same seed gives the same character', () => {
  assert.deepEqual(generateCharacter({ level: 5 }, 'abc'), generateCharacter({ level: 5 }, 'abc'));
});

test('rerolling one part leaves the rules build alone', () => {
  const a = generateCharacter({ level: 8 }, 'keep');
  const b = generateCharacter({ level: 8 }, 'keep', { personality: 1 });
  assert.deepEqual(a.abilities, b.abilities);
  assert.equal(a.name, b.name);
  assert.notDeepEqual(a.story.personality, b.story.personality);
  assert.ok(PARTS.includes('personality'));
});

test('ability scores stay legal', () => {
  for (const c of many(600)) {
    for (const v of Object.values(c.abilities.scores)) {
      assert.ok(v >= 3 && v <= (c.stats.level >= 19 ? 30 : 20), `${c.seed}: score ${v}`);
    }
    const bonus = Object.values(c.abilities.bonus).sort().join(',');
    assert.ok(bonus === '1,2' || bonus === '1,1,1', `${c.seed}: background bonus ${bonus}`);
    for (const a of Object.keys(c.abilities.bonus)) assert.ok(BACKGROUNDS[c.background].abilities.includes(a));
  }
});

test('skills are unique, and background and class skills are present', () => {
  for (const c of many(600)) {
    const prof = c.stats.skills.filter((s) => s.prof).map((s) => s.name);
    assert.equal(new Set(prof).size, prof.length);
    for (const s of BACKGROUNDS[c.background].skills) assert.ok(prof.includes(s), `${c.seed}: missing ${s}`);
    for (const s of prof) assert.ok(SKILLS[s]);
    for (const s of c.stats.skills.filter((x) => x.expert)) assert.ok(s.prof, `${c.seed}: expertise without proficiency`);
  }
});

test('derived numbers are sane', () => {
  for (const c of many(600)) {
    const s = c.stats, cl = CLASSES[c.cls];
    assert.equal(s.pb, 2 + Math.floor((s.level - 1) / 4));
    assert.ok(s.hp >= s.level && s.hp <= s.level * (cl.die + 5 + 3) + 20, `${c.seed}: hp ${s.hp}`);
    assert.ok(s.ac >= 9 && s.ac <= 22, `${c.seed}: ac ${s.ac}`);
    assert.equal(Boolean(c.subclass), s.level >= 3);
    if (cl.caster) assert.ok(s.spellcasting, `${c.seed}: caster without spellcasting`);
    assert.ok(SPECIES[c.species]);
  }
});

test('options are respected', () => {
  const c = generateCharacter({ level: 12, species: 'Dwarf', cls: 'Wizard', background: 'Sage', gender: 'f', alignment: 'Lawful Good' }, 'opts');
  assert.equal(c.species, 'Dwarf'); assert.equal(c.cls, 'Wizard'); assert.equal(c.background, 'Sage');
  assert.equal(c.alignment, 'Lawful Good'); assert.equal(c.pronouns, 'she/her'); assert.equal(c.stats.level, 12);
});

test('story text has no unfilled placeholders', () => {
  for (const c of many(1000)) {
    const t = characterText(c);
    assert.doesNotMatch(t, /\{[^}]*\}|undefined|NaN|\bnull\b/, c.seed);
  }
});
