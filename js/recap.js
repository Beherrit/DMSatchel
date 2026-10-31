// Session recap drafts: what changed since the last session, as a session-log entry the GM edits before saving.
// Only things players can already see go in (it may be posted to Discord). Pure, so it can be tested.
import { coinText } from './economy.js';
import { parseDate, toDays, today as calToday, formatDate } from './calendar.js';

const after = (t, since) => Boolean(t) && (!since || String(new Date(t).toISOString()) > since);
const open = (e) => e && e.visibility !== 'gm' && (e.status || 'live') === 'live';
const short = (t, n = 160) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };

// The last session: highest number, then newest.
export function lastSession(entries) {
  return entries.filter((e) => e.kind === 'session').sort((a, b) => (parseFloat(b.fields?.number) || 0) - (parseFloat(a.fields?.number) || 0) || String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
}

// d: { entries, activity, ledger, standings: { log, clocks }, labels: {kind: label}, today, worldDate, now }
// Returns a draft entry: { kind: 'session', name, summary, body, fields }.
export function buildRecap(d) {
  const entries = d.entries || [], byId = new Map(entries.map((e) => [e.id, e]));
  const last = lastSession(entries);
  const since = last ? new Date(last.created_at).toISOString() : null;
  const number = (parseFloat(last?.fields?.number) || 0) + 1;
  const ref = (e) => `[[${e.name}]]`;
  const label = (k) => d.labels?.[k] || k;
  const sections = [];
  const add = (title, lines) => { if (lines.length) sections.push(`## ${title}\n${lines.join('\n')}`); };

  // Revealed: entries a GM made visible since (from the history), still visible now.
  const revealed = new Set((d.activity || []).filter((a) => ['reveal', 'approve'].includes(a.action) && after(a.at, since)).map((a) => a.entry_id));
  const isNew = (e) => after(e.created_at, since);
  const skip = new Set(['session', 'downtime', 'journal', 'rule', 'creature']);
  const fresh = entries.filter((e) => open(e) && !skip.has(e.kind) && (isNew(e) || revealed.has(e.id)))
    .sort((a, b) => label(a.kind).localeCompare(label(b.kind)) || a.name.localeCompare(b.name));
  add('New in the world', fresh.filter((e) => e.kind !== 'quest').map((e) => `- ${ref(e)} (${label(e.kind)})${e.summary ? `: ${short(e.summary, 120)}` : ''}`));

  const quests = entries.filter((e) => e.kind === 'quest' && open(e) && (after(e.updated_at, since) || revealed.has(e.id)));
  add('Quests', quests.sort((a, b) => a.name.localeCompare(b.name)).map((e) => `- ${ref(e)}${e.fields?.status ? `: ${e.fields.status}` : ''}${isNew(e) ? ' (new)' : ''}`));

  const downtime = entries.filter((e) => e.kind === 'downtime' && open(e) && e.fields?.outcome && after(e.fields.resolved, since));
  add('Downtime', downtime.map((e) => { const ch = byId.get(e.fields.character); return `- ${ch ? ref(ch) : e.name}, ${String(e.fields.activity || 'downtime').toLowerCase()}: ${short(e.fields.outcome)}`; }));

  const lines = (d.ledger || []).filter((l) => after(l.at, since));
  const coin = lines.reduce((t, l) => t + Number(l.cp || 0), 0);
  const items = new Map();
  for (const l of lines) if (l.item && l.qty) items.set(l.item.trim(), (items.get(l.item.trim()) || 0) + l.qty);
  const loot = [coin ? `- Coin: ${coin > 0 ? '+' : ''}${coinText(coin)}` : null, ...[...items].filter(([, q]) => q).map(([i, q]) => `- ${q > 0 ? '+' : ''}${q} ${i}`)].filter(Boolean);
  add('Treasure', loot);

  const standing = (d.standings?.log || []).filter((s) => !s.secret && after(s.at, since) && open(byId.get(s.entry_id)));
  add('Standing', standing.map((s) => `- ${ref(byId.get(s.entry_id))} ${s.delta > 0 ? '+' : ''}${s.delta ?? ''}${s.reason ? ` (${short(s.reason, 80)})` : ''}`));

  const clocks = (d.standings?.clocks || []).filter((c) => !c.secret && after(c.updated_at, since) && open(byId.get(c.entry_id)));
  add('Clocks', clocks.map((c) => `- ${c.name} (${ref(byId.get(c.entry_id))}): ${c.filled} of ${c.size}${c.filled >= c.size ? ', complete' : ''}`));

  // The session in numbers: coin in and out, items found, in-world days gone by, quests completed.
  const earned = lines.reduce((t, l) => t + Math.max(0, Number(l.cp || 0)), 0), spent = lines.reduce((t, l) => t + Math.max(0, -Number(l.cp || 0)), 0);
  const found = lines.reduce((t, l) => t + (l.item && l.qty > 0 ? l.qty : 0), 0);
  const from = d.cal && parseDate(d.cal, last?.fields?.world_date);
  const days = from ? toDays(d.cal, calToday(d.cal)) - toDays(d.cal, from) : null;
  const done = quests.filter((e) => e.fields?.status === 'Completed');
  const numbers = [
    earned || spent ? `- Coin: ${[earned ? `+${coinText(earned)} earned` : '', spent ? `−${coinText(spent)} spent` : ''].filter(Boolean).join(', ')}` : null,
    found ? `- Items found: ${found}` : null,
    days > 0 ? `- Days passed in the world: ${days} (${formatDate(d.cal, from)} to ${formatDate(d.cal, calToday(d.cal))})` : null,
    done.length ? `- Quests completed: ${done.length} (${done.map(ref).join(', ')})` : null,
  ].filter(Boolean);
  if (numbers.length) sections.unshift(`## The session in numbers\n${numbers.join('\n')}`);

  const players = entries.filter((e) => e.kind === 'character' && open(e) && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status))
    .sort((a, b) => a.name.localeCompare(b.name)).map((e) => `${e.name}${e.owner ? ` (${e.owner})` : ''}`);

  const body = ['## What happened', ...(last?.fields?.next ? [`Picking up from last time: ${last.fields.next}`] : []), '_Write the story of the session here: where the party went, who they met, what they decided._', ...sections].join('\n\n');
  return {
    kind: 'session', name: `Session ${number}`, summary: '', body, visibility: 'all',
    fields: { number: String(number), played_on: d.today || '', ...(d.worldDate ? { world_date: d.worldDate } : {}), ...(players.length ? { players: players.join('\n') } : {}), ...(loot.length ? { loot: loot.map((l) => l.slice(2)).join('\n') } : {}) },
    since, counts: { numbers: numbers.length, fresh: fresh.length, quests: quests.length, downtime: downtime.length, ledger: lines.length, standing: standing.length, clocks: clocks.length },
  };
}
