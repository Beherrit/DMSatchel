import test from 'node:test';
import assert from 'node:assert/strict';
import { betweenSessions } from '../js/between.js';

test('only what happened after the latest session was logged', () => {
  const list = [{ id: 's1', kind: 'session', name: 'Session 1', fields: { number: '1' }, created_at: '2026-10-01T00:00:00Z' },
    { id: 's2', kind: 'session', name: 'Session 2', fields: { number: '2' }, created_at: '2026-10-10T00:00:00Z' },
    { id: 'j1', kind: 'journal', name: 'Old', created_at: '2026-10-05T00:00:00Z' }, { id: 'j2', kind: 'journal', name: 'New', created_at: '2026-10-12T00:00:00Z' },
    { id: 'd', kind: 'downtime', name: 'Training', created_at: '2026-10-02T00:00:00Z', updated_at: '2026-10-15T00:00:00Z' },
    { id: 'x', kind: 'npc', name: 'Idea', status: 'suggested', created_at: '2026-10-11T00:00:00Z' }];
  const r = betweenSessions(list, [{ created_at: '2026-10-09T00:00:00Z' }, { created_at: '2026-10-13T00:00:00Z' }]);
  assert.deepEqual([r.last.id, r.journals.map((e) => e.id), r.downtime.map((e) => e.id), r.suggested.map((e) => e.id), r.talk.length], ['s2', ['j2'], ['d'], ['x'], 1]);
  const none = betweenSessions([], [], Date.parse('2026-10-15T00:00:00Z'));
  assert.equal(none.since, '2026-10-01T00:00:00.000Z');
});
