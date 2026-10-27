// Your library: creatures, items and rules options you've summarized from your own books, kept as world entries.
// These helpers turn them into the shapes the generators use, so encounters, loot and shops can draw on them.
import { TERRAINS, terrainsFor } from './encounters.js';

const RARITY_CODE = { Common: 'c', Uncommon: 'u', Rare: 'r', 'Very rare': 'v', Legendary: 'l', Artifact: 'a' };

// "1/4", "½", "0.25", "CR 5" → number; null if it isn't a challenge rating.
export function parseCr(v) {
  const s = String(v ?? '').toLowerCase().replace(/^cr\s*/, '').replace('½', '1/2').replace('¼', '1/4').replace('⅛', '1/8').trim();
  if (!s) return null;
  const f = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  const n = f ? Number(f[1]) / Number(f[2]) : Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 30) return null;
  // Snap to the standard steps (1/8, 1/4, 1/2, 1, 2, …).
  return n === 0 ? 0 : n < 0.19 ? 0.125 : n < 0.38 ? 0.25 : n < 0.75 ? 0.5 : Math.round(n);
}

// Creatures from the bestiary, in the encounter builder's shape. No terrain written means they can turn up anywhere.
export function libraryCreatures(entries) {
  return entries.filter((e) => e.kind === 'creature' && parseCr(e.fields?.cr) != null).map((e) => ({
    name: e.name, cr: parseCr(e.fields.cr), type: String(e.fields?.type || 'monstrosity').toLowerCase(),
    terrains: String(e.fields?.terrain || '').trim() ? terrainsFor(e.fields.terrain) : [...TERRAINS],
    entryId: e.id, link: e.fields?.link || null,
  }));
}

// Items with a source book, in the magic item catalog's shape, so loot and shops can roll them.
export function libraryItems(entries) {
  return entries.filter((e) => e.kind === 'item' && String(e.fields?.source || '').trim() && RARITY_CODE[e.fields?.rarity]).map((e) => ({
    name: e.name, rarity: RARITY_CODE[e.fields.rarity], type: e.fields?.type || 'Wondrous item',
    attunement: /^(yes|requires)/i.test(e.fields?.attunement || '') ? e.fields.attunement : '',
    summary: e.summary || String(e.fields?.properties || '').split('\n')[0] || '', cursed: (e.tags || []).includes('cursed'),
    source: e.fields.source, entryId: e.id, library: true,
  }));
}

export const LIBRARY_CATEGORIES = ['Class', 'Subclass', 'Species', 'Background', 'Feat', 'Spell', 'Other'];
export const ruleOptions = (entries, category) => entries.filter((e) => e.kind === 'rule' && (!category || e.fields?.category === category));

// "Name: text" or "Name. text" lines become separate traits; anything else is one trait named after the option.
export function traitsFrom(name, text) {
  const lines = String(text || '').split(/\n+/).map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  const out = [];
  for (const l of lines) {
    const m = l.match(/^([A-Z][\w’' -]{1,40}?)[:.]\s+(.+)$/);
    if (m) out.push([m[1].trim(), m[2].trim()]);
    else if (out.length) out[out.length - 1][1] += ` ${l}`;
    else out.push([name, l]);
  }
  return out;
}

const num = (v) => { const m = String(v ?? '').match(/\d+/); return m ? Number(m[0]) : null; };

// Species from the library, in the shape the Character Forge uses.
export function librarySpecies(entries) {
  return ruleOptions(entries, 'Species').map((e) => ({
    name: e.name, size: e.fields?.size || '', speed: num(e.fields?.speed), darkvision: num(e.fields?.darkvision),
    like: e.fields?.like || 'Human', traits: traitsFrom(e.name, e.fields?.features || e.summary), source: e.fields?.source || '', entryId: e.id,
  }));
}

// Subclasses from the library, with the class they belong to (matched loosely: "fighter", "Fighter (2024)").
export function librarySubclasses(entries, classes = []) {
  return ruleOptions(entries, 'Subclass').map((e) => {
    const raw = String(e.fields?.class || '').toLowerCase();
    const cls = classes.find((c) => raw.includes(c.toLowerCase())) || (e.fields?.class || '').trim();
    return { name: e.name, cls, features: e.fields?.features || e.summary || '', source: e.fields?.source || '', entryId: e.id };
  }).filter((x) => x.cls);
}

// ---- classes --------------------------------------------------------------------------------------
// A class from the library, in the shape the Character Forge uses for SRD classes (see CLASSES in rules2024.js).
// Every field is optional: blanks fall back to sensible defaults, so a half-filled class still builds.
const ABILS = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
const ABIL_WORDS = { str: 'Str', strength: 'Str', dex: 'Dex', dexterity: 'Dex', con: 'Con', constitution: 'Con', int: 'Int', intelligence: 'Int', wis: 'Wis', wisdom: 'Wis', cha: 'Cha', charisma: 'Cha' };
const SKILL_NAMES = ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'];
const WEARS = { 'No armor': 'none', Leather: 'leather', 'Studded leather': 'studded', 'Leather and shield': 'leather-shield', 'Chain shirt and shield': 'chainshirt-shield', 'Chain mail': 'chainmail', 'Chain mail and shield': 'chainmail-shield', 'Unarmored (Dex + Con)': 'barbarian', 'Unarmored (Dex + Wis)': 'monk' };
const ARMOR_TRAINING = { leather: 'Light armor', studded: 'Light armor', 'leather-shield': 'Light armor, shields', 'chainshirt-shield': 'Light and medium armor, shields', chainmail: 'All armor', 'chainmail-shield': 'All armor, shields' };
const CAST = { 'Full caster': 'full', 'Half caster': 'half', 'Third caster': 'third', 'Pact magic': 'pact' };
const ASI = 'Ability Score Improvement', SUB = 'Subclass feature';

export const abilitiesIn = (text) => [...new Set((String(text || '').toLowerCase().match(/[a-z]+/g) || []).map((w) => ABIL_WORDS[w]).filter(Boolean))];

// "1: Rage, Unarmored Defense", "Level 2 — Reckless Attack: Advantage on Strength attacks…", "3: Subclass".
// Lines without a level carry on the previous feature's description.
export function classFeatures(text) {
  const byLevel = {}, list = [];
  let last = null;
  for (const raw of String(text || '').split(/\n+/)) {
    const l = raw.replace(/^[-•*]\s*/, '').trim();
    if (!l) continue;
    const m = l.match(/^(?:level\s*)?(\d{1,2})(?:st|nd|rd|th)?(?:\s*level)?\s*[:.)—–-]\s*(.+)$/i);
    if (!m || +m[1] < 1 || +m[1] > 20) { if (last) last.text = `${last.text} ${l}`.trim(); continue; }
    const lv = +m[1], rest = m[2].trim();
    const d = rest.match(/^([^:—–,]{1,50}?)\s*(?::|\s[—–-]\s)\s*(.+)$/);
    const items = d ? [[d[1], d[2]]] : rest.split(/\s*[,;]\s*/).filter(Boolean).map((n) => [n, '']);
    for (const [n, t] of items) {
      const name = n.trim().replace(/\.$/, '');
      const f = { level: lv, name: /^(asi|ability score (improvement|increase))$/i.test(name) ? ASI : /\bsubclass\b/i.test(name) ? SUB : /^epic boon$/i.test(name) ? 'Epic Boon' : name, text: t.trim() };
      (byLevel[lv] ||= []).push(f.name); list.push(f); last = f;
    }
  }
  return { byLevel, list };
}

const weaponFrom = (text, primary, caster) => {
  const t = String(text || '').trim();
  if (!t) return caster && !['Str', 'Dex'].includes(primary) ? ['Quarterstaff', '1d6', 'Str'] : primary === 'Dex' ? ['Shortsword', '1d6', 'Dex'] : ['Longsword', '1d8', 'Str'];
  const dice = (t.match(/\b\d*d\d+\b/i) || ['1d6'])[0].replace(/^d/i, '1d');
  const ab = abilitiesIn(t).find((a) => a === 'Str' || a === 'Dex') || (/finesse|bow|crossbow|dart|sling|rapier|dagger|shortsword|scimitar/i.test(t) || primary === 'Dex' ? 'Dex' : 'Str');
  const name = t.replace(/\b\d*d\d+\b/i, '').replace(/\b(str|dex|strength|dexterity)\b/gi, '').replace(/[(),]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Weapon';
  return [name, dice, ab];
};

// Fields → class. Used for library entries and as a stand-in when a saved character's library class is gone.
export function classFrom(name, f = {}, extra = {}) {
  const caster = CAST[f.caster] || null;
  const primary = ABILS.includes(f.primary) ? f.primary : abilitiesIn(f.saves)[0] || 'Str';
  const spellAbility = ['Int', 'Wis', 'Cha'].includes(f.spellAbility) ? f.spellAbility : ['Int', 'Wis', 'Cha'].includes(primary) ? primary : 'Int';
  const priority = [...new Set([primary, ...(caster && spellAbility !== primary ? [spellAbility] : []), 'Con', 'Dex', 'Wis', 'Cha', 'Int', 'Str'])];
  const saves = abilitiesIn(f.saves).slice(0, 2);
  if (saves.length < 2) for (const a of priority) if (saves.length < 2 && !saves.includes(a)) saves.push(a);
  const picked = SKILL_NAMES.filter((s) => String(f.skills || '').toLowerCase().includes(s.toLowerCase()));
  const { byLevel, list } = classFeatures(f.features);
  const features = Object.fromEntries(Object.entries(byLevel).map(([lv, fs]) => [lv, [...fs]]));
  // No Ability Score Improvements listed: use the usual levels.
  if (!list.some((x) => x.name === ASI)) for (const lv of [4, 8, 12, 16]) (features[lv] ||= []).push(ASI);
  if (!list.some((x) => x.name === 'Epic Boon')) (features[19] ||= []).push('Epic Boon');
  const subLevel = num(f.sublevel) || list.find((x) => x.name === SUB)?.level || 3;
  // The first subclass feature is the "Subclass: …" line the Forge adds itself.
  if (features[subLevel]) features[subLevel] = features[subLevel].filter((x, i, a) => x !== SUB || a.indexOf(SUB) !== i);
  const spellsLike = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'].includes(f.spellsLike) ? f.spellsLike : { Int: 'Wizard', Wis: 'Cleric', Cha: 'Sorcerer' }[spellAbility];
  return {
    name, library: true, die: Math.min(12, Math.max(4, num(f.die) || 8)), priority, saves, skillCount: Math.min(6, num(f.skillCount) || 2), skills: picked.length ? picked : SKILL_NAMES,
    armorProf: f.armorProf || ARMOR_TRAINING[WEARS[f.wears]] || 'None', weaponProf: f.weaponProf || 'Simple weapons', subclasses: [], armor: WEARS[f.wears] || 'none',
    weapon: weaponFrom(f.weapon, primary, caster), caster, spellAbility, spellsLike, gear: f.gear || '', features, subclassLevel: Math.min(20, subLevel),
    featureText: Object.fromEntries(list.filter((x) => x.text).map((x) => [x.name, x.text])), source: f.source || '', ...extra,
  };
}

export function libraryClasses(entries) {
  return ruleOptions(entries, 'Class').map((e) => classFrom(e.name, e.fields || {}, { entryId: e.id, notes: e.fields?.features || e.summary || '' }));
}

// ---- spells ---------------------------------------------------------------------------------------
// Spells from the library: level 0–9 ("cantrip" or blank = 0 only when it says so) and the classes whose lists
// they join, matched loosely against the class names given ("wizard, sorcerer", "Wizard (2024)").
export function librarySpells(entries, classNames = []) {
  return ruleOptions(entries, 'Spell').map((e) => {
    const raw = String(e.fields?.class || '');
    const lv = /cantrip/i.test(e.fields?.level || '') ? 0 : num(e.fields?.level);
    const matched = classNames.filter((c) => raw.toLowerCase().includes(c.toLowerCase()));
    const classes = matched.length ? matched : raw.split(/\s*[,/&]\s*|\s+and\s+/).map((x) => x.trim()).filter(Boolean);
    return { name: e.name, level: lv, classes, text: e.fields?.features || e.summary || '', source: e.fields?.source || '', entryId: e.id };
  }).filter((s) => s.level != null && s.level >= 0 && s.level <= 9 && s.classes.length);
}

// ---- backgrounds and feats ------------------------------------------------------------------------
// A background in the Forge's shape (see BACKGROUNDS in rules2024.js): three abilities, two skills, a tool, an
// origin feat and gear. Blanks fall back to something usable.
export function backgroundFrom(name, f = {}, extra = {}) {
  const abilities = abilitiesIn(f.abilities).slice(0, 3);
  for (const a of ['Con', 'Wis', 'Dex', 'Str', 'Int', 'Cha']) if (abilities.length < 3 && !abilities.includes(a)) abilities.push(a);
  const skills = SKILL_NAMES.filter((s) => String(f.bgSkills || f.skills || '').toLowerCase().includes(s.toLowerCase())).slice(0, 2);
  return { name, library: true, abilities, skills, tool: f.tool || '', feat: String(f.feat || '').trim() || 'Skilled', gear: f.gear || '50 GP', source: f.source || '', ...extra };
}
export const libraryBackgrounds = (entries) => ruleOptions(entries, 'Background').map((e) => backgroundFrom(e.name, e.fields || {}, { entryId: e.id, notes: e.fields?.features || e.summary || '' }));

// Feats: origin, general (with an optional minimum level), fighting style or epic boon.
export const libraryFeats = (entries) => ruleOptions(entries, 'Feat').map((e) => ({
  name: e.name, type: ['Origin', 'General', 'Fighting Style', 'Epic Boon'].includes(e.fields?.featType) ? e.fields.featType : 'General',
  level: num(e.fields?.level) || 0, text: e.fields?.features || e.summary || '', source: e.fields?.source || '', entryId: e.id,
}));
