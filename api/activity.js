// GET recent changes across the world, ?since=<time> for all changes after it, or ?id= for one entry's history. GMs only.
import { route, send, sql, requireGm } from './_lib/core.js';

export default route({
  async GET(req, res) {
    if (!requireGm(req, res)) return;
    const id = req.query?.id;
    // ?since=<ISO time>: everything after it (up to 1000), for session recaps.
    const t = Date.parse(req.query?.since || ''), since = Number.isFinite(t) ? new Date(t).toISOString() : null;
    const rows = id
      ? await sql`SELECT h.id, h.entry_id, h.action, h.at, h.snapshot, g.name AS gm FROM history h LEFT JOIN gms g ON g.id = h.gm_id JOIN entries e ON e.id = h.entry_id WHERE h.entry_id = ${id} AND e.world_id = ${req.world.id} ORDER BY h.at DESC LIMIT 50`
      : since
        ? await sql`SELECT h.id, h.entry_id, h.action, h.at, g.name AS gm, e.name AS entry_name, e.kind FROM history h
          LEFT JOIN gms g ON g.id = h.gm_id JOIN entries e ON e.id = h.entry_id WHERE e.world_id = ${req.world.id} AND h.at > ${since} ORDER BY h.at DESC LIMIT 1000`
        : await sql`SELECT h.id, h.entry_id, h.action, h.at, g.name AS gm, e.name AS entry_name, e.kind FROM history h
          LEFT JOIN gms g ON g.id = h.gm_id JOIN entries e ON e.id = h.entry_id WHERE e.world_id = ${req.world.id} ORDER BY h.at DESC LIMIT 100`;
    send(res, 200, { activity: rows });
  },
}, { world: true });
