// What's new in the Satchel: the shipped items of the roadmap (ROADMAP.md), newest first. Each is a numbered,
// ticked line ("203. [x] **Title.** What it does…") with its description running on in indented lines. Pure.
export function changelog(md) {
  const out = [];
  let cur = null;
  for (const line of String(md || '').split('\n')) {
    const m = /^(\d+)\.\s+\[(x| )\]\s+\*\*(.+?)\*\*\s*(.*)$/.exec(line);
    if (m) { cur = m[2] === 'x' ? { n: Number(m[1]), title: m[3].replace(/\.$/, '').trim(), text: m[4].trim() } : null; if (cur) out.push(cur); continue; }
    if (cur && /^\s{2,}\S/.test(line)) cur.text = `${cur.text} ${line.trim()}`.trim();
    else if (!line.trim() || /^#/.test(line)) cur = null;
  }
  const plain = (t) => t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return out.map((i) => ({ ...i, title: plain(i.title), text: plain(i.text) })).sort((a, b) => b.n - a.n);
}
