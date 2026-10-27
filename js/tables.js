// Random tables for the table tools. All descriptive text is original; magic item names are from the 5e SRD.

export const ROLES = {
  common: ['farmer','ferryman','gravedigger','street urchin','washerwoman','shepherd','fishmonger','beggar with a past','retired soldier','miller','lamplighter','stablehand'],
  trade: ['blacksmith','innkeeper','herbalist','cartographer','tailor','brewer','jeweler','traveling merchant','alchemist’s apprentice','bookbinder','shipwright','cobbler'],
  shady: ['smuggler','fence','con artist','bounty hunter','cutpurse','gambling-den owner','forger','informant','retired assassin','debt collector'],
  authority: ['guard captain','tax collector','noble’s steward','magistrate','minor baron','town crier','harbormaster','city councilor','knight errant','royal courier'],
  faith: ['priest of a minor god','hedge wizard','fortune teller','wandering monk','temple acolyte','druid recluse','sage','oracle who hates her gift','bard','exorcist'],
};

export const NPC = {
  look: ['a scar across the bridge of the nose','a braided beard threaded with copper rings','two missing fingers on the left hand','ink-stained hands','piercing green eyes','unusually tall, stoops through doorways','freckled and sunburned','fine clothes worn threadbare','a serpent tattoo curling up the neck','always wears gloves','one eye clouded milky white','smells strongly of pipe smoke','a gold tooth that flashes when they smile','hair shaved on one side','an elaborate hat with a broken feather','a limp they never explain','perfectly manicured, out of place here','a necklace of small bones','spectacles mended with twine','a booming laugh and a missing front tooth'],
  personality: ['blunt to the point of rudeness','a chatty gossip who can’t keep a secret','paranoid; assumes everyone is a spy','cheerful in a way that feels rehearsed','world-weary and dry','pompous and easily flattered','kind but scatterbrained','greedy, but scrupulously honest about deals','devout and quick to judge','reckless and bored','shy until the topic turns to their passion','suspicious of magic users','warm, motherly, and nosy','coldly polite','a hopeless romantic','proud and quick to take offense'],
  mannerism: ['hums tunelessly while thinking','ends statements as questions?','collects buttons and asks for them','speaks of themselves in the third person','cracks their knuckles before answering','never makes eye contact','misquotes scripture with confidence','laughs at their own jokes before the punchline','whittles while talking','uses big words slightly wrong','taps the table to count things','nicknames everyone immediately','whispers anything important','constantly eats something','answers questions with stories','checks over their shoulder every few minutes'],
  voice: ['gravelly whisper','fast and clipped','sing-song lilt','slow, lazy drawl','booming, as if addressing a crowd','nasal and fussy','soft and deliberate, long pauses','hoarse from shouting','posh, over-enunciated','thick rural accent','raspy smoker’s chuckle','bright and breathless'],
  want: ['to pay off a debt to the wrong people','revenge on a former partner','to see the ocean before they die','to prove themselves to a stern parent','a cure for a sick child','simply to be left alone','to become mayor','to find a lost sibling','to buy back the family farm','to know what’s in the locked cellar','fame of any kind','to atone for something no one knows about','a ticket out of town','to marry above their station','to protect their apprentice','to win a bet with a rival'],
  secret: ['spies for a rival town','can faintly hear the dead','took their name from a dead man','owes a favor to a hag','is the true heir to a minor title','smuggles for the thieves’ guild','is a werewolf and has never told anyone','sabotaged their predecessor’s business','worships a forbidden god','is secretly very wealthy','witnessed a murder and stayed silent','is a polymorphed creature who has forgotten what they were','is being blackmailed by the guard captain','forged the papers that hold their position','has a twin who is wanted for murder','knows where a dragon sleeps'],
  attitude: ['Friendly: eager to help, might give a discount','Friendly, if the party buys a drink first','Indifferent: helps if it costs them nothing','Indifferent, but curious about outsiders','Wary: needs a good reason or a coin','Hostile: blames adventurers for something','Desperate: will ask the party for help'],
};

export const Q = {
  patron: ['a desperate village elder','a merchant with something to hide','the high priestess of the local temple','a dying wizard','the thieves’ guild, through a go-between','a noble’s anxious steward','a talking cat','a ghost who doesn’t know it’s dead','the captain of the city watch','a rival adventuring party, swallowing their pride','a druid circle','a child with a jar of coins','a retired adventurer with a bad knee','an exiled prince in disguise'],
  item: ['a stolen holy relic','a sealed iron box no one may open','the town’s original charter','a dragon egg','an heirloom sword','a spellbook with a missing chapter','the only cure for the crop blight','a ledger of bribes','a crown that whispers','a map tattooed on a dead man’s back'],
  person: ['the mayor’s son','a kidnapped scholar','a captured spy','a runaway heiress','a dwarf prospector','a priest who knows too much','the patron’s twin','a goblin chieftain’s hostage'],
  place: ['the flooded crypt beneath the chapel','an abandoned dwarven mine','a bandit fort in the old quarry','the sunken lighthouse','a wizard’s tower that moves at night','a hag’s hut deep in the marsh','a goblin warren under the hill','the ruins of a burned monastery','a pirate ship anchored in the fog','the duke’s own wine cellar','a sky-temple reached only by griffon'],
  dest: ['the capital, five days’ ride away','a monastery high in the mountains','a hidden elven enclave','the docks before the tide turns','the border fort','a rival lord’s court','the oracle at the crossroads'],
  mystery: ['why the livestock are vanishing','why the chapel bells have gone silent','a string of disappearances at the docks','the poisoning at the lord’s feast','the strange lights over the lake','why the dead aren’t staying buried','who has been leaving gold on doorsteps','why every dog in town howls at noon'],
  monster: ['an owlbear','a pack of ghouls','a young dragon','a troll','a manticore','a gang of wererats','a giant spider brood','a restless wraith','a chuul in the reservoir','a band of gnolls'],
  antagonist: ['a charismatic cult leader','a corrupt magistrate','a hobgoblin warlord','a jealous rival wizard','a smuggler queen','a vampire posing as a noble','a coven of hags','a fallen paladin','a beloved local hero','a mind-controlled ally'],
  twist: ['The patron is the real villain, or is using the party.','The “monster” is protecting something innocent.','The target already escaped and begs not to be found.','A rival party is after the same thing and gets there first.','The prize is cursed, and the patron knows it.','The antagonist is connected to one of the PCs.','The person to be rescued doesn’t want rescuing.','Two factions hired the party for opposite jobs.','The real threat is one level deeper.','It’s a test, staged by someone watching.','The antagonist is right about something important.','Success will make a powerful enemy.'],
  complication: ['A storm cuts off the main road.','The authorities forbid anyone from interfering.','An informant is feeding the enemy the party’s plans.','The party is framed for a crime on the way.','A key ally is sick and can’t travel fast.','Bandits hold the only safe route.','The place can only be entered at low tide or a new moon.','Someone offers double to walk away.','The patron insists on coming along.','A festival floods the town with strangers.'],
  goal: [
    q => `Recover ${q.item} from ${q.place}.`,
    q => `Rescue ${q.person}, held in ${q.place}.`,
    q => `Escort ${q.person} to ${q.dest}.`,
    q => `Investigate ${q.mystery}.`,
    q => `Deal with ${q.monster} lairing in ${q.place}.`,
    q => `Deliver ${q.item} to ${q.dest} within three days.`,
    q => `Steal ${q.item} from ${q.antagonist}.`,
    q => `Find out ${q.mystery}, and stop ${q.antagonist} behind it.`,
  ],
};

export const REWARD_GP = [[50, 250], [500, 2500], [3000, 15000], [20000, 80000]];

export const TOWN = {
  size: [['Hamlet', '40–90 people'], ['Village', '200–600 people'], ['Town', '1,500–5,000 people'], ['City', '12,000–25,000 people']],
  known: ['its honey wine','a giant statue of a forgotten king','the annual goat race','a cursed well everyone avoids','superb horses','its fortified monastery','a dragon skull over the gate','salt mines','the best cheese in the region','its silver-leafed trees','a ferry run by a single ancient family','its strange, tall cats'],
  leader: ['an elected mayor who hates the job','a hereditary lord, barely an adult','a council of guild masters','the abbess of the local temple','a retired mercenary captain','a merchant prince','nobody, after the last one vanished','a druid elder','a puppet of a distant duke'],
  problem: ['wolves are getting bolder each night','the well water has turned bitter','two families are one insult away from a blood feud','a toll lord upriver is choking trade','children are dreaming of the same door','tax collectors have doubled the levy','a sickness spreads among the cattle','a cult has bought the old mill','mysterious fires every new moon','a giant has moved into the hills','the bridge collapsed and the mayor kept the repair fund'],
  spots: ['a crooked temple to the harvest god','a smithy that never cools','a market square with a hanging tree','a ruined watchtower','a herbalist’s cottage covered in ivy','a mill with a waterwheel that turns backward','a graveyard on a hill','a noble manor behind high walls','a moneylender’s narrow house','an old shrine half-swallowed by roots','a busy dock and fish market','a guard barracks with a training yard'],
};

export const TAVERN = {
  quality: [['Squalid', 'ale 1 cp · a corner to sleep in 7 cp'], ['Poor', 'ale 2 cp · a shared room 1 sp'], ['Modest', 'ale 4 cp · a private room 5 sp'], ['Comfortable', 'wine 1 sp · a private room 8 sp'], ['Wealthy', 'fine wine 2 gp · a suite 2 gp']],
  special: ['smoked eel pie','a dwarven fire-stout that actually smokes','honeyed mead from the owner’s grandmother’s recipe','mushroom stew of unknown origin','black bread and a sharp goat cheese','spiced cider, hot in winter, cold in summer','roast boar, Fridays only','elven wine that is suspiciously cheap','pickled eggs, three for a copper','halfling blackberry tart','a “mystery skewer”','a cocktail that changes color with your mood'],
  vibe: ['a loud dice game in the back corner','a bard who only knows one song','suspiciously quiet; everyone watches the door','packed with off-duty guards','a pet raven that steals spoons','a floor that slopes noticeably toward the hearth','a notice board crowded with job postings','an arm-wrestling tournament in progress','a hooded figure buying drinks for the room','a loud feud with the tavern across the street','a wedding party that has been going for three days','a cat sleeping on the bar that the owner insists is the real owner'],
};

export const SHOP = {
  type: {
    'General store': [['Rope, hempen (50 ft)', '1 gp'], ['Torch', '1 cp'], ['Rations (1 day)', '5 sp'], ['Bedroll', '1 gp'], ['Lantern, hooded', '5 gp'], ['Tinderbox', '5 sp'], ['Waterskin', '2 sp'], ['Crowbar', '2 gp']],
    'Blacksmith': [['Longsword', '15 gp'], ['Shield', '10 gp'], ['Chain mail', '75 gp'], ['Handaxe', '5 gp'], ['Crossbow bolts (20)', '1 gp'], ['Horseshoes, set', '4 gp'], ['Iron spikes (10)', '1 gp'], ['Warhammer', '15 gp']],
    'Apothecary': [['Potion of Healing', '50 gp'], ['Antitoxin', '50 gp'], ['Healer’s kit', '5 gp'], ['Herbalism kit', '5 gp'], ['Sleep draught (unlabeled)', '3 gp'], ['Poultice for burns', '1 gp'], ['Perfume, vial', '5 gp'], ['Something in a jar, not for sale', '—']],
    'Curio shop': [['A music box that plays backward', '12 gp'], ['A mummified hand (probably fake)', '5 gp'], ['A map with one corner burned', '8 gp'], ['A mirror that fogs when lied to', '40 gp'], ['A jar of coins from extinct kingdoms', '15 gp'], ['A puzzle box no one has opened', '25 gp'], ['A stuffed owlbear cub', '30 gp'], ['A bell that rings by itself at dawn', '20 gp']],
    'Magic shop': [['Potion of Healing', '50 gp'], ['Spell scroll (cantrip)', '30 gp'], ['Spell scroll (1st level)', '75 gp'], ['Potion of Climbing', '75 gp'], ['Bag of Holding', '500 gp'], ['Driftglobe', '750 gp'], ['Wand of Magic Missiles', '1,000 gp'], ['Cloak of Protection', '1,500 gp']],
    'Bookseller': [['A bestiary with wildly wrong drawings', '10 gp'], ['A history of the local royal family (censored)', '5 gp'], ['Blank journal, leather', '2 gp'], ['Ink and quill', '10 gp'], ['A romance novel everyone in town is reading', '1 gp'], ['A treatise on dragon diets', '15 gp'], ['A spellbook page, unidentified', '25 gp'], ['Maps of the region', '5 gp']],
  },
  quirk: ['haggles only in riddles','gives a discount to anyone who compliments their cat','is closing down and desperate to sell','refuses to sell to elves (and won’t say why)','keeps a cursed item behind the counter as a “conversation piece”','overcharges, then feels guilty and throws in extras','is secretly a fence for stolen goods','will trade for stories instead of coin','has a parrot that repeats customers’ secrets','is suspicious of anyone who pays in gold'],
};

export const TABLES = {
  rumor: { label: 'Tavern rumor', die: 20, items: [
    '“The old mill is haunted. You can hear the stones grinding at night, and they were sold years ago.”',
    '“The new tax collector never sleeps. His window is lit at every hour.”',
    '“Three prospectors went up to the north hills last month. One came back, and he won’t talk.”',
    '“The temple’s short on coin. Word is the high priest is selling relics out the back.”',
    '“A wyvern took two sheep from the Hadley farm. Old Hadley swears it was wearing a saddle.”',
    '“The bridge toll doubled after the guard captain bought a share in it.”',
    '“That traveling merchant’s potions work too well. My cousin’s warts came back as scales.”',
    '“Someone paid the gravedigger to dig a grave, and told him whose it would be next week.”',
    '“The baron’s daughter didn’t run off with a minstrel. She ran off with a dragon.”',
    '“Goblins have been trading with the east village. Fair trades, too. Nobody knows what they’re buying.”',
    '“The lighthouse keeper hasn’t been seen in a fortnight, but the light still comes on every night.”',
    '“They say the lake had no bottom until last winter. Now there’s a staircase down there.”',
    '“The smith’s new apprentice can hold hot iron bare-handed. Doesn’t even flinch.”',
    '“Don’t buy fish from the one-eyed woman at the docks. Don’t ask me why. Just don’t.”',
    '“The duke is hiring sellswords quietly. Lots of them. Nobody’s said for what.”',
    '“A wizard paid for a room in gold and hasn’t come out in nine days. The innkeeper’s afraid to knock.”',
    '“The scarecrows in the south fields face the road now. They used to face the crops.”',
    '“The elves closed the forest road. First time in a hundred years.”',
    '“My uncle found a coin with the queen’s face on it. The queen who’s still alive. It’s dated forty years from now.”',
    '“There’s a door in the cellar of this very tavern that the owner keeps nailed shut.”',
  ]},
  hook: { label: 'Plot hook', die: 20, items: [
    'A girl hires the party to find her missing dog, last seen following a man with no shadow.',
    'The town well’s water has turned sweet as honey, and everyone who drinks it dreams of the same door.',
    'A dying courier presses a sealed letter into a PC’s hand: “Don’t let the Baron read it.”',
    'Every bell in town rang at midnight, though no one was in the towers.',
    'A noble offers a fortune for a stolen portrait. Its subject died 200 years ago, and was seen at the market yesterday.',
    'Miners broke into a sealed vault and refuse to go back down. One keeps humming a song none of them know.',
    'A traveling circus arrives a week early, and the ringmaster knows every PC’s name.',
    'The harvest festival’s prize pumpkin has grown large enough to hollow out. Something inside is knocking.',
    'A bounty poster shows one of the PCs, with a reward for their capture “alive and unharmed.”',
    'The ferryman’s new toll is a true secret. Lately, people who pay it forget who they are.',
    'A dragon egg goes up for auction, and three factions intend to win it by any means.',
    'The town’s beloved healer is accused of witchcraft. The evidence is real, but she didn’t plant it.',
    'Ships keep drifting into port with no crew and perfectly set dinner tables.',
    'The statue in the square turns to face a new direction every morning, always toward the old forest.',
    'A retired adventurer wants an escort back to the dungeon where her party died, to bury them properly.',
    'Someone is buying every candle in the city. The chandler is getting rich and terrified.',
    'A cartographer’s newest map shows a village that wasn’t there last month. It’s a day’s walk away.',
    'The thieves’ guild asks the party for help: something is stealing from thieves.',
    'A druid circle needs a white stag protected before the solstice hunt, which the duke himself leads.',
    'A fortune teller begs the party to stop a murder she foresaw. The victim is her.',
  ]},
  trinket: { label: 'Trinket', die: 20, items: [
    'A tin whistle that only plays one note.','A glass eye with a gold iris.','A deck of cards missing all the queens.','A tiny clay pot of dried fireflies that still glow faintly.','A key to an unknown door, always warm to the touch.','A letter in a language no one can read, signed with a paw print.','A silver spoon bent into a ring.','A bone die that rolls a 3 whenever no one is watching.','A locket holding a portrait of someone who looks exactly like you.','A pressed flower that never wilts.','A wooden duck that floats upright in any liquid.','A small bag of teeth, none of them human.','A compass that points to the last place you slept.','A ribbon from a tournament held a hundred years ago.','A child’s drawing of a dragon, labeled “Mum.”','A thimble engraved with a tiny skull.','A candle that smells like rain.','A jar of buttons from different royal courts.','A map of a city’s sewers with one tunnel circled.','A ring of keys, each for a different lock in the same house.',
  ]},
  complication: { label: 'Social complication', die: 12, items: [
    'The NPC mistakes a PC for someone they owe money to.','A rival walks in mid-conversation and makes a scene.','The NPC will only talk if the party does a small, humiliating favor first.','Someone at the next table is clearly eavesdropping.','The NPC is drunk and keeps changing their story.','The guard on duty knows a PC from their past.','The NPC agrees, but demands it in writing, notarized.','A child keeps interrupting with questions about adventuring.','The NPC is terrified and will only speak somewhere private.','A local celebrity arrives and everyone stops listening to the party.','The NPC’s spouse disagrees loudly with everything they say.','The NPC tells the truth, but someone powerful will punish them for it.',
  ]},
};

export const GEMS = { 10: ['azurite','banded agate','blue quartz','eye agate','hematite','lapis lazuli','malachite','moss agate','obsidian','tiger eye','turquoise'], 50: ['bloodstone','carnelian','chalcedony','chrysoprase','citrine','jasper','moonstone','onyx','sardonyx','star rose quartz','zircon'], 100: ['amber','amethyst','chrysoberyl','coral','garnet','jade','jet','pearl','spinel','tourmaline'], 500: ['alexandrite','aquamarine','black pearl','blue spinel','peridot','topaz'], 1000: ['black opal','blue sapphire','emerald','fire opal','opal','star ruby','star sapphire','yellow sapphire'], 5000: ['black sapphire','diamond','jacinth','ruby'] };

export const ART = { 25: ['silver ewer engraved with river reeds','carved bone statuette of a stag','small gold bracelet','embroidered silk handkerchief','copper chalice with silver filigree','painted wooden festival mask','brass hand mirror'], 250: ['gold ring set with bloodstones','carved ivory statuette of a dancer','silver necklace with a garnet pendant','bronze crown','silk robe with gold embroidery','tapestry of a royal hunt','brass astrolabe'], 750: ['silver chalice set with moonstones','carved harp with ivory inlay','gold idol of a forgotten god','gold comb set with red garnets','silver-plated longsword with jet in the hilt'], 2500: ['gold chain set with a fire opal','an old master’s portrait in a gilt frame','velvet mantle set with moonstones','platinum bracelet set with a sapphire','jeweled gold crown'], 7500: ['jeweled platinum ring','gold cup set with emeralds','jeweled gold music box','gold idol with ruby eyes','necklace of a long-dead queen'] };

export const WEAPONS = ['Longsword','Shortbow','Warhammer','Dagger','Rapier','Greataxe','Mace','Light Crossbow','Handaxe','Spear','Scimitar','Longbow'];

export const ARMORS = ['Chain Mail','Breastplate','Studded Leather','Half Plate','Plate','Scale Mail'];

export const MAGIC = {
  common: ['Potion of Healing','Potion of Climbing','Spell Scroll (cantrip)','Spell Scroll (1st level)','Driftglobe'],
  uncommon: ['Bag of Holding','Boots of Elvenkind','Cloak of Protection','Gloves of Thievery','Goggles of Night','Immovable Rod','Pearl of Power','Ring of Jumping','Wand of Magic Missiles','+1 {weapon}','+1 Shield','Potion of Greater Healing','Alchemy Jug','Rope of Climbing','Decanter of Endless Water','Sending Stones','Hat of Disguise','Bracers of Archery','Eyes of the Eagle','Wand of Web','Spell Scroll (2nd level)','Spell Scroll (3rd level)'],
  rare: ['Amulet of Health','Belt of Dwarvenkind','Boots of Speed','Bracers of Defense','Cloak of Displacement','Flame Tongue {weapon}','Necklace of Fireballs','Ring of Protection','Ring of Spell Storing','Wand of Fireballs','+2 {weapon}','+1 {armor}','Portable Hole','Potion of Superior Healing','Staff of Healing','Horseshoes of Speed','Periapt of Proof against Poison','Rope of Entanglement','Cape of the Mountebank','Mantle of Spell Resistance','Spell Scroll (4th level)','Spell Scroll (5th level)'],
  veryrare: ['Animated Shield','Belt of Fire Giant Strength','Carpet of Flying','Cloak of Arachnida','Dancing {weapon}','Manual of Bodily Health','Ring of Regeneration','Staff of Power','+3 {weapon}','+2 {armor}','Potion of Supreme Healing','Rod of Absorption','Frost Brand {weapon}','Robe of Stars','Nine Lives Stealer','Spell Scroll (6th level)','Spell Scroll (7th level)'],
  legendary: ['Holy Avenger','Vorpal Sword','Ring of Three Wishes','Cloak of Invisibility','Staff of the Magi','Robe of the Archmagi','Sphere of Annihilation','+3 {armor}','Belt of Storm Giant Strength','Talisman of Pure Good','Well of Many Worlds','Deck of Many Things'],
};

export const RARITY_LABEL = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', veryrare: 'Very rare', legendary: 'Legendary' };

export const RARITY_W = [{ common: 45, uncommon: 50, rare: 5 }, { common: 10, uncommon: 45, rare: 38, veryrare: 7 }, { uncommon: 15, rare: 45, veryrare: 33, legendary: 7 }, { rare: 25, veryrare: 45, legendary: 30 }];

export const COINS = {
  pocket: [[['cp', 5, 6, 1, .8], ['sp', 4, 6, 1, .6], ['gp', 2, 6, 1, .4]], [['sp', 4, 6, 10, .6], ['gp', 3, 6, 5, .8], ['pp', 1, 6, 1, .2]], [['gp', 4, 6, 10, .9], ['pp', 2, 6, 5, .5]], [['gp', 8, 6, 10, .9], ['pp', 4, 6, 10, .7]]],
  hoard: [[['cp', 6, 6, 100, 1], ['sp', 3, 6, 100, 1], ['gp', 2, 6, 10, 1]], [['cp', 2, 6, 100, 1], ['sp', 2, 6, 1000, 1], ['gp', 6, 6, 100, 1], ['pp', 3, 6, 10, 1]], [['gp', 4, 6, 1000, 1], ['pp', 5, 6, 100, 1]], [['gp', 12, 6, 1000, 1], ['pp', 8, 6, 1000, 1]]],
};

export const GP = { cp: .01, sp: .1, ep: .5, gp: 1, pp: 10 };

export const VALUABLES = [[[GEMS, [10, 50], [2, 6]], [ART, [25], [2, 4]]], [[GEMS, [50, 100], [3, 6]], [ART, [25, 250], [2, 4]]], [[GEMS, [500, 1000], [3, 6]], [ART, [250, 750], [2, 4]]], [[GEMS, [1000, 5000], [3, 6]], [ART, [2500, 7500], [1, 10]]]];

export const CONTAINERS = ['in a rotting leather satchel','in a locked iron coffer (DC 15 to pick)','sewn into the lining of a cloak','in a hollowed-out book','under a loose flagstone','in a pouch tied around the neck','in a chest with a poison needle (DC 13 to spot)','scattered among bones in a nest','in a barrel of salted fish','behind a false panel in the wall'];

export const ENV = {
  'Tavern': { see: ['smoke curling along low black beams','a hearth fire throwing long shadows across the floor','tankards hung on hooks above the bar, each one dented','a mounted boar’s head wearing someone’s hat','sawdust scattered over a sticky floor','a cracked window patched with oiled paper'], hear: ['a fiddle missing a string','a roar of laughter from a corner table','the clatter of dice and a groan','the hiss of a spilled drink on the hearthstones','a barmaid shouting orders to the kitchen'], smell: ['roasting meat and spilled ale','pipe smoke and wet dog','fresh bread and burnt onions','sour wine and sweat'], feel: ['the warmth hits you after the cold road','the floorboards give slightly underfoot','every table is sticky','a draft cuts in each time the door opens'] },
  'City street': { see: ['laundry strung between leaning houses','a cart stuck in a rut, the driver cursing','pigeons scattering from a crumbling fountain','a street preacher on an overturned crate','guards in faded tabards watching the crowd','shop signs swinging on rusted chains'], hear: ['hawkers shouting prices over each other','iron-shod wheels on cobblestones','a bell tolling the hour','a dog barking at nothing'], smell: ['the gutter after rain','frying sausages and horse dung','tanning leather from the next street','cheap perfume and woodsmoke'], feel: ['elbows and shoulders jostling past','cobbles slick with something best not examined','the warmth of the crowd','grit blowing in from the docks'] },
  'Forest': { see: ['shafts of light through a high green canopy','a fallen oak furred with moss','pale mushrooms ringed around a stump','claw marks gouged high on a trunk','a deer trail winding into fern','ribbons tied to a branch, faded by years'], hear: ['birdsong that stops all at once','a woodpecker somewhere far off','leaves hissing in a wind you can’t feel','a branch snapping behind you'], smell: ['damp earth and pine resin','rotting leaves and wild garlic','something dead, not far away','sweet blossom on the breeze'], feel: ['soft loam that swallows footsteps','cobwebs across your face','the air cools suddenly','burrs clinging to cloaks'] },
  'Dungeon': { see: ['water seeping down carved walls','a rusted gate hanging from one hinge','scorch marks on the ceiling','bones swept carelessly into a corner','faded murals of a forgotten king','a torch bracket, still warm'], hear: ['a steady drip echoing far off','the scrape of something heavy being moved','your own breathing, too loud','a faint chittering in the walls'], smell: ['mildew and old stone','rust and stale air','lamp oil and rot','something sharp, like a struck match'], feel: ['the cold rising through your boots','a floor stone that shifts slightly','air that tastes used','a faint draft from somewhere ahead'] },
  'Cave': { see: ['glittering veins of quartz in the walls','stalactites like crooked teeth','a pool so still it looks like glass','glowworms dotting the ceiling','a narrow crack leading deeper'], hear: ['water dripping into a pool','wings fluttering high above','a low wind moaning through the stone','pebbles skittering down a slope'], smell: ['wet stone and guano','minerals, almost metallic','something musky and animal'], feel: ['slick rock under your hands','the ceiling pressing low','sudden cold air from a side passage','the floor sloping down'] },
  'Swamp': { see: ['mist hanging over black water','dead trees draped in grey moss','bubbles rising from the mud','a rotted boardwalk half sunk','eyes reflecting your light, then sinking'], hear: ['frogs that fall silent as you pass','the buzz of a thousand insects','something large slipping into the water','squelching steps that aren’t yours'], smell: ['rot and stagnant water','sulfur from the bubbling mud','sweet, cloying flowers'], feel: ['mud sucking at your boots','humid air that clings like a wet cloak','mosquitoes at every inch of skin'] },
  'Castle': { see: ['banners faded to the color of old blood','arrow slits throwing thin bars of light','a great hall with an empty throne','tapestries chewed by moths','armor stands with polished, empty helms'], hear: ['boots echoing on flagstones','a distant clang from the forge','whispers that stop when you enter','the wind howling along the battlements'], smell: ['cold stone and candle wax','dogs and rushes on the floor','roasting fowl from the kitchens'], feel: ['a chill that never leaves the stone','the weight of watching eyes','heat from a vast hearth'] },
  'Temple': { see: ['incense smoke hanging in colored light','a cracked altar stained dark','candles burned down to stubs','statues with their faces chiseled off','offerings of flowers and copper coins'], hear: ['a low chant from somewhere unseen','your footsteps returning as echoes','the creak of a censer chain','absolute, pressing silence'], smell: ['frankincense and old wax','dust and dried flowers','something coppery beneath the incense'], feel: ['the air feels heavier near the altar','smooth stone worn by centuries of knees','an unexplained warmth'] },
  'Coast': { see: ['gulls wheeling over grey water','nets hung to dry on driftwood poles','a wreck’s ribs poking out of the sand','fishing boats pulled above the tideline','a lighthouse on the far headland'], hear: ['waves booming against rock','gulls fighting over scraps','rigging clinking against masts','a bell buoy far out'], smell: ['salt and seaweed','fish guts and tar','rain coming in off the water'], feel: ['spray stinging your face','wind tugging at your cloak','wet sand giving way underfoot'] },
  'Mountain': { see: ['a sheer drop into cloud','a cairn of stones marking a grave','eagles circling below you','snow plumes blowing off the peaks','an old stair cut into the cliff'], hear: ['wind roaring across the ridge','the crack of distant ice','rocks clattering down a scree slope','total silence between gusts'], smell: ['thin, clean air','snow and stone','smoke from a camp somewhere below'], feel: ['every breath comes short','numbing cold in your fingers','loose stone shifting underfoot'] },
};

export const TIME_NOTE = { Dawn: 'grey light just creeping in, dew on everything', Midday: 'flat bright light, short shadows', Dusk: 'long orange light, shadows stretching', Night: 'darkness beyond the reach of your light' };

// ---- organizations: factions, guilds, clans ----------------------------------------------------
export const ORGS = {
  faction: {
    types: ['Political', 'Military', 'Religious', 'Criminal', 'Mercantile', 'Arcane', 'Secret society', 'Rebel', 'Noble house'],
    names: {
      Political: ['The {Adj} Council', 'The Crown Loyalists', 'The {Adj} Assembly', 'The League of Free Cities', 'The Regency'],
      Military: ['The {Adj} Legion', 'The Iron Watch', 'The {Adj} Banners', 'The Border Wardens', 'The Free Company of the {Noun}'],
      Religious: ['The Church of the {Adj} {Noun}', 'The {Adj} Inquisition', 'The Order of the {Noun}', 'The Pilgrims of Dawn', 'The {Adj} Choir'],
      Criminal: ['The {Adj} Hand', 'The Rats of the {Noun}', 'The Night Market', 'The {Adj} Knives', 'The Fog Syndicate'],
      Mercantile: ['The {Adj} Trading Company', 'The Consortium of the {Noun}', 'The Salt Road Combine', 'The {Adj} Exchange', 'The Lantern Bank'],
      Arcane: ['The {Adj} Conclave', 'The Circle of the {Noun}', 'The Tower of {Adj} Stars', 'The College of Unseen Hands', 'The {Adj} Athenaeum'],
      'Secret society': ['The {Adj} Door', 'Those Who Wait', 'The Society of the {Noun}', 'The {Adj} Masks', 'The Ninth Chair'],
      Rebel: ['The {Adj} Flame', 'The Unbowed', 'The Free {Noun}', 'The Ashborn', 'The {Adj} Hundred'],
      'Noble house': ['House {Surname}', 'The House of the {Adj} {Noun}', 'House {Surname} of the {Noun}'],
    },
    adj: ['Silver', 'Ashen', 'Gilded', 'Crimson', 'Hollow', 'Iron', 'Pale', 'Seventh', 'Burning', 'Quiet', 'Broken', 'Last', 'Black', 'Golden', 'Veiled', 'Thorned'],
    noun: ['Rose', 'Lantern', 'Crown', 'Key', 'Serpent', 'Eye', 'Tide', 'Anvil', 'Raven', 'Star', 'Chain', 'Moon', 'Tower', 'Coin', 'Hound', 'Bell'],
    leaders: ['a scarred general who never smiles', 'a charming merchant prince', 'a council of masked elders', 'a child-queen and her regent', 'an ancient elf who remembers the founding', 'a reformed bandit lord', 'a high priestess with prophetic dreams', 'a dragon in disguise', 'a brilliant, paranoid archmage', 'nobody knows; orders arrive by letter', 'twin siblings who rarely agree', 'a retired adventurer turned politician'],
    goals: ['seize the throne within a generation', 'control every trade road in the region', 'stamp out all unsanctioned magic', 'free a people held in bondage', 'awaken a sleeping god', 'protect an ancient secret at any cost', 'restore a fallen empire', 'drive out a rival faction', 'find and destroy a cursed artifact', 'make the city safe, whatever the price', 'open a door to another plane', 'get very, very rich'],
    methods: ['bribery and blackmail', 'open warfare', 'sermons and miracles', 'assassination', 'debt and contracts', 'propaganda and festivals', 'spies in every household', 'arcane rituals', 'charity that buys loyalty', 'smuggling and sabotage', 'marriage alliances', 'legal maneuvering in the courts'],
    resources: ['a hidden fortune in gems', 'an army of loyal sellswords', 'the ear of the king', 'a fleet of fast ships', 'a library of forbidden spells', 'informants in every tavern', 'a bound demon', 'the only bridge across the river', 'a network of safehouses', 'a relic that heals any wound', 'control of the city watch', 'a monopoly on salt'],
    symbols: ['a silver key on black', 'an open eye inside a sun', 'a broken chain', 'a white rose with red thorns', 'a raven holding a coin', 'three interlocking rings', 'a burning tower', 'a crowned serpent', 'a lantern with no flame', 'an anvil and star'],
    mottos: ['“We remember.”', '“Gold endures.”', '“By the light, for the light.”', '“No chains, no masters.”', '“Patience is a blade.”', '“The tide always returns.”', '“From ash, again.”', '“Quiet hands, open eyes.”', '“Ours by right.”', '“Every debt is paid.”'],
    secrets: ['The leader died years ago, and an impostor rules in their place.', 'The faction is secretly funded by its sworn enemy.', 'Its founding hero was a monster.', 'Half its members don’t know its true goal.', 'It has a spy inside every rival faction, and one inside itself.', 'It owes its power to a pact that is about to expire.', 'Its treasury is empty, and the bluff is wearing thin.', 'A member of the party’s family is a ranking member.'],
    ranks: ['Initiate, Sworn, Captain, Commander, Marshal', 'Novice, Brother/Sister, Elder, Hierarch', 'Runner, Knife, Fingers, Hand, the Fist', 'Clerk, Factor, Partner, Director', 'Apprentice, Adept, Magister, Archmagister', 'Seed, Root, Branch, Crown'],
  },
  guild: {
    trades: ['Smiths', 'Masons', 'Weavers & Dyers', 'Brewers & Vintners', 'Shipwrights', 'Alchemists', 'Scribes & Illuminators', 'Merchants', 'Healers', 'Cartographers', 'Bards & Players', 'Thieves', 'Adventurers', 'Couriers', 'Monster Hunters', 'Jewelers', 'Bakers', 'Gravediggers'],
    names: ['The Worshipful Company of {Trade}', 'The {Adj} Guild of {Trade}', 'The {Trade}’ Fellowship', 'The Honorable Society of {Trade}', 'The {Trade}’ Union of {Town}'],
    services: ['fair prices and certified quality', 'training for apprentices', 'legal defense for members', 'a hall with cheap beds for traveling members', 'loans at honest interest', 'contracts with the city', 'access to a members-only workshop', 'protection from rival guilds', 'burial costs for members', 'a job board updated daily'],
    dues: ['5 gp a year and a day’s labor for the city', '1 sp a week and attendance at every feast', 'a tenth of all earnings', 'one masterwork piece each year', 'nothing, but members owe favors when called', '25 gp to join, then 1 gp a month'],
    quirks: ['The guildmaster is elected by a contest of skill.', 'Members wear a ring that turns black if they break guild law.', 'The guildhall has a vault no one has opened in a century.', 'The guild secretly launders money for a crime family.', 'Two factions within the guild are on the edge of open war.', 'The guild’s charter was signed by a dragon.', 'Membership is passed down in families, and outsiders resent it.', 'The guild is quietly bankrupt.'],
    leaders: ['a gruff master who started as an apprentice', 'a young prodigy resented by the elders', 'an elderly gnome who has led for eighty years', 'a smooth negotiator with friends at court', 'a retired adventurer with a missing hand', 'a stern woman who never forgives a debt'],
  },
  clan: {
    peoples: ['Dwarf', 'Human', 'Elf', 'Halfling', 'Orc', 'Goliath', 'Dragonborn', 'Gnome', 'Tiefling'],
    names: { Dwarf: ['Clan {Surname}', 'The {Surname} Clan'], Orc: ['The {Adj} Tusk Clan', 'Clan of the {Noun}'], Goliath: ['The {Noun} Peak Clan', 'The {Surname} Kin'], Dragonborn: ['Clan {Surname}', 'The {Adj} Scale Clan'], other: ['House {Surname}', 'The {Surname} Family', 'The {Surname} Line'] },
    seats: ['a fortified hall in the mountains', 'a crumbling manor in the city', 'a ring of longhouses in the forest', 'a tower overlooking the harbor', 'a hidden valley', 'a river island estate', 'a hollow beneath an old hill', 'a castle half lost to the sea'],
    traditions: ['Every child must spend a year away from home before coming of age.', 'The clan keeps a great book recording every member’s deeds.', 'Weddings are sealed with a duel between the families.', 'They bury their dead with their weapons and their debts.', 'The clan heir must slay a beast before taking their seat.', 'Guests may not be harmed under the clan roof, whatever they’ve done.', 'Each generation forges a new link in a great clan chain.', 'Names are earned, never given at birth.'],
    feuds: ['an ancient feud with a neighboring clan over a stolen heirloom', 'a bitter split between two heirs', 'a blood debt owed to a rival house', 'a marriage alliance that both sides regret', 'an old alliance with an elven house', 'a war debt to the crown that can never be repaid', 'a secret pact with a hag'],
    heraldry: ['an axe over a mountain, silver on blue', 'a black boar on gold', 'a white tree on green', 'a red hand on white', 'three stars over a wave', 'a coiled dragon on crimson', 'a crowned bear', 'a hammer between two keys'],
    mottos: ['“Stone remembers.”', '“We hold.”', '“Blood and bread.”', '“First in, last out.”', '“Always home.”', '“Our debts are paid in full.”', '“The roots run deep.”', '“Unbowed, unbroken.”'],
  },
};
