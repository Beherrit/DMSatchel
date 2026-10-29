// GET the current world's name and description · PUT to change them (world owner).
// PATCH {cal}  set the in-world calendar and today's date (any GM: days pass during play).
// PUT {discord_webhook}  (owner) a Discord webhook link; it never leaves the server. Empty string removes it.
// PATCH {prep: {location_id, notes}}   (GM) session prep: where the party is, and the GMs' scratch pad. Moving the
//   party adds a stop to prep.journey (with the in-world date); PATCH {journey_remove: at} strikes one.
// PATCH {checklist: {add} | {remove} | {done, on} | {order}, round}   (GM) the prep checklist (prep.checklist); round
//   is the next session's number, so ticks clear when a new session is logged
// PATCH {not_dupe: 'idA|idB'}   (GM) two entries with alike names are different things (prep.not_dupes)
// PATCH {tag_note: {tag, text}}   (GM) a tag's description on its page
// PATCH {start_here: {id, on} | {order}}   (GM) the entries newcomers should read first
// PATCH {clock: {advance} | {set} | {add_light} | {remove_light}}   (GM) time of day and lights during play
// PATCH {notice: {add: {text, until}} | {remove: id}, discord?}   (GM) notices on the front page (and Discord)
// PATCH {secret: {add} | {id, found, session} | {id, text} | {remove}}   (GM) secrets and clues in session prep
// POST {post: entryId}   (GM) post an entry's summary and text to the world's Discord channel.
// PATCH {template: {name, kind, summary, body, fields, tags, secret}}  (GM) save an entry template; {template_remove: id} delete one
// PATCH {show: entryId | null}  (GM) show an entry to everyone with the world open (revealing it if hidden), or stop.
// PATCH {custom_fields: {kind, list}}  (GM) the world's own fields for one kind of entry (an empty list removes them)
import { route, send, fail, sql, requireOwner, requireGm, postDiscord } from './_lib/core.js';
import { cleanCalendar, advance, formatDate, today } from '../js/calendar.js';
import { addStop, removeStop } from '../js/journey.js';
import { applyChecklist } from '../js/checklist.js';
import { KINDS } from '../js/world-schema.js';
import { readCustom, cleanCustomList, customKeys } from '../js/custom-fields.js';
import { applySecret } from '../js/secrets.js';
import { applyNotice } from '../js/notices.js';
import { readClock, advanceClock, setTime, addLight, removeLight } from '../js/clock.js';

const WEBHOOK = /^https:\/\/(?:ptb\.|canary\.)?(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;
const plain = (t) => String(t || '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, n, l) => l || n);
const cut = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

// A template keeps an entry's text and fields, but nothing tied to one character or session.
const PERSONAL = new Set(['play', 'forge', 'known', 'attitudes', 'attendance', 'spread', 'goals']);
function cleanTemplate(t = {}, custom = {}) {
  if (!KINDS[t.kind]) return { error: 'Unknown kind of entry.' };
  const name = String(t.name || '').trim().slice(0, 80);
  if (!name) return { error: 'Give the template a name.' };
  const allowed = new Set([...KINDS[t.kind].fields.map(([k]) => k), ...customKeys(t.kind, custom)]);
  const fields = Object.fromEntries(Object.entries(t.fields || {}).filter(([k, v]) => allowed.has(k) && !PERSONAL.has(k) && v != null && String(v).trim()).map(([k, v]) => [k, String(v).slice(0, 8000)]));
  const out = { id: Math.random().toString(36).slice(2, 10), name, kind: t.kind, summary: String(t.summary || '').slice(0, 4000), body: String(t.body || '').slice(0, 20000),
    secret: String(t.secret || '').slice(0, 8000), tags: (Array.isArray(t.tags) ? t.tags : []).map((x) => String(x).slice(0, 40)).slice(0, 30), fields };
  return JSON.stringify(out).length > 60000 ? { error: 'That template is too long.' } : out;
}

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
    const skip = new Set(['forge', 'play', 'known', 'attitudes', 'goals', 'gallery', 'objectives', 'attendance', 'enc', 'spread', 'image', 'stats', 'spells', 'stock', 'market', 'encounters', 'sheet']);
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
    // The world's own fields for one kind: {custom_fields: {kind, list: [{ key?, label, type, options, gmOnly }]}}.
    if (req.body.custom_fields) {
      const { kind, list } = req.body.custom_fields;
      const r = cleanCustomList(kind, list);
      if (r.error) return fail(res, 400, r.error);
      const all = readCustom(req.world.custom_fields);
      if (r.list.length) all[kind] = r.list; else delete all[kind];
      await sql`UPDATE worlds SET custom_fields = ${JSON.stringify(all)}::jsonb WHERE id = ${req.world.id}`;
      return send(res, 200, { custom_fields: all });
    }
    if (req.body.template || req.body.template_remove) {
      let list = Array.isArray(req.world.templates) ? req.world.templates : [];
      if (req.body.template_remove) list = list.filter((t) => t.id !== String(req.body.template_remove));
      else {
        const t = cleanTemplate(req.body.template, readCustom(req.world.custom_fields));
        if (t.error) return fail(res, 400, t.error);
        if (list.length >= 60) return fail(res, 400, 'That’s 60 templates already. Delete one you don’t use first.');
        list = [...list.filter((x) => !(x.name.toLowerCase() === t.name.toLowerCase() && x.kind === t.kind)), t];
      }
      await sql`UPDATE worlds SET templates = ${JSON.stringify(list)}::jsonb WHERE id = ${req.world.id}`;
      return send(res, 200, { templates: list });
    }
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
    // Secrets and clues in session prep, one change at a time: {secret: {add} | {id, found, session} | {id, text} | {remove}}.
    // Tag descriptions (GMs): {tag_note: {tag, text}}; an empty text removes it.
    if (req.body.tag_note) {
      const tag = String(req.body.tag_note.tag || '').trim().replace(/^#+/, '').toLowerCase().slice(0, 40);
      if (!tag) return fail(res, 400, 'Which tag?');
      const text = String(req.body.tag_note.text || '').trim().slice(0, 2000);
      const notes = { ...(req.world.tag_notes && typeof req.world.tag_notes === 'object' ? req.world.tag_notes : {}) };
      if (text) notes[tag] = text; else delete notes[tag];
      if (Object.keys(notes).length > 300) return fail(res, 400, 'That’s a lot of tag descriptions already.');
      await sql`UPDATE worlds SET tag_notes = ${JSON.stringify(notes)}::jsonb WHERE id = ${req.world.id}`;
      return send(res, 200, { tag_notes: notes });
    }
    // Start here (GMs): {start_here: {id, on}} adds or removes an entry; {start_here: {order: [ids]}} reorders.
    if (req.body.start_here) {
      const b = req.body.start_here;
      let list = (Array.isArray(req.world.start_here) ? req.world.start_here : []).map(String);
      if (Array.isArray(b.order)) list = b.order.map(String).filter((id) => list.includes(id));
      else {
        const id = String(b.id || '').slice(0, 40);
        const e = (await sql`SELECT id FROM entries WHERE id = ${id} AND world_id = ${req.world.id} AND NOT deleted`)[0];
        if (!e) return fail(res, 404, 'That entry doesn’t exist.');
        list = list.filter((x) => x !== id);
        if (b.on) { if (list.length >= 12) return fail(res, 400, 'Twelve is plenty for newcomers. Take one off first.'); list.push(id); }
      }
      await sql`UPDATE worlds SET start_here = ${JSON.stringify(list)}::jsonb WHERE id = ${req.world.id}`;
      return send(res, 200, { start_here: list });
    }
    // The time of day and the lights (any GM, during play): {clock: {advance: minutes} | {set: minutes} |
    // {add_light: {name, minutes}} | {remove_light: id}}. Passing midnight moves the calendar on.
    if (req.body.clock) {
      const c = req.body.clock;
      let clock = readClock(req.world.clock), cal = req.world.cal || null, out = [], days = 0;
      if (c.advance !== undefined) ({ clock, days, out } = advanceClock(clock, c.advance));
      else if (c.set !== undefined) clock = setTime(clock, c.set);
      else if (c.add_light) { const r = addLight(clock, c.add_light.name, c.add_light.minutes); if (r.error) return fail(res, 400, r.error); clock = r.clock; }
      else if (c.remove_light) clock = removeLight(clock, String(c.remove_light));
      if (days && cal) { cal = advance(cal, days); await sql`UPDATE worlds SET cal = ${JSON.stringify(cal)} WHERE id = ${req.world.id}`; }
      await sql`UPDATE worlds SET clock = ${JSON.stringify(clock)}::jsonb WHERE id = ${req.world.id}`;
      return send(res, 200, { clock, cal, days, out });
    }
    // Notices from the GMs: {notice: {add: {text, until}} | {remove: id}}.
    if (req.body.notice) {
      const r = applyNotice(req.world.notices, req.body.notice, req.gm.name);
      if (r.error) return fail(res, 400, r.error);
      await sql`UPDATE worlds SET notices = ${JSON.stringify(r.list)}::jsonb WHERE id = ${req.world.id}`;
      // Also to the world's Discord channel, if asked (the notice is saved either way).
      let discord = null;
      if (req.body.notice.add && req.body.discord && req.world.discord_webhook) {
        const n = r.list[0];
        discord = await postDiscord(req.world.discord_webhook, { title: '📣 Notice from the GMs', description: n.text.slice(0, 3500), color: 0x1C6A63,
          url: `https://${req.headers.host}/?w=${encodeURIComponent(req.world.slug)}#world`, footer: { text: `${req.world.name} · ${n.by}${n.until ? ` · until ${n.until}` : ''}` } });
      }
      return send(res, 200, { notices: r.list, ...(discord ? { discord_error: discord } : {}) });
    }
    if (req.body.secret) {
      const r = applySecret(req.world.prep?.secrets, req.body.secret, req.gm.name);
      if (r.error) return fail(res, 400, r.error);
      await sql`UPDATE worlds SET prep = jsonb_set(COALESCE(prep, '{}'::jsonb), '{secrets}', ${JSON.stringify(r.list)}::jsonb) WHERE id = ${req.world.id}`;
      return send(res, 200, { secrets: r.list });
    }
    if (req.body.checklist !== undefined) {
      const r = applyChecklist(req.world.prep?.checklist, req.body.checklist, Number(req.body.round) || 0);
      if (r.error) return fail(res, 400, r.error);
      await sql`UPDATE worlds SET prep = jsonb_set(COALESCE(prep, '{}'::jsonb), '{checklist}', ${JSON.stringify(r.list)}::jsonb) WHERE id = ${req.world.id}`;
      return send(res, 200, { checklist: r.list });
    }
    if (req.body.not_dupe !== undefined) {
      const key = String(req.body.not_dupe).split('|').map((x) => x.trim().slice(0, 40)).filter(Boolean).sort().join('|');
      if (key.split('|').length !== 2) return fail(res, 400, 'Name two entries.');
      const list = [...new Set([...(Array.isArray(req.world.prep?.not_dupes) ? req.world.prep.not_dupes : []), key])].slice(-2000);
      await sql`UPDATE worlds SET prep = jsonb_set(COALESCE(prep, '{}'::jsonb), '{not_dupes}', ${JSON.stringify(list)}::jsonb) WHERE id = ${req.world.id}`;
      return send(res, 200, { not_dupes: list });
    }
    if (req.body.journey_remove !== undefined) {
      const list = removeStop(req.world.prep?.journey, String(req.body.journey_remove));
      await sql`UPDATE worlds SET prep = jsonb_set(COALESCE(prep, '{}'::jsonb), '{journey}', ${JSON.stringify(list)}::jsonb) WHERE id = ${req.world.id}`;
      return send(res, 200, { journey: list });
    }
    if (req.body.prep !== undefined) {
      const p = req.body.prep || {};
      const cur = req.world.prep || {};
      const next = {
        location_id: p.location_id === undefined ? cur.location_id || null : p.location_id ? String(p.location_id).slice(0, 40) : null,
        notes: p.notes === undefined ? cur.notes || '' : String(p.notes).slice(0, 20000),
        updated_by: req.gm.name, updated_at: new Date().toISOString(),
      };
      // Where the party has been: a stop each time they move somewhere new.
      if (next.location_id && next.location_id !== (cur.location_id || null)) {
        let day = '';
        try { if (req.world.cal) day = formatDate(req.world.cal, today(req.world.cal)); } catch { /* no calendar */ }
        next.journey = addStop(cur.journey, { id: next.location_id, at: next.updated_at, day, by: req.gm.name });
      }
      // Merged into what's stored, so the secrets list (changed on its own) is never dropped.
      await sql`UPDATE worlds SET prep = COALESCE(prep, '{}'::jsonb) || ${JSON.stringify(next)}::jsonb WHERE id = ${req.world.id}`;
      return send(res, 200, { prep: { ...cur, ...next } });
    }
    const cal = req.body.cal === null ? null : cleanCalendar(req.body.cal);
    if (req.body.cal !== null && !cal) return fail(res, 400, 'That calendar needs at least one month.');
    await sql`UPDATE worlds SET cal = ${cal ? JSON.stringify(cal) : null} WHERE id = ${req.world.id}`;
    send(res, 200, { cal });
  },
}, { world: true });
