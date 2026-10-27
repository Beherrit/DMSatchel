// GET   who is signed in and which worlds they belong to
// POST  {code}            sign in with a personal code (or the site admin code)
// POST  {invite, name?}   join a world with an invite code. Signed-in people get the membership added; new people
//                         get an account and a personal code (returned once) and are signed in.
// DELETE                  sign out
import { route, send, fail, sql, codeMatchesAdmin, codeHash, createSession, clearSession, logout, hash, newCode, myWorlds } from './_lib/core.js';

const norm = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const ROLE_RANK = { player: 1, gm: 2, owner: 3 };


export default route({
  async GET(req, res) {
    send(res, 200, { gm: req.gm, worlds: await myWorlds(req.gm), configured: true });
  },
  async POST(req, res) {
    if (req.body.invite) {
      const code = norm(req.body.invite);
      const w = (await sql`SELECT * FROM worlds WHERE NOT archived AND (upper(regexp_replace(gm_invite, '[^A-Za-z0-9]', '', 'g')) = ${code}
        OR upper(regexp_replace(player_invite, '[^A-Za-z0-9]', '', 'g')) = ${code})`)[0];
      if (!w) return fail(res, 404, 'That invite isn’t valid any more. Ask the world’s owner for a new link.');
      const role = norm(w.gm_invite) === code ? 'gm' : 'player';
      let gm = req.gm, personal = null;
      if (!gm) {
        const name = String(req.body.name || '').trim().slice(0, 60);
        if (!name) return fail(res, 400, 'Tell everyone your name first.', { code: 'need_name' });
        personal = newCode();
        gm = (await sql`INSERT INTO gms (name, role, code_hash) VALUES (${name}, 'user', ${codeHash(personal)}) RETURNING id, name, role`)[0];
        await createSession(res, gm.id);
      }
      const cur = (await sql`SELECT role FROM members WHERE world_id = ${w.id} AND gm_id = ${gm.id}`)[0];
      if (!cur) await sql`INSERT INTO members (world_id, gm_id, role) VALUES (${w.id}, ${gm.id}, ${role})`;
      else if (ROLE_RANK[role] > ROLE_RANK[cur.role]) await sql`UPDATE members SET role = ${role} WHERE world_id = ${w.id} AND gm_id = ${gm.id}`;
      return send(res, 200, { gm, code: personal, world: { id: w.id, slug: w.slug, name: w.name }, role: cur && ROLE_RANK[cur.role] > ROLE_RANK[role] ? cur.role : role, worlds: await myWorlds(gm) });
    }
    const code = String(req.body.code || '').trim();
    if (!code) return fail(res, 400, 'Enter your code.');
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
    if (!gm) return fail(res, 401, 'That code doesn’t match anyone. Check it, or use your invite link again.');
    await createSession(res, gm.id);
    send(res, 200, { gm, worlds: await myWorlds(gm) });
  },
  async DELETE(req, res) {
    await logout(req);
    clearSession(res);
    send(res, 200, { gm: null, worlds: [] });
  },
});
