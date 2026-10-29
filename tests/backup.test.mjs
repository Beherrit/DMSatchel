import test from 'node:test';
import assert from 'node:assert/strict';
import { readBackup, remapIds, hexId, chunks, parentsFirst, BACKUP_FORMAT } from '../js/backup.js';

const A = 'aaaaaaaaaaaaaaaa', B = 'bbbbbbbbbbbbbbbb';

test('reads new and old backups, refuses other files', () => {
  assert.equal(readBackup([{ kind: 'npc', name: 'Ann' }]).entries.length, 1);
  const r = readBackup({ format: BACKUP_FORMAT, world: { name: 'X' }, entries: [{ kind: 'npc', name: 'Ann' }, { junk: 1 }], maps: [{ name: 'M' }] });
  assert.deepEqual([r.format, r.entries.length, r.maps.length, r.ledger.length], [2, 1, 1, 0]);
  assert.ok(readBackup({ hello: 1 }).error); assert.ok(readBackup(null).error);
});

test('every entry id is replaced wherever it appears, nothing else is', () => {
  const b = readBackup({ world: { prep: { location_id: A, journey: [{ id: B }] }, start_here: [A] },
    entries: [{ id: A, kind: 'settlement', name: 'Brindle', body: 'aaaaaaaaaaaaaaaaa stays (17 a)' }, { id: B, kind: 'npc', name: 'Bram', parent_id: A, links: [{ id: A, label: 'lives in' }] }],
    maps: [{ name: 'M', entry_id: A, pins: [{ entry_id: B }] }], standing: [{ entry_id: B, value: 2 }] });
  let n = 0; const { backup: r, ids } = remapIds(b, () => `new${++n}`.padEnd(16, '0'));
  const nA = ids.get(A), nB = ids.get(B);
  assert.equal(r.entries[0].id, nA); assert.equal(r.entries[1].parent_id, nA); assert.equal(r.entries[1].links[0].id, nA);
  assert.equal(r.world.prep.location_id, nA); assert.equal(r.world.prep.journey[0].id, nB); assert.deepEqual(r.world.start_here, [nA]);
  assert.equal(r.maps[0].entry_id, nA); assert.equal(r.maps[0].pins[0].entry_id, nB); assert.equal(r.standing[0].entry_id, nB);
  assert.equal(r.entries[0].body, 'aaaaaaaaaaaaaaaaa stays (17 a)');
  assert.match(hexId(), /^[0-9a-f]{16}$/);
});

test('chunks and parents first', () => {
  assert.deepEqual(chunks([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  const list = [{ id: 'c', parent_id: 'b' }, { id: 'b', parent_id: 'a' }, { id: 'a' }, { id: 'x', parent_id: 'x' }];
  const order = parentsFirst(list).map((e) => e.id);
  assert.ok(order.indexOf('a') < order.indexOf('b') && order.indexOf('b') < order.indexOf('c'));
});
