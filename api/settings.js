// GET the current world's name and description · PUT to change them (world owner).
// PATCH {cal}  set the in-world calendar and today's date (any GM: days pass during play).
// PUT {discord_webhook}  (owner) a Discord webhook link; it never leaves the server. Empty string removes it.
// PATCH {prep: {location_id, notes}}   (GM) session prep: where the party is, and the GMs' scratch pad.
// POST {post: entryId}   (GM) post an entry's summary and text to the world's Discord channel.
// PATCH {show: entryId | null}  (GM) show an entry to everyone with the world open (revealing it if hidden), or stop.
import { route, send, fail, sql, requireOwner, requireGm, postDiscord } from './_lib/core.js';
import { cleanCalendar } from '../js/calendar.js';
import { KINDS } from '../js/world-schema.js';

const WEBHOOK = /^https:\/\/(?:ptb\.|canary\.)?(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;
const plain = (t) => String(t || '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, n, l) => l || n);
const cut = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

const clip = (v, n) => String(v ?? '').slice(0, n);

export default route({
  async GET(req, res) {
    const w = req.world;
    send(res, 200, { world: { id: w.id, slug: w.slug, name: w.name, tagline: w.tagline, about: w.about, calendar: w.calendar, public: w.public, cal: w.cal || null, discord: Boolean(w.discord_webhook), ...(req.isGmHere ? { prep: w.prep || {} } : {}) }, role: req.role });
  },
  async PUT(req, res) {
    if (!requireOwner(req, res)) return;
    const b = req.body || {};
    if (typeof b.discord_webhook === 'string') {
      const hook = b.discord_webhook.trim();
      if (hook && !WEBHOOK.test(hook)) return fail(res, 400, 'That doesn’t look like a Discord webhook link. In Discord: channel settings → Integrations → Webhooks → Copy Webhook URL.');
      await sql`UPDATE worlds SET discord_webhook = ${hook || null} WHERE id = ${req.world.id}`;
      if (b.name === undefined) return send(res, 200, { discord: Boolean(hook) });
    }
    const rows = await sql`UPDATE worlds SET name = ${clip(b.name, 120).trim() || req.world.name}, tagline = ${clip(b.tagline, 240)}, about = ${clip(b.about, 8000)},
      calendar = ${clip(b.calendar, 2000)}, public = ${typeof b.public === 'boolean' ? b.public : req.world.public} WHERE id = ${req.world.id} RETURNING *`;
    const w = rows[0];
    send(res, 200, { world: { id: w.id, slug: w.slug, name: w.name, tagline: w.tagline, about: w.about, calendar: w.calendar, public: w.public, cal: w.cal || null, discord: Boolean(w.discord_webhook) } });
  },
  async POST(req, res) {
    if (!requireGm(req, res)) return;
    const hook = req.world.discord_webhook;
    if (!hook) return fail(res, 400, 'This world has no Discord channel yet. The owner can add a webhook in World settings.');
    const e = (await sql`SELECT * FROM entries WHERE id = ${String(req.body.post || '')} AND world_id = ${req.world.id} AND NOT deleted`)[0];
    if (!e) return fail(res, 404, 'That entry doesn’t exist.');
    const origin = `https://${req.headers.host}`;
    const skip = new Set(['forge', 'play', 'known', 'attitudes', 'objectives', 'spread', 'image', 'stats', 'spells', 'stock', 'market', 'encounters', 'sheet']);
    const fields = (KINDS[e.kind]?.fields || []).filter(([k]) => e.fields?.[k] && !skip.has(k)).slice(0, 8)
      .map(([k, label]) => ({ name: label, value: cut(plain(e.fields[k]), 1000), inline: !String(e.fields[k]).includes('\n') && String(e.fields[k]).length < 40 }));
    const img = e.fields?.image;
    const embed = {
      title: cut(e.name, 250), url: `${origin}/?w=${encodeURIComponent(req.world.slug)}#world/e/${e.id}`,
      description: cut([plain(e.summary), plain(e.kind === 'handout' ? e.fields?.text : e.body)].filter(Boolean).join('\n\n'), 3500),
      color: 0x1C6A63, fields, footer: { text: `${req.world.name} · ${KINDS[e.kind]?.label || e.kind}` },
      ...(img ? { image: { url: img.startsWith('/') ? `${origin}${img}` : img } } : {}),
    };
    const err = await postDiscord(hook, embed);
    if (err) return fail(res, 502, err);
    send(res, 200, { ok: true });
  },
  async PATCH(req, res) {
    if (!requireGm(req, res)) return;
    if (req.body.show !== undefined) {
      if (req.body.show === null) { await sql`UPDATE worlds SET shown = NULL WHERE id = ${req.world.id}`; return send(res, 200, { shown: null }); }
      const e = (await sql`SELECT id, visibility, status FROM entries WHERE id = ${String(req.body.show)} AND world_id = ${req.world.id} AND NOT deleted`)[0];
      if (!e) return fail(res, 404, 'That entry doesn’t exist.');
      if (e.status !== 'live') return fail(res, 400, 'Approve this suggestion before showing it.');
      // Showing something hidden reveals it, so players can open it again later.
      if (e.visibility === 'gm') {
        await sql`UPDATE entries SET visibility = 'all', updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${e.id}`;
        await sql`INSERT INTO history (entry_id, gm_id, action) VALUES (${e.id}, ${req.gm.id}, 'reveal')`;
      }
      const shown = { entry_id: e.id, at: new Date().toISOString(), by: req.gm.name };
      await sql`UPDATE worlds SET shown = ${JSON.stringify(shown)} WHERE id = ${req.world.id}`;
      return send(res, 200, { shown, revealed: e.visibility === 'gm' });
    }
    if (req.body.prep !== undefined) {
      const p = req.body.prep || {};
      const cur = req.world.prep || {};
      const next = {
        location_id: p.location_id === undefined ? cur.location_id || null : p.location_id ? String(p.location_id).slice(0, 40) : null,
        notes: p.notes === undefined ? cur.notes || '' : String(p.notes).slice(0, 20000),
        updated_by: req.gm.name, updated_at: new Date().toISOString(),
      };
      await sql`UPDATE worlds SET prep = ${JSON.stringify(next)} WHERE id = ${req.world.id}`;
      return send(res, 200, { prep: next });
    }
    const cal = req.body.cal === null ? null : cleanCalendar(req.body.cal);
    if (req.body.cal !== null && !cal) return fail(res, 400, 'That calendar needs at least one month.');
    await sql`UPDATE worlds SET cal = ${cal ? JSON.stringify(cal) : null} WHERE id = ${req.world.id}`;
    send(res, 200, { cal });
  },
}, { world: true });
