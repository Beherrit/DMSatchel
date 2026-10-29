import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanSay, sayOf, sayGuide, SAY_MAX } from '../js/say.js';

test('cleanSay keeps one trimmed line', () => {
  assert.equal(cleanSay('  BRAM-\n  well  '), 'BRAM- well');
  assert.equal(cleanSay(null), '');
  assert.equal(cleanSay('x'.repeat(200)).length, SAY_MAX);
  assert.equal(sayOf({ fields: { say: ' KAY-lee ' } }), 'KAY-lee');
  assert.equal(sayOf({}), '');
});

test('sayGuide groups by first letter, accents folded, others under #', () => {
  const E = (name, say) => ({ name, fields: say ? { say } : {} });
  const g = sayGuide([E('Zed', 'zed'), E('Élodie', 'ay-lo-DEE'), E('ann', 'an'), E('Bram', ''), E('3 Crowns', 'three crowns'), E('Ash', 'ash')]);
  assert.deepEqual(g.map((x) => [x.letter, x.entries.map((e) => e.name)]), [['#', ['3 Crowns']], ['A', ['ann', 'Ash']], ['E', ['Élodie']], ['Z', ['Zed']]]);
  assert.deepEqual(sayGuide([]), []);
});
