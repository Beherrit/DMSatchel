import test from 'node:test';
import assert from 'node:assert/strict';
import { hallOfHeroes, sessionsPlayed, hasEnded } from '../js/hall.js';

const S = (id, number, extra = {}) => ({ id, kind: 'session', name: `Session ${number}`, fields: { number: String(number), ...(extra.fields || {}) }, body: extra.body || '', links: extra.links || [], created_at: `2026-01-${String(number).padStart(2, '0')}` });
const att = (...ids) => JSON.stringify({ chars: ids.map((id) => ({ id, xp: 100, lvl: 1 })) });
const idsIn = (text) => [...String(text).matchAll(/\[\[([^\]|]+)/g)].map((m) => ({ Pip: 'p', Bo: 'b' })[m[1]]).filter(Boolean);

test('sessions played come from attendance, connections and [[mentions]], oldest first', () => {
  const p = { id: 'p', kind: 'character', name: 'Pip', fields: { status: 'Dead' } };
  const list = [p, S('s3', 3, { body: 'Then [[Pip]] fell.' }), S('s1', 1, { fields: { attendance: att('p') } }), S('s2', 2, { links: [{ id: 'p' }] }), S('s4', 4)];
  assert.deepEqual(sessionsPlayed(p, list, idsIn).map((s) => s.id), ['s1', 's2', 's3']);
});

test('the hall holds ended characters, latest farewell first', () => {
  const list = [
    { id: 'p', kind: 'character', name: 'Pip', fields: { status: 'Dead' }, updated_at: '1' },
    { id: 'b', kind: 'character', name: 'Bo', fields: { status: 'Retired' }, updated_at: '2' },
    { id: 'm', kind: 'character', name: 'Mo', fields: { status: 'Missing' }, updated_at: '3' },
    { id: 'a', kind: 'character', name: 'Al', fields: { status: 'Active' } },
    { id: 'n', kind: 'npc', name: 'Ned', fields: { status: 'Dead' } },
    S('s1', 1, { fields: { attendance: att('p', 'b') } }), S('s2', 2, { fields: { attendance: att('b') } }),
  ];
  const h = hallOfHeroes(list, idsIn);
  assert.deepEqual(h.map((x) => [x.character.id, x.sessions.length, x.last?.id ?? null]), [['b', 2, 's2'], ['p', 1, 's1'], ['m', 0, null]]);
  assert.equal(hasEnded(list[3]), false); assert.equal(hasEnded(list[4]), false);
});
