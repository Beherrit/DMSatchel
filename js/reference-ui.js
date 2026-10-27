// Rules reference: species, classes, backgrounds and feats from the 2024 rules (short paraphrases).
import { el, setKids } from './dom.js';
import { SPECIES, CLASSES, BACKGROUNDS, ORIGIN_FEATS, GENERAL_FEATS, EPIC_BOONS, ABILITY_NAMES, FULL_SLOTS } from './rules2024.js';
import { MAGIC_ITEMS, RARITIES, RARITY_KEYS, ITEM_TYPES, baseType, itemEntry, concrete } from './magic-items.js';
import { SPELLS, ORD } from './spells.js';
import { isGm } from './api.js';
import { makeRng } from './rng.js';

const TABS = [['classes', 'Classes'], ['species', 'Species'], ['backgrounds', 'Backgrounds'], ['feats', 'Feats'], ['spells', 'Spells'], ['items', 'Magic items'], ['slots', 'Spell slots']];
let root, body, filter;

const card = (title, sub, ...kids) => el('article', { class: 'card ref-card', 'data-search': `${title} ${sub}`.toLowerCase() }, el('h3', {}, title), sub ? el('p', { class: 'card-sub' }, sub) : null, ...kids);
const dl = (rows) => el('dl', { class: 'traits' }, rows.filter(([, v]) => v).flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, el('span', {}, v))]));

function classes() {
  return Object.entries(CLASSES).map(([name, c]) => {
    const rows = Array.from({ length: 20 }, (_, i) => i + 1).filter((lv) => c.features[lv] || lv === 3)
      .map((lv) => el('tr', {}, el('td', { class: 'num' }, lv), el('td', {}, [...(lv === 3 ? ['Subclass'] : []), ...(c.features[lv] || [])].join(', '))));
    return card(name, `d${c.die} hit die · primary ${ABILITY_NAMES[c.priority[0]]}`,
      dl([['Saving throws', c.saves.map((s) => ABILITY_NAMES[s]).join(', ')], ['Skills', `Choose ${c.skillCount}: ${c.skills.length === 18 ? 'any' : c.skills.join(', ')}`], ['Armor', c.armorProf], ['Weapons', c.weaponProf], ['Tools', c.tools], ['Spellcasting', c.caster ? `${{ full: 'Full caster', half: 'Half caster', pact: 'Pact Magic' }[c.caster]} (${ABILITY_NAMES[c.spellAbility]})` : ''], ['Subclasses', c.subclasses.join(', ')], ['Starting gear', c.gear]]),
      el('details', {}, el('summary', {}, 'Features by level'), el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Level'), el('th', {}, 'Features'))), el('tbody', {}, rows)))));
  });
}
function species() {
  return Object.entries(SPECIES).map(([name, s]) => card(name, `${s.size} · speed ${s.speed} ft${s.darkvision ? ` · darkvision ${s.darkvision} ft` : ''}`,
    el('ul', { class: 'feature-list' }, s.traits.map(([n, t, lv]) => el('li', {}, el('strong', {}, n), lv ? el('span', { class: 'tag' }, `level ${lv}`) : null, el('p', {}, t)))),
    s.lineages ? el('div', {}, el('h4', {}, `${s.lineageLabel} options`), el('ul', { class: 'feature-list' }, Object.entries(s.lineages).map(([n, t]) => el('li', {}, el('strong', {}, n), el('p', {}, name === 'Dragonborn' ? `${t} damage` : t))))) : null));
}
function backgrounds() {
  return Object.entries(BACKGROUNDS).map(([name, b]) => card(name, `Ability scores: ${b.abilities.map((a) => ABILITY_NAMES[a]).join(', ')}`,
    dl([['Origin feat', b.feat], ['Skills', b.skills.join(', ')], ['Tool', b.tool], ['Equipment', `${b.gear}, or 50 GP`]])));
}
function feats() {
  return [
    card('Origin feats', 'Taken at level 1 from a background (humans get one more)', el('ul', { class: 'feature-list' }, Object.entries(ORIGIN_FEATS).map(([n, t]) => el('li', {}, el('strong', {}, n), el('p', {}, t))))),
    card('General feats', 'Available from level 4 instead of an Ability Score Improvement', el('p', {}, [...new Set([...GENERAL_FEATS.martial, ...GENERAL_FEATS.caster, ...GENERAL_FEATS.skill])].sort().join(', '))),
    card('Epic Boons', 'Chosen at level 19', el('p', {}, EPIC_BOONS.join(', '))),
  ];
}
const itemFilter = { rarity: '', type: '', attune: '', cursed: false };
function items() {
  const rows = MAGIC_ITEMS.filter((i) => (!itemFilter.rarity || i.rarity === itemFilter.rarity) && (!itemFilter.type || baseType(i.type) === itemFilter.type)
    && (!itemFilter.attune || (itemFilter.attune === 'yes' ? i.attunement : !i.attunement)) && (!itemFilter.cursed || i.cursed));
  const sel = (key, label, opts) => { const s2 = el('select', { 'aria-label': label, onchange: (e) => { itemFilter[key] = e.target.value; showReference('items'); } }, opts.map(([v, t]) => el('option', { value: v }, t))); s2.value = itemFilter[key]; return s2; };
  const rng = makeRng(Date.now());
  return [el('div', { class: 'ref-filters card' }, sel('rarity', 'Rarity', [['', 'Any rarity'], ...Object.entries(RARITIES)]), sel('type', 'Type', [['', 'Any type'], ...ITEM_TYPES.map((t) => [t, t])]),
      sel('attune', 'Attunement', [['', 'Attunement: any'], ['yes', 'Needs attunement'], ['no', 'No attunement']]),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: itemFilter.cursed || null, onchange: (e) => { itemFilter.cursed = e.target.checked; showReference('items'); } }), ' Cursed only'),
      el('span', { class: 'muted small' }, `${rows.length} items`)),
    ...rows.map((i) => card(i.name, `${RARITIES[i.rarity]} · ${i.type}${i.attunement ? ` · ${i.attunement.toLowerCase()}` : ''}`,
      el('p', {}, i.cursed ? el('span', { class: 'tag cursed-tag' }, 'cursed') : null, ' ', i.summary),
      isGm() ? el('button', { class: 'btn small ghost world', type: 'button', onclick: () => window.dispatchEvent(new CustomEvent('world:draft', { detail: itemEntry(concrete(i, rng)) })) }, '+ Add to world') : null))];
}
function spells() {
  return Object.entries(SPELLS).filter(([c]) => !['Eldritch Knight', 'Arcane Trickster'].includes(c)).map(([cls, lists]) => card(`${cls} spells`, `${lists.reduce((t, l) => t + l.length, 0)} spells`,
    ...lists.map((names, lv) => (names.length ? el('div', { class: 'spell-row' }, el('span', { class: 'spell-lv' }, ORD[lv]), el('span', { class: 'spell-names' }, names.map((n) => el('span', { class: 'spell' }, n)))) : null))));
}
function slots() {
  const head = el('tr', {}, el('th', {}, 'Caster level'), ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'].map((s) => el('th', {}, s)));
  const rows = FULL_SLOTS.slice(1).map((row, i) => el('tr', {}, el('td', { class: 'num' }, i + 1), Array.from({ length: 9 }, (_, j) => el('td', { class: 'num' }, row[j] || '—'))));
  return [card('Spell slots', 'Full casters use their class level. Paladins and rangers use half their level (rounded up); Eldritch Knights and Arcane Tricksters a third (rounded up). Warlocks use Pact Magic instead.',
    el('div', { class: 'table-wrap' }, el('table', { class: 'slots' }, el('thead', {}, head), el('tbody', {}, rows))))];
}

export function showReference(tab = 'classes') {
  if (!TABS.some(([k]) => k === tab)) tab = 'classes';
  for (const b of root.querySelectorAll('.subtabs a')) b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false');
  setKids(body, ...{ classes, species, backgrounds, feats, spells, items, slots }[tab]());
  applyFilter();
}
function applyFilter() {
  const q = filter.value.trim().toLowerCase();
  for (const c of body.children) c.hidden = q && !c.classList.contains('ref-filters') && !c.textContent.toLowerCase().includes(q);
}

export function mountReference(r) {
  root = r;
  filter = el('input', { type: 'search', id: 'ref-filter', placeholder: 'Filter…', 'aria-label': 'Filter the reference' });
  filter.addEventListener('input', applyFilter);
  body = el('div', { class: 'ref-grid' });
  root.append(el('div', { class: 'panel-head' }, el('h2', {}, 'Rules Reference'), el('p', {}, 'Quick look-ups for the 2024 rules: what each class gets by level, species traits, backgrounds and feats. Summaries are short paraphrases; the Player’s Handbook has the full text.')),
    el('div', { class: 'controls' }, el('nav', { class: 'subtabs', 'aria-label': 'Reference sections' }, TABS.map(([k, t]) => el('a', { href: `#reference/${k}`, 'data-tab': k }, t))), filter), body);
}
