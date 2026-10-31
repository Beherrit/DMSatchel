// The entries of one world (?world=<id or slug>).
// GET               every entry the requester may see
// GET ?since=<iso>  entries changed since then (for live updates): {changed, removed, now}
// GET ?id=          one entry
// POST {entry}      create. GMs create anything; players create their own characters and journals, and anything
//                   else they make is a suggestion that waits for a GM.
// POST {entries:[...], mode:'batch'}   up to 25 at once (GM) · mode:'import' restores a backup (owner)
// PUT ?id= {entry}  update; send the version you loaded or get 409. Players may edit only their own entries.
// PATCH {id, visibility?, status?}     GM quick changes: reveal or hide, approve a suggestion
// PATCH {ids, visibility | add_tag | remove_tag | move_to}   the same for many entries at once (GM)
// PATCH {ids, set_field: {key, value}}  (GM) set one field on every selected entry whose kind has it ('' clears it)
// PATCH {rename_tag: {from, to}}       (GM) rename a tag on every entry, or fold it into another tag
// POST {suggest_edit: {entry_id, summary, body, fields, note}}   (member) suggest changes to an entry you can see
// GET ?edits=1                          suggested edits: every open one (GMs) or your own (players)
// PATCH {edit_id, decision: 'accept' | 'decline'}   (GM) apply a suggested edit, or turn it down
// PATCH {merge: {from, into}}          (GM) fold one entry into another: text, fields, tags, connections, what's
//                                   inside it, mentions, comments, standing, clocks and map pins move over; the
//                                   merged-away entry goes to the bin
// PATCH {give: {from, to, item, qty, cp, from_base, to_base}}   hand an item and/or coin from one character's
//                                   sheet to another's (the giver's player or a GM). *_base: the sheet's coin and
//                                   inventory as the page shows them, used only where the sheet never saved its own.
// PATCH {id, share: [member ids]}     (GM) give a hidden entry to chosen members only ([] takes it back)
// PATCH {id, claim: true} · {id, owner: null}   claim an unowned character (member) · unassign it (GM)
// DELETE ?id=       move to the bin (GM, or a player's own entry) · DELETE ?id=&restore=1 brings it back (the same people)
//
// Players never receive: GM-only entries, other people's pending suggestions, secrets, or GM-only links.
import { route, send, fail, sql, newId, requireGm, requireMember, requireOwner } from './_lib/core.js';
import { KINDS, isKind, LIMITS, PLAYER_KINDS, PLACE_KINDS, isImageRef, gmOnlyFields } from '../js/world-schema.js';
import { forPlayers } from '../js/objectives.js';
import { goalsForOthers } from '../js/goals.js';
import { cleanGallery } from '../js/gallery.js';
import { cleanShare, sharedWith } from '../js/sharing.js';
import { cleanProposal, applyProposal } from '../js/edit-suggest.js';
import { takeItem, giveItem } from '../js/handover.js';
import { mergedEntry, relinkLinks, relinkText } from '../js/merge.js';
import { fieldsWith } from '../js/custom-fields.js';
import { cleanSay } from '../js/say.js';
import { cleanAka } from '../js/aka.js';
import { readMenu } from '../js/menu.js';
import { buyFrom, sellTo } from '../js/purchase.js';
import { coinText, GOODS } from '../js/economy.js';
import { cleanMusic } from '../js/music.js';
import { journeyFor } from '../js/journey.js';
import { readingFor } from '../js/reading.js';
import { cleanRevealAt } from '../js/reveal-date.js';
import { askUnread } from './_lib/ask.js';
import { rsvpSummary, rsvpOpen } from '../js/rsvp.js';
import { cleanTag, chainUp, setFieldValue } from '../js/bulk.js';
import { cleanPrimer, primerEmpty } from '../js/zero.js';
import { activeNotices } from '../js/notices.js';
import { readClock } from '../js/clock.js';
import { readCustom, customForPlayers, customKeys, secretCustomKeys, isCustomKey } from '../js/custom-fields.js';

const clip = (v, n) => String(v ?? '').slice(0, n);

// The world's own fields, read once per request.
const customOf = (req) => (req.custom ??= readCustom(req.world?.custom_fields));

function clean(input, custom = {}) {
  const e = input || {};
  if (!isKind(e.kind)) return { error: 'Pick what kind of entry this is.' };
  const name = clip(e.name, LIMITS.name).trim();
  if (!name) return { error: 'Give the entry a name.' };
  const allowed = new Set([...KINDS[e.kind].fields.map(([k]) => k), ...customKeys(e.kind, custom), 'say', 'aka', 'music', 'image_alt', 'party_edit', 'menu', 'hired', 'wage', 'restocked']);
  const fields = {};
  for (const [k, v] of Object.entries(e.fields || {})) if (allowed.has(k) && v != null && String(v).trim() && (k !== 'image' || isImageRef(String(v)))) fields[k] = clip(v, ['stock', 'sheet', 'play', 'spread', 'known', 'attitudes', 'objectives', 'attendance', 'enc', 'goals', 'wishes', 'gallery', 'menu'].includes(k) ? LIMITS.body : LIMITS.field);
  // Pictures in the gallery must be real image addresses.
  if (fields.gallery) { fields.gallery = cleanGallery(fields.gallery); if (!fields.gallery) delete fields.gallery; }
  if (fields.say) { fields.say = cleanSay(fields.say); if (!fields.say) delete fields.say; }
  if (fields.menu) { const m = readMenu(fields.menu); if (m) fields.menu = JSON.stringify(m); else delete fields.menu; }
  if (fields.aka) { fields.aka = cleanAka(fields.aka, name); if (!fields.aka) delete fields.aka; }
  if (fields.music) { fields.music = cleanMusic(fields.music); if (!fields.music) delete fields.music; }
  if (fields.image_alt) { fields.image_alt = String(fields.image_alt).replace(/\s+/g, ' ').trim().slice(0, 300); if (!fields.image_alt || !fields.image) delete fields.image_alt; }
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
    // Players may edit their own entries, and pages the GMs opened to the party (text only; see PUT).
    can_edit: Boolean(gmView || (req.role && (mine || row.fields?.party_edit === 'yes'))),
  };
  if (gmView) { out.secret = row.secret; out.deleted = row.deleted; out.shared_with = cleanShare(row.shared_with); out.reveal_at = row.reveal_at || null; }
  else if (row.visibility === 'gm' && sharedWith(row, req.gm?.id)) out.shared = true;
  else {
    if (row.fields?.objectives) out.fields = { ...row.fields, objectives: forPlayers(row.fields.objectives) };
    // A character's secret goals: only its player (and the GMs) see them.
    if (row.fields?.goals && !mine) out.fields = { ...out.fields, goals: goalsForOthers(row.fields.goals) };
    // A character's wish list: only its player (and the GMs).
    if (row.fields?.wishes && !mine) { out.fields = { ...out.fields }; delete out.fields.wishes; }
    // The world's own GM-only fields stay with the GMs, even on a player's own entries.
    const hide = secretCustomKeys(row.kind, customOf(req)).filter((k) => out.fields?.[k]);
    if (hide.length) { out.fields = { ...out.fields }; for (const k of hide) delete out.fields[k]; }
  }
  return out;
}

const partyAt = (w, rows, req) => {
  const id = w.prep?.location_id;
  const row = id && rows.find((r) => r.id === id);
  return row && !row.deleted && visibleTo(row, req) ? id : null;
};

const visibleTo = (row, req) => req.isGmHere || (row.owner_id && req.gm && row.owner_id === req.gm.id) || (row.visibility === 'all' && row.status === 'live')
  || (row.status === 'live' && sharedWith(row, req.gm?.id));

// The reading list for next session, as this person sees it (see js/reading.js).
async function readingOf(w, req, sees) {
  const ids = Array.isArray(w.prep?.reading) ? w.prep.reading.filter(sees) : [];
  if (!ids.length) return [];
  if (req.isGmHere) {
    const rows = await sql`SELECT r.entry_id, g.name FROM entry_reads r JOIN gms g ON g.id = r.gm_id WHERE r.world_id = ${w.id} AND r.entry_id = ANY(${ids}) ORDER BY r.first_at`;
    const by = new Map();
    for (const r of rows) by.set(r.entry_id, [...(by.get(r.entry_id) || []), r.name]);
    return readingFor(ids, sees, by);
  }
  if (!req.gm) return readingFor(ids, sees, new Set());
  const mine = await sql`SELECT entry_id FROM entry_reads WHERE world_id = ${w.id} AND gm_id = ${req.gm.id} AND entry_id = ANY(${ids})`;
  return readingFor(ids, sees, new Set(mine.map((r) => r.entry_id)));
}

async function loadOne(id, worldId) {
  const rows = await sql`SELECT e.*, c.name AS created_by_name, u.name AS updated_by_name, o.name AS owner_name FROM entries e
    LEFT JOIN gms c ON c.id = e.created_by LEFT JOIN gms u ON u.id = e.updated_by LEFT JOIN gms o ON o.id = e.owner_id
    WHERE e.id = ${id} AND e.world_id = ${worldId}`;
  return rows[0];
}

// What the history keeps for a version (the same shape an edit saves).
const snapshot = (r) => ({ kind: r.kind, name: r.name, summary: r.summary, body: r.body, fields: r.fields, secret: r.secret, tags: r.tags, links: r.links, parent_id: r.parent_id, visibility: r.visibility });

async function record(entryId, gmId, action, snapshot) {
  await sql`INSERT INTO history (entry_id, gm_id, action, snapshot) VALUES (${entryId}, ${gmId}, ${action}, ${JSON.stringify(snapshot)})`;
}

// Hidden entries whose reveal date has come: shown to players now, by the first load of the world after it (no
// scheduler needed). Logged as a reveal by no one in particular.
async function revealDue(worldId) {
  const rows = await sql`UPDATE entries SET visibility = 'all', reveal_at = NULL, updated_at = now(), version = version + 1
    WHERE world_id = ${worldId} AND reveal_at IS NOT NULL AND reveal_at <= now() AND NOT deleted RETURNING id`;
  for (const r of rows) await record(r.id, null, 'reveal', null);
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
    if (req.query?.edits) {
      if (!requireMember(req, res)) return;
      const rows = req.isGmHere
        ? await sql`SELECT s.*, g.name AS by FROM edit_suggestions s LEFT JOIN gms g ON g.id = s.gm_id WHERE s.world_id = ${req.world.id} AND s.status = 'open' ORDER BY s.created_at`
        : await sql`SELECT s.*, g.name AS by FROM edit_suggestions s LEFT JOIN gms g ON g.id = s.gm_id WHERE s.world_id = ${req.world.id} AND s.gm_id = ${req.gm.id} ORDER BY s.created_at DESC LIMIT 30`;
      return send(res, 200, { edits: rows.map((s) => ({ id: s.id, entry_id: s.entry_id, by: s.by, base_version: s.base_version, proposal: s.proposal, note: s.note, status: s.status, created_at: s.created_at, decided_at: s.decided_at })) });
    }
    if (!req.query?.edits) await revealDue(req.world.id);
    if (since) {
      const t = new Date(since);
      if (Number.isNaN(t.getTime())) return fail(res, 400, 'Bad time.');
      const rows = await sql`SELECT e.*, c.name AS created_by_name, u.name AS updated_by_name, o.name AS owner_name FROM entries e
        LEFT JOIN gms c ON c.id = e.created_by LEFT JOIN gms u ON u.id = e.updated_by LEFT JOIN gms o ON o.id = e.owner_id
        WHERE e.world_id = ${req.world.id} AND e.updated_at >= ${t.toISOString()} ORDER BY e.updated_at LIMIT 500`;
      const now = (await sql`SELECT now() AS now`)[0].now;
      if (req.gm && req.role) await sql`UPDATE members SET seen_at = now() WHERE world_id = ${req.world.id} AND gm_id = ${req.gm.id} AND (seen_at IS NULL OR seen_at < now() - interval '5 minutes')`;
      return send(res, 200, {
        changed: rows.filter((r) => !r.deleted && visibleTo(r, req)).map((r) => shape(r, req)),
        removed: rows.filter((r) => r.deleted || !visibleTo(r, req)).map((r) => r.id), now, cal: req.world.cal || null, shown: req.world.shown || null,
        ...(req.role ? { notices: activeNotices(req.world.notices) } : {}), clock: readClock(req.world.clock), ask_unread: await askUnread(req),
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
    const w = req.world, byId = new Map(rows.map((r) => [r.id, r]));
    const now = (await sql`SELECT now() AS now`)[0].now;
    // A new sitting (three hours since this member was last here) moves their "last visit" mark forward.
    let prevVisit = null, favorites, following;
    if (req.gm && req.role && !bin) {
      const m = (await sql`UPDATE members SET prev_visit = CASE WHEN seen_at IS NULL OR seen_at < now() - interval '3 hours' THEN seen_at ELSE prev_visit END, seen_at = now()
        WHERE world_id = ${w.id} AND gm_id = ${req.gm.id} RETURNING prev_visit, favorites, following`)[0];
      prevVisit = m ? m.prev_visit || null : undefined;
      if (m) { favorites = Array.isArray(m.favorites) ? m.favorites : []; following = Array.isArray(m.following) ? m.following : []; }
    }
    // Has this member read the session zero page yet? (Only asked when there is one.)
    let zeroRead;
    if (req.gm && req.role && w.primer && !primerEmpty(w.primer)) zeroRead = Boolean((await sql`SELECT read_at FROM zero_answers WHERE world_id = ${w.id} AND gm_id = ${req.gm.id}`)[0]?.read_at);
    send(res, 200, {
      now,
      entries: rows.filter((r) => visibleTo(r, req)).map((r) => shape(r, req)),
      world: { id: w.id, slug: w.slug, name: w.name, tagline: w.tagline, about: w.about, calendar: w.calendar, public: w.public, cal: w.cal || null, discord: Boolean(w.discord_webhook), next_session: w.next_session || null, shown: w.shown || null,
        // null: first visit; missing: not a member row (the client remembers visits itself).
        ...(prevVisit !== undefined ? { prev_visit: prevVisit } : {}),
        custom_fields: req.isGmHere ? customOf(req) : customForPlayers(w.custom_fields),
        primer: w.primer && !primerEmpty(w.primer) ? { tone: cleanPrimer(w.primer).tone, updated_at: w.primer.updated_at || null } : null,
        ...(zeroRead !== undefined ? { zero_read: zeroRead } : {}),
        ...(favorites ? { favorites } : {}),
        ...(following ? { following } : {}),
        // Where the party is (from session prep), when this person can see that place.
        party_at: partyAt(w, rows, req),
        // Where the party has been: stops at places this person can see.
        journey: journeyFor(w.prep?.journey, (id) => { const r = byId.get(id); return r && !r.deleted && visibleTo(r, req); }),
        // Reading for next session: what this person can see of it, with who has read each (GMs) or whether they have.
        ...(req.role ? { reading: await readingOf(w, req, (id) => { const r = byId.get(id); return Boolean(r && !r.deleted && visibleTo(r, req)); }) } : {}),
        clock: readClock(w.clock), tag_notes: w.tag_notes || {}, tag_colors: w.tag_colors || {},
        // Start here: only what this person can see.
        start_here: (Array.isArray(w.start_here) ? w.start_here : []).filter((id) => { const r = rows.find((x) => x.id === id); return r && !r.deleted && visibleTo(r, req); }),
        ...(req.role ? { notices: activeNotices(w.notices), ask_unread: await askUnread(req) } : {}),
        // Who's coming to the next session (members, once it's set).
        ...(req.role && rsvpOpen(w.next_session) ? { rsvp: rsvpSummary(await sql`SELECT g.id, g.name, m.rsvp FROM members m JOIN gms g ON g.id = m.gm_id WHERE m.world_id = ${w.id}`, new Date(w.next_session).toISOString(), req.gm?.id) } : {}),
        // Table talk others posted since this member's last visit (just the times; the page counts what's unread).
        ...(req.role && req.gm && prevVisit ? { table_new: (await sql`SELECT c.created_at FROM comments c JOIN entries e ON e.id = c.entry_id
          WHERE e.world_id = ${w.id} AND NOT e.deleted AND c.audience = 'table' AND c.created_at > ${prevVisit} AND c.gm_id <> ${req.gm.id}
            AND (${req.isGmHere} OR (NOT c.hidden AND e.status = 'live' AND (e.visibility = 'all' OR e.owner_id = ${req.gm.id})))
          ORDER BY c.created_at DESC LIMIT 50`).map((r) => r.created_at) } : {}),
        // A line from the quote wall for the front page, a different one each load.
        ...(req.role ? { quote: (await sql`SELECT id, text, said_by, session_id FROM table_quotes WHERE world_id = ${w.id} AND NOT deleted ORDER BY random() LIMIT 1`)[0] || null } : {}),
        // Our next move: this member's pick, and for GMs everyone's.
        ...(req.role && req.gm ? { next_move: (await sql`SELECT next_move FROM members WHERE world_id = ${w.id} AND gm_id = ${req.gm.id}`)[0]?.next_move || null } : {}),
        ...(req.isGmHere ? { moves: await sql`SELECT g.name, m.next_move AS quest_id FROM members m JOIN gms g ON g.id = m.gm_id WHERE m.world_id = ${w.id} AND m.next_move IS NOT NULL` } : {}),
        ...(req.isGmHere ? { edits_open: (await sql`SELECT count(*)::int AS n FROM edit_suggestions WHERE world_id = ${w.id} AND status = 'open'`)[0].n } : {}),
        // Members' pronouns by person, to show beside their names.
        ...(req.role ? { pronouns: Object.fromEntries((await sql`SELECT gm_id, profile->>'pronouns' AS p FROM members WHERE world_id = ${w.id} AND profile->>'pronouns' <> ''`).map((r) => [r.gm_id, r.p])) } : {}),
        ...(req.isGmHere ? { templates: Array.isArray(w.templates) ? w.templates : [] } : {}) },
      role: req.role,
    });
  },

  async POST(req, res) {
    if (!requireMember(req, res)) return;
    if (req.body.suggest_edit) {
      const b = req.body.suggest_edit;
      const cur = await loadOne(String(b.entry_id || '').slice(0, 40), req.world.id);
      if (!cur || cur.deleted || !visibleTo(cur, req) || cur.status !== 'live') return fail(res, 404, 'That entry doesn’t exist.');
      const proposal = cleanProposal(cur, b, fieldsWith(cur.kind, customOf(req)));
      if (!Object.keys(proposal).length) return fail(res, 400, 'Nothing changed: edit something first.');
      const open = (await sql`SELECT count(*)::int AS n FROM edit_suggestions WHERE world_id = ${req.world.id} AND gm_id = ${req.gm.id} AND status = 'open'`)[0].n;
      if (open >= 30) return fail(res, 400, 'You have 30 suggestions waiting already. Give the GMs a moment.');
      const row = (await sql`INSERT INTO edit_suggestions (world_id, entry_id, gm_id, base_version, proposal, note)
        VALUES (${req.world.id}, ${cur.id}, ${req.gm.id}, ${cur.version}, ${JSON.stringify(proposal)}::jsonb, ${clip(b.note, 1000).trim()}) RETURNING id`)[0];
      return send(res, 201, { edit: { id: row.id, entry_id: cur.id, proposal, status: 'open' } });
    }
    if (req.body.mode === 'import') {
      if (!requireOwner(req, res)) return;
      const list = Array.isArray(req.body.entries) ? req.body.entries.slice(0, 5000) : [];
      let n = 0;
      for (const raw of list) {
        const e = clean(raw, customOf(req));
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
        const e = clean(raw, customOf(req));
        if (e.error) return fail(res, 400, `${raw?.name || 'An entry'}: ${e.error}`);
        made.push(shape(await loadOne(await insert(e, req), req.world.id), req));
      }
      return send(res, 201, { entries: made });
    }
    const e = clean(req.body.entry, customOf(req));
    if (e.error) return fail(res, 400, e.error);
    let id;
    if (req.isGmHere) id = await insert(e, req, { owner: req.body.entry?.owner_id ? Number(req.body.entry.owner_id) || null : null });
    else {
      // Players: their own characters and journals go live; anything else waits for a GM's approval.
      // Downtime can be kept between the player and the GMs; GM-only fields (its outcome) start empty.
      e.secret = ''; e.visibility = e.kind === 'downtime' && e.visibility === 'gm' ? 'gm' : 'all'; e.links = e.links.map((l) => ({ ...l, secret: false }));
      for (const k of [...gmOnlyFields(e.kind), ...secretCustomKeys(e.kind, customOf(req))]) delete e.fields[k];
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
    // A page the GMs opened to the party: anyone who can see it may change its text (summary, description, tags),
    // and nothing else.
    const partyPage = !req.isGmHere && !mine && current.fields?.party_edit === 'yes' && visibleTo(current, req);
    if (!req.isGmHere && !mine && !partyPage) return fail(res, 403, 'You can only edit your own characters, journals and suggestions.');
    const e = clean(req.body.entry, customOf(req));
    if (e.error) return fail(res, 400, e.error);
    if (partyPage) Object.assign(e, { kind: current.kind, name: current.name, fields: { ...(current.fields || {}) }, links: current.links || [], parent_id: current.parent_id, secret: current.secret, visibility: current.visibility });
    // Only GMs open or close a page to the party.
    if (!req.isGmHere) { if (current.fields?.party_edit) e.fields.party_edit = current.fields.party_edit; else delete e.fields.party_edit; }
    if (e.parent_id === id) return fail(res, 400, 'An entry can’t be inside itself.');
    if (!req.isGmHere && !partyPage) {
      if (current.status === 'live' && !PLAYER_KINDS.includes(e.kind)) return fail(res, 403, 'Players can’t change an entry into that kind.');
      e.secret = current.secret; e.links = e.links.map((l) => ({ ...l, secret: false }));
      e.visibility = e.kind === 'downtime' && current.kind === 'downtime' ? e.visibility : current.visibility;
      for (const k of [...gmOnlyFields(e.kind), ...secretCustomKeys(e.kind, customOf(req))]) { if (current.fields?.[k]) e.fields[k] = current.fields[k]; else delete e.fields[k]; }
    }
    // Values of the world's own fields that were taken off this kind stay put, in case the field comes back.
    const live = customKeys(e.kind, customOf(req));
    for (const [k, v] of Object.entries(current.fields || {})) if (isCustomKey(k) && !live.has(k) && e.kind === current.kind) e.fields[k] = v;
    const version = Number(req.body.entry?.version);
    const rows = await sql`UPDATE entries SET kind = ${e.kind}, name = ${e.name}, summary = ${e.summary}, body = ${e.body}, fields = ${JSON.stringify(e.fields)},
      secret = ${e.secret}, tags = ${e.tags}, links = ${JSON.stringify(e.links)}, parent_id = ${e.parent_id}, visibility = ${e.visibility},
      reveal_at = CASE WHEN ${e.visibility} = 'all' THEN NULL ELSE reveal_at END, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
      WHERE id = ${id} AND world_id = ${req.world.id} AND version = ${version} RETURNING id`;
    if (!rows.length) {
      return fail(res, 409, `${current.updated_by_name || 'Someone'} saved this entry while you were editing. Your changes are still in the form: copy anything you need, then reload to see theirs.`, { entry: shape(current, req) });
    }
    await record(id, req.gm.id, 'edit', e);
    send(res, 200, { entry: shape(await loadOne(id, req.world.id), req) });
  },

  async PATCH(req, res) {
    if (!requireMember(req, res)) return;
    if (req.body.merge) {
      if (!requireGm(req, res)) return;
      const from = await loadOne(String(req.body.merge.from || '').slice(0, 40), req.world.id), into = await loadOne(String(req.body.merge.into || '').slice(0, 40), req.world.id);
      if (!from || !into || from.deleted || into.deleted) return fail(res, 404, 'Pick two entries in this world.');
      if (from.id === into.id) return fail(res, 400, 'That’s the same entry.');
      const w = req.world.id;
      // The surviving entry.
      const m = mergedEntry(into, from);
      await sql`UPDATE entries SET summary = ${m.summary}, body = ${m.body}, secret = ${m.secret}, fields = ${JSON.stringify(m.fields)}, tags = ${m.tags}, links = ${JSON.stringify(m.links)},
        updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${into.id} AND world_id = ${w}`;
      // What was inside it, and every other entry's connections and [[mentions]].
      await sql`UPDATE entries SET parent_id = ${into.id}, updated_at = now(), version = version + 1 WHERE parent_id = ${from.id} AND world_id = ${w} AND id <> ${into.id}`;
      const others = await sql`SELECT id, summary, body, secret, links FROM entries WHERE world_id = ${w} AND id <> ${into.id} AND id <> ${from.id}
        AND (links::text LIKE ${`%"${from.id}"%`} OR summary ILIKE ${`%[[${from.name}%`} OR body ILIKE ${`%[[${from.name}%`} OR secret ILIKE ${`%[[${from.name}%`})`;
      for (const o of others) {
        await sql`UPDATE entries SET links = ${JSON.stringify(relinkLinks(o.links, from.id, into.id, o.id))}, summary = ${relinkText(o.summary, from.name, into.name)},
          body = ${relinkText(o.body, from.name, into.name)}, secret = ${relinkText(o.secret, from.name, into.name)}, updated_at = now(), version = version + 1 WHERE id = ${o.id}`;
      }
      // Talk, standing, clocks, suggested edits and maps about it.
      await sql`UPDATE comments SET entry_id = ${into.id} WHERE entry_id = ${from.id}`;
      await sql`UPDATE standing_log SET entry_id = ${into.id} WHERE entry_id = ${from.id} AND world_id = ${w}`;
      await sql`UPDATE clocks SET entry_id = ${into.id} WHERE entry_id = ${from.id} AND world_id = ${w}`;
      await sql`UPDATE edit_suggestions SET entry_id = ${into.id} WHERE entry_id = ${from.id} AND world_id = ${w}`;
      await sql`UPDATE maps SET entry_id = ${into.id} WHERE entry_id = ${from.id} AND world_id = ${w}`;
      for (const map of await sql`SELECT id, pins FROM maps WHERE world_id = ${w} AND pins::text LIKE ${`%"${from.id}"%`}`) {
        await sql`UPDATE maps SET pins = ${JSON.stringify((map.pins || []).map((p) => (p.entry_id === from.id ? { ...p, entry_id: into.id } : p)))}::jsonb WHERE id = ${map.id}`;
      }
      // The merged-away entry goes to the bin (it can be restored, though what moved stays moved).
      await sql`UPDATE entries SET deleted = true, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${from.id} AND world_id = ${w}`;
      await record(into.id, req.gm.id, 'merge', snapshot(await loadOne(into.id, w)));
      await record(from.id, req.gm.id, 'delete', null);
      return send(res, 200, { entry: shape(await loadOne(into.id, w), req), moved: others.length });
    }
    // Buy from a shop: {buy: {shop, character, item, qty, base}} — a player for their own character (or a GM for any):
    // the coin comes off the character, the item goes into their inventory, and the shop's stock goes down.
    if (req.body.buy) {
      const b = req.body.buy;
      const shop = await loadOne(String(b.shop || '').slice(0, 40), req.world.id), ch = await loadOne(String(b.character || '').slice(0, 40), req.world.id);
      if (!shop || shop.deleted || !visibleTo(shop, req) || !shop.fields?.stock) return fail(res, 404, 'That shop isn’t open.');
      if (!ch || ch.deleted || ch.kind !== 'character') return fail(res, 404, 'Pick a character.');
      if (!req.isGmHere && ch.owner_id !== req.gm.id) return fail(res, 403, 'You can only buy for your own character.');
      const r = buyFrom(shop.fields.stock, clip(b.item, 200), b.qty);
      if (r.error) return fail(res, 400, r.error);
      let p = {}; try { p = JSON.parse(ch.fields?.play || '{}') || {}; } catch { p = {}; }
      if (!Number.isFinite(p.cp)) p.cp = Math.max(0, Math.round(Number(b.base?.cp) || 0));
      if (p.inventory === undefined) p.inventory = clip(b.base?.inventory, 15000);
      if (r.cp > p.cp) return fail(res, 400, `${ch.name} doesn’t have enough coin: that costs ${coinText(r.cp)} and they have ${coinText(p.cp)}.`);
      // The shelf first, and only if nobody else bought from it meanwhile.
      const sold = await sql`UPDATE entries SET fields = fields || jsonb_build_object('stock', ${r.text}::text), updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
        WHERE id = ${shop.id} AND world_id = ${req.world.id} AND version = ${shop.version} RETURNING id`;
      if (!sold.length) return fail(res, 409, 'Someone else was buying from this shop at the same moment. Try again.');
      p.cp -= r.cp; p.inventory = clip(giveItem(p.inventory, r.name, r.qty, shop.name), 15000);
      await sql`UPDATE entries SET fields = fields || jsonb_build_object('play', ${JSON.stringify(p)}::text), updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
        WHERE id = ${ch.id} AND world_id = ${req.world.id}`;
      await record(ch.id, req.gm.id, 'buy', null);
      await record(shop.id, req.gm.id, 'sale', null);
      return send(res, 200, { entries: [shape(await loadOne(shop.id, req.world.id), req), shape(await loadOne(ch.id, req.world.id), req)], bought: { name: r.name, qty: r.qty, cp: r.cp } });
    }
    // Sell to a shop: {sell: {shop, character, item, qty, base}} — the item leaves the character's inventory, the shop
    // pays its buy-back rate onto their sheet, and the item goes on the shelf.
    if (req.body.sell) {
      const b = req.body.sell;
      const shop = await loadOne(String(b.shop || '').slice(0, 40), req.world.id), ch = await loadOne(String(b.character || '').slice(0, 40), req.world.id);
      if (!shop || shop.deleted || !visibleTo(shop, req) || !shop.fields?.stock) return fail(res, 404, 'That shop isn’t open.');
      if (!ch || ch.deleted || ch.kind !== 'character') return fail(res, 404, 'Pick a character.');
      if (!req.isGmHere && ch.owner_id !== req.gm.id) return fail(res, 403, 'You can only sell your own character’s things.');
      let p = {}; try { p = JSON.parse(ch.fields?.play || '{}') || {}; } catch { p = {}; }
      if (!Number.isFinite(p.cp)) p.cp = Math.max(0, Math.round(Number(b.base?.cp) || 0));
      if (p.inventory === undefined) p.inventory = clip(b.base?.inventory, 15000);
      const t = takeItem(p.inventory, clip(b.item, 200), Number(b.qty) || 1);
      if (t.error) return fail(res, 400, t.error);
      const r = sellTo(shop.fields.stock, t.name, t.qty, GOODS);
      if (r.error) return fail(res, 400, r.error);
      const done = await sql`UPDATE entries SET fields = fields || jsonb_build_object('stock', ${clip(r.text, LIMITS.body)}::text), updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
        WHERE id = ${shop.id} AND world_id = ${req.world.id} AND version = ${shop.version} RETURNING id`;
      if (!done.length) return fail(res, 409, 'Someone else was at this shop’s counter at the same moment. Try again.');
      p.inventory = t.text; p.cp += r.cp;
      await sql`UPDATE entries SET fields = fields || jsonb_build_object('play', ${JSON.stringify(p)}::text), updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
        WHERE id = ${ch.id} AND world_id = ${req.world.id}`;
      await record(ch.id, req.gm.id, 'sell', null);
      await record(shop.id, req.gm.id, 'bought', null);
      return send(res, 200, { entries: [shape(await loadOne(shop.id, req.world.id), req), shape(await loadOne(ch.id, req.world.id), req)], sold: { name: r.name, qty: r.qty, cp: r.cp } });
    }
    if (req.body.give) {
      const g = req.body.give;
      const from = await loadOne(String(g.from || '').slice(0, 40), req.world.id), to = await loadOne(String(g.to || '').slice(0, 40), req.world.id);
      if (!from || from.deleted || from.kind !== 'character' || !to || to.deleted || to.kind !== 'character' || to.status !== 'live' || from.id === to.id) return fail(res, 404, 'Pick two characters in this world.');
      if (!req.isGmHere && from.owner_id !== req.gm.id) return fail(res, 403, 'You can only give from your own character.');
      const playOf = (row, base) => {
        let p = {}; try { p = JSON.parse(row.fields?.play || '{}') || {}; } catch { p = {}; }
        if (!Number.isFinite(p.cp)) p.cp = Math.max(0, Math.round(Number(base?.cp) || 0));
        if (p.inventory === undefined) p.inventory = clip(base?.inventory, 15000);
        return p;
      };
      const fp = playOf(from, g.from_base), tp = playOf(to, g.to_base);
      const cp = Math.max(0, Math.round(Number(g.cp) || 0));
      if (!cp && !String(g.item || '').trim()) return fail(res, 400, 'Choose an item or some coin to give.');
      if (cp > fp.cp) return fail(res, 400, `${from.name} doesn’t have that much coin.`);
      let moved = null;
      if (String(g.item || '').trim()) {
        const t = takeItem(fp.inventory, clip(g.item, 200), Number(g.qty) || 1);
        if (t.error) return fail(res, 400, t.error);
        fp.inventory = t.text; tp.inventory = clip(giveItem(tp.inventory, t.name, t.qty, from.name), 15000); moved = t;
      }
      fp.cp -= cp; tp.cp += cp;
      for (const [row, p] of [[from, fp], [to, tp]]) {
        await sql`UPDATE entries SET fields = fields || jsonb_build_object('play', ${JSON.stringify(p)}::text), updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
          WHERE id = ${row.id} AND world_id = ${req.world.id}`;
        await record(row.id, req.gm.id, 'give', null);
      }
      return send(res, 200, { entries: [shape(await loadOne(from.id, req.world.id), req), shape(await loadOne(to.id, req.world.id), req)], moved, cp });
    }
    if (req.body.edit_id !== undefined) {
      if (!requireGm(req, res)) return;
      const s = (await sql`SELECT * FROM edit_suggestions WHERE id = ${Number(req.body.edit_id)} AND world_id = ${req.world.id}`)[0];
      if (!s || s.status !== 'open') return fail(res, 404, 'That suggestion was already handled.');
      if (req.body.decision === 'accept') {
        const cur = await loadOne(s.entry_id, req.world.id);
        if (!cur || cur.deleted) return fail(res, 404, 'That entry was deleted.');
        const next = applyProposal(cur, s.proposal);
        await sql`UPDATE entries SET summary = ${next.summary}, body = ${next.body}, fields = ${JSON.stringify(next.fields)}, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
          WHERE id = ${cur.id} AND world_id = ${req.world.id}`;
        const after = await loadOne(cur.id, req.world.id);
        await record(cur.id, req.gm.id, 'edit', snapshot(after));
        await sql`UPDATE edit_suggestions SET status = 'accepted', decided_by = ${req.gm.id}, decided_at = now() WHERE id = ${s.id}`;
        return send(res, 200, { entry: shape(after, req), status: 'accepted' });
      }
      await sql`UPDATE edit_suggestions SET status = 'declined', decided_by = ${req.gm.id}, decided_at = now() WHERE id = ${s.id}`;
      return send(res, 200, { status: 'declined' });
    }
    if (req.body?.rename_tag) {
      if (!requireGm(req, res)) return;
      const from = cleanTag(req.body.rename_tag.from), to = cleanTag(req.body.rename_tag.to);
      if (!from || !to) return fail(res, 400, 'Type the new name for the tag.');
      if (from === to) return fail(res, 400, 'That’s the same name.');
      // Into a tag an entry already has: just drop the old one (no doubles).
      const rows = await sql`UPDATE entries SET tags = CASE WHEN ${to} = ANY(tags) THEN array_remove(tags, ${from}) ELSE array_replace(tags, ${from}, ${to}) END,
          updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
        WHERE world_id = ${req.world.id} AND NOT deleted AND ${from} = ANY(tags) RETURNING id`;
      const changed = rows.length ? await Promise.all(rows.map((r) => loadOne(r.id, req.world.id))) : [];
      for (const e of changed) await record(e.id, req.gm.id, 'edit', snapshot(e));
      return send(res, 200, { entries: changed.map((e) => shape(e, req)), renamed: changed.length });
    }
    // Bulk changes (GMs): {ids: [...]} with one of visibility ('all' | 'gm'), add_tag, remove_tag, or move_to (a place's
    // id, or null to take them out of any place). Suggestions stay suggestions.
    if (Array.isArray(req.body?.ids)) {
      if (!requireGm(req, res)) return;
      const ids = [...new Set(req.body.ids.map((x) => String(x).slice(0, 40)))].slice(0, 300);
      const b = req.body;
      if (b.set_field) {
        const key = String(b.set_field.key || '').slice(0, 40);
        // Only the kinds actually selected that have this field.
        const picked = (await sql`SELECT DISTINCT kind FROM entries WHERE world_id = ${req.world.id} AND id = ANY(${ids}) AND NOT deleted`).map((r) => r.kind);
        const kinds = picked.filter((k) => setFieldValue(k, key, '').ok);
        if (!kinds.length) return fail(res, 400, 'That field can’t be set for many at once.');
        const checks = kinds.map((k) => setFieldValue(k, key, b.set_field.value));
        const bad = checks.find((c) => c.error);
        if (bad) return fail(res, 400, bad.error);
        const value = checks[0].value;
        const rows = await sql`UPDATE entries SET fields = CASE WHEN ${value} = '' THEN COALESCE(fields, '{}'::jsonb) - ${key}::text ELSE jsonb_set(COALESCE(fields, '{}'::jsonb), ARRAY[${key}]::text[], to_jsonb(${value}::text)) END,
            updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
          WHERE world_id = ${req.world.id} AND id = ANY(${ids}) AND NOT deleted AND kind = ANY(${kinds}) AND COALESCE(fields ->> ${key}, '') <> ${value} RETURNING id`;
        const changed = rows.length ? await Promise.all(rows.map((r) => loadOne(r.id, req.world.id))) : [];
        for (const e of changed) await record(e.id, req.gm.id, 'edit', snapshot(e));
        return send(res, 200, { entries: changed.map((e) => shape(e, req)), skipped: ids.length - changed.length });
      }
      if ('add_tag' in b || 'remove_tag' in b || 'move_to' in b) {
        let rows;
        if ('move_to' in b) {
          const to = b.move_to ? String(b.move_to).slice(0, 40) : null;
          let chain = new Set();
          if (to) {
            const place = await loadOne(to, req.world.id);
            if (!place || place.deleted || !PLACE_KINDS.includes(place.kind)) return fail(res, 400, 'Pick a region, area, settlement or location to move them into.');
            const all = await sql`SELECT id, parent_id FROM entries WHERE world_id = ${req.world.id}`;
            const up = new Map(all.map((r) => [r.id, r.parent_id]));
            chain = chainUp((id) => up.get(id) || null, to);
          }
          const can = ids.filter((id) => !chain.has(id));
          rows = can.length ? await sql`UPDATE entries SET parent_id = ${to}, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
            WHERE world_id = ${req.world.id} AND id = ANY(${can}) AND NOT deleted AND parent_id IS DISTINCT FROM ${to} RETURNING id` : [];
        } else if ('add_tag' in b) {
          const tag = cleanTag(b.add_tag);
          if (!tag) return fail(res, 400, 'Type a tag.');
          rows = await sql`UPDATE entries SET tags = array_append(tags, ${tag}), updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
            WHERE world_id = ${req.world.id} AND id = ANY(${ids}) AND NOT deleted AND NOT (${tag} = ANY(tags)) AND cardinality(tags) < ${LIMITS.tags} RETURNING id`;
        } else {
          const tag = cleanTag(b.remove_tag);
          rows = await sql`UPDATE entries SET tags = array_remove(tags, ${tag}), updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
            WHERE world_id = ${req.world.id} AND id = ANY(${ids}) AND NOT deleted AND ${tag} = ANY(tags) RETURNING id`;
        }
        const changed = rows.length ? await Promise.all(rows.map((r) => loadOne(r.id, req.world.id))) : [];
        for (const e of changed) await record(e.id, req.gm.id, 'edit', snapshot(e));
        return send(res, 200, { entries: changed.map((e) => shape(e, req)), skipped: ids.length - changed.length });
      }
      const vis = b.visibility === 'gm' ? 'gm' : 'all';
      const rows = await sql`UPDATE entries SET visibility = ${vis}, reveal_at = NULL, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1
        WHERE world_id = ${req.world.id} AND id = ANY(${ids}) AND NOT deleted AND visibility <> ${vis} RETURNING id`;
      for (const r of rows) await record(r.id, req.gm.id, vis === 'all' ? 'reveal' : 'hide', null);
      const changed = rows.length ? await Promise.all(rows.map((r) => loadOne(r.id, req.world.id))) : [];
      return send(res, 200, { entries: changed.map((e) => shape(e, req)) });
    }
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
    if (Array.isArray(req.body.share)) {
      const want = cleanShare(req.body.share);
      const members = new Set((await sql`SELECT gm_id FROM members WHERE world_id = ${req.world.id}`).map((m) => m.gm_id));
      const ids = want.filter((x) => members.has(x));
      await sql`UPDATE entries SET shared_with = ${ids.length ? JSON.stringify(ids) : null}::jsonb, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${id} AND world_id = ${req.world.id}`;
      await record(id, req.gm.id, ids.length ? 'share' : 'unshare', null);
      return send(res, 200, { entry: shape(await loadOne(id, req.world.id), req) });
    }
    // {id, reveal_at}: set (or clear, with null) the day a hidden entry reveals itself.
    if (req.body.reveal_at !== undefined) {
      const r = cleanRevealAt(req.body.reveal_at);
      if (r.error) return fail(res, 400, r.error);
      if (r.at && (current.visibility !== 'gm' || current.status !== 'live')) return fail(res, 400, 'Only a hidden entry can be revealed later.');
      await sql`UPDATE entries SET reveal_at = ${r.at}, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${id} AND world_id = ${req.world.id}`;
      return send(res, 200, { entry: shape(await loadOne(id, req.world.id), req) });
    }
    const vis = visibility === 'gm' || visibility === 'all' ? visibility : current.visibility;
    const st = status === 'live' || status === 'suggested' ? status : current.status;
    await sql`UPDATE entries SET visibility = ${vis}, status = ${st}, reveal_at = NULL, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${id} AND world_id = ${req.world.id}`;
    await record(id, req.gm.id, st !== current.status ? (st === 'live' ? 'approve' : 'unapprove') : vis === 'all' ? 'reveal' : 'hide', null);
    send(res, 200, { entry: shape(await loadOne(id, req.world.id), req) });
  },

  async DELETE(req, res) {
    if (!requireMember(req, res)) return;
    const { id, restore } = req.query || {};
    const current = id && await loadOne(id, req.world.id);
    if (!current) return fail(res, 404, 'That entry doesn’t exist.');
    // Players delete (and undo deleting) only their own entries.
    if (!req.isGmHere && current.owner_id !== req.gm.id) return fail(res, 403, 'You can only delete your own entries.');
    await sql`UPDATE entries SET deleted = ${!restore}, updated_by = ${req.gm.id}, updated_at = now(), version = version + 1 WHERE id = ${id} AND world_id = ${req.world.id}`;
    await record(id, req.gm.id, restore ? 'restore' : current.status === 'suggested' && req.isGmHere && current.owner_id !== req.gm.id ? 'reject' : 'delete', null);
    send(res, 200, { ok: true });
  },
}, { world: true });
