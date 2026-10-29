// "Roll" beside a field in the entry form: fills it from the app's tables. Text someone typed is only replaced on a
// second click ("Replace?"); a rolled value is simply rolled again.
import { el, toast } from './dom.js';
import { makeRng, randomSeed } from './rng.js';
import { hasRoller, rollDetail } from './roll-detail.js';

// kind(): the form's current kind; fields(): its current fields (for a place's type).
export function rollButton(kind, key, input, label, fields = () => ({})) {
  if (!hasRoller(kind(), key)) return null;
  let last = '', armed = false, timer;
  const b = el('button', { class: 'btn small ghost roll-btn', type: 'button', 'aria-label': `Roll ${label.toLowerCase()}` }, 'Roll');
  const disarm = () => { armed = false; b.textContent = 'Roll'; b.classList.remove('danger'); b.setAttribute('aria-label', `Roll ${label.toLowerCase()}`); };
  b.addEventListener('click', () => {
    const typed = input.value.trim() && input.value !== last;
    if (typed && !armed) { armed = true; b.textContent = 'Replace?'; b.setAttribute('aria-label', `Replace what’s written in ${label.toLowerCase()} with a roll?`); b.classList.add('danger'); timer = setTimeout(disarm, 3000); return; }
    clearTimeout(timer); disarm();
    const v = rollDetail(kind(), key, makeRng(randomSeed()), fields());
    if (!v) { toast('Pick a type first (a tavern, dungeon, forest, coast…), then roll.'); return; }
    input.value = last = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return b;
}
