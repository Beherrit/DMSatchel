// Name tables for people, places and organizations. Generators take an rng (see rng.js).

const syl = (a, b, c) => (r) => r.pick(a) + r.pick(b) + (c ? r.pick(c) : '');
const compound = (a, b) => (r) => r.pick(a) + r.pick(b);
const list = (a) => (r) => r.pick(a);

const HUMAN_LAST = ['Ashdown', 'Blackwood', 'Coppervale', 'Dunmore', 'Fairweather', 'Greaves', 'Hollis', 'Ironside', 'Larkin', 'Marsh', 'Penhallow', 'Redgrave', 'Stroud', 'Thorne', 'Vance', 'Whitlock', 'Yarrow', 'Holloway', 'Crane', 'Abernathy', 'Mortlake', 'Pell', 'Sorrell', 'Underwood', 'Calloway', 'Dray', 'Featherstone', 'Hask', 'Kettering', 'Lowe', 'Merriwether', 'Oakes', 'Quarrel', 'Rook', 'Tallow', 'Wexley'];

// Each ancestry: first(r, gender) and last(r). Gender is 'f', 'm' or anything else for either.
export const ANCESTRY_NAMES = {
  Human: {
    f: ['Agnes', 'Bryn', 'Clemence', 'Dara', 'Elspeth', 'Fenna', 'Hester', 'Ilse', 'Isolde', 'Kestrel', 'Maren', 'Mirela', 'Nell', 'Odile', 'Petra', 'Sabine', 'Tamsin', 'Wren', 'Yvaine', 'Rosalind', 'Greta', 'Liesl', 'Marisol', 'Ottilie', 'Brenna', 'Aveline'],
    m: ['Aldric', 'Benedict', 'Cedric', 'Corwin', 'Edric', 'Garrick', 'Gideon', 'Hal', 'Jory', 'Lionel', 'Matthias', 'Osric', 'Roland', 'Tobias', 'Ansel', 'Bram', 'Dorian', 'Fenwick', 'Leopold', 'Silas', 'Tomas', 'Wystan', 'Rafe', 'Emeric'],
    x: ['Rowan', 'Ash', 'Quill', 'Sparrow', 'Lark', 'Ellis', 'Morgan', 'Avery', 'Sage', 'Tam'],
    last: list(HUMAN_LAST),
  },
  Elf: {
    first: syl(['Ae', 'Ara', 'Cae', 'Ela', 'Fae', 'Gala', 'Ili', 'Lae', 'Mira', 'Nae', 'Sha', 'Tha', 'Vae', 'Ylla', 'Ser', 'Lia', 'Eri', 'Thi'], ['ri', 'la', 'ne', 'the', 'va', 'si', 'ra', 'lia', ''], ['nor', 'wyn', 'thir', 'iel', 'ara', 'ion', 'as', 'eth', 'ith', 'ael', 'andra', 'is', 'riel', 'dan']),
    last: compound(['Moon', 'Star', 'Silver', 'Dawn', 'Leaf', 'Wind', 'Mist', 'Amber', 'Night', 'Sun', 'Thorn', 'River', 'Willow', 'Frost', 'Ever', 'Gold'], ['whisper', 'song', 'bough', 'shade', 'brook', 'petal', 'gleam', 'weaver', 'walker', 'bloom', 'glade', 'fall', 'crown', 'light']),
  },
  Dwarf: {
    first: syl(['Bar', 'Dor', 'Thor', 'Gim', 'Bal', 'Dur', 'Kil', 'Mor', 'Rur', 'Thra', 'Hel', 'Vis', 'Bro', 'Gun', 'Ebb', 'Dag', 'Ois', 'Har'], ['din', 'ik', 'grim', 'in', 'ra', 'dis', 'unn', 'rak', 'li', 'va', 'na', 'ga', 'ra', 'bek']),
    last: compound(['Iron', 'Stone', 'Ember', 'Battle', 'Frost', 'Gold', 'Granite', 'Deep', 'Hammer', 'Anvil', 'Coal', 'Copper', 'Flint', 'Bronze'], ['forge', 'beard', 'fist', 'delve', 'hewer', 'shield', 'brow', 'mantle', 'born', 'vein', 'helm', 'heart']),
  },
  Halfling: {
    first: list(['Alton', 'Bree', 'Cora', 'Eldon', 'Kithri', 'Lavinia', 'Merric', 'Milo', 'Nedda', 'Osborn', 'Perrin', 'Rosie', 'Seraphina', 'Tobin', 'Verna', 'Wellby', 'Pip', 'Tansy', 'Bramble', 'Poppy', 'Fennick', 'Daisy', 'Corrin', 'Lark', 'Hob', 'Marigold']),
    last: compound(['Brush', 'Good', 'Green', 'High', 'Tea', 'Thorn', 'Toss', 'Under', 'Apple', 'Honey', 'Bramble', 'Quick', 'Tall', 'Warm'], ['gather', 'barrel', 'bottle', 'hill', 'leaf', 'gage', 'cobble', 'bough', 'brook', 'pot', 'foot', 'water', 'hearth']),
  },
  Gnome: {
    first: syl(['Bim', 'Fizz', 'Gim', 'Nack', 'Orr', 'Roon', 'Tink', 'Zook', 'Wren', 'Dab', 'Fonk', 'Pell', 'Quib', 'Nim', 'Sprock'], ['ble', 'wick', 'kin', 'ny', 'bo', 'wiz', 'let', 'sy', 'len', 'i']),
    last: compound(['Spark', 'Tinker', 'Fizzle', 'Copper', 'Brass', 'Cog', 'Gear', 'Wobble', 'Pepper', 'Glitter', 'Puddle', 'Thimble'], ['whistle', 'fuss', 'bang', 'pot', 'button', 'spinner', 'snout', 'toes', 'sprocket', 'top', 'nose']),
  },
  Orc: {
    first: syl(['Gro', 'Ur', 'Mog', 'Dra', 'Kar', 'Thu', 'Yaz', 'Gash', 'Ruk', 'Bol', 'Vra', 'Zug', 'Sha', 'Ov', 'Ke', 'Hul'], ['nak', 'ga', 'th', 'gul', 'ra', 'mash', 'ka', 'rok', 'ish', 'ta', 'dra', 'sk']),
    last: list(['the Unbroken', 'Skullsplitter', 'of the Red Tusk', 'Ash-Eye', 'Bonechewer', 'Ironhide', 'Half-Ear', 'the Patient', 'Stormcaller', 'Wolfbrother', 'Three-Scars', 'the Gentle', 'Emberfist', 'of the Long Road']),
  },
  Tiefling: {
    first: (r) => (r.chance(0.4)
      ? r.pick(['Ember', 'Revel', 'Sorrow', 'Vigil', 'Mercy', 'Riddle', 'Solace', 'Wander', 'Hymn', 'Ruin', 'Quiet', 'Cinder', 'Ashes', 'Hope', 'Psalm', 'Temper'])
      : syl(['Ak', 'Bel', 'Dam', 'Kal', 'Mor', 'Nem', 'Ska', 'Zar', 'Leu', 'Ori', 'Mal', 'Ri'], ['me', 'a', 'ka', 'ri', 'e', 'yo', ''], ['nos', 'ia', 'kos', 'ith', 'eth', 'ira', 'us', 'nix', 'ah'])(r)),
    last: (r) => (r.chance(0.5) ? '' : r.pick(HUMAN_LAST)),
  },
  Dragonborn: {
    first: syl(['Ar', 'Bal', 'Don', 'Ghe', 'Hes', 'Kri', 'Med', 'Nad', 'Pan', 'Rho', 'Sha', 'Tor', 'Vra', 'Sora', 'Kava'], ['jhan', 'asar', 'aar', 'ex', 'kriv', 'rash', 'inn', 'dar', 'thra', 'ash', 'na', 'ra']),
    last: syl(['Kerr', 'Daar', 'Nem', 'Myas', 'Yar', 'Ophin', 'Kim', 'Del', 'Turn', 'Clet'], ['hy', 'mi', 'je', 'tha', 'ba', 'ka'], ['lon', 'rev', 'ros', 'llor', 'tuul', 'juith', 'vex']),
  },
  Goliath: {
    first: syl(['Aug', 'Eg', 'Gae', 'Kav', 'Keo', 'Lo', 'Man', 'Nal', 'Orth', 'Paav', 'Tha', 'Vim'], ['an', 'el', 'a', 'u', 'o', 'i'], ['kal', 'thi', 'reth', 'lak', 'nu', 'gath', 'rak', 'ma']),
    last: (r) => `${r.pick(['Thunder', 'Stone', 'Sky', 'Peak', 'Long', 'Cliff', 'Bear', 'Rock', 'Horn'])}-${r.pick(['breaker', 'leaper', 'watcher', 'striker', 'runner', 'carver', 'singer', 'climber'])}`,
  },
  Aasimar: {
    first: list(['Aurelia', 'Caelum', 'Seraph', 'Ilyra', 'Lumen', 'Orien', 'Solenne', 'Thalia', 'Vesper', 'Zariel', 'Amara', 'Cassiel', 'Eliora', 'Galen', 'Ione', 'Jarael', 'Liora', 'Raziel']),
    last: (r) => (r.chance(0.5) ? r.pick(HUMAN_LAST) : r.pick(['Dawnbringer', 'Brightwater', 'Lightfoot', 'Halewind', 'Morningstar', 'Goldvein'])),
  },
};

export const ANCESTRIES = Object.keys(ANCESTRY_NAMES);
export const ANCESTRY_WEIGHTS = { Human: 40, Elf: 12, Dwarf: 12, Halfling: 10, Gnome: 6, Orc: 7, Tiefling: 6, Dragonborn: 4, Goliath: 3, Aasimar: 3 };

export function firstName(r, ancestry, gender) {
  const a = ANCESTRY_NAMES[ancestry] || ANCESTRY_NAMES.Human;
  if (a.f) {
    const pool = gender === 'f' ? a.f : gender === 'm' ? a.m : [...a.f, ...a.m, ...a.x];
    return r.pick(gender === 'f' || gender === 'm' ? pool : r.chance(0.2) ? a.x : pool);
  }
  return a.first(r);
}
export const lastName = (r, ancestry) => (ANCESTRY_NAMES[ancestry] || ANCESTRY_NAMES.Human).last(r);
export function personName(r, ancestry, gender) {
  const f = firstName(r, ancestry, gender), l = lastName(r, ancestry);
  return l ? `${f} ${l}` : f;
}

const P = {
  townA: ['Ash', 'Bram', 'Cold', 'Elder', 'Fen', 'Gray', 'Holt', 'Iron', 'Kings', 'Marrow', 'Oak', 'Raven', 'Salt', 'Thorn', 'Wil', 'Wolf', 'Brine', 'Copper', 'Hollow', 'Stag', 'Mire', 'Barley', 'Dun', 'Heron', 'Lantern', 'Sable'],
  townB: ['ford', 'hollow', 'mere', 'wick', 'haven', 'by', 'cross', 'stead', 'moor', 'fall', 'brook', 'gate', 'barrow', 'watch', 'ton', 'well', 'reach', 'den', 'shire', 'combe'],
  tavA: ['Gilded', 'Drunken', 'Rusty', 'Laughing', 'Sleeping', 'Prancing', 'Crooked', 'Wandering', 'Silver', 'One-Eyed', 'Howling', 'Golden', 'Salty', 'Hungry', 'Bashful', 'Weeping', 'Jolly', 'Lucky', 'Tipsy', 'Smoking', 'Broken', 'Merry'],
  tavB: ['Griffon', 'Goblet', 'Wyvern', 'Lantern', 'Boar', 'Mermaid', 'Kettle', 'Anvil', 'Owlbear', 'Barrel', 'Stag', 'Dragon', 'Mimic', 'Badger', 'Gnome', 'Tankard', 'Harp', 'Fiddler', 'Crow', 'Toad', 'Wheel', 'Hound'],
  shopT: ['Curios', 'Provisions', 'Remedies', 'Blades', 'Sundries', 'Oddments', 'Tonics', 'Maps & Charts', 'Candles', 'Fine Leathers', 'Arcana', 'Salvage', 'Ironmongery', 'Books & Bindings'],
  shipA: ['Restless', 'Salt', 'Iron', 'Crimson', 'Drowned', 'Lucky', 'Grey', 'Merry', 'Black', 'Silver', 'Wicked', 'Faithful', 'Storm', 'Gilded'],
  shipB: ['Widow', 'Gull', 'Maiden', 'Tide', 'Serpent', 'Promise', 'Lantern', 'Fortune', 'Kraken', 'Wren', 'Debt', 'Sparrow', 'Mercy', 'Hymn'],
  grpA: ['Order of the', 'Brotherhood of the', 'Society of the', 'Company of the', 'Circle of the', 'Guild of the', 'Keepers of the', 'Children of the', 'League of the', 'House of the'],
  grpB: ['Silver Hand', 'Last Lantern', 'Ashen Rose', 'Broken Chain', 'Open Eye', 'Iron Quill', 'Pale Moon', 'Seventh Bell', 'Gilded Coin', 'Hollow Crown', 'Black Feather', 'Weeping Star', 'Burning Key', 'Quiet Tide'],
  regionA: ['The Sable', 'The Ember', 'The Hollow', 'The Gilt', 'The Whispering', 'The Broken', 'The Silver', 'The Drowned', 'The Ashen', 'The Thornwood'],
  regionB: ['Marches', 'Reach', 'Vale', 'Coast', 'Wastes', 'Expanse', 'Downs', 'Peaks', 'Fens', 'Isles', 'Wilds', 'Heartlands'],
};
export const townName = (r) => r.pick(P.townA) + r.pick(P.townB);
export const tavernName = (r) => (r.chance(0.75) ? `The ${r.pick(P.tavA)} ${r.pick(P.tavB)}` : `The ${r.pick(P.tavB)} & ${r.pick(P.tavB)}`);
export const shopName = (r, owner) => `${(owner || personName(r, r.pickW(ANCESTRY_WEIGHTS))).split(' ')[0]}’s ${r.pick(P.shopT)}`;
export const shipName = (r) => `The ${r.pick(P.shipA)} ${r.pick(P.shipB)}`;
export const groupName = (r) => `${r.pick(P.grpA)} ${r.pick(P.grpB)}`;
export const regionName = (r) => `${r.pick(P.regionA)} ${r.pick(P.regionB)}`;
