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
