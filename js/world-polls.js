// Quick polls on the world's front page: anyone asks the table a question with a few choices, members vote (and can
// change or take back their vote), everyone sees the tally and who chose what; whoever asked, or a GM, closes it.
import { el, toast, setKids, confirmButton } from './dom.js';
import { api, isGm, isMember } from './api.js';
import { tallyPoll } from './polls.js';

export function pollsCard() {
  if (!isMember()) return null;
  const box = el('section', { class: 'card polls-card', 'aria-labelledby': 'polls-h' }, el('h3', { id: 'polls-h' }, 'Quick polls'));
  let asking = false, showClosed = false;
  const act = async (fn, msg) => { try { await fn(); if (msg) toast(msg); load(); } catch (err) { toast(err.message, 'bad'); } };

  function poll(p, me) {
    const t = tallyPoll(p), mine = p.votes[me];
    return el('li', { class: `poll${p.closed ? ' closed' : ''}` },
      el('p', { class: 'poll-q' }, el('strong', {}, p.question), el('span', { class: 'muted small' }, ` · ${p.asker || 'Someone'}${p.closed ? ' · closed' : ''}`)),
      el('ul', { class: 'plain poll-options' }, p.options.map((o, i) => {
        const who = Object.entries(p.votes).filter(([, v]) => v === i).map(([k]) => p.voters[k]);
        const pct = t.total ? Math.round((t.counts[i] / t.total) * 100) : 0;
        const label = [el('span', { class: 'poll-opt' }, o, t.leaders.includes(i) && p.closed ? ' ★' : ''), el('span', { class: 'poll-n' }, `${t.counts[i]}`)];
        return el('li', {},
          p.closed ? el('div', { class: 'poll-row' }, label)
            : el('button', { class: `poll-row${mine === i ? ' chosen' : ''}`, type: 'button', 'aria-pressed': String(mine === i), onclick: () => act(() => api('party', { method: 'PATCH', body: { poll_id: p.id, vote: mine === i ? null : i } })) }, label),
          el('div', { class: 'poll-bar', 'aria-hidden': 'true' }, el('span', { style: `width:${pct}%` })),
          who.length ? el('p', { class: 'muted small poll-who' }, who.join(', ')) : null);
      })),
      el('div', { class: 'btnrow' },
        el('span', { class: 'muted small' }, `${t.total} vote${t.total === 1 ? '' : 's'}${!p.closed && mine !== undefined ? ' · press your choice again to take it back' : ''}`),
        p.mine || isGm() ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => act(() => api('party', { method: 'PATCH', body: { poll_id: p.id, closed: !p.closed } }), p.closed ? 'Reopened' : 'Closed') }, p.closed ? 'Reopen' : 'Close') : null,
        p.mine || isGm() ? confirmButton('Remove', () => act(() => api('party', { method: 'DELETE', query: { poll: p.id } }), 'Poll removed'), 'btn small ghost') : null));
  }

  function askForm() {
    const q = el('input', { type: 'text', id: 'poll-q', maxlength: 200, placeholder: 'e.g. Where do we go next?' });
    const opts = el('textarea', { id: 'poll-opts', rows: 3, placeholder: 'One choice per line\nThe crypt\nThe tower' });
    const form = el('form', { class: 'poll-form' },
      el('div', { class: 'field wide' }, el('label', { for: 'poll-q' }, 'Question'), q),
      el('div', { class: 'field wide' }, el('label', { for: 'poll-opts' }, 'Choices (one per line, up to 8)'), opts),
      el('div', { class: 'btnrow' }, el('button', { class: 'btn small primary', type: 'submit' }, 'Ask the table'), el('button', { class: 'btn small ghost', type: 'button', onclick: () => { asking = false; load(); } }, 'Cancel')));
    form.addEventListener('submit', (ev) => { ev.preventDefault(); act(async () => { await api('party', { method: 'POST', body: { poll: { question: q.value, options: opts.value } } }); asking = false; }, 'Poll posted'); });
    setTimeout(() => q.focus(), 0);
    return form;
  }

  async function load() {
    let data;
    try { data = await api('party', { query: { polls: 1 } }); } catch (err) { setKids(box, el('h3', { id: 'polls-h' }, 'Quick polls'), el('p', { class: 'muted small' }, err.message)); return; }
    const open = data.polls.filter((p) => !p.closed), closed = data.polls.filter((p) => p.closed);
    // Don't redraw under someone writing a question.
    if (box.contains(document.activeElement) && document.activeElement.matches('input, textarea')) return;
    setKids(box, el('div', { class: 'entry-head' }, el('h3', { id: 'polls-h' }, 'Quick polls'),
      asking ? null : el('button', { class: 'btn small', type: 'button', onclick: () => { asking = true; load(); } }, '+ Ask the table')),
      asking ? askForm() : null,
      open.length ? el('ul', { class: 'plain poll-list' }, open.map((p) => poll(p, String(data.me)))) : asking ? null : el('p', { class: 'muted small' }, 'No open polls. Ask the table where to go next, when to meet, or what to call the ship.'),
      closed.length ? el('button', { class: 'btn small ghost', type: 'button', 'aria-expanded': String(showClosed), onclick: () => { showClosed = !showClosed; load(); } }, `${showClosed ? 'Hide' : 'Show'} closed (${closed.length})`) : null,
      showClosed ? el('ul', { class: 'plain poll-list' }, closed.map((p) => poll(p, String(data.me)))) : null);
  }
  load();
  const timer = setInterval(() => { if (!box.isConnected) { clearInterval(timer); return; } if (!document.hidden && !asking) load(); }, 20000);
  return box;
}
