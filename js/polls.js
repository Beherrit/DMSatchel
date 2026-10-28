// Quick polls: anyone at the table asks a question with a few choices ("Where do we go next?"), members vote (and
// can change their vote), everyone sees the tally, and whoever asked (or a GM) closes it. Pure, shared.

export const MAX_OPTIONS = 8;

export function cleanPoll(p = {}) {
  const question = String(p.question || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!question) return { error: 'Write the question.' };
  const raw = Array.isArray(p.options) ? p.options : String(p.options || '').split('\n');
  const options = [...new Set(raw.map((o) => String(o).replace(/\s+/g, ' ').trim().slice(0, 100)).filter(Boolean))].slice(0, MAX_OPTIONS);
  if (options.length < 2) return { error: 'Give at least two choices.' };
  return { question, options };
}

// votes: { [memberId]: optionIndex }. A vote out of range is refused; null takes it back.
export function castVote(votes, who, choice, count) {
  const out = { ...(votes || {}) };
  if (choice === null) { delete out[who]; return { votes: out }; }
  const i = Number(choice);
  if (!Number.isInteger(i) || i < 0 || i >= count) return { error: 'That isn’t one of the choices.' };
  out[who] = i;
  return { votes: out };
}

// → { counts: [n per option], total, leaders: [indexes with the most votes] }
export function tallyPoll(poll) {
  const counts = poll.options.map(() => 0);
  for (const i of Object.values(poll.votes || {})) if (counts[i] !== undefined) counts[i]++;
  const total = counts.reduce((a, b) => a + b, 0), top = Math.max(0, ...counts);
  return { counts, total, leaders: top ? counts.map((c, i) => (c === top ? i : -1)).filter((i) => i >= 0) : [] };
}
