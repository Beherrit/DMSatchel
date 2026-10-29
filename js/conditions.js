// What each condition does, in short, from the System Reference Document 5.2 (CC BY 4.0, credited on the
// Reference page). Shown on character sheets and in the Reference section.

// The conditions a character sheet can mark (Exhaustion has its own counter).
export const CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];

export const CONDITION_TEXT = {
  Blinded: ['You can’t see, and fail any ability check that needs sight.', 'Attack rolls against you have Advantage; your attack rolls have Disadvantage.'],
  Charmed: ['You can’t attack the charmer or target them with damaging abilities or magical effects.', 'The charmer has Advantage on ability checks to interact with you socially.'],
  Deafened: ['You can’t hear, and fail any ability check that needs hearing.'],
  Exhaustion: ['Each level of Exhaustion takes 2 off your d20 Tests and 5 feet off your Speed.', 'A Long Rest removes one level. At level 6, you die.'],
  Frightened: ['Disadvantage on ability checks and attack rolls while the source of your fear is in sight.', 'You can’t willingly move closer to the source of your fear.'],
  Grappled: ['Your Speed is 0 and can’t increase.', 'Disadvantage on attack rolls against anyone but the grappler.', 'The grappler can drag or carry you, at the cost of extra movement unless you’re much smaller.'],
  Incapacitated: ['You can’t take actions, Bonus Actions or Reactions, and you can’t speak.', 'Your Concentration is broken.', 'Disadvantage on Initiative if you roll it while Incapacitated.'],
  Invisible: ['Advantage on Initiative.', 'You aren’t affected by anything that needs to see its target, unless its maker can see you.', 'Attack rolls against you have Disadvantage; your attack rolls have Advantage (not against anyone who can see you).'],
  Paralyzed: ['You’re Incapacitated, and your Speed is 0.', 'You automatically fail Strength and Dexterity saving throws.', 'Attack rolls against you have Advantage, and a hit from within 5 feet is a Critical Hit.'],
  Petrified: ['You and what you wear and carry turn to stone (or another inanimate substance); you stop aging.', 'You’re Incapacitated, your Speed is 0, and you automatically fail Strength and Dexterity saving throws.', 'Attack rolls against you have Advantage; you have Resistance to all damage and can’t be Poisoned.'],
  Poisoned: ['Disadvantage on attack rolls and ability checks.'],
  Prone: ['You can only crawl unless you stand up, which costs half your Speed.', 'Disadvantage on your attack rolls.', 'Attack rolls against you have Advantage from within 5 feet, and Disadvantage from farther away.'],
  Restrained: ['Your Speed is 0 and can’t increase.', 'Attack rolls against you have Advantage; your attack rolls have Disadvantage.', 'Disadvantage on Dexterity saving throws.'],
  Stunned: ['You’re Incapacitated.', 'You automatically fail Strength and Dexterity saving throws.', 'Attack rolls against you have Advantage.'],
  Unconscious: ['You’re Incapacitated and Prone, drop what you’re holding, and are unaware of your surroundings; you stay Prone when you wake.', 'Your Speed is 0, and you automatically fail Strength and Dexterity saving throws.', 'Attack rolls against you have Advantage, and a hit from within 5 feet is a Critical Hit.'],
};

// The short version, for a tooltip.
export const conditionLine = (name) => (CONDITION_TEXT[name] || []).join(' ');
