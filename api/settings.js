// GET the current world's name and description · PUT to change them (world owner).
import { route, send, sql, requireOwner } from './_lib/core.js';

const clip = (v, n) => String(v ?? '').slice(0, n);

export default route({
  async GET(req, res) {
    const w = req.world;
    send(res, 200, { world: { id: w.id, slug: w.slug, name: w.name, tagline: w.tagline, about: w.about, calendar: w.calendar, public: w.public }, role: req.role });
  },
  async PUT(req, res) {
    if (!requireOwner(req, res)) return;
    const b = req.body || {};
    const rows = await sql`UPDATE worlds SET name = ${clip(b.name, 120).trim() || req.world.name}, tagline = ${clip(b.tagline, 240)}, about = ${clip(b.about, 8000)},
      calendar = ${clip(b.calendar, 2000)}, public = ${typeof b.public === 'boolean' ? b.public : req.world.public} WHERE id = ${req.world.id} RETURNING *`;
    const w = rows[0];
    send(res, 200, { world: { id: w.id, slug: w.slug, name: w.name, tagline: w.tagline, about: w.about, calendar: w.calendar, public: w.public } });
  },
}, { world: true });
