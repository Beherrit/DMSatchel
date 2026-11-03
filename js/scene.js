// Set the scene: one line for the GM to read out where the party is, from the time, the weather, the light and any
// festival. Pure. → "Evening in Brindle: heavy rain, 18°C (64°F). Bridge Day: the taverns are full."
export function sceneLine({ place = '', part = '', weather = '', moon = '', holiday = '', lights = [] } = {}) {
  if (!place) return '';
  const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
  const sky = String(weather || '').replace(/[.\s]+$/, '').replace(/,?\s*wind calm or light$/i, '');
  const bits = [`${cap(part || 'now')} in ${place}${sky ? `: ${sky[0].toLowerCase()}${sky.slice(1)}` : ''}.`];
  if (moon) bits.push(`${cap(String(moon).replace(/[.\s]+$/, ''))}.`);
  if (lights.length) bits.push(`${lights.length === 1 ? `The party's ${lights[0].toLowerCase()} is` : `The party's lights are`} burning.`);
  if (holiday) bits.push(`It's ${holiday}: the shops are shut and the taverns are full.`);
  return bits.join(' ');
}
