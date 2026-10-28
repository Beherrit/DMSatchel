// World maps with pins.
// GET                 list maps (no images)
// GET ?id=            one map with its pins (GM-only pins and maps hidden from players)
// GET ?id=&image=1    the image itself, cached hard (the client adds &v=<version>)
// POST {map}          create (GM): {name, image, width, height, entry_id, secret}
// PUT ?id= {map}      update (GM): pins, name, entry_id, secret, miles (scale), fog, optional new image; send version
// With fog on, players get the fog and only the pins outside it (the image itself is still the whole map).
// DELETE ?id=         delete (GM)
// Your own markers (any member, on maps they can see; private unless shared with the party):
// GET ?id= also returns `mine`: your markers on that map, and `party`: markers others shared (with who)
// POST {mark: {map_id, x, y, label, note, shared, id?}}   add a marker, or move / relabel / share one of yours
// DELETE ?mark=id                                  remove one of yours
import { route, send, fail, sql, newId, requireGm, requireMember } from './_lib/core.js';
import { cleanFog, decodeFog, fogHides } from '../js/fog.js';

const MAX_IMAGE = 3_500_000; // characters of data URL; the browser shrinks uploads well under this
const clip = (v, n) => String(v ?? '').slice(0, n);
const cleanMiles = (v) => (v == null || v === '' ? null : Math.max(0, Math.min(1e6, Number(v) || 0)) || null);

function cleanImage(img) {
  const s = String(img || '');
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s)) return s.length <= MAX_IMAGE ? s : { error: 'That image is too large. Use one under about 2.5 MB.' };
  if (/^https:\/\/[^\s"'<>]{4,1000}$/.test(s)) return s;
  return { error: 'Upload an image, or paste an https:// link to one.' };
}

function cleanPins(pins) {
  return (Array.isArray(pins) ? pins : []).slice(0, 500).map((p) => ({
    id: clip(p.id || newId(), 40), x: Math.min(1, Math.max(0, Number(p.x) || 0)), y: Math.min(1, Math.max(0, Number(p.y) || 0)),
    label: clip(p.label, 120), entry_id: p.entry_id ? clip(p.entry_id, 40) : null, note: clip(p.note, 1000),
    icon: ['region', 'area', 'city', 'town', 'dungeon', 'poi', 'danger', 'camp', 'port', 'temple'].includes(p.icon) ? p.icon : 'poi', secret: Boolean(p.secret),
  }));
}

function visiblePins(m) {
  const fog = m.fog?.on ? m.fog : null, cells = fog && decodeFog(fog.bits, fog.cols * fog.rows);
  return (m.pins || []).filter((p) => !p.secret && !(fog && fogHides(fog, cells, p.x, p.y)));
}

const shape = (m, isGm) => ({
  id: m.id, name: m.name, width: m.width, height: m.height, entry_id: m.entry_id, secret: m.secret, version: m.version,
  pins: isGm ? m.pins : visiblePins(m), updated_at: m.updated_at, updated_by: m.updated_by_name || null,
  external: !String(m.image || '').startsWith('data:'), miles: m.miles || null, fog: isGm || m.fog?.on ? m.fog || null : null,
});

export default route({
  async GET(req, res) {
    const isGm = req.isGmHere;
    const { id, image } = req.query || {};
    if (!id) {
      const rows = await sql`SELECT m.id, m.name, m.width, m.height, m.entry_id, m.secret, m.version, m.pins, m.fog, m.updated_at, CASE WHEN m.image LIKE 'data:%' THEN 'data:' ELSE m.image END AS image, g.name AS updated_by_name
        FROM maps m LEFT JOIN gms g ON g.id = m.updated_by WHERE NOT m.deleted AND m.world_id = ${req.world.id} ORDER BY m.name`;
      return send(res, 200, { maps: rows.filter((m) => isGm || !m.secret).map((m) => shape(m, isGm)) });
    }
    const rows = await sql`SELECT m.*, g.name AS updated_by_name FROM maps m LEFT JOIN gms g ON g.id = m.updated_by WHERE m.id = ${id} AND NOT m.deleted AND m.world_id = ${req.world.id}`;
    const m = rows[0];
    if (!m || (m.secret && !isGm)) return fail(res, 404, 'That map doesn’t exist.');
    if (image) {
      if (!m.image.startsWith('data:')) { res.statusCode = 302; res.setHeader('Location', m.image); return res.end(); }
      const [, type, b64] = m.image.match(/^data:([^;]+);base64,(.*)$/);
      res.statusCode = 200;
      res.setHeader('Content-Type', type);
      res.setHeader('Cache-Control', m.secret ? 'private, max-age=86400' : 'public, max-age=31536000, immutable');
      return res.end(Buffer.from(b64, 'base64'));
    }
    const mine = req.gm && req.role ? await sql`SELECT id, x, y, label, note, shared, created_at FROM map_marks WHERE map_id = ${m.id} AND gm_id = ${req.gm.id} ORDER BY id` : [];
    const party = req.gm && req.role ? await sql`SELECT k.id, k.x, k.y, k.label, k.note, g.name AS by FROM map_marks k JOIN gms g ON g.id = k.gm_id
      JOIN members mb ON mb.gm_id = k.gm_id AND mb.world_id = ${req.world.id} WHERE k.map_id = ${m.id} AND k.shared AND k.gm_id <> ${req.gm.id} ORDER BY k.id` : [];
    send(res, 200, { map: shape(m, isGm), mine, party });
  },

  async POST(req, res) {
    if (req.body.mark) {
      if (!requireMember(req, res)) return;
      const k = req.body.mark;
      const m = (await sql`SELECT id, secret FROM maps WHERE id = ${String(k.map_id || '')} AND world_id = ${req.world.id} AND NOT deleted`)[0];
      if (!m || (m.secret && !req.isGmHere)) return fail(res, 404, 'That map doesn’t exist.');
      const x = Math.min(1, Math.max(0, Number(k.x) || 0)), y = Math.min(1, Math.max(0, Number(k.y) || 0));
      const label = clip(k.label, 80).trim() || 'Marker', note = clip(k.note, 1000), shared = Boolean(k.shared);
      if (k.id) {
        const rows = await sql`UPDATE map_marks SET x = ${x}, y = ${y}, label = ${label}, note = ${note}, shared = ${shared} WHERE id = ${Number(k.id)} AND gm_id = ${req.gm.id} AND map_id = ${m.id} RETURNING id, x, y, label, note, shared, created_at`;
        if (!rows.length) return fail(res, 404, 'That marker is gone.');
        return send(res, 200, { mark: rows[0] });
      }
      const n = (await sql`SELECT count(*)::int AS n FROM map_marks WHERE map_id = ${m.id} AND gm_id = ${req.gm.id}`)[0].n;
      if (n >= 200) return fail(res, 400, 'That’s 200 markers on this map already.');
      const rows = await sql`INSERT INTO map_marks (map_id, gm_id, x, y, label, note, shared) VALUES (${m.id}, ${req.gm.id}, ${x}, ${y}, ${label}, ${note}, ${shared}) RETURNING id, x, y, label, note, shared, created_at`;
      return send(res, 201, { mark: rows[0] });
    }
    if (!requireGm(req, res)) return;
    const b = req.body.map || {};
    const name = clip(b.name, 120).trim();
    if (!name) return fail(res, 400, 'Give the map a name.');
    const image = cleanImage(b.image);
    if (image.error) return fail(res, 400, image.error);
    const id = newId();
    await sql`INSERT INTO maps (id, world_id, name, image, width, height, pins, entry_id, secret, created_by, updated_by)
      VALUES (${id}, ${req.world.id}, ${name}, ${image}, ${Math.round(Number(b.width) || 0)}, ${Math.round(Number(b.height) || 0)}, ${JSON.stringify(cleanPins(b.pins))}, ${b.entry_id || null}, ${Boolean(b.secret)}, ${req.gm.id}, ${req.gm.id})`;
    const rows = await sql`SELECT * FROM maps WHERE id = ${id}`;
    send(res, 201, { map: shape(rows[0], true) });
  },

  async PUT(req, res) {
    if (!requireGm(req, res)) return;
    const id = req.query?.id;
    const b = req.body.map || {};
    const cur = (await sql`SELECT m.*, g.name AS updated_by_name FROM maps m LEFT JOIN gms g ON g.id = m.updated_by WHERE m.id = ${id} AND NOT m.deleted AND m.world_id = ${req.world.id}`)[0];
    if (!cur) return fail(res, 404, 'That map doesn’t exist any more.');
    let image = cur.image;
    if (b.image) { image = cleanImage(b.image); if (image.error) return fail(res, 400, image.error); }
    const name = clip(b.name ?? cur.name, 120).trim() || cur.name;
    let fog = cur.fog || null;
    if (b.fog !== undefined) { fog = b.fog === null ? null : cleanFog(b.fog); if (b.fog !== null && !fog) return fail(res, 400, 'That fog doesn’t fit this map. Reload and try again.'); }
    const rows = await sql`UPDATE maps SET name = ${name}, image = ${image}, width = ${Math.round(Number(b.width ?? cur.width) || 0)}, height = ${Math.round(Number(b.height ?? cur.height) || 0)},
      pins = ${JSON.stringify(cleanPins(b.pins ?? cur.pins))}, miles = ${b.miles === undefined ? cur.miles : cleanMiles(b.miles)}, fog = ${fog ? JSON.stringify(fog) : null}::jsonb, entry_id = ${b.entry_id === undefined ? cur.entry_id : b.entry_id || null}, secret = ${b.secret === undefined ? cur.secret : Boolean(b.secret)},
      updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${id} AND world_id = ${req.world.id} AND version = ${Number(b.version)} RETURNING *`;
    if (!rows.length) return fail(res, 409, `${cur.updated_by_name || 'Another GM'} changed this map a moment ago. Reload it to see their pins, then make your change again.`, { map: shape(cur, true) });
    send(res, 200, { map: shape(rows[0], true) });
  },

  async DELETE(req, res) {
    if (req.query?.mark) {
      if (!requireMember(req, res)) return;
      const rows = await sql`DELETE FROM map_marks WHERE id = ${Number(req.query.mark)} AND gm_id = ${req.gm.id} RETURNING id`;
      if (!rows.length) return fail(res, 404, 'That marker is gone.');
      return send(res, 200, { ok: true });
    }
    if (!requireGm(req, res)) return;
    const rows = await sql`UPDATE maps SET deleted = true, updated_by = ${req.gm.id}, updated_at = now() WHERE id = ${req.query?.id} AND world_id = ${req.world.id} RETURNING id`;
    if (!rows.length) return fail(res, 404, 'That map doesn’t exist.');
    send(res, 200, { ok: true });
  },
}, { world: true });
