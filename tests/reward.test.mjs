import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReward } from '../js/reward.js';

test('coin and items from a reward line', () => {
  assert.deepEqual(parseReward('200 gp, a +1 longsword and 3 potions of healing'), { cp: 20000, items: [{ item: '+1 longsword', qty: 1 }, { item: 'potions of healing', qty: 3 }] });
});

test('coin words, mixed coins, links and "each"', () => {
  assert.deepEqual(parseReward('50 gold pieces each plus 2 silver and the [[Bell of Brindle|town bell]]'), { cp: 5020, items: [{ item: 'town bell', qty: 1 }] });
  assert.deepEqual(parseReward('1,500 gp'), { cp: 150000, items: [] });
  assert.deepEqual(parseReward('two horses; a favor from the Duke'), { cp: 0, items: [{ item: 'horses', qty: 2 }, { item: 'favor from the Duke', qty: 1 }] });
  assert.deepEqual(parseReward(''), { cp: 0, items: [] });
});
