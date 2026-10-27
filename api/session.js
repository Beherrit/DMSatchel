// GET who is signed in · POST {code} to sign in · DELETE to sign out.
import { route, send, fail, sql, codeMatchesAdmin, codeHash, createSession, clearSession, logout, hash } from './_lib/core.js';

export default route({
  async GET(req, res) {
    send(res, 200, { gm: req.gm, configured: true });
  },
  async POST(req, res) {
    const code = String(req.body.code || '').trim();
    if (!code) return fail(res, 400, 'Enter your invite code.');
    let gm;
    if (codeMatchesAdmin(code)) {
      // The admin row is keyed to the current ADMIN_CODE, so changing the env var changes the admin login.
      const adminHash = hash(`admin:${process.env.ADMIN_CODE}`);
      const rows = await sql`INSERT INTO gms (name, role, code_hash) VALUES ('Admin', 'admin', ${adminHash})
        ON CONFLICT (code_hash) DO UPDATE SET disabled = false RETURNING id, name, role`;
      gm = rows[0];
    } else {
      const rows = await sql`SELECT id, name, role FROM gms WHERE code_hash = ${codeHash(code)} AND NOT disabled`;
      gm = rows[0];
    }
    if (!gm) return fail(res, 401, 'That code doesn’t match any GM. Check it with your admin.');
    await createSession(res, gm.id);
    send(res, 200, { gm });
  },
  async DELETE(req, res) {
    await logout(req);
    clearSession(res);
    send(res, 200, { gm: null });
  },
});
