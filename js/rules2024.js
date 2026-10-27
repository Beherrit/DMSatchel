// Fifth-edition (2024 revision) character rules: species, classes, backgrounds and feats.
// Only rule facts (names, numbers, proficiencies) live here; every description is original text.

export const ABILITIES = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
export const ABILITY_NAMES = { Str: 'Strength', Dex: 'Dexterity', Con: 'Constitution', Int: 'Intelligence', Wis: 'Wisdom', Cha: 'Charisma' };

export const SKILLS = {
  Acrobatics: 'Dex', 'Animal Handling': 'Wis', Arcana: 'Int', Athletics: 'Str', Deception: 'Cha', History: 'Int',
  Insight: 'Wis', Intimidation: 'Cha', Investigation: 'Int', Medicine: 'Wis', Nature: 'Int', Perception: 'Wis',
  Performance: 'Cha', Persuasion: 'Cha', Religion: 'Int', 'Sleight of Hand': 'Dex', Stealth: 'Dex', Survival: 'Wis',
};

export const STANDARD_LANGUAGES = ['Common Sign Language', 'Draconic', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc'];

// ---- species ----------------------------------------------------------------------------------

export const SPECIES = {
  Aasimar: {
    size: 'Medium or Small', speed: 30, darkvision: 60, age: [18, 120], height: [5, 6.5],
    traits: [
      ['Celestial Resistance', 'Resistance to necrotic and radiant damage.'],
      ['Healing Hands', 'Once per long rest, touch a creature and heal it a number of d4s equal to your proficiency bonus.'],
      ['Light Bearer', 'You know the Light cantrip (Charisma).'],
      ['Celestial Revelation', 'From level 3, transform for a minute once per long rest.', 3],
    ],
    lineages: { 'Heavenly Wings': 'Spectral wings give a fly speed while transformed.', 'Inner Radiance': 'Searing light pours from you while transformed.', 'Necrotic Shroud': 'Your eyes turn to pools of darkness and can frighten foes.' },
    lineageLabel: 'Revelation',
  },
  Dragonborn: {
    size: 'Medium', speed: 30, darkvision: 60, age: [15, 70], height: [5.5, 7],
    traits: [
      ['Draconic Ancestry', 'Your ancestry sets your breath and resistance damage type.'],
      ['Breath Weapon', 'Replace an attack with a 15-ft cone or 30-ft line of elemental breath (Dex save).'],
      ['Damage Resistance', 'Resistance to your ancestry’s damage type.'],
      ['Draconic Flight', 'From level 5, sprout spectral wings for 10 minutes once per long rest.', 5],
    ],
    lineages: { Black: 'Acid', Blue: 'Lightning', Brass: 'Fire', Bronze: 'Lightning', Copper: 'Acid', Gold: 'Fire', Green: 'Poison', Red: 'Fire', Silver: 'Cold', White: 'Cold' },
    lineageLabel: 'Ancestry',
  },
  Dwarf: {
    size: 'Medium', speed: 30, darkvision: 120, age: [40, 350], height: [4, 5],
    traits: [
      ['Dwarven Resilience', 'Resistance to poison damage; advantage on saves against the poisoned condition.'],
      ['Dwarven Toughness', 'Your hit point maximum increases by 1 per level.'],
      ['Stonecunning', 'As a bonus action, gain tremorsense 60 ft while on stone, a few times per long rest.'],
    ],
  },
  Elf: {
    size: 'Medium', speed: 30, darkvision: 60, age: [100, 700], height: [5, 6.2],
    traits: [
      ['Fey Ancestry', 'Advantage on saves to avoid or end the charmed condition.'],
      ['Keen Senses', 'Proficiency in Insight, Perception or Survival.'],
      ['Trance', 'You finish a long rest in 4 hours of meditation and can’t be magically put to sleep.'],
    ],
    lineages: { Drow: 'Darkvision 120 ft; Dancing Lights, later Faerie Fire and Darkness.', 'High Elf': 'Prestidigitation (swap it each long rest), later Detect Magic and Misty Step.', 'Wood Elf': 'Speed 35 ft; Druidcraft, later Longstrider and Pass without Trace.' },
    lineageLabel: 'Lineage',
  },
  Gnome: {
    size: 'Small', speed: 30, darkvision: 60, age: [40, 425], height: [3, 4],
    traits: [
      ['Gnomish Cunning', 'Advantage on Intelligence, Wisdom and Charisma saving throws.'],
    ],
    lineages: { 'Forest Gnome': 'Minor Illusion; Speak with Animals a few times per long rest.', 'Rock Gnome': 'Mending and Prestidigitation; build tiny clockwork devices.' },
    lineageLabel: 'Lineage',
  },
  Goliath: {
    size: 'Medium', speed: 35, darkvision: 0, age: [18, 90], height: [7, 8],
    traits: [
      ['Giant Ancestry', 'A supernatural boon from your giant forebears, usable a few times per long rest.'],
      ['Large Form', 'From level 5, become Large for 10 minutes once per long rest.', 5],
      ['Powerful Build', 'Advantage on checks to end being grappled; you count as one size larger for carrying.'],
    ],
    lineages: { 'Cloud’s Jaunt': 'Teleport 30 ft as a bonus action.', 'Fire’s Burn': 'Add fire damage when you hit.', 'Frost’s Chill': 'Add cold damage and slow the target.', 'Hill’s Tumble': 'Knock a Large or smaller target prone when you hit.', 'Stone’s Endurance': 'Reduce damage you take as a reaction.', 'Storm’s Thunder': 'Deal thunder damage to an attacker as a reaction.' },
    lineageLabel: 'Giant ancestry',
  },
  Halfling: {
    size: 'Small', speed: 30, darkvision: 0, age: [20, 150], height: [2.8, 3.4],
    traits: [
      ['Brave', 'Advantage on saves to avoid or end the frightened condition.'],
      ['Halfling Nimbleness', 'You can move through the space of any creature larger than you.'],
      ['Luck', 'Reroll a 1 on a d20 test.'],
      ['Naturally Stealthy', 'You can hide behind a creature at least one size larger than you.'],
    ],
  },
  Human: {
    size: 'Medium or Small', speed: 30, darkvision: 0, age: [18, 80], height: [4.8, 6.4],
    traits: [
      ['Resourceful', 'You gain Heroic Inspiration whenever you finish a long rest.'],
      ['Skillful', 'Proficiency in one skill of your choice.'],
      ['Versatile', 'You gain an Origin feat of your choice.'],
    ],
  },
  Orc: {
    size: 'Medium', speed: 30, darkvision: 120, age: [14, 75], height: [6, 7],
    traits: [
      ['Adrenaline Rush', 'Dash as a bonus action and gain temporary hit points, a few times per short rest.'],
      ['Relentless Endurance', 'Once per long rest, drop to 1 hit point instead of 0.'],
    ],
  },
  Tiefling: {
    size: 'Medium or Small', speed: 30, darkvision: 60, age: [18, 100], height: [4.8, 6.3],
    traits: [
      ['Otherworldly Presence', 'You know the Thaumaturgy cantrip.'],
    ],
    lineages: { Abyssal: 'Poison resistance; Poison Spray, later Ray of Sickness and Hold Person.', Chthonic: 'Necrotic resistance; Chill Touch, later False Life and Ray of Enfeeblement.', Infernal: 'Fire resistance; Fire Bolt, later Hellish Rebuke and Darkness.' },
    lineageLabel: 'Fiendish legacy',
  },
};
export const SPECIES_WEIGHTS = { Human: 22, Elf: 13, Dwarf: 11, Halfling: 9, Dragonborn: 8, Tiefling: 9, Gnome: 7, Orc: 8, Goliath: 7, Aasimar: 6 };

// ---- origin feats -----------------------------------------------------------------------------

export const ORIGIN_FEATS = {
  Alert: 'Add your proficiency bonus to initiative, and you can swap initiative with a willing ally.',
  Crafter: 'Proficiency with three artisan’s tools, a discount on nonmagical gear, and fast crafting.',
  Healer: 'Use a healer’s kit to let a creature spend a Hit Die; reroll 1s on healing dice.',
  Lucky: 'Luck points equal to your proficiency bonus give advantage, or impose disadvantage on attackers.',
  'Magic Initiate (Cleric)': 'Two cleric cantrips and one 1st-level cleric spell, castable once free per long rest.',
  'Magic Initiate (Druid)': 'Two druid cantrips and one 1st-level druid spell, castable once free per long rest.',
  'Magic Initiate (Wizard)': 'Two wizard cantrips and one 1st-level wizard spell, castable once free per long rest.',
  Musician: 'Proficiency with three instruments; after a rest, play to give allies Heroic Inspiration.',
  'Savage Attacker': 'Once per turn, roll a weapon’s damage dice twice and use either roll.',
  Skilled: 'Proficiency in any combination of three skills or tools.',
  'Tavern Brawler': 'Stronger unarmed strikes, reroll 1s on them, and shove when you hit.',
  Tough: 'Your hit point maximum increases by 2 per level.',
};

export const GENERAL_FEATS = {
  martial: ['Great Weapon Master', 'Sentinel', 'Polearm Master', 'Sharpshooter', 'Crossbow Expert', 'Dual Wielder', 'Shield Master', 'Mobile', 'Charger', 'Durable', 'Grappler', 'Slasher', 'Piercer', 'Crusher', 'Athlete', 'Mage Slayer', 'Resilient'],
  caster: ['War Caster', 'Resilient', 'Spell Sniper', 'Elemental Adept', 'Fey Touched', 'Shadow Touched', 'Telekinetic', 'Telepathic', 'Ritual Caster', 'Keen Mind', 'Inspiring Leader', 'Observant', 'Lightly Armored', 'Skill Expert'],
  skill: ['Skulker', 'Skill Expert', 'Observant', 'Actor', 'Keen Mind', 'Speedy', 'Mobile', 'Resilient', 'Chef', 'Poisoner', 'Inspiring Leader'],
};
export const EPIC_BOONS = ['Boon of Combat Prowess', 'Boon of Dimensional Travel', 'Boon of Energy Resistance', 'Boon of Fate', 'Boon of Fortitude', 'Boon of Irresistible Offense', 'Boon of Recovery', 'Boon of Skill', 'Boon of Speed', 'Boon of Spell Recall', 'Boon of the Night Spirit', 'Boon of Truesight'];

// ---- backgrounds ------------------------------------------------------------------------------

export const BACKGROUNDS = {
  Acolyte: { abilities: ['Int', 'Wis', 'Cha'], feat: 'Magic Initiate (Cleric)', skills: ['Insight', 'Religion'], tool: 'Calligrapher’s Supplies', gear: 'Calligrapher’s Supplies, book of prayers, holy symbol, parchment (10 sheets), robe, 8 GP' },
  Artisan: { abilities: ['Str', 'Dex', 'Int'], feat: 'Crafter', skills: ['Investigation', 'Persuasion'], tool: 'one kind of Artisan’s Tools', gear: 'Artisan’s Tools, 2 pouches, traveler’s clothes, 32 GP' },
  Charlatan: { abilities: ['Dex', 'Con', 'Cha'], feat: 'Skilled', skills: ['Deception', 'Sleight of Hand'], tool: 'Forgery Kit', gear: 'Forgery Kit, costume, fine clothes, 15 GP' },
  Criminal: { abilities: ['Dex', 'Con', 'Int'], feat: 'Alert', skills: ['Sleight of Hand', 'Stealth'], tool: 'Thieves’ Tools', gear: '2 daggers, Thieves’ Tools, crowbar, 2 pouches, traveler’s clothes, 16 GP' },
  Entertainer: { abilities: ['Str', 'Dex', 'Cha'], feat: 'Musician', skills: ['Acrobatics', 'Performance'], tool: 'one Musical Instrument', gear: 'Musical instrument, 2 costumes, mirror, perfume, traveler’s clothes, 11 GP' },
  Farmer: { abilities: ['Str', 'Con', 'Wis'], feat: 'Tough', skills: ['Animal Handling', 'Nature'], tool: 'Carpenter’s Tools', gear: 'Sickle, Carpenter’s Tools, healer’s kit, iron pot, shovel, traveler’s clothes, 30 GP' },
  Guard: { abilities: ['Str', 'Int', 'Wis'], feat: 'Alert', skills: ['Athletics', 'Perception'], tool: 'one Gaming Set', gear: 'Spear, light crossbow, 20 bolts, gaming set, hooded lantern, manacles, quiver, traveler’s clothes, 12 GP' },
  Guide: { abilities: ['Dex', 'Con', 'Wis'], feat: 'Magic Initiate (Druid)', skills: ['Stealth', 'Survival'], tool: 'Cartographer’s Tools', gear: 'Shortbow, 20 arrows, Cartographer’s Tools, bedroll, quiver, tent, traveler’s clothes, 3 GP' },
  Hermit: { abilities: ['Con', 'Wis', 'Cha'], feat: 'Healer', skills: ['Medicine', 'Religion'], tool: 'Herbalism Kit', gear: 'Quarterstaff, Herbalism Kit, bedroll, book of philosophy, lamp, oil (3 flasks), traveler’s clothes, 16 GP' },
  Merchant: { abilities: ['Con', 'Int', 'Cha'], feat: 'Lucky', skills: ['Animal Handling', 'Persuasion'], tool: 'Navigator’s Tools', gear: 'Navigator’s Tools, 2 pouches, traveler’s clothes, 22 GP' },
  Noble: { abilities: ['Str', 'Int', 'Cha'], feat: 'Skilled', skills: ['History', 'Persuasion'], tool: 'one Gaming Set', gear: 'Gaming set, fine clothes, perfume, 29 GP' },
  Sage: { abilities: ['Con', 'Int', 'Wis'], feat: 'Magic Initiate (Wizard)', skills: ['Arcana', 'History'], tool: 'Calligrapher’s Supplies', gear: 'Quarterstaff, Calligrapher’s Supplies, book of history, parchment (8 sheets), robe, 8 GP' },
  Sailor: { abilities: ['Str', 'Dex', 'Wis'], feat: 'Tavern Brawler', skills: ['Acrobatics', 'Perception'], tool: 'Navigator’s Tools', gear: 'Dagger, Navigator’s Tools, rope, traveler’s clothes, 20 GP' },
  Scribe: { abilities: ['Dex', 'Int', 'Wis'], feat: 'Skilled', skills: ['Investigation', 'Perception'], tool: 'Calligrapher’s Supplies', gear: 'Calligrapher’s Supplies, fine clothes, lamp, oil (3 flasks), parchment (12 sheets), 23 GP' },
  Soldier: { abilities: ['Str', 'Dex', 'Con'], feat: 'Savage Attacker', skills: ['Athletics', 'Intimidation'], tool: 'one Gaming Set', gear: 'Spear, shortbow, 20 arrows, gaming set, healer’s kit, quiver, traveler’s clothes, 14 GP' },
  Wayfarer: { abilities: ['Dex', 'Wis', 'Cha'], feat: 'Lucky', skills: ['Insight', 'Stealth'], tool: 'Thieves’ Tools', gear: '2 daggers, Thieves’ Tools, gaming set, bedroll, 2 pouches, traveler’s clothes, 16 GP' },
};

// ---- classes ----------------------------------------------------------------------------------
// priority: ability order used to place scores. caster: full | half | pact | null.
// armor: how starting armor sets AC (see acFor in character.js). weapon: [name, dice, ability].

const ASI = 'Ability Score Improvement';
const SUB = 'Subclass feature';
export const CLASSES = {
  Barbarian: {
    die: 12, priority: ['Str', 'Con', 'Dex', 'Wis', 'Cha', 'Int'], saves: ['Str', 'Con'], skillCount: 2,
    skills: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    armorProf: 'Light and medium armor, shields', weaponProf: 'Simple and martial weapons',
    subclasses: ['Path of the Berserker', 'Path of the Wild Heart', 'Path of the World Tree', 'Path of the Zealot'],
    armor: 'barbarian', weapon: ['Greataxe', '1d12', 'Str'], caster: null,
    gear: 'Greataxe, 4 handaxes, explorer’s pack, 15 GP',
    features: { 1: ['Rage', 'Unarmored Defense', 'Weapon Mastery'], 2: ['Danger Sense', 'Reckless Attack'], 3: ['Primal Knowledge'], 4: [ASI], 5: ['Extra Attack', 'Fast Movement'], 6: [SUB], 7: ['Feral Instinct', 'Instinctive Pounce'], 8: [ASI], 9: ['Brutal Strike'], 10: [SUB], 11: ['Relentless Rage'], 12: [ASI], 13: ['Improved Brutal Strike'], 14: [SUB], 15: ['Persistent Rage'], 16: [ASI], 17: ['Improved Brutal Strike'], 18: ['Indomitable Might'], 19: ['Epic Boon'], 20: ['Primal Champion'] },
  },
  Bard: {
    die: 8, priority: ['Cha', 'Dex', 'Con', 'Wis', 'Int', 'Str'], saves: ['Dex', 'Cha'], skillCount: 3,
    skills: Object.keys(SKILLS), armorProf: 'Light armor', weaponProf: 'Simple weapons', tools: 'Three musical instruments',
    subclasses: ['College of Dance', 'College of Glamour', 'College of Lore', 'College of Valor'],
    armor: 'leather', weapon: ['Dagger', '1d4', 'Dex'], caster: 'full', spellAbility: 'Cha',
    gear: 'Leather armor, 2 daggers, musical instrument, entertainer’s pack, 19 GP',
    spells: { cantrips: ['Vicious Mockery', 'Minor Illusion', 'Mage Hand', 'Prestidigitation'], first: ['Healing Word', 'Charm Person', 'Faerie Fire', 'Dissonant Whispers', 'Thunderwave', 'Sleep'] },
    features: { 1: ['Bardic Inspiration', 'Spellcasting'], 2: ['Expertise', 'Jack of All Trades'], 4: [ASI], 5: ['Font of Inspiration'], 6: [SUB], 7: ['Countercharm'], 8: [ASI], 9: ['Expertise'], 10: ['Magical Secrets'], 12: [ASI], 14: [SUB], 16: [ASI], 18: ['Superior Inspiration'], 19: ['Epic Boon'], 20: ['Words of Creation'] },
  },
  Cleric: {
    die: 8, priority: ['Wis', 'Con', 'Str', 'Cha', 'Dex', 'Int'], saves: ['Wis', 'Cha'], skillCount: 2,
    skills: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'], armorProf: 'Light and medium armor, shields', weaponProf: 'Simple weapons',
    subclasses: ['Life Domain', 'Light Domain', 'Trickery Domain', 'War Domain'],
    armor: 'chainshirt-shield', weapon: ['Mace', '1d6', 'Str'], caster: 'full', spellAbility: 'Wis',
    gear: 'Chain shirt, shield, mace, holy symbol, priest’s pack, 7 GP',
    choices: { 'Divine Order': ['Protector (heavy armor and martial weapons)', 'Thaumaturge (an extra cantrip and a bonus to Arcana and Religion)'] },
    spells: { cantrips: ['Sacred Flame', 'Guidance', 'Thaumaturgy', 'Toll the Dead', 'Spare the Dying'], first: ['Bless', 'Cure Wounds', 'Healing Word', 'Guiding Bolt', 'Shield of Faith', 'Command', 'Sanctuary'] },
    features: { 1: ['Spellcasting', 'Divine Order'], 2: ['Channel Divinity'], 4: [ASI], 5: ['Sear Undead'], 6: [SUB], 7: ['Blessed Strikes'], 8: [ASI], 10: ['Divine Intervention'], 12: [ASI], 14: ['Improved Blessed Strikes'], 16: [ASI], 17: [SUB], 19: ['Epic Boon'], 20: ['Greater Divine Intervention'] },
  },
  Druid: {
    die: 8, priority: ['Wis', 'Con', 'Dex', 'Int', 'Cha', 'Str'], saves: ['Int', 'Wis'], skillCount: 2,
    skills: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'], armorProf: 'Light armor, shields', weaponProf: 'Simple weapons', tools: 'Herbalism Kit',
    subclasses: ['Circle of the Land', 'Circle of the Moon', 'Circle of the Sea', 'Circle of the Stars'],
    armor: 'leather-shield', weapon: ['Quarterstaff', '1d6', 'Str'], caster: 'full', spellAbility: 'Wis', languages: ['Druidic'],
    gear: 'Leather armor, shield, sickle, druidic focus (quarterstaff), explorer’s pack, herbalism kit, 9 GP',
    choices: { 'Primal Order': ['Magician (an extra cantrip and a bonus to Arcana and Nature)', 'Warden (martial weapons and medium armor)'] },
    spells: { cantrips: ['Produce Flame', 'Shillelagh', 'Druidcraft', 'Guidance', 'Thorn Whip', 'Starry Wisp'], first: ['Entangle', 'Goodberry', 'Healing Word', 'Faerie Fire', 'Thunderwave', 'Fog Cloud', 'Speak with Animals'] },
    features: { 1: ['Spellcasting', 'Druidic', 'Primal Order'], 2: ['Wild Shape', 'Wild Companion'], 4: [ASI], 5: ['Wild Resurgence'], 6: [SUB], 7: ['Elemental Fury'], 8: [ASI], 10: [SUB], 12: [ASI], 14: [SUB], 15: ['Improved Elemental Fury'], 16: [ASI], 18: ['Beast Spells'], 19: ['Epic Boon'], 20: ['Archdruid'] },
  },
  Fighter: {
    die: 10, priority: ['Str', 'Con', 'Dex', 'Wis', 'Int', 'Cha'], saves: ['Str', 'Con'], skillCount: 2,
    skills: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Persuasion', 'Perception', 'Survival'], armorProf: 'All armor, shields', weaponProf: 'Simple and martial weapons',
    subclasses: ['Battle Master', 'Champion', 'Eldritch Knight', 'Psi Warrior'],
    armor: 'chainmail', weapon: ['Greatsword', '2d6', 'Str'], caster: null,
    gear: 'Chain mail, greatsword, flail, 8 javelins, dungeoneer’s pack, 4 GP',
    choices: { 'Fighting Style': ['Great Weapon Fighting', 'Defense', 'Dueling', 'Protection', 'Interception', 'Two-Weapon Fighting'] },
    features: { 1: ['Fighting Style', 'Second Wind', 'Weapon Mastery'], 2: ['Action Surge', 'Tactical Mind'], 4: [ASI], 5: ['Extra Attack', 'Tactical Shift'], 6: [ASI], 7: [SUB], 8: [ASI], 9: ['Indomitable', 'Tactical Master'], 10: [SUB], 11: ['Two Extra Attacks'], 12: [ASI], 13: ['Indomitable (two uses)', 'Studied Attacks'], 14: [ASI], 15: [SUB], 16: [ASI], 17: ['Action Surge (two uses)', 'Indomitable (three uses)'], 18: [SUB], 19: ['Epic Boon'], 20: ['Three Extra Attacks'] },
  },
  Monk: {
    die: 8, priority: ['Dex', 'Wis', 'Con', 'Str', 'Int', 'Cha'], saves: ['Str', 'Dex'], skillCount: 2,
    skills: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'], armorProf: 'None', weaponProf: 'Simple weapons, martial weapons with the Light property', tools: 'One artisan’s tool or musical instrument',
    subclasses: ['Warrior of Mercy', 'Warrior of Shadow', 'Warrior of the Elements', 'Warrior of the Open Hand'],
    armor: 'monk', weapon: ['Unarmed strike', 'martial', 'Dex'], caster: null,
    gear: 'Spear, 5 daggers, artisan’s tools or instrument, explorer’s pack, 11 GP',
    features: { 1: ['Martial Arts', 'Unarmored Defense'], 2: ['Monk’s Focus', 'Unarmored Movement', 'Uncanny Metabolism'], 3: ['Deflect Attacks'], 4: [ASI, 'Slow Fall'], 5: ['Extra Attack', 'Stunning Strike'], 6: ['Empowered Strikes', SUB], 7: ['Evasion'], 8: [ASI], 9: ['Acrobatic Movement'], 10: ['Heightened Focus', 'Self-Restoration'], 11: [SUB], 12: [ASI], 13: ['Deflect Energy'], 14: ['Disciplined Survivor'], 15: ['Perfect Focus'], 16: [ASI], 17: [SUB], 18: ['Superior Defense'], 19: ['Epic Boon'], 20: ['Body and Mind'] },
  },
  Paladin: {
    die: 10, priority: ['Str', 'Cha', 'Con', 'Wis', 'Dex', 'Int'], saves: ['Wis', 'Cha'], skillCount: 2,
    skills: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'], armorProf: 'All armor, shields', weaponProf: 'Simple and martial weapons',
    subclasses: ['Oath of Devotion', 'Oath of Glory', 'Oath of the Ancients', 'Oath of Vengeance'],
    armor: 'chainmail-shield', weapon: ['Longsword', '1d8', 'Str'], caster: 'half', spellAbility: 'Cha',
    gear: 'Chain mail, shield, longsword, 6 javelins, holy symbol, priest’s pack, 9 GP',
    choices: { 'Fighting Style': ['Defense', 'Dueling', 'Protection', 'Blessed Warrior', 'Great Weapon Fighting'] },
    spells: { cantrips: [], first: ['Bless', 'Shield of Faith', 'Divine Favor', 'Heroism', 'Command', 'Cure Wounds', 'Searing Smite'] },
    features: { 1: ['Lay On Hands', 'Spellcasting', 'Weapon Mastery'], 2: ['Fighting Style', 'Paladin’s Smite'], 3: ['Channel Divinity'], 4: [ASI], 5: ['Extra Attack', 'Faithful Steed'], 6: ['Aura of Protection'], 7: [SUB], 8: [ASI], 9: ['Abjure Foes'], 10: ['Aura of Courage'], 11: ['Radiant Strikes'], 12: [ASI], 14: ['Restoring Touch'], 15: [SUB], 16: [ASI], 18: ['Aura Expansion'], 19: ['Epic Boon'], 20: [SUB] },
  },
  Ranger: {
    die: 10, priority: ['Dex', 'Wis', 'Con', 'Str', 'Int', 'Cha'], saves: ['Str', 'Dex'], skillCount: 3,
    skills: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'], armorProf: 'Light and medium armor, shields', weaponProf: 'Simple and martial weapons',
    subclasses: ['Beast Master', 'Fey Wanderer', 'Gloom Stalker', 'Hunter'],
    armor: 'studded', weapon: ['Longbow', '1d8', 'Dex'], caster: 'half', spellAbility: 'Wis',
    gear: 'Studded leather, scimitar, shortsword, longbow, 20 arrows, quiver, druidic focus, explorer’s pack, 7 GP',
    choices: { 'Fighting Style': ['Archery', 'Two-Weapon Fighting', 'Defense', 'Druidic Warrior'] },
    spells: { cantrips: [], first: ['Hunter’s Mark', 'Ensnaring Strike', 'Goodberry', 'Cure Wounds', 'Fog Cloud', 'Speak with Animals'] },
    features: { 1: ['Spellcasting', 'Favored Enemy', 'Weapon Mastery'], 2: ['Deft Explorer', 'Fighting Style'], 4: [ASI], 5: ['Extra Attack'], 6: ['Roving'], 7: [SUB], 8: [ASI], 9: ['Expertise'], 10: ['Tireless'], 11: [SUB], 12: [ASI], 13: ['Relentless Hunter'], 14: ['Nature’s Veil'], 15: [SUB], 16: [ASI], 17: ['Precise Hunter'], 18: ['Feral Senses'], 19: ['Epic Boon'], 20: ['Foe Slayer'] },
  },
  Rogue: {
    die: 8, priority: ['Dex', 'Con', 'Wis', 'Int', 'Cha', 'Str'], saves: ['Dex', 'Int'], skillCount: 4,
    skills: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Persuasion', 'Sleight of Hand', 'Stealth'], armorProf: 'Light armor', weaponProf: 'Simple weapons, martial weapons with the Finesse or Light property', tools: 'Thieves’ Tools',
    subclasses: ['Arcane Trickster', 'Assassin', 'Soulknife', 'Thief'],
    armor: 'leather', weapon: ['Shortsword', '1d6', 'Dex'], caster: null, languages: ['Thieves’ Cant'],
    gear: 'Leather armor, 2 daggers, shortsword, shortbow, 20 arrows, quiver, thieves’ tools, burglar’s pack, 8 GP',
    features: { 1: ['Expertise', 'Sneak Attack', 'Thieves’ Cant', 'Weapon Mastery'], 2: ['Cunning Action'], 3: ['Steady Aim'], 4: [ASI], 5: ['Cunning Strike', 'Uncanny Dodge'], 6: ['Expertise'], 7: ['Evasion', 'Reliable Talent'], 8: [ASI], 9: [SUB], 10: [ASI], 11: ['Improved Cunning Strike'], 12: [ASI], 13: [SUB], 14: ['Devious Strikes'], 15: ['Slippery Mind'], 16: [ASI], 17: [SUB], 18: ['Elusive'], 19: ['Epic Boon'], 20: ['Stroke of Luck'] },
  },
  Sorcerer: {
    die: 6, priority: ['Cha', 'Con', 'Dex', 'Wis', 'Int', 'Str'], saves: ['Con', 'Cha'], skillCount: 2,
    skills: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'], armorProf: 'None', weaponProf: 'Simple weapons',
    subclasses: ['Aberrant Sorcery', 'Clockwork Sorcery', 'Draconic Sorcery', 'Wild Magic Sorcery'],
    armor: 'none', weapon: ['Spear', '1d6', 'Str'], caster: 'full', spellAbility: 'Cha',
    gear: 'Spear, 2 daggers, arcane focus (crystal), dungeoneer’s pack, 28 GP',
    spells: { cantrips: ['Fire Bolt', 'Ray of Frost', 'Shocking Grasp', 'Mage Hand', 'Prestidigitation', 'Sorcerous Burst'], first: ['Magic Missile', 'Shield', 'Chromatic Orb', 'Burning Hands', 'Sleep', 'Charm Person'] },
    features: { 1: ['Spellcasting', 'Innate Sorcery'], 2: ['Font of Magic', 'Metamagic'], 4: [ASI], 5: ['Sorcerous Restoration'], 6: [SUB], 7: ['Sorcery Incarnate'], 8: [ASI], 10: ['Metamagic'], 12: [ASI], 14: [SUB], 16: [ASI], 17: ['Metamagic'], 18: [SUB], 19: ['Epic Boon'], 20: ['Arcane Apotheosis'] },
  },
  Warlock: {
    die: 8, priority: ['Cha', 'Con', 'Dex', 'Wis', 'Int', 'Str'], saves: ['Wis', 'Cha'], skillCount: 2,
    skills: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'], armorProf: 'Light armor', weaponProf: 'Simple weapons',
    subclasses: ['Archfey Patron', 'Celestial Patron', 'Fiend Patron', 'Great Old One Patron'],
    armor: 'leather', weapon: ['Sickle', '1d4', 'Str'], caster: 'pact', spellAbility: 'Cha',
    gear: 'Leather armor, sickle, 2 daggers, arcane focus (orb), book of occult lore, scholar’s pack, 15 GP',
    spells: { cantrips: ['Eldritch Blast', 'Minor Illusion', 'Mage Hand', 'Prestidigitation', 'Toll the Dead'], first: ['Hex', 'Armor of Agathys', 'Hellish Rebuke', 'Charm Person', 'Witch Bolt', 'Protection from Evil and Good'] },
    features: { 1: ['Eldritch Invocations', 'Pact Magic'], 2: ['Magical Cunning'], 4: [ASI], 6: [SUB], 8: [ASI], 9: ['Contact Patron'], 10: [SUB], 11: ['Mystic Arcanum (6th level)'], 12: [ASI], 13: ['Mystic Arcanum (7th level)'], 14: [SUB], 15: ['Mystic Arcanum (8th level)'], 16: [ASI], 17: ['Mystic Arcanum (9th level)'], 19: ['Epic Boon'], 20: ['Eldritch Master'] },
  },
  Wizard: {
    die: 6, priority: ['Int', 'Con', 'Dex', 'Wis', 'Cha', 'Str'], saves: ['Int', 'Wis'], skillCount: 2,
    skills: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Nature', 'Religion'], armorProf: 'None', weaponProf: 'Simple weapons',
    subclasses: ['Abjurer', 'Diviner', 'Evoker', 'Illusionist'],
    armor: 'none', weapon: ['Quarterstaff', '1d6', 'Str'], caster: 'full', spellAbility: 'Int',
    gear: '2 daggers, arcane focus (quarterstaff), robe, spellbook, scholar’s pack, 5 GP',
    spells: { cantrips: ['Fire Bolt', 'Mage Hand', 'Prestidigitation', 'Ray of Frost', 'Light', 'Minor Illusion'], first: ['Magic Missile', 'Shield', 'Mage Armor', 'Detect Magic', 'Find Familiar', 'Sleep', 'Feather Fall', 'Identify'] },
    features: { 1: ['Spellcasting', 'Ritual Adept', 'Arcane Recovery'], 2: ['Scholar'], 4: [ASI], 5: ['Memorize Spell'], 6: [SUB], 8: [ASI], 10: [SUB], 12: [ASI], 14: [SUB], 16: [ASI], 18: ['Spell Mastery'], 19: ['Epic Boon'], 20: ['Signature Spells'] },
  },
};

// Full-caster slots by caster level (index 1..20), each an array of slots for spell levels 1..9.
export const FULL_SLOTS = [null,
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
// Warlock pact slots: [count, slot level] by warlock level.
export function pactSlots(level) {
  const count = level >= 17 ? 4 : level >= 11 ? 3 : level >= 2 ? 2 : 1;
  const slotLevel = Math.min(5, Math.ceil(level / 2));
  return [count, slotLevel];
}

export const ALIGNMENTS = { 'Lawful Good': 12, 'Neutral Good': 16, 'Chaotic Good': 16, 'Lawful Neutral': 8, 'True Neutral': 10, 'Chaotic Neutral': 12, 'Lawful Evil': 3, 'Neutral Evil': 2, 'Chaotic Evil': 1 };
