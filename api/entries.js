// The entries of one world (?world=<id or slug>).
// GET               every entry the requester may see
// GET ?since=<iso>  entries changed since then (for live updates): {changed, removed, now}
// GET ?id=          one entry
// POST {entry}      create. GMs create anything; players create their own characters and journals, and anything
//                   else they make is a suggestion that waits for a GM.
// POST {entries:[...], mode:'batch'}   up to 25 at once (GM) · mode:'import' restores a backup (owner)
// PUT ?id= {entry}  update; send the version you loaded or get 409. Players may edit only their own entries.
// PATCH {id, visibility?, status?}     GM quick changes: reveal or hide, approve a suggestion
// PATCH {id, claim: true} · {id, owner: null}   claim an unowned character (member) · unassign it (GM)
// DELETE ?id=       move to the bin (GM, or a player's own entry) · DELETE ?id=&restore=1 brings it back (GM)
//
// Players never receive: GM-only entries, other people's pending suggestions, secrets, or GM-only links.
import { route, send, fail, sql, newId, requireGm, requireMember, requireOwner } from './_lib/core.js';
import { KINDS, isKind, LIMITS, PLAYER_KINDS, isImageRef } from '../js/world-schema.js';

const clip = (v, n) => String(v ?? '').slice(0, n);

function clean(input) {
  const e = input || {};
  if (!isKind(e.kind)) return { error: 'Pick what kind of entry this is.' };
  const name = clip(e.name, LIMITS.name).trim();
  if (!name) return { error: 'Give the entry a name.' };
  const allowed = new Set(KINDS[e.kind].fields.map(([k]) => k));
  const fields = {};
  for (const [k, v] of Object.entries(e.fields || {})) if (allowed.has(k) && v != null && String(v).trim() && (k !== 'image' || isImageRef(String(v)))) fields[k] = clip(v, ['stock', 'sheet', 'play', 'spread', 'known'].includes(k) ? LIMITS.body : LIMITS.field);
  const tags = [...new Set((Array.isArray(e.tags) ? e.tags : []).map((t) => clip(t, LIMITS.tag).trim().toLowerCase()).filter(Boolean))].slice(0, LIMITS.tags);
  const links = (Array.isArray(e.links) ? e.links : []).filter((l) => l && typeof l.id === 'string').slice(0, LIMITS.links)
    .map((l) => ({ id: clip(l.id, 40), label: clip(l.label || 'related to', 60), secret: Boolean(l.secret) }));
  return {
    kind: e.kind, name, summary: clip(e.summary, LIMITS.summary), body: clip(e.body, LIMITS.body), secret: clip(e.secret, LIMITS.secret),
    fields, tags, links, parent_id: e.parent_id ? clip(e.parent_id, 40) : null, visibility: e.visibility === 'gm' ? 'gm' : 'all',
  };
}

function shape(row, req) {
  const gmView = req.isGmHere;
  const mine = req.gm && row.owner_id === req.gm.id;
  const out = {
    id: row.id, kind: row.kind, name: row.name, summary: row.summary, body: row.body, fields: row.fields, tags: row.tags,
    links: gmView ? row.links : (row.links || []).filter((l) => !l.secret), parent_id: row.parent_id,
    created_at: row.created_at, updated_at: row.updated_at, version: row.version, visibility: row.visibility, status: row.status,
    created_by: row.created_by_name || null, updated_by: row.updated_by_name || null, owner_id: row.owner_id || null, owner: row.owner_name || null,
    can_edit: Boolean(gmView || (mine && req.role)),
  };
  if (gmView) { out.secret = row.secret; out.deleted = row.deleted; }
  return out;
}

const visibleTo = (row, req) => req.isGmHere || (row.owner_id && req.gm && row.owner_id === req.gm.id) || (row.visibility === 'all' && row.status === 'live');

async function loadOne(id, worldId) {
  const rows = await sql`SELECT e.*, c.name AS created_by_name, u.name AS updated_by_name, o.name AS owner_name FROM entries e
    LEFT JOIN gms c ON c.id = e.created_by LEFT JOIN gms u ON u.id = e.updated_by LEFT JOIN gms o ON o.id = e.owner_id
    WHERE e.id = ${id} AND e.world_id = ${worldId}`;
  return rows[0];
}

async function record(entryId, gmId, action, snapshot) {
  await sql`INSERT INTO history (entry_id, gm_id, action, snapshot) VALUES (${entryId}, ${gmId}, ${action}, ${JSON.stringify(snapshot)})`;
}

async function insert(e, req, { owner = null, status = 'live', id = newId() } = {}) {
  await sql`INSERT INTO entries (id, world_id, kind, name, summary, body, fields, secret, tags, links, parent_id, created_by, updated_by, visibility, owner_id, status)
    VALUES (${id}, ${req.world.id}, ${e.kind}, ${e.name}, ${e.summary}, ${e.body}, ${JSON.stringify(e.fields)}, ${e.secret}, ${e.tags}, ${JSON.stringify(e.links)},
      ${e.parent_id}, ${req.gm.id}, ${req.gm.id}, ${e.visibility}, ${owner}, ${status})`;
  await record(id, req.gm.id, status === 'suggested' ? 'suggest' : 'create', e);
  return id;
}

export default route({
  async GET(req, res) {
    const { id, bin, since } = req.query || {};
    if (since) {
      const t = new Date(since);
      if (Number.isNaN(t.getTime())) return fail(res, 400, 'Bad time.');
      const rows = await sql`SELECT e.*, c.name AS created_by_name, u.name AS updated_by_name, o.name AS owner_name FROM entries e
        LEFT JOIN gms c ON c.id = e.created_by LEFT JOIN gms u ON u.id = e.updated_by LEFT JOIN gms o ON o.id = e.owner_id
        WHERE e.world_id = ${req.world.id} AND e.updated_at >= ${t.toISOString()} ORDER BY e.updated_at LIMIT 500`;
      const now = (await sql`SELECT now() AS now`)[0].now;
      return send(res, 200, {
        changed: rows.filter((r) => !r.deleted && visibleTo(r, req)).map((r) => shape(r, req)),
        removed: rows.filter((r) => r.deleted || !visibleTo(r, req)).map((r) => r.id), now, cal: req.world.cal || null,
      });
    }
    if (id) {
      const row = await loadOne(id, req.world.id);
      if (!row || (row.deleted && !req.isGmHere) || !visibleTo(row, req)) return fail(res, 404, 'That entry doesn’t exist, or it was deleted.');
      return send(res, 200, { entry: shape(row, req) });
    }
    const rows = bin && req.isGmHere
      ? await sql`SELECT e.*, c.name AS created_by_name, u.name AS updated_by_name, o.name AS owner_name FROM entries e LEFT JOIN gms c ON c.id = e.created_by LEFT JOIN gms u ON u.id = e.updated_by LEFT JOIN gms o ON o.id = e.owner_id WHERE e.world_id = ${req.world.id} AND e.deleted ORDER BY e.updated_at DESC`
      : await sql`SELECT e.*, c.name AS created_by_name, u.name AS updated_by_name, o.name AS owner_name FROM entries e LEFT JOIN gms c ON c.id = e.created_by LEFT JOIN gms u ON u.id = e.updated_by LEFT JOIN gms o ON o.id = e.owner_id WHERE e.world_id = ${req.world.id} AND NOT e.deleted ORDER BY e.name`;
    const w = req.world;
    const now = (await sql`SELECT now() AS now`)[0].now;
    send(res, 200, {
      now,
      entries: rows.filter((r) => visibleTo(r, req)).map((r) => shape(r, req)),
      world: { id: w.id, slug: w.slug, name: w.name, tagline: w.tagline, about: w.about, calendar: w.calendar, public: w.public, cal: w.cal || null, discord: Boolean(w.discord_webhook), next_session: w.next_session || null },
      role: req.role,
    });
  },

  async POST(req, res) {
    if (!requireMember(req, res)) return;
    if (req.body.mode === 'import') {
      if (!requireOwner(req, res)) return;
      const list = Array.isArray(req.body.entries) ? req.body.entries.slice(0, 5000) : [];
      let n = 0;
      for (const raw of list) {
        const e = clean(raw);
        if (e.error) continue;
        const id = typeof raw.id === 'string' && /^[\w-]{4,40}$/.test(raw.id) ? raw.id : newId();
        const taken = (await sql`SELECT world_id FROM entries WHERE id = ${id}`)[0];
        if (taken && taken.world_id !== req.world.id) continue; // never overwrite another world's entry
        await sql`INSERT INTO entries (id, world_id, kind, name, summary, body, fields, secret, tags, links, parent_id, created_by, updated_by, visibility)
          VALUES (${id}, ${req.world.id}, ${e.kind}, ${e.name}, ${e.summary}, ${e.body}, ${JSON.stringify(e.fields)}, ${e.secret}, ${e.tags}, ${JSON.stringify(e.links)}, ${e.parent_id}, ${req.gm.id}, ${req.gm.id}, ${e.visibility})
          ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, name = EXCLUDED.name, summary = EXCLUDED.summary, body = EXCLUDED.body, fields = EXCLUDED.fields,
            secret = EXCLUDED.secret, tags = EXCLUDED.tags, links = EXCLUDED.links, parent_id = EXCLUDED.parent_id, updated_by = EXCLUDED.updated_by,
            visibility = EXCLUDED.visibility, updated_at = now(), version = entries.version + 1, deleted = false`;
        await record(id, req.gm.id, 'import', e);
        n++;
      }
      return send(res, 200, { imported: n });
    }
    if (req.body.mode === 'batch') {
      if (!requireGm(req, res)) return;
      const list = Array.isArray(req.body.entries) ? req.body.entries.slice(0, 25) : [];
      const made = [];
      for (const raw of list) {
        const e = clean(raw);
        if (e.error) return fail(res, 400, `${raw?.name || 'An entry'}: ${e.error}`);
        made.push(shape(await loadOne(await insert(e, req), req.world.id), req));
      }
      return send(res, 201, { entries: made });
    }
    const e = clean(req.body.entry);
    if (e.error) return fail(res, 400, e.error);
    let id;
    if (req.isGmHere) id = await insert(e, req, { owner: req.body.entry?.owner_id ? Number(req.body.entry.owner_id) || null : null });
    else {
      // Players: their own characters and journals go live; anything else waits for a GM's approval.
      e.secret = ''; e.visibility = 'all'; e.links = e.links.map((l) => ({ ...l, secret: false }));
      id = await insert(e, req, { owner: req.gm.id, status: PLAYER_KINDS.includes(e.kind) ? 'live' : 'suggested' });
    }
    send(res, 201, { entry: shape(await loadOne(id, req.world.id), req) });
  },

  async PUT(req, res) {
    if (!requireMember(req, res)) return;
    const id = req.query?.id;
    const current = id && await loadOne(id, req.world.id);
    if (!current || current.deleted) return fail(res, 404, 'That entry doesn’t exist any more.');
    const mine = current.owner_id === req.gm.id;
    if (!req.isGmHere && !mine) return fail(res, 403, 'You can only edit your own characters, journals and suggestions.');
    const e = clean(req.body.entry);
    if (e.error) return fail(res, 400, e.error);
    if (e.parent_id === id) return fail(res, 400, 'An entry can’t be inside itself.');
    if (!req.isGmHere) {
      if (current.status === 'live' && !PLAYER_KINDS.includes(e.kind)) return fail(res, 403, 'Players can’t change an entry into that kind.');
      e.secret = current.secret; e.visibility = current.visibility; e.links = e.links.map((l) => ({ ...l, secret: false }));
    }
    const version = Number(req.body.entry?.version);
    const rows = await sql`UPDATE entries SET kind = ${e.kind}, name = ${e.name}, summary = ${e.summary}, body = ${e.body}, fields = ${JSON.stringify(e.fields)},
      secret = ${e.secret}, tags = ${e.tags}, links = ${JSON.stringify(e.links)}, parent_id = ${e.parent_id}, visibility = ${e.visibility},
      updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
      WHERE id = ${id} AND world_id = ${req.world.id} AND version = ${version} RETURNING id`;
    if (!rows.length) {
      return fail(res, 409, `${current.updated_by_name || 'Someone'} saved this entry while you were editing. Your changes are still in the form: copy anything you need, then reload to see theirs.`, { entry: shape(current, req) });
    }
    await record(id, req.gm.id, 'edit', e);
    send(res, 200, { entry: shape(await loadOne(id, req.world.id), req) });
  },

  async PATCH(req, res) {
    if (!requireMember(req, res)) return;
    const { id, visibility, status } = req.body || {};
    const current = id && await loadOne(id, req.world.id);
    if (!current || current.deleted) return fail(res, 404, 'That entry doesn’t exist.');
    // Claim an unowned player character (any member), or let one go (GM).
    if (req.body.claim || req.body.owner === null) {
      if (current.kind !== 'character') return fail(res, 400, 'Only player characters can be claimed.');
      if (req.body.claim && current.owner_id && current.owner_id !== req.gm.id) return fail(res, 409, 'Someone else already plays this character.');
      if (req.body.owner === null && !req.isGmHere) return fail(res, 403, 'Only a GM can unassign a character.');
      const owner = req.body.claim ? req.gm.id : null;
      await sql`UPDATE entries SET owner_id = ${owner}, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${id} AND world_id = ${req.world.id}`;
      await record(id, req.gm.id, owner ? 'claim' : 'unassign', null);
      return send(res, 200, { entry: shape(await loadOne(id, req.world.id), req) });
    }
    if (!requireGm(req, res)) return;
    const vis = visibility === 'gm' || visibility === 'all' ? visibility : current.visibility;
    const st = status === 'live' || status === 'suggested' ? status : current.status;
    await sql`UPDATE entries SET visibility = ${vis}, status = ${st}, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${id} AND world_id = ${req.world.id}`;
    await record(id, req.gm.id, st !== current.status ? (st === 'live' ? 'approve' : 'unapprove') : vis === 'all' ? 'reveal' : 'hide', null);
    send(res, 200, { entry: shape(await loadOne(id, req.world.id), req) });
  },

  async DELETE(req, res) {
    if (!requireMember(req, res)) return;
    const { id, restore } = req.query || {};
    const current = id && await loadOne(id, req.world.id);
    if (!current) return fail(res, 404, 'That entry doesn’t exist.');
    if (!req.isGmHere && (current.owner_id !== req.gm.id || restore)) return fail(res, 403, 'You can only delete your own entries.');
    await sql`UPDATE entries SET deleted = ${!restore}, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${id} AND world_id = ${req.world.id}`;
    await record(id, req.gm.id, restore ? 'restore' : current.status === 'suggested' && req.isGmHere && current.owner_id !== req.gm.id ? 'reject' : 'delete', null);
    send(res, 200, { ok: true });
  },
}, { world: true });
