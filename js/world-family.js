// Family trees: relatives on NPC and character pages, a tree for each clan or house, and #world/family/<id>.
import { el, toast } from './dom.js';
import { isGm } from './api.js';
import { worldEntries, getEntry, link, createEntry, patchEntry, findByName, nameList, notice } from './world-store.js';
import { familyOf, relativesOf, layout } from './family.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const PEOPLE = ['npc', 'character', 'deity'];

export function treeSvg(ids, focusId) {
  const entries = worldEntries();
  const { rows, pos, parents, spouses } = layout(ids, entries);
  const W = 170, H = 54, GX = 30, GY = 70;
  const width = Math.max(...rows.map((r) => r.length)) * (W + GX) + GX;
  const height = rows.length * (H + GY) + GY - 20;
  // Centre each row.
  const x = (id) => { const p = pos.get(id); const row = rows[p.y]; return (width - row.length * (W + GX) + GX) / 2 + p.x * (W + GX); };
  const y = (id) => 20 + pos.get(id).y * (H + GY);
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, width, height, class: 'tree-svg', role: 'group', 'aria-label': 'Family tree' });
  for (const [a, b] of spouses) {
    if (pos.get(a).y !== pos.get(b).y) continue;
    const [l, r] = x(a) < x(b) ? [a, b] : [b, a];
    svg.append(svgEl('line', { x1: x(l) + W, y1: y(l) + H / 2, x2: x(r), y2: y(r) + H / 2, class: 'tree-spouse' }));
  }
  // Each child hangs from the midpoint of its parents (or its one parent).
  const kids = new Map();
  for (const [p, c] of parents) { if (!kids.has(c)) kids.set(c, []); kids.get(c).push(p); }
  for (const [c, ps] of kids) {
    const px = ps.reduce((t, p) => t + x(p) + W / 2, 0) / ps.length, py = Math.max(...ps.map((p) => y(p) + (ps.length > 1 ? H / 2 : H)));
    const cx = x(c) + W / 2, cy = y(c), mid = cy - GY / 2;
    svg.append(svgEl('path', { d: `M${px} ${py} V${mid} H${cx} V${cy}`, class: 'tree-line' }));
  }
  for (const id of ids) {
    const e = getEntry(id); if (!e || !pos.has(id)) continue;
    const g = svgEl('a', { href: `#world/e/${id}`, class: `tree-node k-${e.kind}${id === focusId ? ' focus' : ''}` });
    g.append(svgEl('rect', { x: x(id), y: y(id), width: W, height: H, rx: 8 }));
    const t1 = svgEl('text', { x: x(id) + W / 2, y: y(id) + 22, 'text-anchor': 'middle', class: 'tree-name' }); t1.textContent = e.name.length > 22 ? `${e.name.slice(0, 21)}…` : e.name;
    const sub = [e.fields?.role || e.fields?.class, e.fields?.status && !['Alive', 'Active'].includes(e.fields.status) ? e.fields.status : ''].filter(Boolean).join(' · ');
    const t2 = svgEl('text', { x: x(id) + W / 2, y: y(id) + 40, 'text-anchor': 'middle', class: 'tree-sub' }); t2.textContent = sub.length > 26 ? `${sub.slice(0, 25)}…` : sub;
    g.append(t1, t2);
    svg.append(g);
  }
  return el('div', { class: 'tree-wrap' }, svg);
}

// "Add a relative": link to someone who exists, or create them (in the same place, and the same house).
function addRelative(person, rerender, clan) {
  const rel = el('select', { 'aria-label': 'Relation' }, [['parent of', 'Their child'], ['child of', 'Their parent'], ['married to', 'Their spouse'], ['sibling of', 'Their sibling']].map(([v, t]) => el('option', { value: v }, t)));
  const name = el('input', { type: 'text', list: 'w-names', placeholder: 'Name (someone in the world, or a new person)', 'aria-label': 'Name' });
  const form = el('form', { class: 'controls family-add' }, rel, name, el('button', { class: 'btn small primary', type: 'submit' }, 'Add'), nameList());
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const n = name.value.trim(); if (!n) { name.focus(); return; }
    try {
      let other = findByName(n);
      if (other && !PEOPLE.includes(other.kind)) { toast(`${other.name} isn’t a person.`, 'bad'); return; }
      if (!other) other = await createEntry({ kind: 'npc', name: n, parent_id: PEOPLE.includes(person.kind) ? person.parent_id : null, fields: { status: 'Alive' }, links: clan ? [{ id: clan.id, label: 'member of' }] : [] });
      // "parent of" here reads from the person's side: the new one is their child, so the person is the parent.
      await patchEntry(getEntry(person.id), { links: [...(getEntry(person.id).links || []), { id: other.id, label: rel.value, secret: false }] });
      // A new child of someone with one spouse is that spouse's child too.
      const spouses = relativesOf(person.id, worldEntries()).spouses;
      if (rel.value === 'parent of' && spouses.length === 1 && !relativesOf(other.id, worldEntries()).parents.includes(spouses[0])) {
        await patchEntry(getEntry(other.id), { links: [...(getEntry(other.id).links || []), { id: spouses[0], label: 'child of', secret: false }] });
      }
      toast(`Added ${other.name}`); rerender();
    } catch (err) { toast(err.message, 'bad'); }
  });
  return form;
}

// The Family section on a person's page.
export function familySection(e, rerender) {
  const r = relativesOf(e.id, worldEntries());
  const any = r.parents.length + r.children.length + r.spouses.length + r.siblings.length;
  if (!any && !isGm() && !e.can_edit) return null;
  const line = (label, ids) => (ids.length ? el('p', {}, el('span', { class: 'rel' }, `${label}: `), ids.map((id) => getEntry(id)).filter(Boolean).flatMap((p, i) => [i ? ', ' : '', link(p)])) : null);
  return el('section', { class: 'card family-card' },
    el('div', { class: 'entry-head' }, el('h3', {}, 'Family'), any ? el('a', { class: 'small', href: `#world/family/${e.id}` }, 'Family tree') : null),
    any ? [line('Parents', r.parents), line(r.spouses.length > 1 ? 'Spouses' : 'Spouse', r.spouses), line('Siblings', r.siblings), line('Children', r.children)] : el('p', { class: 'muted small' }, 'No family recorded yet.'),
    isGm() || e.can_edit ? addRelative(e, rerender) : null);
}

// Members of a clan or house: people who are "member of" it or listed inside it, plus their families.
export function clanMembers(clan) {
  const all = worldEntries();
  const direct = all.filter((p) => PEOPLE.includes(p.kind) && (p.parent_id === clan.id || (p.links || []).some((l) => l.id === clan.id && /member of|leads/i.test(l.label))));
  const ids = new Set();
  for (const p of direct) for (const id of familyOf(p.id, all)) ids.add(id);
  return { direct, ids: [...ids] };
}

export function clanTree(clan, rerender) {
  const { direct, ids } = clanMembers(clan);
  const head = direct[0];
  return el('section', { class: 'card family-card' },
    el('h3', {}, `The ${clan.name} family tree`),
    ids.length ? treeSvg(ids) : el('p', { class: 'muted' }, 'No members yet. Add someone as “member of” this house, then add their relatives.'),
    isGm() ? el('div', {}, el('p', { class: 'muted small' }, head ? `Add a relative of ${head.name}, or open anyone’s page to add theirs.` : 'Add the first member:'),
      head ? addRelative(head, rerender, clan) : firstMember(clan, rerender)) : null);
}

function firstMember(clan, rerender) {
  const name = el('input', { type: 'text', placeholder: 'Head of the family', 'aria-label': 'Name' });
  const form = el('form', { class: 'controls family-add' }, name, el('button', { class: 'btn small primary', type: 'submit' }, 'Add member'));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); if (!name.value.trim()) return;
    try { await createEntry({ kind: 'npc', name: name.value.trim(), fields: { status: 'Alive', role: `Head of ${clan.name}` }, links: [{ id: clan.id, label: 'member of' }] }); rerender(); } catch (err) { toast(err.message, 'bad'); }
  });
  return form;
}

export function viewFamily(id) {
  const e = getEntry(id);
  if (!e) return notice('Not found', 'That person isn’t in the world.');
  const ids = [...familyOf(id, worldEntries())];
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, `${e.name}’s family`), el('p', {}, 'Everyone related by blood or marriage. Click a name to open their page.')),
    ids.length > 1 ? treeSvg(ids, id) : notice('No family yet', `Add parents, children or a spouse on ${e.name}’s page.`),
    el('p', {}, link(e, `Back to ${e.name}`)));
}
