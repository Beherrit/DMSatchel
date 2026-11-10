// Set the scene: one line for the GM to read out where the party is, from the time, the weather, the light and any
// festival. Pure. → "Evening in Brindle: heavy rain, 18°C (64°F). Bridge Day: the taverns are full."
// market: it's the town's market day (said by day only, and never on a holiday).
export function sceneLine({ place = '', part = '', weather = '', moon = '', holiday = '', lights = [], market = false } = {}) {
  if (!place) return '';
  const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
  const sky = String(weather || '').replace(/[.\s]+$/, '').replace(/,?\s*wind calm or light$/i, '');
  const bits = [`${cap(part || 'now')} in ${place}${sky ? `: ${sky[0].toLowerCase()}${sky.slice(1)}` : ''}.`];
  if (moon) bits.push(`${cap(String(moon).replace(/[.\s]+$/, ''))}.`);
  if (lights.length) bits.push(`${lights.length === 1 ? `The party's ${lights[0].toLowerCase()} is` : `The party's lights are`} burning.`);
  if (holiday) bits.push(`It's ${holiday}: the shops are shut and the taverns are full.`);
  else if (market && /^(dawn|morning|midday|afternoon)$/.test(part)) bits.push(`It's market day: the square is busy with stalls${part === 'dawn' ? ' going up' : ''}.`);
  return bits.join(' ');
}
