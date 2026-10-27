// Shared server code for the world API: database, sessions and request helpers.
// Files under api/_lib are not exposed as routes.

import { neon } from '@neondatabase/serverless';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
export const configured = () => Boolean(DB_URL && process.env.ADMIN_CODE);
export const sql = DB_URL ? neon(DB_URL) : null;

let schemaReady = null;
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS gms (
        id serial PRIMARY KEY, name text NOT NULL, role text NOT NULL DEFAULT 'gm', code_hash text UNIQUE NOT NULL,
        disabled boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), last_seen timestamptz)`;
      await sql`CREATE TABLE IF NOT EXISTS sessions (
        token_hash text PRIMARY KEY, gm_id int NOT NULL REFERENCES gms(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS entries (
        id text PRIMARY KEY, kind text NOT NULL, name text NOT NULL, summary text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '',
        fields jsonb NOT NULL DEFAULT '{}', secret text NOT NULL DEFAULT '', tags text[] NOT NULL DEFAULT '{}', links jsonb NOT NULL DEFAULT '[]',
        parent_id text, created_by int, updated_by int, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        version int NOT NULL DEFAULT 1, deleted boolean NOT NULL DEFAULT false)`;
      await sql`CREATE INDEX IF NOT EXISTS entries_kind_idx ON entries (kind) WHERE NOT deleted`;
      await sql`CREATE TABLE IF NOT EXISTS history (
        id serial PRIMARY KEY, entry_id text NOT NULL, gm_id int, action text NOT NULL, snapshot jsonb, at timestamptz NOT NULL DEFAULT now())`;
      await sql`CREATE INDEX IF NOT EXISTS history_entry_idx ON history (entry_id, at DESC)`;
      await sql`CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value jsonb NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS maps (
        id text PRIMARY KEY, name text NOT NULL, image text NOT NULL, width int NOT NULL DEFAULT 0, height int NOT NULL DEFAULT 0,
        pins jsonb NOT NULL DEFAULT '[]', entry_id text, secret boolean NOT NULL DEFAULT false, created_by int, updated_by int,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version int NOT NULL DEFAULT 1, deleted boolean NOT NULL DEFAULT false)`;
      await sql`CREATE TABLE IF NOT EXISTS standing_log (
        id serial PRIMARY KEY, entry_id text NOT NULL, value int NOT NULL, delta int NOT NULL DEFAULT 0, reason text NOT NULL DEFAULT '',
        session_id text, secret boolean NOT NULL DEFAULT false, gm_id int, at timestamptz NOT NULL DEFAULT now())`;
      await sql`CREATE INDEX IF NOT EXISTS standing_entry_idx ON standing_log (entry_id, at DESC)`;
      await sql`CREATE TABLE IF NOT EXISTS comments (
        id serial PRIMARY KEY, entry_id text NOT NULL, parent_id int, gm_id int, body text NOT NULL, resolved boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(), edited_at timestamptz)`;
      await sql`CREATE INDEX IF NOT EXISTS comments_entry_idx ON comments (entry_id, created_at)`;
      // Multiple worlds and per-world roles (added later; every step is additive and safe to repeat).
      await sql`CREATE TABLE IF NOT EXISTS worlds (
        id text PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL, tagline text NOT NULL DEFAULT '', about text NOT NULL DEFAULT '',
        calendar text NOT NULL DEFAULT '', public boolean NOT NULL DEFAULT false, gm_invite text, player_invite text,
        created_by int, created_at timestamptz NOT NULL DEFAULT now(), archived boolean NOT NULL DEFAULT false)`;
      await sql`CREATE TABLE IF NOT EXISTS members (
        world_id text NOT NULL, gm_id int NOT NULL REFERENCES gms(id) ON DELETE CASCADE, role text NOT NULL,
        joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (world_id, gm_id))`;
      await sql`ALTER TABLE entries ADD COLUMN IF NOT EXISTS world_id text`;
      await sql`ALTER TABLE entries ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'all'`;
      await sql`ALTER TABLE entries ADD COLUMN IF NOT EXISTS owner_id int`;
      await sql`ALTER TABLE entries ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'live'`;
      await sql`ALTER TABLE maps ADD COLUMN IF NOT EXISTS world_id text`;
      await sql`ALTER TABLE standing_log ADD COLUMN IF NOT EXISTS world_id text`;
      await sql`CREATE INDEX IF NOT EXISTS entries_world_idx ON entries (world_id) WHERE NOT deleted`;
      // The world that existed before worlds did: keep its name and everything in it, readable by anyone as before.
      const old = (await sql`SELECT value FROM settings WHERE key = 'world'`)[0]?.value || {};
      await sql`INSERT INTO worlds (id, slug, name, tagline, about, calendar, public, gm_invite, player_invite)
        VALUES ('default', 'world-1', ${old.name || 'World 1'}, ${old.tagline || ''}, ${old.about || ''}, ${old.calendar || ''}, true, ${newCode()}, ${newCode()})
        ON CONFLICT (id) DO NOTHING`;
      await sql`UPDATE entries SET world_id = 'default' WHERE world_id IS NULL`;
      await sql`UPDATE maps SET world_id = 'default' WHERE world_id IS NULL`;
      await sql`UPDATE standing_log s SET world_id = COALESCE((SELECT e.world_id FROM entries e WHERE e.id = s.entry_id), 'default') WHERE s.world_id IS NULL`;
      // A structured in-world calendar and today's date (see js/calendar.js).
      await sql`ALTER TABLE worlds ADD COLUMN IF NOT EXISTS cal jsonb`;
      // Progress clocks on factions and other entries (filled between sessions).
      await sql`CREATE TABLE IF NOT EXISTS clocks (
        id serial PRIMARY KEY, world_id text NOT NULL, entry_id text NOT NULL, name text NOT NULL, size int NOT NULL DEFAULT 6, filled int NOT NULL DEFAULT 0,
        per_turn int NOT NULL DEFAULT 0, secret boolean NOT NULL DEFAULT false, note text NOT NULL DEFAULT '', created_by int, updated_at timestamptz NOT NULL DEFAULT now(), deleted boolean NOT NULL DEFAULT false)`;
      // A map's scale: how many miles its full width covers (for travel times between pins).
      await sql`ALTER TABLE maps ADD COLUMN IF NOT EXISTS miles real`;
      // The party's treasury: coins and items in and out.
      await sql`CREATE TABLE IF NOT EXISTS party_ledger (
        id serial PRIMARY KEY, world_id text NOT NULL, at timestamptz NOT NULL DEFAULT now(), gm_id int, cp bigint NOT NULL DEFAULT 0,
        item text NOT NULL DEFAULT '', qty int NOT NULL DEFAULT 0, holder text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '',
        session_id text, deleted boolean NOT NULL DEFAULT false)`;
      // Pictures for entries (portraits, places, items, handouts), stored as data URLs like map images.
      await sql`CREATE TABLE IF NOT EXISTS images (
        id text PRIMARY KEY, world_id text NOT NULL, data text NOT NULL, width int NOT NULL DEFAULT 0, height int NOT NULL DEFAULT 0,
        created_by int, created_at timestamptz NOT NULL DEFAULT now())`;
      await sql`CREATE INDEX IF NOT EXISTS party_ledger_world_idx ON party_ledger (world_id, at DESC)`;
      await sql`INSERT INTO members (world_id, gm_id, role) SELECT 'default', id, CASE WHEN role = 'admin' THEN 'owner' ELSE 'gm' END FROM gms
        WHERE NOT EXISTS (SELECT 1 FROM members m WHERE m.world_id = 'default') ON CONFLICT DO NOTHING`;
    })().catch((e) => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

export const hash = (s) => createHash('sha256').update(String(s)).digest('hex');
export const newCode = () => randomBytes(9).toString('base64url').replace(/[-_]/g, 'x').slice(0, 12).toUpperCase().replace(/(.{4})(?=.)/g, '$1-');
export const newId = () => randomBytes(8).toString('hex');
const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function codeMatchesAdmin(code) {
  const a = Buffer.from(normCode(code)), b = Buffer.from(normCode(process.env.ADMIN_CODE));
  return b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}
export const codeHash = (code) => hash(`gm:${normCode(code)}`);

const COOKIE = 'dms_session';
const MAX_AGE = 60 * 60 * 24 * 60;

export async function createSession(res, gmId) {
  const token = randomBytes(32).toString('base64url');
  await sql`DELETE FROM sessions WHERE expires_at < now()`;
  await sql`INSERT INTO sessions (token_hash, gm_id, expires_at) VALUES (${hash(token)}, ${gmId}, now() + interval '60 days')`;
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function readCookie(req) {
  const raw = req.headers.cookie || '';
  const m = raw.split(/;\s*/).find((p) => p.startsWith(`${COOKIE}=`));
  return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : null;
}

// The signed-in GM for this request, or null.
export async function currentGm(req) {
  const token = readCookie(req);
  if (!token || !sql) return null;
  const rows = await sql`SELECT g.id, g.name, g.role FROM sessions s JOIN gms g ON g.id = s.gm_id
    WHERE s.token_hash = ${hash(token)} AND s.expires_at > now() AND NOT g.disabled`;
  if (!rows.length) return null;
  try { await sql`UPDATE gms SET last_seen = now() WHERE id = ${rows[0].id} AND (last_seen IS NULL OR last_seen < now() - interval '5 minutes')`; } catch { /* not important */ }
  return rows[0];
}

export async function logout(req) {
  const token = readCookie(req);
  if (token) await sql`DELETE FROM sessions WHERE token_hash = ${hash(token)}`;
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
export const fail = (res, status, message, extra = {}) => send(res, status, { error: message, ...extra });

// Which world a request is about (?world=<id or slug>), and the signed-in person's role in it.
// Site admins act as owners everywhere. Public worlds can be read by anyone.
export async function worldContext(req) {
  const key = String(req.query?.world || '').slice(0, 80);
  let w = null;
  if (key) w = (await sql`SELECT * FROM worlds WHERE (id = ${key} OR slug = ${key}) AND NOT archived`)[0];
  if (!w && req.gm) w = (await sql`SELECT w.* FROM worlds w JOIN members m ON m.world_id = w.id WHERE m.gm_id = ${req.gm.id} AND NOT w.archived ORDER BY m.joined_at LIMIT 1`)[0];
  if (!w) w = (await sql`SELECT * FROM worlds WHERE id = 'default' AND NOT archived`)[0];
  req.world = w || null;
  let role = null;
  if (w && req.gm) role = req.gm.role === 'admin' ? 'owner' : (await sql`SELECT role FROM members WHERE world_id = ${w.id} AND gm_id = ${req.gm.id}`)[0]?.role || null;
  req.role = role;
  req.isGmHere = role === 'owner' || role === 'gm';
  req.canRead = Boolean(w && (role || w.public));
}

// Wraps a handler: checks configuration, prepares the schema, parses JSON and catches errors.
// With { world: true } the request also gets req.world, req.role, req.isGmHere and req.canRead.
export function route(handlers, opts = {}) {
  return async (req, res) => {
    try {
      if (!configured()) return fail(res, 503, 'The world database is not connected yet. Add Neon Postgres and ADMIN_CODE in the Vercel project settings.', { code: 'not_configured' });
      await ensureSchema();
      const h = handlers[req.method];
      if (!h) return fail(res, 405, 'Method not allowed');
      if (typeof req.body === 'string' && req.body) { try { req.body = JSON.parse(req.body); } catch { return fail(res, 400, 'Request body is not valid JSON'); } }
      req.body = req.body || {};
      if (req.method !== 'GET') {
        // Same-origin check for writes: browsers send Origin on POST/PUT/PATCH/DELETE.
        const origin = req.headers.origin;
        let host = null;
        try { host = origin ? new URL(origin).host : req.headers.host; } catch { /* malformed Origin */ }
        if (host !== req.headers.host) return fail(res, 403, 'Cross-site requests are not allowed');
      }
      req.gm = await currentGm(req);
      if (opts.world) {
        await worldContext(req);
        if (!req.world) return fail(res, 404, 'That world doesn’t exist, or it was archived.', { code: 'no_world' });
        if (!req.canRead) return fail(res, req.gm ? 403 : 401, req.gm ? 'You’re not a member of this world. Ask its owner for an invite link.' : 'This world is private. Sign in, or open an invite link from its owner.', { code: 'no_access' });
      }
      return await h(req, res);
    } catch (e) {
      console.error(e);
      return fail(res, 500, 'Something went wrong on the server. Try again in a moment.');
    }
  };
}

// requireGm: a GM (or owner) of the request's world. requireMember: any role in it. requireOwner: its owner.
export const requireGm = (req, res) => (req.isGmHere ? true : (fail(res, req.gm ? 403 : 401, req.gm ? 'Only this world’s GMs can do that.' : 'Sign in as a GM to do that.'), false));
export const requireMember = (req, res) => (req.role ? true : (fail(res, req.gm ? 403 : 401, req.gm ? 'Join this world first (ask for an invite link).' : 'Sign in first.'), false));
export const requireOwner = (req, res) => (req.role === 'owner' ? true : (fail(res, 403, 'Only this world’s owner can do that.'), false));
export const requireAdmin = (req, res) => (req.gm?.role === 'admin' ? true : (fail(res, 403, 'Only the site admin can do that.'), false));
export const requireSignedIn = (req, res) => (req.gm ? true : (fail(res, 401, 'Sign in first.'), false));

export function slugify(name) {
  return String(name).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 40) || 'world';
}

// The worlds a person belongs to, with their role in each (site admins see every world).
export async function myWorlds(gm) {
  if (!gm) return [];
  if (gm.role === 'admin') {
    return sql`SELECT w.id, w.slug, w.name, w.tagline, w.public, COALESCE(m.role, 'owner') AS role FROM worlds w
      LEFT JOIN members m ON m.world_id = w.id AND m.gm_id = ${gm.id} WHERE NOT w.archived ORDER BY w.created_at`;
  }
  return sql`SELECT w.id, w.slug, w.name, w.tagline, w.public, m.role FROM worlds w JOIN members m ON m.world_id = w.id
    WHERE m.gm_id = ${gm.id} AND NOT w.archived ORDER BY m.joined_at`;
}
