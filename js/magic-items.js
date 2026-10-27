// Magic items: the 5e SRD catalog (names, rarity, type, attunement) with short original summaries,
// cursed items, a curse generator and a unique item maker.
// Row format: name | type | rarity (c u r v l a) | attunement ('' no, '1' yes, or who) | summary. "CURSED." starts a cursed item's summary.

export const RARITIES = { c: 'Common', u: 'Uncommon', r: 'Rare', v: 'Very rare', l: 'Legendary', a: 'Artifact' };
export const RARITY_KEYS = { c: 'common', u: 'uncommon', r: 'rare', v: 'veryrare', l: 'legendary', a: 'artifact' };
export const RARITY_VALUE = { c: [50, 100], u: [101, 500], r: [501, 5000], v: [5001, 50000], l: [50001, 200000], a: [250000, 500000] };

const ROWS = `
Adamantine Armor|Armor (medium or heavy)|u||Critical hits against you count as normal hits.
Armor of Invulnerability|Armor (plate)|l|1|Resistance to nonmagical damage; once a day you can become immune to it for 10 minutes.
Armor of Resistance|Armor (any)|r|1|Resistance to one damage type chosen when the armor was made.
Armor of Vulnerability|Armor (plate)|r|1|CURSED. Resistance to one of bludgeoning, piercing or slashing damage, but vulnerability to the other two. You won't take it off willingly.
Demon Armor|Armor (plate)|v|1|CURSED. +1 AC, clawed gauntlets that strike as +1 weapons, and you understand Abyssal. You can't remove it, and demons have the upper hand against you.
Dragon Scale Mail|Armor (scale mail)|v|1|+1 AC, resistance to one dragon's damage type, advantage against dragon fear and breath, and it can sense the nearest such dragon.
Dwarven Plate|Armor (plate)|v||+2 AC, and you can shrug off most of any forced push or pull.
Efreeti Chain|Armor (chain mail)|l|1|+3 AC, immunity to fire, you can walk on molten rock, and you speak Primordial.
Elven Chain|Armor (chain shirt)|r||+1 AC, and anyone can wear it as if trained in medium armor.
Glamoured Studded Leather|Armor (studded leather)|r||+1 AC; with a bonus action it looks like any clothing you like.
Mithral Armor|Armor (medium or heavy)|u||No Strength requirement and no penalty to Stealth.
Plate Armor of Etherealness|Armor (plate)|l|1|Once a day, step into the Ethereal Plane as the Etherealness spell.
Animated Shield|Armor (shield)|v|1|With a bonus action it floats beside you and guards you for a minute, leaving your hands free.
Arrow-Catching Shield|Armor (shield)|r|1|+2 AC against ranged attacks, and you can make yourself the target of a shot aimed at an ally next to you.
Sentinel Shield|Armor (shield)|u||Advantage on initiative and on Wisdom (Perception) checks.
Shield of Missile Attraction|Armor (shield)|r|1|CURSED. Resistance to ranged weapon damage, but ranged attacks against anyone within 10 feet of you are pulled toward you instead.
Spellguard Shield|Armor (shield)|v|1|Advantage on saves against spells, and spell attacks against you have disadvantage.
Berserker Axe|Weapon (any axe)|r|1|CURSED. +1 axe that adds 1 hit point per level, but you can't bear to part with it, and when hurt you may fly into a rage and attack the nearest creature.
Dagger of Venom|Weapon (dagger)|r||+1 dagger; once a day the blade weeps a poison that deals extra damage and can poison the target.
Dancing Sword|Weapon (any sword)|v|1|Toss it into the air and it fights on its own for a few rounds, then returns to your hand.
Defender|Weapon (any sword)|l|1|+3 sword; each turn you can move some of the bonus to your Armor Class.
Dragon Slayer|Weapon (any sword)|r||+1 sword that deals heavy extra damage to dragons.
Flame Tongue|Weapon (any sword)|r|1|Speak its command word and flames run down the blade, adding fire damage and shedding light.
Frost Brand|Weapon (any sword)|v|1|Adds cold damage, grants resistance to fire, and can snuff out nearby flames.
Giant Slayer|Weapon (any axe or sword)|r||+1 weapon that deals extra damage to giants and can knock them prone.
Hammer of Thunderbolts|Weapon (maul)|l|1|+1 maul; paired with a giant-strength belt and ogre-power gauntlets it hits much harder, can stun giants and calls down thunder.
Holy Avenger|Weapon (any sword)|l|by a paladin|+3 sword that deals extra radiant damage to fiends and undead and surrounds you and your allies with a ward against spells.
Javelin of Lightning|Weapon (javelin)|u||Once a day it becomes a bolt of lightning as you throw it.
Luck Blade|Weapon (any sword)|l|1|+1 to attacks and saving throws, a daily reroll, and it may still hold a wish or two.
Mace of Disruption|Weapon (mace)|r|1|Extra radiant damage to fiends and undead; weakened ones can be destroyed outright, and it sheds light.
Mace of Smiting|Weapon (mace)|r||+1 mace that hits constructs especially hard and can shatter them.
Mace of Terror|Weapon (mace)|r|1|Releases a wave of fear that sends nearby creatures fleeing.
Nine Lives Stealer|Weapon (any sword)|v|1|+2 sword; a critical hit can slay a wounded creature outright, a few times before its power fades.
Oathbow|Weapon (longbow)|v|1|Swear an oath against one foe: advantage and heavy extra damage against them until they fall.
Scimitar of Speed|Weapon (scimitar)|v|1|+2 scimitar; you can attack with it again as a bonus action.
Sun Blade|Weapon (longsword)|r|1|A hilt that grows a blade of sunlight on command; +2 and extra damage to undead.
Sword of Life Stealing|Weapon (any sword)|r|1|Critical hits drain extra life from the living and give it to you.
Sword of Sharpness|Weapon (any slashing sword)|v|1|Cuts through objects with ease, and an exceptional hit can sever a limb.
Sword of Wounding|Weapon (any sword)|r|1|Wounds from it keep bleeding and resist healing.
Trident of Fish Command|Weapon (trident)|u|1|Can charm creatures that swim.
Vicious Weapon|Weapon (any)|r||Critical hits deal a great deal of extra damage.
Vorpal Sword|Weapon (any slashing sword)|l|1|+3 sword that ignores slashing resistance; a natural 20 can take off the target's head.
Arrow of Slaying|Weapon (arrow)|v||Deadly against one kind of creature, then it becomes an ordinary arrow.
Potion of Healing|Potion|c||Restores 2d4 + 2 hit points.
Potion of Greater Healing|Potion|u||Restores 4d4 + 4 hit points.
Potion of Superior Healing|Potion|r||Restores 8d4 + 8 hit points.
Potion of Supreme Healing|Potion|v||Restores 10d4 + 20 hit points.
Potion of Climbing|Potion|c||A climbing speed and advantage on climbing checks for an hour.
Potion of Animal Friendship|Potion|u||Charm beasts for an hour.
Potion of Clairvoyance|Potion|r||See or hear a distant place you know.
Potion of Diminution|Potion|r||Shrink to a fraction of your size for a while.
Potion of Fire Breath|Potion|u||Exhale gouts of fire a few times over the next hour.
Potion of Flying|Potion|v||A flying speed for an hour.
Potion of Gaseous Form|Potion|r||Become a drifting cloud for an hour.
Potion of Giant Strength|Potion|u||Your Strength becomes that of a giant for an hour (the giant type sets how strong).
Potion of Growth|Potion|u||Grow larger and hit harder for a while.
Potion of Heroism|Potion|r||Temporary hit points and the Bless spell's benefit for an hour.
Potion of Invisibility|Potion|v||Invisible for an hour, until you attack or cast a spell.
Potion of Mind Reading|Potion|r||Read surface thoughts as the Detect Thoughts spell.
Potion of Poison|Potion|u||CURSED. Looks, smells and tastes like a healing potion, but poisons whoever drinks it.
Potion of Resistance|Potion|u||Resistance to one damage type for an hour.
Potion of Speed|Potion|v||The Haste spell's benefits for a minute, without the lethargy.
Potion of Water Breathing|Potion|u||Breathe underwater for an hour.
Potion of Invulnerability|Potion|r||Resistance to all damage for a minute.
Potion of Longevity|Potion|v||Makes you younger by years, though each dose risks aging you instead.
Potion of Vitality|Potion|v||Cures exhaustion, disease and poison, and you heal at the maximum for a day.
Elixir of Health|Potion|r||Cures diseases and removes blindness, deafness, paralysis and poison.
Oil of Etherealness|Potion|r||Rub it on to slip into the Ethereal Plane for an hour.
Oil of Sharpness|Potion|v||Turns a weapon or ammunition into a +3 one for an hour.
Oil of Slipperiness|Potion|u||The Freedom of Movement effect for hours, or spread it as a Grease spell.
Philter of Love|Potion|u||The drinker is charmed by the next creature they see for an hour.
Ring of Animal Influence|Ring|r||Charm, frighten or speak with animals using its charges.
Ring of Djinni Summoning|Ring|l|1|Calls a djinni to serve you for a while.
Ring of Elemental Command|Ring|l|1|Command one kind of elemental and gain powers tied to that element.
Ring of Evasion|Ring|r|1|Turn a failed Dexterity save into a success, a few times a day.
Ring of Feather Falling|Ring|r|1|You fall gently and take no falling damage.
Ring of Free Action|Ring|r|1|Difficult terrain, paralysis and restraining magic don't slow you down.
Ring of Invisibility|Ring|l|1|Turn invisible at will.
Ring of Jumping|Ring|u|1|Cast Jump on yourself at will.
Ring of Mind Shielding|Ring|u|1|Your thoughts can't be read, lies can't be detected, and your soul can live in the ring after death.
Ring of Protection|Ring|r|1|+1 to AC and saving throws.
Ring of Regeneration|Ring|v|1|Slowly heal while you wear it, and regrow lost body parts over days.
Ring of Resistance|Ring|r|1|Resistance to one damage type, shown by its gem.
Ring of Shooting Stars|Ring|v|1|Light, faerie fire, ball lightning and falling stars, mostly at night.
Ring of Spell Storing|Ring|r|1|Holds spells that anyone wearing it can cast.
Ring of Spell Turning|Ring|l|1|Advantage on saves against spells, and some spells are reflected back at their caster.
Ring of Swimming|Ring|u||A swimming speed.
Ring of Telekinesis|Ring|v|1|Cast Telekinesis at will on objects.
Ring of the Ram|Ring|r|1|Fire a spectral ram that batters creatures and doors.
Ring of Three Wishes|Ring|l||Holds three castings of Wish.
Ring of Warmth|Ring|u|1|Resistance to cold, and comfortable in freezing weather.
Ring of Water Walking|Ring|u||Walk on liquid as if it were solid ground.
Ring of X-ray Vision|Ring|r|1|See through walls and solid matter for a minute.
Immovable Rod|Rod|u||Press its button and it stays fixed in place, holding up tons.
Rod of Absorption|Rod|v|1|Swallows spells aimed at you and stores their energy for your own casting.
Rod of Alertness|Rod|v|1|Advantage on Perception and initiative, detection spells, and it can be planted to guard your camp.
Rod of Lordly Might|Rod|l|1|A +3 mace that can become a flame sword, an axe, a spear, a ladder and more.
Rod of Rulership|Rod|r|1|Command obedience from everyone nearby for a short time.
Rod of Security|Rod|v||Carries you and companions to a safe, comfortable demiplane for a while.
Rod of Resurrection|Rod|l|by a cleric, druid or paladin|Casts Heal and Resurrection with its charges.
Staff of Charming|Staff|r|by a bard, cleric, druid, sorcerer, warlock or wizard|Charm Person, Command and Comprehend Languages, and it can turn charm back on the caster.
Staff of Fire|Staff|v|by a druid, sorcerer, warlock or wizard|Resistance to fire, and it casts Burning Hands, Fireball and Wall of Fire.
Staff of Frost|Staff|v|by a druid, sorcerer, warlock or wizard|Resistance to cold, and it casts Cone of Cold, Fog Cloud, Ice Storm and Wall of Ice.
Staff of Healing|Staff|r|by a bard, cleric or druid|Casts Cure Wounds, Lesser Restoration and Mass Cure Wounds.
Staff of Power|Staff|v|by a sorcerer, warlock or wizard|+2 staff and bonus to AC and saves that casts a range of battle spells; can be broken for a final explosion.
Staff of Striking|Staff|v|1|+3 quarterstaff that can spend charges for extra damage.
Staff of Swarming Insects|Staff|r|by a bard, cleric, druid, sorcerer, warlock or wizard|Calls up clouds of biting insects and casts Giant Insect and Insect Plague.
Staff of the Magi|Staff|l|by a sorcerer, warlock or wizard|The greatest of wizard staves: spell absorption, a long list of spells and a world-ending retributive strike.
Staff of the Python|Staff|u|by a cleric, druid or warlock|Throw it down and it becomes a giant constrictor snake under your command.
Staff of the Woodlands|Staff|r|by a druid|+2 staff that casts nature spells and can turn into a great tree.
Staff of Thunder and Lightning|Staff|v|1|+2 staff that calls lightning, thunderclaps and a combined storm.
Staff of Withering|Staff|r|by a cleric, druid or warlock|Spend a charge for necrotic damage that can weaken the target.
Wand of Binding|Wand|r|by a spellcaster|Casts Hold Person and Hold Monster, and helps you escape restraints.
Wand of Enemy Detection|Wand|r|1|Points toward the nearest hostile creature.
Wand of Fear|Wand|r|1|Casts Command (flee or grovel) and a cone of terror.
Wand of Fireballs|Wand|r|by a spellcaster|Casts Fireball from its charges.
Wand of Lightning Bolts|Wand|r|by a spellcaster|Casts Lightning Bolt from its charges.
Wand of Magic Detection|Wand|u||Casts Detect Magic.
Wand of Magic Missiles|Wand|u||Casts Magic Missile from its charges.
Wand of Paralysis|Wand|r|by a spellcaster|Fires a ray that paralyzes.
Wand of Polymorph|Wand|v|by a spellcaster|Casts Polymorph.
Wand of Secrets|Wand|u||Points to the nearest secret door or trap.
Wand of the War Mage|Wand|u|by a spellcaster|+1, +2 or +3 to spell attack rolls, and it ignores half cover.
Wand of Web|Wand|u|by a spellcaster|Casts Web.
Wand of Wonder|Wand|r|by a spellcaster|Each use produces a random magical effect, from fireballs to butterflies.
Amulet of Health|Wondrous item|r|1|Your Constitution becomes 19.
Amulet of Proof against Detection and Location|Wondrous item|u|1|Divination magic can't find or see you.
Amulet of the Planes|Wondrous item|v|1|Casts Plane Shift, with a risk of landing somewhere random.
Bag of Beans|Wondrous item|r||Planted beans sprout something unpredictable, from a feast to a monster.
Bag of Devouring|Wondrous item|v||CURSED. Looks like a bag of holding, but it is the mouth of a hungry creature that eats what is put inside and may grab a reaching hand.
Bag of Holding|Wondrous item|u||Holds up to 500 pounds in a space far larger inside than out.
Bag of Tricks|Wondrous item|u||Pull out a fuzzy ball that becomes a random beast fighting for you.
Bead of Force|Wondrous item|r||Throw it to trap creatures in a sphere of force.
Belt of Dwarvenkind|Wondrous item|r|1|+2 Constitution, darkvision, advantage against poison and on dealings with dwarves, and a beard grows.
Belt of Giant Strength|Wondrous item|r|1|Your Strength becomes that of a giant (rarity depends on the giant).
Boots of Elvenkind|Wondrous item|u||Silent steps and advantage on Stealth checks to move quietly.
Boots of Levitation|Wondrous item|r|1|Levitate at will.
Boots of Speed|Wondrous item|r|1|Click your heels to double your speed for a while.
Boots of Striding and Springing|Wondrous item|u|1|Your speed is never reduced by weight, and you can jump three times as far.
Boots of the Winterlands|Wondrous item|u|1|Resistance to cold and no trouble crossing ice and snow.
Bowl of Commanding Water Elementals|Wondrous item|r||Summons a water elemental.
Bracers of Archery|Wondrous item|u|1|Proficiency with bows and extra damage with them.
Bracers of Defense|Wondrous item|r|1|+2 AC when you wear no armor and no shield.
Brazier of Commanding Fire Elementals|Wondrous item|r||Summons a fire elemental.
Brooch of Shielding|Wondrous item|u|1|Resistance to force damage and immunity to Magic Missile.
Broom of Flying|Wondrous item|u||A broom that flies and can come to you when called.
Candle of Invocation|Wondrous item|v|1|Lit, it blesses followers of one alignment and can open a gate to a deity's plane.
Cape of the Mountebank|Wondrous item|r||Cast Dimension Door in a puff of smoke once a day.
Carpet of Flying|Wondrous item|v||A carpet that flies, its speed depending on its size.
Censer of Controlling Air Elementals|Wondrous item|r||Summons an air elemental.
Chime of Opening|Wondrous item|r||Strike it to open locks, lids and doors.
Circlet of Blasting|Wondrous item|u||Casts Scorching Ray once a day.
Cloak of Arachnida|Wondrous item|v|1|Resistance to poison, walk on walls and webs, and cast Web.
Cloak of Displacement|Wondrous item|r|1|You appear to stand somewhere slightly different, so attacks against you have disadvantage.
Cloak of Elvenkind|Wondrous item|u|1|Hood up, you are hard to see and easy to hide.
Cloak of Protection|Wondrous item|u|1|+1 to AC and saving throws.
Cloak of the Bat|Wondrous item|r|1|Fly or turn into a bat in darkness, and hide in dim light.
Cloak of the Manta Ray|Wondrous item|u||Breathe underwater and swim quickly with the hood up.
Crystal Ball|Wondrous item|v|1|Cast Scrying; rarer versions also read minds, hear, or see through walls.
Cube of Force|Wondrous item|r|1|Raise walls of force around yourself that block different things.
Cubic Gate|Wondrous item|l||Each face opens a gate to a different plane.
Decanter of Endless Water|Wondrous item|u||Pours fresh or salt water, from a trickle to a geyser.
Deck of Illusions|Wondrous item|u||Draw a card to create an illusion of a creature.
Deck of Many Things|Wondrous item|l||Draw cards for fate-changing effects, wonderful and terrible.
Dimensional Shackles|Wondrous item|r||Prevents the prisoner from teleporting or planar travel.
Driftglobe|Wondrous item|u||A floating glass ball that sheds light and follows you.
Dust of Disappearance|Wondrous item|u||A pinch makes everyone nearby invisible for a while.
Dust of Dryness|Wondrous item|u||Soaks up a huge amount of water into a pellet you can release later.
Dust of Sneezing and Choking|Wondrous item|u||CURSED. Looks like dust of disappearance, but anyone nearby who breathes it sneezes and chokes helplessly.
Efreeti Bottle|Wondrous item|v||Releases an efreeti that may serve, grant wishes or attack.
Elemental Gem|Wondrous item|u||Break it to summon one elemental, tied to the gem's color.
Eversmoking Bottle|Wondrous item|u||Billows thick smoke that hides an area.
Eyes of Charming|Wondrous item|u|1|Cast Charm Person with your gaze.
Eyes of Minute Seeing|Wondrous item|u||See tiny details clearly; advantage on searching things close up.
Eyes of the Eagle|Wondrous item|u|1|Advantage on Perception checks that rely on sight; see far-off details.
Feather Token|Wondrous item|r||A one-use token: an anchor, bird, fan, swan boat, tree or whip.
Figurine of Wondrous Power|Wondrous item|r||A statuette that becomes a real creature for a while.
Folding Boat|Wondrous item|r||A small box that unfolds into a rowboat or a ship.
Gauntlets of Ogre Power|Wondrous item|u|1|Your Strength becomes 19.
Gem of Brightness|Wondrous item|u||Sheds light and flashes blinding beams.
Gem of Seeing|Wondrous item|r|1|Look through it to see as with truesight.
Gloves of Missile Snaring|Wondrous item|u|1|Catch arrows and other missiles, reducing their damage.
Gloves of Swimming and Climbing|Wondrous item|u|1|Swim and climb at full speed with advantage.
Gloves of Thievery|Wondrous item|u||Invisible while worn; +5 to Sleight of Hand and lockpicking.
Goggles of Night|Wondrous item|u||Darkvision.
Handy Haversack|Wondrous item|r||A backpack with bottomless pouches; what you want is always on top.
Hat of Disguise|Wondrous item|u|1|Cast Disguise Self at will.
Headband of Intellect|Wondrous item|u|1|Your Intelligence becomes 19.
Helm of Brilliance|Wondrous item|v|1|Set with gems that cast fiery spells and protect you from fire.
Helm of Comprehending Languages|Wondrous item|u||Cast Comprehend Languages at will.
Helm of Telepathy|Wondrous item|u|1|Read thoughts and send telepathic messages.
Helm of Teleportation|Wondrous item|r|1|Cast Teleport a few times.
Horn of Blasting|Wondrous item|r||A blast of thunder that deafens and shatters, with a risk of exploding.
Horn of Valhalla|Wondrous item|r||Summons spirit warriors to fight for you.
Horseshoes of a Zephyr|Wondrous item|v||The horse glides above the ground and never tires.
Horseshoes of Speed|Wondrous item|r||The horse moves much faster.
Instant Fortress|Wondrous item|r||A tiny cube that grows into a stone tower.
Ioun Stone|Wondrous item|r|1|A stone that orbits your head and grants a specific boon.
Iron Bands|Wondrous item|r||Throw the iron sphere and it binds a creature in bands.
Iron Flask|Wondrous item|l||Traps an extraplanar creature, which can later be released to serve.
Lantern of Revealing|Wondrous item|u||Its light reveals invisible creatures and objects.
Mantle of Spell Resistance|Wondrous item|r|1|Advantage on saves against spells.
Manual of Bodily Health|Wondrous item|v||Study it for days to raise your Constitution permanently.
Manual of Gainful Exercise|Wondrous item|v||Study it for days to raise your Strength permanently.
Manual of Golems|Wondrous item|v||Instructions for building a golem.
Manual of Quickness of Action|Wondrous item|v||Study it for days to raise your Dexterity permanently.
Marvelous Pigments|Wondrous item|v||Whatever you paint with them becomes real.
Medallion of Thoughts|Wondrous item|u|1|Cast Detect Thoughts.
Mirror of Life Trapping|Wondrous item|v||Traps creatures that see their reflection in it.
Necklace of Adaptation|Wondrous item|u|1|Breathe normally anywhere, and advantage against harmful gases.
Necklace of Fireballs|Wondrous item|r||Beads you can throw as fireballs.
Necklace of Prayer Beads|Wondrous item|r|by a cleric, druid or paladin|Beads that cast blessings, healing and more.
Pearl of Power|Wondrous item|u|by a spellcaster|Regain a spent spell slot once a day.
Periapt of Health|Wondrous item|u||Immunity to disease.
Periapt of Proof against Poison|Wondrous item|r||Immunity to poison.
Periapt of Wound Closure|Wondrous item|u|1|You stabilize automatically and heal more from Hit Dice.
Pipes of Haunting|Wondrous item|u||Play them to frighten those who hear.
Pipes of the Sewers|Wondrous item|u|1|Summon and command rats.
Portable Hole|Wondrous item|r||Unfolds into an extradimensional hole 10 feet deep.
Robe of Eyes|Wondrous item|r|1|See in all directions, into the dark and the invisible.
Robe of Scintillating Colors|Wondrous item|v|1|Dazzling colors that stun onlookers.
Robe of Stars|Wondrous item|v|1|+1 to saves, Magic Missile from its stars, and travel to the Astral Plane.
Robe of the Archmagi|Wondrous item|l|by a sorcerer, warlock or wizard|A great boost to AC, spell saves and spell power.
Robe of Useful Items|Wondrous item|u||Patches you pull off become real objects.
Rope of Climbing|Wondrous item|u||A rope that moves and ties itself on command.
Rope of Entanglement|Wondrous item|r||Lash out to restrain a creature.
Scarab of Protection|Wondrous item|l|1|Advantage against spells and protection from necromancy.
Slippers of Spider Climbing|Wondrous item|u|1|Walk on walls and ceilings.
Sovereign Glue|Wondrous item|l||Bonds any two objects permanently.
Sphere of Annihilation|Wondrous item|l||A sphere of nothing that destroys everything it touches.
Stone of Controlling Earth Elementals|Wondrous item|r||Summons an earth elemental.
Stone of Good Luck|Wondrous item|u|1|+1 to ability checks and saving throws.
Talisman of Pure Good|Wondrous item|l|by a good creature|Lets a good cleric smite evil foes into a pit of fire.
Talisman of the Sphere|Wondrous item|l|1|Helps you control a sphere of annihilation.
Talisman of Ultimate Evil|Wondrous item|l|by an evil creature|Lets an evil caster destroy good foes outright.
Tome of Clear Thought|Wondrous item|v||Study it for days to raise your Intelligence permanently.
Tome of Leadership and Influence|Wondrous item|v||Study it for days to raise your Charisma permanently.
Tome of Understanding|Wondrous item|v||Study it for days to raise your Wisdom permanently.
Universal Solvent|Wondrous item|l||Dissolves any adhesive, even sovereign glue.
Well of Many Worlds|Wondrous item|l||A cloth that opens into a portal to another world.
Wind Fan|Wondrous item|u||Casts Gust of Wind, with a risk of tearing.
Winged Boots|Wondrous item|u|1|Fly for a few hours a day.
Wings of Flying|Wondrous item|r|1|Grow wings and fly for an hour.
Alchemy Jug|Wondrous item|u||Pours a different liquid each day: water, ale, oil, honey and more.
Cap of Water Breathing|Wondrous item|u||Creates a bubble of air around your head underwater.
Spell Scroll (cantrip)|Scroll|c||A single use of one cantrip.
Spell Scroll (1st level)|Scroll|c||A single use of one 1st-level spell.
Spell Scroll (2nd level)|Scroll|u||A single use of one 2nd-level spell.
Spell Scroll (3rd level)|Scroll|u||A single use of one 3rd-level spell.
Spell Scroll (4th level)|Scroll|r||A single use of one 4th-level spell.
Spell Scroll (5th level)|Scroll|r||A single use of one 5th-level spell.
Spell Scroll (6th level)|Scroll|v||A single use of one 6th-level spell.
Spell Scroll (7th level)|Scroll|v||A single use of one 7th-level spell.
Spell Scroll (8th level)|Scroll|v||A single use of one 8th-level spell.
Spell Scroll (9th level)|Scroll|l||A single use of one 9th-level spell.
`;

function parse() {
  const items = ROWS.trim().split('\n').map((line) => {
    const [name, type, r, att, summary] = line.split('|');
    const cursed = summary.startsWith('CURSED.');
    return { name, type, rarity: r, attunement: att === '1' ? 'Requires attunement' : att ? `Requires attunement ${att}` : '', summary: cursed ? summary.slice(8) : summary, cursed };
  });
  // The +1/+2/+3 families.
  for (const [n, rar] of [[1, 'u'], [2, 'r'], [3, 'v']]) {
    items.push({ name: `Weapon, +${n}`, type: 'Weapon (any)', rarity: rar, attunement: '', summary: `+${n} to attack and damage rolls.` });
    items.push({ name: `Armor, +${n}`, type: 'Armor (light, medium or heavy)', rarity: { u: 'r', r: 'v', v: 'l' }[rar], attunement: '', summary: `+${n} to AC beyond the armor's normal protection.` });
    items.push({ name: `Shield, +${n}`, type: 'Armor (shield)', rarity: rar, attunement: '', summary: `+${n} to AC beyond the shield's normal bonus.` });
    items.push({ name: `Ammunition, +${n}`, type: 'Weapon (any ammunition)', rarity: { u: 'u', r: 'r', v: 'v' }[rar], attunement: '', summary: `+${n} to attack and damage; it's spent once it hits.` });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}
export const MAGIC_ITEMS = parse();
export const ITEM_TYPES = ['Armor', 'Weapon', 'Potion', 'Ring', 'Rod', 'Scroll', 'Staff', 'Wand', 'Wondrous item'];
export const baseType = (t) => ITEM_TYPES.find((x) => t.startsWith(x)) || 'Wondrous item';

const WEAPONS = ['Longsword', 'Shortsword', 'Greatsword', 'Rapier', 'Scimitar', 'Dagger', 'Handaxe', 'Battleaxe', 'Greataxe', 'Warhammer', 'Mace', 'Spear', 'Longbow', 'Shortbow', 'Light Crossbow', 'Quarterstaff', 'Flail', 'Glaive'];
const ARMORS = ['Leather', 'Studded Leather', 'Chain Shirt', 'Breastplate', 'Half Plate', 'Chain Mail', 'Splint', 'Plate'];

// A specific item from a catalog entry: "+1 Longsword" instead of "Weapon, +1", a dragon color for scale mail, etc.
export function concrete(item, rng) {
  let name = item.name;
  const m = name.match(/^(Weapon|Armor|Shield|Ammunition), \+(\d)$/);
  if (m) name = `+${m[2]} ${m[1] === 'Weapon' ? rng.pick(WEAPONS) : m[1] === 'Armor' ? rng.pick(ARMORS) : m[1] === 'Shield' ? 'Shield' : rng.pick(['Arrows', 'Crossbow Bolts', 'Sling Bullets'])}`;
  else if (/any sword/.test(item.type) && !/Luck|Holy|Defender/.test(name)) name = `${name} (${rng.pick(['Longsword', 'Shortsword', 'Rapier', 'Scimitar', 'Greatsword'])})`;
  else if (name === 'Wand of the War Mage') name = `Wand of the War Mage, +${{ u: 1, r: 2, v: 3 }[item.rarity] || 1}`;
  else if (name === 'Dragon Scale Mail') name = `${rng.pick(['Red', 'Blue', 'Green', 'Black', 'White', 'Gold', 'Silver', 'Bronze', 'Brass', 'Copper'])} Dragon Scale Mail`;
  else if (name === 'Potion of Giant Strength') name = `Potion of ${rng.pick(['Hill', 'Frost', 'Stone', 'Fire'])} Giant Strength`;
  else if (name === 'Belt of Giant Strength') name = `Belt of ${rng.pick(['Hill', 'Frost', 'Stone', 'Fire'])} Giant Strength`;
  else if (name === 'Ioun Stone') name = `Ioun Stone (${rng.pick(['Awareness', 'Protection', 'Reserve', 'Sustenance', 'Absorption', 'Agility', 'Fortitude', 'Insight', 'Intellect', 'Leadership', 'Strength'])})`;
  else if (name === 'Figurine of Wondrous Power') name = `Figurine of Wondrous Power (${rng.pick(['Bronze Griffon', 'Ebony Fly', 'Golden Lions', 'Ivory Goats', 'Marble Elephant', 'Onyx Dog', 'Serpentine Owl', 'Silver Raven'])})`;
  else if (/^Armor of Resistance|^Ring of Resistance|^Potion of Resistance/.test(name)) name = `${name} (${rng.pick(['acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'])})`;
  const [lo, hi] = RARITY_VALUE[item.rarity];
  const value = Math.round((lo + rng.next() * (hi - lo)) / (item.type === 'Potion' || item.type === 'Scroll' ? 2 : 1) / 10) * 10;
  return { ...item, name, value };
}

// Items from the open world's library (set by the world store), mixed into every roll.
let libraryItems = () => [];
export const setLibraryItems = (fn) => { libraryItems = fn; };

export function randomItem(rng, { rarity, type, cursed } = {}) {
  const fits = (i) => (!rarity || i.rarity === rarity) && (!type || baseType(i.type) === type) && (cursed == null || i.cursed === cursed);
  // A handful of your own items would be lost among the catalog, so they get about a third of the rolls they fit.
  const mine = libraryItems().filter(fits);
  if (mine.length && rng.chance(0.35)) return concrete(rng.pick(mine), rng);
  const pool = [...MAGIC_ITEMS, ...mine].filter(fits);
  return pool.length ? concrete(rng.pick(pool), rng) : null;
}

// ---- curses ------------------------------------------------------------------------------------

export const CURSES = [
  { name: 'Bound', effect: 'Once attuned, the owner can’t end the attunement or bear to leave the item behind; it turns up in their pack even when thrown away.', reveal: 'The first time they try to sell, gift or discard it.', cure: 'Remove Curse, then a sincere act of letting go.' },
  { name: 'Bloodthirst', effect: 'When the wielder is hurt, they must succeed on a DC 15 Wisdom save or attack the nearest creature, friend or foe, until it drops.', reveal: 'The first time they’re badly wounded in a fight.', cure: 'Remove Curse, or bathing the item in holy water at a temple of a war god.' },
  { name: 'Lure', effect: 'Ranged attacks and harmful spells aimed at anyone near the owner swerve toward the owner instead.', reveal: 'The first battle with archers or spellcasters.', cure: 'Remove Curse, or breaking the item on an anvil of cold iron.' },
  { name: 'Weakness', effect: 'The owner has vulnerability to one damage type (fire, cold or necrotic).', reveal: 'The first time they take that damage.', cure: 'Greater Restoration, or a pilgrimage to where the item was made.' },
  { name: 'Misfortune', effect: 'Once per day the GM can turn one of the owner’s rolls of 10 or higher into a 1.', reveal: 'The first crucial failed roll.', cure: 'Remove Curse cast by a priest of a luck god, or giving the item to someone who knowingly accepts the curse.' },
  { name: 'Whispers', effect: 'The item mutters to its owner at night. Each long rest, DC 12 Wisdom save or gain no benefit from the rest.', reveal: 'The first night after attunement.', cure: 'Remove Curse, then silencing the voice by learning its true name.' },
  { name: 'Greed', effect: 'The owner becomes covetous: DC 13 Wisdom save to share treasure, and an urge to pocket valuables.', reveal: 'The first time loot is divided.', cure: 'Remove Curse, or giving away half of everything they own.' },
  { name: 'Hunted', effect: 'The item’s previous owner (a ghost, a cult or a fiend) can always sense where it is and is coming to take it back.', reveal: 'Signs of pursuit after a few days: tracks, watchers, dreams.', cure: 'Returning the item, or laying the previous owner to rest.' },
  { name: 'Withering', effect: 'Each dawn the owner’s hit point maximum drops by 1 until the curse ends; it returns after a week without the item.', reveal: 'When they notice their scars aren’t healing.', cure: 'Remove Curse followed by Greater Restoration.' },
  { name: 'Truth-bound', effect: 'The owner can’t knowingly speak a lie while carrying the item, and often blurts out secrets.', reveal: 'The first time they try to bluff.', cure: 'Remove Curse, or confessing their worst secret aloud.' },
  { name: 'Beacon', effect: 'The item glows faintly in darkness and can’t be hidden. Undead within a mile sense it.', reveal: 'The first night in a graveyard, crypt or haunted place.', cure: 'Remove Curse, then a night spent in consecrated ground.' },
  { name: 'Burden', effect: 'The item weighs ten times what it should for its owner alone; others lift it easily.', reveal: 'The first long walk.', cure: 'Remove Curse, or carrying it up a mountain and leaving it at the summit.' },
  { name: 'Hunger', effect: 'The owner must eat twice as much or gain a level of exhaustion each day.', reveal: 'The first day on half rations.', cure: 'Remove Curse, or feeding the item a rare meal described in an old recipe.' },
  { name: 'Mirror-curse', effect: 'Reflections show the owner as a monster. Animals and children grow uneasy around them.', reveal: 'The first mirror or still pond.', cure: 'Remove Curse, or breaking a mirror made from the same silver.' },
  { name: 'Treachery', effect: 'When the owner rolls a natural 1 on an attack, the item strikes the nearest ally instead.', reveal: 'The first natural 1 in combat.', cure: 'Remove Curse, then winning a duel against the item’s maker’s heir.' },
  { name: 'Possession', effect: 'A spirit in the item can try to take control (DC 14 Charisma save) when the owner is asleep or unconscious.', reveal: 'The owner wakes somewhere they didn’t fall asleep.', cure: 'Dispel Evil and Good, or helping the spirit finish what it left undone.' },
  { name: 'Fading magic', effect: 'Each time the owner casts a spell, roll a d20; on a 1 the slot is spent but nothing happens.', reveal: 'The first fizzled spell.', cure: 'Remove Curse, or a wizard spending a week unpicking the enchantment.' },
  { name: 'Unlucky in love', effect: 'Anyone the owner tries to charm or persuade is put off: disadvantage on Persuasion with them.', reveal: 'The first important negotiation.', cure: 'Remove Curse, or a true kiss given knowingly.' },
];

export const curseText = (c) => `CURSE: ${c.name}. ${c.effect}\nRevealed: ${c.reveal}\nBroken by: ${c.cure}`;

// ---- unique item maker ---------------------------------------------------------------------------

const FORMS = { Weapon: ['blade', 'axe', 'spear', 'bow', 'hammer', 'dagger', 'staff'], Armor: ['shield', 'breastplate', 'mail shirt', 'helm', 'gauntlets'], Ring: ['ring', 'signet ring', 'band'], Wondrous: ['amulet', 'cloak', 'lantern', 'mask', 'book', 'compass', 'bell', 'mirror', 'crown', 'boots', 'brooch', 'orb', 'quill', 'flute', 'cup'] };
const MATERIALS = ['blackened silver', 'bone-white ivory', 'dragon-scale', 'smoky glass', 'meteoric iron', 'living wood', 'cold blue steel', 'red-gold', 'obsidian', 'pearl and coral', 'riveted bronze', 'moon-pale mithral', 'stitched leather', 'carved jade'];
const MARKS = ['runes that shift when no one is watching', 'a weeping eye engraved on it', 'a serpent coiled around it', 'a hairline crack that glows faintly', 'a maker’s mark from a city that no longer exists', 'tiny stars inlaid along its length', 'a lock of hair braided around it', 'scorch marks that won’t clean off', 'an inscription in a dead language', 'feathers and beads tied to it'];
const NAME_A = ['Ember', 'Whisper', 'Dawn', 'Grave', 'Storm', 'Thorn', 'Moon', 'Ash', 'Frost', 'Gloom', 'Star', 'Iron', 'Widow’s', 'King’s', 'Hollow'];
const NAME_B = ['fang', 'song', 'ward', 'call', 'heart', 'bite', 'veil', 'light', 'reach', 'oath', 'mourn', 'tide', 'mark', 'crown'];
export const MINOR_PROPERTIES = ['It glows dimly when orcs or goblins are within 120 feet.', 'It is always comfortably warm to the touch.', 'It hums a few notes of a lullaby when danger is near.', 'It never gets dirty and never rusts.', 'Its owner always knows which way is north.', 'Whoever holds it can speak and understand one extra language.', 'It can’t be lost for long: it turns up within a day.', 'It whispers the name of the last person who held it.', 'Candles nearby burn blue when it is drawn.', 'Animals are calm and friendly around it.', 'Its owner never gets drunk.', 'It feels lighter the longer you carry it.'];
const QUIRKS = ['It is vain and wants to be polished daily.', 'It prefers to be used by the brave and sulks when its owner flees.', 'It makes its owner crave sweets.', 'Its owner dreams of the sea every night.', 'It refuses to work on holy days.', 'It makes its owner superstitious about the number 7.', 'It gets cold and sluggish in the rain.', 'Its owner hears faint laughter after every lie they tell.'];
const HISTORIES = ['Forged for a queen’s champion who died defending a bridge.', 'Pulled from a dragon’s hoard and traded three times since.', 'Made by a wizard as an apology to a rival, who never accepted it.', 'Buried with a hero, and stolen by grave robbers last spring.', 'Carried by a smuggler who swore it brought him luck, until it didn’t.', 'Blessed in a temple that has since been burned.', 'Won in a card game with a devil, who wants it back.', 'Part of a set of three; the other two are lost.', 'Made by elves for a human friend, as a sign of a broken treaty.', 'Recovered from a shipwreck, and still smells of the sea.'];

export function uniqueItem(rng, { rarity = 'u', cursed = false, base } = {}) {
  const b = base || randomItem(rng, { rarity, cursed: false }) || randomItem(rng, {});
  const t = baseType(b.type);
  const form = rng.pick(FORMS[t] || FORMS.Wondrous);
  const name = `${rng.pick(NAME_A)}${rng.pick(NAME_B)}`;
  const curse = cursed ? rng.pick(CURSES) : null;
  return {
    name: `${name}, the ${form[0].toUpperCase()}${form.slice(1)}`, baseName: b.name, type: b.type, rarity: b.rarity, attunement: b.attunement || (curse ? 'Requires attunement' : ''),
    appearance: `${/^[aeiou]/.test(form) ? 'An' : 'A'} ${form} of ${rng.pick(MATERIALS)} with ${rng.pick(MARKS)}.`,
    property: `${b.summary} (Works as ${b.name}.)`, minor: rng.pick(MINOR_PROPERTIES), quirk: rng.pick(QUIRKS), history: rng.pick(HISTORIES), curse, value: b.value,
  };
}

// A world Item entry for any item, curse in the GM-only secret.
export function itemEntry(it, parent) {
  return {
    kind: 'item', name: it.name, parent_id: parent?.id || null,
    summary: `${RARITIES[it.rarity]} ${it.type.toLowerCase()}${it.attunement ? ` (${it.attunement.toLowerCase()})` : ''}. ${it.appearance || ''}`.trim(),
    fields: { rarity: RARITIES[it.rarity], type: it.type, attunement: it.attunement || 'No', properties: [it.property || it.summary, it.minor].filter(Boolean).join('\n\n'), history: [it.history, it.quirk && `Quirk: ${it.quirk}`].filter(Boolean).join('\n\n'), value: it.value ? `${it.value.toLocaleString('en-US')} gp` : '' },
    secret: it.curse ? curseText(it.curse) : it.cursed ? `CURSED: ${it.summary}` : '', tags: it.curse || it.cursed ? ['cursed', 'magic-item'] : ['magic-item'],
  };
}
