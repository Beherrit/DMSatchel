import test from 'node:test';
import assert from 'node:assert/strict';
import { readTrade, addTrade, tradeText, tradeTotals, TRADE_MAX } from '../js/shop-trade.js';

test('a shop ledger', () => {
  let j = addTrade('', { who: 'Ann', dir: 'buy', item: 'Rope', qty: 2, cp: 200, at: 't1' });
  j = addTrade(j, { who: '', dir: 'sell', item: 'Lute', qty: 1, cp: 1750, at: 't2' });
  const list = readTrade(j);
  assert.deepEqual(list, [{ at: 't1', who: 'Ann', dir: 'buy', item: 'Rope', qty: 2, cp: 200 }, { at: 't2', who: '', dir: 'sell', item: 'Lute', qty: 1, cp: 1750 }]);
  assert.equal(tradeText(list[0]), 'Ann bought 2 × Rope for 2 gp');
  assert.equal(tradeText(list[1]), 'The party sold Lute for 17 gp 5 sp');
  assert.deepEqual(tradeTotals(list), { bought: 200, sold: 1750 });
  assert.deepEqual(readTrade('nope'), []); assert.deepEqual(readTrade('[{"item":"x","dir":"steal"}]'), []);
  let k = ''; for (let i = 0; i < 35; i++) k = addTrade(k, { who: 'A', dir: 'buy', item: `I${i}`, cp: 1 });
  assert.equal(readTrade(k).length, TRADE_MAX); assert.equal(readTrade(k)[0].item, 'I5');
});
