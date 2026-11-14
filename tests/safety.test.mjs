import test from 'node:test';
import assert from 'node:assert/strict';
import { addPause, unseenPauses, newCheckin, answerCheckin } from '../js/safety.js';

test('pauses: kept by time alone, counted since last seen', () => {
  let l = addPause([], '2026-11-14T10:00:00Z'); l = addPause(l, '2026-11-14T10:05:00Z');
  assert.deepEqual(l, [{ at: '2026-11-14T10:00:00Z' }, { at: '2026-11-14T10:05:00Z' }]);
  assert.deepEqual(unseenPauses(l, '2026-11-14T10:01:00Z'), { count: 1, last: '2026-11-14T10:05:00Z' });
  assert.deepEqual(unseenPauses(l, '2026-11-14T11:00:00Z'), { count: 0, last: null });
  assert.equal(Object.keys(l[0]).join(), 'at');
});

test('check-ins: one answer each, counted apart from who answered', () => {
  let c = newCheckin('', '2026-11-14T10:00:00Z');
  assert.equal(c.question, 'How’s everyone doing?');
  c = answerCheckin(c, 7, 'up').checkin; c = answerCheckin(c, 8, 'down').checkin;
  assert.deepEqual(c.tally, { up: 1, meh: 0, down: 1 }); assert.deepEqual(c.voted, [7, 8]);
  assert.match(answerCheckin(c, 7, 'meh').error, /already/);
  assert.match(answerCheckin(c, 9, 'great').error, /Pick/);
});

test('pastCheckins: the closed one kept, tally only, the last 12', async () => {
  const { pastCheckins } = await import('../js/safety.js');
  const p = pastCheckins([], { id: 'c1', question: 'Fun?', at: 'a', tally: { up: 2, meh: 0, down: 1 }, voted: [7, 8, 9] }, 'z');
  assert.deepEqual(p, [{ question: 'Fun?', at: 'a', closed: 'z', tally: { up: 2, meh: 0, down: 1 } }]);
  assert.equal(JSON.stringify(p).includes('voted'), false);
  assert.deepEqual(pastCheckins(p, null), p);
  let many = []; for (let i = 0; i < 20; i++) many = pastCheckins(many, { id: `c${i}`, question: `q${i}`, tally: {} });
  assert.equal(many.length, 12); assert.equal(many[0].question, 'q8');
});
