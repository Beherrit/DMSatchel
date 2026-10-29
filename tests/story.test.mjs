import test from 'node:test';
import assert from 'node:assert/strict';
import { storyOf, storyEmpty } from '../js/story.js';

test('a character’s sessions, finished quests, goals, wishes and items', () => {
  const pip = { id: 'p', kind: 'character', name: 'Pip', fields: { goals: JSON.stringify([{ id: 'g1', text: 'Find Mum', state: 'done' }, { id: 'g2', text: 'Get rich', state: 'open' }]), wishes: JSON.stringify([{ id: 'w', text: 'A ship', got: true }]) } };
  const att = JSON.stringify({ chars: [{ id: 'p', xp: 0, lvl: 1 }] });
  const list = [pip,
    { id: 's1', kind: 'session', name: 'Session 1', fields: { number: '1', attendance: att } }, { id: 's2', kind: 'session', name: 'Session 2', fields: { number: '2' }, body: '[[Pip]] stayed home.' },
    { id: 'q1', kind: 'quest', name: 'Ring the Bell', fields: { status: 'Completed' }, links: [{ id: 'p' }] }, { id: 'q2', kind: 'quest', name: 'Other', fields: { status: 'Completed' } },
    { id: 'q3', kind: 'quest', name: 'Ongoing', fields: { status: 'Active' }, links: [{ id: 'p' }] },
    { id: 'i', kind: 'item', name: 'Cloak', fields: { holder: 'pip' } }];
  const idsIn = (t) => (String(t).includes('[[Pip]]') ? ['p'] : []);
  const s = storyOf(pip, list, idsIn);
  assert.deepEqual([s.sessions.map((x) => x.id), s.quests.map((x) => x.id), s.goals.map((g) => g.id), s.wishes.length, s.items.map((x) => x.id)], [['s1', 's2'], ['q1'], ['g1'], 1, ['i']]);
  assert.equal(storyEmpty(storyOf({ id: 'z', name: 'Z', fields: {} }, [])), true);
});
