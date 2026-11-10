import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneLine } from '../js/scene.js';

test('sceneLine sets the scene in one line', () => {
  assert.equal(sceneLine({ place: 'Brindle', part: 'evening', weather: 'Heavy rain, 18°C (64°F), wind calm or light.' }), 'Evening in Brindle: heavy rain, 18°C (64°F).');
  assert.equal(sceneLine({ place: 'Brindle', part: 'night', weather: 'Clear, 5°C (41°F), wind strong.', moon: 'Full moon: bright enough to read by outdoors.', lights: ['Torch'], holiday: 'Bridge Day' }),
    'Night in Brindle: clear, 5°C (41°F), wind strong. Full moon: bright enough to read by outdoors. The party’s torch is burning. It’s Bridge Day: the shops are shut and the taverns are full.'.replace(/’/g, "'"));
  assert.equal(sceneLine({}), '');
});

test('sceneLine: market-day crowds by day, not at night or on a holiday', () => {
  assert.match(sceneLine({ place: 'Brindle', part: 'morning', market: true }), /It's market day: the square is busy with stalls\./);
  assert.match(sceneLine({ place: 'Brindle', part: 'dawn', market: true }), /stalls going up/);
  assert.doesNotMatch(sceneLine({ place: 'Brindle', part: 'night', market: true }), /market/);
  assert.doesNotMatch(sceneLine({ place: 'Brindle', part: 'morning', market: true, holiday: 'Bridge Day' }), /market/);
});
