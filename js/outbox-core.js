// The offline outbox: changes that couldn't be sent (no connection) wait here, newest per thing, until they can.
// Items: { key, kind: 'play' | 'note', world, id, data, at }. Only the latest change to the same thing is kept,
// since each one carries the whole new value. Pure, so it can be tested.

export const keyOf = (item) => `${item.world}|${item.kind}|${item.id}`;

export function enqueue(list, item, at = new Date().toISOString()) {
  const k = keyOf(item);
  return [...(list || []).filter((x) => keyOf(x) !== k), { ...item, key: k, at }];
}

export const remove = (list, key) => (list || []).filter((x) => x.key !== key);

// Is this error the connection, rather than the server saying no?
// (The api() helper turns a failed fetch into status 0; the player preview's refusals carry a code.)
export const isOffline = (err) => err?.status === 0 && !err.body?.code;
