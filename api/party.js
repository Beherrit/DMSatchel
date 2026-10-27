// The party's treasury: a ledger of coins and items coming in and going out.
// GET                                      every line, newest first, with totals
// POST {cp, item, qty, holder, note, session_id}   add a line (any member of the world); cp and qty are signed
// DELETE ?id=                              strike a line (GM, or whoever wrote it); it stays in the database
import { route, send, fail, sql, requireMember } from './_lib/core.js';

const clip = (v, n) => String(v ?? '').slice(0, n);

export default route({
  async GET(req, res) {
    const lines = await sql`SELECT l.id, l.at, l.cp::float8 AS cp, l.item, l.qty, l.holder, l.note, l.session_id, l.gm_id, g.name AS by
      FROM party_ledger l LEFT JOIN gms g ON g.id = l.gm_id WHERE l.world_id = ${req.world.id} AND NOT l.deleted ORDER BY l.at DESC LIMIT 1000`;
    const cp = lines.reduce((t, l) => t + Number(l.cp || 0), 0);
    const items = new Map();
    for (const l of [...lines].reverse()) {
      if (!l.item || !l.qty) continue;
      const k = l.item.trim().toLowerCase();
      const cur = items.get(k) || { item: l.item.trim(), qty: 0, holder: '' };
      cur.qty += l.qty; if (l.holder && l.qty > 0) cur.holder = l.holder;
      items.set(k, cur);
    }
    send(res, 200, { lines, cp, items: [...items.values()].filter((i) => i.qty > 0).sort((a, b) => a.item.localeCompare(b.item)) });
  },
  async POST(req, res) {
    if (!requireMember(req, res)) return;
    const b = req.body || {};
    const cp = Math.round(Number(b.cp) || 0);
    const qty = Math.round(Number(b.qty) || 0);
    const item = clip(b.item, 200).trim();
    if (Math.abs(cp) > 1e12 || Math.abs(qty) > 1e6) return fail(res, 400, 'That number is too big.');
    if (!cp && !(item && qty)) return fail(res, 400, 'Enter an amount of coin, or an item and how many.');
    const rows = await sql`INSERT INTO party_ledger (world_id, gm_id, cp, item, qty, holder, note, session_id)
      VALUES (${req.world.id}, ${req.gm.id}, ${cp}, ${item}, ${item ? qty : 0}, ${clip(b.holder, 120)}, ${clip(b.note, 500)}, ${b.session_id ? clip(b.session_id, 40) : null})
      RETURNING id, at, cp::float8 AS cp, item, qty, holder, note, session_id, gm_id`;
    send(res, 201, { line: { ...rows[0], by: req.gm.name } });
  },
  async DELETE(req, res) {
    if (!requireMember(req, res)) return;
    const id = Number(req.query?.id);
    const rows = await sql`UPDATE party_ledger SET deleted = true WHERE id = ${id} AND world_id = ${req.world.id} AND NOT deleted
      AND (${req.isGmHere} OR gm_id = ${req.gm.id}) RETURNING id`;
    if (!rows.length) return fail(res, 404, 'That line is gone, or it isn’t yours to remove.');
    send(res, 200, { ok: true });
  },
}, { world: true });
