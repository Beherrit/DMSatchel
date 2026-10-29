// Comments on entries, in two rooms:
//   GM discussion (audience 'gm'): GMs only; players never see these.
//   Table talk (audience 'table'): players and GMs, on any entry the player can see. GMs can hide or delete.
// GET ?entry_id=[&audience=table]   every comment on one entry in that room
// GET                               open GM threads across the world (GMs)
// GET ?recent=table                 the latest table talk across the world (anyone who can read the world)
// POST {entry_id, body, parent_id, audience}   start a thread or reply (table: any member; gm: GMs)
// PATCH {id, resolved}   resolve or reopen a GM thread · {id, hidden} hide table talk (GM) · {id, body} edit your own
// PATCH {id, react: emoji, on}   add or take back your reaction on table talk (members)
// DELETE ?id=            delete your own comment (GMs may delete any table comment; the owner any comment)
//
// Private notes (audience 'note'): one per person per entry, seen only by whoever wrote it, never by GMs or the owner.
// GET ?notes=mine                   your notes across the world, with the entries' names
// GET ?entry_id=&audience=note      your note on one entry (or none)
// PUT {entry_id, body}              write your note on an entry; an empty body removes it
//
// GET ?search=words                 comments containing the words (members): table talk you can see, GM discussions
//                                   (GMs), and your own private notes; newest first, at most 40
import { route, send, fail, sql, requireGm, requireMember } from './_lib/core.js';
import { sharedWith } from '../js/sharing.js';
import { isReaction } from '../js/reactions.js';
import { react } from './_lib/react.js';

const room = (v) => (v === 'table' ? 'table' : 'gm');
// Can this request see the entry? Same rule as the entries API.
const sees = (e, req) => e && !e.deleted && (req.isGmHere || (req.gm && e.owner_id === req.gm.id) || (e.visibility === 'all' && e.status === 'live')
  || (e.status === 'live' && sharedWith(e, req.gm?.id)));

async function entryFor(id, req) {
  return (await sql`SELECT id, owner_id, visibility, status, deleted, shared_with FROM entries WHERE id = ${String(id || '').slice(0, 40)} AND world_id = ${req.world.id}`)[0];
}

export default route({
  async GET(req, res) {
    const { entry_id: entryId, audience, recent, notes, search } = req.query || {};
    if (search !== undefined) {
      if (!requireMember(req, res)) return;
      const q = String(search).trim().slice(0, 100);
      if (q.length < 2) return send(res, 200, { comments: [] });
      const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const rows = await sql`SELECT c.id, c.entry_id, c.parent_id, c.body, c.audience, c.hidden, c.created_at, c.gm_id, g.name AS gm, e.name AS entry_name, e.kind, e.owner_id, e.visibility, e.status, e.deleted, e.shared_with
        FROM comments c LEFT JOIN gms g ON g.id = c.gm_id JOIN entries e ON e.id = c.entry_id
        WHERE e.world_id = ${req.world.id} AND NOT e.deleted AND c.body ILIKE ${pattern}
          AND (c.audience = 'table' OR (c.audience = 'gm' AND ${req.isGmHere}) OR (c.audience = 'note' AND c.gm_id = ${req.gm.id}))
        ORDER BY c.created_at DESC LIMIT 200`;
      const out = rows.filter((r) => sees(r, req) && (r.audience !== 'table' || !r.hidden || req.isGmHere || r.gm_id === req.gm.id)).slice(0, 40)
        .map(({ owner_id, visibility, status, deleted, shared_with, ...r }) => r);
      return send(res, 200, { comments: out });
    }
    if (notes === 'mine' || (entryId && audience === 'note')) {
      if (!requireMember(req, res)) return;
      const rows = await sql`SELECT c.id, c.entry_id, c.body, c.created_at, c.edited_at, e.name AS entry_name, e.kind, e.owner_id, e.visibility, e.status, e.deleted, e.shared_with
        FROM comments c JOIN entries e ON e.id = c.entry_id
        WHERE c.audience = 'note' AND c.gm_id = ${req.gm.id} AND e.world_id = ${req.world.id}
        ORDER BY COALESCE(c.edited_at, c.created_at) DESC LIMIT 500`;
      const only = notes === 'mine' ? null : String(entryId);
      return send(res, 200, { notes: rows.filter((r) => sees(r, req) && (!only || r.entry_id === only)).map(({ owner_id, visibility, status, deleted, shared_with, ...r }) => r) });
    }
    if (recent === 'table') {
      const rows = await sql`SELECT c.id, c.entry_id, c.parent_id, c.body, c.created_at, c.hidden, c.gm_id, c.reactions, g.name AS gm, e.name AS entry_name, e.kind, e.owner_id, e.visibility, e.status, e.deleted, e.shared_with
        FROM comments c LEFT JOIN gms g ON g.id = c.gm_id JOIN entries e ON e.id = c.entry_id
        WHERE c.audience = 'table' AND e.world_id = ${req.world.id} AND NOT e.deleted ORDER BY c.created_at DESC LIMIT 200`;
      const out = rows.filter((r) => sees(r, req) && (!r.hidden || req.isGmHere)).slice(0, 60)
        .map(({ owner_id, visibility, status, deleted, shared_with, ...r }) => r);
      return send(res, 200, { comments: out });
    }
    if (entryId) {
      const which = room(audience);
      if (which === 'gm' && !requireGm(req, res)) return;
      const e = await entryFor(entryId, req);
      if (!sees(e, req)) return fail(res, 404, 'That entry doesn’t exist.');
      const rows = await sql`SELECT c.id, c.entry_id, c.parent_id, c.body, c.resolved, c.hidden, c.created_at, c.edited_at, c.gm_id, c.reactions, g.name AS gm
        FROM comments c LEFT JOIN gms g ON g.id = c.gm_id WHERE c.entry_id = ${entryId} AND c.audience = ${which} ORDER BY c.created_at`;
      // Hidden table talk stays visible to GMs and to whoever wrote it.
      return send(res, 200, { comments: rows.filter((c) => !c.hidden || req.isGmHere || c.gm_id === req.gm?.id) });
    }
    if (!requireGm(req, res)) return;
    const rows = await sql`SELECT t.id, t.entry_id, t.body, t.created_at, g.name AS gm, e.name AS entry_name, e.kind,
        (SELECT count(*)::int FROM comments r WHERE r.parent_id = t.id) AS replies,
        GREATEST(t.created_at, COALESCE((SELECT max(r.created_at) FROM comments r WHERE r.parent_id = t.id), t.created_at)) AS last_at
      FROM comments t LEFT JOIN gms g ON g.id = t.gm_id LEFT JOIN entries e ON e.id = t.entry_id
      WHERE t.parent_id IS NULL AND t.audience = 'gm' AND NOT t.resolved AND (e.deleted IS NOT TRUE) AND e.world_id = ${req.world.id} ORDER BY last_at DESC LIMIT 100`;
    send(res, 200, { threads: rows });
  },
  async POST(req, res) {
    const which = room(req.body.audience);
    if (which === 'gm' ? !requireGm(req, res) : !requireMember(req, res)) return;
    const body = String(req.body.body || '').trim().slice(0, 5000);
    if (!body) return fail(res, 400, 'Write something first.');
    const entryId = String(req.body.entry_id || '').slice(0, 40);
    if (!sees(await entryFor(entryId, req), req)) return fail(res, 404, 'That entry isn’t in this world.');
    const parentId = req.body.parent_id ? Number(req.body.parent_id) : null;
    if (parentId) {
      const p = await sql`SELECT id FROM comments WHERE id = ${parentId} AND entry_id = ${entryId} AND parent_id IS NULL AND audience = ${which}`;
      if (!p.length) return fail(res, 404, 'That thread was deleted.');
      if (which === 'gm') await sql`UPDATE comments SET resolved = false WHERE id = ${parentId}`;
    }
    const rows = await sql`INSERT INTO comments (entry_id, parent_id, gm_id, body, audience) VALUES (${entryId}, ${parentId}, ${req.gm.id}, ${body}, ${which})
      RETURNING id, entry_id, parent_id, body, resolved, hidden, created_at, edited_at, gm_id`;
    send(res, 201, { comment: { ...rows[0], gm: req.gm.name } });
  },
  async PUT(req, res) {
    if (!requireMember(req, res)) return;
    const entryId = String(req.body.entry_id || '').slice(0, 40);
    if (!sees(await entryFor(entryId, req), req)) return fail(res, 404, 'That entry isn’t in this world.');
    const body = String(req.body.body || '').trim().slice(0, 5000);
    const cur = (await sql`SELECT id FROM comments WHERE entry_id = ${entryId} AND gm_id = ${req.gm.id} AND audience = 'note' ORDER BY id LIMIT 1`)[0];
    if (!body) { if (cur) await sql`DELETE FROM comments WHERE id = ${cur.id}`; return send(res, 200, { note: null }); }
    const rows = cur
      ? await sql`UPDATE comments SET body = ${body}, edited_at = now() WHERE id = ${cur.id} RETURNING id, entry_id, body, created_at, edited_at`
      : await sql`INSERT INTO comments (entry_id, gm_id, body, audience) VALUES (${entryId}, ${req.gm.id}, ${body}, 'note') RETURNING id, entry_id, body, created_at, edited_at`;
    send(res, 200, { note: rows[0] });
  },
  async PATCH(req, res) {
    if (!requireMember(req, res)) return;
    const id = Number(req.body.id);
    const cur = (await sql`SELECT c.id, c.gm_id, c.audience, c.hidden, e.owner_id, e.visibility, e.status, e.deleted, e.shared_with FROM comments c JOIN entries e ON e.id = c.entry_id WHERE c.id = ${id} AND e.world_id = ${req.world.id}`)[0];
    if (!cur || (cur.audience === 'gm' && !req.isGmHere) || (cur.audience === 'note' && cur.gm_id !== req.gm.id)) return fail(res, 404, 'That comment was deleted.');
    if (req.body.react !== undefined) {
      if (cur.audience !== 'table' || !sees(cur, req) || (cur.hidden && !req.isGmHere)) return fail(res, 404, 'That comment was deleted.');
      if (!isReaction(req.body.react)) return fail(res, 400, 'Pick one of the reactions.');
      return send(res, 200, { reactions: await react('comments', id, req.body.react, req.gm, req.body.on !== false) });
    }
    if (typeof req.body.resolved === 'boolean') {
      if (!req.isGmHere) return fail(res, 403, 'Only GMs can resolve threads.');
      await sql`UPDATE comments SET resolved = ${req.body.resolved} WHERE id = ${id}`;
    }
    if (typeof req.body.hidden === 'boolean') {
      if (!req.isGmHere) return fail(res, 403, 'Only GMs can hide comments.');
      await sql`UPDATE comments SET hidden = ${req.body.hidden} WHERE id = ${id}`;
    }
    if (typeof req.body.body === 'string') {
      if (cur.gm_id !== req.gm.id) return fail(res, 403, 'You can only edit your own comments.');
      const body = req.body.body.trim().slice(0, 5000);
      if (!body) return fail(res, 400, 'Write something first.');
      await sql`UPDATE comments SET body = ${body}, edited_at = now() WHERE id = ${id}`;
    }
    send(res, 200, { ok: true });
  },
  async DELETE(req, res) {
    if (!requireMember(req, res)) return;
    const id = Number(req.query?.id);
    const cur = (await sql`SELECT c.id, c.gm_id, c.audience FROM comments c JOIN entries e ON e.id = c.entry_id WHERE c.id = ${id} AND e.world_id = ${req.world.id}`)[0];
    if (!cur || (cur.audience === 'gm' && !req.isGmHere) || (cur.audience === 'note' && cur.gm_id !== req.gm.id)) return fail(res, 404, 'That comment was already deleted.');
    const mod = req.role === 'owner' || (cur.audience === 'table' && req.isGmHere);
    if (cur.gm_id !== req.gm.id && !mod) return fail(res, 403, 'You can only delete your own comments.');
    await sql`DELETE FROM comments WHERE id = ${id} OR parent_id = ${id}`;
    send(res, 200, { ok: true });
  },
}, { world: true });
