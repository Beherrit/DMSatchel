// A long rest on a character's play state (2024 rules): hit points back to the maximum, temporary hit points gone,
// spell slots back, death saves cleared, half their hit dice back (at least one), one level of exhaustion gone.
// Changes play in place and returns it. Pure, so it can be tested.
export function longRest(play, { maxhp = 0, level = 0 } = {}) {
  play.hp = maxhp; play.temp = 0; play.slots = {}; play.death = { ok: 0, fail: 0 };
  play.hd = Math.max(0, (Number(play.hd) || 0) - Math.max(1, Math.floor(level / 2)));
  play.exhaustion = Math.max(0, (Number(play.exhaustion) || 0) - 1);
  return play;
}
