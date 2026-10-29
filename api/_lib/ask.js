// Ask the GM: how many messages wait unread for this person (GMs: players' questions; players: answers to them).
import { sql } from './core.js';

export async function askUnread(req) {
  if (!req.gm || !req.role || req.preview) return undefined;
  const rows = req.isGmHere
    ? await sql`SELECT count(*)::int AS n FROM gm_questions WHERE world_id = ${req.world.id} AND NOT from_gm AND NOT seen`
    : await sql`SELECT count(*)::int AS n FROM gm_questions WHERE world_id = ${req.world.id} AND player_id = ${req.gm.id} AND from_gm AND NOT seen`;
  return rows[0].n;
}
