// Talks to the world API and keeps track of who is signed in.

export const session = { gm: null, configured: null, listeners: new Set() };
const notify = () => session.listeners.forEach((fn) => fn(session));
export const onSession = (fn) => { session.listeners.add(fn); return () => session.listeners.delete(fn); };
export const isGm = () => Boolean(session.gm);
export const isAdmin = () => session.gm?.role === 'admin';

export class ApiError extends Error {
  constructor(message, status, body) { super(message); this.status = status; this.body = body; }
}

export async function api(path, { method = 'GET', body, query } = {}) {
  const qs = query ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== ''))}` : '';
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
    throw new ApiError(data?.error || (res.status === 404 ? 'The world server isn’t running here.' : `Request failed (${res.status}).`), res.status, data);
  }
  return data;
}

export async function loadSession() {
  try {
    const r = await api('session');
    session.gm = r.gm; session.configured = true;
  } catch (e) {
    session.gm = null;
    session.configured = e.status === 503 ? false : e.status === 404 || e.status === 0 ? 'offline' : session.configured;
  }
  notify();
  return session;
}

export async function signIn(code) {
  const r = await api('session', { method: 'POST', body: { code } });
  session.gm = r.gm; session.configured = true; notify();
  return r.gm;
}

export async function signOut() {
  try { await api('session', { method: 'DELETE' }); } finally { session.gm = null; notify(); }
}
