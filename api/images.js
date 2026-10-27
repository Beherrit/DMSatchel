// Pictures attached to entries: NPC portraits, places, items, handouts.
// GET ?id=            the image (anyone who can read its world); ids are random and images never change, so it caches hard
// POST {image, width, height}   upload a data URL (any member of the world); returns {id, url}
import { route, send, fail, sql, newId, requireMember, worldContext } from './_lib/core.js';

const MAX = 1_200_000; // characters of data URL; the browser shrinks uploads well under this
const PER_WORLD = 3000;

export default route({
  async GET(req, res) {
    const id = String(req.query?.id || '').slice(0, 40);
    const img = (await sql`SELECT id, world_id, data FROM images WHERE id = ${id}`)[0];
    if (!img) return fail(res, 404, 'No such image.');
    req.query = { ...req.query, world: img.world_id };
    await worldContext(req);
    if (!req.world || req.world.id !== img.world_id || !req.canRead) return fail(res, 404, 'No such image.');
    const [, type, b64] = img.data.match(/^data:([^;]+);base64,(.*)$/);
    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', req.world.public ? 'public, max-age=31536000, immutable' : 'private, max-age=31536000, immutable');
    res.end(Buffer.from(b64, 'base64'));
  },
  async POST(req, res) {
    await worldContext(req);
    if (!req.world) return fail(res, 404, 'That world doesn’t exist.');
    if (!requireMember(req, res)) return;
    const data = String(req.body.image || '');
    if (!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(data)) return fail(res, 400, 'That isn’t an image.');
    if (data.length > MAX) return fail(res, 400, 'That image is too large. Try a smaller one.');
    const n = (await sql`SELECT count(*)::int AS n FROM images WHERE world_id = ${req.world.id}`)[0].n;
    if (n >= PER_WORLD) return fail(res, 400, 'This world has too many pictures. Use image links instead.');
    const id = newId();
    await sql`INSERT INTO images (id, world_id, data, width, height, created_by) VALUES (${id}, ${req.world.id}, ${data},
      ${Math.round(Number(req.body.width) || 0)}, ${Math.round(Number(req.body.height) || 0)}, ${req.gm.id})`;
    send(res, 201, { id, url: `/api/images?id=${id}` });
  },
});
