import test from 'node:test';
import assert from 'node:assert/strict';
import { partyRows, rationsIn } from '../js/party-glance.js';

test('the party at a glance', () => {
  const rows = partyRows([
    { id: 'a', name: 'Ann', play: { hp: 7, maxhp: 30, cp: 1234, inventory: 'Rations (1 day) x5\n2 rations', exhaustion: 1, conditions: ['Poisoned'] } },
    { id: 'b', name: 'Bo', play: { hp: 0, maxhp: 12 } }, { id: 'c', name: 'Cy', play: { hp: 20, maxhp: 20 } }, { id: 'd', name: 'Di' }]);
  assert.deepEqual(rows.map((r) => [r.name, r.hp, r.max, r.low, r.down, r.cp, r.rations, r.exhaustion, r.conditions.join()]),
    [['Ann', 7, 30, true, false, 1234, 7, 1, 'Poisoned'], ['Bo', 0, 12, false, true, 0, 0, 0, ''], ['Cy', 20, 20, false, false, 0, 0, 0, ''], ['Di', 0, 0, false, false, 0, 0, 0, '']]);
  assert.equal(rationsIn('Rope'), 0);
});

test('worries before the session', async () => {
  const { worries } = await import('../js/party-glance.js');
  const rows = partyRows([
    { id: 'a', name: 'Ann', play: { hp: 7, maxhp: 30, cp: 5000, inventory: 'Rations x3', exhaustion: 2 } },
    { id: 'b', name: 'Bo', play: { hp: 0, maxhp: 12, cp: 40, inventory: 'Rations x1' } },
    { id: 'c', name: 'Cy', play: { hp: 20, maxhp: 20, cp: 900, inventory: 'Rations x9' } },
    { id: 'd', name: 'Di', play: { hp: 10, maxhp: 10, cp: 0, inventory: '' } }]);
  assert.deepEqual(worries(rows).map((w) => `${w.name} ${w.text}`), [
    'Bo is down (0 hit points)', 'Ann is low on hit points (7 of 30)', 'Ann has 2 levels of exhaustion', 'Di has no rations', 'Bo has less than a gold piece', 'Di is broke']);
  assert.deepEqual(worries([]), []);
});

test('enough food for the road', async () => {
  const { rationsFor } = await import('../js/party-glance.js');
  assert.deepEqual(rationsFor(4, [{ name: 'Ann', inventory: 'Rations x7' }, { name: 'Bo', inventory: '1 ration' }, { name: 'Cy' }]), [{ name: 'Ann', has: 7, short: 0 }, { name: 'Bo', has: 1, short: 3 }, { name: 'Cy', has: 0, short: 4 }]);
});

test('the party’s wealth', async () => {
  const { partyWealth } = await import('../js/party-glance.js');
  assert.deepEqual(partyWealth(10000, [{ cp: 500 }, { cp: 1234 }, { cp: -5 }, {}]), { total: 11734, treasury: 10000, purses: 1734 });
  assert.deepEqual(partyWealth(-200, []), { total: 0, treasury: 0, purses: 0 });
});

test('heldBy: treasury items a character holds', async () => {
  const { heldBy } = await import('../js/party-glance.js');
  const items = [{ item: 'Tent', qty: 2, holder: 'Ann' }, { item: 'Rope', qty: 1, holder: ' ann ' }, { item: 'Lute', qty: 1, holder: 'Bo' }, { item: 'Gone', qty: 0, holder: 'Ann' }];
  assert.deepEqual(heldBy(items, 'Ann').map((i) => i.item), ['Tent', 'Rope']);
  assert.deepEqual(heldBy(items, 'Cy'), []); assert.deepEqual(heldBy(null, 'Ann'), []);
});
