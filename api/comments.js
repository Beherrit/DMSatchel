// GM discussion threads on entries. GMs only; players never see these.
// GET ?entry_id=          every comment on one entry
// GET                     open threads across the world (newest activity first)
// POST {entry_id, body, parent_id}   start a thread or reply
// PATCH {id, resolved}    resolve or reopen a thread · PATCH {id, body} edit your own comment
// DELETE ?id=             delete your own comment (the admin can delete any)
import { route, send, fail, sql, requireGm } from './_lib/core.js';

export default route({
  async GET(req, res) {
    if (!requireGm(req, res)) return;
    const entryId = req.query?.entry_id;
    if (entryId) {
      const rows = await sql`SELECT c.id, c.entry_id, c.parent_id, c.body, c.resolved, c.created_at, c.edited_at, c.gm_id, g.name AS gm
        FROM comments c LEFT JOIN gms g ON g.id = c.gm_id WHERE c.entry_id = ${entryId} ORDER BY c.created_at`;
      return send(res, 200, { comments: rows });
    }
    const rows = await sql`SELECT t.id, t.entry_id, t.body, t.created_at, g.name AS gm, e.name AS entry_name, e.kind,
        (SELECT count(*)::int FROM comments r WHERE r.parent_id = t.id) AS replies,
        GREATEST(t.created_at, COALESCE((SELECT max(r.created_at) FROM comments r WHERE r.parent_id = t.id), t.created_at)) AS last_at
      FROM comments t LEFT JOIN gms g ON g.id = t.gm_id LEFT JOIN entries e ON e.id = t.entry_id
      WHERE t.parent_id IS NULL AND NOT t.resolved AND (e.deleted IS NOT TRUE) ORDER BY last_at DESC LIMIT 100`;
    send(res, 200, { threads: rows });
  },
  async POST(req, res) {
    if (!requireGm(req, res)) return;
    const body = String(req.body.body || '').trim().slice(0, 5000);
    if (!body) return fail(res, 400, 'Write something first.');
    const entryId = String(req.body.entry_id || '').slice(0, 40);
    const parentId = req.body.parent_id ? Number(req.body.parent_id) : null;
    if (parentId) {
      const p = await sql`SELECT id FROM comments WHERE id = ${parentId} AND entry_id = ${entryId} AND parent_id IS NULL`;
      if (!p.length) return fail(res, 404, 'That thread was deleted.');
      await sql`UPDATE comments SET resolved = false WHERE id = ${parentId}`;
    }
    const rows = await sql`INSERT INTO comments (entry_id, parent_id, gm_id, body) VALUES (${entryId}, ${parentId}, ${req.gm.id}, ${body})
      RETURNING id, entry_id, parent_id, body, resolved, created_at, edited_at, gm_id`;
    send(res, 201, { comment: { ...rows[0], gm: req.gm.name } });
  },
  async PATCH(req, res) {
    if (!requireGm(req, res)) return;
    const id = Number(req.body.id);
    const cur = (await sql`SELECT id, gm_id FROM comments WHERE id = ${id}`)[0];
    if (!cur) return fail(res, 404, 'That comment was deleted.');
    if (typeof req.body.resolved === 'boolean') await sql`UPDATE comments SET resolved = ${req.body.resolved} WHERE id = ${id}`;
    if (typeof req.body.body === 'string') {
      if (cur.gm_id !== req.gm.id) return fail(res, 403, 'You can only edit your own comments.');
      await sql`UPDATE comments SET body = ${req.body.body.trim().slice(0, 5000)}, edited_at = now() WHERE id = ${id}`;
    }
    send(res, 200, { ok: true });
  },
  async DELETE(req, res) {
    if (!requireGm(req, res)) return;
    const id = Number(req.query?.id);
    const cur = (await sql`SELECT id, gm_id FROM comments WHERE id = ${id}`)[0];
    if (!cur) return fail(res, 404, 'That comment was already deleted.');
    if (cur.gm_id !== req.gm.id && req.gm.role !== 'admin') return fail(res, 403, 'You can only delete your own comments.');
    await sql`DELETE FROM comments WHERE id = ${id} OR parent_id = ${id}`;
    send(res, 200, { ok: true });
  },
});
