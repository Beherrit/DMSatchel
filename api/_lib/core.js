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

// Wraps a handler: checks configuration, prepares the schema, parses JSON and catches errors.
export function route(handlers) {
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
      return await h(req, res);
    } catch (e) {
      console.error(e);
      return fail(res, 500, 'Something went wrong on the server. Try again in a moment.');
    }
  };
}

export const requireGm = (req, res) => (req.gm ? true : (fail(res, 401, 'Sign in as a GM to do that.'), false));
export const requireAdmin = (req, res) => (req.gm?.role === 'admin' ? true : (fail(res, 403, 'Only the admin can do that.'), false));
