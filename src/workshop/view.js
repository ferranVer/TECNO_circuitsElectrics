// Vista del taller: plantilla + dades + preguntes autocorregibles + circuit animat.
import confetti from 'canvas-confetti';
import { fmt } from '../lib/format.js';
import { makeRng, newSeed } from '../lib/rng.js';
import { tex } from '../lib/tex.js';
import { bindQuiz, quizHTML, rich } from '../ui/quiz.js';
import { meters, stageShell } from '../ui/stage.js';
import { templates } from './templates.js';

export function mountWorkshop({ panel, stage, t, seed, progress, onPerfect }) {
  const rng = makeRng(seed * 7 + t.id.charCodeAt(0));
  const v = t.gen(rng);
  const s = t.solve(v);
  const qs = t.questions(v, s);
  const idx = templates.indexOf(t);
  const prev = templates[idx - 1], next = templates[idx + 1];
  const shareUrl = `${location.origin}${location.pathname}#/taller/${t.id}/${seed}`;

  panel.innerHTML = `
    <div class="panel-head">
      <div class="eyebrow">Taller · circuits mixtos</div>
      <nav class="tpl-tabs" aria-label="Plantilles">
        ${templates
          .map(
            (x) => `<a class="tpl-chip${x.id === t.id ? ' active' : ''}" href="#/taller/${x.id}" title="${x.name}">
              <b>${x.id}</b>${progress.taller[x.id] ? `<i title="Resolts sense ajuda">✓${progress.taller[x.id]}</i>` : ''}
            </a>`
          )
          .join('')}
      </nav>
    </div>
    <div class="panel-body">
      <div class="level">${'<span class="on">●</span>'.repeat(t.level)}${'<span>●</span>'.repeat(3 - t.level)} Nivell ${t.level}</div>
      <h1 class="title">${t.id}. <span class="grad">${t.name}</span></h1>
      <p class="lead">${t.desc}</p>
      <div class="formula-hero">${tex(t.formula, true)}</div>

      <section class="card data-card">
        <h4>Dades del circuit</h4>
        <div class="chips">
          <span class="chip v">${tex(`V = ${fmt(v.V).replace(',', '{,}')}\\ \\text{V}`)}</span>
          ${t.ks.map((k) => `<span class="chip">${tex(`R_${k} = ${fmt(v['R' + k]).replace(',', '{,}')}\\ \\Omega`)}</span>`).join('')}
        </div>
        <div class="seed-row">
          <span class="seed" title="Amb aquest codi es generen sempre els mateixos valors">Codi <b>#${seed}</b></span>
          <button class="btn btn-ghost btn-sm" data-act="new">🎲 Nous valors</button>
          <button class="btn btn-ghost btn-sm" data-act="copy">🔗 Copia l'enllaç</button>
        </div>
        <form class="seed-form">
          <input name="code" inputmode="numeric" maxlength="6" placeholder="Tens un codi? (p. ex. 4821)" aria-label="Codi del circuit">
          <button class="btn btn-ghost btn-sm" type="submit">Carrega</button>
        </form>
      </section>

      <div class="callout"><b>Com funciona:</b> resol el circuit en paper i escriu els resultats (2 decimals, amb coma o punt). Prem <kbd>Enter</kbd> per comprovar cada apartat. Quan encertes, el valor apareix al circuit.</div>

      ${quizHTML(qs)}

      <div class="quiz-actions">
        <button class="btn btn-primary" data-act="checkall">Comprova-ho tot</button>
        <button class="btn btn-ghost" data-act="giveup">Mostra les solucions</button>
      </div>
      <div class="score" aria-live="polite"></div>

      <details class="solution" hidden>
        <summary>📘 Resolució pas a pas</summary>
        <ol>${qs.map((q) => `<li><div class="sol-q">${rich(q.label)}</div>${tex(q.explain, true)}</li>`).join('')}</ol>
      </details>
    </div>
    <div class="panel-nav">
      ${prev ? `<a class="btn btn-ghost" href="#/taller/${prev.id}">← ${prev.id}</a>` : `<a class="btn btn-ghost" href="#/pas/10">← Tutorial</a>`}
      ${next ? `<a class="btn btn-primary" href="#/taller/${next.id}">Circuit ${next.id} →</a>` : `<span></span>`}
    </div>`;

  // ── Escenari
  const shown = new Set();
  const ALL = new Set(['I', 'Req', ...t.ks.flatMap((k) => ['V' + k, 'I' + k])]);
  let groups = false, all = false, focusIds = [];
  const st = stageShell(stage, {
    eyebrow: `Circuit ${t.id} · ${t.short}`,
    title: t.name,
    tools: `
      <button class="btn btn-ghost btn-sm toggle" data-act="groups" aria-pressed="false" title="Mostra els grups que es poden simplificar">⬚ Agrupacions</button>
      <button class="btn btn-ghost btn-sm toggle" data-act="all" aria-pressed="false" disabled title="Disponible quan acabes">👁 Tots els valors</button>`,
  });

  const draw = () => {
    st.setSvg(t.layout(v, s, all ? ALL : shown, { groups }));
    st.highlight(focusIds);
    const has = (k) => all || shown.has(k);
    st.setFoot(
      meters([
        { label: 'Voltatge', value: `${fmt(v.V)} V`, cls: 'v' },
        { label: 'Intensitat total', value: has('I') ? `${fmt(s.I)} A` : '?', cls: 'i' },
        { label: 'Req', value: has('Req') ? `${fmt(s.Req)} Ω` : '?', cls: 'r' },
        { label: 'Encerts', value: `${quiz ? quiz.correct : 0} / ${qs.length}`, cls: 'p' },
      ]) +
        `<div class="legend"><span><i class="lg-flow"></i>Corrent: velocitat ∝ intensitat</span><span><i class="lg-heat"></i>Color: calor dissipada</span><span>Passa el ratolí per un component per a veure'n les dades</span></div>`
    );
  };

  const scoreEl = panel.querySelector('.score');
  const quiz = bindQuiz(panel, qs, {
    onFocus: (q) => { focusIds = q.focus || []; st.highlight(focusIds); },
    onChange: (q, state, api) => {
      if (state.status === 'ok' || state.status === 'revealed') q.reveal.forEach((x) => shown.add(x));
      draw();
      scoreEl.innerHTML = `<b>${api.correct}</b> de ${qs.length} correctes sense ajuda`;
      if (api.done) finish(api);
    },
  });

  let finished = false;
  function finish(api) {
    if (finished) return;
    finished = true;
    panel.querySelector('.solution').hidden = false;
    const btnAll = st.tools.querySelector('[data-act="all"]');
    btnAll.disabled = false;
    btnAll.title = 'Mostra totes les mesures';
    if (api.perfect) {
      onPerfect?.(t.id);
      scoreEl.innerHTML = `<div class="win">🏆 <b>Perfecte!</b> Has resolt el circuit ${t.id} sense cap ajuda. <button class="link" data-act="new2">Prova amb nous valors →</button></div>`;
      scoreEl.querySelector('[data-act="new2"]').addEventListener('click', newValues);
      const rect = stage.getBoundingClientRect();
      confetti({
        particleCount: 140, spread: 75, startVelocity: 38,
        origin: { x: (rect.left + rect.width / 2) / innerWidth, y: 0.35 },
        colors: ['#a78bfa', '#7c5cff', '#67e8f9', '#fbbf24', '#ffffff'],
        disableForReducedMotion: true,
      });
    } else {
      scoreEl.innerHTML = `<div class="win soft">Circuit completat amb <b>${api.correct}/${qs.length}</b> encerts sense ajuda. Revisa la resolució i <button class="link" data-act="new2">prova amb nous valors →</button></div>`;
      scoreEl.querySelector('[data-act="new2"]').addEventListener('click', newValues);
    }
  }

  function newValues() {
    let ns = newSeed();
    while (ns === seed) ns = newSeed();
    location.hash = `#/taller/${t.id}/${ns}`;
  }

  // ── Accions
  panel.querySelector('[data-act="new"]').addEventListener('click', newValues);
  panel.querySelector('[data-act="copy"]').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try {
      await navigator.clipboard.writeText(shareUrl);
      b.textContent = '✓ Copiat!';
    } catch {
      prompt('Copia aquest enllaç:', shareUrl);
    }
    setTimeout(() => (b.textContent = "🔗 Copia l'enllaç"), 1600);
  });
  panel.querySelector('.seed-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = parseInt(e.currentTarget.code.value.replace(/\D/g, ''), 10);
    if (code > 0) location.hash = `#/taller/${t.id}/${code}`;
  });
  panel.querySelector('[data-act="checkall"]').addEventListener('click', () => quiz.checkAll());
  panel.querySelector('[data-act="giveup"]').addEventListener('click', () => quiz.revealAll());

  st.tools.querySelector('[data-act="groups"]').addEventListener('click', (e) => {
    groups = !groups;
    e.currentTarget.setAttribute('aria-pressed', groups);
    draw();
  });
  st.tools.querySelector('[data-act="all"]').addEventListener('click', (e) => {
    all = !all;
    e.currentTarget.setAttribute('aria-pressed', all);
    draw();
  });

  draw();
}
