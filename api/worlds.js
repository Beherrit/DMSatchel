// Worlds and their members.
// GET                         your worlds, plus public worlds you could browse
// GET ?id=                    one world with its members and invite codes (owner)
// POST {name}                 create a world; you become its owner
// PATCH {id, rotate: 'gm'|'player'}        new invite code (owner)
// PATCH {id, member, role}    change someone's role: owner, gm or player (owner)
// DELETE ?id=&member=         remove someone from the world (owner, or yourself to leave)
// DELETE ?id=                 archive the world (owner); nothing is deleted
//
// Backups (see js/backup.js; the page puts the file together, so no one response grows too big):
// GET ?id=&backup=1           (owner) the world's settings, maps (images that are links; uploaded ones come from the
//                             maps API), standing, clocks, treasury and quotes. Entries come from the entries API.
// POST {restore: {world}}     a new world from a backup's settings; you own it ("<name> (restored)")
// POST {name, like: worldId}   a new world with the settings of one you GM (calendar, own fields, templates, session
//                             zero, tag descriptions), none of its entries; you own it
// POST {restore_extras: {id, standing, clocks, ledger, quotes}}   (owner of that world) add a backup's rows to it
import { route, send, fail, sql, newCode, newId, requireSignedIn, slugify, worldContext, myWorlds } from './_lib/core.js';

const ROLES = ['owner', 'gm', 'player'];

async function ownerCtx(req, res, id) {
  req.query = { ...(req.query || {}), world: id };
  await worldContext(req);
  if (!req.world || req.world.id !== id) { fail(res, 404, 'That world doesn’t exist.'); return false; }
  if (req.role !== 'owner') { fail(res, 403, 'Only this world’s owner can do that.'); return false; }
  return true;
}

// A backup's rows, added to a world you own (one statement per kind of row).
async function restoreExtras(req, res, x) {
  if (!(await ownerCtx(req, res, String(x?.id || '')))) return;
  const w = req.world.id, list = (v, n = 5000) => JSON.stringify((Array.isArray(v) ? v : []).slice(0, n));
  const counts = {};
  counts.standing = (await sql`INSERT INTO standing_log (world_id, entry_id, value, delta, reason, session_id, secret, gm_id, at)
    SELECT ${w}, r.entry_id, COALESCE(r.value, 0), COALESCE(r.delta, 0), COALESCE(r.reason, ''), r.session_id, COALESCE(r.secret, false), ${req.gm.id}, COALESCE(r.at, now())
    FROM jsonb_to_recordset(${list(x.standing)}::jsonb) AS r(entry_id text, value int, delta int, reason text, session_id text, secret boolean, at timestamptz)
    WHERE r.entry_id IN (SELECT id FROM entries WHERE world_id = ${w}) RETURNING id`).length;
  counts.clocks = (await sql`INSERT INTO clocks (world_id, entry_id, name, size, filled, per_turn, secret, note, created_by)
    SELECT ${w}, r.entry_id, LEFT(COALESCE(r.name, 'Clock'), 120), LEAST(GREATEST(COALESCE(r.size, 6), 2), 24), GREATEST(COALESCE(r.filled, 0), 0), COALESCE(r.per_turn, 0), COALESCE(r.secret, false), LEFT(COALESCE(r.note, ''), 2000), ${req.gm.id}
    FROM jsonb_to_recordset(${list(x.clocks, 500)}::jsonb) AS r(entry_id text, name text, size int, filled int, per_turn int, secret boolean, note text)
    WHERE r.entry_id IN (SELECT id FROM entries WHERE world_id = ${w}) RETURNING id`).length;
  counts.ledger = (await sql`INSERT INTO party_ledger (world_id, at, gm_id, cp, item, qty, holder, note, session_id)
    SELECT ${w}, COALESCE(r.at, now()), ${req.gm.id}, COALESCE(r.cp, 0), LEFT(COALESCE(r.item, ''), 200), COALESCE(r.qty, 0), LEFT(COALESCE(r.holder, ''), 120), LEFT(COALESCE(r.note, ''), 500), r.session_id
    FROM jsonb_to_recordset(${list(x.ledger)}::jsonb) AS r(at timestamptz, cp bigint, item text, qty int, holder text, note text, session_id text) RETURNING id`).length;
  counts.quotes = (await sql`INSERT INTO table_quotes (world_id, gm_id, text, said_by, session_id, created_at)
    SELECT ${w}, ${req.gm.id}, LEFT(r.text, 500), LEFT(COALESCE(r.said_by, ''), 80), r.session_id, COALESCE(r.created_at, now())
    FROM jsonb_to_recordset(${list(x.quotes, 1000)}::jsonb) AS r(text text, said_by text, session_id text, created_at timestamptz) WHERE COALESCE(r.text, '') <> '' RETURNING id`).length;
  send(res, 200, { restored: counts });
}

async function detail(w) {
  const members = await sql`SELECT g.id, g.name, m.role, m.joined_at, g.last_seen,
      (SELECT count(*)::int FROM history h JOIN entries e ON e.id = h.entry_id WHERE h.gm_id = g.id AND e.world_id = ${w.id}) AS edits
    FROM members m JOIN gms g ON g.id = m.gm_id WHERE m.world_id = ${w.id} ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'gm' THEN 1 ELSE 2 END, g.name`;
  const counts = (await sql`SELECT count(*)::int AS n FROM entries WHERE world_id = ${w.id} AND NOT deleted`)[0];
  return { id: w.id, slug: w.slug, name: w.name, tagline: w.tagline, public: w.public, gm_invite: w.gm_invite, player_invite: w.player_invite, members, entries: counts.n };
}

export default route({
  async GET(req, res) {
    const id = req.query?.id;
    if (id && req.query.backup) {
      if (!(await ownerCtx(req, res, id))) return;
      const w = req.world;
      const maps = await sql`SELECT id, name, width, height, pins, entry_id, secret, miles, fog, CASE WHEN image LIKE 'data:%' THEN NULL ELSE image END AS url
        FROM maps WHERE world_id = ${w.id} AND NOT deleted ORDER BY created_at`;
      const standing = await sql`SELECT s.entry_id, s.value, s.delta, s.reason, s.session_id, s.secret, s.at FROM standing_log s JOIN entries e ON e.id = s.entry_id
        WHERE e.world_id = ${w.id} ORDER BY s.at, s.id`;
      const clocks = await sql`SELECT entry_id, name, size, filled, per_turn, secret, note FROM clocks WHERE world_id = ${w.id} AND NOT deleted ORDER BY id`;
      const ledger = await sql`SELECT at, cp, item, qty, holder, note, session_id FROM party_ledger WHERE world_id = ${w.id} AND NOT deleted ORDER BY at, id`;
      const quotes = await sql`SELECT text, said_by, session_id, created_at FROM table_quotes WHERE world_id = ${w.id} AND NOT deleted ORDER BY created_at, id`;
      return send(res, 200, {
        world: { name: w.name, tagline: w.tagline, about: w.about, calendar: w.calendar, cal: w.cal, prep: w.prep, templates: w.templates, custom_fields: w.custom_fields,
          primer: w.primer, clock: w.clock, start_here: w.start_here, tag_notes: w.tag_notes, tag_colors: w.tag_colors },
        maps, standing, clocks, ledger, quotes });
    }
    if (id) {
      if (!(await ownerCtx(req, res, id))) return;
      return send(res, 200, { world: await detail(req.world) });
    }
    const mine = await myWorlds(req.gm);
    const open = await sql`SELECT w.id, w.slug, w.name, w.tagline,
        (SELECT count(*)::int FROM entries e WHERE e.world_id = w.id AND NOT e.deleted AND e.visibility = 'all' AND e.status = 'live') AS entries
      FROM worlds w WHERE w.public AND NOT w.archived ORDER BY w.created_at`;
    send(res, 200, { mine, public: open.filter((w) => !mine.some((m) => m.id === w.id)) });
  },
  async POST(req, res) {
    if (!requireSignedIn(req, res)) return;
    if (req.body.restore_extras) return restoreExtras(req, res, req.body.restore_extras);
    if (req.body.restore) req.body = { ...req.body.restore.world, restoring: req.body.restore.world || {} };
    if (req.body.like) {
      const src = (await sql`SELECT w.* FROM worlds w LEFT JOIN members m ON m.world_id = w.id AND m.gm_id = ${req.gm.id}
        WHERE w.id = ${String(req.body.like).slice(0, 80)} AND NOT w.archived AND (m.role IN ('owner', 'gm') OR ${req.gm.role === 'admin'})`)[0];
      if (!src) return fail(res, 404, 'You can only copy the settings of a world you GM.');
      // The calendar comes along as it stands; nothing about play (prep, time of day, start here) does.
      req.body = { name: req.body.name, tagline: req.body.tagline, liking: { calendar: src.calendar, cal: src.cal, templates: src.templates, custom_fields: src.custom_fields, primer: src.primer, tag_notes: src.tag_notes, tag_colors: src.tag_colors } };
    }
    const name = String(req.body.name || '').trim().slice(0, 120);
    if (!name) return fail(res, 400, 'Give the world a name.');
    const count = (await sql`SELECT count(*)::int AS n FROM members WHERE gm_id = ${req.gm.id} AND role = 'owner'`)[0].n;
    if (count >= 25 && req.gm.role !== 'admin') return fail(res, 400, 'You already own 25 worlds. Archive one first.');
    let slug = slugify(name);
    if ((await sql`SELECT 1 FROM worlds WHERE slug = ${slug}`).length) slug = `${slug}-${newId().slice(0, 4)}`;
    const id = newId();
    await sql`INSERT INTO worlds (id, slug, name, tagline, public, gm_invite, player_invite, created_by)
      VALUES (${id}, ${slug}, ${name}, ${String(req.body.tagline || '').slice(0, 240)}, ${Boolean(req.body.public)}, ${newCode()}, ${newCode()}, ${req.gm.id})`;
    await sql`INSERT INTO members (world_id, gm_id, role) VALUES (${id}, ${req.gm.id}, 'owner')`;
    // Restoring a backup: its settings come along (the entries, maps and the rest follow in their own requests).
    const lk = req.body.liking;
    if (lk) {
      const j = (v) => (v && typeof v === 'object' ? JSON.stringify(v) : null);
      await sql`UPDATE worlds SET calendar = ${String(lk.calendar || '').slice(0, 2000)}, cal = ${j(lk.cal)}::jsonb, templates = ${j(lk.templates)}::jsonb,
        custom_fields = ${j(lk.custom_fields)}::jsonb, primer = ${j(lk.primer)}::jsonb, tag_notes = ${j(lk.tag_notes)}::jsonb, tag_colors = ${j(lk.tag_colors)}::jsonb WHERE id = ${id}`;
    }
    const r = req.body.restoring;
    if (r) {
      const j = (v) => (v && typeof v === 'object' ? JSON.stringify(v) : null);
      await sql`UPDATE worlds SET name = ${`${name} (restored)`.slice(0, 120)}, about = ${String(r.about || '').slice(0, 20000)}, calendar = ${String(r.calendar || '').slice(0, 2000)},
        cal = ${j(r.cal)}::jsonb, prep = ${j(r.prep)}::jsonb, templates = ${j(r.templates)}::jsonb, custom_fields = ${j(r.custom_fields)}::jsonb, primer = ${j(r.primer)}::jsonb,
        clock = ${j(r.clock)}::jsonb, start_here = ${j(r.start_here)}::jsonb, tag_notes = ${j(r.tag_notes)}::jsonb, tag_colors = ${j(r.tag_colors)}::jsonb WHERE id = ${id}`;
    }
    const w = (await sql`SELECT * FROM worlds WHERE id = ${id}`)[0];
    send(res, 201, { world: await detail(w), worlds: await myWorlds(req.gm) });
  },
  async PATCH(req, res) {
    if (!requireSignedIn(req, res)) return;
    const b = req.body || {};
    if (!(await ownerCtx(req, res, String(b.id || '')))) return;
    const w = req.world;
    if (b.rotate === 'gm') await sql`UPDATE worlds SET gm_invite = ${newCode()} WHERE id = ${w.id}`;
    if (b.rotate === 'player') await sql`UPDATE worlds SET player_invite = ${newCode()} WHERE id = ${w.id}`;
    if (b.member) {
      const role = ROLES.includes(b.role) ? b.role : null;
      if (!role) return fail(res, 400, 'Pick owner, GM or player.');
      if (Number(b.member) === req.gm.id && role !== 'owner') {
        const owners = (await sql`SELECT count(*)::int AS n FROM members WHERE world_id = ${w.id} AND role = 'owner'`)[0].n;
        if (owners <= 1) return fail(res, 400, 'Make someone else an owner first, so the world isn’t left without one.');
      }
      await sql`UPDATE members SET role = ${role} WHERE world_id = ${w.id} AND gm_id = ${Number(b.member)}`;
    }
    const fresh = (await sql`SELECT * FROM worlds WHERE id = ${w.id}`)[0];
    send(res, 200, { world: await detail(fresh) });
  },
  async DELETE(req, res) {
    if (!requireSignedIn(req, res)) return;
    const { id, member } = req.query || {};
    if (member && Number(member) === req.gm.id) {
      const owners = (await sql`SELECT count(*)::int AS n FROM members WHERE world_id = ${id} AND role = 'owner' AND gm_id <> ${req.gm.id}`)[0].n;
      const me = (await sql`SELECT role FROM members WHERE world_id = ${id} AND gm_id = ${req.gm.id}`)[0];
      if (me?.role === 'owner' && !owners) return fail(res, 400, 'You’re the only owner. Make someone else an owner before leaving.');
      await sql`DELETE FROM members WHERE world_id = ${id} AND gm_id = ${req.gm.id}`;
      return send(res, 200, { worlds: await myWorlds(req.gm) });
    }
    if (!(await ownerCtx(req, res, String(id || '')))) return;
    if (member) {
      await sql`DELETE FROM members WHERE world_id = ${id} AND gm_id = ${Number(member)}`;
      return send(res, 200, { world: await detail(req.world) });
    }
    await sql`UPDATE worlds SET archived = true WHERE id = ${id}`;
    send(res, 200, { worlds: await myWorlds(req.gm) });
  },
});
