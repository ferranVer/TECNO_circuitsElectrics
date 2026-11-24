import '@fontsource-variable/inter';
import 'katex/dist/katex.min.css';
import './style.css';

import { startAnimator } from './circuit/animator.js';
import { newSeed } from './lib/rng.js';
import { steps } from './tutorial/steps.js';
import { initTooltip } from './ui/stage.js';
import { byId, templates } from './workshop/templates.js';
import { mountWorkshop } from './workshop/view.js';

// ── Progrés (localStorage)
const KEY = 'circuits-electrics:v1';
const load = () => {
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    return { steps: p?.steps || {}, taller: p?.taller || {} };
  } catch {
    return { steps: {}, taller: {} };
  }
};
let progress = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* mode privat */ } };

// ── Esquelet
const app = document.querySelector('#app');
app.innerHTML = `
  <div class="bg-glow" aria-hidden="true"></div>
  <header class="topbar">
    <a class="brand" href="#/pas/1">
      <span class="brand-mark"><svg viewBox="0 0 24 24"><path d="M13.5 2 5 13.5h5.5L9 22l9.5-12.5H13z"/></svg></span>
      <span class="brand-txt">Circuits <b>elèctrics</b></span>
    </a>
    <nav class="tabs">
      <a data-tab="pas" href="#/pas/1">Tutorial</a>
      <a data-tab="taller" href="#/taller">Taller</a>
    </nav>
    <div class="top-progress" title="Progrés: passos completats + circuits del taller resolts">
      <span class="prog-lbl"></span>
      <div class="bar"><i></i></div>
    </div>
  </header>
  <main class="layout">
    <aside class="panel" aria-label="Contingut"></aside>
    <section class="stage" aria-label="Circuit interactiu"></section>
  </main>
  <div class="tooltip" role="tooltip"></div>`;

const panel = app.querySelector('.panel');
const stage = app.querySelector('.stage');
initTooltip(app.querySelector('.tooltip'));
startAnimator();

function updateProgress() {
  const nS = steps.filter((s) => progress.steps[s.id]).length;
  const nT = templates.filter((t) => progress.taller[t.id]).length;
  const pct = Math.round(((nS + nT) / (steps.length + templates.length)) * 100);
  app.querySelector('.prog-lbl').textContent = `${pct}%`;
  app.querySelector('.top-progress .bar i').style.width = `${pct}%`;
}

function markStep(id) {
  if (progress.steps[id]) return;
  progress.steps[id] = true;
  save();
  updateProgress();
  panel.querySelector(`.steps-strip [data-sid="${id}"]`)?.classList.add('done');
}

// ── Rutes: #/pas/N  ·  #/taller/ID/CODI
const tallerSeeds = {};
function parse() {
  const [a, b, c] = location.hash.replace(/^#\/?/, '').split('/');
  if (a === 'taller') return { view: 'taller', id: (b || 'A').toUpperCase(), seed: parseInt(c, 10) || null };
  const i = Math.max(1, Math.min(steps.length, parseInt(b, 10) || 1)) - 1;
  return { view: 'pas', i };
}

function renderStep(i) {
  const s = steps[i];
  panel.innerHTML = `
    <div class="panel-head">
      <div class="steps-strip" role="list">
        ${steps
          .map(
            (x, k) =>
              `<a role="listitem" href="#/pas/${k + 1}" data-sid="${x.id}" class="${k === i ? 'active' : ''}${progress.steps[x.id] ? ' done' : ''}" title="${k + 1}. ${x.title}">${k + 1}</a>`
          )
          .join('')}
      </div>
      <div class="eyebrow">Pas ${i + 1} de ${steps.length} · <span class="kind ${s.kind === 'pràctica' ? 'pr' : ''}">${s.kind}</span></div>
    </div>
    <div class="panel-body"></div>
    <div class="panel-nav">
      ${i > 0 ? `<a class="btn btn-ghost" href="#/pas/${i}">← Anterior</a>` : '<span></span>'}
      ${
        i < steps.length - 1
          ? `<a class="btn btn-primary" href="#/pas/${i + 2}">Següent: ${steps[i + 1].title} →</a>`
          : `<a class="btn btn-primary" href="#/taller/A">Anar al taller →</a>`
      }
    </div>`;
  const body = panel.querySelector('.panel-body');
  s.mount({ body, stage, complete: () => markStep(s.id) });
}

function renderTaller(id, seed) {
  const t = byId(id);
  if (!seed) {
    seed = tallerSeeds[t.id] ?? newSeed();
    history.replaceState(null, '', `#/taller/${t.id}/${seed}`);
  }
  tallerSeeds[t.id] = seed;
  mountWorkshop({
    panel, stage, t, seed, progress,
    onPerfect: (tid) => {
      progress.taller[tid] = (progress.taller[tid] || 0) + 1;
      save();
      updateProgress();
      const chip = panel.querySelector(`.tpl-chip[href="#/taller/${tid}"]`);
      if (chip) {
        chip.querySelector('i')?.remove();
        chip.insertAdjacentHTML('beforeend', `<i title="Resolts sense ajuda">✓${progress.taller[tid]}</i>`);
      }
    },
  });
}

function render() {
  const r = parse();
  app.querySelectorAll('.tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === r.view));
  if (r.view === 'taller') renderTaller(r.id, r.seed);
  else renderStep(r.i);
  panel.querySelector('.panel-body')?.scrollTo(0, 0);
  stage.scrollTo?.(0, 0);
  updateProgress();
}

window.addEventListener('hashchange', render);
render();
