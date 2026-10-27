// Admin only: the GM roster.
// GET                      list GMs
// POST {name, role}        add a GM; the response carries their invite code (shown once)
// PATCH {id, ...}          {disabled}, {role}, {name} or {newCode: true}
import { route, send, fail, sql, requireAdmin, newCode, codeHash } from './_lib/core.js';

const ROLES = ['gm', 'admin'];

export default route({
  async GET(req, res) {
    if (!requireAdmin(req, res)) return;
    const rows = await sql`SELECT g.id, g.name, g.role, g.disabled, g.created_at, g.last_seen,
      (SELECT count(*)::int FROM history h WHERE h.gm_id = g.id) AS edits FROM gms g ORDER BY g.created_at`;
    send(res, 200, { gms: rows });
  },
  async POST(req, res) {
    if (!requireAdmin(req, res)) return;
    const name = String(req.body.name || '').trim().slice(0, 60);
    if (!name) return fail(res, 400, 'Give the GM a name so everyone can see who wrote what.');
    const role = ROLES.includes(req.body.role) ? req.body.role : 'gm';
    const code = newCode();
    const rows = await sql`INSERT INTO gms (name, role, code_hash) VALUES (${name}, ${role}, ${codeHash(code)}) RETURNING id, name, role, disabled, created_at, last_seen`;
    send(res, 201, { gm: rows[0], code });
  },
  async PATCH(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = Number(req.body.id);
    const rows = await sql`SELECT id, role FROM gms WHERE id = ${id}`;
    if (!rows.length) return fail(res, 404, 'No GM with that id.');
    if (id === req.gm.id && (req.body.disabled || req.body.role === 'gm')) return fail(res, 400, 'You can’t lock yourself out of the admin account.');
    let code = null;
    if (typeof req.body.disabled === 'boolean') {
      await sql`UPDATE gms SET disabled = ${req.body.disabled} WHERE id = ${id}`;
      if (req.body.disabled) await sql`DELETE FROM sessions WHERE gm_id = ${id}`;
    }
    if (ROLES.includes(req.body.role)) await sql`UPDATE gms SET role = ${req.body.role} WHERE id = ${id}`;
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
