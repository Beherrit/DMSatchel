import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCalendar } from '../js/calendar.js';
import { buildRecap, lastSession } from '../js/recap.js';

const E = (id, kind, name, extra = {}) => ({ id, kind, name, summary: '', fields: {}, visibility: 'all', status: 'live', created_at: '2030-01-01T00:00:00Z', updated_at: '2030-01-01T00:00:00Z', ...extra });

test('a recap gathers only what changed since the last session, and only what players can see', () => {
  const entries = [
    E('s1', 'session', 'Session 3', { fields: { number: '3', next: 'Storm the bell tower.' }, created_at: '2030-02-01T00:00:00Z' }),
    E('s0', 'session', 'Session 2', { fields: { number: '2' }, created_at: '2030-01-20T00:00:00Z' }),
    E('n1', 'npc', 'Mabel', { summary: 'Innkeeper with a secret.', created_at: '2030-02-03T00:00:00Z' }),
    E('n2', 'npc', 'Old Tom', { created_at: '2030-01-05T00:00:00Z' }),
    E('n3', 'npc', 'Hidden Villain', { visibility: 'gm', created_at: '2030-02-03T00:00:00Z' }),
    E('n4', 'faction', 'Red Hand', { created_at: '2030-01-05T00:00:00Z' }),
    E('q1', 'quest', 'Drowned Bell', { fields: { status: 'Active' }, updated_at: '2030-02-04T00:00:00Z' }),
    E('q2', 'quest', 'Old Job', { fields: { status: 'Completed' }, updated_at: '2030-01-10T00:00:00Z' }),
    E('c1', 'character', 'Brann', { owner: 'Pip' }),
    E('c2', 'character', 'Gone', { fields: { status: 'Dead' } }),
    E('d1', 'downtime', 'Brann: Training', { fields: { character: 'c1', activity: 'Training', outcome: 'Learns the longsword.', resolved: '2030-02-05T00:00:00Z' } }),
    E('d2', 'downtime', 'Brann: Crime', { visibility: 'gm', fields: { character: 'c1', activity: 'Crime', outcome: 'Secret.', resolved: '2030-02-05T00:00:00Z' } }),
  ];
  const r = buildRecap({
    entries, labels: { npc: 'NPC', faction: 'Faction', quest: 'Quest' }, today: '2030-02-10', worldDate: '3 Frostfall',
    activity: [{ entry_id: 'n4', action: 'reveal', at: '2030-02-02T00:00:00Z' }, { entry_id: 'n2', action: 'reveal', at: '2030-01-06T00:00:00Z' }],
    ledger: [{ at: '2030-02-06T00:00:00Z', cp: 12050 }, { at: '2030-02-06T00:00:00Z', item: 'Potion', qty: 3 }, { at: '2030-01-06T00:00:00Z', cp: 999 }],
    standings: { log: [{ entry_id: 'n4', delta: -1, reason: 'Burned their warehouse', at: '2030-02-07T00:00:00Z' }, { entry_id: 'n4', delta: 2, secret: true, at: '2030-02-07T00:00:00Z' }],
      clocks: [{ entry_id: 'n4', name: 'Seize the toll', filled: 4, size: 4, updated_at: '2030-02-08T00:00:00Z' }, { entry_id: 'n4', name: 'Secret plan', filled: 1, size: 6, secret: true, updated_at: '2030-02-08T00:00:00Z' }] },
  });
  assert.equal(r.name, 'Session 4'); assert.ok(r.body.includes('Picking up from last time: Storm the bell tower.'));
  assert.equal(r.fields.number, '4'); assert.equal(r.fields.world_date, '3 Frostfall');
  assert.ok(r.body.includes('[[Mabel]] (NPC): Innkeeper with a secret.'));
  assert.ok(r.body.includes('[[Red Hand]] (Faction)'), 'revealed since');
  assert.ok(!r.body.includes('Old Tom') && !r.body.includes('Hidden Villain'));
  assert.ok(r.body.includes('[[Drowned Bell]]: Active') && !r.body.includes('Old Job'));
  assert.ok(r.body.includes('[[Brann]], training: Learns the longsword.') && !r.body.includes('Secret.'));
  assert.ok(r.body.includes('Coin: +120 gp 5 sp') && r.body.includes('+3 Potion') && !r.body.includes('9 gp'));
  assert.ok(r.body.includes('[[Red Hand]] -1 (Burned their warehouse)') && !r.body.includes('+2'));
  assert.ok(r.body.includes('Seize the toll ([[Red Hand]]): 4 of 4, complete') && !r.body.includes('Secret plan'));
  assert.equal(r.fields.players, 'Brann (Pip)');
  assert.equal(r.fields.loot, 'Coin: +120 gp 5 sp\n+3 Potion');
  assert.equal(lastSession(entries).id, 's1');
});

test('the first recap has no cutoff and still reads well', () => {
  const r = buildRecap({ entries: [E('n1', 'npc', 'Mabel')], labels: { npc: 'NPC' } });
  assert.equal(r.name, 'Session 1'); assert.equal(r.since, null);
  assert.ok(r.body.startsWith('## What happened') && r.body.includes('[[Mabel]]'));
  assert.equal(buildRecap({ entries: [] }).body.split('## ').length, 2, 'only the story section when nothing changed');
});

test('the session in numbers', () => {
  const cal = { ...makeCalendar('seasons', 1040), month: 1, day: 9 };
  const entries = [{ ...E('s1', 'session', 'Session 1'), created_at: '2030-01-01T00:00:00Z', fields: { number: '1', world_date: '3 Thawmoon 1040' } },
    { ...E('q1', 'quest', 'Wolves'), updated_at: '2030-02-01T00:00:00Z', fields: { status: 'Completed' } }, { ...E('q2', 'quest', 'Ring'), updated_at: '2030-02-01T00:00:00Z', fields: { status: 'Active' } }];
  const r = buildRecap({ entries, cal, ledger: [{ at: '2030-02-01T00:00:00Z', cp: 5000 }, { at: '2030-02-01T00:00:00Z', cp: -1500 }, { at: '2030-02-01T00:00:00Z', item: 'Rope', qty: 2 }, { at: '2030-02-01T00:00:00Z', item: 'Gem', qty: -1 }] });
  const part = r.body.split('## The session in numbers\n')[1].split('\n\n')[0];
  assert.deepEqual(part.split('\n'), ['- Coin: +50 gp earned, −15 gp spent', '- Items found: 2', '- Days passed in the world: 6 (3 Thawmoon 1040 to 9 Thawmoon 1040)', '- Quests completed: 1 ([[Wolves]])']);
  assert.ok(r.body.indexOf('## The session in numbers') < r.body.indexOf('## Quests'), 'first after the story');
  assert.ok(!buildRecap({ entries: [] }).body.includes('in numbers'));
});
