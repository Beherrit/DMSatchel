// Stay the night: at a tavern with a bill of fare (menu.js), the party takes rooms; each character pays the room's
// price from their own coin (never going below nothing), and the clock moves on to morning. Pure, so it can be tested.

export const MORNING = 8 * 60; // 8 in the morning, in minutes after midnight

// The beds on the menu: [{ name, cp }] from its "For the night" section, without the stabling.
export const roomsOf = (menu) => (menu?.sections || []).find((s) => /night/i.test(s.title))?.items.filter((x) => !/stabl/i.test(x.name)) || [];

// chars: [{ id, name, cp }] → [{ id, name, paid, short }]
export const nightCosts = (chars, cp) => (chars || []).map((c) => { const paid = Math.max(0, Math.min(cp, Math.round(Number(c.cp) || 0))); return { id: c.id, name: c.name, paid, short: cp - paid }; });

// Minutes from now (minutes after midnight) until the next morning.
export function minutesToMorning(now) {
  const m = ((Math.round(Number(now) || 0) % 1440) + 1440) % 1440;
  return m < MORNING - 120 ? MORNING - m : 1440 - m + MORNING; // before 6 am, it's this morning
}
