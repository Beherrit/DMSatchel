// The party's standing with factions, guilds, clans and others.
// GET                       current standing for every entry, plus the change log (GM-only changes hidden from players)
// POST {entry_id, value, reason, session_id, secret}   record a new standing (GM)
// DELETE ?id=               remove one log line, e.g. a mistake (GM)
// Progress clocks live here too, since they track the same thing: what the world's powers are up to.
// POST {clock: {id?, entry_id, name, size, filled, per_turn, secret, note}}   create or change a clock (GM)
// POST {turn: true}         a faction turn: every unfinished clock advances by its per-turn amount (GM)
// DELETE ?clock=            remove a clock (GM; kept in the database)
import { route, send, fail, sql, requireGm } from './_lib/core.js';

export default route({
  async GET(req, res) {
    const isGm = req.isGmHere;
    const rows = await sql`SELECT s.id, s.entry_id, s.value, s.delta, s.reason, s.session_id, s.secret, s.at, g.name AS gm, e.visibility, e.status
      FROM standing_log s LEFT JOIN gms g ON g.id = s.gm_id JOIN entries e ON e.id = s.entry_id WHERE s.world_id = ${req.world.id} AND NOT e.deleted ORDER BY s.at DESC LIMIT 2000`;
    // Players see only open changes about entries they can see.
    const log = rows.filter((r) => isGm || (!r.secret && r.visibility === 'all' && r.status === 'live')).map(({ visibility, status, ...r }) => r);
    const current = {};
    for (const r of log) if (!(r.entry_id in current)) current[r.entry_id] = { value: r.value, at: r.at };
    const crows = await sql`SELECT c.id, c.entry_id, c.name, c.size, c.filled, c.per_turn, c.secret, c.note, c.updated_at, e.visibility, e.status
      FROM clocks c JOIN entries e ON e.id = c.entry_id WHERE c.world_id = ${req.world.id} AND NOT c.deleted AND NOT e.deleted ORDER BY c.id`;
    const clocks = crows.filter((c) => isGm || (!c.secret && c.visibility === 'all' && c.status === 'live')).map(({ visibility, status, ...c }) => c);
    send(res, 200, { current, log, clocks });
  },
  async POST(req, res) {
    if (!requireGm(req, res)) return;
    const b = req.body || {};
    if (b.turn) {
      const moved = await sql`UPDATE clocks SET filled = LEAST(size, filled + per_turn), updated_at = now()
        WHERE world_id = ${req.world.id} AND NOT deleted AND per_turn > 0 AND filled < size RETURNING id, entry_id, name, size, filled, per_turn, secret, note, updated_at`;
      return send(res, 200, { moved });
    }
    if (b.clock) {
      const c = b.clock;
      const size = [4, 6, 8, 10, 12].includes(Number(c.size)) ? Number(c.size) : 6;
      const filled = Math.max(0, Math.min(size, Math.round(Number(c.filled) || 0)));
      const perTurn = Math.max(0, Math.min(4, Math.round(Number(c.per_turn) || 0)));
      const name = String(c.name || '').trim().slice(0, 200);
      if (c.id) {
        const rows = await sql`UPDATE clocks SET name = COALESCE(NULLIF(${name}, ''), name), size = ${size}, filled = ${filled}, per_turn = ${perTurn}, secret = ${Boolean(c.secret)},
          note = ${String(c.note || '').slice(0, 1000)}, updated_at = now() WHERE id = ${Number(c.id)} AND world_id = ${req.world.id} AND NOT deleted RETURNING *`;
        if (!rows.length) return fail(res, 404, 'That clock is gone.');
        return send(res, 200, { clock: rows[0] });
      }
      if (!name) return fail(res, 400, 'Say what the clock is counting toward.');
      const ok = await sql`SELECT id FROM entries WHERE id = ${String(c.entry_id || '')} AND world_id = ${req.world.id} AND NOT deleted`;
      if (!ok.length) return fail(res, 404, 'That entry doesn’t exist.');
      const rows = await sql`INSERT INTO clocks (world_id, entry_id, name, size, filled, per_turn, secret, note, created_by)
        VALUES (${req.world.id}, ${String(c.entry_id)}, ${name}, ${size}, ${filled}, ${perTurn}, ${Boolean(c.secret)}, ${String(c.note || '').slice(0, 1000)}, ${req.gm.id}) RETURNING *`;
      return send(res, 201, { clock: rows[0] });
    }
    const entryId = String(b.entry_id || '').slice(0, 40);
    const exists = await sql`SELECT id FROM entries WHERE id = ${entryId} AND NOT deleted AND world_id = ${req.world.id}`;
    if (!exists.length) return fail(res, 404, 'That entry doesn’t exist.');
    const value = Math.max(-5, Math.min(5, Math.round(Number(b.value) || 0)));
    const prev = await sql`SELECT value FROM standing_log WHERE entry_id = ${entryId} ORDER BY at DESC LIMIT 1`;
    const delta = value - (prev[0]?.value ?? 0);
    const rows = await sql`INSERT INTO standing_log (world_id, entry_id, value, delta, reason, session_id, secret, gm_id)
      VALUES (${req.world.id}, ${entryId}, ${value}, ${delta}, ${String(b.reason || '').slice(0, 1000)}, ${b.session_id ? String(b.session_id).slice(0, 40) : null}, ${Boolean(b.secret)}, ${req.gm.id})
      RETURNING id, entry_id, value, delta, reason, session_id, secret, at`;
    send(res, 201, { entry: { ...rows[0], gm: req.gm.name } });
  },
  async DELETE(req, res) {
    if (!requireGm(req, res)) return;
    if (req.query?.clock) {
      const rows = await sql`UPDATE clocks SET deleted = true WHERE id = ${Number(req.query.clock)} AND world_id = ${req.world.id} RETURNING id`;
      return rows.length ? send(res, 200, { ok: true }) : fail(res, 404, 'That clock is already gone.');
    }
    const rows = await sql`DELETE FROM standing_log WHERE id = ${Number(req.query?.id)} AND world_id = ${req.world.id} RETURNING id`;
    if (!rows.length) return fail(res, 404, 'That change was already removed.');
    send(res, 200, { ok: true });
  },
}, { world: true });
