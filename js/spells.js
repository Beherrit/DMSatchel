// Spell lists by class and level (5e SRD spell names) and the spellbook builder used by characters and NPCs.
import { FULL_SLOTS, pactSlots } from './rules2024.js';

const L = (s) => s.split(', ');
export const SPELLS = {
  Wizard: [
    L('Acid Splash, Chill Touch, Dancing Lights, Fire Bolt, Light, Mage Hand, Mending, Message, Minor Illusion, Poison Spray, Prestidigitation, Ray of Frost, Shocking Grasp, True Strike'),
    L('Burning Hands, Charm Person, Chromatic Orb, Color Spray, Comprehend Languages, Detect Magic, Disguise Self, Expeditious Retreat, False Life, Feather Fall, Find Familiar, Fog Cloud, Grease, Identify, Mage Armor, Magic Missile, Shield, Silent Image, Sleep, Thunderwave, Unseen Servant'),
    L('Arcane Lock, Blindness/Deafness, Blur, Darkness, Darkvision, Detect Thoughts, Enlarge/Reduce, Flaming Sphere, Hold Person, Invisibility, Knock, Levitate, Magic Weapon, Mirror Image, Misty Step, Ray of Enfeeblement, Scorching Ray, See Invisibility, Shatter, Spider Climb, Suggestion, Web'),
    L('Animate Dead, Bestow Curse, Blink, Clairvoyance, Counterspell, Dispel Magic, Fear, Fireball, Fly, Gaseous Form, Haste, Hypnotic Pattern, Lightning Bolt, Major Image, Protection from Energy, Slow, Stinking Cloud, Tongues, Vampiric Touch, Water Breathing'),
    L('Arcane Eye, Banishment, Blight, Confusion, Dimension Door, Fire Shield, Greater Invisibility, Ice Storm, Phantasmal Killer, Polymorph, Stoneskin, Wall of Fire'),
    L('Animate Objects, Cloudkill, Cone of Cold, Dominate Person, Hold Monster, Legend Lore, Passwall, Scrying, Telekinesis, Teleportation Circle, Wall of Force, Wall of Stone'),
    L('Chain Lightning, Circle of Death, Disintegrate, Eyebite, Flesh to Stone, Globe of Invulnerability, Mass Suggestion, True Seeing'),
    L('Delayed Blast Fireball, Etherealness, Finger of Death, Forcecage, Plane Shift, Prismatic Spray, Reverse Gravity, Teleport'),
    L('Antimagic Field, Clone, Dominate Monster, Feeblemind, Maze, Mind Blank, Power Word Stun, Sunburst'),
    L('Foresight, Gate, Imprisonment, Meteor Swarm, Power Word Kill, Time Stop, Wish'),
  ],
  Cleric: [
    L('Guidance, Light, Mending, Resistance, Sacred Flame, Spare the Dying, Thaumaturgy'),
    L('Bane, Bless, Command, Cure Wounds, Detect Evil and Good, Detect Magic, Guiding Bolt, Healing Word, Inflict Wounds, Protection from Evil and Good, Sanctuary, Shield of Faith'),
    L('Aid, Augury, Blindness/Deafness, Calm Emotions, Enhance Ability, Hold Person, Lesser Restoration, Prayer of Healing, Silence, Spiritual Weapon, Warding Bond, Zone of Truth'),
    L('Animate Dead, Beacon of Hope, Bestow Curse, Clairvoyance, Daylight, Dispel Magic, Mass Healing Word, Protection from Energy, Remove Curse, Revivify, Speak with Dead, Spirit Guardians, Tongues'),
    L('Banishment, Death Ward, Divination, Freedom of Movement, Guardian of Faith, Locate Creature, Stone Shape'),
    L('Commune, Flame Strike, Greater Restoration, Hallow, Insect Plague, Legend Lore, Mass Cure Wounds, Raise Dead, Scrying'),
    L('Blade Barrier, Find the Path, Harm, Heal, Heroes’ Feast, Planar Ally, True Seeing, Word of Recall'),
    L('Conjure Celestial, Divine Word, Fire Storm, Plane Shift, Regenerate, Resurrection, Symbol'),
    L('Antimagic Field, Control Weather, Earthquake, Holy Aura'),
    L('Astral Projection, Gate, Mass Heal, True Resurrection'),
  ],
  Druid: [
    L('Druidcraft, Guidance, Mending, Poison Spray, Produce Flame, Resistance, Shillelagh, Thorn Whip'),
    L('Animal Friendship, Charm Person, Create or Destroy Water, Cure Wounds, Detect Magic, Entangle, Faerie Fire, Fog Cloud, Goodberry, Healing Word, Jump, Longstrider, Speak with Animals, Thunderwave'),
    L('Animal Messenger, Barkskin, Darkvision, Flame Blade, Flaming Sphere, Gust of Wind, Heat Metal, Hold Person, Lesser Restoration, Moonbeam, Pass without Trace, Spike Growth'),
    L('Call Lightning, Conjure Animals, Daylight, Dispel Magic, Plant Growth, Protection from Energy, Sleet Storm, Speak with Plants, Water Breathing, Wind Wall'),
    L('Blight, Confusion, Conjure Woodland Beings, Dominate Beast, Freedom of Movement, Giant Insect, Ice Storm, Polymorph, Stoneskin, Wall of Fire'),
    L('Awaken, Commune with Nature, Conjure Elemental, Greater Restoration, Insect Plague, Mass Cure Wounds, Reincarnate, Scrying, Tree Stride, Wall of Stone'),
    L('Conjure Fey, Find the Path, Heal, Heroes’ Feast, Move Earth, Sunbeam, Transport via Plants, Wall of Thorns'),
    L('Fire Storm, Mirage Arcane, Plane Shift, Regenerate, Reverse Gravity'),
    L('Animal Shapes, Antipathy/Sympathy, Control Weather, Earthquake, Sunburst'),
    L('Foresight, Shapechange, Storm of Vengeance, True Resurrection'),
  ],
  Bard: [
    L('Dancing Lights, Light, Mage Hand, Mending, Message, Minor Illusion, Prestidigitation, True Strike, Vicious Mockery'),
    L('Animal Friendship, Bane, Charm Person, Comprehend Languages, Cure Wounds, Detect Magic, Disguise Self, Dissonant Whispers, Faerie Fire, Feather Fall, Healing Word, Heroism, Hideous Laughter, Identify, Silent Image, Sleep, Thunderwave'),
    L('Animal Messenger, Blindness/Deafness, Calm Emotions, Detect Thoughts, Enhance Ability, Enthrall, Heat Metal, Hold Person, Invisibility, Knock, Lesser Restoration, See Invisibility, Shatter, Silence, Suggestion, Zone of Truth'),
    L('Bestow Curse, Clairvoyance, Dispel Magic, Fear, Glyph of Warding, Hypnotic Pattern, Major Image, Nondetection, Plant Growth, Sending, Speak with Dead, Stinking Cloud, Tongues'),
    L('Compulsion, Confusion, Dimension Door, Freedom of Movement, Greater Invisibility, Hallucinatory Terrain, Locate Creature, Polymorph'),
    L('Animate Objects, Awaken, Dominate Person, Dream, Geas, Greater Restoration, Hold Monster, Legend Lore, Mass Cure Wounds, Mislead, Modify Memory, Raise Dead, Scrying, Seeming, Teleportation Circle'),
    L('Eyebite, Find the Path, Guards and Wards, Irresistible Dance, Mass Suggestion, Programmed Illusion, True Seeing'),
    L('Etherealness, Forcecage, Magnificent Mansion, Mirage Arcane, Project Image, Regenerate, Resurrection, Symbol, Teleport'),
    L('Dominate Monster, Feeblemind, Glibness, Mind Blank, Power Word Stun'),
    L('Foresight, Power Word Kill, True Polymorph'),
  ],
  Sorcerer: [
    L('Acid Splash, Chill Touch, Dancing Lights, Fire Bolt, Light, Mage Hand, Mending, Message, Minor Illusion, Poison Spray, Prestidigitation, Ray of Frost, Shocking Grasp, True Strike'),
    L('Burning Hands, Charm Person, Chromatic Orb, Color Spray, Comprehend Languages, Detect Magic, Disguise Self, Expeditious Retreat, False Life, Feather Fall, Fog Cloud, Jump, Mage Armor, Magic Missile, Shield, Silent Image, Sleep, Thunderwave'),
    L('Alter Self, Blindness/Deafness, Blur, Darkness, Darkvision, Detect Thoughts, Enhance Ability, Enlarge/Reduce, Gust of Wind, Hold Person, Invisibility, Knock, Levitate, Mirror Image, Misty Step, Scorching Ray, See Invisibility, Shatter, Spider Climb, Suggestion, Web'),
    L('Blink, Clairvoyance, Counterspell, Daylight, Dispel Magic, Fear, Fireball, Fly, Gaseous Form, Haste, Hypnotic Pattern, Lightning Bolt, Major Image, Protection from Energy, Sleet Storm, Slow, Stinking Cloud, Tongues, Water Breathing'),
    L('Banishment, Blight, Confusion, Dimension Door, Dominate Beast, Greater Invisibility, Ice Storm, Polymorph, Stoneskin, Wall of Fire'),
    L('Animate Objects, Cloudkill, Cone of Cold, Creation, Dominate Person, Hold Monster, Insect Plague, Seeming, Telekinesis, Teleportation Circle, Wall of Stone'),
    L('Chain Lightning, Circle of Death, Disintegrate, Eyebite, Globe of Invulnerability, Mass Suggestion, Move Earth, Sunbeam, True Seeing'),
    L('Delayed Blast Fireball, Etherealness, Finger of Death, Fire Storm, Plane Shift, Prismatic Spray, Reverse Gravity, Teleport'),
    L('Dominate Monster, Earthquake, Incendiary Cloud, Power Word Stun, Sunburst'),
    L('Gate, Meteor Swarm, Power Word Kill, Time Stop, Wish'),
  ],
  Warlock: [
    L('Chill Touch, Eldritch Blast, Mage Hand, Minor Illusion, Poison Spray, Prestidigitation, True Strike'),
    L('Armor of Agathys, Charm Person, Comprehend Languages, Expeditious Retreat, Hellish Rebuke, Hex, Illusory Script, Protection from Evil and Good, Unseen Servant, Witch Bolt'),
    L('Darkness, Enthrall, Hold Person, Invisibility, Mirror Image, Misty Step, Ray of Enfeeblement, Shatter, Spider Climb, Suggestion'),
    L('Counterspell, Dispel Magic, Fear, Fly, Gaseous Form, Hunger of Hadar, Hypnotic Pattern, Magic Circle, Major Image, Remove Curse, Tongues, Vampiric Touch'),
    L('Banishment, Blight, Dimension Door, Hallucinatory Terrain'),
    L('Contact Other Plane, Dream, Hold Monster, Scrying'),
    L('Circle of Death, Conjure Fey, Create Undead, Eyebite, Flesh to Stone, Mass Suggestion, True Seeing'),
    L('Etherealness, Finger of Death, Forcecage, Plane Shift'),
    L('Demiplane, Dominate Monster, Feeblemind, Glibness, Power Word Stun'),
    L('Astral Projection, Foresight, Imprisonment, Power Word Kill, True Polymorph'),
  ],
  Paladin: [
    [],
    L('Bless, Command, Compelled Duel, Cure Wounds, Detect Evil and Good, Detect Magic, Divine Favor, Heroism, Protection from Evil and Good, Searing Smite, Shield of Faith, Thunderous Smite, Wrathful Smite'),
    L('Aid, Branding Smite, Find Steed, Lesser Restoration, Locate Object, Magic Weapon, Zone of Truth'),
    L('Aura of Vitality, Blinding Smite, Create Food and Water, Crusader’s Mantle, Daylight, Dispel Magic, Magic Circle, Remove Curse, Revivify'),
    L('Aura of Life, Aura of Purity, Banishment, Death Ward, Locate Creature, Staggering Smite'),
    L('Banishing Smite, Circle of Power, Destructive Wave, Dispel Evil and Good, Geas, Raise Dead'),
  ],
  Ranger: [
    [],
    L('Alarm, Animal Friendship, Cure Wounds, Detect Magic, Detect Poison and Disease, Ensnaring Strike, Fog Cloud, Goodberry, Hail of Thorns, Hunter’s Mark, Jump, Longstrider, Speak with Animals'),
    L('Animal Messenger, Barkskin, Darkvision, Find Traps, Lesser Restoration, Locate Animals or Plants, Locate Object, Pass without Trace, Protection from Poison, Silence, Spike Growth'),
    L('Conjure Animals, Conjure Barrage, Daylight, Lightning Arrow, Nondetection, Plant Growth, Protection from Energy, Speak with Plants, Water Breathing, Water Walk, Wind Wall'),
    L('Conjure Woodland Beings, Freedom of Movement, Grasping Vine, Locate Creature, Stoneskin'),
    L('Commune with Nature, Conjure Volley, Swift Quiver, Tree Stride'),
  ],
};
// Eldritch Knights and Arcane Tricksters learn wizard spells.
SPELLS['Eldritch Knight'] = SPELLS.Wizard;
SPELLS['Arcane Trickster'] = SPELLS.Wizard;

// Spells prepared at each class level (index 1..20) and cantrips known, following the 2024 class tables.
const FULL_PREP = [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
const SORC_PREP = [0, 2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
const PACT_PREP = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15];
const HALF_PREP = [0, 2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15];
const THIRD_PREP = [0, 0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];
export const PREPARED = { Bard: FULL_PREP, Cleric: FULL_PREP, Druid: FULL_PREP, Wizard: FULL_PREP, Sorcerer: SORC_PREP, Warlock: PACT_PREP, Paladin: HALF_PREP, Ranger: HALF_PREP, 'Eldritch Knight': THIRD_PREP, 'Arcane Trickster': THIRD_PREP };
const CANTRIPS = { Bard: [2, 3, 4], Cleric: [3, 4, 5], Druid: [2, 3, 4], Sorcerer: [4, 5, 6], Warlock: [2, 3, 4], Wizard: [3, 4, 5], 'Eldritch Knight': [2, 2, 3], 'Arcane Trickster': [3, 3, 4] };
export const cantripsKnown = (cls, level) => { const c = CANTRIPS[cls]; if (!c) return 0; return level >= 10 ? c[2] : level >= 4 ? c[1] : c[0]; };

export const ORD = ['Cantrips', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const sign = (n) => (n >= 0 ? `+${n}` : `−${-n}`);

// Spell slots for a kind of caster ('full', 'half', 'third', 'pact') at a class level: { slots: [n for 1st..9th] }
// or { pact: [count, level] }.
const CASTER_OF = { Bard: 'full', Cleric: 'full', Druid: 'full', Sorcerer: 'full', Wizard: 'full', Paladin: 'half', Ranger: 'half', 'Eldritch Knight': 'third', 'Arcane Trickster': 'third', Warlock: 'pact' };
export function casterSlots(kind, level) {
  if (kind === 'pact') return { pact: pactSlots(level) };
  const caster = { full: 1, half: 2, third: 3 }[kind];
  if (!caster) return null;
  const casterLevel = caster === 1 ? level : Math.ceil(level / caster);
  if (caster === 3 && level < 3) return null;
  return { slots: [...(FULL_SLOTS[Math.max(1, casterLevel)] || [])] };
}
export const slotsFor = (cls, level) => casterSlots(CASTER_OF[cls], level);

// Choose prepared spells: spread across every level the caster can cast, a few more at the lower levels.
// `like` ({ list, caster }) is for classes from your library: cast as `caster` from the SRD class `list`'s spells.
const PREP_FOR = { full: FULL_PREP, half: HALF_PREP, third: THIRD_PREP, pact: PACT_PREP };
export function spellbook(cls, level, rng, { ability, mod, pb }, like = null) {
  const key = like ? like.list : cls;
  const list = SPELLS[key]; const slots = like ? casterSlots(like.caster, level) : slotsFor(cls, level);
  if (!list || !slots) return null;
  const maxLevel = slots.pact ? slots.pact[1] : slots.slots.length;
  const cantrips = rng.sample(list[0] || [], cantripsKnown(key, level));
  const count = (like ? PREP_FOR[like.caster] : PREPARED[cls] || FULL_PREP)[level] || 0;
  const byLevel = {};
  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1).filter((l) => (list[l] || []).length);
  const pool = Object.fromEntries(levels.map((l) => [l, rng.shuffle(list[l])]));
  let left = count;
  // At least one spell of every castable level, highest first so top slots have something to cast.
  for (const l of [...levels].reverse()) if (left > 0 && pool[l].length) { (byLevel[l] ||= []).push(pool[l].shift()); left--; }
  while (left > 0) {
    const weights = Object.fromEntries(levels.filter((l) => pool[l].length).map((l) => [l, Math.max(1, 8 - l)]));
    if (!Object.keys(weights).length) break;
    const l = rng.pickW(weights); (byLevel[l] ||= []).push(pool[l].shift()); left--;
  }
  for (const l of Object.keys(byLevel)) byLevel[l].sort();
  return { cls, level, ability, dc: 8 + pb + mod, attack: pb + mod, ...slots, cantrips: cantrips.sort(), byLevel, prepared: count };
}

const ABIL = { Int: 'Intelligence', Wis: 'Wisdom', Cha: 'Charisma' };
// Plain-text form saved on NPC entries; renderSpells (statblock-ui.js) turns it back into a block with slot pips.
export function spellText(sb) {
  if (!sb) return '';
  const lines = [`${sb.cls} ${sb.level} · ${ABIL[sb.ability] || sb.ability} · Save DC ${sb.dc} · Spell attack ${sign(sb.attack)}`];
  lines.push(sb.pact ? `Pact slots: ${sb.pact[0]} × ${ORD[sb.pact[1]]}` : `Slots: ${sb.slots.map((n, i) => `${ORD[i + 1]} ${n}`).join(' · ')}`);
  if (sb.cantrips.length) lines.push(`Cantrips: ${sb.cantrips.join(', ')}`);
  for (const [l, names] of Object.entries(sb.byLevel).sort((a, b) => a[0] - b[0])) lines.push(`${ORD[l]}: ${names.join(', ')}`);
  return lines.join('\n');
}
