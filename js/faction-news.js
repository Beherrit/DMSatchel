// Faction news: after a faction turn, a ready-made notice for the players about what visibly changed. Only clocks
// players can see count (not secret, on a power they can see); nothing says how close a plan is in numbers. Pure,
// so it can be tested. getEntry(id) → the entry, or nothing.

export function factionNews(moved, getEntry) {
  const seen = (moved || []).filter((c) => !c.secret).map((c) => ({ c, e: getEntry(c.entry_id) })).filter(({ e }) => e && e.visibility !== 'gm' && e.status !== 'suggested');
  const done = seen.filter(({ c }) => c.filled >= c.size), going = seen.filter(({ c }) => c.filled < c.size);
  const lines = [
    ...done.map(({ c, e }) => `${e.name}: “${c.name}” has come to pass.`),
    ...going.map(({ c, e }) => `${e.name}: “${c.name}” draws closer.`),
  ];
  if (!lines.length) return '';
  const head = 'News from across the land:';
  let text = head;
  for (const l of lines) { if ((`${text}\n${l}`).length > 480) { text += '\n…and more.'; break; } text += `\n${l}`; }
  return text;
}
