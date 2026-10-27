# The DM's Satchel

A toolkit for running fifth-edition tabletop games, plus a shared world wiki that several GMs can build together.

- **Table Tools**: NPCs (with ancestry, role, look, voice, wants and secrets), a quest builder, factions/guilds/clans,
  names for people, towns, taverns, shops, ships and guilds, settlements/taverns/shops, sensory descriptions,
  rumors, plot hooks, trinkets and loot by challenge tier. Reroll any single line with ↻.
- **Character Forge**: a complete character under the 2024 rules at any level from 1 to 20: species and lineage,
  class and subclass, background with its ability bonuses, origin feat, skills and tools, ability scores (standard
  array, point buy or 4d6), level-up feats and ASIs, HP, AC, attacks, spellcasting and slots, class resources and
  features by level. Every character comes with a life story in the style of DCUGen's lifepaths: family and standing,
  upbringing and childhood events, why they took up their background and class, adult life, the people in their
  life, personality, goals, secrets, regrets and hooks for the DM. Each section rerolls on its own, characters are
  seeded so the same link always shows the same character, and sheets can be copied, downloaded, printed or shared.
- **World**: a wiki for one shared campaign world: regions, settlements, locations, factions, guilds, clans and
  houses, NPCs, player characters, deities, items, a timeline of events, quests and lore. Entries nest
  ("located in"), connect to each other ("member of", "enemy of"…), link by name with `[[Entry Name]]`, and carry
  GM-only secrets players never see. Anything from the table tools or the Character Forge can be sent to the world
  with **Add to world**. Every change records who made it; if two GMs edit the same entry, the second save is
  stopped instead of overwriting the first.
- **Admin**: invite GMs with personal codes, lock out or reissue codes, name the world, see recent activity, and
  download or import a full backup.
- **Reference**: classes with features by level, species, backgrounds, feats and spell slot tables.

Players can open the site and read the world; only signed-in GMs can add or edit, and only GMs see secrets.
The session notebook keeps each DM's personal saves in their own browser.

## Setup on Vercel

The site is static files plus a few serverless functions in `api/`. There is no build step.

1. **Import the repo** into Vercel (Framework preset: Other). The table tools, Character Forge and Reference work
   right away.
2. **Add a database**: in the Vercel project, open *Storage* → *Create* → **Neon** (Postgres), and connect it to the
   project. This sets `DATABASE_URL`. Tables are created automatically on the first request.
3. **Set the admin code**: in *Settings* → *Environment Variables*, add `ADMIN_CODE` with a long random value
   (for example from a password manager). Redeploy.
4. Open the site, choose **GM sign in**, and enter the admin code. Go to **Admin** to name the world and create an
   invite code for each GM. Codes are shown once; send them privately. Changing `ADMIN_CODE` later changes the admin
   login.

## Local preview

```
npm install
npm run dev     # static preview at http://localhost:5173 (the shared world needs Vercel and the database)
npm test
```

`vercel dev` runs the API locally too, if you have the Vercel CLI and a `DATABASE_URL`.

## Legal

Unofficial fan content, not affiliated with or endorsed by Wizards of the Coast. Rules data summarizes game mechanics
in original wording; all names, tables, stories and descriptions are original except SRD terms.

This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC,
available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0
International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.
