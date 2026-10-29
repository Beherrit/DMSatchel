import test from 'node:test';
import assert from 'node:assert/strict';
import { wallPictures, filterWall, wallFacets } from '../js/picture-wall.js';

const E = (id, kind, name, fields = {}, tags = []) => ({ id, kind, name, fields, tags });
const gallery = (...srcs) => JSON.stringify(srcs.map((src) => ({ src, caption: `of ${src}` })));

test('main pictures, galleries and maps, each once, entries by name then maps', () => {
  const list = [E('b', 'settlement', 'Brindle', { image: '/api/images?id=00000000000000a1', gallery: gallery('/api/images?id=00000000000000a2', '/api/images?id=00000000000000a1') }, ['north']),
    E('a', 'npc', 'Ann', { image: 'https://x.test/a.png' }), E('c', 'npc', 'Cob', { image: 'javascript:alert(1)' })];
  const pics = wallPictures(list, [{ id: 'm1', name: 'Marches', version: 2 }], (m) => `/api/maps?id=${m.id}&image=1&v=${m.version}`);
  assert.deepEqual(pics.map((p) => [p.src, p.entry?.id || p.map.id, p.caption]), [
    ['https://x.test/a.png', 'a', ''], ['/api/images?id=00000000000000a1', 'b', ''], ['/api/images?id=00000000000000a2', 'b', 'of /api/images?id=00000000000000a2'], ['/api/maps?id=m1&image=1&v=2', 'm1', '']]);
  assert.deepEqual(filterWall(pics, { kind: 'settlement' }).length, 2);
  assert.deepEqual(filterWall(pics, { tag: 'north' }).length, 2);
  assert.deepEqual(filterWall(pics, { kind: 'map' }).length, 1);
  assert.deepEqual(wallFacets(pics), { kinds: [['settlement', 2], ['map', 1], ['npc', 1]], tags: [['north', 2]] });
});
