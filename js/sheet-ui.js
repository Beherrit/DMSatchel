// Player character sheets on character entries: the full Forge sheet rebuilt from its recipe, and a play tracker
// (hit points, conditions, spell slots, hit dice, coins, inventory, notes) that the player and the GMs can change.
// The tracker is saved with the entry, so everyone at the table sees the same numbers.
import { el, toast, confirmButton, setKids } from './dom.js';
import { generateCharacter, characterText, abilityMod, fmtMod } from './character.js';
import { ABILITIES, ABILITY_NAMES } from './rules2024.js';
import { ORD } from './spells.js';
import { world, patchEntry, worldEntries, link } from './world-store.js';
import { MAGIC_ITEMS, RARITIES } from './magic-items.js';
import { matchItems } from './inventory-items.js';
import { coinText, parseCoins } from './economy.js';

export const CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];

const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
export const forgeOf = (e) => parse(e.fields?.forge);
export function characterOf(e) {
  const f = forgeOf(e);
  if (!f?.seed) return null;
  try { return generateCharacter(f.opts || {}, f.seed, f.salts || {}); } catch { return null; }
}

// A class feature; library classes can carry a short description of what it does.
export const featureItem = (f) => el('li', {}, el('span', { class: 'lv' }, f.level), f.name, f.text ? el('p', { class: 'small muted' }, f.text) : null);

// The recipe saved with a Forge character: enough to rebuild it exactly, at any level.
// "Any from my library" is saved as the option actually picked, so the character rebuilds the same way later.
export const forgeRecipe = (ch) => JSON.stringify({ seed: ch.seed, salts: ch.salts, opts: {
  ...ch.opts, ...(ch.opts.species === 'library' ? { species: ch.species } : {}), ...(ch.opts.cls === 'library' ? { cls: ch.cls } : {}), ...(ch.opts.background === 'library' ? { background: ch.background } : {}), ...(ch.opts.subclass === 'library' ? { subclass: ch.futureSubclass } : {}),
} });

// Entry fields for a Forge character (used by "Add to world" and by level-up).
export function characterFields(ch) {
  return {
    species: ch.lineage ? `${ch.species} (${ch.lineage})` : ch.species, class: ch.subclass ? `${ch.cls} (${ch.subclass})` : ch.cls,
    level: String(ch.stats.level), background: ch.background, sheet: characterText(ch), forge: forgeRecipe(ch),
  };
}

function slotTable(ch) {
  const sb = ch?.stats.spellbook;
  if (!sb) return null;
  if (sb.pact) return { pact: { n: sb.pact[0], level: sb.pact[1] } };
  return { slots: sb.slots };
}

// The gold listed in a Forge character's starting gear ("…, 5 GP").
const startingCoins = (ch) => (ch ? [...`${ch.equipment.cls} ${ch.equipment.background}`.matchAll(/(\d+)\s*GP/gi)].reduce((t, m) => t + Number(m[1]) * 100, 0) : 0);

function defaults(e, ch) {
  const p = parse(e.fields?.play) || {};
  const max = Number(p.maxhp) || ch?.stats.hp || 0;
  return {
    hp: Number.isFinite(p.hp) ? p.hp : max, maxhp: p.maxhp || null, temp: p.temp || 0, ac: p.ac || null,
    conditions: Array.isArray(p.conditions) ? p.conditions : [], exhaustion: p.exhaustion || 0, inspiration: Boolean(p.inspiration),
    slots: p.slots || {}, hd: p.hd || 0, death: p.death || { ok: 0, fail: 0 }, cp: Number.isFinite(p.cp) ? p.cp : startingCoins(ch),
    inventory: p.inventory ?? (ch ? `${ch.equipment.cls}\n${ch.equipment.background}` : ''), notes: p.notes || '',
  };
}

// Saves are queued so quick clicks don't trip over each other; if someone else saved meanwhile, take their entry and retry.
const queue = new Map();
function save(id, play) {
  const q = queue.get(id) || { busy: false, next: null };
  q.next = play; queue.set(id, q);
  if (q.busy) return;
  const run = async () => {
    q.busy = true;
    while (q.next) {
      const p = q.next; q.next = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try { await patchEntry(world.entries.get(id), { fields: { play: JSON.stringify(p) } }); break; }
        catch (err) {
          if (err.status === 409 && err.body?.entry && attempt === 0) { world.entries.set(id, err.body.entry); continue; }
          toast(`Couldn’t save the sheet: ${err.message}`, 'bad'); break;
        }
      }
    }
    q.busy = false;
  };
  run();
}

// Add (or take) coins on a character's sheet, from outside the sheet (splitting the party's loot). Retries once
// if someone saved the sheet meanwhile.
export async function addCoins(e, cp) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const cur = world.entries.get(e.id) || e;
    const play = defaults(cur, characterOf(cur));
    play.cp += cp;
    try { return await patchEntry(cur, { fields: { play: JSON.stringify(play) } }); }
    catch (err) { if (err.status === 409 && err.body?.entry && attempt === 0) { world.entries.set(e.id, err.body.entry); continue; } throw err; }
  }
}

export function sheetSection(e, rerender) {
  const ch = characterOf(e);
  const box = el('section', { class: 'card pc-sheet' });
  const can = Boolean(e.can_edit);
  let play = defaults(e, ch);
  const maxhp = () => Number(play.maxhp) || ch?.stats.hp || 0;
  const commit = (msg) => { save(e.id, play); draw(); if (msg) toast(msg); };

  function hpBlock() {
    const max = maxhp();
    const pct = max ? Math.max(0, Math.min(100, (play.hp / max) * 100)) : 0;
    const amt = el('input', { type: 'number', min: 0, class: 'hp-amt', 'aria-label': 'Amount', placeholder: '0' });
    const apply = (sign) => {
      const n = Math.abs(parseInt(amt.value, 10) || 0); if (!n) { amt.focus(); return; }
      if (sign < 0) { const fromTemp = Math.min(play.temp, n); play.temp -= fromTemp; play.hp = Math.max(0, play.hp - (n - fromTemp)); }
      else { play.hp = Math.min(max || Infinity, play.hp + n); if (play.hp > 0) play.death = { ok: 0, fail: 0 }; }
      commit();
    };
    return el('div', { class: 'hp-block' },
      el('div', { class: 'hp-top' }, el('span', { class: 'eyebrow' }, 'Hit points'),
        el('strong', { class: `hp-now${play.hp === 0 ? ' down' : ''}` }, `${play.hp}`, el('span', { class: 'muted' }, ` / ${max || '?'}`)),
        play.temp ? el('span', { class: 'tag temp' }, `+${play.temp} temp`) : null),
      el('div', { class: 'hp-bar', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': play.hp, 'aria-label': 'Hit points' }, el('span', { style: `width:${pct}%` })),
      can ? el('div', { class: 'hp-controls' }, el('button', { class: 'btn small', type: 'button', onclick: () => apply(-1) }, 'Damage'), amt,
        el('button', { class: 'btn small', type: 'button', onclick: () => apply(1) }, 'Heal'),
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => { const n = Math.abs(parseInt(amt.value, 10) || 0); play.temp = n; commit(n ? `${n} temporary HP` : 'Temporary HP cleared'); } }, 'Set temp')) : null,
      play.hp === 0 ? deathSaves() : null);
  }

  function deathSaves() {
    const row = (key, label) => el('div', { class: 'death-row' }, el('span', {}, label), el('span', { class: 'pips' }, [0, 1, 2].map((i) => el('button', {
      type: 'button', class: `pip ${key}${play.death[key] > i ? '' : ' used'}`, disabled: can ? null : true, 'aria-label': `${label} ${i + 1}`, 'aria-pressed': String(play.death[key] > i),
      onclick: () => { play.death = { ...play.death, [key]: play.death[key] > i ? i : i + 1 }; commit(play.death.fail >= 3 ? 'Three failures…' : play.death.ok >= 3 ? 'Stable' : ''); },
    }))));
    return el('div', { class: 'death-saves' }, el('span', { class: 'eyebrow' }, 'Death saves'), row('ok', 'Successes'), row('fail', 'Failures'));
  }

  function conditions() {
    const chip = (c) => el('button', { type: 'button', class: 'chip-btn small', 'aria-pressed': String(play.conditions.includes(c)), disabled: can ? null : true,
      onclick: () => { play.conditions = play.conditions.includes(c) ? play.conditions.filter((x) => x !== c) : [...play.conditions, c]; commit(); } }, c);
    const shown = can ? CONDITIONS : play.conditions;
    return el('div', { class: 'conds' }, el('span', { class: 'eyebrow' }, 'Conditions'),
      shown.length ? el('div', { class: 'type-chips' }, shown.map(chip)) : el('span', { class: 'muted small' }, 'None'),
      el('div', { class: 'cond-extra' },
        el('span', {}, 'Exhaustion ', el('strong', {}, play.exhaustion), play.exhaustion ? el('span', { class: 'muted small' }, ` (−${play.exhaustion * 2} to d20 tests, −${play.exhaustion * 5} ft speed)`) : null),
        can ? [el('button', { class: 'btn small ghost', type: 'button', 'aria-label': 'Less exhaustion', onclick: () => { play.exhaustion = Math.max(0, play.exhaustion - 1); commit(); } }, '−'),
          el('button', { class: 'btn small ghost', type: 'button', 'aria-label': 'More exhaustion', onclick: () => { play.exhaustion = Math.min(6, play.exhaustion + 1); commit(play.exhaustion === 6 ? 'Exhaustion 6: the character dies' : ''); } }, '+')] : null,
        el('button', { type: 'button', class: 'chip-btn small', 'aria-pressed': String(play.inspiration), disabled: can ? null : true, onclick: () => { play.inspiration = !play.inspiration; commit(); } }, 'Heroic Inspiration')));
  }

  function slots() {
    const t = slotTable(ch);
    if (!t) return null;
    const rows = t.pact ? [[`${ORD[t.pact.level]} (pact)`, t.pact.n, 'pact']] : t.slots.map((n, i) => [ORD[i + 1], n, String(i + 1)]).filter(([, n]) => n);
    return el('div', { class: 'slots' }, el('span', { class: 'eyebrow' }, 'Spell slots'), rows.map(([label, n, key]) => el('div', { class: 'slot-row' }, el('span', { class: 'slot-l' }, label),
      el('span', { class: 'pips' }, Array.from({ length: n }, (_, i) => el('button', {
        type: 'button', class: `pip${(play.slots[key] || 0) > i ? ' used' : ''}`, disabled: can ? null : true, 'aria-label': `${label} slot ${i + 1}`, 'aria-pressed': String((play.slots[key] || 0) > i),
        onclick: () => { const used = play.slots[key] || 0; play.slots = { ...play.slots, [key]: used > i ? i : i + 1 }; commit(); },
      }))))));
  }

  function rests() {
    const m = /^(\d+)d(\d+)/.exec(ch?.stats.hitDice || '');
    const total = m ? +m[1] : Number(e.fields?.level) || 0;
    const die = m ? m[2] : null;
    return el('div', { class: 'rests' },
      total ? el('span', {}, el('span', { class: 'eyebrow' }, 'Hit dice '), `${Math.max(0, total - play.hd)} of ${total}${die ? ` d${die}` : ''} left`,
        can && play.hd < total ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => { play.hd += 1; commit(`Spent a hit die: roll d${die || '?'} + CON and press Heal`); } }, 'Spend one') : null) : null,
      can ? el('div', { class: 'btnrow' },
        el('button', { class: 'btn small', type: 'button', onclick: () => { if (slotTable(ch)?.pact) play.slots = {}; commit(slotTable(ch)?.pact ? 'Short rest: pact slots back' : 'Short rest taken'); } }, 'Short rest'),
        confirmButton('Long rest', () => {
          play.hp = maxhp(); play.temp = 0; play.slots = {}; play.death = { ok: 0, fail: 0 };
          play.hd = Math.max(0, play.hd - Math.max(1, Math.floor(total / 2))); play.exhaustion = Math.max(0, play.exhaustion - 1);
          commit('Long rest: HP and slots restored, half your hit dice back, one level of exhaustion gone');
        }, 'btn small')) : null);
  }

  function purse() {
    const amt = el('input', { type: 'text', class: 'coin-amt', placeholder: 'e.g. 15 gp', 'aria-label': 'Coins' });
    const move = (sign) => { const cp = parseCoins(amt.value); if (!cp) { toast('Write coins like “15 gp” or “2 sp”'); return; } play.cp += sign * cp; commit(); };
    return el('div', { class: 'purse' }, el('span', { class: 'eyebrow' }, 'Coin'), el('strong', {}, coinText(play.cp)),
      can ? el('div', { class: 'hp-controls' }, amt, el('button', { class: 'btn small', type: 'button', onclick: () => move(1) }, 'Add'), el('button', { class: 'btn small', type: 'button', onclick: () => move(-1) }, 'Spend')) : null);
  }

  function textBox(key, label, rows) {
    const t = el('textarea', { rows, 'aria-label': label, readonly: can ? null : true }, play[key] || '');
    if (key === 'inventory') t.addEventListener('input', () => { play.inventory = t.value; drawItems(); });
    t.addEventListener('change', () => { play[key] = t.value.slice(0, 15000); save(e.id, play); toast(`${label} saved`); });
    return el('div', { class: 'field wide' }, el('label', {}, label), t);
  }

  // Items named in the inventory that the world, the library or the SRD knows: link them and say what they do.
  const itemsBox = el('div', { class: 'inv-items' });
  let itemTimer = null;
  function drawItems() {
    clearTimeout(itemTimer);
    itemTimer = setTimeout(() => {
      const worldItems = worldEntries().filter((x) => x.kind === 'item').map((x) => ({ name: x.name, entry: x, rarity: x.fields?.rarity, summary: x.summary || String(x.fields?.properties || '').split('\n')[0] }));
      const known = new Set(worldItems.map((x) => x.name.toLowerCase()));
      const srd = MAGIC_ITEMS.filter((m) => !/,\s*\+\d/.test(m.name) && !known.has(m.name.toLowerCase())).map((m) => ({ name: m.name, rarity: RARITIES[m.rarity], summary: m.summary, attunement: m.attunement }));
      const found = matchItems(play.inventory, [...worldItems, ...srd]);
      setKids(itemsBox, found.length ? [el('span', { class: 'eyebrow' }, 'Items on this sheet'), el('ul', { class: 'plain inv-list' }, found.map((x) => el('li', {},
        x.entry ? link(x.entry) : el('strong', {}, x.name), x.rarity ? el('span', { class: 'muted small' }, ` ${x.rarity}${x.attunement ? ', attunement' : ''}`) : null,
        x.summary ? el('div', { class: 'small' }, x.summary.length > 220 ? `${x.summary.slice(0, 219)}…` : x.summary) : null)))] : []);
    }, 250);
  }
  function inventoryItems() { drawItems(); return itemsBox; }

  function manual() {
    if (ch || !can) return null;
    const mx = el('input', { type: 'number', min: 1, value: play.maxhp || '', 'aria-label': 'Maximum hit points', class: 'hp-amt' });
    const ac = el('input', { type: 'number', min: 1, value: play.ac || '', 'aria-label': 'Armor class', class: 'hp-amt' });
    const go = () => { play.maxhp = Number(mx.value) || null; play.ac = Number(ac.value) || null; if (play.hp > maxhp()) play.hp = maxhp(); commit('Saved'); };
    return el('div', { class: 'manual' }, el('p', { class: 'muted small' }, 'This character wasn’t made in the Character Forge, so set the numbers here.'),
      el('div', { class: 'controls' }, el('label', { class: 'check' }, 'Max HP ', mx), el('label', { class: 'check' }, 'AC ', ac), el('button', { class: 'btn small', type: 'button', onclick: go }, 'Set')));
  }

  function levelUp() {
    if (!ch || !can || ch.stats.level >= 20) return null;
    return confirmButton(`Level up to ${ch.stats.level + 1}`, async () => {
      const f = forgeOf(e);
      const next = generateCharacter({ ...f.opts, level: ch.stats.level + 1 }, f.seed, f.salts || {});
      const had = new Set(ch.stats.features.map((x) => x.name));
      const gained = next.stats.features.filter((x) => !had.has(x.name)).map((x) => x.name);
      play.hp += next.stats.hp - ch.stats.hp;
      try {
        await patchEntry(world.entries.get(e.id), { fields: { ...characterFields(next), play: JSON.stringify(play) } });
        toast(`Level ${next.stats.level}! +${next.stats.hp - ch.stats.hp} max HP${gained.length ? `; new: ${gained.join(', ')}` : ''}`);
        rerender();
      } catch (err) { toast(err.message, 'bad'); }
    }, 'btn small primary');
  }

  function draw() {
    const s = ch?.stats;
    setKids(box,
      el('div', { class: 'entry-head' }, el('h3', {}, 'Character sheet'), levelUp()),
      ch ? el('p', { class: 'muted small' }, `Level ${s.level} ${ch.species} ${ch.cls}${ch.subclass ? ` (${ch.subclass})` : ''} · ${ch.background} · ${ch.alignment}`) : null,
      el('div', { class: 'tracker' }, hpBlock(), el('div', { class: 'stats' },
        el('div', { class: 'stat' }, el('span', { class: 'stat-l' }, 'Armor class'), el('span', { class: 'stat-v' }, play.ac || s?.ac || '—'), s && !play.ac ? el('span', { class: 'stat-n' }, s.acNote) : null),
        s ? [['Initiative', fmtMod(s.initiative)], ['Speed', `${s.speed - play.exhaustion * 5} ft`], ['Proficiency', fmtMod(s.pb)], ['Passive Perception', s.passive]].map(([l, v]) => el('div', { class: 'stat' }, el('span', { class: 'stat-l' }, l), el('span', { class: 'stat-v' }, v))) : null)),
      manual(), conditions(), slots(), rests(),
      ch ? el('div', { class: 'abilities' }, ABILITIES.map((k) => el('div', { class: 'ability', title: ABILITY_NAMES[k] },
        el('span', { class: 'ab-name' }, k), el('span', { class: 'ab-mod' }, fmtMod(abilityMod(ch.abilities.scores[k]))), el('span', { class: 'ab-score' }, ch.abilities.scores[k])))) : null,
      ch ? el('details', { class: 'sheet-more' }, el('summary', {}, 'Saves, skills, attacks, spells and features'), fullSheet(ch)) : null,
      el('div', { class: 'pc-cols' }, purse(), textBox('inventory', 'Inventory', 6)), inventoryItems(),
      textBox('notes', 'Notes', 4));
  }
  draw();
  return box;
}

function fullSheet(ch) {
  const s = ch.stats;
  const sec = (t, ...k) => el('section', { class: 'sheet-block' }, el('h4', {}, t), ...k);
  return el('div', { class: 'sheet-cols' },
    el('div', { class: 'sheet-col' },
      sec('Saving throws', el('ul', { class: 'skill-list' }, s.saves.map((x) => el('li', { class: x.prof ? 'prof' : '' }, el('span', {}, ABILITY_NAMES[x.ability]), el('span', { class: 'v' }, fmtMod(x.mod)))))),
      sec('Skills', el('ul', { class: 'skill-list' }, s.skills.map((x) => el('li', { class: x.expert ? 'prof expert' : x.prof ? 'prof' : '' }, el('span', {}, x.name, el('small', {}, ` ${x.ability}`)), el('span', { class: 'v' }, fmtMod(x.mod)))))),
      sec('Attack', el('p', {}, `${s.weapon.name}: ${fmtMod(s.weapon.toHit)} to hit, ${s.weapon.damage} damage${s.weapon.attacks > 1 ? `, ${s.weapon.attacks} attacks per Attack action` : ''}.`)),
      s.spellbook ? sec('Spells', el('p', {}, `Save DC ${s.spellbook.dc} · spell attack ${fmtMod(s.spellbook.attack)} · ${ABILITY_NAMES[s.spellbook.ability] || s.spellbook.ability}`),
        s.spellbook.cantrips.length ? el('p', {}, el('strong', {}, 'Cantrips: '), s.spellbook.cantrips.join(', ')) : null,
        Object.entries(s.spellbook.byLevel).sort((a, b) => a[0] - b[0]).map(([l, n]) => el('p', {}, el('strong', {}, `${ORD[l]}: `), n.join(', '))),
        s.spellbook.fromLibrary ? el('p', { class: 'muted small' }, `From your library: ${s.spellbook.fromLibrary.join(', ')}.`) : null) : null,
      s.resources.length ? sec('Class resources', el('ul', { class: 'plain' }, s.resources.map((x) => el('li', {}, x)))) : null,
      sec('Proficiencies', el('p', {}, `Armor: ${ch.armorProf}. Weapons: ${ch.weaponProf}. Tools: ${ch.tools.join(', ')}. Languages: ${ch.languages.join(', ')}.`))),
    el('div', { class: 'sheet-col' },
      sec('Feats', el('ul', { class: 'feature-list' }, ch.feats.map((f) => el('li', {}, el('strong', {}, f.name), el('span', { class: 'tag' }, f.kind), f.text ? el('p', {}, f.text) : null)))),
      Object.keys(ch.choices).length ? sec('Choices', el('ul', { class: 'plain' }, Object.entries(ch.choices).map(([k, v]) => el('li', {}, el('strong', {}, `${k}: `), v)))) : null,
      sec(`${ch.species} traits`, el('ul', { class: 'feature-list' }, s.speciesTraits.map((t) => el('li', {}, el('strong', {}, t.name), el('p', {}, t.text))))),
      sec(`${ch.cls} features`, el('ol', { class: 'level-list' }, s.features.map(featureItem))),
      ch.library?.subclass ? sec(`${ch.library.subclass.name} (your library)`, el('p', { class: 'small' }, ch.library.subclass.features), ch.library.subclass.source ? el('p', { class: 'muted small' }, ch.library.subclass.source) : null) : null));
}

// Hit points and conditions at a glance (for the party and session prep pages).
export function vitals(e) {
  const ch = characterOf(e);
  const p = defaults(e, ch);
  return { hp: p.hp, max: Number(p.maxhp) || ch?.stats.hp || 0, temp: p.temp, conditions: p.conditions, exhaustion: p.exhaustion, inspiration: p.inspiration, ac: p.ac || ch?.stats.ac || null };
}
