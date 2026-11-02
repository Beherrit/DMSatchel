import test from 'node:test';
import assert from 'node:assert/strict';
import { appearances, dueBack } from '../js/appearances.js';

const S = (n, body, links = []) => ({ id: `s${n}`, kind: 'session', name: `Session ${n}`, body, links, fields: { number: String(n) } });
const ids = (t) => new Set([...t.matchAll(/\[\[(\w+)\]\]/g)].map((m) => m[1]));

test('counts appearances and how long ago the last one was', () => {
  const seen = appearances([S(1, '[[ann]] [[bo]]'), S(2, '[[ann]]'), S(3, 'quiet', [{ id: 'cy' }]), { id: 'ann', kind: 'npc' }], ids);
  assert.deepEqual([seen.get('ann').count, seen.get('ann').ago, seen.get('ann').last.id], [2, 1, 's2']);
  assert.deepEqual([seen.get('bo').ago, seen.get('cy').ago], [2, 0]);
});

test('who could turn up again', () => {
  const seen = appearances([S(1, '[[ann]] [[bo]]'), S(2, '[[bo]]'), S(3, '[[cy]]'), S(4, 'x')], ids);
  const people = [{ id: 'ann' }, { id: 'bo' }, { id: 'cy' }, { id: 'dee', tags: ['key'] }, { id: 'eve' }];
  assert.deepEqual(dueBack(people, seen).map((p) => p.id), ['ann', 'bo', 'dee']);
});

test('sceneOf: where a session was set', async () => {
  const { sceneOf } = await import('../js/appearances.js');
  const all = { t: { id: 't', kind: 'settlement', name: 'Brindle' }, b: { id: 'b', kind: 'location', name: 'The Bell', parent_id: 't' }, m: { id: 'm', kind: 'location', name: 'The Mill' }, n: { id: 'n', kind: 'npc', name: 'Ide', parent_id: 'b' } };
  const idsIn = (text) => [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map((x) => Object.values(all).find((e) => e.name === x[1])?.id).filter(Boolean);
  const s = { body: 'At [[The Mill]] and [[Brindle]], then [[The Bell]] where [[Ide]] waited.' };
  assert.equal(sceneOf(s, idsIn, (id) => all[id], ['settlement', 'location'], all.n).name, 'The Bell');
  assert.equal(sceneOf(s, idsIn, (id) => all[id], ['settlement', 'location']).name, 'The Mill');
  assert.equal(sceneOf({ body: 'Nowhere.' }, idsIn, (id) => all[id], ['location']), null);
});
