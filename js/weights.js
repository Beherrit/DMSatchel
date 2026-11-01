// Heavy packs: what a character carries, in pounds, against their carrying capacity (Strength × 15, halved for Tiny
// and doubled for Large or bigger). Item weights are the SRD 5.2 equipment tables' (CC BY 4.0); coins weigh fifty to
// the pound. Pure, so the sheet, the party sheet and the tests share it.
import { inventoryLines } from './handover.js';

const T = (s) => Object.fromEntries(s.split(';').map((x) => { const [k, v] = x.split('='); return [k.trim(), Number(v)]; }));

export const WEIGHTS = T([
  // Weapons
  'club=2;dagger=1;greatclub=10;handaxe=2;javelin=2;light hammer=2;mace=4;quarterstaff=4;sickle=2;spear=3;dart=0.25;light crossbow=5;shortbow=2;sling=0',
  'battleaxe=4;flail=2;glaive=6;greataxe=7;greatsword=6;halberd=6;lance=6;longsword=3;maul=10;morningstar=4;pike=18;rapier=2;scimitar=3;shortsword=2',
  'trident=4;war pick=2;warhammer=5;whip=3;blowgun=1;hand crossbow=3;heavy crossbow=18;longbow=2;musket=10;pistol=3;net=3',
  'arrow=0.05;bolt=0.075;crossbow bolt=0.075;sling bullet=0.075;needle=0.02;blowgun needle=0.02;firearm bullet=0.2',
  // Armour
  'padded armor=8;leather armor=10;studded leather armor=13;hide armor=12;chain shirt=20;scale mail=45;breastplate=20;half plate armor=40;half plate=40',
  'ring mail=40;chain mail=55;splint armor=60;splint=60;plate armor=65;plate=65;shield=6',
  // Adventuring gear
  'acid=1;alchemist\'s fire=1;antitoxin=0;backpack=5;ball bearings=2;barrel=70;basket=2;bedroll=7;bell=0;blanket=3;block and tackle=5;book=5',
  'bottle=2;glass bottle=2;bucket=2;burglar\'s pack=42;caltrops=2;candle=0;case=1;map or scroll case=1;crossbow bolt case=1;chain=10;chest=25',
  'climber\'s kit=12;clothes=3;common clothes=3;fine clothes=6;traveler\'s clothes=4;costume=4;robe=4;component pouch=2;crowbar=5',
  'diplomat\'s pack=39;dungeoneer\'s pack=55;entertainer\'s pack=58;explorer\'s pack=55;priest\'s pack=29;scholar\'s pack=22',
  'flask=1;grappling hook=4;hammer=3;healer\'s kit=3;holy water=1;hunting trap=25;ink=0;ink pen=0;jug=4;ladder=25;lamp=1;bullseye lantern=2',
  'hooded lantern=2;lantern=2;lock=1;magnifying glass=0;manacles=6;map=0;mirror=0.5;oil=1;paper=0;parchment=0;perfume=0;pick=10;miner\'s pick=10',
  'piton=0.25;poison=0;pole=7;pot=10;iron pot=10;potion of healing=0.5;potion=0.5;pouch=1;quiver=1;ram=35;portable ram=35;rations=2;ration=2',
  'rope=5;sack=0.5;shovel=5;signal whistle=0;spikes=0.5;iron spike=0.5;spyglass=1;string=0;tent=20;tinderbox=1;torch=1;vial=0;waterskin=5',
  'spellbook=3;arcane focus=1;crystal=1;orb=3;rod=2;staff=4;wand=1;holy symbol=1;amulet=1;emblem=0;reliquary=2;druidic focus=1;sprig of mistletoe=0',
  'wooden staff=4;yew wand=1;scroll=0;spell scroll=0',
  // Tools and instruments
  'thieves\' tools=1;cartographer\'s tools=6;herbalism kit=3;disguise kit=3;forgery kit=5;poisoner\'s kit=2;navigator\'s tools=2;smith\'s tools=8',
  'carpenter\'s tools=6;cook\'s utensils=8;tinker\'s tools=10;alchemist\'s supplies=8;brewer\'s supplies=9;calligrapher\'s supplies=5;cobbler\'s tools=5',
  'glassblower\'s tools=5;jeweler\'s tools=2;leatherworker\'s tools=5;mason\'s tools=8;painter\'s supplies=5;potter\'s tools=3;weaver\'s tools=5',
  'woodcarver\'s tools=5;dice set=0;playing cards=0;playing card set=0;bagpipes=6;drum=3;dulcimer=10;flute=1;horn=2;lute=2;lyre=2;pan flute=2;shawm=1;viol=1',
].join(';'));

const KEYS = Object.keys(WEIGHTS).sort((a, b) => b.length - a.length);
const clean = (s) => String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const singular = (s) => s.replace(/ies$/, 'y').replace(/(ch|sh|x)es$/, '$1').replace(/([^s'])s$/, '$1');

// The weight of one of an item, by name ("Rations (1 day)", "20 arrows" → "arrows", "+1 Longsword", "Chain mail"),
// or null when it isn't on the list. Bundles in the name ("Arrows (20)", "Iron spikes (10)") count per piece.
export function weightOf(name) {
  let n = clean(name).replace(/^(a|an|the) /, '').replace(/^\+\d+ /, '').replace(/ \+\d+$/, '');
  const bundle = /\((\d+)\)\s*$/.exec(n);
  n = n.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/,.*$/, '').trim();
  const each = bundle ? Number(bundle[1]) : 1;
  for (const v of [n, singular(n), n.replace(/^(\w+?)(e?s) of /, '$1 of ')]) if (v in WEIGHTS) return WEIGHTS[v] * each;
  // "Silvered longsword", "elven chain mail", "a coil of hempen rope": the longest known name inside it.
  const words = ` ${singular(n)} `, words2 = ` ${n} `;
  const hit = KEYS.find((k) => words.includes(` ${k} `) || words2.includes(` ${k} `));
  return hit ? WEIGHTS[hit] * each : null;
}

// The fewest coins that make up this much copper (gp, sp, cp), and what they weigh.
export function coinWeight(cp) {
  let n = Math.max(0, Math.round(Number(cp) || 0));
  const gp = Math.floor(n / 100); n -= gp * 100;
  const sp = Math.floor(n / 10); const c = n - sp * 10;
  const coins = gp + sp + c;
  return { coins, lb: coins / 50 };
}

export const capacityOf = (str, size = 'Medium') => {
  const s = Number(str);
  if (!(s > 0)) return null;
  const k = /tiny/i.test(size) ? 0.5 : /large|huge|gargantuan/i.test(size) ? 2 : 1;
  return s * 15 * k;
};

const round = (x) => Math.round(x * 10) / 10;

// play: the sheet's play state (inventory, cp); str, size: from the character. →
// { lb, items, coins, unknown: [names], capacity, over }
// What an inventory holds, item by item: { items: [{ name, qty }], loose } (loose: coins written into the text, such as a
// Forge starting kit's "4 GP"). A kit on one line ("Chain mail, greatsword, 8 javelins, 4 GP") counts each part.
export function carried(inventory) {
  const items = []; let loose = 0;
  for (const x of inventoryLines(inventory)) {
    const parts = x.name.includes(',') ? x.line.replace(/^\s*[-*•]\s*/, '').split(',').map((p) => p.trim()).filter(Boolean).map((p) => { const m = /^(\d+)\s*[x×]?\s+(.+)$/i.exec(p); return m ? { name: m[2], qty: Number(m[1]) } : { name: p, qty: 1 }; }) : [{ name: x.name, qty: x.qty }];
    for (const y of parts) { if (/^(gp|sp|cp|pp|ep)$/i.test(y.name.trim())) loose += y.qty; else items.push(y); }
  }
  return { items, loose };
}

export function loadOf(play = {}, str = null, size = 'Medium') {
  let items = 0; const unknown = [];
  const c = carried(play.inventory);
  for (const y of c.items) {
    const w = weightOf(y.name);
    if (w === null) unknown.push(y.name); else items += w * y.qty;
  }
  const coins = coinWeight(play.cp).lb + c.loose / 50;
  const lb = round(items + coins), capacity = capacityOf(str, size);
  return { lb, items: round(items), coins: round(coins), unknown, capacity, over: capacity !== null && lb > capacity };
}

export const lbs = (x) => `${x.toLocaleString('en-US', { maximumFractionDigits: 1 })} lb`;

// "Carrying 70.6 lb of 225 lb (not counted: Mystery box)", "Over carrying capacity: 290 lb of 225 lb".
export function loadText(l) {
  const skip = l.unknown.length ? ` (not counted: ${l.unknown.slice(0, 4).join(', ')}${l.unknown.length > 4 ? ` and ${l.unknown.length - 4} more` : ''})` : '';
  if (l.over) return `Over carrying capacity: ${lbs(l.lb)} of ${lbs(l.capacity)}${skip}`;
  return `Carrying ${lbs(l.lb)}${l.capacity !== null ? ` of ${lbs(l.capacity)}` : ''}${skip}`;
}

// Too heavy for the road: who is over their carrying capacity. chars: [{ name, play, str, size }] →
// [{ name, lb, capacity }] (only those over; characters without a known Strength are left out).
export const overloaded = (chars) => (chars || []).map((c) => ({ name: c.name, ...loadOf(c.play || {}, c.str, c.size || 'Medium') }))
  .filter((x) => x.over).map((x) => ({ name: x.name, lb: x.lb, capacity: x.capacity }));

// "Too heavy for the road: Hand carries 345 lb (can carry 240 lb)."
export const overloadedText = (list) => (list.length ? `Too heavy for the road: ${list.map((x) => `${x.name} carries ${lbs(x.lb)} (can carry ${lbs(x.capacity)})`).join('; ')}.` : '');
