import { test } from 'node:test';
import assert from 'node:assert/strict';
import { thinSpots } from '../js/thin.js';

test('thin spots are found', () => {
  const old = '2026-01-01T00:00:00Z', now = Date.parse('2026-10-28T00:00:00Z');
  const E = (id, kind, name, x = {}) => ({ id, kind, name, summary: 'x', body: '', fields: {}, links: [], status: 'live', visibility: 'all', created_at: now - 1000, ...x });
  const entries = [
    E('r', 'region', 'Marches', { summary: '' }),
    E('t', 'settlement', 'Brindle', { parent_id: 'r' }),
    E('l', 'location', 'Inn', { parent_id: 't' }),
    E('n', 'npc', 'Mabel', { parent_id: 'l', fields: { voice: 'Husky' } }),
    E('l2', 'location', 'Empty shed', { parent_id: 't' }),
    E('n2', 'npc', 'Tom', { parent_id: 't' }),
    E('q', 'quest', 'Bell', { parent_id: 't', fields: { status: 'Active' } }),
    E('q2', 'quest', 'Done', { parent_id: 't', fields: { status: 'Completed' } }),
    E('h', 'faction', 'Red Hand', { visibility: 'gm', created_at: old }),
    E('s', 'session', 'Session 1', { summary: '' }),
    E('x', 'lore', 'Suggested', { status: 'suggested', summary: '' }),
  ];
  const r = thinSpots(entries, now);
  assert.deepEqual(r.undescribed.map((e) => e.id), ['r']);
  assert.deepEqual(r.emptyPlaces.map((e) => e.id), ['l2'], 'only the shed: Brindle has people, and the inn has Mabel');
  assert.deepEqual(r.flatNpcs.map((e) => e.id), ['n2']);
  assert.deepEqual(r.questsNoSteps.map((e) => e.id), ['q']);
  assert.deepEqual(r.longHidden.map((e) => e.id), ['h']);
  assert.deepEqual(r.unconnected.map((e) => e.id), ['h']);
});

test('missingLinks finds names that point at nothing, most mentioned first', async () => {
  const { missingLinks } = await import('../js/thin.js');
  const list = [{ id: 'a', kind: 'npc', name: 'Ann', body: 'Knows [[Bram]] and [[the  Gate|gate]].' }, { id: 'b', kind: 'npc', name: 'Cob', summary: '[[bram]] owes [[Ann]].', fields: { wants: 'To find [[The Gate]].' } },
    { id: 'c', kind: 'npc', name: 'Dee', body: '[[Ghost]]', status: 'suggested' }];
  assert.deepEqual(missingLinks(list).map((x) => [x.name, x.from.map((e) => e.id)]), [['Bram', ['a', 'b']], ['the Gate', ['a', 'b']]]);
});
