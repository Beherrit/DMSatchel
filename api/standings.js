// The party's standing with factions, guilds, clans and others.
// GET                       current standing for every entry, plus the change log (GM-only changes hidden from players)
// POST {entry_id, value, reason, session_id, secret}   record a new standing (GM)
// DELETE ?id=               remove one log line, e.g. a mistake (GM)
import { route, send, fail, sql, requireGm } from './_lib/core.js';

export default route({
  async GET(req, res) {
    const isGm = Boolean(req.gm);
    const rows = await sql`SELECT s.id, s.entry_id, s.value, s.delta, s.reason, s.session_id, s.secret, s.at, g.name AS gm
      FROM standing_log s LEFT JOIN gms g ON g.id = s.gm_id ORDER BY s.at DESC LIMIT 2000`;
    const log = rows.filter((r) => isGm || !r.secret);
    const current = {};
    for (const r of log) if (!(r.entry_id in current)) current[r.entry_id] = { value: r.value, at: r.at };
    send(res, 200, { current, log });
  },
  async POST(req, res) {
    if (!requireGm(req, res)) return;
    const b = req.body || {};
    const entryId = String(b.entry_id || '').slice(0, 40);
    const exists = await sql`SELECT id FROM entries WHERE id = ${entryId} AND NOT deleted`;
    if (!exists.length) return fail(res, 404, 'That entry doesn’t exist.');
    const value = Math.max(-5, Math.min(5, Math.round(Number(b.value) || 0)));
    const prev = await sql`SELECT value FROM standing_log WHERE entry_id = ${entryId} ORDER BY at DESC LIMIT 1`;
    const delta = value - (prev[0]?.value ?? 0);
    const rows = await sql`INSERT INTO standing_log (entry_id, value, delta, reason, session_id, secret, gm_id)
      VALUES (${entryId}, ${value}, ${delta}, ${String(b.reason || '').slice(0, 1000)}, ${b.session_id ? String(b.session_id).slice(0, 40) : null}, ${Boolean(b.secret)}, ${req.gm.id})
      RETURNING id, entry_id, value, delta, reason, session_id, secret, at`;
    send(res, 201, { entry: { ...rows[0], gm: req.gm.name } });
  },
  async DELETE(req, res) {
    if (!requireGm(req, res)) return;
    const rows = await sql`DELETE FROM standing_log WHERE id = ${Number(req.query?.id)} RETURNING id`;
    if (!rows.length) return fail(res, 404, 'That change was already removed.');
    send(res, 200, { ok: true });
  },
});
