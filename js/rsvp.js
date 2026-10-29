// Coming or not: once the next session is set, each member says "I'm coming" or "Can't make it". An answer belongs
// to the date it was given for, so moving the session asks everyone again. Pure, shared by the server and tests.

export const ANSWERS = ['yes', 'no'];
const same = (a, b) => Boolean(a && b) && Date.parse(a) === Date.parse(b);

// members: [{ id, name, rsvp: { for, answer } }] → { mine, yes: [names], no: [names], waiting: [names] }.
export function rsvpSummary(members, next, myId) {
  const out = { mine: null, yes: [], no: [], waiting: [] };
  for (const m of members || []) {
    const a = same(m.rsvp?.for, next) && ANSWERS.includes(m.rsvp?.answer) ? m.rsvp.answer : null;
    if (m.id === myId) out.mine = a;
    (a ? out[a] : out.waiting).push(m.name);
  }
  for (const k of ['yes', 'no', 'waiting']) out[k].sort((x, y) => x.localeCompare(y));
  return out;
}

// Is there a session to answer for (set, and not more than a day past)?
export const rsvpOpen = (next, now = Date.now()) => Boolean(next) && Date.parse(next) > now - 86400000;
