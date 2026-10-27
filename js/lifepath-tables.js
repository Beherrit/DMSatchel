// Lifepath tables for fantasy characters. All text is original.
// Placeholders: {name} {first} {they} {them} {their} {themself} {They} {Their} {is} {was} {has} (agree with {they}),
// {town} hometown, {npc} a random person's name, {region}, inline choices {a|b|c}.
// Event entries are subject-less past-tense phrases ("Ran away from home…") shown on a timeline.

export const STANDINGS = [
  { id: 'destitute', label: 'Destitute', weight: 8, note: 'never sure where the next meal would come from' },
  { id: 'poor', label: 'Poor', weight: 22, note: 'patched clothes, thin soup, hard work' },
  { id: 'working', label: 'Working folk', weight: 30, note: 'honest labor and just enough' },
  { id: 'comfortable', label: 'Comfortable', weight: 20, note: 'a sound roof and a little set aside' },
  { id: 'wealthy', label: 'Wealthy', weight: 13, note: 'servants, tutors and expectations' },
  { id: 'noble', label: 'Noble', weight: 7, note: 'a title, a crest and a family name to live up to' },
];

export const HOMETOWNS = {
  any: [
    'a fishing village on a cold, grey coast', 'a crossroads market town that never sleeps', 'a walled river city choked with barges',
    'a farming hamlet of forty souls', 'a mining town clinging to a mountainside', 'a frontier fort that grew into a town',
    'a port city where three languages are spoken on every dock', 'a pilgrim town built around an ancient shrine',
    'a logging camp deep in old forest', 'a sprawling capital of spires and slums', 'a marsh village built on stilts',
    'a sleepy vineyard valley', 'a caravan stop at the edge of the desert', 'a lakeside town famous for its fog',
  ],
  Dwarf: ['a mountain hold carved over twenty generations', 'a dwarven trade-quarter in a human city', 'a deep mining colony beneath the hills'],
  Elf: ['a forest enclave where the houses grow from living trees', 'an elven quarter in an old human city', 'a moonlit island community'],
  Halfling: ['a cozy shire of round doors and long gardens', 'a riverboat community that never stays put', 'a halfling neighborhood above a city’s bakeries'],
  Gnome: ['a burrow-town of workshops under a hill', 'a gnomish quarter full of clocks and smoke', 'a forest warren hidden by illusions'],
  Orc: ['a hill-clan camp of hide tents and great fires', 'a mercenary town founded by orc veterans', 'a city district where orc families settled after the war'],
  Dragonborn: ['a clan citadel of red stone', 'a dragonborn enclave in a cosmopolitan port', 'a nomadic clan’s winter grounds'],
  Goliath: ['a mountaintop village above the clouds', 'a goliath camp that follows the herds across the peaks', 'a high pass waystation run by goliath families'],
  Tiefling: ['a city’s tiefling quarter, crowded and proud', 'a remote village where no one asked questions', 'a traveling circus that took in outsiders'],
  Aasimar: ['a temple town where strangers left offerings at the door', 'a quiet village that whispered about the child’s eyes', 'a mountain monastery that took the child in'],
};

export const BIRTH = [
  { text: 'in a cramped bed above the family workshop', weight: 6 },
  { text: 'in the temple’s birthing hall, attended by acolytes', weight: 4 },
  { text: 'at home, with a midwife and a kitchen full of relatives', weight: 8 },
  { text: 'on a wagon during a winter migration', weight: 2 },
  { text: 'in the hold of a ship during a storm', weight: 2 },
  { text: 'in a besieged town, as catapult stones fell', weight: 1 },
  { text: 'under a blood moon that the village still talks about', weight: 2 },
  { text: 'in a stable, because the inn was full', weight: 1 },
  { text: 'in a noble manor, with a court physician pacing outside', weight: 3, standing: ['wealthy', 'noble'] },
  { text: 'in a debtor’s prison, where {their} mother was held', weight: 1, standing: ['destitute', 'poor'], secret: 'Was born in a debtor’s prison and has never told anyone.' },
  { text: 'in a field at harvest time; {their} mother went back to work the next day', weight: 3, standing: ['poor', 'working'] },
  { text: 'during an eclipse; an old woman declared it an omen', weight: 1 },
  { text: 'two months early, small enough to fit in a bread basket', weight: 2 },
  { text: 'as one of twins; the other did not survive the night', weight: 1, sibling: 'twin' },
  { text: 'in a hidden camp in the woods while the family fled their enemies', weight: 1 },
];

export const PARENT_JOBS = {
  destitute: ['beggar', 'ragpicker', 'gravedigger', 'day laborer', 'mudlark', 'thief', 'chimney sweep'],
  poor: ['farmhand', 'fisher', 'washer', 'miner', 'woodcutter', 'shepherd', 'dockhand', 'tanner'],
  working: ['blacksmith', 'baker', 'carpenter', 'weaver', 'innkeeper', 'brewer', 'soldier', 'cobbler', 'potter', 'mason', 'herbalist', 'boatwright'],
  comfortable: ['merchant', 'scribe', 'guild master', 'temple priest', 'physician', 'jeweler', 'sea captain', 'master builder', 'tutor'],
  wealthy: ['banker', 'trading-house owner', 'magistrate', 'court wizard', 'shipping magnate', 'landholder', 'retired general'],
  noble: ['baron', 'countess', 'knight of the realm', 'lord of the marches', 'royal ambassador', 'duke’s cousin'],
};
export const PARENT_TEMPERS = ['gentle and patient', 'strict but fair', 'loving and scattered', 'cold and ambitious', 'loud and warm', 'quiet and watchful', 'fiercely protective', 'often absent', 'drank too much', 'endlessly curious', 'deeply devout', 'bitter about lost chances', 'proud and stubborn', 'funny, always telling stories'];
export const PARENT_STATUS = [
  { text: 'still alive and well', weight: 12 },
  { text: 'alive, but they no longer speak', weight: 4 },
  { text: 'died of a fever', weight: 3 },
  { text: 'killed in a war', weight: 2 },
  { text: 'vanished without a word', weight: 2, hook: '{parent} vanished years ago; a recent letter in {parent_their} handwriting changes everything.' },
  { text: 'lost at sea', weight: 1 },
  { text: 'in prison', weight: 1, hook: '{parent} is in prison for a crime {name} suspects {parent_they} didn’t commit.' },
  { text: 'remarried and moved far away', weight: 2 },
  { text: 'murdered; the killer was never found', weight: 1, hook: 'The person who murdered {parent} is still out there, and {name} has a lead.' },
];

export const SIBLING_FATES = ['runs the family trade now', 'joined the army', 'became a priest', 'married into money', 'is a notorious gambler', 'died young', 'ran off with a traveling troupe', 'is the family favorite', 'hasn’t spoken to {first} in years', 'is an apprentice wizard', 'is a sailor somewhere far away', 'is in trouble with the law', 'looks up to {first} far too much', 'stayed home to care for the family', 'became a famous cook', 'is wanted by the local lord'];

export const FAMILY_SECRETS = [
  'One parent was once a member of a thieves’ guild, and the guild never forgets.',
  'The family fortune came from a grave that should not have been robbed.',
  '{name} was adopted; the birth parents are someone important.',
  'A grandparent made a pact with a fey lord, and the bill is coming due.',
  'The family name is borrowed; the real one is wanted for treason.',
  'There is a sealed room in the family home that no one is allowed to enter.',
  'A sibling everyone believes dead is alive and in hiding.',
  'The family owes a vast debt to a dragon.',
  'An ancestor was a famous villain, and the family has hidden it for generations.',
  'One parent secretly worships a forbidden god.',
  'The family carries a minor curse: each generation, one child sees the dead.',
  'The family heirloom is a fake; the real one was sold to pay a ransom.',
];

export const RAISED_BY = [
  { text: 'both parents, under one roof', weight: 30 },
  { text: 'a single parent who worked every hour there was', weight: 14 },
  { text: 'grandparents, after the parents left to find work', weight: 8 },
  { text: 'an aunt and uncle who never let {them} forget it', weight: 6 },
  { text: 'the sisters of a temple orphanage', weight: 6 },
  { text: 'a street gang that became {their} only family', weight: 4, standing: ['destitute', 'poor'] },
  { text: 'nursemaids and tutors, rarely seeing {their} parents', weight: 6, standing: ['wealthy', 'noble'] },
  { text: 'a traveling troupe of performers', weight: 3 },
  { text: 'a mercenary company that took {them} in as a mascot', weight: 2 },
  { text: 'an old hermit in the woods', weight: 2 },
  { text: 'an adoptive family of a different people entirely', weight: 3 },
  { text: 'a wizard, as a servant who was never paid', weight: 2 },
  { text: 'an older sibling barely old enough to manage', weight: 4 },
];

export const CHILDHOOD = [
  { text: 'Got lost in the {woods|market crowd|catacombs} for a whole night and came back calm, holding a strange coin.', trait: 'X' },
  { text: 'Broke an arm jumping off a barn roof with a blanket for wings.', trait: 'N' },
  { text: 'Brought home every stray animal, including a very angry badger.', trait: 'L' },
  { text: 'Taught {themself} to read from old tavern notices and temple hymnals.', trait: 'N' },
  { text: 'Spent a long winter sick in bed, listening to {their} grandmother’s stories.', trait: 'N' },
  { text: 'Was bullied for a year by {npc}, a bigger child from down the road.', trait: 'D', person: ['Rival', '{npc}, the childhood bully'] },
  { text: 'Stood up to a bully to protect a smaller child, and lost two teeth doing it.', trait: 'L' },
  { text: 'Found a dead adventurer in a ditch and kept {their} dagger.', trait: 'D', item: 'an adventurer’s old dagger' },
  { text: 'Watched {their} home village burn during a raid.', trait: 'D' },
  { text: 'Won a footrace at the harvest fair against children twice {their} age.', trait: 'L' },
  { text: 'Started a small fire with {their} mind during a tantrum. No one ever spoke of it.', trait: 'X' },
  { text: 'Had an imaginary friend who knew things {they} couldn’t have known.', trait: 'X' },
  { text: 'Was caught stealing bread and spent a night in the stocks.', trait: 'D' },
  { text: 'Helped deliver a calf in a storm and decided {they} {was} good with animals.', trait: 'L' },
  { text: 'Spent summers fishing with {npc}, {their} first best friend.', trait: 'L', person: ['Friend', '{npc}, a childhood best friend'] },
  { text: 'Nearly drowned in the millpond and was pulled out by a stranger who was never seen again.', trait: 'X' },
  { text: 'Hid in a cellar during a monster attack and heard everything.', trait: 'D' },
  { text: 'Was the only child who could calm the temple’s old blind dog.', trait: 'L' },
  { text: 'Followed a will-o’-wisp into the marsh and came back a day later than {they} left.', trait: 'X' },
  { text: 'Ran a small and profitable dice racket among the other children.', trait: 'N' },
  { text: 'Saw a dragon fly overhead and has wanted to see another ever since.', trait: 'L' },
  { text: 'Lost a beloved pet to a wolf and swore {they} would never be helpless again.', trait: 'D' },
];

export const ADOLESCENCE = [
  { text: 'Fell hopelessly in love with {npc}, who never noticed.', trait: 'N' },
  { text: 'Ran away from home for a season and came back changed.', trait: 'N' },
  { text: 'Apprenticed briefly to a {blacksmith|baker|tanner|scribe} and was dismissed for {daydreaming|arguing|a small fire}.', trait: 'N' },
  { text: 'Got into a brawl with {npc} that turned into a lifelong rivalry.', trait: 'D', person: ['Rival', '{npc}, a rival since a teenage brawl'] },
  { text: 'Took the blame for a friend’s crime and kept quiet about it.', trait: 'L' },
  { text: 'Won a small tournament with a borrowed sword.', trait: 'L' },
  { text: 'Discovered a hidden passage under {town} and told no one.', trait: 'X' },
  { text: 'Served as a page in a lord’s household and saw how power really works.', trait: 'N' },
  { text: 'Was the only survivor when a caravan was ambushed on the road.', trait: 'D' },
  { text: 'Spent a year as a cabin hand on a merchant ship.', trait: 'N' },
  { text: 'Made a promise to a dying stranger that {they} still intend{s|} to keep.', trait: 'L', drive: 'keep a promise made to a dying stranger' },
  { text: 'Had a vision during a fever that {they} still can’t explain.', trait: 'X' },
  { text: 'Fell in with a crowd of young thieves and got very good at climbing walls.', trait: 'D' },
  { text: 'Nursed a sick parent through a long illness.', trait: 'L' },
  { text: 'Was publicly humiliated by a noble’s child and never forgot it.', trait: 'D' },
  { text: 'Found an old map in a library book and has been decoding it ever since.', trait: 'X', item: 'a half-decoded map' },
];

// Why the character took up their background: one sentence, subject is {name}.
// For backgrounds from your library.
export const BACKGROUND_WHY_ANY = [
  'Before adventuring, {first} spent years living the {background} life, and still falls back on its habits.',
  '{first} took up the {background} life because {their} family always had, and it never quite fit.',
  'The {background} life taught {first} to read people, and a little about when to leave town.',
  '{first} chose the {background} life to get away from home, and found more trouble than {they} expected.',
];

export const BACKGROUND_WHY = {
  Acolyte: [
    '{first} was left on the temple steps as a child and grew up sweeping its halls and memorizing its prayers.',
    '{first} took vows after surviving a plague that took everyone else in {their} street.',
    '{first} entered the temple to escape an arranged marriage and found {they} actually believed.',
    'A priest saw a light around {first} during a festival and asked {their} family to give {them} to the temple.',
    '{first} served the temple archive, copying sacred texts by candlelight for years.',
    '{first} was sent to the temple as penance for a childhood crime and stayed out of genuine faith.',
  ],
  Artisan: [
    '{first} apprenticed to a master {smith|potter|glassblower|woodcarver} who was brilliant, cruel and impossible to please.',
    '{first} inherited the family workshop and the debts that came with it.',
    '{first} earned a guild mark at a young age, then left the guild over a bitter dispute.',
    '{first} taught {themself} the craft from broken things salvaged from rubbish heaps.',
    '{first} made a masterpiece for a noble who refused to pay, and has been chasing that debt ever since.',
    '{first} traveled from town to town, mending whatever people brought to {their} cart.',
  ],
  Charlatan: [
    '{first} sold miracle tonics from the back of a wagon and got very good at leaving towns quickly.',
    '{first} learned the con from a parent who could talk a dragon out of its hoard.',
    '{first} once posed as a visiting noble for an entire season and nearly married into a real title.',
    '{first} forged documents for refugees fleeing a war and then kept going for profit.',
    '{first} ran a fortune-telling booth and occasionally, frighteningly, got things right.',
    '{first} swindled the wrong merchant, and now a bounty hunter carries {their} description.',
  ],
  Criminal: [
    '{first} ran with a gang of cutpurses before {they} could read.',
    '{first} was a lookout and climber for a burglary crew that broke up after a job went wrong.',
    '{first} smuggled goods past the city watch for a guild that still thinks {they} owe{s|} them.',
    '{first} stole to feed {their} siblings and found {they} {was} very good at it.',
    '{first} was framed for a crime, broke out of prison, and decided to earn the reputation.',
    '{first} collected debts for a crime boss until {they} couldn’t stomach it any more.',
  ],
  Entertainer: [
    '{first} grew up in a traveling troupe, performing before {they} could walk.',
    '{first} sang in taverns for coins and was discovered by a famous bard who later betrayed {them}.',
    '{first} was a court jester and heard far too many secrets.',
    '{first} juggled knives on street corners until a crowd of fans followed {them} from town to town.',
    '{first} ran away from a respectable family to join an acrobat troupe.',
    '{first} wrote a song that became wildly popular, and someone else took the credit.',
  ],
  Farmer: [
    '{first} worked the family fields from dawn to dusk until a blight ruined three harvests in a row.',
    '{first} raised prize-winning animals and still talks about them with real affection.',
    '{first} defended the farm from wolves, bandits and tax collectors with equal stubbornness.',
    '{first} left the farm when it was seized by a lord, swearing to buy it back someday.',
    '{first} grew up on a farm on the edge of the wilds, where strange things came out of the woods at night.',
    '{first} was the strongest hand at harvest and the first to volunteer when the village needed someone brave.',
  ],
  Guard: [
    '{first} walked the walls of {town} for years and knows how quickly a quiet night can turn.',
    '{first} served in a lord’s household guard and saw things {they} {was} told to forget.',
    '{first} joined the city watch to make a difference and found the watch was the problem.',
    '{first} guarded caravans across dangerous roads and lost {their} partner to bandits.',
    '{first} stood watch at a temple vault that was robbed on {their} shift.',
    '{first} was the youngest sergeant in the watch, until {they} arrested the wrong person’s son.',
  ],
  Guide: [
    '{first} led travelers through {region} and knows every trail, ford and danger there.',
    '{first} grew up among hunters and could track a deer across bare rock by age twelve.',
    '{first} guided an expedition that never came back; {first} was the only one who returned.',
    '{first} served as a scout for a ranger company and learned the land from the best.',
    '{first} lived wild in the forest for years after running from home.',
    '{first} guided pilgrims to a holy site through mountains that killed the careless.',
  ],
  Hermit: [
    '{first} withdrew from the world after a tragedy and spent years alone in a cave above {town}.',
    '{first} lived with an order of silent monks, tending their herb garden.',
    '{first} sought a vision in the wilderness and found something {they} still struggle to describe.',
    '{first} was exiled for heresy and spent years studying in solitude.',
    '{first} cared for the sick at a remote shrine that most people had forgotten.',
    '{first} lived in a lighthouse for seven years, reading every book the last keeper left behind.',
  ],
  Merchant: [
    '{first} drove a trade wagon along the {coast road|river route|mountain passes} with a parent who taught {them} to haggle.',
    '{first} ran a market stall that grew into a small shop, then lost it all in a single bad deal.',
    '{first} worked as a clerk for a trading house and learned exactly where the money goes.',
    '{first} bought and sold curiosities and once sold something {they} now desperately want back.',
    '{first} traded with goblins, dwarves and stranger folk whom other merchants wouldn’t deal with.',
    '{first} inherited a trading license and a rival family that wants it.',
  ],
  Noble: [
    '{first} is a younger child of a minor noble house, with a title and very little else.',
    '{first} was raised to rule but lost the inheritance to a scheming cousin.',
    '{first} fled court after a scandal that the family still won’t discuss.',
    '{first} grew up in a fading noble house, keeping up appearances while the silver was sold.',
    '{first} was a hostage at a rival court as a child, a guarantee of peace between houses.',
    '{first} renounced the family title after seeing how the family treated its tenants.',
  ],
  Sage: [
    '{first} studied at a great library and was expelled for reading a forbidden book.',
    '{first} was a scholar’s assistant who finished the master’s life work after the master died.',
    '{first} spent years cataloguing ruins and learning dead languages.',
    '{first} tutored a noble’s children and spent the evenings in their private library.',
    '{first} is obsessed with a single unanswered question about the world’s history.',
    '{first} taught at an academy until a rival’s accusation of plagiarism forced {them} out.',
  ],
  Sailor: [
    '{first} signed on as a cabin hand at twelve and has more sea miles than birthdays.',
    '{first} sailed with privateers who were pirates in all but name.',
    '{first} survived a shipwreck by clinging to a barrel for three days.',
    '{first} worked the docks of {town} and finally stowed away on a ship heading anywhere.',
    '{first} served on a navy warship and still has nightmares about the battle at sea.',
    '{first} fished the cold waters with {their} family until a sea monster took the boat.',
  ],
  Scribe: [
    '{first} copied contracts and letters for a magistrate and learned who was cheating whom.',
    '{first} worked in a monastery scriptorium illuminating manuscripts.',
    '{first} wrote letters for people who couldn’t, and so learned everyone’s secrets.',
    '{first} kept the records of a merchant guild and found an entry that should not exist.',
    '{first} was a court recorder and witnessed a confession no one else heard.',
    '{first} translated old texts for collectors, some of whom were very strange.',
  ],
  Soldier: [
    '{first} marched with a {royal army|mercenary company|border legion} and fought in more battles than {they} like{s|} to count.',
    '{first} was conscripted at sixteen and survived a war that most of {their} unit did not.',
    '{first} rose to sergeant before deserting after an order {they} refused to follow.',
    '{first} served as a quartermaster and learned that wars are won by whoever has the food.',
    '{first} was a shield-bearer who saved an officer’s life and was given a medal and nothing else.',
    '{first} guarded a fortress on the frontier for years where nothing ever happened, until one night it did.',
  ],
  Wayfarer: [
    '{first} grew up on the streets of {town}, sleeping in doorways and trusting no one.',
    '{first} wandered from town to town doing odd jobs and never staying long.',
    '{first} ran messages for anyone who paid and learned every back alley of {town}.',
    '{first} lived among beggars and pickpockets who looked out for each other.',
    '{first} was a vagabond who followed the roads wherever they led.',
    '{first} survived on wits and kindness after {their} family was turned out of their home.',
  ],
};

// How the character found their class. One or two sentences; may name a mentor ({mentor}).
// For classes from your library, which have no lines of their own.
export const CLASS_WHY_ANY = [
  '{mentor} saw a spark in {first} and spent years teaching {them} everything {they} now know.',
  '{first} found an old book of techniques in a ruin and practised them alone until they worked.',
  'An order with few members and many secrets took {first} in after {they} proved {themself} in a crisis.',
  '{first} was the only one in {their} village with the knack, and {mentor}, a wandering teacher, noticed.',
  'A debt to {mentor} was paid in training; {first} came out of it with skills {they} never asked for.',
  'Hard years on the road taught {first} this way of fighting and surviving, one mistake at a time.',
];

export const CLASS_WHY = {
  Barbarian: [
    'The rage first came when bandits attacked {their} family; {they} remember{s|} nothing until it was over.',
    '{first} was raised among a hill clan where {mentor}, a scarred war-chief, taught that fury is a gift to be guided.',
    'A spirit of the wild beast {they} slew now runs in {their} blood.',
    '{first} fought in illegal pit fights and learned to stop holding back.',
    'A great tree spoke to {first} in a storm and filled {them} with the strength of its roots.',
    'Grief over a loss became a fire {first} learned to aim, with help from {mentor}.',
  ],
  Bard: [
    '{first} studied at a bardic college under {mentor}, who believed every song holds a little magic.',
    '{first} discovered that {their} music could make people weep, laugh or obey.',
    'A fey creature taught {first} a tune in exchange for a memory {they} can’t get back.',
    '{first} collected stories in every tavern and found the words had power when sung.',
    '{first} learned the old songs from {their} grandmother, songs that make the candles flicker.',
    'A dying bard passed {their} instrument to {first}, and with it something more.',
  ],
  Cleric: [
    '{first} heard a god’s voice during a near-death experience and has served ever since.',
    '{first} trained under {mentor}, a high priest who taught that faith without works is empty.',
    'A miracle saved {first}’s village, and {they} wanted to understand it.',
    '{first} prayed for a sign for seven nights; on the eighth, {their} hands began to glow.',
    '{first} is the latest in a long line of priests and the first in generations to manifest true power.',
    'A god chose {first} for reasons {they} still {is} trying to understand.',
  ],
  Druid: [
    '{first} was taught the old ways by {mentor}, a druid who lived in a hollow oak.',
    'The land itself called to {first} after a forest fire, asking for a protector.',
    '{first} grew up among a druid circle and learned to speak with animals before people.',
    '{first} woke one morning in the shape of a fox and spent a terrified week learning how to change back.',
    'A sea spirit saved {first} from drowning and gave {them} a duty to the tides.',
    '{first} read the stars with an old circle of druids and saw a coming darkness.',
  ],
  Fighter: [
    '{first} trained at a fighting school under {mentor}, a retired champion with no patience for excuses.',
    '{first} learned to fight because nobody else was going to protect {their} family.',
    '{first} served as a squire to a knight who fell in battle; the sword passed to {them}.',
    '{first} fought in a mercenary company and learned every trick that keeps a soldier alive.',
    '{first} won a tournament as an unknown and has been fighting ever since.',
    '{first} practiced with a wooden sword every day for ten years, waiting for a reason.',
  ],
  Monk: [
    '{first} was raised in a mountain monastery by {mentor}, who spoke rarely and struck fast.',
    '{first} sought discipline after a violent youth and found it in the monastery’s quiet halls.',
    '{first} learned to fight from a wandering master who paid for every meal with a lesson.',
    'An ancient technique was passed down through {first}’s family in secret.',
    '{first} spent years meditating until {they} could feel the energy in every living thing.',
    '{first}’s monastery was destroyed; {they} may be the last who knows its teachings.',
  ],
  Paladin: [
    '{first} swore an oath on a battlefield, beside a dying friend, and felt something answer.',
    '{first} was trained by {mentor}, a paladin of an old order that has nearly faded away.',
    '{first} made a vow to protect the innocent after failing to protect someone once.',
    'Divine power awoke in {first} the moment {they} stood between a monster and a child.',
    '{first} was knighted for bravery, and the oath took on a life of its own.',
    '{first} swore vengeance against those who destroyed {their} home, and the oath gave {them} strength.',
  ],
  Ranger: [
    '{first} was trained by {mentor}, a ranger who guarded the borderlands for forty years.',
    '{first} hunted the creature that killed {their} family and learned everything about the wilds doing it.',
    'An animal companion found {first} in the woods and has never left {their} side.',
    '{first} served with a ranger company that patrols the edges of civilization.',
    'A fey being taught {first} to walk unseen in exchange for a favor yet to be named.',
    '{first} grew up in the wilds and learned that magic flows through every root and stream.',
  ],
  Rogue: [
    '{first} learned to pick locks and pockets from {mentor}, who ran a school for thieves.',
    '{first} survived the streets by being faster and quieter than everyone else.',
    '{first} worked as a spy for a noble house and learned every dirty trick there is.',
    '{first} was an assassin’s apprentice and walked away before taking the final contract.',
    '{first} learned that a well-placed blade beats a strong arm every time.',
    '{first} picked up the skills of a thief out of necessity and kept them out of habit.',
  ],
  Sorcerer: [
    'Magic first burst out of {first} during a moment of fear, setting the barn on fire.',
    'A dragon in {their} bloodline left a gift that awoke on {their} sixteenth birthday.',
    '{first} was touched by a strange, wild magic as a child, and it has never left.',
    '{first} was born during a magical storm; things have floated around {them} ever since.',
    'Something from beyond the stars brushed {first}’s mind, and {they} can hear its echoes.',
    'The magic comes from a clockwork order in the planes, and it wants {first} to be precise.',
  ],
  Warlock: [
    '{first} made a desperate bargain with a {fiend|fey lord|celestial|thing from beyond} to save someone {they} loved.',
    'A voice from an old book offered {first} power, and {they} said yes.',
    '{first} inherited a pact from a dead relative, along with all of its debts.',
    '{first} stumbled into a fey circle and walked out bound to an archfey’s service.',
    'An entity whispered to {first} in dreams for years before {they} finally answered.',
    '{first} bargained for knowledge, and the patron is still deciding what it wants in return.',
  ],
  Wizard: [
    '{first} studied at an arcane academy under {mentor}, a strict and brilliant master.',
    '{first} taught {themself} magic from a spellbook found in a ruined tower.',
    '{first} served as a wizard’s apprentice and learned by watching, then by doing.',
    '{first} spent years in libraries, decoding the formulas of magic one page at a time.',
    '{first} was the most promising student in {their} class until a rival’s sabotage.',
    '{first} inherited a spellbook from a grandparent no one knew was a wizard.',
  ],
};

export const SUBCLASS_FLAVOR = {
  'Path of the Berserker': 'fights in a red haze that frightens even {their} allies', 'Path of the Wild Heart': 'calls on the spirits of beasts', 'Path of the World Tree': 'draws strength from the roots of the world', 'Path of the Zealot': 'rages in the name of a war god',
  'College of Dance': 'turns every fight into a dance', 'College of Glamour': 'carries the dazzling magic of the fey', 'College of Lore': 'collects secrets and spells from everywhere', 'College of Valor': 'sings the deeds of heroes while making new ones',
  'Life Domain': 'heals in the name of {their} god', 'Light Domain': 'burns away darkness with holy fire', 'Trickery Domain': 'serves a god of mischief and secrets', 'War Domain': 'serves a god of battle',
  'Circle of the Land': 'draws power from a particular land', 'Circle of the Moon': 'takes on fearsome beast forms', 'Circle of the Sea': 'commands wind and wave', 'Circle of the Stars': 'reads the constellations for power',
  'Battle Master': 'fights with precise maneuvers', Champion: 'relies on raw martial excellence', 'Eldritch Knight': 'blends swordplay with wizardry', 'Psi Warrior': 'fights with psionic force',
  'Warrior of Mercy': 'heals and harms with the same hands', 'Warrior of Shadow': 'moves through darkness', 'Warrior of the Elements': 'channels the elements through every strike', 'Warrior of the Open Hand': 'masters the unarmed arts',
  'Oath of Devotion': 'upholds honesty, courage and compassion', 'Oath of Glory': 'pursues legendary deeds', 'Oath of the Ancients': 'protects the light and life of the world', 'Oath of Vengeance': 'hunts those who commit grave wrongs',
  'Beast Master': 'fights beside a primal beast companion', 'Fey Wanderer': 'carries the magic of the Feywild', 'Gloom Stalker': 'hunts in the dark places', Hunter: 'specializes in bringing down dangerous prey',
  'Arcane Trickster': 'mixes larceny with illusion', Assassin: 'specializes in sudden death', Soulknife: 'strikes with blades of psychic energy', Thief: 'is a master burglar',
  'Aberrant Sorcery': 'channels alien power from beyond', 'Clockwork Sorcery': 'draws on the cosmic forces of order', 'Draconic Sorcery': 'carries a dragon’s blood', 'Wild Magic Sorcery': 'unleashes unpredictable surges',
  'Archfey Patron': 'serves a lord of the fey', 'Celestial Patron': 'serves a being of the upper planes', 'Fiend Patron': 'serves a fiend of the lower planes', 'Great Old One Patron': 'serves an unknowable entity',
  Abjurer: 'specializes in protective magic', Diviner: 'peers into the future', Evoker: 'commands destructive elemental magic', Illusionist: 'bends perception itself',
};

export const ADULT_EVENTS = [
  { text: 'Fell in love with {npc}; it ended badly.', trait: 'N', person: ['Ex', '{npc}, a former love'] },
  { text: 'Married {npc}, who is waiting for {them} back home.', trait: 'L', person: ['Love', '{npc}, {their} spouse'] },
  { text: 'Was robbed on the road and left for dead.', trait: 'D' },
  { text: 'Saved a stranger from drowning; the stranger turned out to be a noble.', trait: 'L', person: ['Ally', '{npc}, a noble who owes {them} a life'] },
  { text: 'Lost a fortune at cards in a single night.', trait: 'N' },
  { text: 'Fought in a skirmish against goblin raiders and earned a scar across the {cheek|ribs|forearm}.', trait: 'N' },
  { text: 'Made an enemy of {npc} by exposing {their} scheme in public.', trait: 'N', person: ['Enemy', '{npc}, whose scheme {first} exposed'] },
  { text: 'Spent a season in jail for a crime {they} did{n’t| actually} commit.', trait: 'D' },
  { text: 'Found a strange relic in a ruin and has carried it ever since.', trait: 'X', item: 'a strange relic from a ruin' },
  { text: 'Survived a plague that swept through {town}.', trait: 'D' },
  { text: 'Became godparent to the child of a dear friend.', trait: 'L', person: ['Dependent', '{npc}, a godchild'] },
  { text: 'Was cursed by a hag and cured, mostly.', trait: 'X' },
  { text: 'Worked as a bodyguard for a merchant who turned out to be a smuggler.', trait: 'N' },
  { text: 'Was betrayed by a business partner, {npc}, and lost everything.', trait: 'D', person: ['Enemy', '{npc}, who betrayed {them}'] },
  { text: 'Traveled to a distant land and came back with stories nobody believes.', trait: 'L' },
  { text: 'Met an adventurer who inspired {them} to seek {their} own fortune.', trait: 'L' },
  { text: 'Witnessed a murder and was the only one willing to testify.', trait: 'L', person: ['Enemy', '{npc}, the killer {first} testified against'] },
  { text: 'Had a long, strange dream that turned out to be prophetic.', trait: 'X' },
  { text: 'Owed money to a crime boss and paid it off with a favor {they} regret{s|}.', trait: 'D' },
  { text: 'Helped a village drive off a monster and was hailed as a hero, briefly.', trait: 'L' },
  { text: 'Was swindled out of {their} savings by a charming stranger.', trait: 'D' },
  { text: 'Adopted a {dog|cat|raven|mule|goat} that follows {them} everywhere.', trait: 'L', item: 'a loyal animal companion (mundane)' },
  { text: 'Spent a year as a prisoner of war.', trait: 'D' },
  { text: 'Won a small piece of land in a bet and never visited it.', trait: 'N', hook: 'The land {first} won in a bet turns out to hold something valuable, and someone wants it.' },
];

export const TRAITS = {
  L: ['Kind to strangers without being asked', 'Fiercely loyal to friends', 'Always looks for the best in people', 'Laughs easily, even in danger', 'Generous to a fault', 'Patient and calm under pressure', 'Honest even when it costs', 'Protective of anyone weaker'],
  D: ['Slow to trust anyone', 'Carries an old grudge like a stone', 'Quick to anger, slow to cool', 'Expects the worst and is rarely wrong', 'Keeps everyone at arm’s length', 'Has a bleak sense of humor', 'Hates being told what to do', 'Haunted by the past'],
  N: ['Curious about everything', 'Practical and plain-spoken', 'Talks too much when nervous', 'Loves a good meal above most things', 'Collects small trinkets', 'Overthinks every decision', 'Likes routine and order', 'Restless when standing still'],
  X: ['Sometimes speaks to people who aren’t there', 'Believes in omens and signs', 'Remembers dreams with eerie clarity', 'Animals behave oddly around them', 'Feels drawn to old ruins', 'Has an uncanny sense of when someone is lying'],
};
export const IDEALS = {
  good: ['Charity: we should help those who cannot help themselves.', 'Mercy: everyone deserves a second chance.', 'Protection: the strong must shield the weak.', 'Hope: things can get better, and I can help.'],
  lawful: ['Honor: my word is my bond.', 'Tradition: the old ways keep us whole.', 'Duty: I do what must be done.', 'Justice: no one is above the law.'],
  chaotic: ['Freedom: no one should be chained.', 'Change: the world must be shaken up.', 'Independence: I make my own way.', 'Passion: life is meant to be felt.'],
  neutral: ['Balance: everything has its place.', 'Knowledge: understanding is worth any price.', 'Self-reliance: trust yourself first.', 'Live and let live.'],
  evil: ['Power: I will never be weak again.', 'Greed: everything has a price, and I will have it.', 'Ambition: I will be remembered, whatever it takes.', 'Revenge: those who wronged me will pay.'],
};
export const BONDS = ['I would die for my family, even the ones I can’t stand.', 'I owe my life to my mentor.', 'My hometown is the most important place in the world to me.', 'I am searching for someone I lost.', 'An heirloom I carry is my last link to my past.', 'I fight for those who cannot fight for themselves.', 'I made a promise I intend to keep.', 'My faith guides everything I do.', 'I will restore my family’s good name.', 'Someone I love is in danger, and I must save them.', 'I will finish the work my mentor began.', 'The companions I travel with are my true family.'];
export const FLAWS = ['I can’t resist a pretty face or a good bet.', 'I trust too easily.', 'I’m too proud to ask for help.', 'I lie when the truth is inconvenient.', 'I hold grudges forever.', 'I panic when cornered.', 'I drink more than I should.', 'I can’t keep a secret.', 'I take reckless risks to prove myself.', 'I am terrified of being seen as weak.', 'I’m greedy, though I hide it well.', 'I judge others harshly and myself not at all.', 'I follow orders even when I shouldn’t.', 'I put my own goals above my friends.'];
export const FEARS = ['deep water', 'fire', 'the dark', 'being forgotten', 'spiders', 'being trapped underground', 'losing control', 'heights', 'the dead rising', 'disappointing a parent', 'magic nobody understands', 'being alone', 'large crowds', 'losing their temper'];
export const HABITS = ['hums while working', 'counts coins when nervous', 'carves small wooden animals', 'keeps a journal of every place {they} visit{s|}', 'prays before every meal', 'cracks {their} knuckles', 'collects stones from every town', 'always sits facing the door', 'names {their} weapons', 'talks to animals as if they understand', 'polishes {their} gear obsessively', 'bites {their} nails', 'sings off-key on the road', 'quotes old proverbs'];
export const VOICES = ['soft and measured', 'loud and cheerful', 'dry and sarcastic', 'quick and nervous', 'deep and slow', 'lilting accent from home', 'gruff, with few words', 'formal and precise', 'warm and storytelling', 'quiet, almost a whisper'];
export const GOALS = ['earn enough gold to buy back the family land', 'find the person who wronged {their} family', 'prove {themself} to a doubting parent', 'recover a lost family heirloom', 'map the unknown lands beyond {region}', 'become a legend whose name is sung in taverns', 'find a cure for a loved one’s illness', 'atone for a terrible mistake', 'uncover the truth about {their} birth', 'protect {town} from a threat only {they} see{s|}', 'pay off a debt to a dangerous person', 'find {their} missing mentor', 'join a famous order of heroes', 'learn the secret of a forbidden magic'];
export const DREAMS = ['a quiet home with a garden and no more fighting', 'a seat on the city council', '{their} name in the history books', 'to see every ocean in the world', 'to found a school or temple of {their} own', 'a fortune large enough to never worry again', 'to be forgiven', 'peace between two warring peoples', 'to meet {their} god face to face', 'to sail beyond the edge of the maps'];
export const SECRETS = ['once killed someone in a moment of panic and hid the body', 'is not who {they} claim{s|} to be', 'is being blackmailed by an old acquaintance', 'stole the coin that started {their} adventuring career', 'is secretly in love with a member of the party', 'has a price on {their} head in another city', 'can hear a voice that tells {them} things', 'deserted from an army', 'cheated to win a contest everyone praises {them} for', 'still serves a patron {they} claim{s|} to have left', 'caused the disaster that destroyed {their} home', 'has a child {they} {has} never met'];
export const REGRETS = ['leaving home without saying goodbye', 'not being there when a parent died', 'a cruel word to a friend they never took back', 'running away from a fight that cost lives', 'trusting the wrong person', 'choosing gold over a friend', 'breaking a promise to a child', 'never telling someone they loved them'];

export const PEOPLE_ROLES = {
  Mentor: ['taught {them} everything {they} know{s|}', 'still writes letters with advice', 'disappeared on a mysterious errand', 'expects great things', 'is disappointed in {them}', 'died, leaving unfinished business'],
  Rival: ['always one step ahead', 'is friendly to {their} face and poisonous behind it', 'wants the same prize', 'is better at everything, and knows it', 'is now an adventurer too'],
  Friend: ['would drop everything to help', 'runs a tavern where {first} always has a room', 'owes {them} a favor', 'has been missing for a month', 'knows {their} biggest secret'],
  Enemy: ['wants {them} dead', 'has sworn to ruin {them}', 'has risen to a position of power', 'is waiting for the perfect moment', 'believes {first} wronged them'],
  Love: ['is waiting for {them} to come home', 'writes long letters', 'is in danger and doesn’t know it', 'doesn’t know how {first} feels'],
};
export const PEOPLE_JOBS = ['innkeeper', 'priest', 'sellsword', 'wizard', 'merchant', 'guard captain', 'thief', 'noble', 'bard', 'smith', 'scholar', 'sailor', 'ranger', 'courier', 'apothecary', 'gambler', 'knight', 'fence'];

export const HOOK_TEMPLATES = [
  '{enemy} has arrived in town, and {enemy_they} {enemy_is} asking questions about {first}.',
  'A letter from {mentor} begs {first} to come quickly, and gives no reason.',
  '{friend} has gone missing, and the last place {friend_they} {friend_was} seen is a dangerous one.',
  'Someone has discovered {first}’s secret: {first} {secret}.',
  'An old acquaintance from {their} {background} days needs help with one last job.',
  'A stranger arrives claiming to be a lost relative, with proof that seems real.',
  'The family secret is about to come out: {familySecret}',
  '{rival} is after the same treasure as the party.',
  'A bounty notice with {first}’s face on it appears in the next town.',
  'A debt from {first}’s past is called in, with interest.',
];
