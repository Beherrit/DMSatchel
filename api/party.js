// The party's treasury: a ledger of coins and items coming in and going out.
// GET                                      every line, newest first, with totals
// POST {cp, item, qty, holder, note, session_id}   add a line (any member of the world); cp and qty are signed
// DELETE ?id=                              strike a line (GM, or whoever wrote it); it stays in the database
//
// Next-session scheduling lives here too (members only):
// GET ?schedule=1                           open polls and the last few closed ones, plus the world's members
// POST {schedule: {title, note, dates}}     (GM) propose dates
// PATCH {schedule_id, vote: [..]}           your answers, one per date: 'yes', 'maybe', 'no' or ''
// PATCH {schedule_id, lock: i | null}       (GM) lock in a date (it becomes the world's next session) or unlock
// PATCH {schedule_id, closed: bool}         (GM) close or reopen
// PATCH {schedule_id, post: true}           (GM) post the poll, or the locked date, to the world's Discord
// DELETE ?schedule=id                       (GM) remove a poll
//
// Session zero (members only):
// GET ?zero=1                               the primer, your own answers; GMs also get everyone's (anonymous ones without
//                                           a name) and who has read the page
// PATCH {primer: {...}}                     (GM) the primer: pitch, tone, house rules, safety tools, lines, veils
// PUT {zero: {ratings, lines, veils, note, anon}}   your private answers for the GMs (marks the page read)
// POST {zero_read: true}                    you've read the page
//
// PUT {favorite: entryId, on: bool}         star or unstar an entry for yourself (members); returns your favorites
// PUT {follow: entryId, on: bool}           follow or unfollow an entry (members); returns what you follow
// GET ?members=1                            the world's members with their profiles (members)
//
// Quick polls (members): GET ?polls=1 open ones and the last few closed · POST {poll: {question, options}, discord?} ask one
// PATCH {poll_id, vote: i | null} vote or take it back · PATCH {poll_id, closed} (asker or GM) · DELETE ?poll=id
// PUT {profile: {pronouns, note}}           your own profile in this world
//
// Ask the GM (members): a private thread between each player and the world's GMs.
// GET ?ask=1                                players: your thread (marks the answers read); GMs: every player, with
//                                           unread counts and the last message
// GET ?ask=1&player=id                      (GM) one player's thread (marks their messages read)
// POST {ask: {body, player}}                write in your thread; GMs name the player
// DELETE ?ask=id                            take back your own message
import { route, send, fail, sql, requireMember, requireGm, postDiscord } from './_lib/core.js';
import { cleanDates, cleanVote, tally, dateText } from '../js/schedule.js';
import { cleanPrimer, cleanAnswer, answerEmpty } from '../js/zero.js';
import { cleanPoll, castVote } from '../js/polls.js';
import { askUnread } from './_lib/ask.js';

const clip = (v, n) => String(v ?? '').slice(0, n);
// A poll as the page sees it: who voted for what (by name), and what you chose.
const pollOut = (p, names, req) => ({ id: p.id, question: p.question, options: p.options, closed: p.closed, created_at: p.created_at, asker: p.asker, mine: p.gm_id === req.gm.id,
  votes: Object.fromEntries(Object.entries(p.votes || {}).map(([k, v]) => [k, Number(v)])), voters: Object.fromEntries(Object.keys(p.votes || {}).map((k) => [k, names[k] || 'Someone'])) });
const cleanProfile = (p) => ({ pronouns: clip(p?.pronouns, 40).trim(), note: clip(p?.note, 600).trim() });

// Ask the GM: one player's thread, oldest first.
const askThread = (req, playerId) => sql`SELECT q.id, q.body, q.from_gm, q.seen, q.created_at, q.gm_id, g.name AS by FROM gm_questions q LEFT JOIN gms g ON g.id = q.gm_id
  WHERE q.world_id = ${req.world.id} AND q.player_id = ${playerId} ORDER BY q.created_at, q.id LIMIT 500`;
const isPlayerHere = async (req, id) => (await sql`SELECT 1 FROM members WHERE world_id = ${req.world.id} AND gm_id = ${id} AND role NOT IN ('owner', 'gm')`).length > 0;

async function getAsk(req, res) {
  if (!requireMember(req, res)) return;
  if (!req.isGmHere) {
    const messages = await askThread(req, req.gm.id);
    await sql`UPDATE gm_questions SET seen = true WHERE world_id = ${req.world.id} AND player_id = ${req.gm.id} AND from_gm AND NOT seen`;
    return send(res, 200, { messages, me: req.gm.id });
  }
  if (req.query.player) {
    const id = Number(req.query.player);
    if (!(await isPlayerHere(req, id))) return fail(res, 404, 'That player isn’t in this world.');
    const messages = await askThread(req, id);
    await sql`UPDATE gm_questions SET seen = true WHERE world_id = ${req.world.id} AND player_id = ${id} AND NOT from_gm AND NOT seen`;
    return send(res, 200, { messages, me: req.gm.id, unread: await askUnread(req) });
  }
  // Every player, with their thread's unread count and last message (busiest and newest first).
  const players = await sql`SELECT g.id, g.name,
      (SELECT count(*)::int FROM gm_questions q WHERE q.world_id = ${req.world.id} AND q.player_id = g.id AND NOT q.from_gm AND NOT q.seen) AS unread,
      (SELECT row_to_json(x) FROM (SELECT q.body, q.from_gm, q.created_at FROM gm_questions q WHERE q.world_id = ${req.world.id} AND q.player_id = g.id ORDER BY q.created_at DESC, q.id DESC LIMIT 1) x) AS last
    FROM members m JOIN gms g ON g.id = m.gm_id WHERE m.world_id = ${req.world.id} AND m.role NOT IN ('owner', 'gm') ORDER BY g.name`;
  players.sort((a, b) => b.unread - a.unread || String(b.last?.created_at || '').localeCompare(String(a.last?.created_at || '')) || a.name.localeCompare(b.name));
  send(res, 200, { players });
}

async function postAsk(req, res, a) {
  const body = clip(a?.body, 4000).trim();
  if (!body) return fail(res, 400, 'Write something first.');
  let playerId = req.gm.id;
  if (req.isGmHere) {
    playerId = Number(a?.player);
    if (!(await isPlayerHere(req, playerId))) return fail(res, 400, 'Pick a player in this world.');
  }
  const rows = await sql`INSERT INTO gm_questions (world_id, player_id, gm_id, body, from_gm) VALUES (${req.world.id}, ${playerId}, ${req.gm.id}, ${body}, ${req.isGmHere})
    RETURNING id, body, from_gm, seen, created_at, gm_id`;
  // Answering a player's thread reads it.
  if (req.isGmHere) await sql`UPDATE gm_questions SET seen = true WHERE world_id = ${req.world.id} AND player_id = ${playerId} AND NOT from_gm AND NOT seen`;
  send(res, 201, { message: { ...rows[0], by: req.gm.name } });
}

const pollShape = (p) => ({ id: p.id, title: p.title, note: p.note, dates: p.dates, votes: p.votes, locked: p.locked, closed: p.closed, created_at: p.created_at, created_by: p.created_by });

async function getSchedule(req, res) {
  if (!requireMember(req, res)) return;
  const polls = await sql`SELECT * FROM schedule_polls WHERE world_id = ${req.world.id} AND NOT deleted ORDER BY closed, created_at DESC LIMIT 12`;
  const members = await sql`SELECT g.id, g.name, m.role FROM members m JOIN gms g ON g.id = m.gm_id WHERE m.world_id = ${req.world.id} ORDER BY g.name`;
  send(res, 200, { polls: polls.map(pollShape), members, me: req.gm.id, next_session: req.world.next_session || null });
}

async function patchSchedule(req, res) {
  if (!requireMember(req, res)) return;
  const b = req.body, id = Number(b.schedule_id);
  const p = (await sql`SELECT * FROM schedule_polls WHERE id = ${id} AND world_id = ${req.world.id} AND NOT deleted`)[0];
  if (!p) return fail(res, 404, 'That poll is gone.');
  if (b.vote !== undefined) {
    if (p.closed) return fail(res, 409, 'This poll is closed.');
    const vote = cleanVote(b.vote, p.dates.length);
    // Merge just this person's answers, so two people answering at once don't overwrite each other.
    const rows = await sql`UPDATE schedule_polls SET votes = votes || jsonb_build_object(${String(req.gm.id)}::text, ${JSON.stringify(vote)}::jsonb)
      WHERE id = ${id} RETURNING *`;
    return send(res, 200, { poll: pollShape(rows[0]) });
  }
  if (!requireGm(req, res)) return;
  if (b.lock !== undefined) {
    const i = b.lock === null ? null : Number(b.lock);
    if (i !== null && !(Number.isInteger(i) && i >= 0 && i < p.dates.length)) return fail(res, 400, 'Pick one of the proposed dates.');
    const rows = await sql`UPDATE schedule_polls SET locked = ${i} WHERE id = ${id} RETURNING *`;
    // The locked date is the world's next session; unlocking clears it only if it was this poll's date.
    if (i !== null) await sql`UPDATE worlds SET next_session = ${p.dates[i]} WHERE id = ${req.world.id}`;
    else if (p.locked !== null && req.world.next_session && new Date(req.world.next_session).toISOString() === p.dates[p.locked]) await sql`UPDATE worlds SET next_session = NULL WHERE id = ${req.world.id}`;
    return send(res, 200, { poll: pollShape(rows[0]), next_session: i !== null ? p.dates[i] : null });
  }
  if (b.closed !== undefined) {
    const rows = await sql`UPDATE schedule_polls SET closed = ${Boolean(b.closed)} WHERE id = ${id} RETURNING *`;
    return send(res, 200, { poll: pollShape(rows[0]) });
  }
  if (b.post) {
    const origin = `https://${req.headers.host}`;
    const members = await sql`SELECT g.id, g.name FROM members m JOIN gms g ON g.id = m.gm_id WHERE m.world_id = ${req.world.id}`;
    const names = new Map(members.map((m) => [String(m.id), m.name]));
    const t = tally(p, members.map((m) => m.id));
    // Discord shows times in each reader's own zone with <t:…> stamps.
    const stamp = (iso) => `<t:${Math.floor(Date.parse(iso) / 1000)}:F>`;
    const embed = p.locked !== null
      ? { title: `Next session: ${p.title || 'locked in'}`, description: `${stamp(p.dates[p.locked])} (<t:${Math.floor(Date.parse(p.dates[p.locked]) / 1000)}:R>)${p.note ? `\n\n${p.note}` : ''}` }
      : { title: p.title || 'When can we play?', description: `${p.note ? `${p.note}\n\n` : ''}${t.rows.map((r) => `${r.i === t.best ? '★ ' : ''}${stamp(r.at)} — ${r.yes.length} yes, ${r.maybe.length} maybe`).join('\n')}\n\nAnswer on the site.${t.missing.length ? ` Still to answer: ${t.missing.map((m) => names.get(m)).filter(Boolean).join(', ')}.` : ''}` };
    const err = await postDiscord(req.world.discord_webhook, { ...embed, color: 0x1C6A63, url: `${origin}/?w=${encodeURIComponent(req.world.slug)}#world/schedule`, footer: { text: req.world.name } });
    if (err) return fail(res, req.world.discord_webhook ? 502 : 400, err);
    return send(res, 200, { ok: true });
  }
  fail(res, 400, 'Nothing to change.');
}

async function getZero(req, res) {
  if (!requireMember(req, res)) return;
  const rows = await sql`SELECT z.gm_id, z.answer, z.read_at, z.updated_at, g.name FROM zero_answers z JOIN gms g ON g.id = z.gm_id
    JOIN members m ON m.world_id = z.world_id AND m.gm_id = z.gm_id WHERE z.world_id = ${req.world.id}`;
  const mine = rows.find((r) => r.gm_id === req.gm.id);
  const p = req.world.primer;
  const out = { primer: p ? { ...cleanPrimer(p), updated_at: p.updated_at || null, updated_by: p.updated_by || null } : null, mine: { answer: mine?.answer || null, read_at: mine?.read_at || null } };
  if (req.isGmHere) {
    const members = await sql`SELECT g.id, g.name, m.role FROM members m JOIN gms g ON g.id = m.gm_id WHERE m.world_id = ${req.world.id} ORDER BY g.name`;
    const read = new Map(rows.filter((r) => r.read_at).map((r) => [r.gm_id, r.read_at]));
    out.members = members.map((m) => ({ name: m.name, role: m.role, read_at: read.get(m.id) || null }));
    // Anonymous answers come without a name, and in no particular order.
    out.answers = rows.filter((r) => r.answer && !answerEmpty(r.answer)).map((r) => ({ name: r.answer.anon ? null : r.name, answer: r.answer, updated_at: r.answer.anon ? null : r.updated_at }))
      .sort((a, b) => (a.name ? 0 : 1) - (b.name ? 0 : 1) || String(a.name || JSON.stringify(a.answer)).localeCompare(String(b.name || JSON.stringify(b.answer))));
  }
  send(res, 200, out);
}

async function putZero(req, res) {
  if (!requireMember(req, res)) return;
  const a = cleanAnswer(req.body.zero);
  const answer = answerEmpty(a) ? null : a;
  await sql`INSERT INTO zero_answers (world_id, gm_id, answer, read_at, updated_at) VALUES (${req.world.id}, ${req.gm.id}, ${answer ? JSON.stringify(answer) : null}::jsonb, now(), now())
    ON CONFLICT (world_id, gm_id) DO UPDATE SET answer = EXCLUDED.answer, read_at = COALESCE(zero_answers.read_at, now()), updated_at = now()`;
  send(res, 200, { answer });
}

export default route({
  async PUT(req, res) {
    if (req.body.zero !== undefined) return putZero(req, res);
    if (req.body.profile !== undefined) {
      if (!requireMember(req, res)) return;
      const p = cleanProfile(req.body.profile);
      await sql`UPDATE members SET profile = ${JSON.stringify(p)}::jsonb WHERE world_id = ${req.world.id} AND gm_id = ${req.gm.id}`;
      return send(res, 200, { profile: p });
    }
    if (req.body.follow !== undefined) {
      if (!requireMember(req, res)) return;
      const id = clip(req.body.follow, 40);
      const cur = (await sql`SELECT following FROM members WHERE world_id = ${req.world.id} AND gm_id = ${req.gm.id}`)[0];
      const next = [...(Array.isArray(cur?.following) ? cur.following : []).filter((x) => x !== id), ...(req.body.on ? [id] : [])].slice(-200);
      await sql`UPDATE members SET following = ${JSON.stringify(next)}::jsonb WHERE world_id = ${req.world.id} AND gm_id = ${req.gm.id}`;
      return send(res, 200, { following: next });
    }
    if (req.body.favorite !== undefined) {
      if (!requireMember(req, res)) return;
      const id = clip(req.body.favorite, 40);
      const cur = (await sql`SELECT favorites FROM members WHERE world_id = ${req.world.id} AND gm_id = ${req.gm.id}`)[0];
      const next = [...(req.body.on ? [id] : []), ...(Array.isArray(cur?.favorites) ? cur.favorites : []).filter((x) => x !== id)].slice(0, 60);
      await sql`UPDATE members SET favorites = ${JSON.stringify(next)}::jsonb WHERE world_id = ${req.world.id} AND gm_id = ${req.gm.id}`;
      return send(res, 200, { favorites: next });
    }
    fail(res, 400, 'Nothing to change.');
  },
  async PATCH(req, res) {
    if (req.body.schedule_id !== undefined) return patchSchedule(req, res);
    if (req.body.poll_id !== undefined) {
      if (!requireMember(req, res)) return;
      const p = (await sql`SELECT * FROM table_polls WHERE id = ${Number(req.body.poll_id)} AND world_id = ${req.world.id} AND NOT deleted`)[0];
      if (!p) return fail(res, 404, 'That poll is gone.');
      if (typeof req.body.closed === 'boolean') {
        if (p.gm_id !== req.gm.id && !req.isGmHere) return fail(res, 403, 'Only whoever asked, or a GM, can close it.');
        await sql`UPDATE table_polls SET closed = ${req.body.closed} WHERE id = ${p.id}`;
      } else {
        if (p.closed) return fail(res, 400, 'That poll is closed.');
        const r = castVote({}, String(req.gm.id), req.body.vote, p.options.length);
        if (r.error) return fail(res, 400, r.error);
        // One person's vote changes on its own, so two people voting at once don't overwrite each other.
        if (req.body.vote === null) await sql`UPDATE table_polls SET votes = votes - ${String(req.gm.id)} WHERE id = ${p.id}`;
        else await sql`UPDATE table_polls SET votes = votes || jsonb_build_object(${String(req.gm.id)}::text, ${Number(req.body.vote)}::int) WHERE id = ${p.id}`;
      }
      return send(res, 200, { ok: true });
    }
    if (req.body.primer !== undefined) {
      if (!requireGm(req, res)) return;
      const p = { ...cleanPrimer(req.body.primer), updated_at: new Date().toISOString(), updated_by: req.gm.name };
      await sql`UPDATE worlds SET primer = ${JSON.stringify(p)}::jsonb WHERE id = ${req.world.id}`;
      return send(res, 200, { primer: p });
    }
    fail(res, 400, 'Nothing to change.');
  },
  async GET(req, res) {
    if (req.query?.ask) return getAsk(req, res);
    if (req.query?.schedule) return getSchedule(req, res);
    if (req.query?.zero) return getZero(req, res);
    if (req.query?.polls) {
      if (!requireMember(req, res)) return;
      const rows = await sql`SELECT p.*, g.name AS asker FROM table_polls p LEFT JOIN gms g ON g.id = p.gm_id
        WHERE p.world_id = ${req.world.id} AND NOT p.deleted ORDER BY p.closed, p.created_at DESC LIMIT 15`;
      const names = Object.fromEntries((await sql`SELECT g.id, g.name FROM members m JOIN gms g ON g.id = m.gm_id WHERE m.world_id = ${req.world.id}`).map((m) => [m.id, m.name]));
      return send(res, 200, { me: req.gm.id, polls: rows.map((p) => pollOut(p, names, req)) });
    }
    if (req.query?.members) {
      if (!requireMember(req, res)) return;
      const rows = await sql`SELECT g.id, g.name, m.role, m.profile FROM members m JOIN gms g ON g.id = m.gm_id WHERE m.world_id = ${req.world.id} ORDER BY g.name`;
      return send(res, 200, { members: rows.map((r) => ({ id: r.id, name: r.name, role: r.role, ...cleanProfile(r.profile) })), me: req.gm.id });
    }
    const lines = await sql`SELECT l.id, l.at, l.cp::float8 AS cp, l.item, l.qty, l.holder, l.note, l.session_id, l.gm_id, g.name AS by
      FROM party_ledger l LEFT JOIN gms g ON g.id = l.gm_id WHERE l.world_id = ${req.world.id} AND NOT l.deleted ORDER BY l.at DESC LIMIT 1000`;
    const cp = lines.reduce((t, l) => t + Number(l.cp || 0), 0);
    const items = new Map();
    for (const l of [...lines].reverse()) {
      if (!l.item || !l.qty) continue;
      const k = l.item.trim().toLowerCase();
      const cur = items.get(k) || { item: l.item.trim(), qty: 0, holder: '' };
      cur.qty += l.qty; if (l.holder && l.qty > 0) cur.holder = l.holder;
      items.set(k, cur);
    }
    send(res, 200, { lines, cp, items: [...items.values()].filter((i) => i.qty > 0).sort((a, b) => a.item.localeCompare(b.item)) });
  },
  async POST(req, res) {
    if (!requireMember(req, res)) return;
    const b = req.body || {};
    if (b.ask) return postAsk(req, res, b.ask);
    if (b.zero_read) {
      await sql`INSERT INTO zero_answers (world_id, gm_id, read_at) VALUES (${req.world.id}, ${req.gm.id}, now())
        ON CONFLICT (world_id, gm_id) DO UPDATE SET read_at = COALESCE(zero_answers.read_at, now())`;
      return send(res, 200, { ok: true });
    }
    if (b.poll) {
      const c = cleanPoll(b.poll);
      if (c.error) return fail(res, 400, c.error);
      const open = (await sql`SELECT count(*)::int AS n FROM table_polls WHERE world_id = ${req.world.id} AND NOT closed AND NOT deleted`)[0].n;
      if (open >= 10) return fail(res, 400, 'There are 10 open polls already. Close one first.');
      const row = (await sql`INSERT INTO table_polls (world_id, gm_id, question, options) VALUES (${req.world.id}, ${req.gm.id}, ${c.question}, ${JSON.stringify(c.options)}::jsonb) RETURNING id`)[0];
      // Also to the world's Discord channel, if asked: the question and the choices, with a link to vote.
      let discord = null;
      if (b.discord && req.world.discord_webhook) {
        discord = await postDiscord(req.world.discord_webhook, { title: `🗳 ${c.question}`.slice(0, 250), description: `${c.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nVote on the world's front page.`, color: 0x1C6A63,
          url: `https://${req.headers.host}/?w=${encodeURIComponent(req.world.slug)}#world`, footer: { text: `${req.world.name} · asked by ${req.gm.name}` } });
      }
      return send(res, 201, { id: row.id, ...(discord ? { discord_error: discord } : {}) });
    }
    if (b.schedule) {
      if (!requireGm(req, res)) return;
      const dates = cleanDates(b.schedule.dates);
      if (!dates.length) return fail(res, 400, 'Propose at least one date and time.');
      const rows = await sql`INSERT INTO schedule_polls (world_id, created_by, title, note, dates)
        VALUES (${req.world.id}, ${req.gm.id}, ${clip(b.schedule.title, 120).trim()}, ${clip(b.schedule.note, 1000)}, ${JSON.stringify(dates)}::jsonb) RETURNING *`;
      return send(res, 201, { poll: pollShape(rows[0]) });
    }
    const cp = Math.round(Number(b.cp) || 0);
    const qty = Math.round(Number(b.qty) || 0);
    const item = clip(b.item, 200).trim();
    if (Math.abs(cp) > 1e12 || Math.abs(qty) > 1e6) return fail(res, 400, 'That number is too big.');
    if (!cp && !(item && qty)) return fail(res, 400, 'Enter an amount of coin, or an item and how many.');
    const rows = await sql`INSERT INTO party_ledger (world_id, gm_id, cp, item, qty, holder, note, session_id)
      VALUES (${req.world.id}, ${req.gm.id}, ${cp}, ${item}, ${item ? qty : 0}, ${clip(b.holder, 120)}, ${clip(b.note, 500)}, ${b.session_id ? clip(b.session_id, 40) : null})
      RETURNING id, at, cp::float8 AS cp, item, qty, holder, note, session_id, gm_id`;
    send(res, 201, { line: { ...rows[0], by: req.gm.name } });
  },
  async DELETE(req, res) {
    if (!requireMember(req, res)) return;
    if (req.query?.ask) {
      const gone = await sql`DELETE FROM gm_questions WHERE id = ${Number(req.query.ask)} AND world_id = ${req.world.id} AND gm_id = ${req.gm.id} RETURNING id`;
      if (!gone.length) return fail(res, 404, 'That message was already taken back.');
      return send(res, 200, { ok: true });
    }
    if (req.query?.poll) {
      const p = (await sql`SELECT gm_id FROM table_polls WHERE id = ${Number(req.query.poll)} AND world_id = ${req.world.id} AND NOT deleted`)[0];
      if (!p) return fail(res, 404, 'That poll is gone.');
      if (p.gm_id !== req.gm.id && !req.isGmHere) return fail(res, 403, 'Only whoever asked, or a GM, can remove it.');
      await sql`UPDATE table_polls SET deleted = true WHERE id = ${Number(req.query.poll)}`;
      return send(res, 200, { ok: true });
    }
    if (req.query?.schedule) {
      if (!requireGm(req, res)) return;
      const rows = await sql`UPDATE schedule_polls SET deleted = true WHERE id = ${Number(req.query.schedule)} AND world_id = ${req.world.id} RETURNING locked, dates`;
      if (!rows.length) return fail(res, 404, 'That poll is gone.');
      return send(res, 200, { ok: true });
    }
    const id = Number(req.query?.id);
    const rows = await sql`UPDATE party_ledger SET deleted = true WHERE id = ${id} AND world_id = ${req.world.id} AND NOT deleted
      AND (${req.isGmHere} OR gm_id = ${req.gm.id}) RETURNING id`;
    if (!rows.length) return fail(res, 404, 'That line is gone, or it isn’t yours to remove.');
    send(res, 200, { ok: true });
  },
}, { world: true });
