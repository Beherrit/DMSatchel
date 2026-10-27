// GET the current world's name and description · PUT to change them (world owner).
// PATCH {cal}  set the in-world calendar and today's date (any GM: days pass during play).
// PUT {discord_webhook}  (owner) a Discord webhook link; it never leaves the server. Empty string removes it.
// POST {post: entryId}   (GM) post an entry's summary and text to the world's Discord channel.
import { route, send, fail, sql, requireOwner, requireGm } from './_lib/core.js';
import { cleanCalendar } from '../js/calendar.js';
import { KINDS } from '../js/world-schema.js';

const WEBHOOK = /^https:\/\/(?:ptb\.|canary\.)?(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;
const plain = (t) => String(t || '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, n, l) => l || n);
const cut = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

const clip = (v, n) => String(v ?? '').slice(0, n);

export default route({
  async GET(req, res) {
    const w = req.world;
    send(res, 200, { world: { id: w.id, slug: w.slug, name: w.name, tagline: w.tagline, about: w.about, calendar: w.calendar, public: w.public, cal: w.cal || null, discord: Boolean(w.discord_webhook) }, role: req.role });
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
    const skip = new Set(['forge', 'play', 'known', 'spread', 'image', 'stats', 'spells', 'stock', 'market', 'encounters', 'sheet']);
    const fields = (KINDS[e.kind]?.fields || []).filter(([k]) => e.fields?.[k] && !skip.has(k)).slice(0, 8)
      .map(([k, label]) => ({ name: label, value: cut(plain(e.fields[k]), 1000), inline: !String(e.fields[k]).includes('\n') && String(e.fields[k]).length < 40 }));
    const img = e.fields?.image;
    const embed = {
      title: cut(e.name, 250), url: `${origin}/?w=${encodeURIComponent(req.world.slug)}#world/e/${e.id}`,
      description: cut([plain(e.summary), plain(e.kind === 'handout' ? e.fields?.text : e.body)].filter(Boolean).join('\n\n'), 3500),
      color: 0x1C6A63, fields, footer: { text: `${req.world.name} · ${KINDS[e.kind]?.label || e.kind}` },
      ...(img ? { image: { url: img.startsWith('/') ? `${origin}${img}` : img } } : {}),
    };
    const r = await fetch(`${hook}?wait=false`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'The DM’s Satchel', embeds: [embed] }) }).catch(() => null);
    if (!r || !r.ok) return fail(res, 502, `Discord didn’t accept the post${r ? ` (${r.status})` : ''}. Check the webhook still exists.`);
    send(res, 200, { ok: true });
  },
  async PATCH(req, res) {
    if (!requireGm(req, res)) return;
    const cal = req.body.cal === null ? null : cleanCalendar(req.body.cal);
    if (req.body.cal !== null && !cal) return fail(res, 400, 'That calendar needs at least one month.');
    await sql`UPDATE worlds SET cal = ${cal ? JSON.stringify(cal) : null} WHERE id = ${req.world.id}`;
    send(res, 200, { cal });
  },
}, { world: true });
