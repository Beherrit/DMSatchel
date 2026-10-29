import test from 'node:test';
import assert from 'node:assert/strict';
import { castList } from '../js/cast.js';

test('people met in the session log, alphabetical, with how often and when last', () => {
  const S = (id, n, body, links = []) => ({ id, kind: 'session', name: `Session ${n}`, fields: { number: String(n) }, body, links });
  const list = [{ id: 'b', kind: 'npc', name: 'bram' }, { id: 'a', kind: 'npc', name: 'Ann' }, { id: 'c', kind: 'npc', name: 'Cob' }, { id: 't', kind: 'settlement', name: 'Brindle' },
    S('s1', 1, 'Met [[Bram]] in [[Brindle]].'), S('s2', 2, 'Bram again.', [{ id: 'a' }, { id: 'b' }])];
  const names = { Bram: 'b', Brindle: 't' };
  const idsIn = (t) => [...String(t).matchAll(/\[\[([^\]|]+)/g)].map((m) => names[m[1]]).filter(Boolean);
  assert.deepEqual(castList(list, idsIn).map((x) => [x.entry.name, x.count, x.last.id]), [['Ann', 1, 's2'], ['bram', 2, 's2']]);
});
