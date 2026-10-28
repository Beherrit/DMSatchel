// Handouts for one player: a hidden entry can be given to chosen members, who can then see it while everyone else
// (other players included) still can't, until it's revealed. Pure, shared by the page and the server.

export const MAX_SHARED = 30;

// The member ids an entry is shared with, cleaned: whole numbers, no repeats.
export const cleanShare = (list) => [...new Set((Array.isArray(list) ? list : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, MAX_SHARED);

export const sharedWith = (row, gmId) => gmId != null && Array.isArray(row?.shared_with) && row.shared_with.map(Number).includes(Number(gmId));
