import test from 'node:test';
import assert from 'node:assert/strict';
import { bountyCp, bountyDue } from '../js/bounty.js';

test('bountyCp reads coin from the text', () => {
  assert.equal(bountyCp('500 gp'), 50000);
  assert.equal(bountyCp('1,000 gp, alive'), 100000);
  assert.equal(bountyCp('50 gp 5 sp'), 5050);
  assert.equal(bountyCp('200 gold pieces'), 20000);
  assert.equal(bountyCp('75'), 7500);
  assert.equal(bountyCp('a pardon'), 0);
  assert.equal(bountyCp(''), 0);
});

test('bountyDue: only when the status has just turned', () => {
  const npc = (status, extra = {}) => ({ kind: 'npc', fields: { bounty: '500 gp', bounty_by: 'the Watch', status, ...extra } });
  assert.deepEqual(bountyDue(npc('Alive'), npc('Dead')), { cp: 50000, by: 'the Watch', text: '500 gp' });
  assert.ok(bountyDue(npc('Alive'), npc('Captured')));
  assert.ok(bountyDue(null, npc('Dead')));
  assert.equal(bountyDue(npc('Dead'), npc('Dead')), null);
  assert.equal(bountyDue(npc('Captured'), npc('Dead')), null);
  assert.equal(bountyDue(npc('Alive'), npc('Missing')), null);
  assert.equal(bountyDue(npc('Alive'), npc('Dead', { bounty_paid: 'yes' })), null);
  assert.equal(bountyDue(npc('Alive'), { kind: 'npc', fields: { status: 'Dead', bounty: 'a pardon' } }), null);
  assert.equal(bountyDue(null, { kind: 'location', fields: { status: 'Dead', bounty: '5 gp' } }), null);
});

test('openBounties: the ones still to claim', async () => {
  const { openBounties } = await import('../js/bounty.js');
  const list = openBounties([
    { kind: 'npc', name: 'Jory', fields: { bounty: '500 gp', bounty_by: 'the Watch' } },
    { kind: 'npc', name: 'Fred', fields: { bounty: '50 gp' } },
    { kind: 'npc', name: 'Pete', fields: { bounty: '80 gp', status: 'Captured' } },
    { kind: 'npc', name: 'Paid', fields: { bounty: '80 gp', bounty_paid: 'x' } },
    { kind: 'npc', name: 'Nobody', fields: {} },
  ]);
  assert.deepEqual(list.map((x) => `${x.entry.name} ${x.text} ${x.by}`), ['Jory 500 gp the Watch', 'Fred 50 gp ']);
});
