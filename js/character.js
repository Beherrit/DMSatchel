// Random fifth-edition (2024) characters: rules build plus a lifepath backstory.
//
// generateCharacter(options, seed, salts) is pure. Each part of the character draws from its
// own seeded stream (subRng(seed, part + salt)), so bumping one part's salt rerolls just that
// part and keeps the rest wherever the story still fits:
//   name, core (species, lineage, class, subclass, background, alignment, looks),
//   abilities, build (skills, feats, choices, spells),
//   origins, upbringing, calling (why background and class), life, personality, drives, hooks.

import { subRng } from './rng.js';
import { personName, firstName, townName, regionName } from './names.js';
import {
  ABILITIES, SKILLS, SPECIES, SPECIES_WEIGHTS, CLASSES, BACKGROUNDS, ORIGIN_FEATS, GENERAL_FEATS,
  EPIC_BOONS, STANDARD_LANGUAGES, FULL_SLOTS, pactSlots, ALIGNMENTS,
} from './rules2024.js';
import * as T from './lifepath-tables.js';
import { spellbook, spellText } from './spells.js';

export const PARTS = ['name', 'core', 'abilities', 'build', 'spells', 'origins', 'upbringing', 'calling', 'life', 'people', 'personality', 'drives', 'hooks'];
export const STORY_SECTIONS = {
  origins: 'Origins & Family', upbringing: 'Upbringing & Youth', calling: 'Background & Calling',
  life: 'Adult Life', people: 'People in Their Life', personality: 'Personality', drives: 'Goals, Secrets & Regrets', hooks: 'Hooks for the DM',
};

const mod = (score) => Math.floor((score - 10) / 2);
const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const profBonus = (level) => 2 + Math.floor((level - 1) / 4);
const POINT_BUY = [[15, 14, 13, 12, 10, 8], [15, 15, 15, 8, 8, 8], [15, 15, 14, 10, 8, 8], [15, 14, 14, 10, 10, 8], [15, 15, 13, 10, 10, 8], [14, 14, 14, 12, 10, 8]];
const HAIR = ['black', 'chestnut', 'copper-red', 'sandy blond', 'silver-white', 'dark brown', 'auburn', 'shaved', 'grey-streaked', 'ash blond', 'jet black and braided', 'wild and curly'];
const EYES = ['brown', 'grey', 'green', 'blue', 'amber', 'hazel', 'black', 'violet', 'mismatched blue and brown', 'pale gold'];
const MARKS = ['a scar through one eyebrow', 'freckles everywhere', 'a crooked nose, broken more than once', 'ink tattoos of {their} family crest', 'a missing fingertip', 'a burn scar on one hand', 'an easy, lopsided smile', 'unusually long fingers', 'a voice much deeper than expected', 'a nervous habit of fidgeting with a ring', 'a gold earring', 'weathered, sun-browned skin', 'a birthmark shaped like a crescent', 'immaculately kept clothes', 'calloused, scarred knuckles', 'a limp in cold weather'];
const SPECIES_LANG = { Dwarf: 'Dwarvish', Elf: 'Elvish', Gnome: 'Gnomish', Halfling: 'Halfling', Orc: 'Orc', Goliath: 'Giant', Dragonborn: 'Draconic' };

// ---- text filling ------------------------------------------------------------------------------

function pronouns(g) {
  if (g === 'f') return { they: 'she', them: 'her', their: 'her', themself: 'herself', plural: false };
  if (g === 'm') return { they: 'he', them: 'him', their: 'his', themself: 'himself', plural: false };
  return { they: 'they', them: 'them', their: 'their', themself: 'themself', plural: true };
}

function fill(text, ctx, r, local = {}) {
  const p = ctx.pro;
  const vars = {
    name: ctx.name, first: ctx.first, town: ctx.town, region: ctx.region, background: ctx.background?.toLowerCase(),
    they: p.they, them: p.them, their: p.their, themself: p.themself, They: cap(p.they), Their: cap(p.their),
    is: p.plural ? 'are' : 'is', was: p.plural ? 'were' : 'was', has: p.plural ? 'have' : 'has',
    ...ctx.vars, ...local,
  };
  return String(text)
    .replace(/\{s\|\}/g, p.plural ? '' : 's')
    .replace(/\{([^{}]*\|[^{}]*)\}/g, (_, opts) => r.pick(opts.split('|')))
    .replace(/\{(\w+)\}/g, (m, k) => {
      if (k === 'npc') { local.npc = local.npc || ctx.newName(r); return local.npc; }
      return vars[k] ?? m;
    });
}

// ---- rules build -------------------------------------------------------------------------------

function pickCore(opts, r) {
  const species = opts.species && opts.species !== 'any' ? opts.species : r.pickW(SPECIES_WEIGHTS);
  const cls = opts.cls && opts.cls !== 'any' ? opts.cls : r.pick(Object.keys(CLASSES));
  const background = opts.background && opts.background !== 'any' ? opts.background : pickBackground(cls, r);
  const sp = SPECIES[species];
  const lineage = sp.lineages ? r.pick(Object.keys(sp.lineages)) : null;
  const subclass = r.pick(CLASSES[cls].subclasses);
  const alignment = opts.alignment && opts.alignment !== 'any' ? opts.alignment : r.pickW(ALIGNMENTS);
  const gender = opts.gender && opts.gender !== 'any' ? opts.gender : r.pickW({ f: 45, m: 45, x: 10 });
  const [aLo, aHi] = sp.age;
  const lvl = opts.level || 1;
  const age = Math.round(aLo + (aHi - aLo) * Math.min(0.85, 0.08 + r.next() * 0.3 + lvl * 0.015));
  const [hLo, hHi] = sp.height;
  const heightFt = hLo + r.next() * (hHi - hLo);
  const looks = { hair: r.pick(HAIR), eyes: r.pick(EYES), mark: r.pick(MARKS) };
  return { species, cls, background, lineage, subclass, alignment, gender, age, heightFt, looks };
}

// Favor backgrounds whose ability list includes the class's primary ability.
function pickBackground(cls, r) {
  const primary = CLASSES[cls].priority[0];
  const weights = {};
  for (const [k, b] of Object.entries(BACKGROUNDS)) weights[k] = b.abilities.includes(primary) ? 4 : 1;
  return r.pickW(weights);
}

function rollAbilities(opts, core, r) {
  const c = CLASSES[core.cls];
  let raw;
  if (opts.method === 'roll') {
    raw = Array.from({ length: 6 }, () => { const d = [1, 2, 3, 4].map(() => r.range(1, 6)).sort((a, b) => a - b); return d[1] + d[2] + d[3]; });
  } else if (opts.method === 'pointbuy') raw = [...r.pick(POINT_BUY)];
  else raw = [15, 14, 13, 12, 10, 8];
  raw.sort((a, b) => b - a);
  // Keep the top three in class order; let the dump stats wander a little.
  const order = [...c.priority.slice(0, 3), ...r.shuffle(c.priority.slice(3))];
  const scores = {}, base = {};
  order.forEach((ab, i) => { scores[ab] = raw[i]; base[ab] = raw[i]; });

  const bg = BACKGROUNDS[core.background];
  const bgOrder = [...bg.abilities].sort((a, b) => c.priority.indexOf(a) - c.priority.indexOf(b));
  const bonus = {};
  if (r.chance(0.8)) { bonus[bgOrder[0]] = 2; bonus[bgOrder[1]] = 1; } else bgOrder.forEach((a) => { bonus[a] = 1; });
  for (const [a, v] of Object.entries(bonus)) scores[a] = Math.min(20, scores[a] + v);
  return { scores, base, bonus, method: opts.method || 'standard' };
}

function levelUps(level, core, ab, r) {
  const c = CLASSES[core.cls];
  const primary = c.priority[0], second = c.priority[1];
  const asiLevels = Object.entries(c.features).filter(([lv, fs]) => +lv <= level && fs.includes('Ability Score Improvement')).map(([lv]) => +lv);
  const pool = c.caster && !['Paladin', 'Ranger'].includes(core.cls) ? GENERAL_FEATS.caster : core.cls === 'Rogue' || core.cls === 'Bard' ? GENERAL_FEATS.skill : GENERAL_FEATS.martial;
  const s = ab.scores, notes = [], feats = [];
  const bump = (a, n) => { const before = s[a]; s[a] = Math.min(20, s[a] + n); return s[a] - before; };
  for (const lv of asiLevels) {
    if (s[primary] <= 18 && r.chance(0.7)) { bump(primary, 2); notes.push(`Level ${lv}: Ability Score Improvement, +2 ${primary}`); continue; }
    if (s[primary] === 19 && r.chance(0.6)) { bump(primary, 1); const t = s[second] < 20 ? second : 'Con'; bump(t, 1); notes.push(`Level ${lv}: Ability Score Improvement, +1 ${primary}, +1 ${t}`); continue; }
    const feat = r.pick(pool.filter((f) => !feats.includes(f)));
    feats.push(feat);
    const t = s[primary] < 20 ? primary : s[second] < 20 ? second : 'Con';
    const got = bump(t, 1);
    notes.push(`Level ${lv}: ${feat} feat${got ? `, +1 ${t}` : ''}`);
  }
  let boon = null;
  if (level >= 19) {
    boon = r.pick(EPIC_BOONS);
    s[primary] = Math.min(30, s[primary] + 1);
    notes.push(`Level 19: ${boon}, +1 ${primary}`);
  }
  return { notes, feats, boon };
}

function buildChoices(level, core, ab, r) {
  const c = CLASSES[core.cls], bg = BACKGROUNDS[core.background];
  const skills = new Set(bg.skills);
  const sources = Object.fromEntries(bg.skills.map((k) => [k, core.background]));
  const add = (k, why) => { if (!skills.has(k)) { skills.add(k); sources[k] = why; return true; } return false; };
  // Prefer class skills that use the character's best abilities.
  const byAbility = (list) => [...list].sort((a, b) => (ab.scores[SKILLS[b]] - ab.scores[SKILLS[a]]) + (r.next() - 0.5) * 6);
  let need = c.skillCount;
  for (const k of byAbility(c.skills)) { if (need <= 0) break; if (add(k, core.cls)) need--; }
  if (core.species === 'Elf') { const k = ['Perception', 'Insight', 'Survival'].find((x) => !skills.has(x)); if (k) add(k, 'Keen Senses'); }
  if (core.species === 'Human') { const k = byAbility(Object.keys(SKILLS)).find((x) => !skills.has(x)); add(k, 'Skillful'); }

  const originFeats = [bg.feat];
  if (core.species === 'Human') originFeats.push(r.pick(Object.keys(ORIGIN_FEATS).filter((f) => f !== bg.feat && !(f.startsWith('Magic Initiate') && bg.feat.startsWith('Magic Initiate')))));
  for (const f of originFeats) if (f === 'Skilled') {
    let n = 3; for (const k of byAbility(Object.keys(SKILLS))) { if (n <= 0) break; if (add(k, 'Skilled feat')) n--; }
  }

  const expertise = new Set();
  const expertiseAt = { Rogue: [1, 6], Bard: [2, 9], Ranger: [9] }[core.cls] || [];
  for (const lv of expertiseAt) if (level >= lv) {
    const picks = byAbility([...skills].filter((k) => !expertise.has(k))).slice(0, lv === 9 && core.cls === 'Ranger' ? 2 : 2);
    picks.forEach((k) => expertise.add(k));
  }

  const choices = {};
  for (const [name, options] of Object.entries(c.choices || {})) {
    if (name === 'Fighting Style' && core.cls !== 'Fighter' && level < 2) continue;
    choices[name] = core.cls === 'Fighter' && name === 'Fighting Style' ? r.pick(options.slice(0, 3)) : r.pick(options);
  }

  const casterKey = c.caster || (['Eldritch Knight', 'Arcane Trickster'].includes(core.subclass) && level >= 3 ? 'third' : null);
  let spells = null;
  if (casterKey) {
    const list = c.spells || CLASSES.Wizard.spells;
    spells = { cantrips: list.cantrips.length ? r.sample(list.cantrips, Math.min(3, list.cantrips.length)) : [], first: r.sample(list.first, Math.min(4, list.first.length)) };
  }
  const langs = ['Common'];
  const pref = SPECIES_LANG[core.species];
  if (pref) langs.push(pref);
  for (const l of r.shuffle(STANDARD_LANGUAGES)) { if (langs.length >= 3) break; if (!langs.includes(l)) langs.push(l); }
  langs.push(...(c.languages || []));
  return { skills: [...skills], sources, expertise: [...expertise], originFeats, choices, casterKey, spells, languages: langs };
}

function acFor(armor, s, choices) {
  const dex = mod(s.Dex);
  const defense = choices['Fighting Style'] === 'Defense' ? 1 : 0;
  switch (armor) {
    case 'barbarian': return [10 + dex + mod(s.Con), 'Unarmored Defense'];
    case 'monk': return [10 + dex + mod(s.Wis), 'Unarmored Defense'];
    case 'leather': return [11 + dex, 'leather armor'];
    case 'leather-shield': return [13 + dex, 'leather armor and shield'];
    case 'studded': return [12 + dex + defense, `studded leather${defense ? ', Defense style' : ''}`];
    case 'chainshirt-shield': return [13 + Math.min(dex, 2) + 2, 'chain shirt and shield'];
    case 'chainmail': return [16 + defense, `chain mail${defense ? ', Defense style' : ''}`];
    case 'chainmail-shield': return [18 + defense, `chain mail and shield${defense ? ', Defense style' : ''}`];
    default: return [10 + dex, 'no armor'];
  }
}

function derive(level, core, ab, build, ups) {
  const c = CLASSES[core.cls], sp = SPECIES[core.species], s = ab.scores, pb = profBonus(level);
  const conMod = mod(s.Con);
  let hp = c.die + conMod + (level - 1) * Math.max(1, c.die / 2 + 1 + conMod);
  if (core.species === 'Dwarf') hp += level;
  if (build.originFeats.includes('Tough')) hp += 2 * level;
  hp = Math.max(level, hp);
  const [ac, acNote] = acFor(c.armor, s, build.choices);
  let speed = sp.speed + (core.lineage === 'Wood Elf' ? 5 : 0);
  if (core.cls === 'Monk' && level >= 2) speed += [0, 10, 15, 20, 25, 30][[2, 6, 10, 14, 18].filter((l) => level >= l).length];
  if (core.cls === 'Barbarian' && level >= 5) speed += 10;
  const darkvision = core.lineage === 'Drow' ? 120 : sp.darkvision;

  const skillMod = (k) => {
    const m = mod(s[SKILLS[k]]);
    if (build.expertise.includes(k)) return m + 2 * pb;
    if (build.skills.includes(k)) return m + pb;
    if (core.cls === 'Bard' && level >= 2) return m + Math.floor(pb / 2);
    return m;
  };
  const skills = Object.keys(SKILLS).map((k) => ({ name: k, ability: SKILLS[k], mod: skillMod(k), prof: build.skills.includes(k), expert: build.expertise.includes(k), source: build.sources[k] }));
  const saves = ABILITIES.map((a) => ({ ability: a, mod: mod(s[a]) + (c.saves.includes(a) ? pb : 0), prof: c.saves.includes(a) }));
  const initiative = mod(s.Dex) + (build.originFeats.includes('Alert') ? pb : 0);
  const passive = 10 + skillMod('Perception');

  const [wName, wDice, wAb] = c.weapon;
  const wAbility = wAb === 'Dex' || core.cls === 'Monk' ? (s.Dex >= s.Str ? 'Dex' : 'Str') : wAb;
  const dice = wDice === 'martial' ? `1d${level >= 17 ? 12 : level >= 11 ? 10 : level >= 5 ? 8 : 6}` : wDice;
  const attacks = core.cls === 'Fighter' ? (level >= 20 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1) : ['Barbarian', 'Monk', 'Paladin', 'Ranger'].includes(core.cls) && level >= 5 ? 2 : 1;
  const weapon = { name: wName, toHit: pb + mod(s[wAbility]), damage: `${dice}${sign(mod(s[wAbility])).replace('+0', '')}`, attacks };

  let spellcasting = null;
  if (build.casterKey) {
    const sa = c.spellAbility || 'Int';
    let slots;
    if (build.casterKey === 'pact') { const [n, lv] = pactSlots(level); slots = `${n} pact slot${n > 1 ? 's' : ''} of level ${lv}`; }
    else {
      const row = FULL_SLOTS[build.casterKey === 'full' ? level : build.casterKey === 'half' ? Math.ceil(level / 2) : Math.ceil(level / 3)];
      slots = row.map((n, i) => `${['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'][i]}: ${n}`).join(' · ');
    }
    spellcasting = { ability: sa, dc: 8 + pb + mod(s[sa]), attack: pb + mod(s[sa]), slots };
  }

  const res = [];
  const L = level;
  const tier = (pairs) => pairs.filter(([l]) => L >= l).pop()?.[1];
  if (core.cls === 'Barbarian') res.push(`Rage ${tier([[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]])}/long rest, +${tier([[1, 2], [9, 3], [16, 4]])} damage`);
  if (core.cls === 'Bard') res.push(`Bardic Inspiration d${tier([[1, 6], [5, 8], [10, 10], [15, 12]])}, ${Math.max(1, mod(s.Cha))} uses`);
  if (core.cls === 'Cleric' && L >= 2) res.push(`Channel Divinity ${tier([[2, 2], [6, 3], [18, 4]])} uses`);
  if (core.cls === 'Druid' && L >= 2) res.push(`Wild Shape ${tier([[2, 2], [6, 3], [17, 4]])} uses`);
  if (core.cls === 'Fighter') res.push(`Second Wind ${tier([[1, 2], [4, 3], [10, 4]])} uses`);
  if (core.cls === 'Monk' && L >= 2) res.push(`${L} Focus Points`);
  if (core.cls === 'Paladin') res.push(`Lay On Hands pool ${5 * L} HP`);
  if (core.cls === 'Rogue') res.push(`Sneak Attack ${Math.ceil(L / 2)}d6`);
  if (core.cls === 'Sorcerer' && L >= 2) res.push(`${L} Sorcery Points`);
  if (core.cls === 'Ranger') res.push(`Favored Enemy: Hunter’s Mark free ${tier([[1, 2], [5, 3], [9, 4], [13, 5], [17, 6]])}/long rest`);

  const features = [];
  for (let lv = 1; lv <= level; lv++) for (const f of c.features[lv] || []) {
    if (f === 'Ability Score Improvement' || f === 'Epic Boon') continue;
    features.push({ level: lv, name: f === 'Subclass feature' ? `${core.subclass} feature` : f });
    if (lv === 3 && f === (c.features[3] || [])[0]) { /* subclass added below */ }
  }
  if (level >= 3) features.push({ level: 3, name: `Subclass: ${core.subclass}` });
  features.sort((a, b) => a.level - b.level);

  const speciesTraits = sp.traits.filter(([, , lv]) => !lv || level >= lv).map(([n, d]) => ({ name: n, text: d }));
  if (core.lineage) speciesTraits.unshift({ name: `${sp.lineageLabel}: ${core.lineage}`, text: core.species === 'Dragonborn' ? `${sp.lineages[core.lineage]} damage for breath and resistance.` : sp.lineages[core.lineage] });

  return { level, pb, hp, ac, acNote, speed, darkvision, size: sp.size, initiative, passive, skills, saves, weapon, spellcasting, resources: res, features, speciesTraits, hitDice: `${level}d${c.die}` };
}

// ---- lifepath ----------------------------------------------------------------------------------

function origins(ctx, r) {
  const standing = ctx.background === 'Noble' ? r.pick(T.STANDINGS.filter((s) => ['wealthy', 'noble'].includes(s.id))) : r.pickW(T.STANDINGS.filter((s) => s.id !== 'noble' || r.chance(0.3)));
  ctx.standing = standing;
  const homes = [...T.HOMETOWNS.any, ...(T.HOMETOWNS[ctx.species] || []), ...(T.HOMETOWNS[ctx.species] || [])];
  const hometownKind = r.pick(homes);
  const birth = r.pickW(T.BIRTH.filter((b) => !b.standing || b.standing.includes(standing.id)));
  const items = [];
  items.push(`Born ${fill(birth.text, ctx, r)}, in ${ctx.town}, ${hometownKind}.`);
  items.push(`Family standing: ${standing.label}, ${standing.note}.`);
  if (birth.secret) ctx.secrets.push(birth.secret);

  const parents = [];
  const single = r.chance(0.15);
  const pair = r.pickW({ 'mother and father': 80, 'two mothers': 6, 'two fathers': 6, 'mother': single ? 50 : 0, 'father': single ? 50 : 0 });
  const roles = pair === 'mother and father' ? ['Mother', 'Father'] : pair === 'two mothers' ? ['Mother', 'Mother'] : pair === 'two fathers' ? ['Father', 'Father'] : [cap(pair)];
  const jobs = T.PARENT_JOBS[standing.id];
  const family = ctx.surname;
  for (const role of roles) {
    const g = role === 'Mother' ? 'f' : 'm';
    const name = `${firstName(r, ctx.species, g)}${family ? ` ${family}` : ''}`;
    const status = r.pickW(T.PARENT_STATUS);
    const pp = pronouns(g);
    const p = { relation: role, name, job: r.pick(jobs), temper: r.pick(T.PARENT_TEMPERS), status: status.text };
    parents.push(p);
    items.push(`${role}: ${name}, ${withArticle(p.job)}, ${p.temper}; ${p.status}.`);
    if (status.hook) ctx.hooks.push(fill(status.hook, ctx, r, { parent: name, parent_their: pp.their, parent_they: pp.they }));
    if (status.text.includes('died') || status.text.includes('killed') || status.text.includes('murdered') || status.text.includes('lost')) ctx.losses.push(role.toLowerCase());
  }
  ctx.parents = parents;

  const nSib = r.pickW({ 0: 18, 1: 26, 2: 24, 3: 16, 4: 9, 5: 5, 7: 2 });
  const sibs = [];
  if (birth.sibling === 'twin') sibs.push(`a twin who died at birth`);
  for (let i = 0; i < +nSib; i++) {
    const g = r.pick(['f', 'm']);
    const fate = fill(r.pick(T.SIBLING_FATES), ctx, r);
    sibs.push(`${firstName(r, ctx.species, g)} (${r.chance(0.5) ? 'older' : 'younger'} ${g === 'f' ? 'sister' : 'brother'}), who ${fate}`);
  }
  items.push(sibs.length ? `Siblings: ${sibs.join('; ')}.` : `No siblings; ${ctx.first} grew up the only child.`);
  if (r.chance(0.4)) { ctx.vars.familySecret = fill(r.pick(T.FAMILY_SECRETS), ctx, r); items.push(`Family secret: ${ctx.vars.familySecret}`); }
  return items;
}

function upbringing(ctx, r) {
  const raised = r.pickW(T.RAISED_BY.filter((x) => !x.standing || x.standing.includes(ctx.standing.id)));
  const items = [`Raised by ${fill(raised.text, ctx, r)}.`];
  const ages = (lo, hi, n) => Array.from({ length: n }, () => r.range(lo, hi)).sort((a, b) => a - b);
  const kids = r.sample(T.CHILDHOOD, r.range(2, 3));
  ages(4, 12, kids.length).forEach((age, i) => items.push(event(ctx, r, kids[i], age)));
  const teens = r.sample(T.ADOLESCENCE, r.range(1, 2));
  ages(13, 17, teens.length).forEach((age, i) => items.push(event(ctx, r, teens[i], age)));
  return items;
}

function event(ctx, r, e, age) {
  const local = {};
  const text = fill(e.text, ctx, r, local);
  if (e.trait) ctx.leanings.push(e.trait);
  if (e.person) ctx.people.push({ relation: e.person[0], who: fill(e.person[1], ctx, r, local), name: local.npc });
  if (e.item) ctx.keepsakes.push(e.item);
  if (e.drive) ctx.drives.push(e.drive);
  if (e.hook) ctx.hooks.push(fill(e.hook, ctx, r, local));
  return age != null ? `Age ${age}: ${text}` : text;
}

function calling(ctx, r) {
  const items = [fill(r.pick(T.BACKGROUND_WHY[ctx.background]), ctx, r)];
  const mentor = ctx.newName(r);
  const local = { mentor };
  const why = r.pick(T.CLASS_WHY[ctx.cls]);
  items.push(fill(why, ctx, r, local));
  if (why.includes('{mentor}')) ctx.people.push({ relation: 'Mentor', name: mentor, who: `${mentor}, who trained ${ctx.first} as ${withArticle(ctx.cls.toLowerCase())}` });
  if (ctx.level >= 3 && T.SUBCLASS_FLAVOR[ctx.subclass]) items.push(`As a follower of the ${ctx.subclass}, ${ctx.first} ${fill(T.SUBCLASS_FLAVOR[ctx.subclass], ctx, r)}.`);
  return items;
}

function life(ctx, r) {
  const adultYears = Math.max(0, ctx.ageYears - (SPECIES[ctx.species].age[0]));
  const n = Math.min(4, 1 + Math.floor(adultYears / 12) + (ctx.level >= 5 ? 1 : 0));
  const startAge = SPECIES[ctx.species].age[0];
  const evs = r.sample(T.ADULT_EVENTS, n);
  const ages = evs.map(() => r.range(startAge, Math.max(startAge, ctx.ageYears - 1))).sort((a, b) => a - b);
  const items = evs.map((e, i) => event(ctx, r, e, ages[i]));
  if (ctx.level > 1) items.push(`Since taking up adventuring, ${ctx.first} has survived enough to reach level ${ctx.level}.`);
  return items;
}

function people(ctx, r) {
  const have = new Set(ctx.people.map((p) => p.relation));
  const want = ['Mentor', 'Rival', 'Friend', 'Enemy', 'Love'].filter((rel) => !have.has(rel) && r.chance(rel === 'Friend' ? 0.9 : rel === 'Love' ? 0.35 : 0.55));
  for (const rel of want) {
    const name = ctx.newName(r);
    ctx.people.push({ relation: rel, name, who: `${name}, ${withArticle(r.pick(T.PEOPLE_JOBS))}` });
  }
  return ctx.people.map((p) => {
    const extra = T.PEOPLE_ROLES[p.relation] ? fill(r.pick(T.PEOPLE_ROLES[p.relation]), ctx, r) : '';
    return `${p.relation}: ${cap(p.who)}${extra ? `. ${cap(extra)}` : ''}.`;
  });
}

function personality(ctx, r) {
  const lean = ctx.leanings.length ? ctx.leanings : ['N'];
  const t1 = r.pick(T.TRAITS[r.pick(lean)]);
  let t2 = r.pick(T.TRAITS[r.pick(['L', 'D', 'N', 'N', r.pick(lean)])]);
  if (t2 === t1) t2 = r.pick(T.TRAITS.N.filter((t) => t !== t1));
  const al = ctx.alignment.toLowerCase();
  const idealKey = al.includes('evil') ? 'evil' : al.includes('good') ? (r.chance(0.5) ? 'good' : al.startsWith('lawful') ? 'lawful' : al.startsWith('chaotic') ? 'chaotic' : 'good') : al.startsWith('lawful') ? 'lawful' : al.startsWith('chaotic') ? 'chaotic' : 'neutral';
  return [
    `Traits: ${t1}. ${t2}.`,
    `Ideal: ${r.pick(T.IDEALS[idealKey])}`,
    `Bond: ${r.pick(T.BONDS)}`,
    `Flaw: ${r.pick(T.FLAWS)}`,
    `Fear: ${cap(r.pick(T.FEARS))}.`,
    `Habit: ${cap(fill(r.pick(T.HABITS), ctx, r))}.`,
    `Voice: ${cap(r.pick(T.VOICES))}.`,
  ];
}

function drives(ctx, r) {
  const goal = ctx.drives[0] || fill(r.pick(T.GOALS), ctx, r);
  const secret = fill(r.pick(T.SECRETS), ctx, r);
  ctx.vars.secret = secret;
  const items = [
    `Goal: To ${goal}.`,
    `Dream: ${cap(fill(r.pick(T.DREAMS), ctx, r))}.`,
    `Secret: ${ctx.first} ${secret}.`,
    `Regret: ${cap(r.pick(T.REGRETS))}.`,
  ];
  if (ctx.keepsakes.length) items.push(`Keepsakes: ${ctx.keepsakes.map(cap).join('; ')}.`);
  for (const s of ctx.secrets) items.push(`Also: ${s}`);
  return items;
}

function hooks(ctx, r) {
  const byRel = (rel) => ctx.people.find((p) => p.relation === rel)?.name;
  const local = { enemy: byRel('Enemy'), mentor: byRel('Mentor'), friend: byRel('Friend'), rival: byRel('Rival'), enemy_they: 'they', enemy_is: 'are', friend_they: 'they', friend_was: 'were' };
  const usable = T.HOOK_TEMPLATES.filter((h) => [...h.matchAll(/\{(\w+)\}/g)].every(([, k]) => !(k in local) || local[k]) && (!h.includes('{familySecret}') || ctx.vars.familySecret));
  const picks = r.sample(usable, 3 - Math.min(2, ctx.hooks.length)).map((h) => fill(h, ctx, r, { ...local }));
  return [...ctx.hooks.slice(0, 2), ...picks];
}

const withArticle = (w) => `${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}`;

// ---- main --------------------------------------------------------------------------------------

export function generateCharacter(opts = {}, seed = 'seed', salts = {}) {
  const R = (part) => subRng(seed, `${part}:${salts[part] || 0}`);
  const level = Math.max(1, Math.min(20, +opts.level || 1));
  const core = pickCore({ ...opts, level }, R('core'));
  const nr = R('name');
  const first = opts.name ? opts.name.split(' ')[0] : firstName(nr, core.species, core.gender);
  const fullName = opts.name || (() => { const l = (personName(nr, core.species, core.gender).split(' ').slice(1).join(' ')); return l ? `${first} ${l}` : first; })();
  const town = townName(nr), region = regionName(nr);

  const ab = rollAbilities(opts, core, R('abilities'));
  const br = R('build');
  const ups = levelUps(level, core, ab, br);
  const build = buildChoices(level, core, ab, br);
  const stats = derive(level, core, ab, build, ups);
  if (stats.spellcasting) {
    const sa = stats.spellcasting.ability;
    stats.spellbook = spellbook(build.casterKey === 'third' ? core.subclass : core.cls, level, R('spells'), { ability: sa, mod: mod(ab.scores[sa]), pb: stats.pb });
  }

  const ctx = {
    name: fullName, first, surname: fullName.split(' ').slice(1).join(' ').replace(/^(the|of)\b.*$/i, ''), town, region,
    species: core.species, cls: core.cls, subclass: core.subclass, background: core.background, alignment: core.alignment, level,
    ageYears: core.age, pro: pronouns(core.gender), vars: {}, people: [], leanings: [], keepsakes: [], drives: [], hooks: [], secrets: [], losses: [],
    newName: (rr) => personName(rr, rr.chance(0.7) ? core.species : rr.pickW(SPECIES_WEIGHTS) === 'Human' ? 'Human' : core.species, rr.pick(['f', 'm'])),
  };
  const story = {};
  story.origins = origins(ctx, R('origins'));
  story.upbringing = upbringing(ctx, R('upbringing'));
  story.calling = calling(ctx, R('calling'));
  story.life = life(ctx, R('life'));
  story.people = people(ctx, R('people'));
  story.personality = personality(ctx, R('personality'));
  story.drives = drives(ctx, R('drives'));
  story.hooks = hooks(ctx, R('hooks'));

  const sp = SPECIES[core.species], c = CLASSES[core.cls], bg = BACKGROUNDS[core.background];
  const ft = Math.floor(core.heightFt), inch = Math.round((core.heightFt - ft) * 12);
  const looks = `${core.looks.hair} hair, ${core.looks.eyes} eyes, ${fill(core.looks.mark, ctx, subRng(seed, 'looks'))}`;
  const summary = `${fullName} is ${withArticle(String(core.age))}-year-old ${['Elf', 'Gnome'].includes(core.species) && core.lineage ? core.lineage : core.species}${core.species === 'Dragonborn' ? ` of ${core.lineage.toLowerCase()} ancestry` : ''} ${core.cls.toLowerCase()} from ${town}, once ${withArticle(core.background.toLowerCase())}. ${cap(ctx.pro.they)} ${ctx.pro.plural ? 'want' : 'wants'} to ${ctx.drives[0] || story.drives[0].replace(/^Goal: To /, '').replace(/\.$/, '')}.`;

  return {
    seed, salts: { ...salts }, opts: { ...opts, level },
    name: fullName, first, gender: core.gender, pronouns: `${ctx.pro.they}/${ctx.pro.them}`, species: core.species, lineage: core.lineage, cls: core.cls,
    subclass: level >= 3 ? core.subclass : null, futureSubclass: core.subclass, background: core.background, alignment: core.alignment,
    age: core.age, height: `${ft}′${inch}″`, looks, town, region, summary,
    abilities: ab, levelUps: ups.notes, feats: [...build.originFeats.map((f) => ({ name: f, text: ORIGIN_FEATS[f], kind: 'Origin' })), ...ups.feats.map((f) => ({ name: f, kind: 'General' })), ...(ups.boon ? [{ name: ups.boon, kind: 'Epic Boon' }] : [])],
    choices: build.choices, spells: build.spells, languages: build.languages,
    tools: [bg.tool, c.tools].filter(Boolean), armorProf: c.armorProf, weaponProf: c.weaponProf,
    equipment: { cls: c.gear, background: bg.gear },
    stats, story, people: ctx.people,
    size: sp.size,
  };
}

export const abilityMod = mod;
export const fmtMod = sign;

export function characterText(ch) {
  const s = ch.stats, a = ch.abilities.scores;
  const L = [];
  L.push(`${ch.name} (${ch.pronouns})`);
  L.push(`Level ${s.level} ${ch.species}${ch.lineage ? ` (${ch.lineage})` : ''} ${ch.cls}${ch.subclass ? `, ${ch.subclass}` : ''} · ${ch.background} · ${ch.alignment}`);
  L.push(`Age ${ch.age}, ${ch.height}; ${ch.looks}`);
  L.push('');
  L.push(ABILITIES.map((k) => `${k} ${a[k]} (${sign(mod(a[k]))})`).join('  '));
  L.push(`HP ${s.hp} · AC ${s.ac} (${s.acNote}) · Initiative ${sign(s.initiative)} · Speed ${s.speed} ft · Proficiency ${sign(s.pb)} · Hit Dice ${s.hitDice}${s.darkvision ? ` · Darkvision ${s.darkvision} ft` : ''} · Passive Perception ${s.passive}`);
  L.push(`Saves: ${s.saves.map((x) => `${x.ability} ${sign(x.mod)}${x.prof ? '*' : ''}`).join(', ')}`);
  L.push(`Skills: ${s.skills.filter((k) => k.prof).map((k) => `${k.name} ${sign(k.mod)}${k.expert ? ' (expertise)' : ''}`).join(', ')}`);
  L.push(`Attack: ${s.weapon.name} ${sign(s.weapon.toHit)} to hit, ${s.weapon.damage}${s.weapon.attacks > 1 ? `, ${s.weapon.attacks} attacks` : ''}`);
  if (s.spellcasting) L.push(`Spellcasting (${s.spellcasting.ability}): save DC ${s.spellcasting.dc}, attack ${sign(s.spellcasting.attack)}; slots ${s.spellcasting.slots}`);
  if (s.spellbook) L.push(...spellText(s.spellbook).split('\n').slice(2).map((x) => `  ${x}`));
  if (s.resources.length) L.push(`Resources: ${s.resources.join('; ')}`);
  L.push(`Feats: ${ch.feats.map((f) => f.name).join(', ')}`);
  for (const [k, v] of Object.entries(ch.choices)) L.push(`${k}: ${v}`);
  L.push(`Species traits: ${s.speciesTraits.map((t) => t.name).join(', ')}`);
  L.push(`Class features: ${s.features.map((f) => f.name).join(', ')}`);
  if (ch.levelUps.length) L.push(`Level-ups: ${ch.levelUps.join('; ')}`);
  L.push(`Proficiencies: ${ch.armorProf}; ${ch.weaponProf}; tools: ${ch.tools.join(', ')}`);
  L.push(`Languages: ${ch.languages.join(', ')}`);
  L.push(`Equipment: ${ch.equipment.cls}; ${ch.equipment.background}`);
  L.push('');
  L.push(ch.summary);
  for (const [k, title] of Object.entries(STORY_SECTIONS)) {
    L.push('', title.toUpperCase(), ...(ch.story[k] || []).map((x) => `- ${x}`));
  }
  return L.join('\n');
}
