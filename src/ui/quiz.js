// Preguntes numèriques amb autocorrecció, pistes i solució després de 2 intents.
import { parseNum, isClose, fmt } from '../lib/format.js';
import { tex } from '../lib/tex.js';
import { esc } from '../circuit/svg.js';

/** Crea una pregunta. label/explain poden contindre TeX entre $...$ */
export function Q(id, label, unit, answer, opts = {}) {
  return { id, label, unit, answer, focus: [], reveal: [], ...opts };
}

/** Converteix "text amb $tex$" a HTML */
export function rich(s) {
  return String(s)
    .split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g)
    .map((p) =>
      p.startsWith('$$') && p.length > 4 ? tex(p.slice(2, -2), true) : p.startsWith('$') && p.length > 2 ? tex(p.slice(1, -1)) : p
    )
    .join('');
}

export function quizHTML(qs) {
  return `<ol class="quiz">${qs
    .map(
      (q, i) => `
    <li class="q" data-q="${q.id}">
      <div class="q-label"><span class="q-num">${i + 1}</span><div>${rich(q.label)}</div></div>
      <div class="q-row">
        <label class="q-field">
          <input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="?" aria-label="${esc(q.id)}">
          <span class="q-unit">${q.unit || ''}</span>
        </label>
        <button class="btn btn-ghost btn-sm q-check" type="button">Comprova</button>
      </div>
      <div class="q-fb" aria-live="polite"></div>
    </li>`
    )
    .join('')}</ol>`;
}

export function bindQuiz(root, qs, { onChange, onFocus } = {}) {
  const state = {};
  const els = {};
  qs.forEach((q) => (state[q.id] = { status: 'pending', tries: 0 }));

  const api = {
    state,
    checkAll,
    revealAll,
    get done() { return qs.every((q) => ['ok', 'revealed'].includes(state[q.id].status)); },
    get perfect() { return qs.every((q) => state[q.id].status === 'ok'); },
    get correct() { return qs.filter((q) => state[q.id].status === 'ok').length; },
    get solvedIds() { return qs.filter((q) => ['ok', 'revealed'].includes(state[q.id].status)); },
  };

  root.querySelectorAll('.q').forEach((el) => {
    const q = qs.find((x) => x.id === el.dataset.q);
    const input = el.querySelector('input');
    els[q.id] = { el, input, fb: el.querySelector('.q-fb'), btn: el.querySelector('.q-check') };
    els[q.id].btn.addEventListener('click', () => { if (check(q)) focusNext(q); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); if (check(q)) focusNext(q); }
    });
    input.addEventListener('focus', () => onFocus?.(q));
    input.addEventListener('input', () => el.classList.remove('is-wrong'));
  });

  function focusNext(q) {
    const i = qs.indexOf(q);
    for (let j = i + 1; j < qs.length; j++) {
      if (!['ok', 'revealed'].includes(state[qs[j].id].status)) { els[qs[j].id].input.focus(); return; }
    }
  }

  function check(q, silentEmpty = false) {
    const s = state[q.id];
    if (s.status === 'ok' || s.status === 'revealed') return true;
    const { el, input, fb } = els[q.id];
    const v = parseNum(input.value);
    if (!Number.isFinite(v)) {
      if (!silentEmpty) {
        fb.innerHTML = `<span class="fb-warn">Escriu un número (pots usar coma decimal: 1,5).</span>`;
        shake(el);
      }
      return false;
    }
    if (isClose(v, q.answer)) {
      s.status = 'ok';
      mark(q, 'ok');
      onChange?.(q, s, api);
      return true;
    }
    s.tries++;
    s.status = 'wrong';
    el.classList.add('is-wrong');
    shake(el);
    let msg = `<span class="fb-bad">✗ No és correcte.</span>`;
    const ratio = v / q.answer;
    if (Math.abs(ratio - 1000) < 20 || Math.abs(ratio * 1000 - 1) < 0.02) msg += ` Revisa les unitats.`;
    else if (Math.abs(ratio - 1) < 0.08) msg += ` T'has quedat molt a prop: revisa l'arrodoniment (usa 2 decimals).`;
    else if (q.hint) msg += ` <span class="fb-hint">Pista: ${rich(q.hint)}</span>`;
    if (s.tries >= 2) msg += ` <button class="link reveal" type="button">Mostra la solució</button>`;
    fb.innerHTML = msg;
    fb.querySelector('.reveal')?.addEventListener('click', () => reveal(q));
    onChange?.(q, s, api);
    return false;
  }

  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  function reveal(q) {
    const s = state[q.id];
    if (s.status === 'ok' || s.status === 'revealed') return;
    s.status = 'revealed';
    els[q.id].input.value = fmt(q.answer);
    mark(q, 'revealed');
    onChange?.(q, s, api);
  }

  function mark(q, kind) {
    const { el, input, fb, btn } = els[q.id];
    el.classList.remove('is-wrong');
    el.classList.add(kind === 'ok' ? 'is-ok' : 'is-revealed');
    input.readOnly = true;
    btn.disabled = true;
    fb.innerHTML =
      (kind === 'ok'
        ? `<span class="fb-ok">✓ Correcte!</span>`
        : `<span class="fb-rev">Solució: <b>${fmt(q.answer)} ${q.unit}</b></span>`) +
      (q.explain ? `<div class="q-explain">${tex(q.explain)}</div>` : '');
  }

  function checkAll() {
    qs.forEach((q) => { if (els[q.id].input.value.trim()) check(q, true); });
  }
  function revealAll() { qs.forEach(reveal); }

  return api;
}
