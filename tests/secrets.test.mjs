import test from 'node:test';
import assert from 'node:assert/strict';
import { applySecret, sortSecrets, secretsAbout, readSecrets } from '../js/secrets.js';

test('add, find, unfind, edit and remove', () => {
  let r = applySecret([], { add: '  The [[Mayor]] is   a doppelganger ' }, 'Ann', 't1');
  assert.equal(r.list[0].text, 'The [[Mayor]] is a doppelganger');
  const id = r.list[0].id;
  r = applySecret(r.list, { add: 'The well is poisoned' }, 'Ann', 't2');
  r = applySecret(r.list, { id, found: true, session: 4 }, 'Bo', 't3');
  assert.deepEqual([r.list[0].found_in, r.list[0].found_by, r.list[0].found_at], ['4', 'Bo', 't3']);
  assert.deepEqual(sortSecrets(r.list).open.map((s) => s.text), ['The well is poisoned']);
  r = applySecret(r.list, { id, found: false }, 'Bo');
  assert.equal(r.list[0].found_at, undefined);
  r = applySecret(r.list, { id, text: 'The [[mayor|Mayor Vane]] is a spy' }, 'Bo');
  assert.equal(secretsAbout(r.list, 'Mayor').length, 1);
  assert.equal(secretsAbout(r.list, 'Well').length, 0);
  r = applySecret(r.list, { remove: id }, 'Bo');
  assert.equal(r.list.length, 1);
});

test('bad operations are refused', () => {
  assert.match(applySecret([], { add: ' ' }).error, /Write/);
  assert.match(applySecret([], { id: 'nope', found: true }).error, /removed/);
  const r = applySecret([], { add: 'x' });
  assert.match(applySecret(r.list, { id: r.list[0].id, text: '' }).error, /empty/);
  assert.equal(readSecrets([null, { id: 'a' }, { id: 'b', text: 'ok' }]).length, 1);
});
