import test from 'node:test';
import assert from 'node:assert/strict';
import { partyPin } from '../js/party-pin.js';

test('the party shows at its own place, or the nearest place pinned above it', () => {
  const pins = [{ id: 'p1', entry_id: 'town' }, { id: 'p2', entry_id: 'region' }];
  assert.deepEqual(partyPin(pins, ['inn', 'town', 'region']), { pin: pins[0], exact: false });
  assert.deepEqual(partyPin(pins, ['town', 'region']), { pin: pins[0], exact: true });
  assert.equal(partyPin(pins, ['elsewhere']), null);
  assert.equal(partyPin(pins, []), null);
});
