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
31. [ ] **Next-session scheduler.** A GM proposes a few dates; everyone in the world marks yes / maybe / no; the
    best date is highlighted, can be locked in (it shows on the world home and calendar) and posted to Discord.
32. [ ] **Downtime between sessions.** Players file what their character does between sessions (train, craft,
    carouse, research, work); GMs resolve each with a short outcome that the player sees, and it lands in the
    character's history.
33. [ ] **Fog of war on maps.** GMs paint hidden areas over a map; players see only what's been revealed, and GMs
    reveal more as the party explores.

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
