import test from 'node:test';
import assert from 'node:assert/strict';
import { controllers, powerSlots } from '../js/control.js';

test('a place is held by its own connection or field, else by the place around it', () => {
  const list = [
    { id: 'f', kind: 'faction', name: 'The Silver Hand' }, { id: 'g', kind: 'guild', name: 'Weavers' }, { id: 'n', kind: 'npc', name: 'Lord Bram' },
    { id: 'r', kind: 'region', name: 'Marches', fields: { ruler: 'silver hand' } },
    { id: 't', kind: 'settlement', name: 'Brindle', parent_id: 'r' },
    { id: 'i', kind: 'location', name: 'Mill', parent_id: 't', links: [{ id: 'g', label: 'owned by' }] },
    { id: 'k', kind: 'settlement', name: 'Keep', fields: { ruler: 'Lord Bram' } },
    { id: 'x', kind: 'location', name: 'Loop', parent_id: 'y' }, { id: 'y', kind: 'location', name: 'Loop2', parent_id: 'x' },
  ];
  const c = controllers(list);
  const who = (id) => (c.get(id) ? `${c.get(id).by.id}${c.get(id).inherited ? '*' : ''}` : '-');
  assert.deepEqual(['r', 't', 'i', 'k', 'x'].map(who), ['f', 'f*', 'g', '-', '-']);
});

test('colour slots follow the power, eight then other', () => {
  const powers = 'ABCDEFGHIJ'.split('').map((n) => ({ id: n, kind: 'faction', name: `House ${n}` }));
  const s = powerSlots([...powers].reverse());
  assert.deepEqual([s.get('A'), s.get('H'), s.get('I'), s.get('J')], [0, 7, -1, -1]);
});
