// Worlds and their members.
// GET                         your worlds, plus public worlds you could browse
// GET ?id=                    one world with its members and invite codes (owner)
// POST {name}                 create a world; you become its owner
// PATCH {id, rotate: 'gm'|'player'}        new invite code (owner)
// PATCH {id, member, role}    change someone's role: owner, gm or player (owner)
// DELETE ?id=&member=         remove someone from the world (owner, or yourself to leave)
// DELETE ?id=                 archive the world (owner); nothing is deleted
import { route, send, fail, sql, newCode, newId, requireSignedIn, slugify, worldContext, myWorlds } from './_lib/core.js';

const ROLES = ['owner', 'gm', 'player'];

async function ownerCtx(req, res, id) {
  req.query = { ...(req.query || {}), world: id };
  await worldContext(req);
  if (!req.world || req.world.id !== id) { fail(res, 404, 'That world doesn’t exist.'); return false; }
  if (req.role !== 'owner') { fail(res, 403, 'Only this world’s owner can do that.'); return false; }
  return true;
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
