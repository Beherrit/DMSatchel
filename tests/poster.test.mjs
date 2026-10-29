import test from 'node:test';
import assert from 'node:assert/strict';
import { posterOf, headlineFor, MAX_ON_POSTER } from '../js/poster.js';

test('headlines in the voice of the posters', () => {
  assert.equal(headlineFor({ name: 'Wolves at the mill' }), 'BOUNTY');
  assert.equal(headlineFor({ name: 'The miller’s daughter', summary: 'She has gone missing.' }), 'MISSING');
  assert.equal(headlineFor({ name: 'Caravan to Highmoor' }), 'GUARDS WANTED');
  assert.equal(headlineFor({ name: 'A letter for the abbot' }), 'COURIER NEEDED');
  assert.equal(headlineFor({ name: 'Mend the bridge' }), 'HELP WANTED');
});

test('only posted jobs, plain text, a full board says how many more', () => {
  const town = { name: 'Brindle', fields: { ruler: 'Lady Vex' } };
  const quests = [
    { id: 'a', kind: 'quest', name: 'Wolves at the mill', summary: 'Five **grey** wolves. See [[Old Tam]].', fields: { reward: '50 gp', patron: 'Old Tam' } },
    { id: 'b', kind: 'quest', name: 'Taken already', fields: { status: 'Active' } },
    { id: 'c', kind: 'quest', name: 'Just a rumor', fields: { status: 'Rumor' } },
    { id: 'd', kind: 'npc', name: 'Not a job' },
    { id: 'e', kind: 'quest', name: 'Hidden job', visibility: 'gm' },
  ];
  const p = posterOf(town, quests, { date: '3 Thawmoon 1040' });
  assert.equal(p.title, 'Notices of Brindle'); assert.equal(p.by, 'By leave of Lady Vex'); assert.equal(p.date, '3 Thawmoon 1040');
  assert.deepEqual(p.jobs.map((j) => [j.headline, j.name, j.reward, j.ask]), [['BOUNTY', 'Wolves at the mill', '50 gp', 'Old Tam']]);
  assert.ok(!/\*|\[\[/.test(p.jobs[0].text), p.jobs[0].text);
  const many = Array.from({ length: 11 }, (_, i) => ({ id: `q${i}`, kind: 'quest', name: `Job ${String(i).padStart(2, '0')}` }));
  const full = posterOf({ name: 'X' }, many);
  assert.equal(full.jobs.length, MAX_ON_POSTER); assert.equal(full.more, 3); assert.equal(full.by, '');
});
