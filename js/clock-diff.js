// What changed when time moves: two snapshots of a town (before and after the clock moved), as
// { shops: [{ id, name, open }], people: [{ id, name, place }] } (place: a name, or null when they're not about),
// → { opened: [names], shut: [names], moved: [{ name, from, to }] }. Pure.
export function clockDiff(before, after) {
  const was = new Map((before?.shops || []).map((s) => [s.id, s.open]));
  const opened = [], shut = [], moved = [];
  for (const s of after?.shops || []) {
    if (!was.has(s.id) || was.get(s.id) === s.open) continue;
    (s.open ? opened : shut).push(s.name);
  }
  const at = new Map((before?.people || []).map((p) => [p.id, p.place]));
  const ids = new Set([...(before?.people || []), ...(after?.people || [])].map((p) => p.id));
  const now = new Map((after?.people || []).map((p) => [p.id, p]));
  const prev = new Map((before?.people || []).map((p) => [p.id, p]));
  for (const id of ids) {
    const from = at.get(id) ?? null, to = now.get(id)?.place ?? null;
    if (from !== to) moved.push({ name: (now.get(id) || prev.get(id)).name, from, to });
  }
  return { opened, shut, moved: moved.sort((a, b) => a.name.localeCompare(b.name)) };
}

// In a line: "the Smithy opened; the Bell shut; Ada went to the Bell; Bram left".
export function diffText({ opened, shut, moved }, max = 5) {
  const bits = [
    ...opened.map((n) => `${n} opened`), ...shut.map((n) => `${n} shut`),
    ...moved.map((m) => (m.to ? `${m.name} went to ${m.to}` : `${m.name} left`)),
  ];
  return bits.length > max ? `${bits.slice(0, max).join('; ')} and ${bits.length - max} more` : bits.join('; ');
}
