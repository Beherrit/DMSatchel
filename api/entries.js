// The world's entries.
// GET               every entry (GM secrets only for signed-in GMs)
// GET ?id=          one entry
// POST {entry}      create (GM) · POST {entries:[...], mode:'import'} bulk import (admin)
// PUT ?id= {entry}  update (GM); send the version you loaded, or get 409 if someone saved first
// DELETE ?id=       move to the bin (GM) · DELETE ?id=&restore=1 brings it back
import { route, send, fail, sql, newId, requireGm, requireAdmin } from './_lib/core.js';
import { KINDS, isKind, LIMITS } from '../js/world-schema.js';

const clip = (v, n) => String(v ?? '').slice(0, n);

function clean(input) {
  const e = input || {};
  if (!isKind(e.kind)) return { error: 'Pick what kind of entry this is.' };
  const name = clip(e.name, LIMITS.name).trim();
  if (!name) return { error: 'Give the entry a name.' };
  const allowed = new Set(KINDS[e.kind].fields.map(([k]) => k));
  const fields = {};
  for (const [k, v] of Object.entries(e.fields || {})) if (allowed.has(k) && v != null && String(v).trim()) fields[k] = clip(v, LIMITS.field);
  const tags = [...new Set((Array.isArray(e.tags) ? e.tags : []).map((t) => clip(t, LIMITS.tag).trim().toLowerCase()).filter(Boolean))].slice(0, LIMITS.tags);
  const links = (Array.isArray(e.links) ? e.links : []).filter((l) => l && typeof l.id === 'string').slice(0, LIMITS.links)
    .map((l) => ({ id: clip(l.id, 40), label: clip(l.label || 'related to', 60), secret: Boolean(l.secret) }));
  return {
    kind: e.kind, name, summary: clip(e.summary, LIMITS.summary), body: clip(e.body, LIMITS.body), secret: clip(e.secret, LIMITS.secret),
    fields, tags, links, parent_id: e.parent_id ? clip(e.parent_id, 40) : null,
  };
}

function shape(row, isGm) {
  const out = {
    id: row.id, kind: row.kind, name: row.name, summary: row.summary, body: row.body, fields: row.fields, tags: row.tags,
    links: isGm ? row.links : (row.links || []).filter((l) => !l.secret), parent_id: row.parent_id,
    created_at: row.created_at, updated_at: row.updated_at, version: row.version,
    created_by: row.created_by_name || null, updated_by: row.updated_by_name || null,
  };
  if (isGm) { out.secret = row.secret; out.deleted = row.deleted; }
  return out;
}

async function loadOne(id) {
  const rows = await sql`SELECT e.*, c.name AS created_by_name, u.name AS updated_by_name FROM entries e
    LEFT JOIN gms c ON c.id = e.created_by LEFT JOIN gms u ON u.id = e.updated_by WHERE e.id = ${id}`;
  return rows[0];
}

async function record(entryId, gmId, action, snapshot) {
  await sql`INSERT INTO history (entry_id, gm_id, action, snapshot) VALUES (${entryId}, ${gmId}, ${action}, ${JSON.stringify(snapshot)})`;
}

export default route({
  async GET(req, res) {
    const isGm = Boolean(req.gm);
    const { id, bin } = req.query || {};
    if (id) {
      const row = await loadOne(id);
      if (!row || (row.deleted && !isGm)) return fail(res, 404, 'That entry doesn’t exist, or it was deleted.');
      return send(res, 200, { entry: shape(row, isGm) });
    }
    const rows = bin && isGm
      ? await sql`SELECT e.*, c.name AS created_by_name, u.name AS updated_by_name FROM entries e LEFT JOIN gms c ON c.id = e.created_by LEFT JOIN gms u ON u.id = e.updated_by WHERE e.deleted ORDER BY e.updated_at DESC`
      : await sql`SELECT e.*, c.name AS created_by_name, u.name AS updated_by_name FROM entries e LEFT JOIN gms c ON c.id = e.created_by LEFT JOIN gms u ON u.id = e.updated_by WHERE NOT e.deleted ORDER BY e.name`;
    const settings = await sql`SELECT value FROM settings WHERE key = 'world'`;
    send(res, 200, { entries: rows.map((r) => shape(r, isGm)), world: settings[0]?.value || null });
  },

  async POST(req, res) {
    if (!requireGm(req, res)) return;
    if (req.body.mode === 'import') {
      if (!requireAdmin(req, res)) return;
      const list = Array.isArray(req.body.entries) ? req.body.entries.slice(0, 5000) : [];
      let n = 0;
      for (const raw of list) {
        const e = clean(raw);
        if (e.error) continue;
        const id = typeof raw.id === 'string' && /^[\w-]{4,40}$/.test(raw.id) ? raw.id : newId();
        await sql`INSERT INTO entries (id, kind, name, summary, body, fields, secret, tags, links, parent_id, created_by, updated_by)
          VALUES (${id}, ${e.kind}, ${e.name}, ${e.summary}, ${e.body}, ${JSON.stringify(e.fields)}, ${e.secret}, ${e.tags}, ${JSON.stringify(e.links)}, ${e.parent_id}, ${req.gm.id}, ${req.gm.id})
          ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, name = EXCLUDED.name, summary = EXCLUDED.summary, body = EXCLUDED.body, fields = EXCLUDED.fields,
            secret = EXCLUDED.secret, tags = EXCLUDED.tags, links = EXCLUDED.links, parent_id = EXCLUDED.parent_id, updated_by = EXCLUDED.updated_by,
            updated_at = now(), version = entries.version + 1, deleted = false`;
        await record(id, req.gm.id, 'import', e);
        n++;
      }
      return send(res, 200, { imported: n });
    }
    const e = clean(req.body.entry);
    if (e.error) return fail(res, 400, e.error);
    const id = newId();
    await sql`INSERT INTO entries (id, kind, name, summary, body, fields, secret, tags, links, parent_id, created_by, updated_by)
      VALUES (${id}, ${e.kind}, ${e.name}, ${e.summary}, ${e.body}, ${JSON.stringify(e.fields)}, ${e.secret}, ${e.tags}, ${JSON.stringify(e.links)}, ${e.parent_id}, ${req.gm.id}, ${req.gm.id})`;
    await record(id, req.gm.id, 'create', e);
    send(res, 201, { entry: shape(await loadOne(id), true) });
  },

  async PUT(req, res) {
    if (!requireGm(req, res)) return;
    const id = req.query?.id;
    const current = id && await loadOne(id);
    if (!current) return fail(res, 404, 'That entry doesn’t exist any more.');
    const e = clean(req.body.entry);
    if (e.error) return fail(res, 400, e.error);
    if (e.parent_id === id) return fail(res, 400, 'An entry can’t be inside itself.');
    const version = Number(req.body.entry?.version);
    const rows = await sql`UPDATE entries SET kind = ${e.kind}, name = ${e.name}, summary = ${e.summary}, body = ${e.body}, fields = ${JSON.stringify(e.fields)},
      secret = ${e.secret}, tags = ${e.tags}, links = ${JSON.stringify(e.links)}, parent_id = ${e.parent_id}, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
      WHERE id = ${id} AND version = ${version} RETURNING id`;
    if (!rows.length) {
      return fail(res, 409, `${current.updated_by_name || 'Another GM'} saved this entry while you were editing. Your changes are still in the form: copy anything you need, then reload to see theirs.`, { entry: shape(current, true) });
    }
    await record(id, req.gm.id, 'edit', e);
    send(res, 200, { entry: shape(await loadOne(id), true) });
  },

  async DELETE(req, res) {
    if (!requireGm(req, res)) return;
    const { id, restore } = req.query || {};
    const rows = await sql`UPDATE entries SET deleted = ${!restore}, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${id} RETURNING id`;
    if (!rows.length) return fail(res, 404, 'That entry doesn’t exist.');
    await record(id, req.gm.id, restore ? 'restore' : 'delete', null);
    send(res, 200, { ok: true });
  },
});

