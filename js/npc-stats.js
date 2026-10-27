// Stat blocks for NPCs. A role ("hedge wizard", "guard captain") picks a class and level; the character
// generator does the maths, and the result is saved on the NPC as plain text a GM can edit.
import { makeRng, randomSeed } from './rng.js';
import { generateCharacter, abilityMod, fmtMod } from './character.js';
import { ABILITIES, CLASSES, SPECIES } from './rules2024.js';
import { spellText } from './spells.js';

// [pattern, class, minLevel, maxLevel], first match wins.
const ROLE_CLASSES = [
  [/court wizard|archmage(?!’s apprentice)/, 'Wizard', 7, 11], [/archmage’s apprentice|apprentice wizard/, 'Wizard', 3, 5],
  [/hedge wizard|wizard|sage|scholar|astrologer/, 'Wizard', 2, 6], [/alchemist/, 'Wizard', 1, 3],
  [/high priest|abbess|archbishop/, 'Cleric', 7, 11], [/oracle/, 'Cleric', 4, 7], [/exorcist/, 'Cleric', 5, 7],
  [/priest|acolyte|pilgrim|gravekeeper|preacher|monk.*temple|healer/, 'Cleric', 1, 4],
  [/druid|hedge-witch|witch/, 'Druid', 2, 6], [/bard|singer|minstrel|fiddler/, 'Bard', 2, 6],
  [/fortune teller|cultist|warlock/, 'Warlock', 1, 5], [/monk/, 'Monk', 2, 6],
  [/knight|paladin|templar/, 'Paladin', 3, 8],
  [/captain|commander|castellan|marshal|general/, 'Fighter', 5, 9], [/sergeant|veteran|soldier|quartermaster|siege|mercenary|sellsword|bouncer|temple guard|guard/, 'Fighter', 1, 5],
  [/bounty hunter|ranger|scout|trapper|hunter/, 'Ranger', 2, 6],
  [/assassin/, 'Rogue', 7, 11], [/spy|agent|informant|smuggler|cutpurse|con artist|forger|fence|thief|debt collector|urchin|turncoat/, 'Rogue', 1, 5],
  [/barbarian|berserker|pit fighter|warlord/, 'Barbarian', 3, 7], [/sorcer/, 'Sorcerer', 2, 6],
];
export const NPC_CLASS_OPTIONS = ['auto', 'commoner', ...Object.keys(CLASSES)];

export function classForRole(role, rng) {
  const r = String(role || '').toLowerCase();
  const hit = ROLE_CLASSES.find(([re]) => re.test(r));
  if (!hit) return null;
  return { cls: hit[1], level: rng.range(hit[2], hit[3]) };
}

const abilityLine = (s) => ABILITIES.map((a) => `${a.toUpperCase()} ${s[a]} (${fmtMod(abilityMod(s[a])).replace('-', '−')})`).join(' · ');

function commoner(ancestry, rng) {
  const s = Object.fromEntries(ABILITIES.map((a) => [a, rng.range(8, 12)]));
  const con = abilityMod(s.Con), dex = abilityMod(s.Dex), sp = SPECIES[ancestry] || SPECIES.Human;
  const hpRoll = Math.max(1, rng.range(1, 8) + con);
  const weapon = rng.pick([['Club', '1d4', 'bludgeoning'], ['Dagger', '1d4', 'piercing'], ['Pitchfork', '1d6', 'piercing'], ['Cudgel', '1d4', 'bludgeoning'], ['Kitchen knife', '1d4', 'slashing']]);
  const strMod = abilityMod(s.Str);
  return {
    level: 'Commoner',
    stats: [
      `AC ${10 + dex} · HP ${hpRoll} (1d8${con ? fmtMod(con) : ''}) · Speed ${sp.speed} ft · Initiative ${fmtMod(dex)}`,
      abilityLine(s),
      `Attack: ${weapon[0]} ${fmtMod(2 + strMod)} to hit, ${weapon[1]}${strMod ? fmtMod(strMod) : ''} ${weapon[2]}`,
      `Senses: Passive Perception ${10 + abilityMod(s.Wis)}${sp.darkvision ? `, Darkvision ${sp.darkvision} ft` : ''}`,
      'Proficiency +2',
    ].join('\n'),
    spells: '',
  };
}

// opts: { cls: 'auto' | 'commoner' | <class>, level }
export function npcStats({ role, ancestry = 'Human', cls = 'auto', level } = {}, seed = randomSeed()) {
  const rng = makeRng(`${seed}:npc`);
  let pick = cls === 'auto' ? classForRole(role, rng) : cls === 'commoner' ? null : { cls, level: level || rng.range(1, 5) };
  if (pick && level) pick.level = level;
  if (!pick) return commoner(SPECIES[ancestry] ? ancestry : 'Human', rng);
  const ch = generateCharacter({ cls: pick.cls, level: pick.level, species: SPECIES[ancestry] ? ancestry : 'Human' }, seed);
  const s = ch.stats, a = ch.abilities.scores, c = CLASSES[ch.cls];
  const conMod = abilityMod(a.Con);
  const lines = [
    `AC ${s.ac} (${s.acNote}) · HP ${s.hp} (${s.level}d${c.die}${conMod ? fmtMod(conMod * s.level) : ''}) · Speed ${s.speed} ft · Initiative ${fmtMod(s.initiative)}`,
    abilityLine(a),
    `Saves: ${s.saves.filter((x) => x.prof).map((x) => `${x.ability} ${fmtMod(x.mod)}`).join(', ')}`,
    `Skills: ${s.skills.filter((x) => x.prof).map((x) => `${x.name} ${fmtMod(x.mod)}`).join(', ')}`,
    `Attack: ${s.weapon.name} ${fmtMod(s.weapon.toHit)} to hit, ${s.weapon.damage}${s.weapon.attacks > 1 ? ` (${s.weapon.attacks} attacks)` : ''}`,
    `Senses: Passive Perception ${s.passive}${s.darkvision ? `, Darkvision ${s.darkvision} ft` : ''}`,
    s.resources.length ? `Resources: ${s.resources.join('; ')}` : '',
    `Features: ${[...new Set(s.features.map((f) => f.name.replace(/^Subclass: /, '')))].filter((f) => !/feature$/.test(f)).slice(-8).join(', ')}`,
    `Proficiency ${fmtMod(s.pb)}`,
  ].filter(Boolean);
  return { level: `${ch.cls} ${s.level}${ch.subclass ? ` (${ch.subclass})` : ''}`, stats: lines.join('\n'), spells: spellText(s.spellbook) };
}
