import test from 'node:test';
import assert from 'node:assert/strict';
import { waitingOnGm } from '../js/waiting.js';

test('waitingOnGm: asks, wages owed, unpaid bounties', () => {
  const w = waitingOnGm([
    { kind: 'location', name: 'Smithy', fields: { asks: JSON.stringify([{ by: 'Ann', item: 'Grappling hook' }, { by: 'Bo', item: 'Spyglass' }]) } },
    { kind: 'location', name: 'Bakery', fields: {} },
    { kind: 'npc', name: 'Gil', fields: { hired: 'yes', wage: '2 sp', owed: '60' } },
    { kind: 'npc', name: 'Mags', fields: { hired: 'yes', wage: '2 sp' } },
    { kind: 'npc', name: 'Black Jory', fields: { status: 'Dead', bounty: '500 gp' } },
    { kind: 'npc', name: 'Paid Pete', fields: { status: 'Captured', bounty: '50 gp', bounty_paid: '2026-01-01' } },
    { kind: 'npc', name: 'Free Fred', fields: { status: 'Alive', bounty: '50 gp' } },
  ]);
  assert.deepEqual(w.asks.map((x) => `${x.shop.name}: ${x.items.join(', ')}`), ['Smithy: Grappling hook, Spyglass']);
  assert.deepEqual(w.owed.map((x) => `${x.entry.name} ${x.cp}`), ['Gil 60']);
  assert.deepEqual(w.bounties.map((x) => `${x.entry.name} ${x.cp}`), ['Black Jory 50000']);
  assert.equal(w.count, 3);
  const t = waitingOnGm([{ kind: 'location', name: 'The Bell', fields: { tab: JSON.stringify([{ who: 'Ann', item: 'Ale', qty: 2, cp: 8 }, { who: 'Bo', item: 'Pie', cp: 12 }]) } }]);
  assert.deepEqual(t.tabs.map((x) => `${x.shop.name} ${x.cp} ${x.orders}`), ['The Bell 20 2']); assert.equal(t.count, 1);
  assert.equal(waitingOnGm([]).count, 0);
});
