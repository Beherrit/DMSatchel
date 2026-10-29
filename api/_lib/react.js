// Reactions (see js/reactions.js): add or take back one person's emoji on a row, atomically in SQL, so two people
// reacting at once never undo each other.
import { sql } from './core.js';

export async function react(table, id, emoji, gm, on) {
  const key = String(gm.id);
  const rows = table === 'comments'
    ? (on ? await sql`UPDATE comments SET reactions = jsonb_set(COALESCE(reactions, '{}'::jsonb), ARRAY[${emoji}]::text[], COALESCE(reactions -> ${emoji}, '{}'::jsonb) || jsonb_build_object(${key}::text, ${gm.name}::text)) WHERE id = ${id} RETURNING reactions`
      : await sql`UPDATE comments SET reactions = COALESCE(reactions, '{}'::jsonb) #- ARRAY[${emoji}, ${key}]::text[] WHERE id = ${id} RETURNING reactions`)
    : (on ? await sql`UPDATE table_quotes SET reactions = jsonb_set(COALESCE(reactions, '{}'::jsonb), ARRAY[${emoji}]::text[], COALESCE(reactions -> ${emoji}, '{}'::jsonb) || jsonb_build_object(${key}::text, ${gm.name}::text)) WHERE id = ${id} RETURNING reactions`
      : await sql`UPDATE table_quotes SET reactions = COALESCE(reactions, '{}'::jsonb) #- ARRAY[${emoji}, ${key}]::text[] WHERE id = ${id} RETURNING reactions`);
  return rows[0]?.reactions || {};
}
