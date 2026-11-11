# DM's Satchel roadmap

The goal: a world-building home for a group of friends. One or several GMs, several worlds, and players who can
read what's been revealed and add their own characters, journals and notes. Everything saved and shared.

Work through the list top to bottom. Each item is shipped on its own: build, test in a browser (with the mock
server pattern from earlier smoke tests), commit, push, check the Vercel deploy, then tick it here and add a line
to the log at the bottom.

## Now

1. [x] **NPC stat blocks and spellcasting.** Every NPC gets AC, HP, abilities, saves, skills, attack, senses and
   features; casters get save DC, attack, spell slots (clickable pips, long-rest reset) and spells by level.
   Role sets class and level (hedge wizard: wizard 2–4, high priest: cleric 7–11…). "Roll stats" on any NPC
   page with class and level pickers. Character Forge shows its full spellbook the same way.
   Files: js/spells.js (done), js/npc-stats.js, js/statblock-ui.js; world-schema npc fields level/stats/spells.
2. [x] **Magic items and curses.** A full SRD magic item catalog in js/magic-items.js: name, rarity, type,
   attunement (and by whom), and a short original summary of what it does. Cursed items from the SRD flagged with
   their curse. A curse generator that can curse any item (bound to the user, penalties, compulsions, attracts
   things, slowly corrupts…) with a hidden reveal condition and a way to break it. A unique item maker: name,
   appearance, property, minor quirk, history and optional curse. Reference tab with filters (rarity, type,
   attunement, cursed). Loot, quest rewards, shops and the world's Item entries all draw on it; a cursed item's
   curse goes in the GM-only secret.
3. [x] **Shops and economy.** Shop inventories from real 5e gear at SRD prices, with quantity in stock.
   Settlements get an economy (Booming, Stable, Struggling, Besieged…), inflation %, and market conditions per
   goods category: shortage (price ×1.5–3, few or none in stock), surplus (discount, plenty), embargo, festival.
   A market event explains why ("the mines flooded, iron is scarce"). Haggling DC, buy-back at half price,
   restock button, special stock (rare or magic items by town size and shop type). Shops inherit their town's
   economy. Works in Table Tools, on town pages (Market tab) and on shop entries.
4. [x] **Hidden entries (GM prep).** Per-entry visibility: Everyone or GMs only. Hidden entries never reach
   players (filter in API). "Reveal to players" button, with a log line. Hidden maps and pins already exist.
5. [x] **Multiple worlds.** worlds table; entries, maps, standings, comments, history scoped by world_id. Migrate
   existing rows to a first world. World switcher in the header, world list page, create world, world settings
   per world. URLs include the world (?w=<slug>).
6. [x] **Accounts, roles and players.** People (gms table) can belong to many worlds with a role per world:
   owner, GM, player. Per-world invite links/codes that create an account or add a membership. The site admin
   (ADMIN_CODE) can see everything. Players read revealed content, and can create and edit their own entries
   (characters, journal entries, notes), suggest edits/new entries (GM approves), and comment on quests.
7. [x] **Party page.** Party members and their characters, shared treasure and loot log (gold in/out, items),
   party journal (players and GMs post), handouts the GM reveals (text and images), current quests.
8. [x] **Player character sheets.** Characters from the Forge saved to the world and owned by a player:
   current HP, conditions, spell slots used, inventory, gold, notes, level-up. Players edit their own.
9. [x] **Live updates.** Poll for changes every ~20 s while a world page is open; "Ana edited Ashford" toasts,
   refresh lists without losing form input. Edit conflicts already handled.
10. [x] **Images.** Portraits for NPCs and characters, pictures for places and items, handout images. Vercel Blob
   store (create via MCP, connect to project), or small data URLs in Postgres as a fallback.
11. [x] **In-world calendar.** Named months, current date, events and sessions placed on it, "days pass" button,
    moon phases optional. Timeline view of events by date.
12. [x] **Encounters and travel helpers per area.** Random encounter table per area (built from its danger
    fields and SRD monsters), weather by season, travel time between pinned places on a map (scale setting).
13. [x] **Dungeon and lair generator.** Room-by-room keyed dungeon with traps, monsters and loot, saved as a
    location with child rooms.
14. [x] **Export and print.** World or region to Markdown/PDF-friendly print page; player-safe export.
15. [x] **Offline and install.** Service worker caching the app shell so tools work offline; installable PWA.
16. [x] **Polish pass.** Empty states, onboarding tour for new GMs and players, keyboard shortcuts, accessibility
    audit, performance with 2,000+ entries.

17. [x] **Faction clocks.** Progress clocks (4/6/8/12 segments) on factions and any other entry: what they're
    working toward, filled between sessions. A "faction turn" advances every clock that ticks each turn. Secret
    clocks for GMs; public ones players can see.
18. [x] **Rumor mill.** Rumors attached to towns that spread to linked and nearby towns over time, getting
    distorted as they go; players see the rumors in the towns they've visited.
19. [x] **Family trees.** Parent/child/spouse links between NPCs and characters drawn as a tree for each clan.
20. [x] **What my character knows.** A player view per character: entries they've met or been told about.
21. [x] **Discord recaps.** Post session summaries and handouts to a Discord channel via a webhook.

22. [x] **Player comments.** Players can comment on quests, handouts, rumors and their own entries (separate from
    the GM-only discussions), with GMs able to reply and hide comments.
23. [x] **Session prep page.** One GM page for next session: active quests, clocks close to finishing, rumors in
    the party's current town, upcoming calendar events, NPCs nearby, and a scratch pad.
24. [x] **Faction relationship matrix.** Every faction against every other: ally, rival, war, trade, at a glance,
    editable in place (writes the same connections the web uses).
26. [x] **Your library.** Short summaries from the group's own books: Creature kind (bestiary) and Rules option kind
    (class, subclass, species, background, feat, spell), plus source and D&D Beyond link on items.
27. [x] **Library in the Character Forge.** Pick subclasses and species from the library; their features show on
    the sheet.
25. [x] **Import.** Bring in Markdown notes (one file per entry, or an Obsidian-style folder) and the exported
    Markdown from this app.

28. [x] **Library classes.** A structured form for whole classes from your books (hit die, proficiencies, saving
    throws, features by level, spellcasting if any) so the Character Forge can build them, not just show notes.
29. [x] **Library spells in spellbooks.** Spells added to the library join the right classes' spell lists in the
    Forge, NPC spellcasting and the Spells reference.

30. [x] **Library backgrounds and feats in the Forge.** Backgrounds from your books (three abilities, two skills, a
    tool, an origin feat, gear) can be picked or rolled in the Character Forge; library feats join the origin and
    general feat pools.
31. [x] **Next-session scheduler.** A GM proposes a few dates; everyone in the world marks yes / maybe / no; the
    best date is highlighted, can be locked in (it shows on the world home and calendar) and posted to Discord.
32. [x] **Downtime between sessions.** Players file what their character does between sessions (train, craft,
    carouse, research, work); GMs resolve each with a short outcome that the player sees, and it lands in the
    character's history.
33. [x] **Fog of war on maps.** GMs paint hidden areas over a map; players see only what's been revealed, and GMs
    reveal more as the party explores.

34. [x] **Session recap drafts.** One click drafts the next session-log entry from what changed since the last one
    (entries revealed or edited, quests moved, downtime resolved, party ledger lines, clocks advanced); the GM edits
    it, saves it as a session and can post it to Discord.
35. [x] **Show a handout to the table.** A GM pushes a handout (or any entry's picture) to everyone who has the world
    open; it pops up on their screen and stays in their party page.
36. [x] **Split the loot.** From the party treasury, split coin evenly (or by shares) between active characters;
    each share lands in that character's sheet coin and in the ledger.
37. [x] **How each character stands with NPCs.** A per-character attitude (friendly, wary, hostile…) toward key
    NPCs and factions, set by GMs, shown on both pages and in session prep.

38. [x] **Private notes on any entry.** Each person can keep their own notes on an NPC, place or quest that only
    they see ("I think she's lying"), listed together on their My things page.
39. [x] **Quest objectives.** A checklist of steps on each quest (some hidden until revealed); ticking them shows
    progress on the quest board and the party page.
40. [x] **What's new since you were last here.** On opening a world, a short list of what changed since your last
    visit (new and revealed entries, resolved downtime, session logs, handouts), for players and GMs.
41. [x] **Printable session sheet.** One page for the table from session prep: where the party is, local NPCs with
    roles and attitudes, jobs, rumors, today's weather and a rolled encounter, ready to print.

42. [x] **Attendance and XP.** Each session log records who came; XP or milestones add up per character, and the
    party page shows who's due a level (and the Forge level-up is one click away).
43. [x] **Reveal a place and everything in it.** One GM action reveals a place with the people, rooms, items and
    quests inside it (with a preview and a choice of what to include).
44. [x] **Items in inventories.** Lines in a character's inventory that name a world or library item link to it, and
    magic items show what they do right on the sheet.
45. [x] **Quick journal note from anywhere.** Players can jot a journal note from any page (linked to the page they're
    on) without leaving it.

46. [x] **Your own roll tables.** GMs (and players) write custom tables ("Tavern patrons", "Weird weather", "What's in
    the barrel") with optional weights, roll them anywhere, and send a result to the world.
47. [x] **Search filters.** Narrow world search by kind, tag, place it's in, and (for GMs) hidden or suggested only.
48. [x] **Entry templates.** GMs save an entry as a template ("Roadside inn", "Cult cell") and start new entries from
    it, fields and text filled in.
49. [x] **Your own map markers.** Players drop private markers with notes on any map ("we camped here"), seen only by
    them, alongside the GM's pins.

50. [x] **Restore an earlier version.** An entry's history shows what changed in each edit, and GMs can put an entry
    back the way it was at any point (saved as a new edit, so nothing is lost).
51. [x] **NPC table cards.** A compact card per NPC (voice, manner, wants, what they know, a stat line) to print as a
    set for the people the party is likely to meet, from session prep or a place.
52. [x] **Saved encounters.** Keep an encounter you rolled or built, attach it to a place or quest, and find it again
    in session prep when the party gets there.
53. [x] **Party bonds.** How the player characters are tied to each other (siblings, rivals, owes a debt…), set by
    players for their own characters, shown on the party page and character pages.

54. [x] **Phone pass.** Check every page added since the last phone review at phone width (no sideways scrolling,
    tap targets, dialogs that fit), and fix what's off.
55. [x] **What needs writing.** A GM page that finds thin spots: entries with no summary, places with nobody in
    them, NPCs with no voice or wants, quests with no objectives, hidden entries never revealed.
56. [x] **Sessions on the in-world calendar.** Session logs with an in-world date show on the calendar, so the
    world's timeline and the table's history line up.
57. [x] **Faster first load.** Load the rarely used pages and tools only when they're opened, so the site starts
    faster on phones.

58. [x] **Link suggestions while writing.** Typing [[ in any text box suggests entry names as you type; picking one
    finishes the link.
59. [x] **Bulk actions.** On entry lists and search results GMs can tick several entries and reveal, hide, tag or move
    them into a place at once.
60. [x] **Your own fields.** GMs add extra fields to a kind for this world (say "Deity" on NPCs or "Danger level" on
    locations); they show on the form and the page like built-in ones.
61. [x] **Session zero page.** A world primer every member sees when they join: tone, house rules, and safety tools
    (lines and veils), with players able to add their own lines and veils privately for the GMs.
62. [x] **Secrets and clues.** In session prep GMs keep a list of secrets the party could discover, each tied to
    entries; tick one off when it's found out, and the unrevealed ones carry over to the next session.
63. [x] **Spotlight tracker.** Session prep shows which player characters have had the least attention lately (from
    attendance and mentions in recent session logs), with their goals, so every player gets a turn.
64. [x] **Character goals.** Players write their character's goals (short, long, secret-from-the-party); GMs see them on
    the character page, in session prep and on the spotlight tracker, and can mark them advanced or done.
65. [x] **Link the mentions.** On any entry, GMs see plain-text mentions of other entries' names that aren't linked yet
    and can turn them into [[links]] one by one or all at once.
66. [x] **Make a copy.** GMs duplicate any entry (another tavern like this one, a second bandit captain) and land in
    the edit form with the copy, named "… (copy)".
67. [x] **Your favorites.** Everyone stars the entries they keep going back to; starred entries sit at the top of the
    world sidebar, for that person only.
68. [x] **The party on the map.** Where the party is (from session prep) shows as a marker on every map that has that
    place pinned, for players too; GMs can set it from the map.
69. [x] **See it as a player.** A GM switch that shows the world the way players see it (no hidden entries, secrets,
    suggestions or GM-only fields) to check what's been revealed, with a banner and one click back.
70. [x] **Quest rewards to the treasury.** Marking a quest Completed offers to add its reward to the party treasury
    (coin and items parsed from the reward text), logged against the quest and the current session.
71. [x] **Who shows up where.** NPC pages list the sessions they appeared in and when they were last seen; session
    prep lists recurring NPCs tied to where the party is who haven't appeared for a while.
72. [x] **Light, dark or automatic.** A theme switch in the header (the styles already support both), remembered on
    this device.
73. [x] **Member profiles.** Each member sets their pronouns and a short note for the table (availability, what
    they enjoy); shown on the party page, member lists and session zero answers.
74. [x] **Notices from the GMs.** A GM posts a short notice ("No game this Friday", "Level up before next session") that
    shows on the world's front page and as a banner for every member until they dismiss it or it expires.
75. [x] **Import from a spreadsheet.** GMs paste or upload a CSV (a list of NPCs, items, places) and map its columns to
    entry fields, with a preview before anything is created.
76. [x] **More than one picture.** Entries can hold a small gallery (a town from different angles, a handout's pages)
    besides the main picture, with a viewer.
77. [x] **Search the talk.** Search finds words in table talk and (for GMs) GM discussions too, linking to the
    comment on its entry.
78. [x] **Handouts for one player.** A GM gives a handout (or any entry) to chosen players only: a letter only the
    rogue found, a vision for the cleric. Everyone else, other players included, can't see it until it's revealed.
79. [x] **Suggest an edit.** Players propose changes to an existing entry (a correction, what they learned); GMs see
    the difference and accept or turn it down.
80. [x] **Hand it over.** On a character's sheet, give an item (and some coin) to another party member in one step,
    noted on both sheets.
81. [x] **Print a character.** A clean printable page for a world character, built from their saved sheet and play
    state, for players who like paper at the table.
82. [x] **Is that name taken?** While writing a new entry's name, the form says if the world already has one with that
    name (or a close one), with a link, so nobody makes a second Brindle.
83. [x] **Quick polls.** Anyone at the table asks a quick question ("Where do we go next?") with a few choices; members
    vote, everyone sees the tally, and the asker closes it.
84. [x] **Measure on the map.** A ruler on any map with a scale: click points to measure a route in miles, with travel
    time at each pace.
85. [x] **Keep going offline.** Changes to your character sheet and notes made without a connection are kept and sent
    when it comes back, with a clear "waiting to send" marker.
86. [x] **Time of day and light.** During play the GM moves the clock on (10 minutes, an hour, a short rest) and
    tracks torches, lanterns and spells with durations; everyone sees the hour and what's about to go out.
87. [x] **Start here.** GMs pick a handful of entries new players should read first (the home town, the patron, the
    big threat); they show on the front page and the session zero page for newcomers.
88. [x] **Notices and polls to Discord.** When the world has a Discord channel, posting a notice or a poll can go to
    the channel too, with a link back.
89. [x] **Tag pages.** Every tag gets a page listing what's tagged, with a short description GMs can write, and a list
    of all tags with counts.
90. [x] **Phone and accessibility pass.** Check every page and dialog added since the last pass (58 onwards) at phone
    width as a GM and as a player, with the accessibility checker, in light and dark; fix what turns up.
91. [x] **Undo after deleting.** Deleting an entry shows "Moved to the bin · Undo" for a few seconds.
92. [x] **Share a marker with the party.** Your own map markers can be shared with the party (still private by
    default), so "we camped here" shows for everyone.
93. [x] **Follow an entry.** Anyone can follow an entry; when someone else changes it, it shows at the top of "since
    your last visit" and as a quiet note in the sidebar.
94. [x] **Formatting in descriptions.** **Bold**, *italic*, lists, small headings and "> read-aloud" boxes in any
    long text, shown formatted on pages, cards, the session sheet and exports.
95. [x] **Recently viewed.** The last entries you opened, in the sidebar and at the top of Ctrl+K search, for this
    browser.
96. [x] **Copy a place with what's in it.** "Make a copy" on a place can bring its people, shops and sub-places
    along, for a second village built like the first.
97. [x] **Merge two entries.** When the world has two entries for the same thing, GMs merge one into the other:
    connections, places inside it and mentions move over, texts are joined, and the spare goes to the bin.
98. [x] **Say it right.** A "Say it" pronunciation on any entry ("BRAM-well"), under the name on its page, NPC
    cards and the session sheet, with a pronunciation guide for the whole world.
99. [x] **Where the party has been.** Moving the party marker keeps a log with the in-world date; the map draws the
    route so far and the party page lists the journey.
100. [x] **Wish lists.** Players note what their characters hope to find or earn; GMs see every wish in session prep
    and beside loot, and players tick a wish off when it comes true.
101. [x] **Read-aloud in prep.** The session prep page and printable session sheet gather the "> read-aloud" boxes
    from the entries planned for that session, in order, ready to read.
102. [x] **Likely duplicates.** A GM page listing entries that look like the same thing (same or near names),
    with "Merge" and "Not the same" (remembered), so a big imported world stays tidy.
103. [x] **Roll a detail.** Small roll buttons beside NPC looks, voice, manner and wants, and place features, in the
    entry form, filled from the app's generators; roll again or keep typing.
104. [x] **Hall of heroes.** A page remembering characters who died or retired: how and when, an epitaph from
    their player, and the sessions they played.
105. [x] **Ask the GM.** A private question thread between each player and the GMs, between sessions, with a
    badge when there's an answer.
106. [x] **Quote wall.** Memorable lines from the table ("I lick the door." Pip, session 12): any member adds one,
    with who said it and when; a random one greets you on the world's front page.
107. [x] **Picture wall.** Every picture in the world on one page (portraits, places, maps, handouts), filterable by
    kind and tag, each opening its entry.
108. [x] **Contents for long entries.** Entries with several "## " headings get a small table of contents at the
    top that jumps to each part.
109. [x] **The world in numbers.** A page of counts and fun facts: sessions played, the most-mentioned NPCs, the
    busiest places, who has written the most, the longest-running quest.
110. [x] **A tidier sidebar.** The world's views grouped under folding headings (At the table, The world,
    Extras), remembered per browser, with counts and badges kept, so the list stays short.
111. [x] **Reactions.** A quick emoji reaction (👍 😂 😮 ❤️ 🎲) on table talk and on the quote wall, with who reacted.
112. [x] **Mood music.** A music or ambience link on any place or scene, played from its page, and offered in
    session prep for where the party is.
113. [x] **Birthdays on the calendar.** Characters' and NPCs' in-world birthdays recur every year on the calendar
    and in session prep's "Coming up".
114. [x] **Previously on…** Before the next session, the world's front page opens with the last session's summary
    and "where we left off", so everyone arrives remembering.
115. [x] **Text size.** A per-browser setting for larger (or smaller) text across the app, for phones and tired
    eyes at the end of a long session.
116. [x] **Repeating events.** Calendar events that come round every week, month or year (market day, the council's
    moot, a feast), shown on the calendar and in session prep.
117. [x] **Prep checklist.** The GMs' own list of things to do before each session (print sheets, update the map),
    ticked off in session prep and cleared when a new session starts.
118. [x] **Fuller backups.** The world backup also carries maps and their pins, the calendar, session prep, standing,
    clocks, the treasury and the quote wall, and can be restored as a new world (never over an existing one).
119. [x] **Item cards.** Printable cards for magic items and loot (name, rarity, attunement, what it does) to hand
    across the table, nine to a page.
120. [x] **Spell cards.** Printable cards for a character's spells from their spellbook, nine to a page.
121. [x] **Who's who.** A printable cast list of the people the party has met (from the session log), with
    pictures, pronunciations and one line each, safe to hand to players.
122. [x] **Missing links.** "What needs writing" lists [[names]] that point at no entry yet, where they're mentioned,
    with a button to create each one.
123. [x] **Add to your calendar.** The next session as a calendar file (and a Google Calendar link), so it lands in
    everyone's own calendar with the world's name and a link back.
124. [x] **On this day.** The front page notes what happened on today's in-world date in earlier years, and whose
    birthday or which holiday it is.
125. [x] **Roll a name.** A "Roll" beside the name field for NPCs, settlements, taverns and shops, using the app's
    name tables (and an NPC's ancestry).
126. [x] **Who has read it.** GMs see which players have opened a handout (and when), so nobody has to ask "did
    everyone read the letter?".
127. [x] **Coming or not.** Once the next session is set, everyone says "I'm coming" or "Can't make it"; the front
    page and session prep show who's in.
128. [x] **Picture descriptions.** A short description for an entry's picture, read by screen readers and shown
    on hover; gallery captions do the same for theirs.
129. [x] **Next and previous.** Arrows on an entry's page to the next and previous entry of the same kind, with
    [ and ] on the keyboard.
130. [x] **How far from the party.** A map pin's card says how far it is from the party's place and how long the
    walk is, when the map has a scale.
131. [x] **Forgiving search.** A typo or two still finds things in Ctrl+K search and the world search box.
132. [x] **Quests by status.** The quests list grouped: in play, on offer, rumored, then done and failed folded
    away.
133. [x] **New table talk.** The sidebar's Table talk shows how many comments are new since your last visit.
134. [x] **Pages the party writes together.** GMs can open an entry to the party: any player can edit its text
    (never its secrets or who sees it), with the usual history.
135. [x] **Join by QR code.** Admin shows the player invite as a QR code, so people at the table can join from
    their phones by pointing the camera.
136. [x] **Conditions at a glance.** Tapping a condition on a character's sheet (Poisoned, Prone…) shows what it
    does, from the SRD.
137. [x] **Travel takes time.** After moving the party on a map with a scale, offer to move the calendar on by the
    travel time.
138. [x] **Rename a tag.** A tag's page can rename it (or fold it into another tag) across every entry at once.
139. [x] **Their story so far.** A character's page gathers their story: sessions played, quests they finished,
    goals reached, wishes come true, and where their journey went.
140. [x] **Who holds what.** A map switch tints each pin by the faction that controls the place (from "Controlled
    by", "Ruled by" or a connection), with a key.
141. [x] **Between sessions.** Session prep gathers what players did since the last session: journals, downtime,
    suggestions, questions and table talk, in one card.
142. [x] **Set a field for many.** Bulk actions can set one field (an NPC's status, a quest's status, a shop's type)
    on every selected entry of the same kind.
143. [x] **A new world like this one.** Start a fresh world with this one's calendar, own fields, templates, session
    zero page and tag descriptions, but none of its entries.
144. [x] **More shortcuts.** On an entry's page: e to edit, s to star, f to follow.
145. [x] **Export to a spreadsheet.** Download any kind of entry as a CSV file with its fields as columns, the
    mirror of importing from a spreadsheet.
146. [x] **Pin a note to the session.** GMs jot reminders on the next session ("give Pip the letter") that show at
    the top of session prep and on the printable sheet, ticked off when done.
147. [x] **Faction news.** After a faction turn, offer a ready-made notice for the players about what's visibly
    changed (clocks that filled, standing that moved), for GMs to edit and post.
148. [x] **Places at a glance.** A settlement's page shows a small panel: who leads it, who holds it, how many
    people, shops and open jobs are there, and its mood music and weather today.
149. [x] **Recently changed for GMs.** A GM-only "Recently changed" list on the front page: the last dozen edits by
    anyone, with who and when, linking to each entry's history.
150. [x] **A forecast for the week.** Session prep shows the next few in-world days of weather where the party is,
    matching what each day will show when it comes, so GMs can plan a storm.
151. [x] **Reading for next session.** GMs pick a few entries for players to read before the next session; players
    see the list on the front page and tick off what they've read.
152. [x] **Reveal on a date.** A hidden entry can be set to reveal itself to players on a chosen day, for a letter
    that arrives or a festival that's announced, without the GM having to remember.
153. [x] **Job board poster.** A town's open jobs as a printable notice-board poster (or shown to the table), in the
    voice of the posters pinned up in the square.
154. [x] **Also known as.** Entries can carry other names (a title, an old name, what the locals call it); search,
    mentions and the name check find them under any of them.
155. [x] **How old they are.** NPC and character pages show their age today, from their birth date and the in-world
    calendar; Who's who shows it too.
156. [x] **A rival party.** Roll a rival adventuring party (a name, four members with classes and a grudge, what
    they're after) and save it as a guild with its people.
157. [x] **Tavern menu.** A tavern's page can roll a bill of fare (drinks, dishes, a bed for the night, priced to suit
    the town) to read out or print.
158. [x] **Price list.** A Reference "Prices" tab: gear, food, lodging and services with their prices, searchable
    and grouped by kind, from the same price list the shops use.
159. [x] **Not yet visited.** The atlas marks places the party has never set foot in (from where the party has been),
    so GMs can see what's still to explore.
160. [x] **Living costs.** When days pass on the calendar, offer to charge each character for their lifestyle
    (from wretched to aristocratic), taken from their coin, with a line in the treasury log.
161. [x] **The treasury over time.** A small chart on the party page of the party's coin across sessions, from the
    treasury log.
162. [x] **Buy from a shop.** On a stocked shop's page, players pick what they want and pay from their own coin; the
    item lands in their inventory and the GMs see a line in the loot log.
163. [x] **Quest deadlines.** A quest can carry an in-world deadline; prep and the quest board count down the days
    left, and the calendar shows it.
164. [x] **Quest chains.** A quest can follow another; its page shows what came before and what it leads to, and
    finishing one offers to open the next.
165. [x] **Weather for the table.** Players see today's weather where the party is on the front page, the same as
    the GMs' prep shows.
166. [x] **Sell to a shop.** On a stocked shop's page, players sell something from their inventory at the shop's
    buy-back rate; the coin goes on their sheet and the item onto the shelf.
167. [x] **Hirelings.** Hire an NPC to travel with the party at a daily wage; the party page lists who's on the
    payroll, and living costs add their wages when days pass.
168. [x] **Tag colours.** GMs give a tag a colour, and every chip for that tag shows it, so "villain" or "clue" can
    stand out at a glance.
169. [x] **Our next move.** Players mark the quest they mean to pursue next; GMs see the party's choice (and any
    split) in session prep.
170. [x] **Who has it?** One search across every character's inventory and the party treasury: "rope" finds who's
    carrying it and how many.
171. [x] **Shops restock with time.** When days pass, GMs are offered a restock of the shops in towns where enough
    time has gone by since their last delivery.
172. [x] **Haggle at the counter.** Buying shows the shop's haggle DC; a GM can grant the result (a discount or a
    markup) for the next purchase there.
173. [x] **Stay the night.** At a tavern with a menu, the party takes rooms for the night: the price from the bill
    of fare comes off each purse and the world's clock moves on to morning.
174. [x] **Rations run down.** When days pass, each character's rations (or the treasury's) go down by a day's worth,
    and the GMs are warned about anyone who's run out.
175. [x] **Wanted posters.** An NPC can carry a bounty; wanted NPCs go up on the job board poster alongside the
    jobs, with the reward and who's paying.
176. [x] **Prices in this town.** The price list can show prices as one town's market has them (shortages,
    surpluses, inflation), not just the usual ones.
177. [x] **A night's rest.** Staying the night at an inn also gives those who stayed a long rest: hit points and
    spell slots back on their sheets.
178. [x] **Make camp.** GMs make camp for the party anywhere: a long rest for everyone, eight hours on the clock,
    and an optional roll on the area's encounter table for who comes in the night.
179. [x] **The session in numbers.** A session's recap draft gains a short tally of what changed: coin earned and
    spent, items found, days passed, quests finished.
180. [x] **Hand out to everyone.** GMs give an item (or coin) to several characters at once from the party page:
    "a potion of healing each".
181. [x] **The party at a glance.** A compact table for GMs on the party page: each character's hit points, coin,
    days of rations, exhaustion and conditions.
182. [x] **A short rest.** GMs give the party a short rest from the party page: an hour on the clock, and pact
    magic slots back for warlocks.
183. [x] **The journey on the calendar.** Where the party has been shows on the in-world calendar, on the days they
    arrived ("⚑ Brindle").
184. [x] **Worries in prep.** Session prep warns about who's down or low on hit points, out of rations, exhausted or
    broke, before the session starts.
185. [x] **Sell the loot.** GMs sell treasury items to a shop at its buy-back rate in one go; the coin goes into the
    treasury and the items onto the shop's shelf.
186. [x] **Enough food for the road?** Planning a trip on a map says how many days of rations each character needs
    for it, and who's short.
187. [x] **Weather slows the road.** Moving the calendar on after travel takes the weather where the party is into
    account: heavy rain, snow or a storm add days.
188. [x] **Rumours over supper.** A night at an inn brings a rumour going around that town, shown to the GM to pass
    on (or keep).
189. [x] **A shopping list.** Players note what they mean to buy; when they're at a shop that stocks it, the buy
    panel offers it first, and GMs see the lists in prep.
190. [x] **Sheets keep outside changes.** An open character sheet no longer overwrites changes made from elsewhere
    meanwhile (coin from a split, rations eaten, a rest at an inn): its save keeps what it didn't change itself.
191. [x] **Each character's own lifestyle.** A character can set how they live; living costs use it, so the
    noble pays for a fine inn while the ranger sleeps rough.
192. [x] **Downtime moves with the calendar.** When days pass, open downtime activities gain those days, and GMs
    are told which ones are ready to resolve.
193. [x] **A day on the road.** After travel on a map, a party journal draft is offered: from where to where, how
    many days, the weather, and rations eaten.
194. [x] **What happened to my coin?** Changes made to a character's sheet from outside (a split, a hand-out, living
    costs, rations, a purchase, a rest) leave a short line in a history on the sheet, so players can see why.
195. [x] **Shops keep hours.** Shops are shut at night by the world's clock: the buy and sell panels say so (GMs
    can still trade), and a tavern stays open late.
196. [x] **Treasure from a fight.** An encounter card can roll treasure for its challenge and put it straight into
    the party's loot log.
197. [x] **The party's wealth.** The party page shows what the party is worth in all: the treasury plus every
    character's purse.
198. [x] **Hunger takes its toll.** When someone goes without rations on the road, GMs are offered a level of
    exhaustion for them, right there in the living-costs dialog.
199. [x] **Weather on the map.** The party's marker on a map shows today's weather there, with the full line on
    hover.
200. [x] **Since you were last here: the road.** Players' "what's new" says how many days passed in the world and
    where the party went since their last visit.
201. [x] **Friends get a discount.** In a town held by a power the party stands well with, shops give 10% off; where
    the party is hated, 10% more.
202. [x] **Friends buy dear.** Selling to a shop follows the same standing: friends of the town's holder get 10%
    more for their goods, the hated 10% less.
203. [x] **Rations from the stash.** On the road, characters who run short can eat from the treasury's rations
    first, in one line of the loot log, before anyone goes hungry.
204. [x] **You've got news.** Players are told when their sheet changes from outside while they have the world open:
    "The GMs gave you 2 potions of healing".
205. [x] **A party sheet for the GM's screen.** One printable page with every character's hit points, armour class,
    passive Perception, coin and what they carry.
206. [x] **Heavy packs.** Each sheet adds up what it carries (SRD weights for the gear the shops sell, coins at fifty
    to the pound) against its carrying capacity, and the party sheet shows who's weighed down.
207. [x] **Into the stash.** A player can put an item or coin from their sheet into the party treasury, and take one
    out, with a line in the ledger and in their sheet's history.
208. [x] **Since last session, for you.** A player's character page opens with what changed for them since the last
    session: coin up or down, items in and out, from the sheet's history.
209. [x] **A printable month.** The calendar's month on one page, with sessions, festivals, deadlines and birthdays.
210. [x] **What it's worth.** Each sheet says what its gear would fetch at the shops (half the list price, as the
    sell route pays), and the party sheet totals each character's goods.
211. [x] **Debts between friends.** One character can lend another coin with a note; both sheets show what's owed,
    and paying it back clears it.
212. [x] **Too heavy for the road.** Planning a trip warns when someone is over their carrying capacity, beside the
    rations check.
213. [x] **A shop's ledger.** Each shop page shows the party's recent trade there (who bought and sold what, for how
    much), from the buy and sell routes.
214. [x] **Where are they now?** NPCs can have a day's routine ("Mornings: the forge; evenings: the Bell"); their
    page and their place's page say where they are at the world's current hour.
215. [x] **Bounties pay out.** When an NPC with a bounty is marked dead or captured, the GMs are offered the bounty for
    the party treasury, noting who paid it.
216. [x] **Hirelings eat too.** On the road, hired NPCs eat from the treasury's rations, and the living-costs dialog
    says when there aren't enough.
217. [x] **A packing list.** Planning a trip offers to add what each character is short of (rations for the days) to
    their shopping list.
218. [x] **Debts at a glance.** The party page and the GM's party sheet list who owes whom, from the sheets' debts.
219. [x] **Who's about town.** A settlement's page lists the NPCs whose routine puts them somewhere inside it right
    now, and where.
220. [x] **Lights from the pack.** Lighting a torch or lantern on the clock can take it (or a flask of oil) from a
    character's inventory, with a line in their history.
221. [x] **Order from the menu.** A player orders food or drink from a tavern's menu, paid from their sheet, noted in
    their history and the tavern's ledger.
222. [x] **Who's around for the scene.** Session prep lists the NPCs whose routine puts them where the party is right
    now.
223. [x] **Coming up for you.** A player's character page lists the next week of in-world days that matter to them:
    their birthday, their quests' deadlines, festivals.
224. [x] **Tidy the pack.** One button on a sheet merges duplicate inventory lines ("Rope" and "2 Rope (from the
    Smithy)" become "3 Rope").
225. [x] **Carrying for the party.** Treasury items held by a character show on that character's sheet.
226. [x] **The regulars.** A tavern's or shop's page lists the NPCs whose routine brings them there at some hour,
    and when.
227. [x] **Who's here, on the map.** A map pin's card says who is at that place right now, from their routines.
228. [x] **Wages owed.** When the treasury can't cover the hirelings' wages, what's unpaid is noted as owed to each,
    and shows on the payroll until it's paid.
229. [x] **Divide the loot.** GMs give out the treasury's items in one go, choosing who gets each; each lands on that
    sheet with a line in the ledger and the sheet's history.
230. [x] **Routine as you type.** On an NPC's form, the daily routine field says where it puts them right now
    while the GM writes it, and flags lines it can't read.
231. [x] **Everything the party carries.** One list (printable) of every character's gear and the treasury's,
    merged, with who has each.
232. [x] **A round on the house.** GMs buy everyone at the table a dish or drink from a tavern's menu, paid from the
    treasury, in one line of the ledger.
233. [x] **Whose torch is it.** Lights lit from someone's pack say whose they are on the clock ("Ann's torch").
234. [x] **Roll a routine.** A roll button on an NPC's daily routine writes a likely day from their role and the
    places in their town (a smith at the forge by day and the tavern at night).
235. [x] **Minding the shop.** A shop's page says whether its owner is behind the counter right now, or where they are
    instead.
236. [x] **Gifts for NPCs.** A player can give an item or coin from their sheet to an NPC; the NPC's page lists what
    they've been given, and by whom.
237. [x] **Ask the shopkeeper.** A player can ask a shop for something it doesn't stock; the GMs see the asks on the
    shop's page and can add the item to the shelf.
238. [x] **The town by the hour.** A settlement's page can show who is where across the town through the day
    (morning, afternoon, evening, night), from the routines.
239. [x] **Open now?** A character's shopping list says, for each shop that stocks something on it, whether it's
    open at the world's hour and who's minding it.
240. [x] **Waiting on the GM.** Session prep gathers what's waiting for a GM: things asked for in shops, wages owed,
    and bounties not yet paid.
241. [x] **Go to my character.** A keyboard shortcut (g then y) and a link in the world's side menu open the player's
    own character.
242. [x] **Gifts and loans in the recap.** The session recap draft notes gifts given to NPCs and loans between
    characters since the last session.
243. [x] **Shut for the holiday.** Shops close on the world's holidays, and say so ("Shut for Bridge Day").
244. [x] **Routines for the whole town.** A GM can roll a daily routine for every NPC in a settlement who hasn't got
    one, in one go, and check them before saving.
245. [x] **Hirelings go with the party.** A hired NPC is where the party is, whatever their routine says, on their page
    and in the "who's here" lists.
246. [x] **A gift they wanted.** Giving an NPC something says when it matches what they want (their Wants field).
247. [x] **Attuned.** Players mark which magic items on their sheet they're attuned to; the sheet counts them against
    the limit of three.
248. [x] **Too heavy to carry it.** Buying something that would put a character over their carrying capacity says so
    before they pay.
249. [x] **Print the shelf.** A shop's stock as a printable price list to hand round the table.
250. [x] **Attuned on the party sheet.** The GM's party sheet shows who is attuned to what.
251. [x] **Festival specials.** On a holiday, taverns offer a festival dish or drink at the top of their menu.
252. [x] **Who's been given what.** A character's page lists the gifts they've given NPCs, and to whom.
253. [x] **Closing time.** A shop's page says how long until it shuts (or opens), by the world's clock.
254. [x] **A tab at the tavern.** Players can put an order on the party's tab; the GM settles the tab from the
    treasury later, in one line.
255. [x] **Late night at the tavern.** After midnight a tavern's page says it's last orders before it shuts at 2.
256. [x] **The NPC's day on their page.** An NPC's page shows their whole day from the routine (morning, afternoon,
    evening, night), not just where they are now.
257. [x] **Gifts in session prep.** Session prep notes NPCs who've been given something since the last session.
258. [x] **Tabs waiting.** Session prep's "Waiting on you" lists taverns with an unsettled party tab.
259. [x] **Pay your own tab.** A player can settle their own orders on a tab from their sheet's coin.
260. [x] **Who's in the back room.** A place inside another (a back room, a cellar) shows on its parent's page in the
    "Here now" line, so the tavern says who's in its back room.
261. [x] **Routines on the printable cast list.** The printable Who's who adds where each NPC usually is by day.
262. [x] **A tab on the party page.** The party page's treasury card lists the tabs the party is running at taverns.
263. [x] **Who has the most coin.** The party page's at-a-glance table sorts by any column the GM clicks.
264. [x] **Bounties on the party page.** The party page lists open bounties on NPCs the players know of.
265. [x] **A quiet night.** When the clock passes midnight, the toast says who's out and about at that hour.
266. [x] **Wanted posters link the bounty.** A wanted poster's reward line links to the party page's Wanted card
    and says if the bounty has been claimed.
267. [x] **Sort the party sheet.** The GM's party sheet can be sorted by name, hit points or load before printing.
268. [x] **A night out.** The tavern's page lists who's due in later tonight, from the regulars' routines.
269. [x] **Gifts in the NPC's card.** The printable NPC card notes the last gift the party gave them.
270. [x] **Who's due in, on the map.** A tavern's map pin notes who's due in later tonight.
271. [x] **Bounty hunters' board.** The party page's Wanted card says where each wanted NPC is usually found by day.
272. [x] **Settle every tab.** Session prep can settle all the party's tavern tabs from the treasury in one go.
273. [x] **A gift from the party.** GMs can give an NPC something from the treasury, noted as from the party.
274. [x] **Gifts from the party in the recap.** The recap's Dealings section includes gifts given from the treasury.
275. [x] **A full sweep and tidy.** Run the whole browser suite, fix anything it turns up, and note it in the log.
276. [x] **Who gave the most.** The party page lists each character's gifts to NPCs as a count, for the table's
    amusement.
277. [x] **Last orders on the clock.** The world clock card notes when the taverns call last orders (half past one).
278. [x] **Holidays on the clock.** On a holiday, the world clock card says so, and that the shops are shut.
279. [x] **Who's owed wages, at a glance.** The party page's at-a-glance table notes hirelings owed wages under it.
280. [x] **Gifts given, on the party sheet.** The GM's party sheet notes each character's gift count.
281. [x] **Tabs in the recap.** The recap's Dealings section notes tabs run up and settled since the last session.
282. [x] **Coming up: holidays shut the shops.** A player's "Coming up" card notes that the shops will be shut on
    an upcoming holiday.
283. [x] **Wages in the recap.** The recap's Dealings section notes wages paid and owed since the last session.
284. [x] **Who's around on the front page.** For players, the world's front page notes who's about where the party
    is right now.
285. [x] **A tidy for the party.** GMs can tidy every character's pack (merge duplicate lines) in one go.
286. [x] **Due in later, on the front page.** The front page's "Around the party" card notes who's due in later
    tonight when the party is at a tavern.
287. [x] **Routine in the cast list's search.** Ctrl+K finds NPCs by where their routine puts them ("the Forge").
288. [x] **Holiday prices.** Taverns charge a little more on holidays, said on the menu.
289. [x] **A full sweep.** Run the whole browser suite after #276–#288 and note it.
290. [x] **Holiday prices on the shelf.** Shops that open on a holiday eve mark up festive goods (candles, ale, sweets)
    on the day before a holiday.
291. [x] **A tavern's busiest hour.** A tavern's page says when it's busiest, from the regulars' routines.
292. [x] **Who knows whom.** An NPC's page lists the other NPCs whose routines put them in the same places at the
    same times, as likely acquaintances.
293. [x] **Last seen.** An NPC's page says where they were last seen by the party: the last session log that
    mentioned them, and the place it was set in.
294. [x] **Last seen on the cast list.** The printable Who's who says where each NPC was last seen, not just when.
295. [x] **Acquaintances in the relationship web.** The relationship web can show likely acquaintances (from routines)
    as faint dotted lines, toggled on.
296. [x] **Busy taverns on the map.** A tavern's map pin notes its busiest hour.
297. [x] **Eve of a holiday on the clock.** The day before a holiday, the clock card says so and that festive goods
    cost more today.
298. [x] **A full sweep.** Run the whole browser suite after #290–#297 and note it.
299. [x] **Who's in town for the festival.** On a holiday, a settlement's page notes it's a festival day and who's at
    the taverns now.
300. [x] **The 300th: a changelog page.** A "What's new in the Satchel" page built from the README's feature list
    (newest first), linked from the footer.
301. [x] **Last seen in session prep.** Session prep's "Who might turn up" says where each was last seen.
302. [x] **Open or shut on the map.** A shop's map pin says whether it's open now ("open till 18:00", "shut for
    Bridge Day"), and shut shops' pins are dimmed.
303. [x] **The next festival.** When it isn't a holiday, a settlement's page says when the next one is (within a
    month): "🎉 Bridge Day in 4 days."
304. [x] **What's new since you looked.** The footer's "What's new" link counts changes shipped since this browser
    last opened the page, and the page marks them.
305. [x] **Who might turn up, on the town's page.** GMs see the people due back (met before but not lately, or key
    people not met) on a settlement's page, as session prep shows them.
306. [x] **Open now on the Market tab.** A settlement's Market tab says, by the world's clock, which of its shops
    are open now and which are shut (and why: night or a holiday).
307. [x] **Holidays on the session sheet.** The printable session sheet notes when today is a holiday (shops shut,
    taverns open) or the eve of one (festive goods cost more).
308. [x] **Shut shops on the shopping list.** A character's shopping list says when the shop an item is from is shut
    right now, and when it opens.
309. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
310. [x] **Links to a change.** Each change on the What's new page has its own link (#news/305) that opens the page
    scrolled to it, with a copy-link button.
311. [x] **Search finds changes.** Ctrl K finds shipped changes by name ("What's new: Festival day card") and opens
    them on the What's new page.
312. [x] **When the owner's in.** A shop's page says when its owner is usually behind the counter, from their
    routine ("Bramwell is in by day; evenings at the Bell").
313. [x] **The festival in session prep.** On a holiday, session prep notes it under where the party is, with who's
    at the taverns there now.
314. [x] **Nobody at the counter.** The Market tab flags shops whose owner's routine never has them in during
    trading hours, so the GM can fix the routine or hire help.
315. [x] **A shopping trip.** Session prep plans a shopping trip: each shop in town that stocks something on anyone's
    list, what and for whom, open now or when it opens.
316. [x] **Who minds the shop.** When the owner is out, a shop's buy panel says so ("Bramwell is out; an apprentice
    minds the counter").
317. [x] **Due back, on an NPC's page.** GMs see on an NPC's page when the party hasn't met them for a while ("Not
    seen for 3 sessions: might turn up").
318. [x] **Name who minds the shop.** A shop can name who minds it when the owner's out (a new Minder field, an
    additive change); the buy panel and the "Nobody at the counter" check use it.
319. [x] **Your shopping trip.** A character's shopping list groups what's on it by the shops in town that stock it,
    as a little route, open or shut.
320. [x] **The owner's hours on the map.** A shop's map pin popup also says when its owner is usually in.
321. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
322. [x] **Wanted in town.** A settlement's page lists the open bounties on people who live there or whose routine
    brings them there, and who's about town right now.
323. [x] **Around now on the session sheet.** The printable session sheet marks who the routines put where the party
    is right now, and until when.
324. [x] **Bounties in session prep.** Session prep warns when someone with a bounty is about in the party's town now
    (or due in later today).
325. [x] **Festival specials on the map.** On a holiday, a tavern's map pin popup shows its festival special.
326. [x] **A wanted poster.** An NPC with an open bounty gets a printable "WANTED" poster from their page: name, what
    they look like, the reward and who offers it.
327. [x] **Last seen, for bounty hunters.** The party page's Wanted card says where each was last seen, from the
    session logs.
328. [x] **Routines that don't read.** GMs get a list of every NPC routine with lines the clock can't read, or
    places it names that aren't in the world, to fix in one go.
329. [x] **Wanted on the map.** A map pin's popup notes anyone wanted who's there right now.
330. [x] **Unknown places as you type.** The routine preview on an NPC's form also warns about places it names that
    aren't in the world.
331. [x] **Make the missing place.** "Not in the world: the Mill" on What needs writing gets a button to create
    the place, in the NPC's town.
332. [x] **Wanted on the cast list.** The printable Who's who marks people with an open bounty, and the reward.
333. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
334. [x] **Every page at phone width.** A test visits every route with a full world at 390 px wide and flags any
    page wider than the screen; fix what it finds.
335. [x] **Deadlines on holidays.** A quest deadline that falls on one of the world's holidays says so ("due on
    Bridge Day, in 4 days").
336. [x] **Deadlines on the session sheet.** The printable session sheet lists active quests with a deadline,
    soonest first, and how many days are left.
337. [x] **Where they'll be, on the session sheet.** Each person in "Who's around" on the session sheet says where
    their routine usually has them by day.
338. [x] **A whole day on the cast list.** Who's who gives each person's whole usual day ("mornings: the Forge;
    evenings: the Bell"), not just where they are by day.
339. [x] **Routines on NPC cards.** The printable NPC table cards say where each NPC usually is through the day, and
    any bounty on them.
340. [x] **Holiday deadlines coming up.** "Coming up for you" says when one of your quest deadlines falls on a
    holiday.
341. [x] **Open now in search.** Ctrl K shows whether a shop or tavern is open now beside its name.
342. [x] **A shop's own hours.** A shop or tavern can keep its own hours (a new Hours field, "10–18" or "6pm–2am",
    an additive field); everywhere that says open or shut, including what the server allows, follows them.
343. [x] **A day off.** A shop can shut on one weekday of the world's calendar ("Shut on Restday"), like a holiday.
344. [x] **Open or shut on the session sheet.** The session sheet's shop list says which are open now.
345. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
346. [x] **Hours on the printed shelf.** "Print the shelf" includes the shop's hours and day off.
347. [x] **Rolled shops keep sensible hours.** A newly rolled shop gets hours that suit its trade (a baker opens
    early, a night market late); existing shops are left as they are.
348. [x] **Open now in town.** At night or on a day off, a settlement's page says what's still open ("Open now: The
    Bell, Night Market").
349. [x] **"Open now" in search.** Typing "open now" in Ctrl K lists every shop and tavern open at the world's hour.
350. [x] **Open on holidays.** A shop can choose to stay open on holidays (a festival stall, a chandler selling
    candles), an additive field; it's then open as usual on festival days.
351. [x] **Market day.** A settlement can name its market day (a weekday); on that day its page says so and its
    shops open two hours early.
352. [x] **Hours as you type.** The Opening hours field on a place's form says how it reads them as you type ("Open
    18:00–02:00", or "Can't read that; the usual hours apply").
353. [x] **What changed when time moves.** When a GM moves the world's clock on, a note says which shops opened or
    shut and who moved where in the party's town.
354. [x] **Jump to a time of day.** The clock card gets quick jumps for GMs: to morning, midday, evening or night
    (the next one coming), with the same "what changed" note.
355. [x] **Where they are, on their pin.** An NPC's map pin popup says where their routine has them now and their
    usual day.
356. [x] **Hours in the Shops tool.** The Shops table tool shows the hours a rolled shop keeps.
357. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
358. [x] **When the session began.** A session log started from prep notes the in-world date and time it began.
359. [x] **Due in later, on the session sheet.** The printable session sheet says who's due in later where the
    party is, and about when.
360. [x] **Market day coming up.** "Coming up for you" notes the next market day in the party's town.
361. [x] **Shops in the town by the hour.** The town-by-the-hour table also shows which shops are open at each hour.
362. [x] **Where to find the patron.** A quest's page says where its patron (an NPC) is right now and until when,
    from their routine.
363. [x] **Patrons in session prep.** Session prep's active quests say where each patron is now.
364. [x] **"Who's at" in search.** Typing "at the Bell" (or "who's at the Bell") in Ctrl K lists who's there now.
365. [x] **Last orders on the map.** In a tavern's last hour, its map pin popup says it's last orders.
366. [x] **Patrons on the quest board.** A town's quest board says where each job's patron is right now.
367. [x] **Where to ask, on the job poster.** The printable job board says where to find each patron ("Ask for
    Bramwell, by day at The Forge").
368. [x] **Lights on the session sheet.** The printable session sheet lists the lights burning and how long each has
    left, with the time.
369. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
370. [x] **Where they are now, on the cast list.** Who's who says where each person is at the world's hour.
371. [x] **Members about now.** A faction's page lists its members (the NPCs connected to it) and where each is
    right now.
372. [x] **The time on the party's map marker.** The party's marker on a map says the world's time with the weather.
373. [x] **Moonlight at night.** At night the clock card says how much the moons light the way (full, half, dark).
374. [x] **Clouds hide the moon.** On an overcast or rainy night, the moonlight line says the clouds hide it (and
    how dark that leaves things).
375. [x] **Moonlight on the session sheet.** The session sheet's time and light block includes tonight's moonlight.
376. [x] **Set the scene.** Session prep offers a one-line scene-setter for where the party is: the time, the
    weather, the light, and any festival ("Evening in Brindle: heavy rain, the Bell's lamps lit for Bridge Day").
377. [x] **Night in the encounter roll.** An encounter rolled in prep at night notes the light (moonlit, or dark).
378. [x] **The scene on the session sheet.** The printable session sheet opens with the scene-setter line.
379. [x] **Where we are, for players.** The party page tells everyone where the party is in a line: the time, the
    weather and the light.
380. [x] **Who can see in the dark.** At night, the GM's party sheet says each character's darkvision (from their
    species), and who'll need a light.
381. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
382. [x] **Darkvision from the library.** A character whose species comes from the world's library gets its
    darkvision from the species it's "similar to".
383. [x] **The weather when the session began.** The "Began at…" line on a new session log includes the weather.
384. [x] **Print the town by the hour.** A settlement's town-by-the-hour table can be printed on its own as a handout
    for the GM's screen.
385. [x] **Lights running low in prep.** Session prep warns when a light the party has burning has ten minutes or
    less left.
386. [x] **What happened with them.** An NPC's page quotes the line of the last session log that mentions them.
387. [x] **Open now, for players.** The party page tells everyone what's open now in the town the party is in.
388. [x] **The scene, read aloud.** Session prep can add the scene-setter line to the read-aloud list in one click.
389. [x] **What happened, on the cast list.** Who's who quotes the line of the last session log that mentions each
    person, under when they were last seen.
390. [x] **Last in the log, everywhere.** Places, quests, factions and items say which session last mentioned them,
    with the line from its log.
391. [x] **Tomorrow's weather on the session sheet.** The session sheet adds tomorrow's forecast where the party is.
392. [x] **Every time they came up.** An NPC's page can fold out every session that mentions them, each with its
    line, newest first.
393. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
394. [x] **In this session.** A session's page lists the people, places, quests and things its log names, grouped.
395. [x] **What happened, in prep.** Session prep's "Who might turn up" quotes the line from when each was last seen.
396. [x] **Last time, on NPC cards.** The printable NPC cards add the line from the last session that named them.
397. [x] **Search the logs.** Typing "log: dragon" in Ctrl K lists the sessions whose log mentions it, each with the
    sentence.
398. [x] **Characters in the log too.** A character's page says when the log last mentioned them, with the line,
    and folds out every session they came up in.
399. [x] **Who comes up most.** The world's numbers page lists the people, places and quests the session logs name
    most.
400. [x] **Forgotten threads.** Session prep flags active quests the logs haven't mentioned for three sessions or
    more.
401. [x] **Sort the cast.** Who's who can be sorted by name or by how long since each was last seen.
402. [x] **Key people gone quiet.** Session prep lists key NPCs the logs haven't mentioned for five sessions or more,
    wherever they are.
403. [x] **Every session, for quests and places.** Quests and places can fold out every session that mentions them,
    each with its line, as NPCs do.
404. [x] **Threads in the new log.** A session log started from prep lists the quests in play, so the GM can note
    what moved.
405. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
406. [x] **Names left unlinked.** What needs writing finds names of entries that session logs mention as plain text,
    without [[links]], and links them in one click for the GM.
407. [x] **Session numbers in order.** What needs writing flags sessions with a missing or repeated number.
408. [x] **Logs still to write.** What needs writing lists sessions whose log is empty or only a line.
409. [x] **Who came up, on the session list.** The list of sessions shows under each who and what its log names.
410. [x] **Last time, in prep.** Session prep's "Last time" card lists who and what came up in the last session.
411. [x] **Link names as you write.** Editing a session log, the form offers the names it could link ("Bramwell, The
    Bell") with a button that links them in the text.
412. [x] **Last time on the map.** An NPC's map pin popup quotes the line from the last session that named them.
413. [x] **Last session, for players.** The party page says which session was last and who and what came up in it.
414. [x] **Link names in journals too.** Writing a journal entry, the form offers the names it could link, as session
    logs do.
415. [x] **Unlinked names in journals.** What needs writing finds unlinked names in journal entries as well as
    session logs.
416. [x] **First met.** An NPC's page says which session the party first met them in, and where.
417. [x] **First met, on the cast list.** Who's who says when each person was first met.
418. [x] **Met together.** The relationship web can show, as faint lines, NPCs whose names come up in the same
    session logs (twice or more), toggled on like acquaintances.
419. [x] **In this entry, for journals.** A journal entry's page lists who and what it names, grouped, as session
    pages do.
420. [x] **Last time, on the session sheet.** Each person in "Who's around" on the session sheet gets the line from
    the last session that named them.
421. [x] **Copy a session as text.** A session's page can copy its log as plain text (links as plain names) to paste
    into a chat.
422. [x] **Copy a journal entry as text.** Journal pages get the same "Copy as text" button.
423. [x] **Time between sessions.** The session list says how long after the one before each session was played
    ("2 weeks later").
424. [x] **Days in the world, per session.** The session list says how many in-world days passed between sessions,
    from their in-world dates.
425. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
426. [x] **The gap on a session's page.** A session's page says how long after the one before it was played, and how
    many in-world days passed.
427. [x] **Pace of play.** The world's numbers page says how often the table meets on average, and how many in-world
    days pass per session.
428. [x] **Write about the last session.** The party page offers players a journal entry about the last session,
    started with a link to it.
429. [x] **What the players wrote.** A session's page lists the journal entries that link to it.
430. [x] **Journals on the session list.** The list of sessions says how many journal entries the players wrote
    about each.
431. [x] **Who wrote, in prep.** Session prep's "Last time" card says which journal entries the players wrote about
    it.
432. [x] **In the players' journals.** An NPC's page lists the journal entries that name them.
433. [x] **Copy the cast as text.** Who's who can copy the cast list as plain text to paste into a chat.
434. [x] **Search the journals too.** "log: dragon" in Ctrl K also finds journal entries that mention it.
435. [x] **What they wrote, on a character.** A character's page lists the journal entries its player wrote.
436. [x] **When a journal entry is set.** A journal entry about a session shows that session's in-world date.
437. [x] **Not a name.** In "Names left unlinked", a GM can mark a name as never to be linked (an entry called "The
    Watch" that's often just words), and it stops being flagged.
438. [x] **Not a name, as you write.** The session log form's "Names you could link" leaves out names marked never
    to be linked.
439. [x] **Change your mind.** What needs writing lists the names marked never to be linked, each with a way to take
    the mark back.
440. [x] **Unlinked names in quests and places.** What needs writing also finds unlinked names in the descriptions
    of quests and places, not only logs and journals.
441. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
442. [x] **Link names in descriptions too.** Quest and place forms offer the names their description could link, as
    session logs do.
443. [x] **Playing since.** The world's numbers page says when the first session was played and how long ago.
444. [x] **Taken on in, finished in.** A quest's page says which session first mentioned it, and for a finished quest,
    the last.
445. [x] **First visited.** A place's page says which session first mentioned it.
446. [x] **New in this session.** A session's page says who and what came up for the first time in it.
447. [x] **New faces on the session list.** The list of sessions says how many people and places each one
    introduced.
448. [x] **New last time, in prep.** Session prep's "Last time" card names who and what was new in it.
449. [x] **New on the cast list.** Who's who marks the people first met in the latest session.
450. [x] **Sessions here.** A place's map pin popup lists the sessions whose log mentions it.
451. [x] **How many are here.** A map pin shows a small count of the people the routines put there right now.
452. [x] **Wanted, at a glance.** A map pin where someone wanted is right now gets a 🎯 mark.
453. [x] **Find a person on the map.** The map's "Find a pin" also finds NPCs by name and points to the pin where they
    are now.
454. [x] **A map key.** The map explains its marks in a small key: the head-count, 🎯 for someone wanted, a dimmed pin
    for a shut shop, the party's flag.
455. [x] **Who's where, by name.** A map toggle labels each pin with the names of the people there now, not just a
    count.
456. [x] **The map at another hour.** A slider on the map previews who's where and what's open at another hour,
    without moving the world's clock.
457. [x] **Night on the map.** At night the map darkens a little and says how much the moon lights it.
458. [x] **What if we skip ahead.** The clock card can preview what would change in the party's town by the next
    morning, evening or night before the GM moves time (shops opening, who'd come and go).
459. [x] **A town at another hour.** A settlement's page can preview who's about and what's open at another hour.
460. [x] **Only where people are.** A map toggle dims the pins with nobody there right now.
461. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
462. [x] **Who came up that day.** A day on the calendar lists the sessions set on it and who and what came up in
    them.
463. [x] **Market days on the calendar.** The calendar month marks the party's town's market days.
464. [x] **No market on a holiday.** When a market day falls on a holiday, the town's page says there's no market.
465. [x] **The week in town.** A settlement's page shows the coming week: holidays, market day, and which shops take
    a day off when.
466. [x] **Copy the week.** The week in town can be copied as plain text, for a handout or a chat.
467. [x] **The week on the GM sheet.** The printable GM sheet lists the week ahead in the party's town.
468. [x] **Shut that day.** A calendar day's card says which of the party's town's shops are shut that day, and why.
469. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
470. [x] **Open for the holiday.** The week in town says which shops stay open on a holiday.
471. [x] **Birthdays in the week.** The week in town lists the birthdays of the people who live there.
472. [x] **Next market on the party page.** The party page says when the next market day is in the party's town.
473. [x] **Markets in the palette.** Ctrl+K "market" lists the towns with market days and when each is next.
474. [x] **Market day on the map.** A settlement's map pin says when it's market day there (today, or next).
475. [x] **Next market in prep.** Session prep says when the next market day is in the party's town.
476. [x] **A shop's next day off.** A shop's page says when it's next shut: its day off, or a holiday.
477. [x] **Tomorrow in town.** The clock card says what tomorrow brings in the party's town (a holiday, market day,
    shops shut, a birthday).
478. [x] **Local holidays.** A settlement can have its own festival days (e.g. "Founding Day, 3 Thawmoon"): its shops
    shut, and they show in its week and on the calendar when the party is there.
479. [x] **The week on the party page.** Players can fold out the week in the party's town on the party page.
480. [x] **Days off on the Market tab.** A settlement's Market tab says each shop's weekly day off by its hours.
481. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
482. [x] **Local holidays everywhere.** The party's town's own holidays also count in "Coming up", on the GM sheet,
    and for tavern festival prices.
483. [x] **Check the local holidays.** Saving a settlement warns about local holiday lines the calendar can't read.
484. [x] **Which town's holidays.** The calendar can show another town's local holidays, not just the party's town's.
485. [x] **The 200th Founding Day.** A local holiday written with a year counts its anniversaries ("the 200th Founding
    Day").
486. [x] **Holidays in the palette.** Ctrl+K "holidays" lists the coming holidays, the party's town's own included.
487. [x] **Holidays on the map.** A settlement's map pin says when its next holiday is (today, or in how many days).
488. [x] **The week ahead in prep.** Prep's week-ahead weather marks holidays and market days in the party's town.
489. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
490. [x] **What happens on the day.** A local holiday line can say what happens ("Founding Day, 5 Thawmoon 841 — a
    parade and a bonfire"), shown on the town's festival card and the calendar.
491. [x] **Market stalls.** On market day, a settlement's Market tab lists a few travelling stalls and what they
    sell, the same all day (seeded by the town and the date).
492. [x] **Market-day crowds.** On market day the scene line says the square is busy with stalls.
493. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
494. [x] **Buy from a stall.** A player can buy from a market stall for their character, paid from their purse like
    a shop (the server checks it's market day and the price).
495. [x] **Stalls on the GM sheet.** On market day the printable GM sheet lists the stalls in the party's town.
496. [x] **A stall keeper as an NPC.** A GM can turn a stall's keeper into an NPC in the town with one click.
497. [x] **Stalls on the party page.** On market day the party page lists the stalls in the party's town.
498. [x] **Weather on the calendar.** A calendar day's card in the coming week shows the forecast where the party is.
499. [x] **What the party bought.** The party page lists recent purchases from shops, stalls and taverns, from the
    characters' logs.
500. [x] **Who writes the journals.** The numbers page shows how many journal entries each player has written and
    for how many sessions in a row.
501. [x] **Coin spent.** The numbers page shows what each character has spent at shops, stalls and taverns.
502. [x] **Who has written about it.** The party page's last-session line says which players have written about it.
503. [x] **Most-bought goods.** The numbers page lists the goods the party buys most.
504. [x] **The tavern's regulars at the bar.** A tavern's page lists the characters who order there most.
505. [x] **A shop's best customers.** A shop's page lists the characters who've bought the most there.
506. [x] **Favourite haunts.** A character's page names the tavern they order at most and the shop they buy from most.
507. [x] **Busiest taverns.** The numbers page ranks taverns by the party's orders there.
508. [x] **A shop's best sellers.** A shop's page lists what the party buys there most.
509. [x] **Copy the shopping.** What the party bought can be copied as plain text.
510. [x] **Phone check.** The week in town, the market stalls and their buy form, and the calendar's town picker fit
    a phone screen without sideways scrolling.
511. [x] **When the stalls pack up.** The stalls card says how long the stalls are up by the world's clock, or that
    they're packed away.
512. [x] **The keeper at their stall.** A stall whose keeper was made an NPC links to them.
513. [x] **Stalls in the palette.** Ctrl+K "stalls" lists today's market stalls and their goods.
514. [x] **The stall total.** The buy-from-a-stall form shows the total and the character's purse before paying, like
    a shop's.
515. [x] **A tavern's favourites.** A tavern's page lists what the party orders there most.
516. [x] **Wishlists.** A character can keep a wishlist (one item per line).
517. [x] **Someone wants this.** Shops and market stalls mark goods on a character's wishlist ("⭐ Ann wants this").
518. [x] **What the party wishes for.** The party page lists the open wishes this person may see (GMs: everyone's;
    players: their own) and where in the party's town each is for sale today.
519. [x] **Got it.** Buying something on your wishlist offers to take it off the list.
520. [x] **Wishes in the palette.** Ctrl+K "wishes" lists the wishes you may see and where they're sold in town.
521. [x] **What they want, in prep.** Session prep lists the wishes the shops and stalls in the party's town could
    grant.
522. [x] **Crafting costs.** Filing a crafting downtime for an item on the price list shows what the raw materials
    cost (half its price) and how long it takes (its price in GP ÷ 10 days, rounded up), as the SRD 5.2 rules have it.
523. [x] **Many hands.** The crafting estimate divides the days among the characters helping.
524. [x] **Use the estimate.** One click puts the estimate's days and materials cost into the activity.
525. [x] **Hand over what was made.** When a GM resolves a crafting activity, they can put the item in the
    character's pack.
526. [x] **The right tools.** The crafting estimate names the artisan's tools the item needs (smith's tools for a
    longsword, leatherworker's tools for leather armor…).
527. [x] **Got the tools?** The estimate checks the crafter's pack for those tools and says if they're missing.
528. [x] **Pay for the materials.** A GM can take the raw materials' cost from the crafter's purse in one click.
529. [x] **What the party has made.** The numbers page lists what the party has crafted.
530. [x] **Could be crafted.** A wish for something on the price list says what crafting it would take.
531. [x] **Craft it.** A craftable wish has a "Craft it" button that opens the downtime form ready to file.
532. [x] **What these tools could make.** A character's page says what the artisan's tools in their pack can make.
533. [x] **Done about.** An open crafting activity says about when it will be finished on the in-world calendar.
534. [x] **Pay the cost.** Any downtime activity with a cost can have it taken from the character's purse by a GM.
535. [x] **Downtime totals.** A character's page totals the days and coin their downtime has taken.
536. [x] **A new contact.** Resolving carousing or building contacts can start a new NPC who knows the character.
537. [x] **Anything this time?** The party page reminds players whose characters haven't filed downtime since the
    last session.
538. [x] **Marching order.** GMs set the party's marching order (front to back) on the party page; everyone sees it.
539. [x] **Watch order.** GMs set who keeps watch in the night; the party page shows each watch's hours.
540. [x] **Orders on the sheet.** The printable GM sheet lists the marching order and the night's watches.
541. [x] **Whose watch is it?** At night the clock card says whose watch it is now.
542. [x] **Watches at camp.** Making camp shows the night's watches from the time camp is made, and when trouble comes,
    about when and on whose watch.
543. [x] **Marching order on the map.** The party's marker on a map shows the marching order.
544. [x] **Copy the orders.** The marching order and watches can be copied as plain text.
545. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
546. [x] **Accessibility check.** The newer pages and forms (market stalls and their buy form, crafting downtime, the
    party's orders, the calendar's town picker, the numbers page) pass an automated WCAG A/AA check, light and dark.
547. [x] **Phone check, again.** The crafting form, the orders editor and the party page's new sections fit a phone.
548. [x] **A big party page.** The party page stays quick in a big world (hundreds of entries, long logs).
549. [x] **Print check.** The printable GM sheet's new blocks (stalls, the week, orders) print cleanly.
550. [x] **Hirelings march and watch.** The marching order and watch order can include the party's hired NPCs.
551. [x] **The watch's hours.** GMs set when the night's watch starts and how long it lasts (the default 22:00 for
    eight hours).
552. [x] **Orders in the palette.** Ctrl+K "marching" or "watch" shows the party's orders.
553. [x] **My place and watch.** A character's page says where they march and which watch they keep.
554. [x] **Guild members.** A guild's page lists the player characters connected to it (either way) as its members,
    beside the NPC members it already shows.
555. [x] **Dues due.** A guild with dues ("5 gp a month") says what its member characters owe each in-world month.
556. [x] **Pay the dues.** A GM can take a member's dues from their purse in one click, logged.
557. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
558. [x] **Dues on the party page.** The party page lists guild dues still owed this month (players: their own).
559. [x] **Ranks.** A member's rank in a guild comes from the link's label ("journeyman of"), shown on the members list.
560. [x] **My guilds.** A character's page lists their guilds (and factions and clans), with their rank and dues.
561. [x] **Dues in the palette.** Ctrl+K "dues" lists the dues still owed this month.
562. [x] **Session timer.** Session prep has a timer the GM starts when play begins and stops at the end; it can save
    how long the session ran to its log.
563. [x] **How long it ran.** Session pages and the session list show how long each session ran.
564. [x] **Average session.** The numbers page shows how long sessions run on average.
565. [x] **Time for a break.** The running timer suggests a break every ninety minutes.
566. [x] **Languages.** Characters and NPCs get a "Languages" field (Forge characters already know theirs).
567. [x] **Who can talk to them.** An NPC's page says which party members share a language with them, or that
    nobody does.
568. [x] **The party's tongues.** The party page lists the languages the party speaks between them, and who speaks each.
569. [x] **Who speaks it?** Ctrl+K "who speaks Elvish" lists the characters and NPCs who do.
570. [x] **An interpreter.** When nobody in the party shares a language with an NPC, their page suggests NPCs who
    could interpret (who speak one of theirs and one of the party's), nearby first.
571. [x] **Languages on NPC cards.** The printable NPC cards show what each NPC speaks.
572. [x] **Lost in translation.** Session prep's "Who's around" flags the NPCs nobody in the party can talk to.
573. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
574. [x] **Prophecies.** Lore can be a Prophecy with a list of signs (secret ones hidden from players), ticked off as
    they come to pass.
575. [x] **Omens.** The front page shows the next sign still to come for each prophecy the players know.
576. [x] **Fulfilled.** A prophecy whose signs have all come to pass says so, and the numbers page lists prophecies
    and how close each is.
577. [x] **Signs in the log.** Ticking a sign offers to note it in the latest session's log.
578. [x] **When it came to pass.** A sign ticked off keeps the in-world date it came to pass, shown beside it.
579. [x] **Prophecies in the palette.** Ctrl+K "omens" or "prophecies" lists them with how close each is.
580. [x] **Bound to a prophecy.** A quest linked to a prophecy says so, with how close the prophecy is.
581. [x] **A full sweep.** Run the whole browser suite again and compare it with the last sweep.
582. [x] **Riddles.** A handout can carry a riddle's answer, which only the GMs ever see.
583. [x] **Guesses.** Players answer a riddle on its handout; the server checks the guess (any case or punctuation)
    and records who solved it.
584. [x] **Hints.** GMs list hints for a riddle and reveal them one at a time.
585. [ ] **Riddles solved.** The numbers page lists the riddles and who solved each.

## Ideas parking lot

## Log
- Character Forge, table tools, world wiki, admin, maps, web, sessions, standings, discussions, search shipped.
- Deep world builder: place hubs, quest boards, atlas, map drawers, Build console shipped.
- NPC stat blocks, spellcasting with slot pips, SRD spell lists by class, full Forge spellbooks shipped.
- Magic items: 267-item SRD catalog, 18 curses, unique item maker, Magic Items tool, catalog loot, Reference tabs for magic items and spells shipped. Fixed Add-to-world when World wasn't opened yet.
- Shops & economy: SRD gear prices, 19 shop types, 6 town economies, shortages/surpluses/embargoes/festivals with reasons, haggling and buy-back helpers, magic stock by town size, Market tab on towns with restock-all, shop pages with stock tables, Shops & Markets tool.
- Hidden entries, multiple worlds, accounts and roles: worlds table with additive migration (the old world becomes "world-1", existing GMs keep GM access), per-world owner/GM/player roles, GM and player invite links that create accounts with personal codes, world switcher and Worlds page, Members & invites admin, People (site admin), hidden entries with reveal/hide, player characters and journals, player suggestions with GM approve/reject, My things page. Verified the API and migration against a real Postgres engine (PGlite).
- Party page: active and former party members, treasury with coin total and even split, items held and by whom, loot log anyone in the world can add to (GMs or the writer can strike lines; struck lines stay in the database), current quests, handouts (new Handout kind, hidden by default, "Hand out" reveals them), party journal.
- Character sheets: Forge characters save their recipe and rebuild the full sheet in the world; a shared play tracker (HP with damage/heal/temp HP, death saves, conditions, exhaustion, Heroic Inspiration, spell slots, hit dice, short and long rest, coins, inventory, notes), exact level-up from the recipe, manual max HP/AC for hand-made characters, claim an unowned character (GMs can unassign).
- Live updates: entries API answers ?since= with changed entries and removed/hidden ids, using database time; the World page syncs every 20 s while visible (and on returning to the tab), toasts who changed what, and skips redrawing while someone is typing.
- Images: every entry kind has a Picture field (upload, shrunk in the browser to ≤1200 px JPEG, or an https link); images table in Postgres served by /api/images with access checks (private worlds stay private); portraits on entry pages, thumbnails in lists, avatars in town rosters and the party, pictures on handouts.
- Calendar: three original presets, editable months/weekdays/moons/holidays/era, today's date on the world front page and sidebar, month grid with exact new and full moons, holidays and dated events/sessions/journals/handouts, day detail with "make this today" and "+ event on this day", time passes (+day, week, month, custom), coming up in the next 60 days, timeline sorted by calendar date, live sync of date changes. Unit tests for date math and parsing.
- Encounters & travel: ~230 SRD creatures with CR, type and terrain tags; 2024 XP budgets (low/moderate/high); encounter builder (packs, leader plus followers) that never exceeds the budget, with activity and warning signs and D&D Beyond stat block links; chance meetings; d12 area tables saved on regions/areas/towns/places; weather by terrain and season (from the calendar) with the 2024 environment rules; travel pace calculator; map scale and travel times between pins. Unit tests for budgets, terrain and travel.
- Dungeons & Lairs: nine site types, 5/8/12 rooms, history, five-room-dungeon structure (guardian, puzzle, setback, master, reward/twist) with extra fights, traps, treasure, features and empty rooms for larger sites; monsters fitted to the party and themed by site; traps with DCs and damage by tier; treasure with SRD magic items; connected room graph with secret doors and a flowchart map; Add to world saves the site, a hidden page per room and a map with linked pins. Unit tests for connectivity and layout.
- Export & print: whole world, one place and everything inside it, or one kind; GM copy or player-safe copy (no hidden entries, suggestions, secrets or GM-only links); Markdown download and a print-ready page (save as PDF); linked from the World sidebar, Admin backup and search.
- Offline & install: service worker (network first, cached copy offline; /api never cached), PNG and maskable icons, manifest with shortcuts, Install app button, offline/online notices. Verified offline reloads of the tools and the Forge.
- Polish: getting-started checklists for GMs and players (tick themselves off, dismissible per world), keyboard shortcuts with a ? help dialog (g+letter navigation, n for new), axe-core audit of 17 pages in light, dark and phone layouts with zero WCAG A/AA violations (darker brass text, labelled progress bars, focusable preview), performance with 2,500 entries (indexed name/parent lookups, relationship web capped to the 250 most connected entries: 6.1 s → 0.2 s, search results capped at 200: 267 → 43 ms).
- Faction clocks: clocks table (additive), served by the standings API; 4–12 segment clocks on factions, guilds, clans, deities, towns, NPCs and quests; GM-only or public; +1/−1; faction turn advances every ticking clock and names the finished ones; Faction clocks page and sidebar link.
- Rumor mill: Rumor kind (truth kept in the GM-only secret), Rumors tab on towns, Rumors page with each rumor's reach, "let rumors spread" (linked towns 60%, same area 50%, same region 25% per round), retellings that exaggerate numbers, swap NPC names or add twists, and say where they came from. Players can suggest rumors. Unit tests for neighbors and spreading.
- Family trees: parent/child/spouse/sibling connections; Family section on NPC and character pages with quick add (links someone who exists or creates them in the same town and house; a child of someone with one spouse gets both parents); clan pages draw the whole house as a generational tree; #world/family/<id> tree around anyone. Unit tests for relations, families and layout.
- What my character knows: "☆ <character> knows this" on every entry for players' own characters; a "What <character> knows" list on the character page, grouped by kind, with a note in the character's words per entry.
- Discord recaps: owner connects a webhook in World settings (validated, stored only on the server, never sent to browsers); GMs get "Post to Discord" on visible entries, which sends an embed with the summary, text, fields, picture and a link back (secrets left out).
- Player comments: comments get an audience (additive column; existing rows stay GM-only) and a hidden flag. Table talk on every entry players can see: members post and reply, edit their own; GMs reply, hide (author still sees it, marked) or delete; visitors to open worlds can read. A Table talk feed across the world, refreshing every 30 s without losing half-written replies. GM discussions unchanged and still private. Also darkened the light-theme warning, success and rarity colors to pass WCAG AA on shaded backgrounds.
- Session prep: GM-only #world/prep (sidebar, search, g then s). Last session with its “next time” notes; where the party is (saved per world, GM-only) with its people, jobs, rumors, shops, the day's weather and a quick encounter; quests in play; clocks closest to finishing; the next two weeks on the calendar; party HP and conditions; loose threads (GM discussions, suggestions, table talk since last session); a shared GM scratch pad; one-click “Start session N” prefilled with players, dates and where things left off. Prep is stored in a new worlds.prep column and never sent to players.
- Who stands where: #world/powers grid of factions, guilds and houses (deities and towns optional): allied, trading, rivals, enemies, at war, serves (directional), secretly works for (GM only). GMs click a square to set it; one relationship per pair, written as the same connections the web and entry pages use, other connections untouched. At-a-glance tallies and tensions (allied with two powers at war). Unit tests for reading, setting, tallies and tensions.
- Members-only site: the site admin can lock the whole site (People tab). Locked, every API call needs a signed-in person except signing in and joining with an invite; signed-out visitors see only a sign-in / join screen (a newcomer's one-time personal code still shows). Open worlds now carry a warning in World settings.
- Your library: #world/library with tabs (bestiary, items, classes, subclasses, species, backgrounds, feats, spells, other), quick-add forms for short summaries, search, D&D Beyond links. Bestiary creatures join encounters (with a "Monsters from" choice: SRD and bestiary / only bestiary / only SRD), area tables, session prep and dungeons; sourced items join every magic item roll (loot, shops, dungeon treasure, Magic Items tool) at about a third of the rolls they fit. Creatures start hidden from players. Unit tests for CR parsing and conversions.
- Library in the Character Forge: Species and Subclass menus gain a "From your library" group (a specific option, or any from the library). Library species use their size, speed and darkvision, list each “Name: text” line as a trait, and borrow names, age and height from a chosen SRD species; library subclasses show their notes on the Forge sheet, the world sheet and the text export. Library picks use their own random stream, so SRD rolls and saved characters are unchanged (600-character comparison against the previous engine), and “any from my library” is saved as the option picked so level-ups rebuild the same character.
- Import notes: #world/import (GMs). Markdown files, a whole folder (Obsidian vaults: front matter, folder names as kind hints, [[links]] kept and tidied, embeds and .obsidian skipped) or a pasted document (heading per entry, or this app's export with kinds, parents, fields, GM secrets, connections and tags). Preview with per-entry kind and include; entries already in the world, repeated, or sharing a name with another kind are flagged and unticked. Created in batches of 25, hidden from players and tagged by default, then parents and connections matched by name. Unit tests for the parser, including an export round trip.
- Library classes: the Classes tab has a structured form (hit die, main ability, saves, skill choices, armor and weapon training, armor worn, main weapon, spellcasting type, ability and borrowed spell list, starting gear, subclass level, features one level per line with optional descriptions). The Character Forge's Class menu gains a "From your library" group; library classes build fully (HP, AC, saves, skills, attack, features with their descriptions, ASIs at the usual levels unless listed, spell slots and a spellbook from the borrowed list) and take library subclasses. Rules-option entries now show only the fields for their category. SRD rolls unchanged (820 characters and 40 NPCs compared against the previous engine; the only change is a fixed height display that could read 4′12″). Unit and browser tests.
- Library spells in spellbooks: spells in the library (with a level, "cantrip" or 0–9, and the classes they're for) join those classes' lists. Forge characters prepare them when "Spells from my library" is ticked (on for new characters, off for ones saved before, so their spells don't shift); they take over some picks on their own random stream, so the SRD picks underneath stay put, and the sheet lists which came from the library. NPC spellcasters use them too. The Spells reference marks them in each class's list and adds a library card; the Classes reference shows library classes. Unit and browser tests.
- Library backgrounds and feats: the Backgrounds tab asks for three abilities, two skills, a tool, an origin feat and gear; the Feats tab for the kind of feat (origin, general, fighting style, epic boon) and a minimum level. The Forge's Background menu gains a "From your library" group; library backgrounds drive ability bonuses, skills, tools, gear, the origin feat (with its text when it's a library feat) and a generic backstory line. With "Spells and feats from my library" on, library feats can take the human's extra origin feat, ASI feats (respecting minimum level), fighting styles and epic boons, on their own random stream. Rules-option fields keep unique keys. SRD rolls unchanged (820 characters, 40 NPCs). Unit and browser tests.
- Next-session scheduler: #world/schedule (members). GMs propose up to ten date-times (three Saturdays prefilled), with a title and note; everyone answers yes / maybe / no per date (merged per person on the server, so simultaneous answers don't clash); the best date (most yeses, then maybes, then earliest) is highlighted, with names per answer and who hasn't answered. GMs lock a date in (stored as the world's next session: shown on the world home and in the side nav), post the poll or the locked date to Discord (with Discord time stamps, so everyone sees their own time zone), close, reopen or delete. New table schedule_polls and column worlds.next_session (additive), served by the party endpoint to stay within the function limit. API tests on real Postgres (PGlite), a migration check from the live schema, unit and browser tests. (The in-world calendar stays in-world; real dates live on the home page.)
- Downtime: a new player kind. #world/downtime lets players file an activity for their own characters (training, crafting, carousing, research, work, crime… with days, cost and what they do), optionally kept between them and the GMs; GMs get a "Waiting for a GM" queue (count in the side nav) and write each outcome, which the player then sees. Every character page has a Downtime section with its history and a File downtime button. Schema fields can now be GM-only: the server keeps outcome and resolved date whatever a player sends, and the edit form hides them from players. API tests on real Postgres (PGlite), browser tests as a player and a GM, accessibility audit.
- Fog of war: a Fog button on each map (GMs) opens a brush (reveal or hide, three sizes), Hide all / Reveal all, a "Players see the fog" switch and a hidden-share readout. The fog is a coarse grid (about 64 cells across) stored as packed bits in the new maps.fog column (additive); the browser stretches it over the map with soft edges, translucent for GMs and opaque for players. The server sends players only the pins outside the fog, in the map and the map list; saving pins keeps the fog. The page says plainly that the picture itself is still sent whole. Unit tests (encoding matches Node's base64), API tests on real Postgres, browser tests as GM and player.
- Session recap drafts: a Draft recap button (Session Log and Session prep, GMs) opens a new session entry filled in from everything since the last session: picking up from its "next time" note, new or newly revealed entries, quests that moved, downtime outcomes, treasury coin and items (also in the Loot field), standing changes and clocks, plus the active players and the in-world date. Only what players can already see goes in, so it's safe to post to Discord after editing. The activity API gains ?since= (additive). Coin helpers moved to economy.js so the recap builder is pure. Unit, API (PGlite) and browser tests.
- Show to the table: a GM button on every entry page. It stores { entry, time, who } in the new worlds.shown column (additive), revealing the entry first if it was hidden (recorded in its history). Everyone else with the world open gets a pop-up at the next sync (about 20 seconds) with the picture, summary, handout text and who it's from; someone who opens the world within two hours still sees it once. The party page keeps a "Last shown at the table" line. API tests on real Postgres (PGlite), browser tests for the GM, a player at the table and a late arrival.
- Split the loot: GMs get a "Split the coin" panel in the party treasury: an amount (the whole treasury by default, capped at what's there), a share count per active character (0 leaves someone out) and a live preview in gp/sp/cp. Splitting records one ledger line taking the coin out, then adds each share to that character's sheet coin (keeping the rest of the sheet, retrying once if someone saved it meanwhile); anything that doesn't divide evenly stays in the treasury. No server changes. Unit and browser tests.
- Attitudes: how NPCs, factions, guilds, houses, deities and towns feel about each player character (Devoted, Friendly, Indifferent, Wary, Hostile, with an optional why). Stored on the character as a GM-only field, so a player saving their sheet can't change it. GMs set them from the character page (pick anyone in the world) or from the NPC or power's page (a row per active character); players see them on both. Session prep shows each local NPC's attitudes under their name. Left out of Discord posts. Unit, API (PGlite) and browser tests.
- Private notes: a "My notes" box at the bottom of every entry page (members), saved on Save, on leaving the box, or with Ctrl+Enter, and opened automatically when there's a note. My things lists all of them. Stored by the comments API in a new 'note' room (no schema change): one per person per entry, readable and changeable only by the writer, never returned by GM discussion, table talk, the table feed or the GM inbox, and not even visible to GMs or the world owner. API tests on real Postgres (PGlite) for every read path, browser tests.
- Quest objectives: each quest page has an Objectives checklist with a progress bar. GMs add steps (optionally secret for now), tick them, reveal or hide them, move them up and remove them; players see the open steps read-only. Progress badges (done/total) show on quest boards and the party page's current quests. Stored as a GM-only hidden field on the quest; the server strips secret steps from every response players get (full load, sync and single entry) and keeps them out of Discord posts. Unit, API (PGlite) and browser tests.
- What's new: a "Since your last visit" card on the world home lists what other people did since your previous sitting: session logs, handouts, your characters' resolved downtime (all of it for GMs), quests that moved, new and updated entries, and table talk. "Got it" dismisses it for the rest of the sitting. The server keeps the mark per member (new columns members.seen_at and prev_visit, additive): a load more than three hours after you were last active starts a new sitting, and the 20-second sync keeps a sitting alive. The site admin, who has no member row, gets the same rule from browser storage. Unit, API (PGlite) and browser tests.
- Printable session sheet: a Printable sheet button on session prep opens #world/sheet (GMs): the session number and dates, the party's AC, HP and conditions, where they are with today's weather (the same roll prep shows), who's around with their attitudes toward the characters, jobs and rumors, active quests with their open steps (secret ones marked), clocks closest to finishing, a rolled encounter (with Another encounter) and the GMs' prep notes. Print hides everything but the sheet and lays it out in two columns; the test world prints on one A4 page. Browser test (including a PDF render) and accessibility audit.
- Attendance and XP: each session page has an Attendance and XP panel (GMs): tick who came (prefilled from the session's players line), XP each or a total split evenly, and a milestone switch. The party page adds it up in an Advancement table (sessions, XP toward the next level on the 2024 table, level) with a "Level N due" badge linking to the character. A milestone stays owed until the character's level passes the level they had at that session, so levelling up clears it. Stored as a GM-only hidden field on the session; players see who came and the XP. Unit and browser tests.
- Reveal with contents: place pages get a "Reveal with contents (N)" button (GMs) when the place or anything inside it is hidden. It opens a preview listing the hidden sub-places, people, items, quests and the place's hidden maps, grouped and all ticked, with All / none; Reveal makes the ticked ones visible in one batch request (entries PATCH {ids, visibility}, additive, GMs only, each reveal recorded in history) and un-hides the ticked maps. Suggestions are left alone. API (PGlite) and browser tests.
- Items in inventories: under a character's inventory on the world sheet, "Items on this sheet" lists every world item, library item or SRD magic item named in it (whole words, longer names first, each once, apostrophes either way; names under five letters ignored), with rarity, attunement and what it does; world items link to their pages. It updates as you type. Unit and browser tests.
- Quick note: a floating "✎ Note" button on world pages (members) and the j key open a small box. The note is saved as a journal entry titled from its first words, with its kind (Session notes by default) and which of your characters wrote it; on an entry page it's linked to that entry (a connection plus an "About [[Name]]" line). You stay on the page. Hidden when printing and off world pages. Unit and browser tests.
- Roll tables: a new kind, Roll table, that players can make too (theirs go live like journals). One result per line, with "3x …" weights or "1-4: …" die ranges, # comments, {2d6+1} dice, {a|b} choices and [[Other table]] references rolled up to three deep. Each table's page has Roll / Roll 3, the last dozen results (Copy, Notebook, Add to world) and every line with its chance; the Table Tools get a "Your tables" tool to roll any table in the open world. Import recognises "Roll tables" folders. Unit and browser tests.
- Search filters: the world search page has a filter bar: words (every word must match; exact names, then names starting with them, then names, then summaries rank first), kind, tag, inside a place (the place and everything under it) and, for GMs, hidden-from-players or suggestions only, with Clear filters. Filters live in the link (#world/q/<words>?kind=…&tag=…&in=…&state=…), so a filtered search can be bookmarked; tag chips still open "Tagged #…". Unit and browser tests.
- Entry templates: GMs press "Save as template" on any entry and name it; the new-entry form then offers "Start from a template…" (this kind's first), which fills in the summary, text, fields, tags and GM notes, plus a Manage list to delete old ones. Play state, Forge recipes, what a character knows, attitudes, attendance and rumor spread are never copied. Stored per world in a new worlds.templates column (additive), sent only to GMs. Choosing a draft for the form you're already on now redraws it. API (PGlite) and browser tests.
- Private map markers: on any map they can see, members press "+ My marker", click the spot, and give it a label and note. Markers show dotted on the map and in a "Your markers" list, and can be edited, moved or deleted. Only the person who made a marker ever gets it back (not other players, not GMs); they're never pins. New map_marks table (additive), handled by the maps endpoint (up to 200 per person per map). API tests on real Postgres (PGlite) and browser tests.
- Restore versions: an entry's History (GMs) now reads as sentences ("Bea edited it", "Admin revealed it to players"), marks the current version, and for each edit lists what changed, before → after, field by field. "Restore this version" (with a confirm) saves the entry back as it was then as a new edit, so history keeps everything; live state (sheet play state, what a character knows, rumor spread, attendance, attitudes) and who can see it stay as they are now. No server changes. Unit, API (PGlite, against real snapshots) and browser tests.
- NPC table cards: #world/cards (GMs) prints one compact card per NPC: role, ancestry, class and where they are, the summary, looks, voice, manner, wants, the first line of their stat block, how they feel about each character, and their GM secret. Open it from session prep ("NPC cards" for the party's location), from any place ("NPC cards" for everyone inside, key NPCs first; the dead are left out) or from an NPC ("Table card"); with no place it shows the key NPCs. ✕ drops a card from this print; printing gives two columns with nothing else on the page. Browser test (with a PDF render) and accessibility audit.
- Saved encounters: a new Encounter kind (GM, hidden from players by default). Every rolled encounter card (Encounters tool, a place's wilds, session prep, the printable sheet) has "Save encounter" for GMs, which opens the new-entry form filled in: a name from the monsters, the place it was rolled for, difficulty, activity and the full rolled encounter, plus "When it happens" and "Tactics" to write. The entry page shows the encounter card; connect it to a quest like any entry. Session prep lists encounters saved at or inside the party's location under "If trouble comes". Browser tests and accessibility audit.
- Party bonds: character pages have a Bonds section: the character's player (or a GM) picks a bond (sibling, childhood friend, rival, owes a debt to, saved the life of, sworn to protect, in love with, mentor of, keeps a secret from, distrusts, old comrade of) and another active character; bonds others declared toward the character show too. The party page lists all bonds between active characters. Bonds are ordinary connections between the character entries (so the relationship web shows them), the labels join the connection suggestions, and removing one leaves other connections alone. Unit and browser tests.
- Phone pass: swept 23 pages (everything added since the last phone review, plus the Forge, reference, maps and library) at 375 px as a GM and as a player, checking sideways scrolling, elements wider than the screen, dialog fit and controls under 24 px tall. Fixed the session Attendance panel (it overflowed), gave death-save and slot pips, the Forge's ↻ rerolls, link-style buttons and sliders a larger tap area on touch screens (unchanged look; a near-miss tap now lands, checked with touch emulation), and left room at the bottom of world pages for the floating Note button.
- What needs writing: #world/todo (GMs, linked from the GM buttons) lists thin spots with an Edit button each: entries with no summary or description, NPCs with no voice or wants, towns and locations with no NPCs anywhere inside, Active or Available quests with no objectives, entries connected to nothing (no place, no connections either way), and entries hidden from players for over a month. Sessions, journals, downtime, library entries, roll tables, encounters, characters and handouts are left out; suggestions too. Unit and browser tests.
- Sessions on the calendar: session logs with an in-world date (Draft recap and Start session fill it in) were already placed on the calendar; they now stand out there (▶ and a tint, "Played: …" on hover), and the History & Events timeline merges them in date order with a "Played" tag and the real date they were played, so the world's history and the table's read as one line. Checked that dates written with a weekday parse. Browser test.
- Faster first load: every page used to load all 91 scripts (897 KB) before showing anything. Now app.js loads each section (table tools, Forge, world, reference, admin) the first time it's opened, the menu and search use a tiny tool list, the search palette loads its rules and item data on first open, the j shortcut loads the quick note when pressed, rarely used world pages (relationship web, prep, who stands where, library, import, export, printable sheet, what needs writing) load when opened, and the world store reaches the Forge and magic-item rolls through a small hooks module instead of importing them. First load is now 28 scripts / 341 KB for the Forge, 36 / 459 KB for a table tool and 75 / 685 KB for a world page. A few seconds after the first page is up, the other sections are fetched quietly, so they open instantly and (through the service worker) still work offline. Quick switching between pages shows the last one opened. Forge output unchanged (820 characters); the full browser suite (28 scripts), lazy-loading flow checks and the accessibility audit pass.
- Link suggestions: typing [[ in any text box in a world (entry forms, quick notes, table talk, private notes, dialogs) opens a list of matching entry names (names starting with what you typed first, then word starts, then anywhere), with the kind beside each. ↑ ↓ move, Enter or Tab picks, Esc closes, or click one; picking finishes the link as [[Name]] (reusing a closing ]] already there). Screen readers get a listbox with the active option announced.
- Bulk actions: a Select button (GMs, lists of two or more) on every entry list (including the timeline and session log) and on search results puts a tick box on each entry and a bar under the list: All / none, Reveal, Hide, Add tag or Remove tag (with existing tags suggested), Move into a place (or out of any place), Done. The selection stays across the redraw after each action. The entries API's batch PATCH takes add_tag, remove_tag or move_to besides visibility (GMs, up to 300 ids); moving into a place skips that place and the places above it so nothing ends up inside itself, and only regions, areas, settlements and locations can be targets. Every change bumps the version and lands in the history. Shared helpers in js/bulk.js (unit tested); API tested against PGlite.
- Your own fields: GMs open "Your own fields" on any kind's list (or "+ Your own fields for …" at the foot of the edit form) and add up to 12 fields per kind: a name, short text / long text / a choice from a list, and Everyone or GMs only; reorder, rename or remove them. Stored additively in worlds.custom_fields (jsonb) with stable x_ keys, so renaming keeps values. They show on the form (after the built-in fields) and on the entry page, in templates and in exports (GM-only ones left out of player-safe copies). GM-only fields are never sent to players, not even on their own characters, and a player's save keeps their GM-written value. Removing a field keeps the values in the entry, so adding it back brings them back. Settings PATCH {custom_fields: {kind, list}}; js/custom-fields.js unit tested; API tested against PGlite (14 checks).
- Session zero: #world/zero (sidebar "Session zero", with a "new" badge until read; GMs always see it). GMs write the primer: the game, tone, house rules, safety tools, lines and veils (one per line); members see it as a page. Everyone can answer privately for the GMs: a 19-topic checklist (fine / veil / line), their own lines and veils, a free note, and "don't show my name to the GMs"; only the GMs see answers, anonymous ones arrive without a name or time. GMs get "What the table told you": who wants a line or a veil on each topic, free-text lines and veils, notes, and what isn't on the page yet (the strictest answer wins) with one-click "Add to lines / veils", plus who has read it and who hasn't. Opening the page marks it read; until then the world front page shows a "Before your first session" card. Additive: worlds.primer (jsonb) and a zero_answers table; routes on the party API (no new function). js/zero.js unit tested; API tested against PGlite (13 checks).
- Secrets and clues: a card on session prep (GMs) holding a running list of secrets the party could discover, each one line that can [[link]] entries (link suggestions work in it). It nudges toward about ten open ones; ticking one marks it found in the coming session with who and when, unfound ones carry over, found ones fold away under "Show found" (and can be unticked); edit in place, remove. Open secrets print on the session sheet with tick boxes. Stored in the GM-only prep record as prep.secrets; the server applies one change at a time ({secret: add | found | text | remove}) and saving the scratch pad now merges into the stored prep, so neither drops the other. js/secrets.js unit tested; API tested against PGlite.
- Character goals (done before 63, which uses them): a Goals card on every player character's page. The player and the GMs add goals (short or long term, optionally kept from the party), mark them open, advanced or done, and remove them; text can [[link]] entries. Other players see the character's goals except the kept ones (the server filters them out of every response, including live updates). Session prep lists each active character's open goals under "Wants". Stored as JSON in the character's hidden goals field; js/goals.js unit tested; visibility tested against PGlite. Exports now skip hidden JSON fields.
- Spotlight tracker: a Spotlight card on session prep ranks active player characters by how often the last four session logs name them ([[Name]], the full name, or a distinctive first name, whole words only), out of the sessions each was at (from attendance; sessions they missed don't count against them). Characters named in under half their sessions get "due a turn"; each row says when they were last named and lists up to two open goals as hooks. js/spotlight.js unit tested.
- Link the mentions: on an entry's page GMs get a folded "N names here could be links" card listing other entries whose names appear as plain text in its summary, description, long fields or GM secret (whole words, matching case, names of four letters or more, nothing inside existing links, a longer name like "Red Hand" always beating "Hand" inside it, even once linked). "Link" turns the first plain mention of that name into a [[link]]; "Link all" does every listed name. The card stays open while you work through it. js/mentions.js unit tested.
- Make a copy: a "Make a copy" button on every entry page (GMs) opens the new-entry form filled from it: name "… (copy)", summary, description, GM secret, tags, connections, place, visibility and fields, leaving behind what belongs to one character or session (play state, what they know, attitudes, goals, attendance, rumor spread, quest objectives).
- Your favorites: a ☆ Favorite button on every entry page for members; starred entries (newest first, up to 12 shown) sit under "★ Favorites" at the top of the world sidebar, for that person only. Kept on the membership (additive members.favorites jsonb, returned with the world load), so they follow the person to any device. PUT {favorite, on} on the party API; tested against PGlite.
- The party on the map: the party's location from session prep now travels with the world load as party_at, but only when the person can see that place (a hidden lair is never given away). Every map draws a ⚑ "The party" token above the pin for that place, or above the nearest pinned place that contains it ("The party (The Drowned Bell)" on the region map); clicking it opens that pin. GMs get "⚑ The party is here" in any place pin's popup, which updates session prep; changing it in prep updates the maps too. Fogged pins stay hidden for players, token included. js/party-pin.js unit tested; visibility tested against PGlite.
- See it as a player: "👁 See it as a player" in the world's GM buttons switches this browser tab into a preview. Every read the page makes carries as=player, and the server (route(), for GMs of that world, GET only) answers as it would for a player with no characters of their own: no hidden entries, suggestions, secrets, GM-only links or fields, kept goals, session prep or other people's session zero answers, and nothing editable. The page refuses every change during the preview, the header badge reads "Player view", and a banner on every page has "Back to the GM view". Tested against PGlite and in the browser. Also fixed an error from the lazy loading: a session change could ask the admin section to draw before it was mounted.
- Quest rewards to the treasury: a Completed quest with a reward shows GMs "Quest complete: pay the reward?" on its page. "Add to the party treasury" opens a check-first dialog with the coin and items read from the reward text ("200 gp, a +1 longsword and 3 potions of healing"; coin words like "50 gold pieces", "two horses", [[links]] and "each" handled), each item with a tick box and quantity, plus room for more; it adds treasury lines noted "Reward: <quest>" against the latest session and records the date on the quest (hidden reward_paid field), after which the page just says when. "Already handled" records it without adding anything. js/reward.js unit tested.
- Who shows up where: NPC pages say "Last seen in Session N (k sessions ago) · in m sessions" under the heading (the existing "Appears in sessions" list stays at the foot). Session prep has "Who might turn up in <town>": people in the party's town (or wherever it is) met before but not in the last two sessions, longest absent first, then key people not met yet, each with their role and when they were last seen. Appearances come from session logs' [[links]] in any text or field, and the sessions' connections. js/appearances.js unit tested.
- Light, dark or automatic: a ◐ / ☀ / ☾ button in the header cycles automatic (follows the device), light and dark; the choice is kept in this browser and applied by a tiny script in the page head before anything draws, so it never flashes the other theme. The browser bar colour follows. Checked with axe in dark mode and at phone width.
- Member profiles: the party page has an "At the table" list of the world's members with their role, pronouns and a short note (when they can play, what they enjoy); each person edits their own row (pronouns with common choices suggested). Pronouns travel with the world load, so character pages read "Played by Pip (she/her)". Additive members.profile jsonb; GET ?members and PUT {profile} on the party API, tested against PGlite.
- Notices from the GMs: a 📣 Notices card on the world front page. GMs post a notice (up to 500 characters, optionally "show until" a date) and take notices down; the newest ten are kept. Members see current notices on the front page, and the newest one they haven't dismissed as a banner over every world page ("Got it" dismisses it in that browser). New notices arrive with the 20-second live sync. Additive worlds.notices jsonb; settings PATCH {notice: add | remove}. js/notices.js unit tested; API tested against PGlite.
- Import from a spreadsheet: the import page has "A spreadsheet" beside the Markdown sources: pick a CSV (comma, semicolon or tab separated, quoted cells with commas and line breaks are fine) or paste rows. GMs choose what the rows are (NPCs, items…) and, per column, where it goes: name, kind of entry, summary, description, tags, located in, GM secret, or any of that kind's fields (the world's own fields too); likely columns are guessed from their headers. "Preview the entries" feeds the same preview as Markdown import (already-there and repeated names flagged, kinds changeable), then entries are created, hidden and tagged if wanted, and placed inside the places named. js/csv.js unit tested. Also fixed the preview's unticked rows failing colour contrast.
- More than one picture: every entry has a "More pictures" gallery (up to 12) near the foot of its page. Whoever can edit the entry adds several uploads at once (shrunk in the browser like the main picture) or https links, and under "Arrange" captions, reorders and removes them; everyone who can see the entry opens them in a viewer (← → keys, Previous/Next, open full size). Stored in a hidden gallery field; the server keeps only real image addresses (uploads or https links). js/gallery.js unit tested; cleaning tested against PGlite.
- Search the talk: world search results end with "In the talk": comments containing the words (two letters or more; % and _ match literally) from table talk the person can see, GM discussions for GMs, and their own private notes, newest first (up to 40), with the match highlighted. Clicking one opens its entry and scrolls to that comment with a brief highlight (opening resolved threads if needed). Comments API GET ?search (members), tested against PGlite.
- Handouts for one player: on any hidden entry GMs get "Give to players…": tick players (with their pronouns) and only they can see it, marked "Just for you" on its page and listed with the party's handouts for them; other players can't see it, open it, comment on it or get it through live updates, and the GM secret stays hidden. GMs see "GMs + N players" on it; "Reveal to players" works as before, and unticking everyone takes it back. Additive entries.shared_with (member ids, non-members dropped); PATCH {id, share}; the entries and comments visibility checks honour it (the GM's player preview doesn't count as anyone). js/sharing.js unit tested; tested against PGlite (10 checks).
- Suggest an edit: players get "Suggest an edit" on entries they can see but not edit: a dialog with the summary, description and the kind's ordinary fields (not GM-only, hidden, picture or structured ones like stat blocks), plus "why". Only real changes are kept; an unchanged form is refused. GMs see the waiting count in the Suggestions button, and on the Suggestions page each suggested edit as before → after, with the player's note and a warning if the entry changed since; Accept applies it (recorded in the history; secrets and everything else untouched), Decline turns it down. Players see their suggested edits and how they went on My things. Additive edit_suggestions table; entries API POST {suggest_edit}, GET ?edits, PATCH {edit_id, decision}. js/edit-suggest.js unit tested; tested against PGlite (11 checks).
- Hand it over: a character's sheet has "Give to a party member…" for its player and the GMs: pick who, an item from the inventory (counts like "3 potions", "Rope x2" or "Torch (5)" are understood, with how many to give) and/or coin. The server moves them in one step: never more coin than the giver has, nothing that isn't in the inventory, the item's line reduced or removed on one sheet and added as "… (from <giver>)" on the other, both recorded in the history. A sheet that never saved its own coin or inventory starts from what the page shows (starting gear and gold). Entries API PATCH {give}. js/handover.js unit tested; tested against PGlite.
- Print a character: "Print" on every character sheet opens #world/print/<id>, a paper-friendly page for anyone who can see the character: portrait, level, species, class, background and player (with pronouns); AC, hit points, initiative, speed, proficiency and passive Perception; the six abilities; conditions; saves, skills, attack, spells, resources, proficiencies and features from the saved Forge sheet (hand-made characters show their own numbers and sheet text); coin and gear, notes, open goals and the story. Printing hides the app around it and keeps boxes from splitting across pages. Checked as a PDF.
- Is that name taken?: under the name field of the entry form (new entries and renames), a polite line says "⚠ Already in the world: Brindle (Settlement)" when the name matches an existing entry (ignoring case, accents, punctuation and a leading "the"), or lists up to five similar names: one-letter typos and swapped letters (two for long names), a plural, or a name inside a longer one ("Aldous Vane" / "Mayor Aldous Vane"), each linked. It never blocks saving. js/name-check.js unit tested.
- Quick polls: a "Quick polls" card on the world front page. Any member asks a question with two to eight choices; members vote with one click (again to take it back, or pick another), and everyone sees the count, a bar and who chose what. Whoever asked, or a GM, closes, reopens or removes a poll; closed polls fold away with the winner starred. The card refreshes every 20 seconds while open (not while someone is writing). Votes change one person at a time, so people voting at once don't overwrite each other. Additive table_polls table; party API GET ?polls, POST {poll}, PATCH {poll_id, vote | closed}, DELETE ?poll. js/polls.js unit tested; tested against PGlite (10 checks).
- Measure on the map: maps with a scale get a "Measure" button: click points along a route and a dashed line is drawn over the map, with the total in miles, each leg, and the travel time at fast, normal and slow pace; Undo point, Clear, Done (or Esc). Distances use the map's real shape. Also fixed the pressed map-tool buttons (Add pin, Fog, My marker, Measure) failing colour contrast in both themes. js/map-route.js unit tested.
- Keep going offline: when a character sheet change (hit points, conditions, coin, inventory, notes…) or a private note can't be sent because there's no connection, it's kept in this browser's outbox instead of failing (only the latest version of each sheet or note), and a "⏳ N changes waiting to send" marker shows. They're sent when the connection comes back (on reconnecting, every 20 seconds, or the next time the app opens, even after a reload), then a toast says so. A waiting sheet change is laid onto the entry as it is by then; anything the server refuses outright is reported rather than retried forever. Changes refused by the GM's player preview are not queued. js/outbox-core.js unit tested; tested in the browser with the connection cut and restored.
- Time and light: a "Time and light" card on the world front page and in session prep shows the in-world hour ("23:30 · night") and the lights burning (torch, lantern, candle, Light, continual flame or anything named), each with a bar and the time left, turning red near the end. GMs move time on (+10 min, +1 hour, short rest, long rest), set the hour, light and put out lights; lights burn down as time passes and the toast says what went out; passing midnight moves the world calendar on a day. Players see it update live (it travels with the 20-second sync). The front page now puts notices, quick polls and time side by side on wide screens. Additive worlds.clock jsonb; settings PATCH {clock}. js/clock.js unit tested; tested against PGlite.
- Start here: GMs add up to twelve entries to "Start here" with a button on their pages, and reorder them on the front page. The list (name, kind, summary) leads the world front page, open for newcomers (no earlier visit, or session zero not read yet) and folded for everyone else, and also shows on the session zero page. Players only see the entries they're allowed to see. Additive worlds.start_here jsonb; settings PATCH {start_here: {id, on} | {order}}; tested against PGlite.
- Notices and polls to Discord: when the world has a Discord channel, the notice form has "Also post to Discord" (ticked by default) and the quick-poll form has "Also post it to Discord" (unticked). The post carries the notice (with who and until when) or the question with numbered choices and a link back to vote. The notice or poll is saved either way; if Discord refuses, the page says so. Tested against PGlite with Discord stubbed (what's posted, and what happens when it fails).
- Tag pages: "Tags" in the world sidebar (with how many there are) opens #world/tags, every tag with how many entries carry it, most used first, and the first line of its description. A tag's own page (the tagged search) shows its description, which GMs write or edit in place ([[links]] work; everyone who can see the tag reads it), plus a link back to all tags. Additive worlds.tag_notes jsonb; settings PATCH {tag_note: {tag, text}}.
- Phone and accessibility pass: swept 17 pages as a GM and 9 as a player (everything added since 58: front page with notices, polls, time and Start here; session zero; prep with secrets, spotlight and who might turn up; lists in Select mode; tag pages; entries with galleries, mentions, sharing, rewards and goals; the printable character; maps with the ruler; spreadsheet import; suggested edits; party; My things) at 375 px in light and dark, plus the six new dialogs, checking sideways scrolling, elements running off screen and the accessibility checker. Fixed: held handouts on the party page were dimmed below readable contrast (now a tinted background instead), and date and time inputs (the clock, notice end dates) missed the app's input styling in dark mode. Everything else was clean.
- Undo after deleting: moving an entry to the bin (from its form) or rejecting a suggestion shows "… moved to the bin · Undo" for about seven seconds; Undo brings it back and opens it (or puts the suggestion back on the list). Players can now restore their own entries as well as delete them (the server still refuses anyone else's). Toasts are now announced to screen readers (a polite live region).
- Share a marker with the party: the marker dialog has "Show to the party". Shared markers show for everyone in the world in gold with the maker's name ("We camped here · Pip"), open to a read-only note, and are listed under "Shared by the party" beside the map; only their maker can move, change or delete them, and they stay private by default. Additive map_marks.shared column; maps GET returns `party` markers; tested against PGlite.
- Follow an entry: "🔔 Follow" beside the favorite star on every entry page. Changes other people make to followed entries come first in "since your last visit" (as "You follow", not repeated below), arrive live as their own toast ("Ring the Bell (you follow it) changed by Bo"), and the sidebar's "🔔 Following" list (opened when something changed) puts a dot on each one changed since your last visit. Kept per member and world (additive members.following, returned with the world load); party API PUT {follow, on}. whatsNew unit tested; storage tested against PGlite.
- Formatting in descriptions: long text everywhere (descriptions, notes, handouts, comments, goals, secrets, tag descriptions…) now understands **bold**, *italic* or _italic_, "- " and "1. " lists, "## " small headings and "> " read-aloud boxes, alongside [[links]]; summaries take bold, italic and links on the entry page. Arithmetic like "2 * 3" and names like snake_case are left alone. Pages are built from a parsed tree, never HTML strings. Cards, the session sheet, NPC cards, the printable character and other one-line places drop the marks; exports keep them (they're Markdown already). The description field says how. js/rich.js unit tested.
- Recently viewed: opening an entry remembers it (in this browser, per world, the last ten). The world sidebar has a folded "🕘 Recently viewed" list (leaving out the page you're on), and Ctrl+K with nothing typed shows the last six first; typing searches as before. js/recent.js unit tested (including blocked or broken storage).
- Copy a place with what's in it: "Make a copy" on a region, area, settlement or location with things inside opens a dialog: the copy's name, "Bring what's inside" (with a count by kind) and "Hide the copies from players for now". The copies are made level by level, each inside its copied parent, in batches; connections between copied entries point at the copies (a second pass catches links to things copied later); player characters, sessions, journals, downtime and suggestions stay behind, as do play state, attitudes, goals and galleries. Copies keep their names and get the tag "copied". A place with nothing inside goes straight to the usual copy form. js/copy-place.js unit tested.
- Merge two entries: GMs get "Merge into…" on entry pages. The dialog suggests entries with the same or a near name (typos, plurals) and offers every entry by name. The kept entry gains the spare's summary (if it had none), description and GM secret (joined), fields it lacked, tags and connections; places and people inside the spare move inside the kept one; other entries' connections and [[mentions]] point at the kept one ([[Kept|Spare]], so their text reads the same); table talk, GM discussion, edit suggestions, standing history, clocks, maps and map pins move over; the spare goes to the bin and both changes are in the history. PATCH {merge}; js/merge.js unit tested; route tested against PGlite.
- Say it right: every entry form has "Say it" beside the name (e.g. BRAM-well; one line, up to 80 characters, stored as fields.say on any kind). It shows in italics under the name on the entry page, beside the name on NPC cards, in the session sheet's party table and "Who's around" list, and in Markdown exports. The sidebar's "Say it right" page is an A–Z pronunciation guide for everything players can see (accents folded, numbers under #). js/say.js unit tested; storage tested against PGlite.
- Where the party has been: setting where the party is (session prep, or "The party is here" on a map pin) adds a stop with the time, the in-world date and the GM; staying put adds nothing; the last 300 are kept in the world's session prep (prep.journey, no new column). The world load sends each person the stops at places they can see (a hidden place in between doesn't split a stay). Maps draw a dotted route through the stops at each place's pin, or the pin of the nearest place containing it, with a "Route so far" switch. The party page's "The journey" lists the stops newest first with in-world and real dates (older ones folded); GMs can strike a mistaken stop (PATCH settings {journey_remove}). js/journey.js unit tested; routes tested against PGlite.
- Wish lists: a character's page has a "Wish list" for its player and the GMs (other players never receive it): add a wish, tick it off when it comes true (it's struck through and dated), or remove it. Session prep's party card shows each character's open wishes under their goals, and the party treasury marks items held that answer a wish ("★ Pip wishes for this"; the whole name, or every meaningful word of the wish, e.g. "an elvenkind cloak" matches Cloak of Elvenkind). Kept as fields.wishes on the character. js/wishes.js unit tested; privacy tested against PGlite.
- Read-aloud in prep: session prep has a "Read-aloud" card and the printable session sheet a "Read-aloud" block: the "> " boxes from what's planned for the next session, in order: entries the GM scratch pad [[mentions]] (in the order mentioned), then where the party is and everything inside it, then quests in play, each entry once. Boxes come from the description, then long fields (labelled, e.g. Notable features), then the GM secret. The card keeps formatting; the sheet prints plain text in full. js/read-aloud.js unit tested.
- Likely duplicates: "What needs writing" links to a GM page of entry pairs that may be the same thing: the same name (across kinds) or a near one within a kind (a typo or two, "The", a plural, one name inside the other). Sessions, journals and downtime are left out, and names with different numbers (Session 12 / 13, Room 1 / 2) are never near; that last rule also quiets the "Is that name taken?" check. Each pair shows both entries with their opening lines; "Keep this one…" opens the merge dialog set up to fold the other into it (now finds the right one when both share a name), and "Not the same" is remembered for all GMs (prep.not_dupes; PATCH settings {not_dupe}). js/duplicates.js unit tested; route tested against PGlite.
- Roll a detail: the entry form has a small "Roll" beside fields the app has tables for: an NPC's appearance, personality (with a mannerism), voice, wants and GM secret; a settlement's ruler, known for, trouble and landmarks; and the notable features of a location or area, from its type (tavern, dungeon, ruin, lair, castle, temple, shop, forest, hills, coast, swamp, Underdark, city district), which asks for a type first. Rolling again replaces a rolled value; text someone typed is only replaced on a second click ("Replace?"). js/roll-detail.js unit tested.
- Hall of heroes: when a character's status is Dead, Retired or Missing, their page gets a "Farewell" card where their player or a GM writes how it ended (formatting allowed), when (the in-world date is suggested) and an epitaph. The "Hall of heroes" page (linked from the farewell and the party page's former members) lists them, latest farewell first, with portrait, class and level, the farewell, the epitaph signed by their player, and the sessions they played (on the attendance list, a connection or a [[mention]] in the log: "Played 4 sessions: from Session 1 to Session 6"). Kept as character fields fate, fate_day and epitaph. js/hall.js unit tested; storage tested against PGlite.
- Ask the GM: players get "Ask the GM" in the sidebar (and "Ask the GM about this" on entry pages, which starts "About [[Name]]: "): a private thread with the world's GMs that no other player sees. GMs get "Player questions": every player, unread ones first, with the last message, then each thread to read and answer (answering marks it read). Messages take formatting and [[links]]; anyone can take back their own. The sidebar shows how many are waiting, and the 20-second live sync brings a toast ("The GMs answered you" / "A player asked the GMs something") and refreshes an open thread. Additive gm_questions table; party API GET ?ask, POST {ask}, DELETE ?ask; ask_unread in the world load and live sync. Routes tested against PGlite.
- Quote wall: "Quote wall" in the sidebar (members): add a line, who said it (characters, key NPCs and you are suggested) and the session (the latest is picked). The wall lists them newest first with who added them, with buttons to show one person's quotes (most quoted first); whoever added a quote, or a GM, can take it down. Each world load brings a random quote for the front page ("I lick the door." — Pip, Session 12). Additive table_quotes table; party API GET ?quotes, POST {quote}, DELETE ?quote. js/quotes.js unit tested; routes tested against PGlite.
- Picture wall: "Picture wall" in the sidebar shows every picture in the world as a grid of squares: each entry's main picture and its gallery (with captions), then the maps, each picture once. Filters for kind (with counts, maps included) and tag; the first 120 show, then "Show all". Each square opens its entry or map. Players see only what they can see, and never a fogged map whole (those stay under their fog on the map page). Also: the new card lists (quotes, duplicates, hall, questions) no longer show list bullets. js/picture-wall.js unit tested.
- Contents for long entries: a description with three or more "## " headings gets a small "Contents" box (floated beside the text; full width on phones) listing the parts. Each link scrolls to its heading and moves focus there without changing the page address, so routing and the back button still work. Heading ids are readable and unique (sec-history, sec-history-2). js/contents.js unit tested.
- The world in numbers: "In numbers" in the sidebar: tiles for entries (and how many kinds), words written, sessions played (first to last), player characters (and how many fell) and quests completed; then the most talked-about NPCs (how many other entries mention or connect to them), the busiest places (everything located inside, at any depth), who has written the most entries, and records: the most connected entry, the longest-running open quest and the most common kinds. Built from what the viewer can see, so players never count hidden things. js/world-stats.js unit tested.
- A tidier sidebar: the world's views now sit in three folding groups: At the table (party, session zero, next session, downtime, calendar, table talk, questions, quote wall, GM discussions), The world (atlas, maps, web, who stands where, clocks, standing, tags, library) and Extras (picture wall, in numbers, say it right, and a new link to the Hall of heroes). Open or shut is remembered per browser (Extras starts shut); the group holding the page you're on opens; a shut group shows a dot (and says "something new" to screen readers) when something inside has news. On phones the links stay in a grid.
- Reactions: every table talk comment (on entry pages and in the Table talk feed) and every quote on the wall has a row of reactions: the ones people used, with counts (yours highlighted; press it again to take it back; who reacted shows on hover and to screen readers), and "☺+" to pick one of 👍 😂 😮 ❤️ 🎲. GM discussions and private notes have none. Stored per row as { emoji: { person: name } } in additive reactions columns on comments and table_quotes, changed atomically in SQL so two people reacting at once don't undo each other (comments PATCH {id, react, on}; party PATCH {quote_id, react, on}). js/reactions.js unit tested; routes tested against PGlite.
- Mood music: every entry form has "Mood music" (an https link: YouTube, Spotify, Tabletop Audio, SoundCloud, anything). The entry page shows "♫ Mood music (YouTube)" under the name, opening in a new tab; a place without its own uses the nearest place around it that has some ("Mood music for Brindle"). Session prep's "Where the party is" card offers it, and the printable sheet prints the link. Stored as fields.music on any kind; the server keeps only https links. js/music.js unit tested.
- Birthdays on the calendar: player characters and NPCs have a "Birthday (in-world date)" field (any date the calendar reads: "3 Thawmoon", "3 Thawmoon 1000"). Birthdays recur every year: "🎂 Ann" in the calendar's month grid, "🎂 Ann turns 40" in the day's detail (an age when a birth year was given, nothing before it), and in session prep's "Coming up" for the next two weeks, including across New Year. The dead are left out. js/birthdays.js unit tested.
- Previously on…: the world's front page has a "Previously on… Session 12" card from the latest session the viewer can see: its summary, "Where we left off" (the session's "Next time" field, formatted) and a link to the full session with its in-world date. It's open when the next session is within a week and folded otherwise, so it never crowds the page between campaigns.
- Text size: an "A" button beside the theme switch cycles Normal → Larger (A+, 115%) → Largest (A++, 130%) → Smaller (A−, 90%), remembered per browser and applied before the page draws. Every font size in the stylesheet is multiplied by one --ts variable, so text grows while layouts, maps and pins keep their geometry (no page zoom); printing always uses the normal size. Checked on a phone at the largest size: no sideways scrolling.
- Repeating events: events have "Repeats" (every week, every month, every year) and an optional "Repeats until" date. From their own date on, they come round again on the calendar ("↻ Market day" in the month grid; the day's detail says how often) and in session prep's "Coming up". A week is the calendar's own week length; a monthly event skips months too short for its day. js/repeats.js unit tested.
- Prep checklist: session prep's side column starts with "Before the table (1/3)": the GMs' own steps (add, tick, move up, remove; up to 40). Ticks belong to the session being prepared (the next session's number), so they clear by themselves once a new session is logged, and the steps stay for next time. Kept in session prep (prep.checklist; PATCH settings {checklist, round}). js/checklist.js unit tested; route tested against PGlite.
- Fuller backups: Admin → Backup's "Download backup" now saves the whole world in one file (format 2): entries with GM secrets, the world's settings (calendar, session prep with the journey and checklist, templates, own fields, session zero, time of day, start here, tag pages), every map with its picture (uploaded pictures are packed in) and pins, fog and scale, standing history, clocks, the treasury and the quote wall. The page gathers it from several smaller requests, so no single response outgrows Vercel's limit. "Restore as a new world…" makes a new world you own ("<name> (restored)") and fills it step by step with progress (settings, entries in batches with parents first, maps, then the rest); every entry gets a fresh id everywhere it's referenced, so the original world (or any other) is never touched. Older entry-only backups still import into the current world. Also fixed: map pictures now load in every world, not just your first (their address names the world). Additive only: worlds GET ?backup, POST {restore} and {restore_extras}. js/backup.js unit tested; a full back-up-and-restore round trip tested against PGlite.
- Item cards: "Print card" on an item's page, "Print cards" on the Items list, "Print cards for these items" under the treasury's items held (matched to item entries by name), and #world/itemcards/t:<tag> for a tag. Each card has the name, type · rarity · attunement, a picture if there is one, what it does (properties, else the description, trimmed at a sentence) and value or source; never the GM secret. Printed, they're exactly 63 × 88 mm, three across and nine to a page; ✕ leaves one out. js/play-cards.js unit tested.
- Spell cards: "Spell cards" on the page of any character made in the Character Forge who casts spells prints a card with their class and level, save DC and spell attack, a row of boxes per slot level (or pact slots) to tick in pencil, and their cantrips and prepared spells by level. Any of those spells that are in the world's library get a full card of their own (level, classes, what it does), and the library's Spells tab has "Print these as spell cards"; #world/spellcards prints every caster in the party. The app carries spell names, not the SRD spell texts, so SRD spells appear by name on the caster's card rather than on cards of their own. Same 63 × 88 mm print layout as item cards. Card builders unit tested.
- Who's who: "Who's who" (sidebar, Extras) lists every NPC the session log has met (a session links them with [[Name]] or connects to them), alphabetically: portrait (or an initial), name and pronunciation, role and where they are, their summary in a line, and "Met in 3 sessions · last in Session 12". The dead stay, struck through and tagged. Built from what the viewer can see, so a player's printout never names a hidden NPC; prints two columns to a page. js/cast.js unit tested.
- Missing links: "What needs writing" opens with "Links that lead nowhere yet": every [[name]] in any text (summaries, descriptions, GM secrets, long fields) that matches no entry, ignoring case and spacing, most mentioned first, with the entries that mention it. Pick a kind beside it and "Create" opens the new-entry form with the name filled in; once saved, every mention becomes a link. js/thin.js missingLinks unit tested.
- Add to your calendar: beside "Next session" (front page and the Next session page), "Add to calendar" offers a calendar file (.ics: Apple Calendar, Outlook and most others) and a Google Calendar link. The event is named for the world, runs four hours from the locked date, links back to the world and has a reminder two hours before. js/ics.js unit tested (escaping, line folding, CRLF).
- On this day: when the world has a calendar, the front page shows "On this day: 3 Thawmoon 1040" if anything falls on today's in-world date: holidays, birthdays ("Ann turns 40") and anniversaries of dated events and sessions from earlier years ("50 years ago today: Fall of Brindle"; only dates that name their year count). Quiet days show nothing. js/onthisday.js unit tested.
- Roll a name: the entry form's name field has "Roll" for kinds the name tables cover: NPCs and player characters (from their ancestry or species, e.g. "Hill dwarf" gives dwarf names; otherwise a likely one), settlements, taverns and shops (a location's type), regions and areas, factions and guilds. Same rules as Roll a detail: a rolled name rolls again, a typed one is only replaced on a second click. Unit tested in tests/roll-detail.test.mjs.
- Who has read it: when a player opens a handout they can see, their browser tells the server once per visit (GMs, and GMs previewing as a player, aren't counted). On the handout's page GMs see "👁 Read by Pip (Oct 29) · not yet: Bo". Additive entry_reads table (first and latest time per player and handout); party API POST {read}, GET ?reads (GMs only). Tested against PGlite: hidden handouts and other kinds can't be marked read.
- Coming or not: once a next session is set, the front page asks members "Are you coming?" with "I'm coming" / "Can't make it" (press again to take it back) and shows "Coming: … · Can't make it: … · Not answered: …"; session prep has a "Who's coming" card. An answer belongs to the date it was given for, so moving the session asks everyone again. Additive members.rsvp column; party PUT {rsvp}; the summary comes with the world load. js/rsvp.js unit tested; routes tested against PGlite.
- Picture descriptions: under an entry's picture in the form, "Describe the picture" (up to 300 characters, kept as fields.image_alt). The entry page's picture uses it as its alt text (read by screen readers) and hover title, and the picture wall uses it as the caption; gallery pictures' captions now show on hover too. Small avatars beside names stay decorative. The server keeps a description only alongside a picture. Tested in the browser (with axe) and against PGlite.
- Next and previous: the foot of every entry page has "← Ann" and "Cob →" to the neighbouring entries of the same kind (sessions in number order, everything else by name; suggestions only among suggestions), and [ and ] do the same on the keyboard (listed under ?). Hidden when printing. js/neighbors.js unit tested.
- How far from the party: on a map with a scale, a pin's card says "⚑ From the party: 60 miles: fast 2 days, normal 2.5 days, slow 3.3 days", measured from the party's pin (the place they're in, or the nearest place around it that's pinned). Not shown on the party's own pin or maps without a scale. Also: a full accessibility (axe), phone-width and dialog sweep of the app after #97–#129: all clean.
- Forgiving search: in Ctrl+K and the world search, a word of four letters or more also matches a name or tag word a typo away (two for long words), whole or as the start of a longer word: "brimdle" finds Brindle, "silvrhand" The Silverhand, "nroth" the north tag. Near misses rank after everything that matched as typed, and descriptions still need the exact word, so results stay predictable. nearWord unit tested.
- Quests by status: the Quests & Plots list is grouped: In play, On offer, Rumored and No status yet (open), then Done and Failed or abandoned (folded), each with a count; bulk actions still work across the groups. js/quest-groups.js unit tested.
- New table talk: the world load brings the times of table-talk comments others posted since your last visit (at most 50; on entries you can see; hidden ones only for GMs), and the sidebar's Table talk shows "2 new" (a folded "At the table" group gets its dot). Opening Table talk clears the count in this browser. Tested against PGlite.
- Pages the party writes together: GMs get "✎ Open to the party?" on any entry (fields.party_edit). Once open, the page says "The whole party writes this page" with who changed it last, every player who can see it gets Edit, and their form is just the summary, the page text and tags. The server keeps everything else as the GMs set it (name, kind, fields, place, connections including secret ones, GM secret, who sees it), only GMs can open or close a page, the usual version check stops two people overwriting each other, and every save goes into the history. Tested against PGlite.
- Join by QR code: Admin → Members has "QR code" beside each invite link. It opens a big code (always black on white, so it scans in dark mode too) with the link written underneath; pointing a phone camera at it opens the invite. The app makes the code itself (js/qr.js: byte mode, error correction M, versions 1–10, any text up to 213 bytes, no outside library). Checked by decoding with an independent reader (jsQR, test-only) at every version from 1 to 10, with UTF-8 text, and from a screenshot of the dialog; unit tests cover version choice and the fixed patterns.
- Conditions at a glance: on a character's sheet, each condition chip says what it does on hover, and "What these do" (open while any apply) lists the effects of the character's current conditions and Exhaustion, with every other condition under "All conditions". The Reference section has a Conditions tab. Short paraphrases from the SRD 5.2 (CC BY 4.0, credited); js/conditions.js now holds the list and the texts (unit tested that every condition has one).
- Travel takes time: when a GM moves the party ("The party is here" on a map pin) on a map with a scale and the world has a calendar, a dialog offers to move the calendar on: "From Brindle to Sedge is 60 miles. Today is … — 2 days (fast pace) · 3 days (normal pace) · 4 days (slow pace) · Not now". A trip under a day's march asks nothing. travelDayOptions (js/map-route.js) unit tested.
- Rename a tag: a tag's page has "Rename tag" for GMs: type a new name, or pick an existing tag to fold this one into it. Every entry with the tag changes in one go (no doubles when an entry already has the other tag), each change goes into the history, and the tag's description moves with it unless the other tag has its own. PATCH entries {rename_tag: {from, to}}; tested against PGlite.
- Their story so far: a player character's page has "Their story so far": sessions played (attendance, connections or [[mentions]] in the log; "from Session 1 to Session 12"), completed quests connected to them or mentioning them, goals reached, wishes come true (only for those who can see the wish list), and the items whose holder is them. Built from what the world already records; nothing new to fill in. The party's journey is the party's, so it stays on the party page. js/story.js unit tested.
- Who holds what: maps have a "Who holds what" switch. Each pinned place is held by a faction, guild or house when it says so itself (a connection labelled controlled / ruled / held / owned / claimed / governed / run by, or its Ruled by, Controlled by, Led by or Owner field naming one), otherwise by whoever holds the place around it. Held pins take that power's colour, their labels say "held by …", and a key above the map lists the powers with counts. Colours are the reference categorical palette in fixed order (light and dark steps), assigned by each power's place among the world's powers sorted by name, so a power keeps its colour whatever is on screen; a ninth and later share a neutral grey. js/control.js unit tested.
- Between sessions: session prep opens (after "Last time") with "Between sessions (since Session 4)": journal entries written since the latest session was logged (with who wrote them), downtime asked for or changed (marked "to resolve" until it is), new suggestions, player questions waiting for an answer, and how much table talk there's been, each linking to where to deal with it. Quiet weeks say so. js/between.js unit tested.
- Set a field for many: the bulk bar (Select on any list) has a field picker with the short-text and pick-list fields of the kinds on the list (status, role, ancestry, type, rarity…), a value box (a list of the allowed values for pick-list fields; blank clears) and "Set". It changes every selected entry whose kind has that field, refuses a value any selected kind doesn't allow, skips entries already set that way, and records each change in the history. PATCH entries {ids, set_field}; settableFields and setFieldValue (js/bulk.js) unit tested; route tested against PGlite.
- A new world like this one: the Worlds page's "Create a world" form has "Start from": a blank world, or "Like <world>" for any world you GM. The new world (yours) gets that world's calendar as it stands, own fields, entry templates, session zero page and tag descriptions; none of its entries, members, maps or play state, and the original is untouched. POST worlds {name, like}; tested against PGlite (players can't copy, the original keeps its entries).
- More shortcuts: on an entry's page, e opens the edit form (when you may edit it), s stars it and f follows it, like pressing the buttons; ? lists them with the others. Ignored while typing in a field.
- Export to a spreadsheet: every kind's list has "Download CSV": Name, Kind, Summary, Located in, Tags, one column per field (by its label), Description, and for GMs the GM secret (as Secret; players' files never have it, and only hold what they can see). UTF-8 with a byte-order mark so accents survive Excel, cells quoted properly, and anything a spreadsheet would run as a formula (=, +, @, or - before a number) gets a leading apostrophe. The columns are the ones "Import from a spreadsheet" recognises, so a file goes back in as it came out (unit tested as a round trip).
- Pin a note to the session: session prep opens with "📌 For next session": one-off notes GMs pin between sessions (a promise to a player, a clue to drop, a rule to check), ticked off when done and cleared in one go; what's still open prints at the top of the session sheet as "Remember". Unlike the prep checklist, these don't repeat. Kept in session prep (prep.reminders; PATCH settings {reminder}). js/reminders.js unit tested; route tested against PGlite.
- Faction news: after a faction turn, a "Tell the players?" dialog offers a ready-made notice of what visibly changed ("The Silver Hand: “Takeover” has come to pass", "… draws closer"), finished plans first, kept under the notice limit. Secret clocks and clocks on hidden or suggested entries are left out, and numbers never show. GMs edit it, optionally send it to Discord, and post it, or skip. Nothing is posted unless they choose to. js/faction-news.js unit tested.
- Places at a glance: a settlement's page opens with a small panel: who leads it (linked when the "Led by" name is an entry), who holds it (from Who holds what, noting when it's through the land around it, shown once when the leader is that power), its size and population, tiles for people, shops and open jobs that open those tabs, and today's weather (the same seeded roll session prep shows). Mood music already sits under the title. The counts line under the title no longer repeats people and jobs for settlements, and says "1 place" instead of "1 places". js/glance.js unit tested.
- Recently changed for GMs: for GMs, the front page's "Recently changed" now comes from the history log, so deletes, reveals, approvals and edits by anyone show, with who, the verb and the time. Back-to-back saves of the same entry by the same person fold into one line ("edited ×2"). Each line has a "History" link to #world/e/<id>/history, which opens the entry with its history already showing (GMs only; players get the plain page). Players keep the plain list by last update. The log is fetched at most every 30 seconds as the page redraws. js/recent-edits.js unit tested.
- A forecast for the week: session prep's weather now has "The week ahead": the next six days where the party is, by in-world date when the world has a calendar (real days otherwise), each with any rules note. Every day is seeded the way "today" always was, so the forecast is exactly what each day shows when the calendar gets there. Session prep, the printable sheet and the settlement glance panel now share one helper (js/forecast.js, unit tested: day 3 of the forecast equals "today" after advancing the calendar three days).
- Reading for next session: GMs build a short list (up to 8) in session prep: add by name, remove, clear. Members see "📚 Reading for next session" on the front page. Players see only the entries they can see, each ticked once they open it or press "Mark as read". GMs see "read by Pip, Bo" or "no one yet" on each. Stored as prep.reading (PATCH settings {reading: [ids]}, checked against the world's entries); reads reuse entry_reads, which now also records listed entries, not just handouts. The world payload carries reading per person. js/reading.js unit tested; routes tested against PGlite (players can't set it, hidden entries stay hidden, reads off the list aren't recorded, visitors get nothing).
- Reveal on a date: under a hidden entry's title GMs get "Reveal on a date…", which takes a day (from tomorrow, up to three years out). The entry then shows "⏳ Reveals itself to players on Thursday, November 5, 2026. Cancel", plus a ⏳ badge in lists. From the start of that day in the GM's time zone, the first load of the world by anyone reveals it. No scheduler is needed: entries GET reveals due entries first, so live sync brings them to players. It is logged in the history as a reveal. Revealing or hiding by hand, or saving it as shown, clears the date. Additive column entries.reveal_at (plus a partial index); PATCH entries {id, reveal_at} (GMs, hidden live entries only; null cancels). Players never see the date. js/reveal-date.js unit tested; routes tested against PGlite.
- Job board poster: a place's quest board links to "📜 The board as a poster" (#world/poster/<id>): "Notices of Brindle", "By leave of" whoever leads it, today's in-world date, then each posted job under a headline in the voice of the posters (BOUNTY, MISSING, GUARDS WANTED, COURIER NEEDED, EXPLORERS SOUGHT, ANSWERS SOUGHT, HELP WANTED), with plain-text summary, reward and who to ask. Up to 8 jobs, then "…and 3 more on the board." Only Available jobs players can see go up, never hidden or suggested ones, even when a GM prints it; nothing comes from GM-only fields. Print gives just the poster. GMs can "Show to the table": the show feature now takes {show, as: 'poster'}, so everyone gets the poster popped up, built from the jobs they can see, and the party page says "Last shown at the table: the Brindle job board". js/poster.js unit tested.
- Also known as: every entry's form has "Also known as" (other names, separated by semicolons; up to 6, de-duplicated, never the entry's own name), shown under the title as "Also known as The Red Widow, Old Vex". [[mentions]] of another name link to the entry (a real name always wins over an alias). Search finds it and ranks an alias match like a name match. The name check warns when a new name is someone's alias, or close to one. Kept in fields.aka, cleaned on the server. js/aka.js unit tested with the name check and search; save tested against PGlite.
- How old they are: when an NPC's or character's birthday includes a year and the world has a calendar, their page shows "4 Thawmoon 1000 (39 years old)", counting up on the birthday itself. The dead stop ageing: "died aged 29" when the Hall of heroes has a date the calendar reads, otherwise no age. Who's who shows the age beside the role. ageOf/ageText in js/birthdays.js, unit tested (birthday today and tomorrow, no year, not born yet, the dead).
- A rival party: a place's Powers tab has "+ Rival party" (GMs). It rolls a company ("The Gilded Hounds", "Hulnak's Ravens") with what it wants, and four adventurers of different classes. Their levels sit around the party's (the leader a touch higher). Each has a role in the company (leads, talks, fronts, scouts) and a manner. The grudge they hold against the party is shown marked GM only. Rename it, roll another, then "Save the company and its people": a guild (grudge in its GM secret, members listed as [[mentions]]) and four NPCs linked "member of" it, all tagged "rival", placed in that town. js/rival.js unit tested over 30 seeds.
- Tavern menu: a tavern's page has a "Bill of fare" card. GMs roll a menu priced to suit the town around it: a village gets a poor alehouse or modest inn, a city a comfortable or fine one, a metropolis may get a grand one. Prices follow the SRD 5.1 food, drink and lodging prices, chalked up tidily. It has today's special (with a word from the cook), three or four drinks (the first brewed under the town's name), three dishes, the common room, a private room and stabling. Roll another, keep it (players then see it), roll a new one later, or take it down. "Print" prints just the menu. Kept as fields.menu (JSON, checked on the server). js/menu.js unit tested (prices rise with town size; sections; safe read-back; tidy prices); save tested against PGlite.
- Price list: Reference has a "Prices" tab. Every price the shops use (SRD 5.1 weapons, armor, gear, tools, food and drink, lodging and services, spellcasting, mounts, vessels, trade goods, gems) appears in a card per kind, cheapest first. The filter box narrows it row by row, matching the start of words, so "ale" finds ale and not scale mail; "armor" finds the whole kind. js/price-list.js unit tested.
- Not yet visited: once the party has been anywhere (the journey from session prep, or where it is now), GMs see "The party has been to 4 of 6 places" on the atlas. Places it hasn't set foot in carry a dashed "not yet visited" tag, and "Show only where they haven't been" lists just those. Being somewhere counts for every place around it (a tavern in Brindle means Brindle, its area and its region). Players see none of this. js/visited.js unit tested (nesting, the party's current place, unknown stops, parent loops).
- Living costs: when GMs move the calendar forward (+1 day/week/month, a number of days, or "Move the calendar on?" after travel on a map), a "Living costs for 7 days?" dialog offers to charge for living. Lifestyles follow the SRD 5.1 lifestyle expenses: wretched free, squalid 1 sp, poor 2 sp, modest 1 gp, comfortable 2 gp, wealthy 4 gp, aristocratic 10 gp a day. Each active character pays from their own coin (straight onto their sheets; nobody goes below nothing, and the preview says who came up short), or the party treasury pays in one loot-log line ("Living costs: 3 days, poor, 2 characters"). Only the treasury option writes a loot-log line; personal payments show on each sheet. The choice of lifestyle is remembered per world; rewinding the calendar offers nothing; "Not now" skips it. Days passing is now a world:days event, so other features can follow it. js/lifestyle.js unit tested.
- The treasury over time: the party page's treasury shows "Coin over time" once the loot log has two or more coin changes. It is a step line (the balance holds until the next change) with a light wash beneath, gridlines from 0 gp, the first and last dates, and the current balance labelled at the end. Hovering, or focusing it and using the arrow keys and Home/End, reads out any change: the balance after it, the change, its note and when. "As a table" lists them all. Item-only lines and struck lines are left out. The line colour is a chart-only token with its own light and dark steps, both passing the dataviz palette checks against their surfaces (the app's accent read too grey for a data mark). It redraws to fit on resize. js/treasury-series.js unit tested.
- Buy from a shop: a stocked shop's page has "Buy something" for members with an active character (players: their own; GMs: anyone's). Pick an item (only what's in stock, with its price), how many and for whom; it shows the total against their coin. The server sells it in one step (PATCH entries {buy}): it checks the shop is visible to them and the coin is there, takes the coin off the character's sheet, adds the item to their inventory ("2 Rope (from Smithy)"), and lowers the shelf ("1 in stock", then "out of stock"; "available" never runs out). If two people buy from the same shop at the same moment, the second is told to try again rather than both taking the last one. GMs see each purchase in Recently changed and in the shop's and character's history ("Pip bought from Smithy"), not in the loot log, which stays the party treasury. js/purchase.js unit tested; route tested against PGlite (own characters only, hidden shops closed, sold out, not enough coin, the history line).
- Quest deadlines: quests have a "Deadline (in-world date)" field. While a quest is open, its page reads "5 Thawmoon 1040 (2 days left)" (or "due today", "overdue by 2 days"), and its notice on the quest board carries a ⏳ pill, red when three days or fewer remain. Session prep sorts active quests by time left with the same pill, and lists "Running out of time:" for untaken jobs due within two weeks. The calendar shows open quests on their deadline day as "⏳ Wolves". Finished quests drop their countdown and leave the calendar. js/deadline.js unit tested.
- Quest chains: quests have a "Follows (the quest before it)" field (the earlier quest's name, like other name fields). A quest in a chain shows a "Quest chain" card: everything before it, oldest first, with statuses; itself; and "Leads to:" what follows. Loops stop. When a GM marks a quest Completed on the quest board, a dialog offers to open up what it leads to: a rumor becomes an Available job, and a hidden quest is revealed. The completed quest's page has the same "Open the next quest" button while anything is still waiting. Players see the chain only through quests they can see. js/quest-chain.js unit tested.
- Weather for the table: the front page shows members today's weather where the party is, under the in-world date ("🌤 In Brindle: Light rain, 18°C (64°F), wind strong."). It is the same seeded roll session prep and the printable sheet show, so it matches. GMs also see the rules note (heavy rain, extreme cold). Nothing shows when the party is somewhere the viewer can't see, or nowhere.
- Sell to a shop: beside "Buy something", a stocked shop has "Sell something". Pick who (players: their own active characters), an item from their inventory and how many, and it shows the offer. The shop pays its buy-back rate ("Buys at 50% of value") on the item's usual price: its own shelf price ignoring shortages and surpluses, else the standard price list. Things it can't price ("Mysterious idol") it won't buy: "Ask a GM", and the button stays off. One server step (PATCH entries {sell}) takes the item out of the inventory, pays the coin onto their sheet and puts the item on the shelf: back in stock, or under "## Bought from adventurers". It refuses others' characters and things they don't carry, and two people at the counter at once get "try again". Both sides land in the history and in Recently changed. sellTo in js/purchase.js unit tested; route tested against PGlite.
- Hirelings: on an NPC's page GMs can "Hire for the party…" at a daily wage: the SRD 5.1 rates (untrained 2 sp, skilled 2 gp) or any other. The page then reads "🪙 Travelling with the party for 2 sp a day. Let go". The party page has a "Hirelings" card listing who's on the payroll; GMs also see each wage and the daily total. When days pass, the living-costs dialog adds "Pay 2 hirelings 36 gp 4 sp in wages from the treasury" (ticked by default). It goes into the loot log as its own line ("Wages: 7 days for Ola, Tam") whichever way the lifestyle is paid, and the dialog now also appears for a party with hirelings but no characters. The dead and missing drop off the payroll. Kept as fields.hired and fields.wage on the NPC. js/hirelings.js unit tested.
- Tag colours: on a tag's page GMs pick one of eight colours, or None. The colours are the categorical palette already validated for Who holds what, with names for screen readers and pressed states. Every chip for that tag (on entries, entry cards and the Tags page) gets a coloured left edge while its text stays in ink, so "villain" or "clue" stands out without colour carrying the meaning alone. Renaming a tag carries its colour along unless the new name already has one. Colours go into full backups and restores, and into "a new world like this one". Additive column worlds.tag_colors (PATCH settings {tag_color}; everyone gets tag_colors in the world payload). js/tag-colors.js unit tested; route tested against PGlite.
- Our next move: on an open quest's page, players have "☆ Make this our next move" ("★ Our next move" when it's theirs, pressed again to take it back). The party page marks their pick "★ your pick". Session prep shows GMs "★ What the players want next": each quest with who picked it, most wanted first, "The party is split" when picks differ, and "Clear the picks" once it's settled. Only quests the player can see can be picked, and finished quests stop counting. Additive column members.next_move (PUT party {next_move}; DELETE party ?moves=1 for GMs). The world payload carries each member's own pick, plus everyone's for GMs. js/next-move.js unit tested; routes tested against PGlite.
- Who has it?: the party page's treasury card has a "Who has it?" search. It looks through every character's inventory and the treasury's items at once and lists "2 × Rope · Pip" and "5 × Rope · the treasury (Bo carries it)", each character linked. Words match at the start of a word, so "rope" finds silk rope and "sword" doesn't find longsword. Counts are read the way inventories are written ("Potion of healing x3", "2 Rope (from Smithy)"), and items the treasury has run out of don't show. js/who-has.js unit tested.
- Shops restock with time: when a shop is stocked or restocked, it now remembers the in-world day of that delivery (fields.restocked). When GMs move the calendar forward, a "New deliveries?" dialog follows the living-costs one (no longer stacked on it). It lists every stocked shop whose last delivery is 7 or more days old, or was never recorded, with its town, all ticked. "Restock them" gives each a fresh stock at its town's prices, recording the new delivery day; untick any that should stay as they are. js/restock.js unit tested.
- Haggle at the counter: the buy panel shows the shop's haggle DC ("roll for it at the table"). GMs get "Haggle result (DC 12)" in the trade box, where they grant a character 20% off, 10% off or 10% more. The buyer then sees "2 × Rope costs 1 gp 8 sp (haggled: 10% off)", and the result is used up by that character's next purchase there. The server applies and clears it in the same version-checked update as the stock change. GMs see what's been granted and can take it back. Kept as fields.haggle on the shop (only the three results count). The haggle helpers in js/purchase.js are unit tested; route tested against PGlite.
- Stay the night: a tavern whose bill of fare is kept gets "Stay the night…" for GMs. Pick the rooms from its menu (common room or private room, priced for the town) and who's staying; the preview shows what each pays and who comes up short. Each character pays from their own coin, never going below nothing, and the world's clock moves on to 8 in the morning. That's the next day on the calendar if it passes midnight, or the same day after a late, small-hours arrival. Lights burning through the night go out and the toast says so. Living costs aren't asked for on top (the room is the cost), and players don't get the button. js/inn.js unit tested; the clock and calendar step checked against PGlite.
- Rations run down: the living-costs dialog has a new first choice, "On the road: eat rations". It is picked by default when the days passed through travel on a map, and is remembered like the other lifestyles. Each active character eats a day's rations a day from their own inventory, from any "ration" line: "Rations (1 day) x10" becomes "7 Rations (1 day)", and finished lines are removed. Coin is left alone, and the who-pays choice hides. The preview reads "Ann eats 3 (7 left); Bo eats 2 (0 left), 1 day short; Cy has no rations", and the toast names who's out of food so the GMs can deal with it at the table. Hirelings' wages are still offered. Rations come from each character's own pack, not the treasury, as the roadmap item allowed either; the GMs can hand round treasury rations by hand. Sheet changes now go through one helper (changePlay, which addCoins uses too) that retries once if a player saved meanwhile. js/rations.js unit tested.
- Wanted posters: NPCs have "Bounty on their head" and "Bounty offered by" fields. A town's job board poster now carries WANTED notices under the jobs, with their looks (or summary), "Reward: 100 gp" and "Offered by Lady Vex". It shows up to four wanted NPCs who are in that town, or whose bounty is offered by the town, its ruler, or anyone or anything in it. Only the living who players can see are shown, so a hidden NPC never goes up even when a GM prints it. A town with only bounties no longer says "Nothing posted". Showing the poster to the table includes them. wantedFor in js/poster.js unit tested.
- Prices in this town: the Reference price list has a "Prices as usual (SRD) / in Brindle" choice, listing every town in the open world that has market conditions set. Picking one shows each price as that market has it: inflation, shortages and surpluses, festivals, each marked with a SHORTAGE, SURPLUS or FESTIVAL pill. Embargoed goods show BANNED and "not for sale". It uses the same market maths as the shops: marketPrice, now one shared function in js/economy.js, which shop stock adds its own markup and a little variation to. The filter still narrows row by row. Unit tested (inflation × shortage, banned, untouched kinds, usual prices without notes).
- Fix: on phones, a shop with a long item name pushed the whole shop card wider than the screen, because the "Buy something" picker grew to fit its longest option. The trade panel's pickers and inputs now stay within the card (caught by the shop page's phone check in the browser tests).
- A night's rest: staying the night at an inn now also gives everyone who stayed a long rest. Hit points go back to their maximum and temporary ones are gone, spell slots come back, death saves clear, half their hit dice return and one level of exhaustion goes. The room's price comes off in the same save of their sheet, and the dialog and toast say so. Those who came up short on the room still rest; the GMs see who was short. The rules live in one pure function (js/rest.js, unit tested), now used by the sheet's own "Long rest" button as well, so the two can't drift apart.
- Make camp: the party page has "⛺ Make camp…" for GMs. Pick who rests and the chance of trouble in the night (no roll, 1 in 6, 1 in 3). Those who rest get the shared long rest (js/rest.js), and the clock moves on eight hours, onto the next day on the calendar if it passes midnight; living costs aren't asked for, since camping costs nothing. If trouble comes, the dialog shows "In the night…". That is a line rolled on the encounter table of where the party is, or the nearest place around it with one ("Rolled 3 on d3"), or else a full encounter for that place's terrain at the party's level, ready to run. js/camp.js unit tested (the 1-in-6 rate over 600 rolls, table lines).
- The session in numbers: "Draft recap" now opens its gathered sections with "## The session in numbers". Coin is split into earned and spent ("+50 gp earned, −15 gp spent", where the treasure section only gives the net), then items found. Days passed in the world are counted from the last session's in-world date to today ("6 (3 Thawmoon 1040 to 9 Thawmoon 1040)"), when both are on the calendar. Last come quests completed, named. Lines with nothing to say are left out, and so is the section when nothing changed. Only things players can see go in, as with the rest of the draft. Unit tested in tests/recap.test.mjs.
- Hand out to everyone: the party page's treasury card has "Hand out to everyone" for GMs. Enter an item and how many each, and/or coin each, then tick who gets it (everyone active by default). Each sheet gets it in one save ("2 Potion of healing", +5 gp). Tick "Take it out of the treasury" and one loot-log line takes the whole lot out ("−10 gp, −4 Potion of healing, handed out to Ann, Bo"); otherwise it comes from nowhere, as a GM's gift. js/hand-out.js unit tested.
- The party at a glance: GMs see a table at the top of the party page with one row per active character: hit points ("7 / 30 (low)" at a quarter or less, "0 / 12 (down)", marked in words as well as colour), coin, days of rations, exhaustion and conditions. It scrolls sideways within its card on a phone, and players don't see it. js/party-glance.js unit tested.
- A short rest: next to "Make camp", GMs get "☕ Short rest" on the party page. It moves the clock on an hour and gives warlocks (characters from the Forge with pact magic) their pact slots back; other casters' slots stay spent. The toast says who got slots back and reminds that players spend hit dice on their own sheets, since that's their choice. It shares the sheet's own rule (shortRestOf beside restOf in js/sheet-ui.js).
- The journey on the calendar: every stop in "Where the party has been" that carries an in-world date the calendar reads now shows on that day: "⚑ Brindle" in the month grid, and "⚑ The party arrived in Brindle" when the day is opened. Only places the viewer can see are shown, so a hidden lair never appears for players. journeyDays in js/journey.js unit tested (weekday-prefixed dates, undated and unreadable stops).
- Worries in prep: session prep now has "⚠ Before the session" near the top whenever a character's sheet gives cause. It covers anyone down or low on hit points, exhausted, without rations, or broke (less than a gold piece, a day's modest living), worst first, each linked, with a link to the party-at-a-glance table. When all's well it isn't shown. worries() in js/party-glance.js unit tested.
- Sell the loot: when the treasury holds items, GMs get "Sell the loot" on the party page. Pick a stocked shop, tick items (with how many), and see the offer at the shop's buy-back rate: "They'll pay 10 gp. They won't buy Cursed idol (can't price it)". Selling puts the items on the shop's shelf first; if someone changed the shop meanwhile, nothing is sold. Then one loot-log line per item brings the coin in and takes the item out ("+10 gp, −2 Shield, sold to Smithy"). Things the shop can't price stay in the treasury. sellLoot in js/purchase.js unit tested.
- Enough food for the road?: picking a destination in a map pin's "Travel to…" now adds a rations line under the distance and times: "Rations for 3 days at a normal pace: Ann has enough (9); Bo has 1, 2 short", in red when anyone's short. Days are counted whole, the way the calendar would move on (2.5 days needs 3 days of food); trips of under a day need none, and rough going doubles it. rationsFor in js/party-glance.js unit tested.
- Weather slows the road: after the party moves on a scaled map, "Move the calendar on?" uses today's weather where they set out, the same seeded roll prep and the front page show. Heavy snow doubles the journey, heavy rain or snow makes it half as long again, and a strong wind a quarter longer, with the worst one counting. The factor applies to the actual travel time before rounding (60 miles in heavy rain: 4 days at a normal pace instead of 3), and the dialog says why: "🌧 There's heavy rain at Start today: the journey takes longer." weatherSlowdown in js/forecast.js unit tested.
- Rumours over supper: after the party stays the night at an inn, if any rumours are going around its town (started there or spread there, in the version told in that town), the dialog turns to "Over supper…". It shows one, picked at random, as talk in the common room, with a link to the rumour's page and a reminder to pass it on or keep it for later. Nothing is revealed to the players automatically. With no rumours in town, the dialog just closes as before.
- A shopping list: a character's page has "🛒 Shopping list" for its player and the GMs (add a line, take one off; up to 20). At a shop, the buy panel puts what answers the buyer's list first, starred ("★ Potion of healing" for "Healing potion": every word on the line must start a word of the item's name). Session prep shows GMs "🛒 Shopping lists" for everyone. It is kept in the sheet's play state (play.shopping); the sheet now knows that key, and its own saves always keep the stored list. Without that, any sheet change by someone with the page open would have wiped a list added since. js/shopping.js unit tested.
- Sheets keep outside changes: a character sheet open on someone's screen used to save its whole state, stale or not. A GM's coin split, a hand-out, rations eaten, a rest at an inn or a purchase made since it was drawn could be undone by the player's next click, in the seconds before live sync redrew it. The sheet now remembers what it last saw stored, and each save sends only what the player changed since, on top of what's stored at that moment. If both changed the same thing, the player's latest action wins. This is re-checked on a version conflict and works with the offline outbox. It replaces the special case added for shopping lists in #189. mergePlay in js/play-merge.js unit tested; the race reproduced and checked in the browser (damage on a stale sheet keeps the GM's coin and potions).
- Each character's own lifestyle: characters have a "Lifestyle" field (wretched to aristocratic, set by their player or a GM). Living costs charge each character with one at their own rate, from their purse or the treasury. The dialog's choice becomes "How the rest of the party lives" and lists who lives their own way: the noble pays 4 gp a day while the ranger sleeps rough for nothing. The preview marks anyone not on the party's rate. On the road, everyone still eats rations. livingCosts in js/lifestyle.js unit tested.
- Downtime moves with the calendar: when GMs move the calendar forward, each unresolved downtime activity with "Days spent" counts the days toward it, in a new hidden "Days done" field. This happens after the living-costs dialog and before deliveries are offered. The downtime page shows "2 of 5 days", and one that reaches its days reads "Ready to resolve". The toast names them: "Downtime ready to resolve: Pip's training". Resolved activities and ones without days are left alone. js/downtime-days.js unit tested.
- A day on the road: after travel on a map moves the calendar on, and once living costs and deliveries are dealt with, a "Write up the journey?" dialog offers a party journal draft. It is titled "On the road to Sedge", kind Party notes, dated the day they arrived. It says where from and to, how far, how many days at what pace, the weather they set out in (and whether it slowed them), and how many days' rations each ate if they ate on the road, plus a prompt for what happened. Nothing is saved until the GM saves the draft. The delivery offer now resolves when closed, so these dialogs come one after another, never stacked. js/road-journal.js unit tested.
- What happened to my coin?: a character sheet now has a "History" list, newest first, of every change made to it from outside, each with who and when. It covers a share of the treasury, hand-outs, living costs (with the lifestyle and days), rations eaten on the road, a night at an inn, making camp, a short rest's pact slots, purchases and sales at shops (haggled or not) and gifts between characters ("Got Rope and 1 gp from Pip"). The client tools write it through changePlay/addCoins/restOf with a note, and the server routes write it directly. It is kept in play.log (the last 30), which the sheet's own saves never touch, thanks to #190. js/play-log.js unit tested; server lines tested against PGlite.
- Shops keep hours: by the world's clock, shops trade from 8 in the morning to 8 at night, and taverns (and "Tavern & inn" shops) until 2 in the morning. Out of hours, players see "🌙 Smithy is shut for the night. It opens at 8 in the morning." in place of the buy and sell panels. The server refuses their purchases and sales too, so the page can't be got round. GMs see the same notice with "(GMs can still trade.)" and keep the panels. js/shop-hours.js unit tested; routes tested against PGlite.
- Treasure from a fight: every encounter card now has "Roll treasure" for GMs. It rolls pocket loot for the creatures, or their lair's hoard if ticked, at the tier of the toughest creature's challenge (CR 0–4, 5–10, 11–16, 17+), and shows the coins, valuables, magic items and any trinket. "Put it in the loot log" adds the coins as one amount and each valuable, item and trinket as its own line ("After the fight with 8 × Orc"); "↻ Another" rolls again. The rolling itself moved out of the Table Tools page into js/loot.js, shared by both and unit tested over 50 rolls.
- The party's wealth: the party page's treasury card now says what the party is worth in all, the treasury plus every active character's purse ("The party's worth: 117 gp 5 sp (the treasury 100 gp, purses 17 gp 5 sp)"). Retired, dead and missing characters aren't counted, and nothing shows until someone has coin of their own. partyWealth in js/party-glance.js unit tested.
- Hunger takes its toll: when "On the road: eat rations" leaves anyone short, the living-costs dialog adds "Hunger takes its toll" with an unticked box for each of them ("A level of exhaustion for Bo (2 days without food)"). It is the GM's call, and nothing is given by default. Ticked characters get the level in the same save as their rations, to a maximum of 6, and it shows in their sheet's history ("Ate 1 day of rations on the road (2 short); a level of exhaustion from hunger"). Someone with no rations at all is written to only if ticked.
- Weather on the map: the party's marker on a map now carries a small picture of today's sky where they are (☀ ⛅ ☁ 🌫 🌧 🌨, none underground). Its hover title and spoken label give the full line ("Today: Light rain, 18°C (64°F), wind moderate."). It is the same seeded weather as prep, the front page and the travel offer. skyIcon in js/forecast.js unit tested.
- Since you were last here: the road: the front page's "Since your last visit" now opens with "🧭 On the road". It says how many days passed in the world ("6 days passed in the world (it's Toilday, 9 Thawmoon 1040 now)") and where the party went ("The party went to Sedge and Old Mill", linked, only places the viewer can see). The days come from the browser itself, which notes the in-world day it last saw in each sitting, using the same three-hour rule as the visit mark, so the count starts from someone's second visit on that browser. The card now shows even when that's the only news. roadSince and worldDaysSince in js/whatsnew.js unit tested.
- Friends get a discount: a shop's prices now follow the party's standing with whoever holds its place. The holder is the same rule as Who holds what: a "Led by"/"Controlled by" naming a power, or a "ruled by" connection, inherited from the town or region around it. At +3 or better: "Friends of Coin Guild: 10% off here." At −3 or worse: "Coin Guild holds this place, and the party is not welcome: 10% more." The preview shows the price with it, and the server charges the same. Only open standing counts, never a GM-only change, and only a holding power players can see, so page and server agree. It applies before any haggle. js/standing-price.js unit tested; the route tested against PGlite (neutral, friends, a secret grudge ignored, hated).
- Friends buy dear: selling now follows the same standing as buying. Friends of the power holding the shop's place (+3 or better) get 10% more for their goods ("They'll pay 5 gp 5 sp (friends of Coin Guild get 10% more)"), and the hated (−3 or worse) 10% less. This covers both a player selling from their sheet and the GM's "Sell the loot", in the preview and on the server, by the same rules as #201 (open standing only, powers players know of). The server's standing lookup is now one helper shared by buying and selling. sellWithStanding in js/standing-price.js unit tested; the sell route tested against PGlite.
- Rations from the stash: on the road, when a character runs short and the party treasury holds rations, the living-costs dialog offers "Feed them from the treasury's rations (4 there): Bo 2, Cy 2", ticked. The treasury's rations go to whoever is short, in order, before anyone goes hungry, so the hunger choices list only those still short. Charging it writes one treasury line per kind of ration ("Rations (1 day) −4, Eaten on the road by Bo, Cy") and notes it in each sheet's history ("2 days from the treasury's rations"). Checkbox labels in dialogs now wrap at phone width instead of stretching the dialog. feedFromStash in js/rations.js unit tested.
- You've got news: while a player has the world open, a change someone else makes to their own character's sheet from outside it (a hand-out, a share of the treasury, living costs, rations, a sale) now gets its own toast quoting the sheet's history: "📜 Ann: Handed out by the GMs: 2 × Potion of healing (Morgan)", instead of the plain "Morgan edited Ann". It comes from the 20-second live sync, which now keeps the old copy of each changed entry to compare against. Changes to other people's sheets, and the player's own edits, stay as before. newLines and playJson in js/play-log.js unit tested.
- A party sheet for the GM's screen: a new GM-only page (#world/screen, "Party sheet for the screen" on the party page's at-a-glance table) lists every active character on one landscape page: name, species, class, level and player; hit points with temporary ones; armour class; passive Perception; coin; and everything they carry on one line, with exhaustion and conditions under the name. Numbers come from the sheet's play state first, then from the Character Forge build, so hand-made characters show what's been entered and a dash for the rest. Players who open the address are told it's for the GMs. screenRows in js/party-screen.js unit tested.
- Heavy packs: under each sheet's inventory, a line adds up what the character carries: "Carrying 70.6 lb of 285 lb (not counted: Mystery box)", or in red, "Over carrying capacity: 490.6 lb of 285 lb". It updates as the inventory is typed. Weights are the SRD 5.2 equipment tables' (weapons, armour, adventuring gear, packs, tools, instruments), matched the way players write things ("7 Rations (1 day)", "Arrows (20)", "+1 Longsword", "Potions of healing", "Elven chain mail"), including a Forge character's starting kit written on one line. Coin counts as the fewest gp, sp and cp pieces, fifty to the pound. Capacity is Strength × 15 (half for Tiny, double for Large) for Forge characters; hand-made characters show the weight alone. The GM's party sheet has a Load column that flags anyone over capacity. js/weights.js unit tested.
- Into the stash: a sheet's owner (or a GM) now has "The party treasury…" beside "Give to a party member…". It puts an item and/or coin from the sheet into the treasury, or takes one out (the item list switches to what the treasury holds, and the coin label says how much is there). The server does both sides in one request. It writes a ledger line ("Put in by Ann" / "Taken by Ann") and a line in the sheet's history ("Put 2 × potions of healing and 4 gp in the party treasury"). A take only goes through while the treasury still holds enough; that check runs inside the insert, so two players can't take the last potion at once. The stash route was tested against PGlite: owner only, can't put in more coin than you have, can't take more than there is, an item that isn't there, a sheet built from its base, and a GM acting for anyone.
- Since last session, for you: a player's own character page now opens with a "Since last session" card. It says what changed for them since the latest session was logged ("Coin: +51 gp · In: 2 × Potion of healing · Out: Lute") and lists the newest six history lines behind it. To make the totals possible, every history line now carries the change it made: coin up or down, and items in or out. The server's buy, sell, give and stash routes say what moved; changes made from the page (shares, hand-outs, living costs, rations, rests) work it out by comparing the sheet before and after. Older lines still list but don't add to the totals. Only the sheet's owner sees the card, and only when there's something since the session. changeOf, snapshot and logSince in js/play-log.js unit tested; the stash route's history line tested against PGlite.
- A printable month: the calendar has "Print this month" beside the month's name. It prints just that month on one page, in plain black on white: the grid with every item in its cells (the screen still shows three and "+2 more"), and underneath, the same month day by day: "Fireday, 12 Thawmoon 🎂 Bramwell turns 40 · ⏳ Deadline: Ring the Bell". That covers holidays, new and full moons, birthdays, where the party arrived, sessions played, quest deadlines and dated or repeating events, all as the viewer can see them. monthLines in js/calendar-month.js unit tested.
- What it's worth: under the weight line, each sheet now says what its gear would fetch: "Gear worth about 39 gp 7 sp 5 cp at the shops (half of 79 gp 5 sp new); not priced: Mystery box". Half is the rate a shop buys at unless it says otherwise. Prices come from the price list the shops use, matched the way players write things ("Rope" is the cheapest rope on the list, "20 arrows" is a twentieth of "Arrows (20)" each, and a starting kit on one line counts each part). Magic "+1" gear and services aren't priced; that's left to the GMs. The GM's party sheet shows each character's gear value under their coin. The weights module's kit-splitting is now shared as carried(). js/worth.js unit tested.
- Debts between friends: the give dialog has "Lend the coin: they'll pay it back" with an optional "What for". A loan moves the coin, and both sheets then keep the balance between the two characters in a new Debts section: "Bo owes Ann 10 gp (for the boat)". The borrower's sheet has "Pay back" (the whole debt, or an amount, never more than is owed). The lender's has "Forgive it", which asks for a second click to confirm. Each move writes history lines on both sheets ("Paid Ann back 4 gp (6 gp still owed)", "… (all square)"), with the coin carried for Since last session. At zero the debt is gone. The balance lives in each sheet's play state (play.debts), which the sheet now keeps when it saves. js/debts.js unit tested; the debt route tested against PGlite: owner only, can't lend or repay more coin than you have, nothing to repay, overpaying pays only what's owed, only the lender forgives, unknown kinds refused.
- Too heavy for the road: planning a trip from a pin on a scaled map now adds a warning under the rations line when anyone is over their carrying capacity: "Too heavy for the road: Ann carries 503.4 lb (can carry 120 lb)." It uses the same weights and Strength × 15 as the sheets' Heavy packs line, for Forge characters, whose Strength is known. Nothing shows when everyone is within their limit. overloaded and overloadedText in js/weights.js unit tested.
- A shop's ledger: each shop page now has "The party's trade here (3)" under its counter. It leads with what the party has spent and taken in, then lists the newest trades: "Bo sold Lute for 17 gp 5 sp", "The party sold 2 × Shield for 10 gp". Players buying and selling write to it in the same versioned update that changes the shelf, and the GMs' "Sell the loot" adds its own line. It keeps the last 30 in the shop's fields. Everyone who can see the shop sees it. js/shop-trade.js unit tested; buy and sell tested against PGlite.
- Fixed while doing it: editing an entry in the form used to drop the fields the form doesn't show. A shop lost its menu, haggles and restock mark, a hireling its wage, and a page its "players can edit" switch, whenever a GM changed something as small as its name. The form now keeps every stored field it doesn't manage. Changing an entry's kind still drops the old kind's own fields, as before.
- Where are they now?: NPCs have a new "Daily routine" field, written the way a GM would: "Mornings: the Forge; afternoons and evenings: at the Bell; nights: home", or hours ("8-12", "13:30–17:00", "9pm to 2am"), with "Otherwise" for the rest. It's read against the world's clock, using the clock's own parts of the day. The NPC's page says "🕰 Now (15:00, afternoon): The Bell until 19:00", linking the place when the world has it. The place's page lists "Here now (15:00): Bramwell until 19:00, Mags until 17:00". It skips the dead and missing, and shows only NPCs the viewer can see. js/routine.js unit tested.
- Bounties pay out: when a GM saves an NPC with a bounty whose status has just become Dead, or the new "Captured", a dialog offers the bounty: "Black Jory is dead. The bounty is 500 gp, alive, offered by the Watch. Pay 500 gp into the party treasury?" Paying writes a treasury line ("Bounty on Black Jory, paid by the Watch") and marks the bounty paid, so it isn't offered again and the NPC comes off the wanted posters. The poster also drops captured NPCs. The coin is read from the bounty's text ("1,000 gp", "50 gp 5 sp", "200 gold pieces", a bare number is gold). js/bounty.js unit tested.
- Hirelings eat too: on the road, the living-costs dialog now feeds hired NPCs a day's ration a day from the treasury, before any character's shortfall: "The hirelings eat 6 of the treasury's rations." When there aren't enough it says so in red ("not enough: Mags goes 2 days short"), or "The treasury has no rations for the hirelings". Characters who run short are then fed from what's left. Charging it writes one ledger line for the hirelings ("Eaten on the road by Gil, Mags (hired)") beside the characters' line, and the toast names anyone out of food. feedHirelings and stashAfter in js/rations.js unit tested.
- A packing list: when planning a trip shows someone short of rations, a button now offers "Add the rations to their shopping lists". Each short character's list gets "Rations × 2" for what they lack, replacing any rations line already there. The shops' buy panels then offer rations first. A GM packs for everyone; a player only for the characters they can edit. Shopping-list matching now ignores bare numbers, so "Rations × 3" finds "Rations (1 day)". withRations in js/shopping.js unit tested.
- Debts at a glance: the party page's side column now has "Who owes whom" ("Bo owes Ann 10 gp (for the boat)", both names linked), and the GM's party sheet prints the same under its table. Each debt is read once, from the lender's sheet. Nothing shows while everyone is square. partyDebts in js/debts.js unit tested.
- Who's about town: a settlement's page (and a region's or area's) now lists everyone whose routine puts them somewhere inside it right now, and where: "🕰 About town now (08:00): Bramwell at The Forge until 11:00; Cole at Back Room; Wren until 11:00". Places inside places count (a back room in a forge in the town). A shop or tavern keeps its own "Here now". aboutTown in js/routine.js unit tested.
- Lights from the pack: lighting a torch, candle or lantern on the clock now has a "from whose pack" choice beside it (hidden for spells, which burn nothing). Picking a character takes one torch or candle from their inventory, or a flask of oil for a lantern. Their sheet's history notes it ("Lit a torch", "Filled a lantern with a flask of oil"), and the item counts toward Since last session. If they have none, it says so ("Bo has no torches") and nothing is lit. fuelFor in js/clock.js unit tested with takeItem.
- Order from the menu: a tavern's bill of fare now has an Order row: who's ordering (players: their own characters; GMs: anyone), what (the day's special first, then the drinks and dishes; beds go through "Stay the night") and how many. The server finds the item on the tavern's menu, takes the coin from the sheet (refusing if it's too dear), and notes it in the sheet's history ("Ordered 2 × Pale ale at The Bell for 8 cp"). It also adds it to the tavern's ledger, which now shows under the menu. Printing the menu leaves both out. menuItem in js/menu.js unit tested; the order route tested against PGlite (owner only, no menu, not on the menu, too dear, paid, the ledger, the menu untouched).
- Tidy the pack: a sheet with duplicate inventory lines (often from purchases and gifts, which add "(from …)" lines) now shows a "Tidy the pack" button under the inventory. It merges lines naming the same thing, whatever their case and wherever they came from: "Rope" and "2 Rope (from the Smithy)" become "3 Rope", in the first one's place. It saves at once and hides again until there's something to merge; typing a duplicate brings it back. Headings and one-line starting kits are left alone. tidyInventory in js/handover.js unit tested.
- Full browser sweep (241 tests) clean after #203–#221.
- Who's around for the scene: session prep's "Where the party is" card now opens its People column with "Around now (08:00)": the NPCs whose daily routine puts them where the party is, or anywhere inside it, at the world's current hour ("Bramwell at The Forge until 11:00; Wren until 11:00"). It's the same reading as a settlement's About town, now shared as aroundNow. Nothing shows when nobody's routine puts them there.
- Coming up for you: a player's own character page now has a "Coming up" card for the next seven in-world days: "🎉 Bridge Day · in 2 days", "🎂 Your birthday: Ann turns 30 · in 3 days", "⏳ Deadline: Ring the Bell · in 6 days". Quests count when they're linked to the character, either way round, or all the party's active quests when none are; finished quests don't count. Only the owner sees it, and only when something's coming. comingUp in js/coming-up.js unit tested.
- Carrying for the party: a character's sheet now shows the treasury items whose holder is that character, under the inventory: "Carrying for the party: 2 × Tent, Rope (treasury)", matched by name whatever the case. The sheet reads the treasury at most once a minute and shows nothing when there's nothing held. heldBy in js/party-glance.js unit tested.
- The regulars: a tavern's or shop's page (any single place) now lists everyone whose routine brings them there at some hour, and when: "Regulars: Bramwell (afternoons and evenings), Mags (9-17)". It sits under "Here now", so the GM can see who might be in later as well as now. As everywhere, it shows only NPCs the viewer can see, and skips the dead and missing. regularsAt in js/routine.js unit tested.
- Who's here, on the map: clicking a place's pin now shows who's there at the world's current hour, under its summary: "🕰 Here now (08:00): Bramwell at The Forge, Wren". A town's pin counts everyone inside it, naming the spot. It's the same routine reading as the place pages (aroundNow), and nothing shows when nobody is about.
- Wages owed: when days pass and the treasury can't cover the hirelings' wages, the living-costs dialog says so up front ("it has 3 sp: 9 sp will be owed"). Charging it pays each hireling in turn while the coin lasts, writing one treasury line for what was paid. What's unpaid is noted on each hireling (fields.owed, added to anything already owed). The toast says who's owed what. The party page's Hirelings card shows GMs "owed 6 sp" beside the wage, with "Pay it", which writes the treasury line and clears the debt. In "the treasury pays" mode, living costs now come from what's left after wages. payWages and owedTo in js/hirelings.js unit tested.
- Divide the loot: the treasury card has a GM-only "Divide the loot" beside "Sell the loot". It lists each item the treasury holds (saying who carries it) with a choice of who gets it ("Keep it" by default) and how many. "Give them out" moves each choice onto that character's sheet through the stash route. The ledger says "Given to Ann" and the sheet's history "Given 2 × Tent from the party treasury"; only a GM can mark a take as given. One toast lists what went where and anything that couldn't go. The given flag on the stash route was tested against PGlite.
- Routine as you type: under the Daily routine field on an NPC's form, a live line now says where the routine puts them at the world's current hour while the GM writes it: "At 15:00 (afternoon): The Bell". It adds "(not a place in the world yet)" when the name isn't an entry, and flags lines it can't read in red: "Can't read: 'Fridays: the market'". An empty field shows how to write one. unreadable in js/routine.js unit tested.
- Everything the party carries: under the party page's "Who has it?" search, a link opens one printable list of every active character's gear and the treasury's (#world/kit). Things are merged by name, whatever the case, and one-line starting kits are split, with the total and who has how many: "Torches · 4 · Ann 2, Bo 2", "Rope · 2 · Ann, the treasury (with Bo)". everything in js/who-has.js unit tested.
- A round on the house: on a tavern's Order row, GMs now have "A round for all 3". It buys the chosen dish or drink for every active character, paid from the treasury in one ledger line ("A round on the house at The Bell: Pale ale for 3"), and noted in the tavern's ledger as the party's. Sheets aren't touched. Players don't see the button.
- Whose torch is it: a light lit from someone's pack is now named for them on the clock, "🔥 Ann's torch", in the toast, the list of lights and the "went out" notice, so everyone can see whose light is burning down. Lights lit from nobody's pack keep their plain names. lightName in js/clock.js unit tested.
- Roll a routine: the Daily routine field on an NPC's form has a Roll button. It writes a likely day from the role typed so far and the places in the NPC's town (or the world's, when they aren't placed in one). A smith gets "By day: Anvil & Tongs; evenings and dusk: The Bell; otherwise: home"; an innkeeper keeps their tavern from afternoon into the night; a priest goes to the temple, a guard to the castle, a farmer to the fields, and a cutpurse to the market by day and the tavern by night. Every rolled line reads back cleanly in the live preview. rollRoutine in js/routine.js unit tested against the parser.
- Minding the shop: when a shop's or tavern's Owner field names an NPC with a daily routine, the page now says whether they're behind the counter at the world's current hour: "🛎 Bramwell is here, behind the counter until 17:00." Otherwise it says where they are instead: "🛎 Bramwell is out: The Bell until 21:00." Nothing shows when the owner isn't an NPC with a routine, or is dead or missing.
- Gifts for NPCs: an NPC's page now has a Gifts section with "Give them something…". It's for members with a character (players: their own; GMs: anyone). It gives an item and/or coin from that character's sheet, with an optional "what for". The server checks the player can see the NPC and has the coin or item, then takes it from the sheet ("Gave 2 × Potion of healing and 5 gp to Mother Ide (to win her over)" in its history, counted for Since last session). The NPC remembers the gift: "2 × Potion of healing and 5 gp from Ann (to win her over)". The last 30 are kept, and an edit to the NPC keeps them. js/gifts.js unit tested; the gift route tested against PGlite.
- Ask the shopkeeper: a shop's trade panel now ends with "Not on the shelf?" and a box to ask for something, as one of your characters. The ask lands on the shop (the same thing asked twice is kept once, with the newest asker). GMs see "Asked for here" on the shop's page, with a price box already filled from the price list when the item is on it. "Put it on the shelf" adds "Grappling hook | 2 gp | 1 in stock" to the stock and clears the ask; "Dismiss" just clears it. Players don't see the list. js/shop-asks.js unit tested (its shelf lines read back through the stock parser); the ask route tested against PGlite.
- The town by the hour: a settlement's page (and a region's or area's) now has a folded "The town by the hour" table. It lists everyone whose routine brings them somewhere in the town, against morning (09:00), afternoon (15:00), evening (18:00) and night (23:00): "Bramwell · The Forge · The Forge · The Bell · —". It's for planning a day in town without stepping the clock. On a phone the table scrolls inside its box. townByHour in js/routine.js unit tested.
- Open now?: each line of a character's shopping list now names up to three shops that stock it, cheapest first, with the price. It says whether each is open at the world's hour ("open", or "shut till 8 in the morning") and, when the owner is an NPC with a routine, whether they're in: "Chandler 1 gp, open · Smithy 2 gp, open, Bramwell is in". Matching is the same as the buy panel's "wanted" mark. shopsFor in js/shopping.js unit tested.
- Waiting on the GM: session prep now opens (after reminders) with "⏳ Waiting on you" whenever something needs a GM's hand. It lists shops that were asked for things ("Smithy was asked for Grappling hook"), hirelings owed wages, with a pointer to the party page where they're paid, and bounties on dead or captured NPCs that haven't been paid, with "Claim it…", which opens the bounty dialog. waitingOnGm in js/waiting.js unit tested.
- Go to my character: the world's side menu now has a link to your own character, under The Party (marked ★). It's the newest active character you own; the retired, dead and missing don't count. Pressing g then y goes there from anywhere (g then m was already Maps), and the "?" list of shortcuts includes it. Without a character of your own, there's no link, and g y opens The Party.
- Gifts and loans in the recap: the session recap draft now has a "Dealings" section for what changed hands since the last session. Gifts to NPCs are read from the NPCs' lists ("[[Ann]] gave [[Mother Ide]] 2 × Potion of healing (to win her over)"), and loans from the lenders' sheet histories ("[[Ann]] lent 10 gp to Bo (for the boat)"). As with the rest of the recap, NPCs and characters players can't see are left out. Unit tested in tests/recap.test.mjs.
- Shut for the holiday: on one of the world calendar's holidays, shops now stay shut all day. The trade panel says "🎉 Smithy is shut for Bridge Day. It opens tomorrow.", the shopping list says "shut for Bridge Day", and the server refuses a player's purchase or sale with the same words. Taverns stay open, since it's a festival, and GMs can still trade. shopOpen takes the day's holiday; holidayToday and shutText are new in js/shop-hours.js (unit tested). The server check was tested against PGlite.
- Routines for the whole town: a settlement's page now offers GMs "Roll routines for 2 NPCs here without one". It counts everyone placed in the town (or in a place inside it) who hasn't got a routine, leaving out the dead and missing. A dialog rolls each one from their role and the town's places, with each routine editable and a tick to leave any out. "Save these" saves the ones kept, and the town's About town line picks them up at once. Routines already written are never touched.
- Hirelings go with the party: a hired NPC is now wherever the party is (session prep's "where the party is"), whatever their routine says. Their page reads "🕰 With the party: Sedge.", or "With the party, on the road." when the party is between places. The "Here now", "About town", map-pin and session-prep lists put them with the party. The regulars and the town by the hour leave them out while they're away. Their routine is kept for when they're let go.
- A gift they wanted: when giving an NPC something, the dialog now says "💝 Something Mother Ide wants." as soon as the chosen item answers their Wants field (any word of three letters or more in its name, singular or plural, not counting small words like "the" and "old"). Coin counts when they want money, gold, coin or payment. The server records the match with the gift, the toast adds "something they wanted", and the NPC's gift list marks it 💝. wantsMatch in js/gifts.js unit tested.
- Attuned: in a sheet's "Items on this sheet" list, each magic item that needs attunement (from the SRD, or a world item whose attunement field says so) now has an "attuned" tick. Above the list, "Attuned to 2 of 3" counts them, in red with "one too many" past the limit of three. Ticks are kept in the sheet's play state (play.attuned), which the sheet keeps when it saves; an item that leaves the inventory stops counting. js/attunement.js unit tested.
- Too heavy to carry it: a shop's buy panel now works out the buyer's load after the purchase as they choose, coin spent included. When it would take them over their carrying capacity it says so in red before they pay: "That would put Ann over their carrying capacity: 266.9 lb of 120 lb." It's a warning, not a block; the GM decides. It's for Forge characters, whose Strength is known. loadAfter in js/weights.js unit tested.
- Print the shelf: a stocked shop's "For sale" heading now has "Print the shelf". It prints just the shop's name, its shopkeeper line and the stock tables, black on white, to hand round the table. The trade panel, the haggle and sell helpers, the asks and the ledger are left out.
- Attuned on the party sheet: the GM's party sheet now adds "Attuned: Amulet of Health" under each character's gear, from the attunement ticks on their sheet. An item that's no longer in their inventory drops off. Unit tested in tests/party-screen.test.mjs.
- Festival specials: on one of the world calendar's holidays, a tavern's bill of fare now opens with a festival dish or drink: "🎉 Festival: Mulled wine for Bridge Day, 6 cp". It's chosen from the tavern and the holiday, so the page and the server agree, and priced a little above the tavern's usual fare. It heads the Order list and can be ordered and paid for like anything else. The next day it's gone. festivalSpecial in js/menu.js unit tested; ordering it tested against PGlite.
- Who's been given what: a character's page now lists the gifts they've given NPCs, newest first: "💝 Map to Mother Ide (for the marsh)". It's read from the NPCs' gift lists, so a player sees only gifts to NPCs they can see, while the GM sees them all. givenBy in js/gifts.js unit tested.
- Closing time: a stocked shop's page now says how long it has by the world's clock: "🕰 Open for another 3 h 20 min.", "Shut; it opens in 10 h.", or on a holiday, "Shut today; it opens tomorrow." Taverns count to their 2 in the morning close. It's left off the printed shelf. untilChange in js/shop-hours.js unit tested.
- Full browser sweep (277 tests) clean after #222–#253.
- A tab at the tavern: a tavern's Order row now has "On the tab" beside "Order". The order goes on the party's tab: nothing comes off the sheet now, though its history notes it ("Put 2 × Pale ale on the party's tab at The Bell (8 cp)"), and the tavern's ledger counts it. Everyone sees "The party's tab: 1 sp 2 cp" under the menu, with who had what. GMs get "Settle it from the treasury", which writes one treasury line ("Settled the tab at The Bell (3 orders)") and clears the tab. Printing the menu leaves the tab out. js/tab.js unit tested; the tab option on the order route tested against PGlite.
- Late night at the tavern: the closing-time line now also shows on taverns that have a menu but no stock. In the last hour before closing it changes: a tavern says "🍺 Last orders: The Bell shuts in 45 min.", a shop "Closing soon: Smithy shuts in 30 min."
- The NPC's day on their page: under "Now", an NPC's page now shows their whole day from the routine: "Their day: morning Forge · afternoon The Bell · evening The Bell · night home", with places linked. Parts of the day the routine doesn't cover are left out. dayOf in js/routine.js unit tested.
- Gifts in session prep: session prep now has "💝 Gifts since Session 4", listing NPCs given something since the last session was logged: "Mother Ide was given Map by Ann (for the marsh) · something they wanted". It's a reminder for how they'll greet the party next. giftsSince in js/gifts.js unit tested.
- Tabs waiting: session prep's "Waiting on you" now lists taverns where the party has an unsettled tab: "The party's tab at The Bell stands at 8 cp (1 order): settle it on its page". waitingOnGm in js/waiting.js unit tested.
- Pay your own tab: under a tavern's tab, each of your characters with orders on it gets "Pay Ann's share (8 cp)". The server takes just that character's orders off the tab and the coin off their sheet ("Paid their share of the tab at The Bell (8 cp)" in its history). Everyone else's orders stay on the tab for the GM to settle. It's refused for someone else's character or without the coin. splitTab in js/tab.js unit tested; the route tested against PGlite.
- Who's in the back room: a place's "Here now" line now counts people in places inside it, saying where: "🕰 Here now (20:00): Bramwell until 21:00, Cole (in Back Room)". It's the same reading the town pages use (aroundNow), so hirelings with the party show the same way.
- Routines on the printable cast list: each NPC on the printable Who's who now says where they're usually found by day, from their routine ("Usually by day: the market"; the morning's place, else the afternoon's). Hirelings say "Travelling with the party". It's handy for players hunting someone down.
- A tab on the party page: the party page's treasury card now ends with the tabs the party is running at taverns, linked: "Tabs: The Bell 2 sp".
- Who has the most coin: the party page's at-a-glance table (GMs) now sorts by any column. Click a header to sort (coin, rations, exhaustion and conditions start with the most; names and hit points start with the least, hit points as a share of the maximum), and click again to reverse it. The sorted column says so to screen readers (aria-sort) and shows ▲ or ▼. sortRows in js/party-glance.js unit tested.
- Bounties on the party page: the party page's side column now has a "Wanted" card of open bounties, richest first: "Black Jory: 500 gp, alive (from the Watch)". It covers only NPCs the viewer can see, and leaves out those already dead, captured or paid. openBounties in js/bounty.js unit tested.
- A quiet night: when the GM moves the clock past midnight, the toast now adds who's still out at that hour, from their routines: "out at this hour: Cole (The Bell)" (up to four, then "and 2 more"). If everyone's routine puts them at home, it says "a quiet night: nobody is about". Hirelings count as wherever the party is.
- Wanted posters link the bounty: on a town's job-board poster, an open bounty's reward now links to the party page, where the Wanted card is. Claimed bounties (captured, or dead and paid) stay on the poster for a while, stamped "CLAIMED", with the reward struck through and "(claimed)". wantedFor in js/poster.js takes a claimed option (unit tested); the party page's Wanted card and other callers still show only open bounties.
- Sort the party sheet: the GM's party sheet now has "Sort by" above the table: name, hit points (the most hurt first, as a share of the maximum) or load (the heaviest first). It's left out of the printout, which prints in the chosen order.
- A night out: a tavern's page now says who's due in later tonight, from the routines: "🌙 Due in later: Bramwell (about 17:00), Cole (about 21:00)". That's anyone not there now whose routine brings them in before it shuts at 2. Nothing shows while the tavern is shut, and hirelings, who are with the party, are left out. dueLater in js/routine.js unit tested.
- Gifts in the NPC's card: the printable NPC card now notes the last gift the party gave them, so the GM has it at hand when they turn up: "Last gift: Map from Ann (something they wanted)".
- Who's due in, on the map: clicking a tavern's map pin now also says who's due in later tonight, the same line as on its page: "🌙 Due in later: Bramwell (about 17:00)".
- Bounty hunters' board: each name on the party page's Wanted card now says where they're usually found by day, from their routine: "Usually by day: the docks".
- Settle every tab: when the party has tabs running, session prep's "Waiting on you" card now offers "Settle all 2 tabs from the treasury (4 sp)". It writes one treasury line per tavern ("Settled the tab at The Crow (2 orders)") and clears each tab, and the toast says what was settled and anything that wasn't.
- A gift from the party: GMs now have "Give from the treasury…" on an NPC's gifts. It gives an item the treasury holds and/or coin, with what it's for. The treasury's ledger notes it ("Given to Mother Ide (for her help)"), and the NPC remembers it as "from The party", marked 💝 when it's something they wanted. It can't give more than the treasury holds. It shows the section even before any gift has been given.
- Gifts from the party in the recap: the recap's Dealings section already picked up gifts given from the treasury, since they're kept on the NPC like any other; it now writes them as "The party gave [[Mother Ide]] 5 gp" instead of a broken link to an entry called "The party". Unit tested.
- A full sweep and tidy: the whole browser suite (297 tests) is clean after #254–#274, with the same harmless flags as the last sweep (deliberate error-path checks) and no crashes, so there was nothing to fix.
- Who gave the most: the party page's side column now has "💝 Most generous", counting gifts to NPCs by giver ("Ann: 2 gifts · Bo: 1 gift · The party: 1 gift"), with characters linked. It counts only NPCs the viewer can see. giftCounts in js/gifts.js unit tested.
- Last orders on the clock: late at night (from 22:00), when the world has taverns, the world clock card notes "🍺 The taverns call last orders at 01:00 and shut at 02:00." In the last hour it changes to "Last orders at the taverns: they shut in 40 min." That's 01:00 rather than the half past one first planned, to match the tavern pages' last orders.
- Holidays on the clock: on one of the world calendar's holidays, the world clock card now says "🎉 Bridge Day: the shops are shut today; the taverns are open.", so everyone knows before trying to buy anything.
- Who's owed wages, at a glance: under the party page's at-a-glance table, GMs now see "Owed wages: Gil 3 sp" when the treasury couldn't pay a hireling in full, with each hireling linked.
- Gifts given, on the party sheet: the GM's party sheet now notes how many gifts each character has given NPCs, under their name: "Gifts given: 2".
- Tabs in the recap: the recap's Dealings section now notes what went on a tavern tab since the last session ("On the tab at [[The Bell]]: 3 sp 2 cp (Bo, Ann)") and tabs settled from the treasury since ("Settled the tab at The Crow (2 orders): 3 sp 2 cp from the treasury"). Unit tested.
- Coming up: holidays shut the shops: a player's "Coming up" card now says "🎉 Bridge Day (the shops are shut) · in 2 days", so they can shop beforehand.
- Wages in the recap: the recap's Dealings section now notes wages paid from the treasury since the last session ("Wages: 3 days for Gil: 6 sp from the treasury", and owed wages paid off) and what's still owed now ("Still owed in wages: [[Gil]] 3 sp"). Unit tested.
- Who's around on the front page: the world's front page now has "Around the party in Brindle (10:00)", listing who's about where the party is right now: "Bramwell at The Forge until 17:00". It shows only NPCs the viewer can see, and nothing while the party is on the road.
- A tidy for the party: when any character's pack has duplicate lines, the GM's at-a-glance card offers "Tidy 2 packs". It merges the duplicates on each of those sheets in one go, the same way the sheet's own "Tidy the pack" does, and says how many lines it merged.
- Due in later, on the front page: when the party is at a tavern, the front page's "Around the party" card now adds who's due in later tonight ("🌙 Due in later: Bramwell (about 17:00)"). If nobody's there yet, it says "Nobody about just now."
- Routine in the search: Ctrl+K already searched every field, so typing "forge" finds NPCs whose routine mentions the Forge. It now also shows why: an NPC without a summary shows their routine as the hint ("Bramwell · Routine: By day: the Forge; otherwise: home").
- Holiday prices: on a holiday, taverns charge a fifth more, rounded up to the copper. The menu says so ("🎉 Holiday prices today: a fifth more than the board says"), the Order list shows the day's prices, and the server charges the same for orders, tabs and the round on the house. The festival special keeps its own price. holidayPrice in js/menu.js unit tested; the server's price tested against PGlite.
- A full sweep: the whole browser suite (307 tests) is clean after #276–#288, with the same harmless flags as the last sweep and no crashes.
- Holiday prices on the shelf: the day before one of the world's holidays, shops charge a quarter more for festive goods (candles, ale, wine, mead, sweets, cakes, ribbons, flowers, lanterns, fine clothes…), rounded up to the copper. A shop that stocks any says so in its trade panel ("🎉 Bridge Day tomorrow: candles, drink and sweets cost a quarter more today."), the buy panel's price shows it, and the server charges the same. On the holiday itself the shops are shut, as before. holidayTomorrow, isFestive and evePrice in js/shop-hours.js unit tested; the server's price tested against PGlite.
- A tavern's busiest hour: a tavern's page now says when it's fullest, from the regulars' routines over its opening hours: "🍺 Busiest around 17:00 (2 regulars in)." The earliest hour wins a tie, and nothing shows for fewer than two regulars. busiestHour in js/routine.js unit tested.
- Who knows whom: an NPC's page now lists the others whose routines put them in the same place at the same hours, two hours a day or more, as likely acquaintances: "Often crosses paths with: Tom (at The Forge, 10 h a day), Mags (at The Bell, 2 h a day)". Only places the world knows count (not "home"), and it shows only NPCs the viewer can see. crossPaths in js/routine.js unit tested.
- Last seen: an NPC's page already said which session the party last met them in; it now says where too: "👁 Last seen in Session 2 (the latest session), at The Bell". The place comes from that session's log: of the places it mentions or links, the NPC's own place (then the places around it, nearest first), else the first one named. sceneOf in js/appearances.js unit tested.
- Last seen on the cast list: the printable Who's who now says where each NPC was last seen, not just when: "Met in 1 session · last in Session 1, at The Bell". It's read from that session's log, the same way as on the NPC's page.
- Acquaintances in the relationship web: the web has a new "Acquaintances (from routines)" option, off by default. Ticked, it draws a faint dotted line between NPCs whose routines put them in the same place at the same hours, two hours a day or more. Hovering a line shows "Bramwell — crosses paths at The Forge — Tom". It uses the same reading as the NPC pages' "Often crosses paths with".
- Busy taverns on the map: a tavern's map pin now also says when it's busiest, the same line as its page: "🍺 Busiest around 17:00 (2 regulars in)."
- Eve of a holiday on the clock: the day before one of the world's holidays, the clock card now says "🎉 Bridge Day tomorrow: festive goods cost a quarter more today, and the shops will be shut."
- The 300th, a changelog page: a "What's new in the Satchel" page at #news, linked from the footer, lists every ticked roadmap item newest first (it reads ROADMAP.md itself rather than the README, so it stays current without extra upkeep), with a filter box and "Show more" in pages of 40.
- Who's in town for the festival: on one of the world's holidays, a settlement's page opens with a festival card: "🎉 Bridge Day today: a festival day. The shops are shut; the taverns are open.", then each tavern in town with who's in now from routines (back rooms count, quiet taverns say "no regulars in just now"), busiest first.
- Last seen in session prep: "Who might turn up" now links the session each person was last seen in and says where, from that session's log (their own place first): "Last seen in Session 2, at Inn, 3 sessions ago · met 2 times."
- Open or shut on the map: a shop's or tavern's map pin now says its hours by the world's clock in its tooltip ("Smithy (shut till 08:00)") and popup ("🔒 Shut for Bridge Day."), and shut shops' pins are dimmed until hovered. Taverns stay open on holidays.
- The next festival: on other days, a settlement's page says when the next holiday is, within a month ("🎉 Bridge Day in 4 days."), and on the eve that festive goods cost a quarter more today and the shops will be shut.
- A full sweep: all 315 browser tests rerun; no crashes or page errors, and the same flagged files as the last sweep (the deliberate error-path 400s).
- What's new since you looked: once a browser has opened the What's new page, the footer link counts what has shipped since ("What's new (3 new)"), and the page tags those items "New" and says how many. The count is fetched at idle time and only for browsers that have looked before.
- Who might turn up, on the town's page: GMs see a folded "Who might turn up (3)" on a settlement's page, the same list as session prep (people due back, with where and when each was last seen, then key people not met). Players and player preview don't see it. Prep and the town page now share one module (world-turnup.js).
- Open now on the Market tab: a settlement's shop list now says, by the world's clock, "🕰 21:00: 1 open, 2 shut (for the night)." (or "shut for Bridge Day" on a holiday), and each shop says "open till 20:00" or "shut till 08:00".
- Holidays on the session sheet: under the date, the printable session sheet says "🎉 Bridge Day today: the shops are shut; the taverns are open." on a holiday, and on the eve that festive goods cost 25% more today and the shops shut tomorrow.
- Shut shops on the shopping list: the list already said whether each shop is open; now it gives exact times ("open till 20:00", "shut till 08:00", "shut for Bridge Day"), and session prep's shopping lists show the same where-to-buy line under each item.
- Links to a change: every change on What's new links to itself (#news/305 opens the page scrolled to it and outlined, showing as many as it takes to reach an old one), with a "Copy link" button; an unknown number says so.
- Search finds changes: Ctrl K now lists the What's new page and every shipped change ("What's new: Festival specials", group "Change #251"), opening it on the What's new page. The list is fetched in the background when the box first opens, and changes rank below any page or entry that matches.
- When the owner's in: a place with an owner whose routine is written now says their usual day there, under whether they're in now: "🛎 Bramwell is usually in mornings and afternoons; evenings at The Bell; nights at home." (or "isn't usually here: …"). Hirelings are left out; they go with the party.
- The festival in session prep: under "Where the party is", prep shows the town's festival card on a holiday (shops shut, taverns open, who's at each tavern now), and on other days when the next holiday is, within a month. Out in the wilds it says nothing.
- Nobody at the counter: GMs see on a settlement's Market tab which shops have an owner whose routine never has them in while the shop is open ("Candler: Nell (open 08:00–20:00)"), counted in half hours across trading hours (a tavern's run to 02:00).
- A shopping trip: session prep's shopping lists end with a trip plan for the town the party is in: each shop that stocks something on anyone's list, most wanted first, with what and for whom and the price, whether it's open now ("open till 20:00"), and what nowhere here stocks.
- Who minds the shop: when a shop is open but its owner's routine has them elsewhere, its buy panel says "🛎 Bramwell is out; an apprentice minds the counter."
- A full sweep: all 325 browser tests rerun (started after #308); no crashes or page errors, and the same flagged files as the last sweep (the deliberate error-path 400s).
- Due back, on an NPC's page: GMs see "🔔 not seen for 3 sessions: might turn up" after the last-seen line once two sessions have passed without them (as session prep counts it), and "Key person, not met yet" for key NPCs the party hasn't met. Players don't see it.
- Name who minds the shop: places have a new "Minds it when the owner's out" field (an additive schema field; stored with the other fields, no migration). When the owner is out, the page says "Nell is out: the chapel; Pip minds the counter." (linked when Pip is in the world), the buy panel names them instead of "an apprentice", and a named minder clears the Market tab's "Nobody at the counter" flag.
- Your shopping trip: a character's shopping list now folds out "Your shopping trip in Brindle": the shops in the party's town that stock what's on it, most to fetch first, open or shut, and what nowhere here stocks. It only appears when there's more than one stop or thing to fetch.
- The owner's hours on the map: a shop's map pin popup now says when its owner is usually in, under whether it's open: "🛎 Bramwell is usually in mornings and afternoons; evenings at the Bell; nights at home."
- Wanted in town: a settlement's page lists "🎯 Wanted in Brindle": open bounties on people who live there or whose routine brings them into town at some hour, richest first, with "🕰 About town now: The Bell until 19:00" when their routine has them there now.
- Around now on the session sheet: the printable session sheet has a "🕰 Around now (18:00)" block: who the routines put where the party is (or somewhere inside it) at the world's hour, and until when ("Ada at The Bell until 19:00").
- Bounties in session prep: under where the party is, prep warns "🎯 Wanted, and about: Red Jack (500 gp) is due in town around 17:00; Lim (50 gp) is in town now." for anyone with an open bounty whose routine has them in the party's town now or later today.
- Festival specials on the map: on a holiday, a tavern's map pin popup shows the same special as its page: "🎉 Bridge Day special: Bridge Day cake (1 sp 5 cp)".
- A wanted poster: an NPC with a bounty (not GM-only) has a "🎯 Wanted poster" button on their page; #world/poster/<their id> prints a poster with their name, appearance, the reward and who offers it (crossed out as CLAIMED once paid).
- Last seen, for bounty hunters: each person on the party page's Wanted card says where the party last saw them, from the session logs: "👁 Last seen in Session 1, at The Bell (1 session ago)".
- Routines that don't read: the GMs' "What needs writing" page lists every NPC routine with lines the clock can't read ("Can't read: brunch: The Bell") or places it names that aren't in the world ("Not in the world: the Mill"), each with an Edit button. Everyday places (home, the road, the market, the woods…) aren't flagged.
- Wanted on the map: a place's map pin popup notes anyone with an open bounty whose routine has them there (or somewhere inside) right now: "🎯 Wanted, here now: Red Jack (500 gp) at The Bell".
- Unknown places as you type: the routine preview on an NPC's form now also says "Not in the world yet: the Granary, the Mill" for the other places the routine names that have no entry (everyday ones like home and the road aside).
- A full sweep: all 336 browser tests rerun, no crashes. Two new flags: a 403 in the dialogs test (passes on rerun, a load flake), and a real one: a curiosity shop whose stock table was wider than a phone widened its whole page (518 px). Fixed: the stock grid's column can now shrink, so a wide table scrolls in its own box. Checked across 12 rolled curiosity shops at 390 px.
- Make the missing place: each "Not in the world" place on What needs writing has a Create button that opens a new location named as the routine has it ("the Mill" → "The Mill"), placed in the NPC's town; once saved, the routine reads and drops off the list.
- Wanted on the cast list: the printable Who's who tags anyone with an open bounty "🎯 wanted: 500 gp" beside their name (captured or paid ones aren't tagged).
- Every page at phone width: a new browser test visits all 89 routes (every world view, entry pages, a town's tabs, every table tool, Reference, What's new) with a full world at 390 px, including a rolled curiosity shop, a holiday, a bounty and long unbroken text. Everything fits since the stock-table fix in #321; with that fix undone, the test catches it.
- Deadlines on holidays: a quest deadline that falls on one of the world's holidays says so on the quest page, the quest board and in session prep: "⏳ due on Bridge Day, in 4 days" (or "was due on Bridge Day: overdue by 2 days").
- Deadlines on the session sheet: "Quests in play" on the printable session sheet now lists quests with a deadline first, soonest (or most overdue) first, each with "⏳ 2 days left" or "due on Bridge Day, in 4 days"; the rest follow by name.
- Where they'll be, on the session sheet: each person in "Who's around" on the printable session sheet has their usual day under their name, from their routine: "🕰 mornings and afternoons: the Forge; evenings: the Bell; nights: home" (hirelings: "with the party").
- A whole day on the cast list: Who's who now gives each person's whole usual day, "Usually mornings: the market; afternoons, evenings and nights: The Bell", instead of only where they are by day.
- Routines on NPC cards: each printable NPC table card now has "Day: mornings and afternoons: the Forge; evenings: the Bell; nights: home" (hirelings: with the party) and "🎯 Wanted: 50 gp (the Watch)" for an open bounty.
- Holiday deadlines coming up: on a character's "Coming up for you", a quest deadline that falls on a holiday says so: "Deadline: Ring the Bell (on Bridge Day)".
- Open now in search: in Ctrl K, a shop or tavern's hint now starts with whether it's open by the world's clock: "Smithy · 🔒 shut till 08:00 · Hammers.", "The Bell · 🟢 open till 02:00".
- A shop's own hours: places have a new "Opening hours" field (additive, no migration) that reads "10–18", "10:30–18", "6pm–2am", "9am to 5pm" or "noon–midnight"; unreadable hours fall back to the usual (shops 8–20, taverns 8–2). Everything that says open or shut follows them: the page's closing line, map pins, the Market tab, shopping lists and trips, Ctrl K, the "nobody at the counter" check, and the server's buy and sell checks ("Night Market is shut just now. It opens at 18:00."). "Shut for the night" is only said at night.
- A day off: places have a new "Shut every (a weekday)" field (additive). On that weekday of the world's calendar the shop (or tavern) is shut all day, "shut on Firedays", on its page, map pin (dimmed), Market tab, shopping lists, Ctrl K and in the server's buy and sell checks; shop-hours now takes today as { holiday, weekday } via tradeDay().
- A full sweep: all 347 browser tests rerun; no crashes or page errors, last time's two flags (the phone-width shop page and a load flake) are gone, and nothing new is flagged.
- Open or shut on the session sheet: the sheet's shop list now gives each shop's hours by the world's clock today: "Shops: Night Market (shut till 20:00), Smithy (open till 20:00)", following own hours, days off and holidays.
- Hours on the printed shelf: "Print the shelf" now puts the sign on the door under the shop's name: "Open 18:00–02:00 · Shut on Firedays" (the usual hours when it keeps no hours of its own).
- Rolled shops keep sensible hours: a newly rolled shop (Market tab, the Shops tool's "Add to world", or a generated draft) gets hours that suit its trade: black market 10pm–4am, curiosity shop 11–19, bookseller 9–17, temple and stables 6–20, and so on; the rest keep the usual hours. Existing shops are untouched.
- Open now in town: whenever some of a settlement's shops are shut (night, a day off, a holiday, or a shop that keeps other hours), its page says what's still open: "🕰 Open now (22:00): Night Market (till 04:00), The Bell (till 02:00)." (or "nothing; everything's shut").
- "Open now" in search: typing "open now" (or "what's open") in Ctrl K lists every shop and tavern open at the world's hour, by name, each with how long it's open; Enter opens it.
- Open on holidays: places have a new "Open on holidays" Yes/No field (additive). A shop set to Yes trades on festival days as usual (still keeping its hours): the Market tab, buy panel, pins and the server's buy check all follow it; other shops stay shut for the holiday.
- Market day: settlements have a new "Market day (a weekday)" field (additive). On that day the town's page says "🧺 Market day today: stalls in the square, and the shops open two hours early.", and every shop in it (however deep) opens two hours early: page, Market tab, pins, shopping lists, Ctrl K, the session sheet, and the server's buy and sell checks (which find the town with a recursive query). Taverns keep their hours. Pages now get a shop's day from world-hours.js.
- Hours as you type: the Opening hours field on a place's form reads them back as you type, "Open 18:00–02:00", or "Can't read that; the usual hours apply… Try “10–18” or “6pm–2am”." (marked as a problem).
- What changed when time moves: when a GM moves the clock on (a step or setting the time), the toast and the clock card say what changed in the party's town: "⏩ 22:30 in Brindle: Smithy shut; Ada left." Shops that opened or shut and who came, went or moved, from routines and hours; the diff is pure (clock-diff.js).
- A full sweep: 357 browser tests rerun. One real find: a link to a change on What's new showed the list exactly down to that change, so it sat last with nothing after it (and an older neighbour was missing). Fixed: it now shows whole pages of 40 around it. Two more flags (a timeout in the secrets test and the dialogs 403) pass on rerun, load flakes. No page errors.
- Jump to a time of day: the clock card has "→ Morning / → Midday / → Evening / → Night" for GMs, moving on to the next one (always forward, so the day rolls on past midnight), with the same "what changed" note, which now stays on the card after a new day redraws the page and clears when a move changes nothing.
- Where they are, on their pin: an NPC's map pin popup now shows the same lines as their page: "🕰 Now (10:00, morning): The Forge until 17:00" and their day, linked; a hireling's says they're with the party.
- Hours in the Shops tool: a rolled shop in the Shops table tool now says the hours it keeps, under who runs it and in the copied text: "Run by Ember Dunmore. Open 22:00–04:00." (a black market), taverns 08:00–02:00, the rest 08:00–20:00.
- When the session began: "Start session N" in prep now opens the log with "Began at 18:00 (evening) on Fireday, 5 Thawmoon 1040." from the world's clock and calendar (either part left out when the world has none).
- Due in later, on the session sheet: the printable session sheet has a "🌙 Due in later" block: who the routines bring where the party is (or somewhere inside it) before 02:00, "Ada about 17:00 at The Bell", soonest first.
- Market day coming up: a character's "Coming up for you" notes the next market day in the town the party is in, "🧺 Market day in Brindle · in 2 days" (the first one in the week, not every one).
- Shops in the town by the hour: the town-by-the-hour table on a settlement's page ends with an "Open" row: which of the town's shops and taverns are open at each hour today (own hours, days off, holidays and market day included), linked; the table now shows for a town with shops even if nobody's routine is written.
- Where to find the patron: an open quest's page says where its patron is right now, from their routine: "🕰 Now (10:00): Bramwell is at The Forge until 17:00." (a hireling is with the party; finished quests and patrons who aren't NPCs say nothing).
- Patrons in session prep: each active quest in prep says where its patron is now: "🕰 Bramwell is at The Bell until 21:00 now" (patrons who aren't NPCs with routines say nothing).
- "Who's at" in search: typing "at the Bell" or "who's at Brindle" in Ctrl K lists the place, then who the routines put there (or somewhere inside it) right now, with where and until when; a name that isn't a place falls back to ordinary search.
- Last orders on the map: in a tavern's last hour, its map pin popup says "🍺 Last orders: it shuts in 40 min." instead of its hours (following its own hours, if it keeps them).
- Patrons on the quest board: each open job on a town's quest board says where its patron is right now: "🕰 Bramwell is at The Forge until 17:00 now" (finished jobs don't).
- Where to ask, on the job poster: the printable job board now says where to find each patron, from the first part of their day their routine names (home aside): "Ask for Bramwell, by day at The Forge", "Ask for Mags, evenings at the Bell". Also fixed: a patron written as a [[link]] no longer shows its brackets on the poster.
- Lights on the session sheet: the printable session sheet has a "🔥 Time and light" block: the world's time and part of the day, and each light burning with how long it has left ("Torch (1 h left)", "Continual flame (until put out)").
- Where they are now, on the cast list: Who's who now says, under each person's usual day, where they are at the world's hour: "🕰 Now (18:00): The Bell until 19:00" (hirelings: with the party).
- A full sweep: all 368 browser tests rerun; no crashes or page errors, last time's three flags (the What's new link, fixed in #345, and two load flakes) are gone, and nothing new is flagged.
- Members about now: a faction's (or guild's or clan's) page lists its members, the NPCs connected to it either way, with where each is right now: "🕰 Members about now (18:00): Ada is at The Bell until 19:00; Cpt. Rook is at Gatehouse".
- The time on the party's map marker: hovering (or a screen reader on) the party's marker now gives the world's time with the weather: "The party is here, in Brindle. It's 18:30, evening. Today: Heavy rain…".
- Moonlight at night: from 20:00 to 05:00 the clock card says how much the moons light the way, from tonight's phases (the brightest moon wins, named when there are several): "🌕 Full moon: bright enough to read by outdoors." down to "🌑 New moon: no moon to see by, so bring a light." Pure in moonlight.js.
- Clouds hide the moon: the moonlight line now takes tonight's weather where the party is: overcast, rain, snow, fog and the like hide the moon ("☁️ Full moon behind the clouds (light snow): no moon to see by, so bring a light."), and scattered clouds dim it a step ("through broken cloud").
- Moonlight on the session sheet: at night the sheet's "Time and light" block adds tonight's moonlight where the party is, clouds and all.
- Set the scene: under "Where the party is", session prep offers one line to read out, with a Copy button: "🎬 Night in Brindle: overcast, 14°C (57°F), wind moderate. Waxing crescent behind the clouds (overcast): no moon to see by, so bring a light. The party's torch is burning. It's Bridge Day: the shops are shut and the taverns are full." Pure in scene.js.
- Night in the encounter roll: an encounter rolled in session prep at night (20:00–05:00) notes what the light means: moonlit dim light (lightly obscured) or, with no moon or under cloud, darkness (heavily obscured), and any lights the party has burning.
- The scene on the session sheet: the printable session sheet now opens, under the date, with the same scene-setter line as prep ("🎬 Night in Brindle: overcast…"); the line is built in one place (world-scene.js) for both.
- Where we are, for players: the party page now says where the party is, for everyone, in the same scene-setting line: "📍 Afternoon in Brindle: heavy rain, 18°C (64°F), wind moderate." (with the moon, lights and any festival when they apply; nothing when the party's on the road).
- Who can see in the dark: at night (20:00–05:00) the GM's party sheet says "🌙 Night: darkvision: Bo 120 ft, Cy 60 ft; needs a light: Ann.", from each character's species (SRD species' darkvision).
- Darkvision from the library: the night line on the party sheet counts species from the world's library: their own Darkvision when it's filled in (0 means none), else that of the species they're "similar to".
- A full sweep: 380 browser tests rerun; no crashes or page errors. One flag, a timeout in the secrets test, passes on rerun (the same load flake as in sweep 345).
- The weather when the session began: the "Began at…" line of a session log started from prep now ends with the weather where the party is: "Began at 18:00 (evening) on Fireday, 5 Thawmoon 1040; clear, 13°C (55°F), wind calm or light."
- Print the town by the hour: the town-by-the-hour table on a settlement's page has a "Print this table" button that prints just the table, titled "Brindle by the hour", as a handout for the GM's screen.
- Lights running low in prep: under "Where the party is", session prep warns "🔥 Running low: Torch (8 min left). Light another or the party is in the dark." for any light with ten minutes or less left.
- What happened with them: an NPC's last-seen line now quotes the sentence of that session's log that names them ("They met Ann at the Inn, who poured ale!"), links shown as plain names; nothing when the log only connects to them.
- Open now, for players: the party page tells everyone what's open in the town the party is in: "🕰 Open now in Brindle (22:00): The Bell (till 02:00)." (nothing when the party's on the road).
- The scene, read aloud: the scene-setter line in prep has a "Read aloud" toggle that puts the line first in the read-aloud list as "The scene" and on the printed session sheet. The choice is kept in prep (a new prep.scene_aloud flag, additive) and survives other prep saves.
- What happened, on the cast list: under when each person was last seen, Who's who quotes the sentence of that session's log that names them ("They met Ann at the inn, who poured ale!").
- Last in the log, everywhere: places, quests, factions (and guilds and clans) and items now say "📜 Last in the log: Session 2 (the latest session) · in 2 sessions" with the sentence from that log that names them, like an NPC's last-seen line.
- Tomorrow's weather on the session sheet: under today's weather, the sheet adds "Tomorrow: Scattered clouds, 15°C (59°F), wind strong.", the same roll as the first day of prep's week ahead.
- Every time they came up: an NPC who has come up in more than one session gets a folded "Every time they came up (3)" list on their page: each session, newest first, with the line from its log that names them (or "connected, not named in the log").
- In this session: a session's page lists "In this session (5)": the people, places, quests and things its log names or connects to, grouped by kind and linked.
- What happened, in prep: "Who might turn up" (in session prep and on a town's page) quotes the line from when each person was last seen ("Saw Ann again at the Inn.").
- Last time, on NPC cards: each printable NPC card adds "Last time (Session 1): Met Ann at the inn, who poured ale!", the line from the last session that named them.
- Search the logs: typing "log: dragon" in Ctrl K lists the sessions whose log mentions it, newest first, each with the sentence ("Session 3 · The Dragon burned the mill!"); Enter opens the session.
- Characters in the log too: a character's page now says "📜 Last in the log: Session 2 · in 2 sessions" with the line ("Ann fell asleep on watch!"), and folds out every session they came up in.
- Who comes up most: the world's numbers page lists "Who comes up most in the logs": the people, places, quests and factions named in the most sessions (two or more), "Ann in 3 sessions".
- Forgotten threads: once three sessions are logged, session prep's quests flag "🧵 Gone quiet: Ring the Bell (not in the log for 3 sessions), Never mentioned (never in the log)." for active quests the logs have let slide.
- A full sweep: all 392 browser tests rerun; no crashes or page errors, last time's one flag (a load flake) is gone, and nothing new is flagged.
- Sort the cast: Who's who has "By name / Longest unseen / Most seen" buttons (hidden in print); the choice is kept in this browser.
- Key people gone quiet: session prep has a "Key people gone quiet" card listing key NPCs the logs haven't mentioned for five sessions or more, wherever they are, longest first, each with when they were last in the log and the line.
- Every session, for quests and places: quests and places that have come up in more than one session fold out "Every time it came up (2)", each session newest first with its line, as NPCs and characters do.
- Threads in the new log: a session log started from prep ends with "Threads in play (link the ones that moved): Find the cat; Ring the Bell", plain names so they don't count as mentioned until the GM links the ones that moved.
- Names left unlinked: What needs writing lists session logs that name entries as plain text without [[links]] ("Session 1: Bramwell ×2, The Bell"), matching whole names of four letters or more, longest first. A "Link them" button turns those mentions into links (existing links are kept), so they count for last seen, who came up and gone quiet.
- Session numbers in order: What needs writing flags "No session numbered 3, 4.", numbers used more than once (with the sessions) and sessions with no number. Pure in session-checks.js.
- Logs still to write: What needs writing lists "Logs still to write (2)": sessions with no log yet or only a line (under 60 characters of text), newest first, each with a "Write it" button.
- Who came up, on the session list: each session in the list of sessions now says "Came up: Ann, The Bell": who and what its log names or connects to (up to eight, then "and N more").
- Last time, in prep: session prep's "Last time" card adds "Came up: Ann, The Bell", who and what the last session's log names. The session page, the session list and prep now share one helper for it (session-named.js).
- Link names as you write: under a session log's text, the form says "Names you could link: Bramwell, The Bell" as you type, with a "Link them" button that turns them into [[links]] in the text before saving.
- Last time on the map: an NPC's map pin popup quotes the line from the last session that named them: "Last time (Session 1): Bought nails from Bramwell, who grumbled."
- Last session, for players: the party page tells everyone "📖 Last session: Session 2 · came up: Ann, The Bell" (the party's own characters left out of the list).
- Link names in journals too: writing a journal entry, the form offers "Names you could link: Bramwell" with the same "Link them" button as session logs.
- Unlinked names in journals: What needs writing's "Names left unlinked in logs and journals" now finds them in journal entries too (logs first), each with its "Link them" button.
- First met: an NPC met in more than one session now says "🤝 First met in Session 1, at The Inn" under where they were last seen (appearances() now also remembers the first session).
- First met, on the cast list: Who's who now reads "Met in 2 sessions · last in Session 2 · first in Session 1" for anyone met more than once.
- A full sweep: all 405 browser tests rerun; no crashes or page errors. Two flags, a timeout in the secrets test and a 403 in the dialogs test, both pass on rerun (the same load flakes as before).
- Met together: the relationship web has a "Met together (from the logs)" option, off by default, that draws a faint dashed line between NPCs the session logs name in the same sessions twice or more ("Ann — in the same session logs 2 times — Bo"). Pure in appearances.js (metTogether).
- In this entry, for journals: a journal entry's page lists "In this entry (2)": who and what it names, grouped by kind, as session pages do.
- Last time, on the session sheet: each person in "Who's around" on the printable session sheet adds the line from the last session that named them: "Session 1: “Met Ann at the inn, who poured ale!”".
- Copy a session as text: a session's page has "Copy as text", which copies its name, dates, summary, log and "Next time" as plain text (links as plain names, Markdown marks out, the GM's secret never included), to paste into a chat.
- Copy a journal entry as text: journal pages get the same "Copy as text" button as sessions (plain names, no secrets).
- Time between sessions: the session list says after each session's name how long after the one before it was played, from the dates played: "· the next day", "· 2 weeks later". Pure in session-gaps.js.
- Days in the world, per session: next to that, the session list says how many in-world days passed since the session before, from their in-world dates: "· 4 days on in the world", "· the same day in the world".
- The gap on a session's page: a session's page says "After Session 1: 2 weeks later · 4 days on in the world".
- Pace of play: the world's numbers page has a "Pace of play" tile: "Every 8 days" at the table on average, and "2 in-world days a session", from the dates played and the in-world dates.
- Write about the last session: beside "Last session" on the party page, members get "Write about Session 2", which starts a journal entry "After Session 2" with a link to the session.
- What the players wrote: a session's page lists "What the players wrote (2)": the journal entries that link to it (in the text or as a connection), oldest first, with who wrote each.
- Journals on the session list: each session in the list says "📓 2 journal entries about it" when players have written about it (journalsAbout() in session-named.js, shared with the session page).
- Who wrote, in prep: session prep's "Last time" card adds "📓 The players wrote: After Session 2 (Pip), Notes (Bo)", the journal entries about the last session.
- In the players' journals: an NPC's page folds out "In the players' journals (1)": the journal entries that name them, with who wrote each and the first line that names them.
- Copy the cast as text: Who's who has "Copy as text", one line per person in the chosen order ("Ann (AN) — Innkeeper · met in 2 sessions, last in Session 2"), to paste into a chat.
- Search the journals too: "log: dragon" in Ctrl K now lists journal entries that mention it after the session logs, grouped "In a journal", each with the sentence.
- What they wrote, on a character: a character's page lists "📓 Their player's journal (2): Day two, Day one", the journal entries by the same player, newest first.
- When a journal entry is set: a journal entry that links a session says "📅 About Session 2 (5 Thawmoon 1040)", the session's in-world date.
- Not a name: each name in "Names left unlinked" has a ✕ that tells the Satchel never to offer it for linking (an entry called "The Watch" that's often just words); it's kept in prep.not_links (additive, GM-only; players get a 403) and the name stops being flagged.
- Not a name, as you write: the session log (and journal) form's "Names you could link" leaves out names marked never to be linked (GMs only; players can't read that list, so they see every name).
- A full sweep: all 421 browser tests rerun; no crashes or page errors, last time's two load flakes are gone, and nothing new is flagged.
- Change your mind: What needs writing folds out "Names never offered for linking (1)", each with "Offer it again" to take the mark back (PATCH {relink}, GM-only).
- Unlinked names in quests and places: "Names left unlinked" now also finds them in the descriptions of quests and places (after logs and journals), never flagging an entry's own name.
- Link names in descriptions too: quest and place forms offer "Names you could link" under their description, as session logs do, never their own name.
- Playing since: the world's numbers page has a "Playing since" tile: the date the first session was played and how long ago ("2026-10-18 · 3 weeks ago").
- Taken on in, finished in: a quest's page says "🧭 Taken on in Session 1", and once it's done "· completed in Session 3" (or failed or abandoned), from the first and last sessions that mention it.
- First visited: a place mentioned in more than one session says "🗺 First visited in Session 1" under when it was last in the log.
- New in this session: a session's "In this session" card starts with "✨ New this session: Bo, The Market", who and what its log names for the first time (newIn() in session-named.js).
- New faces on the session list: each session in the list says "✨ 1 new face, 1 new place": the NPCs and places it introduced.
- New last time, in prep: session prep's "Last time" card names "✨ New last time: Bo, The Market".
- New on the cast list: Who's who tags the people first met in the latest session "✨ new".
- Sessions here: a place's map pin popup lists "📜 In 2 session logs: Session 2, Session 1", newest first (six, then "and N more").
- How many are here: a map pin for a place shows a small count of the people the routines put there (or somewhere inside it) right now, and says it in its label for screen readers ("The Bell, 2 here now").
- A full sweep: all 440 browser tests rerun; no crashes or page errors, and the same flags as the last sweep (the deliberate error-path 400s).
- Wanted, at a glance: a map pin where someone with an open bounty is right now gets a small 🎯 mark, and says "someone wanted is here" in its label.
- Find a person on the map: the map's "Find a pin" box also finds NPCs by name: "🕰 Bram at Back room (The Bell)", pointing to the pin for where their routine has them now (or the nearest place around it with a pin); clicking it centres the map there and opens the pin.
- A map key: the map's side panel folds out a "Map key" explaining the marks: the head-count, 🎯 for someone wanted, a dimmed pin for a shut shop, the party's ⚑, and the double ring of a place with its own map.
- Who's where, by name: a "Who's where" button on the map labels each pin with the names of the people there now ("Ada, Bram, Cy +2"), alongside the count.
- The map at another hour: a 🕰 slider on the map previews another hour: pins' head-counts, names, open or shut, wanted marks and popups all follow it ("22:00 (preview)"), and "Back to now" returns. The world's clock isn't moved (a scoped atMinutes() override in world-routine.js).
- Night on the map: from 20:00 to 05:00 (or when the hour preview says so) the map image darkens and a line under the toolbar says how much the moon lights it, clouds and all: "🌙 Night: New moon: no moon to see by, so bring a light."
- What if we skip ahead: the clock card folds out "What would change if we skip ahead?": for the next morning, midday, evening and night, what would change in the party's town ("→ Night: Smithy shuts; Ada leaves"), worked out without moving the clock.
- A town at another hour: a settlement's page folds out "See Brindle at another hour", with a slider that shows who's about and what's open at that hour ("About town at 18:00: Ada at The Bell until 19:00"), without moving the world's clock.
- Only where people are: an "Only where people are" button on the map dims the place pins with nobody there right now (or at the previewed hour), until hovered.
- Who came up that day: a session listed on a calendar day shows who and what its log names ("Came up: Ann, The Bell").
- Market days on the calendar: the month marks the party's town's market days with a basket, and a day's card says "Market day in Brindle" (or that there's no market on a holiday).
- No market on a holiday: when the market weekday falls on a holiday the town's page says "No market today: it's Bridge Day", shops don't open early, and "coming up" skips to the next real market day.
- The week in town: a settlement's page folds out "The week in Brindle", the coming seven days with their holidays, market day (or no market on a holiday), and which shops shut for a holiday or take their day off.
- Copy the week: the week in town has a "Copy as text" button ("The week in Brindle" with a line a day), for a handout or a chat.
- The week on the GM sheet: the printable sheet has "📅 The week in Brindle" for the party's town, the same days as the town's page.
- A full sweep (#441): all 453 browser tests clean against sweep #425; five that failed under load late in the run pass on rerun.
- Shut that day: a calendar day's card says which of the party's town's shops are shut ("🔒 Shut in Brindle: Smithy (day off)", or for the holiday).
- Open for the holiday: the week in town and a calendar day's card name the shops that trade on a holiday ("🔓 Open for the holiday: Bakery").
- Birthdays in the week: the week in town lists the birthdays of the people who live there ("🎂 Ada’s birthday (40)"), on the town's page, the GM sheet and the copied text.
- Next market on the party page: "🧺 Next market in Brindle: Restday, in 9 days" (a market day on a holiday is skipped), or "Market day in Brindle today".
- Markets in the palette: Ctrl+K "market" lists the towns with market days first, soonest next market first ("🧺 Next market Restday, in 9 days"), then the ordinary matches.
- Market day on the map: a settlement's pin says "🧺 Market day today" or "Next market: Moonday, in 3 days".
- Next market in prep: session prep's "Where the party is" card says "🧺 Next market in Brindle: Starday, tomorrow" (or that it's market day today).
- A shop's next day off: a shop's page says when it's next shut all day ("📅 Next shut tomorrow: its day off", or "for Bridge Day"); taverns that keep holidays open don't.
- Tomorrow in town: the clock card says what tomorrow brings in the party's town ("📅 Tomorrow in Brindle: 🎂 Ada’s birthday (40) · 🧺 market day · day off: Smithy"); a holiday keeps its own line.
- Local holidays: a settlement has a "Local holidays" field ("Founding Day, 5 Thawmoon", one per line); on those days its shops shut and its taverns hold a festival, and they show in its week, on its map pin's market line, on the clock card and on the calendar ("Founding Day (Brindle)") while the party is there.
- The week on the party page: players can fold out "The week in Brindle" on the party page (market day, holidays, local ones too, days off, birthdays), with Copy as text.
- Days off on the Market tab: each shop says its weekly day off and whether it trades on holidays ("shut Toildays · open on holidays"), and the tab's open-now count honours the town's own holidays.
- Local holidays everywhere: a town's own holidays also count in "Coming up", on the GM sheet, for tavern holiday prices and festival specials, and for festive goods on the eve; the server shuts the town's shops and prices orders by the town's calendar too.
- Check the local holidays: as the GM types a settlement's local holidays, the form says which lines it reads and when they fall ("Reads: Founding Day (5 Thawmoon)") and which it can't, with an example of the format.
- Which town's holidays: the calendar has a "Town" picker (where the party is, any settlement with local holidays or a market day, or no town) that sets whose local holidays, market days and shops' days off the month shows.
- The 200th Founding Day: a local holiday written with the year it was first held ("Founding Day, 5 Thawmoon 841") is counted on the town's festival card, in its week and on the calendar ("the 200th Founding Day").
- A full sweep (#461): all 478 browser tests clean against sweep #441; four that the container restart cut off pass on rerun.
- Holidays in the palette: Ctrl+K "holidays" lists the coming 90 days' holidays first, the party's town's own included and counted ("The 200th Founding Day (Brindle) · today"), each opening its month on the calendar.
- Holidays on the map: a settlement's pin says its next holiday within a month, its own local ones included ("🎉 The 200th Founding Day today: the shops are shut", "🎉 Midsummer in 4 days").
- The week ahead in prep: each day of prep's week-ahead weather also says what's on in the party's town ("🧺 market day", "🎉 the 200th Founding Day", days off, birthdays).
- What happens on the day: a local holiday line can end with a dash and what happens ("Founding Day, 5 Thawmoon 841 — a parade and a bonfire"); the town's festival card and the calendar day say it, and the form's check reads it back.
- Market stalls: on market day (not a holiday) a settlement's Market tab lists travelling stalls in the square (two to six by the town's size), each keeper and a few goods at haggled prices, the same all day and different next market; Copy as text for a handout.
- Market-day crowds: by day on the party's town's market day, the scene line adds "It's market day: the square is busy with stalls" ("going up" at dawn); not at night or on a holiday.
- Buy from a stall: on market day the stalls card has "Buy from a stall" (players for their own characters), paid from the purse into the pack and the log; the server works out the same stalls and prices (prices are whole coins, so what's shown is what's paid) and refuses off market day, on a holiday, or once the stalls are packed away (17:00 till dawn).
- Stalls on the GM sheet: on market day the printable sheet lists "🧺 Market stalls in Brindle", each stall's keeper and goods with prices.
- A stall keeper as an NPC: each stall on the Market tab has "Make the keeper an NPC" for GMs, a new-NPC form in the town already filled in (a name and ancestry seeded by the stall, "Market stall keeper", who they are).
- Stalls on the party page: on market day players can fold out "🧺 Market stalls in Brindle today", each stall's goods and prices, with a link to buy on the town's Market tab.
- Weather on the calendar: today's and the coming six days' cards on the calendar show the forecast where the party is ("🌦 Forecast in Brindle: scattered clouds, 18°C"), the same seeded weather as prep.
- What the party bought: the party page folds out "🛒 What the party bought", the latest purchases from shops, market stalls and taverns (and tabs) from the characters' logs, newest first with the date.
- Who writes the journals: the numbers page ranks journal writers by entries, with their best run of sessions in a row written about ("3 sessions in a row", "going now").
- Coin spent: the numbers page ranks characters by what they've spent at shops, market stalls and taverns (from each sheet's recent log).
- Who has written about it: the party page's last-session line says who has written it up ("✍ written up by Pip and Bo").
- Most-bought goods: the numbers page lists what the party buys most often at shops, stalls and taverns ("Pale ale bought twice (3 in all)").
- The tavern's regulars at the bar: a tavern's page says who orders there most ("🍺 At the bar most: Ann (2 orders), Bo (1 order)"), from the characters' logs.
- A shop's best customers: a shop's page says who has bought the most there ("🛍 Best customers: Ann (1 purchase, 1 gp)").
- Favourite haunts: a character's page names where they usually order and where they buy most ("🍺 Usually orders at The Bell (2×) · 🛍 Buys most at Smithy (1×)"), linked when the place is in the world.
- Busiest taverns: the numbers page ranks taverns by the party's orders there ("The Bell 3 orders").
- A shop's best sellers: a shop's page lists what the party buys there most ("📦 Sells most: Nails (3), Rope (1)").
- Copy the shopping: "What the party bought" on the party page has Copy as text, a dated list of the latest purchases.
- Phone check: at 375px the town's week, the calendar's town picker and the party page fit; the market stalls card no longer pushed the page sideways (its grid column now shrinks, and the buy form's controls wrap).
- When the stalls pack up: the stalls card says "🕰 Up till 17:00 (another 3 h)", "Going up at 06:00" or "Packed away at 17:00" by the world's clock, and players only see the buy form while the stalls are up (as the server requires).
- The keeper at their stall: once a stall's keeper is an NPC in the town, the stall says "kept by" them with a link instead of offering to make one.
- Stalls in the palette: Ctrl+K "stalls" lists today's market stalls in every town with its market on, each with its goods and prices, opening the town's Market tab.
- The stall total: the buy-from-a-stall form says what it comes to and what the character has ("2 × Candles (10) costs 1 sp 8 cp. Ann has 50 gp."), flagged when they can't afford it.
- A tavern's favourites: a tavern's page lists what the party orders there most ("🍲 The party’s favourites: Pale ale (2), Stew (1)"), read from the order lines in the characters' logs.
- Wishlists: a character has a "Wishlist" field (one item per line) that its player can keep; additive, so existing characters are untouched.
- Someone wants this: a shop's shelf and the market stalls mark goods on an active character's wishlist ("⭐ Ann, Bo want this"), matched loosely ("rope" finds "Rope (50 feet)", "a good lantern" finds "Hooded lantern").
- A full sweep (#469): all 483 browser tests clean against sweep #461; t-minding timed out under load and passes on rerun.
- Fix for #516 and #517: they duplicated the existing wish lists (#100) with a new plain-text "Wishlist" field that every player could read. The field is now hidden and private like wish lists (the server only sends it to the character's player and the GMs), nothing written in it is lost, and the character's wish list offers to move its lines in. Shops' shelves and market stalls now mark goods from the real wish lists ("⭐ Ann wishes for this"), so players only ever see their own characters' wishes.
- What the party wishes for: the party page folds out the open wishes this person may see (GMs: everyone's; players: "Your wishes") and where each is for sale in the party's town today, cheapest first, shops and market stalls alike.
- Got it: after buying something on the character's wish list at a shop or a market stall, the page offers "⭐ Rope was on Ann’s wish list. Tick it off".
- Wishes in the palette: Ctrl+K "wishes" lists the open wishes you may see (players: their own characters'; GMs: everyone's), each with where it's for sale in the party's town today.
- What they want, in prep: session prep's party card lists the wishes the party's town could grant today ("🛍 Wishes Brindle could grant today: Ann’s “rope” at Smithy (Rope (50 feet), 1 gp)"), shops and market stalls alike.
- Crafting costs: choosing Crafting when filing downtime asks for the item (with the SRD price list as suggestions) and shows the SRD 5.2 estimate: raw materials at half its price and its price in GP ÷ 10 days of work ("Longsword (15 gp): raw materials 7 gp 5 sp, 2 days of work"); the activity keeps the item and shows the estimate.
- Many hands: the crafting estimate takes the number of crafters and divides the days among them ("150 days of work, or 50 days each with 3 crafting").
- Use the estimate: a "Use the estimate" button fills in the activity's days (each) and cost (the raw materials).
- Hand over what was made: a crafting activity's GM box has "Put the Longsword in Ann’s pack", which adds it to the character's pack (logged "Crafted Longsword") and marks it handed over (GM-only) so it can't be given twice.
- The right tools: the crafting estimate and the activity name the artisan's tools an item is usually made with ("Usually made with Smith’s tools"; woodcarver's for bows, leatherworker's for leather armor, weaver's for padded armor and rope, tinker's for lanterns and locks…).
- Got the tools?: the crafting estimate checks the chosen character's pack for the tools and warns when they're missing ("⚠ Ann’s pack has no Smith’s tools.").
- Pay for the materials: a crafting activity's GM box has "Take 7 gp 5 sp for materials from Ann", which takes the raw materials' cost from the purse (logged), refuses when they can't afford it, and marks it paid (GM-only) so it's only taken once.
- What the party has made: the numbers page lists finished crafting ("🔨 Hooded lantern by Bo"), newest first.
- A full sweep (#481): all 503 browser tests clean against sweep #469 (a block cut off when the preview server died, and a few load timeouts, pass on rerun; the new t-stallsame prints its own pass line).
- Could be crafted: an open wish for something on the price list says what making it would take ("🔨 Could be crafted: 2 days of work, materials 7 gp 5 sp, Smith’s tools").
- Craft it: that wish has a "Craft it" button that opens the downtime form for the character, set to Crafting with the item filled in and its estimate showing.
- What these tools could make: a character's page names the artisan's tools in their pack and a few things each could make, cheapest first ("🔨 With Smith’s tools, Ann could make Darts (10), Sickle, Dagger… and 23 more").
- Done about: an open downtime activity with days still to go says when it should be finished on the in-world calendar ("done about 9 Thawmoon 1040"), on the downtime page and the character's page.
- A full sweep (#489): all 511 browser tests clean against sweep #481, first time through.
- Pay the cost: any downtime activity with a cost has a GM button to take it from the character's purse ("Take 10 gp from Ann", logged "Paid 10 gp for Carousing"), once; crafting with no cost written still takes the raw materials.
- Downtime totals: a character's downtime section sums it up ("📊 3 activities, 9 days spent, 17 gp 5 sp in costs (10 gp paid)"), counting days done so far on open activities and crafting materials where no cost is written.
- A new contact: carousing and building-contacts downtime has a GM button "Start a new contact", a new-NPC form already filled in (a name, in the party's town, "A contact [[Ann]] made while carousing in Brindle").
- Anything this time?: the party page notes active characters with no downtime filed since the last session (players see their own; GMs everyone's), with a button to file it ("⏳ No downtime since Session 4 for Ann").
- A full sweep (#493): all 514 browser tests clean against sweep #489, first time through (covering the crafting, wish and downtime work since).
- Marching order: the party page has "Marching and watches"; GMs tick and order the characters (front to back), saved with session prep, and everyone sees it ("🥾 Bo → Ann"), minus characters they can't see.
- Watch order: GMs set who keeps watch the same way, and the night (22:00–06:00) is split evenly between them ("22:00–00:40: Ann").
- Orders on the sheet: the printable GM sheet has "🥾 Marching and watches": the marching order and each watch's hours.
- Whose watch is it?: at night the clock card says who the watch order puts on now ("🌙 Bo is on watch (till 06:00).").
- Watches at camp: the make-camp dialog lists the night's watches from the time camp is made ("🌙 Watches: Ann 20:00–00:00, Bo 00:00–04:00"), and when trouble comes it says about when and on whose watch ("About 02:10, on Bo’s watch").
- Marching order on the map: the party's marker says the marching order in its tooltip, and the pin of the place the party is in shows "🥾 Marching: Bo → Ann".
- Copy the orders: "Marching and watches" has Copy as text ("Marching order (front to back): Bo, Ann" / "Watches: 22:00–02:00 Ann; 02:00–06:00 Bo").
- A full sweep (#545): all 523 browser tests clean against sweep #493, first time through (covering downtime, marching order and watches).
- Accessibility check: axe (WCAG A/AA) over the Market tab with the stalls' buy form open, a town's week, the crafting downtime form, the party page with every new section and the orders editors open, the calendar, the numbers page, a character and a shop: clean in light; in dark the downtime "Waiting for a GM" tag was white on light gold (2.2:1) and now uses the page colour on gold.
- Phone check, again: at 375px the crafting form (with an estimate), the party page with every new section open and a character's page fit without sideways scrolling; the orders editor's ↑ ↓ buttons are now 40×36 on a phone (they were 29×26), with the order numbers kept.
- A big party page: in a test world of 2,590 entries (2,000 NPCs, 150 sessions, 80 characters with full 30-line logs and wish lists, 40 towns with shops) the party page renders in 50–120 ms, and the other pages the recent work touched stay under 200 ms warm (prep about 170 ms, 334 ms cold; the GM sheet about 160 ms; a town's page 60–150 ms); nothing needed speeding up.
- Print check: the GM sheet printed to A4 (PDF) shows the market stalls, the week in town and marching and watches as whole blocks in the grid, nothing wider than the page, the app's tools and navigation hidden, and no block split across pages.
- Hirelings march and watch: the orders editors offer the party's hired NPCs (marked "hired") alongside the characters, and the server sends them to everyone who can see them.
- The watch's hours: the watch order's editor sets when the watch starts and how long it lasts (1–12 hours; 22:00 for eight by default), saved with prep, and the party page, the GM sheet, the clock card and the copied text all follow it.
- Orders in the palette: Ctrl+K "marching", "watch" or "orders" lists the marching order ("Bo · In front", "Ann · 2nd in line", "Cy · At the back") and the night's watches with their hours, each opening the party page.
- My place and watch: a character's (or hired NPC's) page says where they march and which watch they keep ("🥾 Ann marches 2nd in line and keeps the 22:00–02:00 watch"), with a link to the party's orders.
- Guild members: a guild's (or faction's or clan's) page has "Members of the party", the player characters connected to it either way, beside the NPC members it already showed.
- Dues due: when a guild's "Dues & benefits" names an amount and a period ("5 gp a month", "2 sp per tenday", "50 gp a year"), each member says what they owe for this in-world month, or that it's paid (read from their sheet's log, so nothing new is stored).
- Pay the dues: GMs get "Take the dues" beside each member who owes, which takes the month's dues from their purse (refusing when they can't pay) and logs "Paid 5 gp dues to the Masons for Thawmoon 1040".
- A full sweep (#557): all 535 browser tests clean against sweep #545, first time through (the four new checks print their own results: no accessibility violations light or dark, and the big-world pages all under 200 ms).
- Dues on the party page: "🏛 Dues owed for Thawmoon 1040: Ann 5 gp to the Masons…" (players see their own characters').
- Ranks: a member's rank comes from the label on the link between them ("journeyman of" → Journeyman, "spy for" → Spy; plain "member of" gives none), shown on the guild's members list.
- My guilds: a character's page says what they belong to, with rank and this month's dues ("🏛 Belongs to the Masons (Journeyman) · owes 5 gp for Thawmoon 1040").
- Dues in the palette: Ctrl+K "dues" lists the dues still owed this month, each opening the guild.
- Session timer: session prep has "⏱ Session timer": start it when play begins, and "Stop and save to Session 12" saves how long it ran to that session's new "How long it ran" field (additive); it's kept in the GM's browser, per world, so a reload doesn't lose it.
- Time for a break: the running timer suggests a break every ninety minutes ("☕ 1 h 30 min in: time for a short break?"), until the GM marks it done.
- How long it ran: a session's page shows its length, and the session list adds " · ran 4 h 20 min" (lengths written by hand read too: "3h", "2.5 hours", "3:15").
- Average session: the numbers page has an "Average session" tile ("3 h 40 min, over 2 sessions").
- Languages: characters and NPCs have a "Languages" field (additive; any separators), and Forge characters' sheet languages count too.
- Who can talk to them: an NPC's page says what they speak and who in the party (active characters and hirelings) shares a language ("🗣 Speaks Dwarvish, Giant. The party can talk with them: Bo (Dwarvish)."), or that nobody does.
- The party's tongues: the party page folds out "🗣 Languages the party speaks", each language with who speaks it.
- Who speaks it?: Ctrl+K "who speaks Elvish" (or "speaks Elvish") lists the characters and NPCs who do, with all their languages, or says nobody does.
- An interpreter: when nobody in the party shares a language with an NPC, their page suggests up to three NPCs who speak one of theirs and one of the party's, those in the same town first ("An interpreter? Near Elf (Elvish, Sylvan), Far Druid (Sylvan, Common)").
- Languages on NPC cards: the printable NPC cards show "🗣 Speaks: Common, Dwarvish", flagged "(nobody in the party does)" when that's so.
- Lost in translation: session prep's "Around now" and "People" lists flag NPCs nobody in the party can talk to ("🗣 no common tongue", with what they speak on hover).
- A full sweep (#573): all 543 browser tests clean against sweep #557, first time through (covering guild dues, the session timer and languages); accessibility still clean light and dark.
- Prophecies: lore has a "Prophecy" category, and a prophecy's page has "Signs", a checklist like a quest's objectives ("2 of 3 come to pass"): GMs add, hide, reveal and tick signs; players never receive the secret ones (the server leaves them out).
- Signs in the log: ticking a sign as come to pass offers to note it in the latest session's log ("A sign came to pass ([[The Drowned Bell]]): The bells ring with no one to ring them").
- Omens: the world's front page has "🔮 Omens": each prophecy this person knows, with the next sign still to come ("The Drowned Bell (1 of 2): still to come: A red moon").
- Fulfilled: a prophecy whose signs have all come to pass says "✨ Fulfilled" on its page and in the omens, and the numbers page lists prophecies by how close each is.
- When it came to pass: ticking a prophecy's sign keeps the in-world date (in its signs list, so nothing new is stored elsewhere), shown beside it ("· came to pass 5 Thawmoon 1040"); unticking clears it.
- Prophecies in the palette: Ctrl+K "omens", "prophecies" or "signs" lists them, closest first ("🔮 1 of 2 signs · next: A Red Moon rises", "✨ Fulfilled").
- Bound to a prophecy: a quest linked with a prophecy (either way) says so on its page ("🔮 Bound to The Drowned Bell (1 of 2 signs)").
- A full sweep (#581): all 546 browser tests clean against sweep #573, first time through (covering languages and prophecies); accessibility still clean light and dark.
- Riddles: a handout can carry a riddle's answer (several accepted, separated by |) in a GM-only field; the server never sends it to players, however the handout reached them (shared ones too), and its page has "🧩 Riddle".
- Guesses: players answer on the handout; the server checks the guess whatever its case, spacing, punctuation or a leading "the", says if it isn't right, and records who solved it ("✔ Solved by Pip").
- Hints: GMs list hints one per line and reveal them one at a time ("Reveal hint 2 of 3"); players only ever receive the hints shown so far.
