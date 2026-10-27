// Site admin only: everyone with an account.
// GET                          list people and the worlds they belong to
// POST {name, world?, role?}   create a person; the response carries their personal code (shown once).
//                              With a world, they're added to it as gm or player.
// PATCH {id, ...}              {disabled}, {admin: true|false}, {name} or {newCode: true}
// PATCH {site: {locked}}       members-only site on or off
import { route, send, fail, sql, requireAdmin, newCode, codeHash, siteLocked } from './_lib/core.js';

export default route({
  async GET(req, res) {
    if (!requireAdmin(req, res)) return;
    const rows = await sql`SELECT g.id, g.name, g.role, g.disabled, g.created_at, g.last_seen,
      (SELECT count(*)::int FROM history h WHERE h.gm_id = g.id) AS edits,
      COALESCE((SELECT json_agg(json_build_object('world', w.name, 'slug', w.slug, 'role', m.role)) FROM members m JOIN worlds w ON w.id = m.world_id WHERE m.gm_id = g.id), '[]') AS worlds
      FROM gms g ORDER BY g.created_at`;
    send(res, 200, { gms: rows, site: { locked: await siteLocked() } });
  },
  async POST(req, res) {
    if (!requireAdmin(req, res)) return;
    const name = String(req.body.name || '').trim().slice(0, 60);
    if (!name) return fail(res, 400, 'Give them a name so everyone can see who wrote what.');
    const code = newCode();
    const rows = await sql`INSERT INTO gms (name, role, code_hash) VALUES (${name}, 'user', ${codeHash(code)}) RETURNING id, name, role, disabled, created_at, last_seen`;
    const world = String(req.body.world || '');
    if (world) {
      const role = ['owner', 'gm', 'player'].includes(req.body.role) ? req.body.role : 'gm';
      await sql`INSERT INTO members (world_id, gm_id, role) SELECT id, ${rows[0].id}, ${role} FROM worlds WHERE id = ${world} OR slug = ${world} ON CONFLICT DO NOTHING`;
    }
    send(res, 201, { gm: rows[0], code });
  },
  async PATCH(req, res) {
    if (!requireAdmin(req, res)) return;
    if (req.body.site) {
      const locked = Boolean(req.body.site.locked);
      await sql`INSERT INTO settings (key, value) VALUES ('site', ${JSON.stringify({ locked })}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      return send(res, 200, { site: { locked } });
    }
    const id = Number(req.body.id);
    const rows = await sql`SELECT id, role FROM gms WHERE id = ${id}`;
    if (!rows.length) return fail(res, 404, 'No one with that id.');
    if (id === req.gm.id && (req.body.disabled || req.body.admin === false)) return fail(res, 400, 'You can’t lock yourself out of the admin account.');
    let code = null;
    if (typeof req.body.disabled === 'boolean') {
      await sql`UPDATE gms SET disabled = ${req.body.disabled} WHERE id = ${id}`;
      if (req.body.disabled) await sql`DELETE FROM sessions WHERE gm_id = ${id}`;
    }
    if (typeof req.body.admin === 'boolean') await sql`UPDATE gms SET role = ${req.body.admin ? 'admin' : 'user'} WHERE id = ${id}`;
    if (req.body.name) await sql`UPDATE gms SET name = ${String(req.body.name).trim().slice(0, 60)} WHERE id = ${id}`;
    if (req.body.newCode) {
      code = newCode();
      await sql`UPDATE gms SET code_hash = ${codeHash(code)} WHERE id = ${id}`;
      await sql`DELETE FROM sessions WHERE gm_id = ${id}`;
    }
    const out = await sql`SELECT id, name, role, disabled, created_at, last_seen FROM gms WHERE id = ${id}`;
    send(res, 200, { gm: out[0], code });
  },
});
