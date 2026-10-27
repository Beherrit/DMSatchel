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
2. [ ] **Magic items and curses.** A full SRD magic item catalog in js/magic-items.js: name, rarity, type,
   attunement (and by whom), and a short original summary of what it does. Cursed items from the SRD flagged with
   their curse. A curse generator that can curse any item (bound to the user, penalties, compulsions, attracts
   things, slowly corrupts…) with a hidden reveal condition and a way to break it. A unique item maker: name,
   appearance, property, minor quirk, history and optional curse. Reference tab with filters (rarity, type,
   attunement, cursed). Loot, quest rewards, shops and the world's Item entries all draw on it; a cursed item's
   curse goes in the GM-only secret.
3. [ ] **Shops and economy.** Shop inventories from real 5e gear at SRD prices, with quantity in stock.
   Settlements get an economy (Booming, Stable, Struggling, Besieged…), inflation %, and market conditions per
   goods category: shortage (price ×1.5–3, few or none in stock), surplus (discount, plenty), embargo, festival.
   A market event explains why ("the mines flooded, iron is scarce"). Haggling DC, buy-back at half price,
   restock button, special stock (rare or magic items by town size and shop type). Shops inherit their town's
   economy. Works in Table Tools, on town pages (Market tab) and on shop entries.
4. [ ] **Hidden entries (GM prep).** Per-entry visibility: Everyone or GMs only. Hidden entries never reach
   players (filter in API). "Reveal to players" button, with a log line. Hidden maps and pins already exist.
5. [ ] **Multiple worlds.** worlds table; entries, maps, standings, comments, history scoped by world_id. Migrate
   existing rows to a first world. World switcher in the header, world list page, create world, world settings
   per world. URLs include the world (#w/<slug>/...).
6. [ ] **Accounts, roles and players.** People (gms table) can belong to many worlds with a role per world:
   owner, GM, player. Per-world invite links/codes that create an account or add a membership. The site admin
   (ADMIN_CODE) can see everything. Players read revealed content, and can create and edit their own entries
   (characters, journal entries, notes), suggest edits/new entries (GM approves), and comment on quests.
7. [ ] **Party page.** Party members and their characters, shared treasure and loot log (gold in/out, items),
   party journal (players and GMs post), handouts the GM reveals (text and images), current quests.
8. [ ] **Player character sheets.** Characters from the Forge saved to the world and owned by a player:
   current HP, conditions, spell slots used, inventory, gold, notes, level-up. Players edit their own.
9. [ ] **Live updates.** Poll for changes every ~20 s while a world page is open; "Ana edited Ashford" toasts,
   refresh lists without losing form input. Edit conflicts already handled.
10. [ ] **Images.** Portraits for NPCs and characters, pictures for places and items, handout images. Vercel Blob
   store (create via MCP, connect to project), or small data URLs in Postgres as a fallback.
11. [ ] **In-world calendar.** Named months, current date, events and sessions placed on it, "days pass" button,
    moon phases optional. Timeline view of events by date.
12. [ ] **Encounters and travel helpers per area.** Random encounter table per area (built from its danger
    fields and SRD monsters), weather by season, travel time between pinned places on a map (scale setting).
13. [ ] **Dungeon and lair generator.** Room-by-room keyed dungeon with traps, monsters and loot, saved as a
    location with child rooms.
14. [ ] **Export and print.** World or region to Markdown/PDF-friendly print page; player-safe export.
15. [ ] **Offline and install.** Service worker caching the app shell so tools work offline; installable PWA.
16. [ ] **Polish pass.** Empty states, onboarding tour for new GMs and players, keyboard shortcuts, accessibility
    audit, performance with 2,000+ entries.

## Ideas parking lot
- Faction relationship matrix; faction turn/clock tracker between sessions.
- Rumor mill: rumors attached to towns that spread to neighbors over time.
- NPC relationship web per town; family trees for clans.
- Player "what I know" view per character.
- Discord webhook for session recaps.

## Log
- Character Forge, table tools, world wiki, admin, maps, web, sessions, standings, discussions, search shipped.
- Deep world builder: place hubs, quest boards, atlas, map drawers, Build console shipped.
- NPC stat blocks, spellcasting with slot pips, SRD spell lists by class, full Forge spellbooks shipped.
