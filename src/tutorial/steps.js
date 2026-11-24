// Passos del tutorial: teoria + pràctica amb autocorrecció.
import { loopLayout, parallelLayout } from '../circuit/layouts.js';
import { circuit } from '../circuit/svg.js';
import { fmt, n, par, parN } from '../lib/format.js';
import { makeRng, newSeed } from '../lib/rng.js';
import { r, tex } from '../lib/tex.js';
import { Q, bindQuiz, quizHTML, rich } from '../ui/quiz.js';
import { meters, stageShell } from '../ui/stage.js';
import { chooseV, templates } from '../workshop/templates.js';

const seeds = {};
const seedFor = (id) => (seeds[id] ??= newSeed());

const SER = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
const TRI = [
  [3, 6, 6], [6, 6, 6], [4, 6, 12], [6, 12, 12], [10, 15, 30], [20, 30, 60], [4, 4, 2], [8, 8, 4],
  [12, 6, 4], [2, 3, 6], [12, 12, 12], [5, 20, 20], [10, 10, 5], [30, 60, 20], [6, 12, 4],
];

const sqrtB = (P, Pref) => Math.sqrt(Math.max(0, P) / Pref);

/** Bloc de pràctica comú: capçalera + preguntes + botó de nous valors */
function practiceBlock(qs, intro = 'Calcula en paper i escriu el resultat. Prem <kbd>Enter</kbd> per comprovar.') {
  return `
    <section class="practice">
      <div class="practice-head">
        <div><span class="badge">Pràctica</span><p>${intro}</p></div>
        <button class="btn btn-ghost btn-sm" data-act="new" title="Genera valors nous">🎲 Nous valors</button>
      </div>
      ${quizHTML(qs)}
      <div class="practice-done" hidden></div>
    </section>`;
}

function wirePractice(body, qs, { id, complete, remount, onChange, onFocus }) {
  body.querySelector('[data-act="new"]')?.addEventListener('click', () => {
    seeds[id] = newSeed();
    remount();
  });
  const quiz = bindQuiz(body, qs, {
    onFocus,
    onChange: (q, s, api) => {
      onChange?.(q, s, api);
      if (api.done) {
        complete();
        const box = body.querySelector('.practice-done');
        box.hidden = false;
        box.innerHTML = api.perfect
          ? `🎉 <b>Perfecte!</b> Has resolt tots els apartats. Pots continuar o provar amb nous valors.`
          : `✔ Pràctica completada (${api.correct}/${qs.length} sense ajuda). Prova amb <b>nous valors</b> per a millorar!`;
      }
    },
  });
  return quiz;
}

const elementIcons = {
  B: `<svg viewBox="0 0 40 40"><path d="M20 4v10M20 26v10M8 14h24M13 26h14" /></svg>`,
  W: `<svg viewBox="0 0 40 40"><path d="M4 20h32" /><circle cx="4" cy="20" r="2.5"/><circle cx="36" cy="20" r="2.5"/></svg>`,
  L: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="11"/><path d="M12 12l16 16M28 12L12 28"/></svg>`,
  S: `<svg viewBox="0 0 40 40"><path d="M4 26h8M28 26h8M12 26l15-10"/><circle cx="12" cy="26" r="2.5"/><circle cx="28" cy="26" r="2.5"/></svg>`,
};

export const steps = [
  // ───────────────────────────── 1
  {
    id: 'intro',
    title: 'Què és un circuit elèctric?',
    kind: 'teoria',
    mount({ body, stage, complete }) {
      complete();
      body.innerHTML = rich(r`
        <h1 class="title">Què és un <span class="grad">circuit elèctric</span>?</h1>
        <p class="lead">Un circuit elèctric és un <b>camí tancat</b> per on circulen les càrregues elèctriques. Si el camí s'obri en algun punt, el corrent es para.</p>
        <p>Tot circuit té quatre tipus d'elements. Passa el ratolí per damunt de cada targeta per a veure'l al circuit:</p>
        <div class="el-grid">
          <div class="el-card" data-el="B">${elementIcons.B}<div><b>Generador</b><span>Pila o bateria. Proporciona l'energia (el <i>voltatge</i>).</span></div></div>
          <div class="el-card" data-el="W">${elementIcons.W}<div><b>Conductors</b><span>Cables de coure que porten el corrent d'un element a l'altre.</span></div></div>
          <div class="el-card" data-el="L">${elementIcons.L}<div><b>Receptors</b><span>Bombetes, motors, resistències… Transformen l'energia elèctrica en llum, moviment o calor.</span></div></div>
          <div class="el-card" data-el="S">${elementIcons.S}<div><b>Control</b><span>Interruptors i polsadors: obrin o tanquen el circuit.</span></div></div>
        </div>
        <div class="callout"><b>Prova-ho:</b> fes clic sobre l'<b>interruptor</b> del circuit de la dreta. Només quan el circuit està tancat circula el corrent i la bombeta s'encén.</div>
        <h3>Sentit del corrent</h3>
        <p>Per conveni, diem que el corrent ix pel <b>pol positiu (+)</b> del generador, recorre el circuit i torna pel <b>pol negatiu (−)</b>. Els punts blaus de l'animació representen aquest corrent: <b>com més ràpid es mouen, més intensitat</b>.</p>
        <p class="muted">En realitat, els electrons es mouen en sentit contrari (del − al +), però el sentit convencional és el que s'utilitza per a calcular.</p>
      `);
      let closed = false;
      const st = stageShell(stage, { eyebrow: 'Circuit bàsic', title: 'Pila + interruptor + bombeta' });
      const draw = () => {
        st.setSvg(
          loopLayout({
            V: 4.5, I: closed ? 0.5 : 0, Imax: 0.6, withSwitch: true, closed,
            items: [{ type: 'L', id: 'L', name: 'Bombeta', bright: closed ? 0.95 : 0, tip: 'Receptor: bombeta' }],
          })
        );
        st.setFoot(meters([
          { label: 'Interruptor', value: closed ? 'Tancat' : 'Obert', cls: closed ? 'on' : 'off' },
          { label: 'Corrent', value: closed ? 'Circula ✓' : 'No circula', cls: closed ? 'on' : 'off' },
          { label: 'Bombeta', value: closed ? 'Encesa' : 'Apagada', cls: closed ? 'on' : 'off' },
        ]));
      };
      st.canvas.addEventListener('click', (e) => {
        if (e.target.closest('[data-id="S"]')) { closed = !closed; draw(); }
      });
      body.querySelectorAll('.el-card').forEach((c) => {
        c.addEventListener('mouseenter', () => {
          const id = c.dataset.el;
          st.highlight([id]);
          st.canvas.querySelector('.wires')?.classList.toggle('hl', id === 'W');
        });
        c.addEventListener('mouseleave', () => {
          st.highlight([]);
          st.canvas.querySelector('.wires')?.classList.remove('hl');
        });
      });
      draw();
    },
  },

  // ───────────────────────────── 2
  {
    id: 'magnituds',
    title: 'Voltatge, intensitat i resistència',
    kind: 'teoria',
    mount({ body, stage, complete }) {
      complete();
      body.innerHTML = rich(r`
        <h1 class="title">Les tres <span class="grad">magnituds</span> bàsiques</h1>
        <p class="lead">Per a entendre un circuit necessitem tres magnituds. Una bona manera d'imaginar-les és pensar en <b>aigua que circula per una canonada</b>.</p>
        <div class="table-wrap"><table class="mag">
          <thead><tr><th>Magnitud</th><th>Símbol</th><th>Unitat</th><th>Es mesura amb</th></tr></thead>
          <tbody>
            <tr><td><b>Voltatge</b> (tensió)</td><td>$V$</td><td>volt (V)</td><td>voltímetre, en paral·lel</td></tr>
            <tr><td><b>Intensitat</b></td><td>$I$</td><td>ampere (A)</td><td>amperímetre, en sèrie</td></tr>
            <tr><td><b>Resistència</b></td><td>$R$</td><td>ohm (Ω)</td><td>ohmímetre</td></tr>
          </tbody>
        </table></div>
        <div class="analogy">
          <div><span class="dot v"></span><b>Voltatge</b> — és com la <i>diferència d'altura</i> (o pressió) que fa moure l'aigua. És l'"empenta" que dona la pila.</div>
          <div><span class="dot i"></span><b>Intensitat</b> — és el <i>cabal</i>: quantes càrregues passen per un punt cada segon.</div>
          <div><span class="dot r"></span><b>Resistència</b> — és l'<i>estretor</i> de la canonada: com dificulta un element el pas del corrent.</div>
        </div>
        <div class="callout"><b>Experimenta:</b> mou els controls de la dreta. Si puges el <b>voltatge</b>, el corrent va més ràpid i la bombeta brilla més. Si puges la <b>resistència</b>, el corrent s'alenteix.</div>
        <h3>Múltiples i submúltiples</h3>
        <p>$1\ \text{kΩ} = 1000\ \Omega$ &nbsp;·&nbsp; $1\ \text{mA} = 0{,}001\ \text{A}$ &nbsp;·&nbsp; $1\ \text{kV} = 1000\ \text{V}$. En aquest tutorial treballarem sempre en V, A i Ω.</p>
      `);
      let V = 9, R = 10;
      const st = stageShell(stage, {
        eyebrow: 'Laboratori',
        title: 'Juga amb V i R',
        foot: `
          <div class="sliders">
            <label><span>Voltatge <output data-o="V"></output></span><input type="range" min="1.5" max="24" step="0.5" value="${V}" data-s="V"></label>
            <label><span>Resistència <output data-o="R"></output></span><input type="range" min="2" max="60" step="1" value="${R}" data-s="R"></label>
          </div>
          <div class="meters-slot"></div>`,
      });
      const draw = () => {
        const I = V / R, P = V * I;
        st.setSvg(
          loopLayout({
            V, I, Imax: 3,
            items: [{ type: 'L', id: 'L', name: 'R', value: `${fmt(R)} Ω`, bright: Math.min(1, Math.sqrt(P / 14)), meas: `${fmt(I)} A`, tip: `Bombeta\nR = ${R} Ω` }],
            tags: [{ x: 112, y: 150, name: 'I', value: `= ${fmt(I)} A ↑`, cls: 'cur' }],
          })
        );
        st.foot.querySelector('[data-o="V"]').textContent = `${fmt(V)} V`;
        st.foot.querySelector('[data-o="R"]').textContent = `${fmt(R)} Ω`;
        st.foot.querySelector('.meters-slot').innerHTML = meters([
          { label: 'Voltatge', value: `${fmt(V)} V`, cls: 'v' },
          { label: 'Resistència', value: `${fmt(R)} Ω`, cls: 'r' },
          { label: 'Intensitat', value: `${fmt(I)} A`, cls: 'i' },
        ]);
      };
      st.foot.querySelectorAll('input[type=range]').forEach((inp) =>
        inp.addEventListener('input', () => {
          if (inp.dataset.s === 'V') V = +inp.value; else R = +inp.value;
          draw();
        })
      );
      draw();
    },
  },

  // ───────────────────────────── 3
  {
    id: 'ohm',
    title: "La llei d'Ohm",
    kind: 'pràctica',
    mount(ctx) {
      const { body, stage } = ctx;
      const rng = makeRng(seedFor('ohm'));
      const a = { R: rng.pick([2, 3, 4, 6, 8, 12]) }; a.V = a.R * rng.pick([0.5, 1, 1.5, 2, 3]); a.I = a.V / a.R;
      const b = { I: rng.pick([0.2, 0.5, 1.5, 2, 2.5]), R: rng.pick([4, 5, 10, 20, 30]) }; b.V = b.I * b.R;
      const c = { V: rng.pick([6, 9, 12, 18, 24]), I: rng.pick([0.5, 1.5, 2, 3]) }; c.R = c.V / c.I;
      const qs = [
        Q('q1', r`Una pila de $${n(a.V)}\ \text{V}$ alimenta una resistència de $${n(a.R)}\ \Omega$. Quina intensitat circula?`, 'A', a.I, {
          explain: r`I=\dfrac{V}{R}=\dfrac{${n(a.V)}}{${n(a.R)}}=${n(a.I)}\,\text{A}`, hint: r`$I = V / R$`, data: a, unknown: 'I',
        }),
        Q('q2', r`Per una resistència de $${n(b.R)}\ \Omega$ circulen $${n(b.I)}\ \text{A}$. Quin voltatge té la pila?`, 'V', b.V, {
          explain: r`V=I\cdot R=${n(b.I)}\cdot ${n(b.R)}=${n(b.V)}\,\text{V}`, hint: r`$V = I \cdot R$`, data: b, unknown: 'V',
        }),
        Q('q3', r`Una pila de $${n(c.V)}\ \text{V}$ fa circular $${n(c.I)}\ \text{A}$. Quant val la resistència?`, 'Ω', c.R, {
          explain: r`R=\dfrac{V}{I}=\dfrac{${n(c.V)}}{${n(c.I)}}=${n(c.R)}\,\Omega`, hint: r`$R = V / I$`, data: c, unknown: 'R',
        }),
      ];
      body.innerHTML = rich(r`
        <h1 class="title">La <span class="grad">llei d'Ohm</span></h1>
        <p class="lead">Georg Simon Ohm va descobrir que, en una resistència, <b>la intensitat és directament proporcional al voltatge</b> i inversament proporcional a la resistència.</p>
        <div class="formula-hero">$$V = I \cdot R$$</div>
        <div class="ohm-row">
          <svg class="ohm-tri" viewBox="0 0 160 140" aria-label="Triangle de la llei d'Ohm">
            <path d="M80 8 L152 132 L8 132 Z"/><path d="M36 84 H124 M80 84 V132"/>
            <text x="80" y="66" text-anchor="middle">V</text><text x="52" y="120" text-anchor="middle">I</text><text x="108" y="120" text-anchor="middle">R</text>
          </svg>
          <div>
            <p><b>Truc del triangle:</b> tapa la magnitud que vols calcular i mira com queden les altres dues:</p>
            <ul class="formulas">
              <li>$V = I \cdot R$</li><li>$I = \dfrac{V}{R}$</li><li>$R = \dfrac{V}{I}$</li>
            </ul>
          </div>
        </div>
        <div class="example"><span class="badge soft">Exemple resolt</span>
          <p>Una pila de $9\ \text{V}$ alimenta una resistència de $3\ \Omega$:</p>
          $$I = \frac{V}{R} = \frac{9\ \text{V}}{3\ \Omega} = 3\ \text{A}$$
        </div>
      `) + practiceBlock(qs, 'Resol aquests tres problemes. Quan cliques en una pregunta, el circuit de la dreta es canvia.');
      let active = qs[0];
      const st = stageShell(stage, { eyebrow: 'Llei d’Ohm', title: 'Circuit de la pregunta' });
      const quiz = wirePractice(body, qs, {
        id: 'ohm', ...ctx, remount: () => this.mount(ctx),
        onFocus: (q) => { active = q; draw(); },
        onChange: (q) => { active = q; draw(); },
      });
      function draw() {
        const d = active.data, u = active.unknown;
        const solved = ['ok', 'revealed'].includes(quiz?.state[active.id]?.status);
        const show = (k, unit) => (u === k && !solved ? '?' : `${fmt(d[k])} ${unit}`);
        st.setSvg(
          loopLayout({
            V: d.V, Vlabel: show('V', 'V'), I: d.I, Imax: 3,
            items: [{ type: 'R', id: 'R', name: 'R', value: show('R', 'Ω'), heat: 0.4 }],
            tags: [{ x: 112, y: 150, name: 'I', value: `= ${show('I', 'A')} ↑`, cls: 'cur' }],
          })
        );
        st.setFoot(meters([
          { label: 'Pregunta', value: String(qs.indexOf(active) + 1) },
          { label: 'Voltatge', value: show('V', 'V'), cls: 'v' },
          { label: 'Intensitat', value: show('I', 'A'), cls: 'i' },
          { label: 'Resistència', value: show('R', 'Ω'), cls: 'r' },
        ]));
      }
      draw();
    },
  },

  // ───────────────────────────── 4
  {
    id: 'serie',
    title: 'Circuit en sèrie',
    kind: 'teoria',
    mount({ body, stage, complete }) {
      complete();
      body.innerHTML = rich(r`
        <h1 class="title">Circuit en <span class="grad">sèrie</span></h1>
        <p class="lead">Els receptors estan connectats <b>un darrere l'altre</b>, formant <b>un únic camí</b> per al corrent.</p>
        <div class="rules">
          <div class="rule"><span class="n">1</span><div><b>La intensitat és la mateixa</b> en tots els elements: només hi ha un camí. $$I = I_1 = I_2 = I_3$$</div></div>
          <div class="rule"><span class="n">2</span><div><b>El voltatge es repartix</b> entre els receptors: $$V = V_1 + V_2 + V_3$$</div></div>
          <div class="rule"><span class="n">3</span><div><b>La resistència equivalent és la suma</b>: $$R_{eq} = R_1 + R_2 + R_3$$</div></div>
        </div>
        <h3>Com es resol</h3>
        <ol class="method">
          <li>Calcula $R_{eq}$ sumant totes les resistències.</li>
          <li>Calcula la intensitat: $I = V / R_{eq}$.</li>
          <li>Calcula el voltatge de cada element: $V_i = I \cdot R_i$.</li>
          <li><b>Comprova</b> que la suma dels voltatges és $V$.</li>
        </ol>
        <div class="callout"><b>Experimenta:</b> afig bombetes amb els botons i observa com brillen <b>menys</b> (el voltatge es repartix). Fes clic sobre una bombeta per a <b>fondre-la</b>: s'obri el circuit i <b>s'apaguen totes</b>!</div>
        <p class="muted">Per això les llums de Nadal antigues s'apagaven totes quan se'n fonia una.</p>
      `);
      const R = 6, V = 6;
      let count = 3;
      const fused = new Set();
      const st = stageShell(stage, {
        eyebrow: 'Sèrie',
        title: 'Bombetes en sèrie',
        tools: `<div class="seg" role="group" aria-label="Nombre de bombetes">${[1, 2, 3]
          .map((k) => `<button data-n="${k}" class="${k === count ? 'on' : ''}">${k}</button>`)
          .join('')}</div><span class="tool-lbl">bombetes</span>`,
      });
      const draw = () => {
        const broken = [...fused].some((i) => i < count);
        const I = broken ? 0 : V / (R * count);
        const P = I * I * R;
        st.setSvg(
          loopLayout({
            V, I, Imax: 1,
            items: Array.from({ length: count }, (_, i) => ({
              type: 'L', id: 'L' + i, name: `L_${i + 1}`, value: `${R} Ω`, clickable: true,
              fused: fused.has(i), bright: sqrtB(P, (V * V) / R),
              meas: `${fmt(I * R)} V · ${fmt(I)} A`,
              tip: fused.has(i) ? 'Bombeta fosa\nClica per a canviar-la' : 'Clica per a fondre-la',
            })),
            tags: [{ x: 112, y: 150, name: 'I', value: `= ${fmt(I)} A ↑`, cls: 'cur' }],
          })
        );
        st.setFoot(meters([
          { label: 'Req', value: `${R * count} Ω`, cls: 'r' },
          { label: 'Intensitat', value: `${fmt(I)} A`, cls: 'i' },
          { label: 'V en cada bombeta', value: `${fmt(I * R)} V`, cls: 'v' },
          { label: 'Estat', value: broken ? 'Circuit obert!' : 'Funcionant', cls: broken ? 'off' : 'on' },
        ]));
      };
      st.tools.querySelectorAll('[data-n]').forEach((b) =>
        b.addEventListener('click', () => {
          count = +b.dataset.n;
          st.tools.querySelectorAll('[data-n]').forEach((x) => x.classList.toggle('on', x === b));
          draw();
        })
      );
      st.canvas.addEventListener('click', (e) => {
        const g = e.target.closest('.bulb');
        if (!g) return;
        const i = +g.dataset.id.slice(1);
        fused.has(i) ? fused.delete(i) : fused.add(i);
        draw();
      });
      draw();
    },
  },

  // ───────────────────────────── 5
  {
    id: 'serie-practica',
    title: 'Pràctica: circuit en sèrie',
    kind: 'pràctica',
    mount(ctx) {
      const { body, stage } = ctx;
      const rng = makeRng(seedFor('serie-practica'));
      const [R1, R2, R3] = rng.shuffle(SER).slice(0, 3);
      const Req = R1 + R2 + R3, V = chooseV(rng, Req), I = V / Req;
      const Vs = [R1, R2, R3].map((x) => I * x);
      const qs = [
        Q('Req', r`Resistència equivalent $R_{eq}$`, 'Ω', Req, {
          explain: r`R_{eq}=${n(R1)}+${n(R2)}+${n(R3)}=${n(Req)}\,\Omega`, hint: r`En sèrie se sumen: $R_{eq} = R_1 + R_2 + R_3$`, reveal: ['Req'],
        }),
        Q('I', r`Intensitat del circuit $I$`, 'A', I, {
          explain: r`I=\dfrac{V}{R_{eq}}=\dfrac{${n(V)}}{${n(Req)}}=${n(I)}\,\text{A}`, hint: r`$I = V / R_{eq}$`, reveal: ['I'],
        }),
        ...[R1, R2, R3].map((Rk, k) =>
          Q('V' + (k + 1), r`Voltatge en $R_${k + 1}$`, 'V', Vs[k], {
            explain: r`V_${k + 1}=I\cdot R_${k + 1}=${n(I)}\cdot ${n(Rk)}=${n(Vs[k])}\,\text{V}`,
            hint: r`$V_${k + 1} = I \cdot R_${k + 1}$ (la intensitat és la mateixa en tots)`, reveal: ['V' + (k + 1)], focus: ['R' + (k + 1)],
          })
        ),
      ];
      body.innerHTML = rich(r`
        <h1 class="title">Pràctica: <span class="grad">sèrie</span></h1>
        <p class="lead">Tres resistències en sèrie connectades a una pila de <b>$${n(V)}\ \text{V}$</b>.</p>
        <div class="chips"><span class="chip v">$V = ${n(V)}\ \text{V}$</span><span class="chip">$R_1 = ${n(R1)}\ \Omega$</span><span class="chip">$R_2 = ${n(R2)}\ \Omega$</span><span class="chip">$R_3 = ${n(R3)}\ \Omega$</span></div>
        <p class="muted">Recorda els passos: $R_{eq} \rightarrow I \rightarrow V_1, V_2, V_3$. Al final, comprova que $V_1 + V_2 + V_3 = V$.</p>
      `) + practiceBlock(qs);
      const shown = new Set();
      const st = stageShell(stage, { eyebrow: 'Sèrie', title: 'Tres resistències en sèrie' });
      const draw = () => {
        st.setSvg(
          loopLayout({
            V, I, Imax: I,
            items: [R1, R2, R3].map((Rk, k) => ({
              type: 'R', id: 'R' + (k + 1), name: `R_${k + 1}`, value: `${fmt(Rk)} Ω`,
              heat: 0.15 + (0.6 * Rk) / Math.max(R1, R2, R3),
              meas: shown.has('V' + (k + 1)) ? `${fmt(Vs[k])} V` : '',
            })),
            tags: [
              { x: 112, y: 150, name: 'I', value: shown.has('I') ? `= ${fmt(I)} A ↑` : '= ?', cls: 'cur' },
              { x: 112, y: 300, name: 'R_eq', value: shown.has('Req') ? `= ${fmt(Req)} Ω` : '= ?', cls: 'req' },
            ],
          })
        );
      };
      wirePractice(body, qs, {
        id: 'serie-practica', ...ctx, remount: () => this.mount(ctx),
        onFocus: (q) => st.highlight(q.focus),
        onChange: (q, s) => { if (s.status !== 'wrong') { q.reveal.forEach((x) => shown.add(x)); draw(); st.highlight(q.focus); } },
      });
      st.setFoot(`<div class="legend"><span><i class="lg-flow"></i>Corrent (velocitat ∝ intensitat)</span><span><i class="lg-heat"></i>Calor dissipada (∝ potència)</span></div>`);
      draw();
    },
  },

  // ───────────────────────────── 6
  {
    id: 'parallel',
    title: 'Circuit en paral·lel',
    kind: 'teoria',
    mount({ body, stage, complete }) {
      complete();
      body.innerHTML = rich(r`
        <h1 class="title">Circuit en <span class="grad">paral·lel</span></h1>
        <p class="lead">Els receptors estan connectats en <b>branques diferents</b> entre els mateixos dos punts (anomenats <b>nusos</b>). El corrent té <b>diversos camins</b>.</p>
        <div class="rules">
          <div class="rule"><span class="n">1</span><div><b>El voltatge és el mateix</b> en totes les branques: $$V = V_1 = V_2 = V_3$$</div></div>
          <div class="rule"><span class="n">2</span><div><b>La intensitat es repartix</b> entre les branques (el que entra en un nus, ix): $$I = I_1 + I_2 + I_3$$</div></div>
          <div class="rule"><span class="n">3</span><div><b>La resistència equivalent</b> es calcula amb les inverses: $$\frac{1}{R_{eq}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3}$$</div></div>
        </div>
        <div class="tip-box"><b>Drecera per a dues resistències:</b> $$R_{eq} = \frac{R_1 \cdot R_2}{R_1 + R_2}$$ La $R_{eq}$ en paral·lel és <b>sempre menor</b> que la menor de les resistències.</div>
        <h3>Com es resol</h3>
        <ol class="method">
          <li>Cada branca té el voltatge de la pila: $I_i = V / R_i$.</li>
          <li>Suma les intensitats: $I = I_1 + I_2 + \dots$</li>
          <li>$R_{eq} = V / I$ (o amb la fórmula de les inverses).</li>
        </ol>
        <div class="callout"><b>Experimenta:</b> afig bombetes: <b>totes brillen igual</b> i la pila dona més intensitat. Fon-ne una (clic): <b>les altres continuen enceses</b>.</div>
        <p class="muted">Per això la instal·lació elèctrica de casa és en paral·lel: cada endoll rep els 230 V i pots apagar un llum sense apagar els altres.</p>
      `);
      const R = 12, V = 6;
      let count = 3;
      const fused = new Set();
      const st = stageShell(stage, {
        eyebrow: 'Paral·lel',
        title: 'Bombetes en paral·lel',
        tools: `<div class="seg">${[1, 2, 3].map((k) => `<button data-n="${k}" class="${k === count ? 'on' : ''}">${k}</button>`).join('')}</div><span class="tool-lbl">bombetes</span>`,
      });
      const draw = () => {
        const cur = Array.from({ length: count }, (_, i) => (fused.has(i) ? 0 : V / R));
        const It = cur.reduce((a, b) => a + b, 0);
        const working = cur.filter((x) => x > 0).length;
        st.setSvg(
          parallelLayout({
            V, currents: cur, Imax: 1.5,
            items: cur.map((Ii, i) => ({
              type: 'L', id: 'L' + i, name: `L_${i + 1}`, value: `${R} Ω`, clickable: true,
              fused: fused.has(i), bright: Ii ? 1 : 0, meas: `${fmt(V)} V · ${fmt(Ii)} A`,
              tip: fused.has(i) ? 'Bombeta fosa\nClica per a canviar-la' : 'Clica per a fondre-la',
            })),
            tags: [{ x: 112, y: 150, name: 'I', value: `= ${fmt(It)} A ↑`, cls: 'cur' }],
          })
        );
        st.setFoot(meters([
          { label: 'Req', value: working ? `${fmt(R / working)} Ω` : '∞', cls: 'r' },
          { label: 'Intensitat total', value: `${fmt(It)} A`, cls: 'i' },
          { label: 'V en cada bombeta', value: `${fmt(V)} V`, cls: 'v' },
          { label: 'Enceses', value: `${working} de ${count}`, cls: working ? 'on' : 'off' },
        ]));
      };
      st.tools.querySelectorAll('[data-n]').forEach((b) =>
        b.addEventListener('click', () => {
          count = +b.dataset.n;
          st.tools.querySelectorAll('[data-n]').forEach((x) => x.classList.toggle('on', x === b));
          draw();
        })
      );
      st.canvas.addEventListener('click', (e) => {
        const g = e.target.closest('.bulb');
        if (!g) return;
        const i = +g.dataset.id.slice(1);
        fused.has(i) ? fused.delete(i) : fused.add(i);
        draw();
      });
      draw();
    },
  },

  // ───────────────────────────── 7
  {
    id: 'parallel-practica',
    title: 'Pràctica: circuit en paral·lel',
    kind: 'pràctica',
    mount(ctx) {
      const { body, stage } = ctx;
      const rng = makeRng(seedFor('parallel-practica'));
      const Rs = rng.shuffle(rng.pick(TRI));
      const Req = parN(...Rs);
      const okV = [6, 12, 18, 24, 30, 36, 48, 60].filter((V) => Rs.every((x) => Math.abs(((V / x) * 100) % 1) < 1e-9));
      const V = okV.length ? rng.pick(okV.filter((x) => x <= 36).length ? okV.filter((x) => x <= 36) : okV) : 12;
      const Is = Rs.map((x) => V / x);
      const It = Is.reduce((a, b) => a + b, 0);
      const qs = [
        ...Rs.map((Rk, k) =>
          Q('I' + (k + 1), r`Intensitat per $R_${k + 1}$`, 'A', Is[k], {
            explain: r`I_${k + 1}=\dfrac{V}{R_${k + 1}}=\dfrac{${n(V)}}{${n(Rk)}}=${n(Is[k])}\,\text{A}`,
            hint: r`Totes les branques tenen el voltatge de la pila: $I_${k + 1} = V / R_${k + 1}$`,
            reveal: ['I' + (k + 1)], focus: ['R' + (k + 1)],
          })
        ),
        Q('I', r`Intensitat total $I$`, 'A', It, {
          explain: r`I=${Is.map((x) => n(x)).join('+')}=${n(It)}\,\text{A}`, hint: r`$I = I_1 + I_2 + I_3$`, reveal: ['I'],
        }),
        Q('Req', r`Resistència equivalent $R_{eq}$`, 'Ω', Req, {
          explain: r`R_{eq}=\dfrac{V}{I}=\dfrac{${n(V)}}{${n(It)}}=${n(Req)}\,\Omega`,
          hint: r`$R_{eq} = V / I$, o bé $\tfrac{1}{R_{eq}} = \tfrac{1}{R_1}+\tfrac{1}{R_2}+\tfrac{1}{R_3}$`, reveal: ['Req'],
        }),
      ];
      body.innerHTML = rich(r`
        <h1 class="title">Pràctica: <span class="grad">paral·lel</span></h1>
        <p class="lead">Tres resistències en paral·lel connectades a una pila de <b>$${n(V)}\ \text{V}$</b>.</p>
        <div class="chips"><span class="chip v">$V = ${n(V)}\ \text{V}$</span>${Rs.map((x, k) => `<span class="chip">$R_${k + 1} = ${n(x)}\ \Omega$</span>`).join('')}</div>
        <p class="muted">Ordre recomanat: primer la intensitat de cada branca, després la total i, finalment, la resistència equivalent. Fixa't que $R_{eq}$ ix menor que totes!</p>
      `) + practiceBlock(qs);
      const shown = new Set();
      const st = stageShell(stage, { eyebrow: 'Paral·lel', title: 'Tres resistències en paral·lel' });
      const draw = () => {
        st.setSvg(
          parallelLayout({
            V, currents: Is,
            items: Rs.map((Rk, k) => ({
              type: 'R', id: 'R' + (k + 1), name: `R_${k + 1}`, value: `${fmt(Rk)} Ω`,
              heat: 0.15 + (0.6 * Is[k]) / Math.max(...Is),
              meas: shown.has('I' + (k + 1)) ? `${fmt(Is[k])} A` : '',
            })),
            tags: [
              { x: 112, y: 150, name: 'I', value: shown.has('I') ? `= ${fmt(It)} A ↑` : '= ?', cls: 'cur' },
              { x: 112, y: 300, name: 'R_eq', value: shown.has('Req') ? `= ${fmt(Req)} Ω` : '= ?', cls: 'req' },
            ],
          })
        );
      };
      wirePractice(body, qs, {
        id: 'parallel-practica', ...ctx, remount: () => this.mount(ctx),
        onFocus: (q) => st.highlight(q.focus),
        onChange: (q, s) => { if (s.status !== 'wrong') { q.reveal.forEach((x) => shown.add(x)); draw(); st.highlight(q.focus); } },
      });
      st.setFoot(`<div class="legend"><span><i class="lg-flow"></i>Fixa't: per la branca amb menys resistència passa més corrent</span></div>`);
      draw();
    },
  },

  // ───────────────────────────── 8
  {
    id: 'potencia',
    title: 'Potència: sèrie vs paral·lel',
    kind: 'pràctica',
    mount(ctx) {
      const { body, stage } = ctx;
      const rng = makeRng(seedFor('potencia'));
      const R = rng.pick([4, 6, 8, 10, 12, 20, 24]);
      const V = rng.pick([6, 12, 24]);
      const Ppar = (V * V) / R, Iser = V / (2 * R), Pser = Iser * Iser * R;
      const qs = [
        Q('Ppar', r`<b>En paral·lel:</b> potència de cada bombeta`, 'W', Ppar, {
          explain: r`I_1=\dfrac{V}{R}=\dfrac{${n(V)}}{${n(R)}}=${n(V / R)}\,\text{A}\qquad P_1=V\cdot I_1=${n(V)}\cdot ${n(V / R)}=${n(Ppar)}\,\text{W}`,
          hint: r`Cada bombeta té tot el voltatge: $P = V \cdot I = V^2 / R$`,
        }),
        Q('Iser', r`<b>En sèrie:</b> intensitat del circuit`, 'A', Iser, {
          explain: r`I=\dfrac{V}{R+R}=\dfrac{${n(V)}}{${n(2 * R)}}=${n(Iser)}\,\text{A}`, hint: r`$R_{eq} = 2R$, i $I = V / R_{eq}$`,
        }),
        Q('Pser', r`<b>En sèrie:</b> potència de cada bombeta`, 'W', Pser, {
          explain: r`V_1=I\cdot R=${n(Iser * R)}\,\text{V}\qquad P_1=V_1\cdot I=${n(Iser * R)}\cdot ${n(Iser)}=${n(Pser)}\,\text{W}`,
          hint: r`Cada bombeta té la meitat del voltatge: $V_1 = V/2$, i $P_1 = V_1 \cdot I$`,
        }),
      ];
      body.innerHTML = rich(r`
        <h1 class="title">Potència: <span class="grad">qui brilla més?</span></h1>
        <p class="lead">La <b>potència</b> és l'energia que consumix un receptor cada segon. Es mesura en <b>watts (W)</b>. Com més potència, més brilla una bombeta.</p>
        <div class="formula-hero">$$P = V \cdot I$$</div>
        <p>Combinant-la amb la llei d'Ohm: $\;P = I^2 \cdot R = \dfrac{V^2}{R}$</p>
        <div class="compare">
          <div><b>Sèrie</b><span>Cada bombeta rep només una part del voltatge → brillen <b>menys</b>.</span></div>
          <div><b>Paral·lel</b><span>Cada bombeta rep tot el voltatge → brillen <b>més</b>, però la pila s'esgota abans.</span></div>
        </div>
        <div class="callout"><b>Experimenta:</b> canvia entre sèrie i paral·lel a la dreta amb dues bombetes iguales de $${n(R)}\ \Omega$ i una pila de $${n(V)}\ \text{V}$. Després calcula-ho!</div>
      `) + practiceBlock(qs, 'Dues bombetes iguales de <b>' + fmt(R) + ' Ω</b> i una pila de <b>' + fmt(V) + ' V</b>.');
      let mode = 'par';
      const st = stageShell(stage, {
        eyebrow: 'Comparativa',
        title: 'Dues bombetes iguales',
        tools: `<div class="seg"><button data-m="ser">Sèrie</button><button data-m="par" class="on">Paral·lel</button></div>`,
      });
      const draw = () => {
        const isPar = mode === 'par';
        const I1 = isPar ? V / R : Iser;
        const P1 = isPar ? Ppar : Pser;
        const items = [0, 1].map((i) => ({
          type: 'L', id: 'L' + i, name: `L_${i + 1}`, value: `${fmt(R)} Ω`, bright: sqrtB(P1, Ppar), meas: `${fmt(P1)} W`,
        }));
        st.setSvg(
          isPar
            ? parallelLayout({ V, items, currents: [I1, I1], Imax: (2 * V) / R })
            : loopLayout({ V, items, I: I1, Imax: (2 * V) / R })
        );
        st.setFoot(meters([
          { label: 'Intensitat total', value: `${fmt(isPar ? 2 * I1 : I1)} A`, cls: 'i' },
          { label: 'Potència / bombeta', value: `${fmt(P1)} W`, cls: 'p' },
          { label: 'Potència total', value: `${fmt(2 * P1)} W`, cls: 'p' },
        ]));
      };
      st.tools.querySelectorAll('[data-m]').forEach((b) =>
        b.addEventListener('click', () => {
          mode = b.dataset.m;
          st.tools.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b));
          draw();
        })
      );
      wirePractice(body, qs, { id: 'potencia', ...ctx, remount: () => this.mount(ctx) });
      draw();
    },
  },

  // ───────────────────────────── 9
  {
    id: 'mixtos',
    title: 'Circuits mixtos',
    kind: 'pràctica',
    mount(ctx) {
      const { body, stage } = ctx;
      const tA = templates[0];
      const v = tA.gen(makeRng(seedFor('mixtos')));
      const s = tA.solve(v);
      const qs = [
        Q('R23', r`Resistència equivalent del paral·lel $R_{23}$`, 'Ω', s.R23, {
          explain: r`R_{23}=\dfrac{${n(v.R2)}\cdot ${n(v.R3)}}{${n(v.R2)}+${n(v.R3)}}=${n(s.R23)}\,\Omega`, hint: r`$R_{23} = \dfrac{R_2 \cdot R_3}{R_2 + R_3}$`,
          focus: ['R2', 'R3'],
        }),
        Q('Req', r`Resistència equivalent total $R_{eq}$`, 'Ω', s.Req, {
          explain: r`R_{eq}=R_1+R_{23}=${n(v.R1)}+${n(s.R23)}=${n(s.Req)}\,\Omega`, hint: r`$R_1$ i $R_{23}$ estan en sèrie.`, focus: ['R1', 'R2', 'R3'], reveal: ['Req'],
        }),
        Q('I', r`Intensitat total $I$`, 'A', s.I, {
          explain: r`I=\dfrac{V}{R_{eq}}=\dfrac{${n(v.V)}}{${n(s.Req)}}=${n(s.I)}\,\text{A}`, hint: r`$I = V / R_{eq}$`, reveal: ['I', 'I1'],
        }),
        Q('V1', r`Voltatge en $R_1$`, 'V', s.V1, {
          explain: r`V_1=I\cdot R_1=${n(s.I)}\cdot ${n(v.R1)}=${n(s.V1)}\,\text{V}`, hint: r`$V_1 = I \cdot R_1$`, focus: ['R1'], reveal: ['V1'],
        }),
        Q('V23', r`Voltatge en el paral·lel $V_{23}$`, 'V', s.V23, {
          explain: r`V_{23}=I\cdot R_{23}=${n(s.I)}\cdot ${n(s.R23)}=${n(s.V23)}\,\text{V}`, hint: r`$V_{23} = I \cdot R_{23}$, o bé $V - V_1$`, focus: ['R2', 'R3'], reveal: ['V2', 'V3'],
        }),
      ];
      body.innerHTML = rich(r`
        <h1 class="title">Circuits <span class="grad">mixtos</span></h1>
        <p class="lead">Un circuit mixt combina parts en sèrie i parts en paral·lel. La clau és <b>simplificar-lo pas a pas</b> fins a deixar una sola resistència.</p>
        <ol class="method big">
          <li><b>Identifica</b> grups simples: resistències clarament en sèrie o en paral·lel.</li>
          <li><b>Substituïx</b> cada grup per la seua resistència equivalent.</li>
          <li><b>Repetix</b> fins que només quede $R_{eq}$.</li>
          <li>Calcula la <b>intensitat total</b>: $I = V / R_{eq}$.</li>
          <li><b>Torna enrere</b> pels circuits simplificats per a trobar el voltatge i la intensitat de cada element.</li>
        </ol>
        <div class="callout"><b>Mira la reducció:</b> usa els botons <b>◀ ▶</b> de la dreta per a veure com el circuit es va simplificant.</div>
        <div class="chips"><span class="chip v">$V = ${n(v.V)}\ \text{V}$</span><span class="chip">$R_1 = ${n(v.R1)}\ \Omega$</span><span class="chip">$R_2 = ${n(v.R2)}\ \Omega$</span><span class="chip">$R_3 = ${n(v.R3)}\ \Omega$</span></div>
      `) + practiceBlock(qs, 'Seguix l\'estratègia: primer redueix, després torna enrere.');
      const shown = new Set();
      let stepI = 0;
      const STEPS = [
        { t: 'Circuit original', d: r`$R_1$ està en sèrie amb el grup format per $R_2$ i $R_3$, que estan en paral·lel.` },
        { t: '1. Identifiquem el paral·lel', d: r`$R_2$ i $R_3$ estan connectades entre els mateixos dos nusos: $R_{23} = \dfrac{R_2 R_3}{R_2 + R_3}$` },
        { t: '2. Substituïm el grup', d: r`Ara el circuit és una sèrie simple: $R_{eq} = R_1 + R_{23}$` },
        { t: '3. Circuit equivalent', d: r`Una sola resistència: $I = V / R_{eq}$. Després tornem enrere per a trobar $V_1$ i $V_{23}$.` },
      ];
      const st = stageShell(stage, {
        eyebrow: 'Reducció pas a pas',
        title: '',
        tools: `<button class="btn btn-ghost btn-sm btn-icon" data-d="-1" aria-label="Anterior">◀</button><span class="step-count"></span><button class="btn btn-ghost btn-sm btn-icon" data-d="1" aria-label="Següent">▶</button>`,
      });
      const qsState = { R23: false };
      const draw = () => {
        const sv = (key, val, unit) => (shown.has(key) || qsState[key] ? `${fmt(val)} ${unit}` : '?');
        const tags = [
          { x: 112, y: 150, name: 'I', value: shown.has('I') ? `= ${fmt(s.I)} A ↑` : '= ?', cls: 'cur' },
        ];
        let svg;
        if (stepI <= 1) svg = tA.layout(v, s, shown, { groups: stepI === 1 });
        else if (stepI === 2)
          svg = loopLayout({
            V: v.V, I: s.I, tags,
            items: [
              { type: 'R', id: 'R1', name: 'R_1', value: `${fmt(v.R1)} Ω`, heat: 0.35 },
              { type: 'R', id: 'R23', name: 'R_23', value: sv('R23', s.R23, 'Ω'), heat: 0.35 },
            ],
          });
        else
          svg = loopLayout({
            V: v.V, I: s.I, tags,
            items: [{ type: 'R', id: 'Req', name: 'R_eq', value: sv('Req', s.Req, 'Ω'), heat: 0.5 }],
          });
        st.setSvg(svg);
        stage.querySelector('.stage-head h3').textContent = STEPS[stepI].t;
        st.tools.querySelector('.step-count').textContent = `${stepI + 1} / ${STEPS.length}`;
        st.setFoot(`<p class="stage-note">${rich(STEPS[stepI].d)}</p>`);
      };
      st.tools.querySelectorAll('[data-d]').forEach((b) =>
        b.addEventListener('click', () => {
          stepI = Math.max(0, Math.min(STEPS.length - 1, stepI + +b.dataset.d));
          draw();
        })
      );
      wirePractice(body, qs, {
        id: 'mixtos', ...ctx, remount: () => this.mount(ctx),
        onFocus: (q) => st.highlight(q.focus),
        onChange: (q, s2) => {
          if (s2.status === 'wrong') return;
          q.reveal.forEach((x) => shown.add(x));
          if (q.id === 'R23') qsState.R23 = true;
          draw();
        },
      });
      draw();
    },
  },

  // ───────────────────────────── 10
  {
    id: 'resum',
    title: 'Resum i taller',
    kind: 'teoria',
    mount({ body, stage, complete }) {
      complete();
      body.innerHTML = rich(r`
        <h1 class="title"><span class="grad">Resum</span> de fórmules</h1>
        <p class="lead">Ja tens totes les eines. Ací tens la xuleta per a resoldre qualsevol circuit:</p>
        <div class="table-wrap"><table class="mag sum">
          <thead><tr><th></th><th>Sèrie</th><th>Paral·lel</th></tr></thead>
          <tbody>
            <tr><td>Intensitat</td><td>$I = I_1 = I_2$</td><td>$I = I_1 + I_2$</td></tr>
            <tr><td>Voltatge</td><td>$V = V_1 + V_2$</td><td>$V = V_1 = V_2$</td></tr>
            <tr><td>Resistència</td><td>$R_{eq} = R_1 + R_2$</td><td>$\frac{1}{R_{eq}} = \frac{1}{R_1} + \frac{1}{R_2}$</td></tr>
            <tr><td>Si es fon un element…</td><td>s'apaga tot</td><td>la resta funciona</td></tr>
          </tbody>
        </table></div>
        <div class="formula-hero">$$V = I \cdot R \qquad P = V \cdot I$$</div>
        <h3>El taller</h3>
        <p>Al <b>taller</b> trobaràs 5 plantilles de circuits mixtos, de menys a més dificultat. Cada vegada que prems <b>🎲 Nous valors</b> el circuit canvia de valors i tens un <b>codi</b> per a compartir-lo (per exemple, perquè tota la classe tinga el mateix exercici).</p>
        <a class="btn btn-primary btn-lg" href="#/taller/A">Anar al taller →</a>
      `);
      const st = stageShell(stage, { eyebrow: 'Taller', title: 'Tria un circuit per a practicar' });
      st.canvas.classList.add('thumbs');
      st.setSvg(
        templates
          .map((t) => {
            const v = t.gen(makeRng(11));
            const s = t.solve(v);
            return `<a class="thumb" href="#/taller/${t.id}">
              <div class="thumb-svg">${t.layout(v, s, new Set())}</div>
              <div class="thumb-cap"><b>${t.id}</b><span>${t.short}</span><i>${'●'.repeat(t.level)}${'○'.repeat(3 - t.level)}</i></div>
            </a>`;
          })
          .join('')
      );
    },
  },
];
