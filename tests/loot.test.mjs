import test from 'node:test';
import assert from 'node:assert/strict';
import { rollLoot, lootLog, tierForCR } from '../js/loot.js';
import { makeRng } from '../js/rng.js';

test('treasure from a fight', () => {
  assert.deepEqual([0, 4, 5, 10, 11, 17, 30].map(tierForCR), [0, 0, 1, 1, 2, 3, 3]);
  for (let s = 0; s < 50; s++) {
    const l = rollLoot(makeRng(`l${s}`), { tier: s % 4, hoard: s % 2 === 0 });
    assert.ok(l.coins.length >= 1 && l.total > 0);
    const log = lootLog(l, 'After the fight');
    const cp = log.filter((x) => x.cp).reduce((t, x) => t + x.cp, 0);
    assert.ok(cp > 0, 'coins go in as one amount');
    assert.equal(log.filter((x) => x.item).length, l.vals.length + l.items.length + (l.extra ? 1 : 0));
    for (const x of log) if (x.item) assert.ok(x.qty >= 1 && !/^\d+ × /.test(x.item));
  }
});
