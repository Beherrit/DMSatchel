// A day on the road: after travel on a map, a party journal draft of the journey: where from and to, how far, how
// many days at what pace, the weather they set out in, and whether rations were eaten. Pure, so it can be tested.

// trip: { from, to, miles, days, pace, weather, slowed, arrived (in-world date text) }; ate: rations eaten per head.
export function roadJournal(trip, ate = 0) {
  const d = trip.days, pace = String(trip.pace || 'normal').toLowerCase();
  const lines = [
    `The party travelled from ${trip.from} to ${trip.to}: ${Math.round(trip.miles)} miles in ${d} day${d === 1 ? '' : 's'} at a ${pace} pace.`,
    trip.weather ? `They set out in ${((w) => w.charAt(0).toLowerCase() + w.slice(1))(trip.weather.replace(/\.$/, ''))}${trip.slowed ? `, and ${trip.slowed} slowed them down` : ''}.` : null,
    ate ? `Each ate ${ate} day${ate === 1 ? '' : 's'}’ worth of rations on the way.` : null,
    '', '_What happened on the road: who they met, what they saw, what went wrong._',
  ].filter((l) => l !== null);
  return { kind: 'journal', name: `On the road to ${trip.to}`, summary: '', body: lines.join('\n'), visibility: 'all',
    fields: { kind: 'Party notes', ...(trip.arrived ? { date: trip.arrived } : {}) } };
}
