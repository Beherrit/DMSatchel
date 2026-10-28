import test from 'node:test';
import assert from 'node:assert/strict';
import { copyLevels, copyOf, contentsCount } from '../js/copy-place.js';

const E = (id, kind, parent_id = null, extra = {}) => ({ id, kind, name: id, parent_id, fields: {}, tags: [], links: [], ...extra });
const world = [E('t', 'settlement'), E('inn', 'location', 't'), E('ann', 'npc', 'inn'), E('bo', 'npc', 't'), E('pc', 'character', 't'), E('sug', 'npc', 't', { status: 'suggested' }), E('far', 'npc', 'x')];

test('a place first, then what is inside it, level by level; no player characters or suggestions', () => {
  const levels = copyLevels(world[0], world);
  assert.deepEqual(levels.map((l) => l.map((e) => e.id)), [['t'], ['inn', 'bo'], ['ann']]);
  assert.deepEqual(contentsCount(levels), { location: 1, npc: 2 });
});

test('copies go inside copies, links follow, personal state stays behind', () => {
  const made = new Map([['t', 'T2'], ['inn', 'INN2']]);
  const ann = E('ann', 'npc', 'inn', { links: [{ id: 'bo', label: 'sister of' }, { id: 'far', label: 'owes' }], fields: { role: 'Cook', attitudes: '{}', gallery: '[]' }, tags: ['key'] });
  made.set('bo', 'BO2');
  const c = copyOf(ann, made, { hide: true });
  assert.equal(c.parent_id, 'INN2');
  assert.deepEqual(c.links.map((l) => l.id), ['BO2', 'far']);
  assert.deepEqual(c.fields, { role: 'Cook' });
  assert.deepEqual(c.tags, ['key', 'copied']);
  assert.equal(c.visibility, 'gm');
  assert.equal(copyOf(E('t', 'settlement', 'region'), new Map(), { name: 'Sedge' }).parent_id, 'region');
});
