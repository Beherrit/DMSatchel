// Talks to the API, keeps track of who is signed in, their worlds and which world is open.
// The open world lives in the URL (?w=<slug>) so links can be shared, and in this browser as a fallback.

export const session = { gm: null, worlds: [], configured: null, locked: false, worldKey: null, worldInfo: null, listeners: new Set() };
const notify = () => session.listeners.forEach((fn) => fn(session));
export const onSession = (fn) => { session.listeners.add(fn); return () => session.listeners.delete(fn); };

const WORLD_SCOPED = new Set(['entries', 'maps', 'standings', 'comments', 'activity', 'settings', 'party', 'images']);
const LS_WORLD = 'dm-satchel-world';

function initialWorldKey() {
  const fromUrl = new URLSearchParams(location.search).get('w');
  if (fromUrl) return fromUrl;
  try { return localStorage.getItem(LS_WORLD) || null; } catch { return null; }
}
session.worldKey = initialWorldKey();

export const currentWorld = () => session.worlds.find((w) => w.slug === session.worldKey || w.id === session.worldKey) || null;
// Your role in the open world: owner, gm, player, or null (a visitor to a public world).
export const worldRole = () => currentWorld()?.role || (session.gm?.role === 'admin' ? 'owner' : null);
export const isGm = () => ['owner', 'gm'].includes(worldRole());
export const isOwner = () => worldRole() === 'owner';
export const isPlayer = () => worldRole() === 'player';
export const isMember = () => Boolean(worldRole());
export const isAdmin = () => session.gm?.role === 'admin';
export const signedIn = () => Boolean(session.gm);

export function setWorld(key, { silent } = {}) {
  session.worldKey = key || null;
  try { if (key) localStorage.setItem(LS_WORLD, key); else localStorage.removeItem(LS_WORLD); } catch { /* fine */ }
  const url = new URL(location.href);
  if (key) url.searchParams.set('w', key); else url.searchParams.delete('w');
  history.replaceState(null, '', url);
  if (!silent) notify();
}

export class ApiError extends Error {
  constructor(message, status, body) { super(message); this.status = status; this.body = body; }
}

export async function api(path, { method = 'GET', body, query } = {}) {
  const q = { ...(query || {}) };
  if (WORLD_SCOPED.has(path) && session.worldKey && !q.world) q.world = session.worldKey;
  const qs = Object.keys(q).length ? `?${new URLSearchParams(Object.entries(q).filter(([, v]) => v != null && v !== ''))}` : '';
  let res;
  try {
    res = await fetch(`/api/${path}${qs}`, {
      method, credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Couldn’t reach the server. Check your connection and try again.', 0);
  }
  let data = null;
  try { data = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) {
    if (data?.code === 'not_configured') { session.configured = false; notify(); }
    if (data?.code === 'site_locked' && !session.locked) { session.locked = true; session.gm = null; notify(); }
    throw new ApiError(data?.error || (res.status === 404 ? 'The world server isn’t running here.' : `Request failed (${res.status}).`), res.status, data);
  }
  return data;
}

function adopt(r) {
  session.gm = r.gm || null; session.worlds = r.worlds || []; session.configured = true;
  if (typeof r.locked === 'boolean') session.locked = r.locked;
  // Open the world in the URL, or the last one used, or your first world.
  if (!session.worldKey || (!currentWorld() && session.gm && session.worlds.length && !new URLSearchParams(location.search).get('w'))) {
    const first = session.worlds[0];
    if (first) setWorld(first.slug, { silent: true });
  }
}

// Resolves once the first session check has finished, so pages that depend on it can wait.
let markReady;
export const sessionReady = new Promise((r) => { markReady = r; });

export async function loadSession() {
  try { adopt(await api('session')); }
  catch (e) {
    session.gm = null;
    session.configured = e.status === 503 ? false : e.status === 404 || e.status === 0 ? 'offline' : session.configured;
  }
  notify(); markReady();
  return session;
}

export async function signIn(code) {
  const r = await api('session', { method: 'POST', body: { code } });
  adopt(r); notify();
  return r.gm;
}

export async function joinWorld(invite, name) {
  const r = await api('session', { method: 'POST', body: { invite, name } });
  adopt(r); setWorld(r.world.slug, { silent: true }); notify();
  return r;
}

export async function signOut() {
  try { await api('session', { method: 'DELETE' }); } finally { session.gm = null; session.worlds = []; notify(); }
}

export async function refreshWorlds() {
  try { const r = await api('session'); adopt(r); notify(); } catch { /* keep what we have */ }
}
