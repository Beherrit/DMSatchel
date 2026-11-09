// Copy a session as text: its name, when it was played and the in-world date, then its summary and log, with
// [[links]] as plain names and Markdown marks taken out, to paste into a chat. Pure.
export function sessionText(s) {
  if (!s) return '';
  const plain = (t) => String(t || '').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/^#{1,6}\s+/gm, '').replace(/^>\s?/gm, '').trim();
  const when = [s.fields?.played_on, s.fields?.world_date].filter(Boolean).join(' · ');
  return [s.name + (when ? ` (${when})` : ''), plain(s.summary), plain(s.body), s.fields?.next ? `Next time: ${plain(s.fields.next)}` : ''].filter(Boolean).join('\n\n');
}
