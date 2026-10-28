// A short title for a note, from its first line ("[[Name|label]]" links read as their names). Pure.
export const titleFrom = (text) => {
  const first = String(text).trim().split(/\n/)[0].replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');
  return first.length > 60 ? `${first.slice(0, 57).replace(/\s+\S*$/, '')}…` : first || 'Note';
};
