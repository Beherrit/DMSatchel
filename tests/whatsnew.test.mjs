import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatsNew, localVisit } from '../js/whatsnew.js';

const E = (id, kind, name, x = {}) => ({ id, kind, name, status: 'live', created_at: '2030-01-01T00:00:00Z', updated_at: '2030-01-01T00:00:00Z', created_by: 'Admin', updated_by: 'Admin', fields: {}, ...x });

test('what changed since a visit, by other people, in sensible groups', () => {
  const entries = [
    E('s1', 'session', 'Session 4', { created_at: '2030-02-02T00:00:00Z', updated_at: '2030-02-02T00:00:00Z' }),
    E('h1', 'handout', 'Letter', { updated_at: '2030-02-03T00:00:00Z' }),
    E('n1', 'npc', 'Mabel', { created_at: '2030-02-03T00:00:00Z', updated_at: '2030-02-03T00:00:00Z' }),
    E('n2', 'npc', 'Old Tom', { updated_at: '2030-02-04T00:00:00Z' }),
    E('n3', 'npc', 'Mine', { created_at: '2030-02-04T00:00:00Z', updated_at: '2030-02-04T00:00:00Z', created_by: 'Pip', updated_by: 'Pip' }),
    E('n4', 'npc', 'Before', { updated_at: '2029-12-01T00:00:00Z' }),
    E('q1', 'quest', 'Drowned Bell', { updated_at: '2030-02-05T00:00:00Z' }),
    E('d1', 'downtime', 'Brann: Training', { fields: { character: 'c1', resolved: '2030-02-06T00:00:00Z' } }),
    E('d2', 'downtime', 'Vex: Crime', { fields: { character: 'c2', resolved: '2030-02-06T00:00:00Z' } }),
    E('x1', 'npc', 'Suggested', { status: 'suggested', created_at: '2030-02-04T00:00:00Z' }),
  ];
  const r = whatsNew({ entries, since: '2030-02-01T00:00:00Z', me: 'Pip', myCharacterIds: ['c1'],
    talk: [{ entry_id: 'n1', gm: 'Quill', created_at: '2030-02-05T00:00:00Z', body: 'Hi' }, { entry_id: 'n1', gm: 'Pip', created_at: '2030-02-05T00:00:00Z', body: 'Me' }] });
  assert.deepEqual(r.sessions.map((e) => e.id), ['s1']);
  assert.deepEqual(r.handouts.map((e) => e.id), ['h1']);
  assert.deepEqual(r.downtime.map((e) => e.id), ['d1'], 'only my characters’ downtime');
  assert.deepEqual(r.quests.map((e) => e.id), ['q1']);
  assert.deepEqual(r.added.map((e) => e.id), ['n1']);
  assert.deepEqual(r.changed.map((e) => e.id), ['n2']);
  assert.equal(r.talk.length, 1);
  assert.equal(r.total, 7);
  assert.equal(whatsNew({ entries, since: null }).total, 0, 'first visit: nothing to report');
  assert.equal(whatsNew({ entries, since: '2030-02-01T00:00:00Z', me: 'GM' }).downtime.length, 2, 'GMs (no characters) see all resolved downtime');
});

test('browser-side visits use the same three-hour sitting rule', () => {
  const mem = new Map(); const store = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const h = 3600000, t0 = Date.UTC(2030, 0, 1);
  assert.equal(localVisit(store, 'k', t0), null, 'first visit');
  assert.equal(localVisit(store, 'k', t0 + h), null, 'same sitting');
  assert.equal(localVisit(store, 'k', t0 + 6 * h), new Date(t0 + h).toISOString(), 'new sitting: since the end of the last one');
  assert.equal(localVisit(store, 'k', t0 + 7 * h), new Date(t0 + h).toISOString(), 'stays put within the sitting');
});
