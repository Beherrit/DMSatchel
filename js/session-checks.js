// Session hygiene: numbers missing or used twice, and logs still to write. Pure.
// sessions: session entries. → { missing: [numbers], repeated: [{ n, sessions }], unnumbered: [sessions], empty: [sessions] }
export function sessionChecks(sessions) {
  const list = (sessions || []).filter((s) => s?.kind === 'session');
  const byN = new Map(), unnumbered = [];
  for (const s of list) {
    const n = Number.parseInt(s.fields?.number, 10);
    if (!Number.isFinite(n) || n < 1) { unnumbered.push(s); continue; }
    if (!byN.has(n)) byN.set(n, []);
    byN.get(n).push(s);
  }
  const top = byN.size ? Math.max(...byN.keys()) : 0;
  const missing = Array.from({ length: top }, (_, i) => i + 1).filter((n) => !byN.has(n));
  const repeated = [...byN].filter(([, ss]) => ss.length > 1).map(([n, ss]) => ({ n, sessions: ss })).sort((a, b) => a.n - b.n);
  // Logs still to write: no log, or only a line (under 60 characters of text once links and marks are stripped).
  const words = (s) => String(s.body || '').replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1').replace(/[#>*_`-]/g, '').replace(/\s+/g, ' ').trim();
  const empty = list.filter((s) => words(s).length < 60).sort((a, b) => (Number.parseInt(b.fields?.number, 10) || 0) - (Number.parseInt(a.fields?.number, 10) || 0));
  return { missing, repeated, unnumbered, empty };
}
