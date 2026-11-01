import test from 'node:test';
import assert from 'node:assert/strict';
import { standingPct, openStanding, shopStanding } from '../js/standing-price.js';

test('friends get a discount', () => {
  assert.deepEqual([5, 3, 2, 0, -2, -3, -5].map(standingPct), [-10, -10, 0, 0, 0, 10, 10]);
  const log = [{ entry_id: 'g', value: 4, secret: true }, { entry_id: 'g', value: 3 }, { entry_id: 'g', value: 0 }];
  assert.equal(openStanding(log, 'g'), 3, 'GM-only changes don’t count'); assert.equal(openStanding(log, 'x'), 0);
  const entries = [{ id: 'g', kind: 'guild', name: 'Coin Guild' }, { id: 't', kind: 'settlement', name: 'Brindle', fields: { ruler: 'Coin Guild' } }, { id: 's', kind: 'location', name: 'Smithy', parent_id: 't' }, { id: 'x', kind: 'location', name: 'Lone Hut' }];
  assert.deepEqual((({ holder, value, pct }) => [holder.id, value, pct])(shopStanding(entries[2], entries, log)), ['g', 3, -10]);
  assert.equal(shopStanding(entries[3], entries, log), null);
});

test('friends buy dear', async () => {
  const { sellWithStanding } = await import('../js/standing-price.js');
  assert.equal(sellWithStanding(100, -10), 110); assert.equal(sellWithStanding(100, 10), 90); assert.equal(sellWithStanding(100, 0), 100); assert.equal(sellWithStanding(1, 10), 1);
});
