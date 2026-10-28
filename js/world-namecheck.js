// Is that name taken? Under the name field of the entry form: says (politely, without stopping anyone) when the world
// already has an entry with that name, or one close to it, with links to check before making a second Brindle.
import { el, setKids } from './dom.js';
import { worldEntries, link, kindLabel } from './world-store.js';
import { similarNames } from './name-check.js';

export function nameCheck(input, selfId) {
  const box = el('p', { class: 'name-check small', 'aria-live': 'polite' });
  let timer = null, last = '';
  const run = () => {
    const v = input.value.trim();
    if (v === last) return;
    last = v;
    const { exact, close } = similarNames(v, worldEntries().filter((e) => !e.deleted), selfId);
    const item = (e) => [link(e), el('span', { class: 'muted' }, ` (${kindLabel(e.kind)})`)];
    const join = (list) => list.flatMap((e, i) => [i ? ', ' : '', ...item(e)]);
    setKids(box, exact.length ? ['⚠ Already in the world: ', ...join(exact), '. Pick another name, or open that one instead.']
      : close.length ? ['Similar names: ', ...join(close), '.'] : []);
    box.classList.toggle('warn', exact.length > 0);
  };
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 250); });
  input.addEventListener('blur', run);
  input.after(box);
  if (input.value.trim()) setTimeout(run, 0);
  return box;
}
