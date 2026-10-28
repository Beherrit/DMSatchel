import test from 'node:test';
import assert from 'node:assert/strict';
import { applyNotice, activeNotices, readNotices } from '../js/notices.js';

test('post, expire and remove notices', () => {
  let r = applyNotice([], { add: { text: '  No game Friday ', until: '2026-11-01' } }, 'Ann', '2026-10-28T10:00:00Z');
  assert.deepEqual([r.list[0].text, r.list[0].until, r.list[0].by], ['No game Friday', '2026-11-01', 'Ann']);
  r = applyNotice(r.list, { add: { text: 'Level up!', until: 'soon' } }, 'Bo', '2026-10-29T10:00:00Z');
  assert.equal(r.list[0].text, 'Level up!');
  assert.equal(r.list[0].until, undefined);
  assert.deepEqual(activeNotices(r.list, '2026-11-01').map((n) => n.text), ['Level up!', 'No game Friday']);
  assert.deepEqual(activeNotices(r.list, '2026-11-02').map((n) => n.text), ['Level up!']);
  r = applyNotice(r.list, { remove: r.list[0].id });
  assert.equal(r.list.length, 1);
});

test('refuses empty or past notices, and keeps only the newest ten', () => {
  assert.match(applyNotice([], { add: { text: ' ' } }).error, /Write/);
  assert.match(applyNotice([], { add: { text: 'x', until: '2020-01-01' } }, 'A', '2026-10-28T00:00:00Z').error, /passed/);
  let l = [];
  for (let i = 0; i < 12; i++) l = applyNotice(l, { add: { text: `n${i}` } }).list;
  assert.equal(l.length, 10);
  assert.equal(l[0].text, 'n11');
  assert.equal(readNotices([null, { id: 'a' }]).length, 0);
});
