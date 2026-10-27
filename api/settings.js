// GET the world's name and description (public) · PUT to change them (admin).
import { route, send, sql, requireAdmin } from './_lib/core.js';

const clip = (v, n) => String(v ?? '').slice(0, n);

export default route({
  async GET(req, res) {
    const rows = await sql`SELECT value FROM settings WHERE key = 'world'`;
    send(res, 200, { world: rows[0]?.value || null });
  },
  async PUT(req, res) {
    if (!requireAdmin(req, res)) return;
    const b = req.body || {};
    const value = { name: clip(b.name, 120), tagline: clip(b.tagline, 240), about: clip(b.about, 8000), calendar: clip(b.calendar, 2000) };
    await sql`INSERT INTO settings (key, value) VALUES ('world', ${JSON.stringify(value)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    send(res, 200, { world: value });
  },
});
