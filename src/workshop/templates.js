// Plantilles del taller: circuits mixtos (sèrie + paral·lel).
// Cada plantilla sap: generar valors "amables" a partir d'una llavor, resoldre el circuit,
// formular les preguntes (amb explicació) i dibuixar-se.
import { circuit } from '../circuit/svg.js';
import { fmt, n, par } from '../lib/format.js';
import { r } from '../lib/tex.js';
import { Q } from '../ui/quiz.js';

// Parelles en paral·lel amb resultat enter (R1·R2/(R1+R2))
const NICE = [
  [2, 2], [3, 6], [4, 4], [4, 12], [6, 6], [6, 12], [5, 20], [10, 10], [10, 15], [12, 12],
  [8, 8], [20, 20], [15, 30], [20, 30], [10, 40], [8, 24], [6, 30], [30, 60], [9, 18], [12, 36],
];
const SER = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

function pair(rng, filter = () => true) {
  let [a, b] = rng.pick(NICE.filter(filter));
  if (rng.next() < 0.5) [a, b] = [b, a];
  return [a, b];
}

/** Tria un voltatge tal que la intensitat total siga "bonica". */
export function chooseV(rng, Req) {
  const Is = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6];
  const c = Is.map((i) => i * Req).filter((v) => Math.abs(v - Math.round(v)) < 1e-9 && v >= 3 && v <= 60);
  const common = c.filter((v) => [3, 4.5, 6, 9, 12, 18, 24, 30, 36, 48, 60].includes(v));
  if (common.length && rng.next() < 0.8) return rng.pick(common);
  return c.length ? rng.pick(c) : rng.pick([6, 9, 12, 24]);
}

const bat = (v) => ({ type: 'B', x: 100, y: 220, value: `${fmt(v.V)} V`, tip: `Pila\nV = ${fmt(v.V)} V` });

/** Constructor de resistències amb mesures que només apareixen quan s'han resolt. */
function builder(v, s, sh, ks) {
  const P = Object.fromEntries(ks.map((k) => [k, s['V' + k] * s['I' + k]]));
  const Pmax = Math.max(...Object.values(P));
  return (k, x, y, dir = 'h', side) => {
    const id = 'R' + k;
    const hasV = sh.has('V' + k), hasI = sh.has('I' + k);
    const meas = [hasV && `${fmt(s['V' + k])} V`, hasI && `${fmt(s['I' + k])} A`].filter(Boolean).join(' · ');
    return {
      type: 'R', id, x, y, dir, side,
      name: `R_${k}`, value: `${fmt(v[id])} Ω`, meas,
      heat: 0.12 + (0.6 * P[k]) / Pmax,
      tip: [`Resistència R${k}`, `R = ${fmt(v[id])} Ω`, `V = ${hasV ? fmt(s['V' + k]) + ' V' : '?'}`, `I = ${hasI ? fmt(s['I' + k]) + ' A' : '?'}`].join('\n'),
    };
  };
}

const baseTags = (s, sh, iy = 150, ry = 300) => [
  { x: 112, y: iy, name: 'I', value: sh.has('I') ? `= ${fmt(s.I)} A ↑` : '= ?', cls: 'cur' },
  { x: 112, y: ry, name: 'R_eq', value: sh.has('Req') ? `= ${fmt(s.Req)} Ω` : '= ?', cls: 'req' },
];

// Preguntes comunes
const qI = (v, s) =>
  Q('I', r`Intensitat total $I$ que ix de la pila`, 'A', s.I, {
    explain: r`I=\dfrac{V}{R_{eq}}=\dfrac{${n(v.V)}}{${n(s.Req)}}=${n(s.I)}\,\text{A}`,
    hint: r`Aplica la llei d'Ohm a tot el circuit: $I = V / R_{eq}$.`,
    focus: ['B'], reveal: ['I'],
  });
const qP = (v, s) =>
  Q('P', r`Potència total que subministra la pila`, 'W', s.P, {
    explain: r`P=V\cdot I=${n(v.V)}\cdot ${n(s.I)}=${n(s.P)}\,\text{W}`,
    hint: r`$P = V \cdot I$`, focus: ['B'], reveal: [],
  });

export const templates = [
  // ───────────────────────── A ─────────────────────────
  {
    id: 'A', level: 1, ks: [1, 2, 3],
    name: 'Sèrie amb un paral·lel',
    short: 'R₁ + (R₂ ∥ R₃)',
    formula: r`R_1 + (R_2 \parallel R_3)`,
    desc: 'Una resistència en sèrie amb un grup de dues resistències en paral·lel. És el circuit mixt més senzill.',
    gen(rng) {
      const [R2, R3] = pair(rng);
      const R1 = rng.pick(SER);
      return { R1, R2, R3, V: chooseV(rng, R1 + par(R2, R3)) };
    },
    solve({ V, R1, R2, R3 }) {
      const R23 = par(R2, R3), Req = R1 + R23, I = V / Req, V1 = I * R1, V23 = I * R23;
      return { R23, Req, I, V1, V23, I1: I, V2: V23, V3: V23, I2: V23 / R2, I3: V23 / R3, P: V * I };
    },
    questions: (v, s) => [
      Q('Req', r`Resistència equivalent $R_{eq}$`, 'Ω', s.Req, {
        explain: r`R_{23}=\dfrac{${n(v.R2)}\cdot ${n(v.R3)}}{${n(v.R2)}+${n(v.R3)}}=${n(s.R23)}\,\Omega\qquad R_{eq}=R_1+R_{23}=${n(v.R1)}+${n(s.R23)}=${n(s.Req)}\,\Omega`,
        hint: r`Primer redueix el paral·lel $R_2 \parallel R_3$ i després suma $R_1$.`,
        focus: ['R1', 'R2', 'R3'], reveal: ['Req'],
      }),
      { ...qI(v, s), reveal: ['I', 'I1'] },
      Q('V1', r`Voltatge en $R_1$`, 'V', s.V1, {
        explain: r`V_1=I\cdot R_1=${n(s.I)}\cdot ${n(v.R1)}=${n(s.V1)}\,\text{V}`,
        hint: r`Per $R_1$ passa tota la intensitat: $V_1 = I \cdot R_1$.`,
        focus: ['R1'], reveal: ['V1'],
      }),
      Q('V23', r`Voltatge en el paral·lel ($V_2 = V_3$)`, 'V', s.V23, {
        explain: r`V_{23}=V-V_1=${n(v.V)}-${n(s.V1)}=${n(s.V23)}\,\text{V}`,
        hint: r`El voltatge de la pila es repartix: $V = V_1 + V_{23}$.`,
        focus: ['R2', 'R3'], reveal: ['V2', 'V3'],
      }),
      Q('I2', r`Intensitat per $R_2$`, 'A', s.I2, {
        explain: r`I_2=\dfrac{V_{23}}{R_2}=\dfrac{${n(s.V23)}}{${n(v.R2)}}=${n(s.I2)}\,\text{A}`,
        hint: r`$I_2 = V_2 / R_2$`, focus: ['R2'], reveal: ['I2'],
      }),
      Q('I3', r`Intensitat per $R_3$`, 'A', s.I3, {
        explain: r`I_3=\dfrac{V_{23}}{R_3}=\dfrac{${n(s.V23)}}{${n(v.R3)}}=${n(s.I3)}\,\text{A}\quad(I_2+I_3=I)`,
        hint: r`$I_3 = V_3 / R_3$. Comprova que $I_2 + I_3 = I$.`, focus: ['R3'], reveal: ['I3'],
      }),
      qP(v, s),
    ],
    layout(v, s, sh, { groups = false } = {}) {
      const R = builder(v, s, sh, this.ks);
      return circuit({
        wires: [
          { pts: [[100, 212], [100, 80], [420, 80]], I: s.I },
          { pts: [[420, 80], [420, 360]], I: s.I2 },
          { pts: [[420, 80], [600, 80], [600, 360], [420, 360]], I: s.I3 },
          { pts: [[420, 360], [100, 360], [100, 228]], I: s.I },
        ],
        nodes: [[420, 80], [420, 360]],
        comps: [bat(v), R(1, 250, 80), R(2, 420, 220, 'v'), R(3, 600, 220, 'v')],
        tags: baseTags(s, sh),
        groups: groups ? [{ x: 392, y: 146, w: 316, h: 148, name: 'R_23', value: '= R₂ ∥ R₃' }] : [],
      });
    },
  },

  // ───────────────────────── B ─────────────────────────
  {
    id: 'B', level: 1, ks: [1, 2, 3],
    name: 'Branca en sèrie dins d’un paral·lel',
    short: '(R₁ + R₂) ∥ R₃',
    formula: r`(R_1 + R_2) \parallel R_3`,
    desc: 'Dues branques en paral·lel: una té dues resistències en sèrie i l’altra només una.',
    gen(rng) {
      let [a, b] = pair(rng, ([x, y]) => Math.max(x, y) >= 3);
      if (a < 3 || (b >= 3 && rng.next() < 0.5)) [a, b] = [b, a];
      const opts = SER.filter((x) => x < a);
      const R1 = rng.pick(opts);
      return { R1, R2: a - R1, R3: b, V: chooseV(rng, par(a, b)) };
    },
    solve({ V, R1, R2, R3 }) {
      const R12 = R1 + R2, Req = par(R12, R3), I = V / Req, I12 = V / R12, I3 = V / R3;
      return { R12, Req, I, I12, I1: I12, I2: I12, I3, V1: I12 * R1, V2: I12 * R2, V3: V, P: V * I };
    },
    questions: (v, s) => [
      Q('Req', r`Resistència equivalent $R_{eq}$`, 'Ω', s.Req, {
        explain: r`R_{12}=R_1+R_2=${n(v.R1)}+${n(v.R2)}=${n(s.R12)}\,\Omega\qquad R_{eq}=\dfrac{${n(s.R12)}\cdot ${n(v.R3)}}{${n(s.R12)}+${n(v.R3)}}=${n(s.Req)}\,\Omega`,
        hint: r`Primer suma la sèrie $R_{12}=R_1+R_2$; després fes el paral·lel amb $R_3$.`,
        focus: ['R1', 'R2', 'R3'], reveal: ['Req'],
      }),
      qI(v, s),
      Q('I12', r`Intensitat per la branca de $R_1$ i $R_2$`, 'A', s.I12, {
        explain: r`I_{12}=\dfrac{V}{R_{12}}=\dfrac{${n(v.V)}}{${n(s.R12)}}=${n(s.I12)}\,\text{A}`,
        hint: r`Cada branca té tot el voltatge de la pila: $I_{12} = V / (R_1+R_2)$.`,
        focus: ['R1', 'R2'], reveal: ['I1', 'I2'],
      }),
      Q('I3', r`Intensitat per $R_3$`, 'A', s.I3, {
        explain: r`I_3=\dfrac{V}{R_3}=\dfrac{${n(v.V)}}{${n(v.R3)}}=${n(s.I3)}\,\text{A}\quad(I_{12}+I_3=I)`,
        hint: r`$R_3$ està directament connectada a la pila: $I_3 = V / R_3$.`,
        focus: ['R3'], reveal: ['I3', 'V3'],
      }),
      Q('V1', r`Voltatge en $R_1$`, 'V', s.V1, {
        explain: r`V_1=I_{12}\cdot R_1=${n(s.I12)}\cdot ${n(v.R1)}=${n(s.V1)}\,\text{V}`,
        hint: r`$V_1 = I_{12} \cdot R_1$`, focus: ['R1'], reveal: ['V1'],
      }),
      Q('V2', r`Voltatge en $R_2$`, 'V', s.V2, {
        explain: r`V_2=I_{12}\cdot R_2=${n(s.I12)}\cdot ${n(v.R2)}=${n(s.V2)}\,\text{V}\quad(V_1+V_2=V)`,
        hint: r`$V_2 = I_{12} \cdot R_2$, o bé $V_2 = V - V_1$.`, focus: ['R2'], reveal: ['V2'],
      }),
      qP(v, s),
    ],
    layout(v, s, sh, { groups = false } = {}) {
      const R = builder(v, s, sh, this.ks);
      return circuit({
        wires: [
          { pts: [[100, 212], [100, 80], [380, 80]], I: s.I },
          { pts: [[380, 80], [380, 360]], I: s.I12 },
          { pts: [[380, 80], [580, 80], [580, 360], [380, 360]], I: s.I3 },
          { pts: [[380, 360], [100, 360], [100, 228]], I: s.I },
        ],
        nodes: [[380, 80], [380, 360]],
        comps: [bat(v), R(1, 380, 155, 'v'), R(2, 380, 285, 'v'), R(3, 580, 220, 'v')],
        tags: baseTags(s, sh),
        groups: groups ? [{ x: 348, y: 104, w: 168, h: 232, name: 'R_12', value: '= R₁ + R₂' }] : [],
      });
    },
  },

  // ───────────────────────── C ─────────────────────────
  {
    id: 'C', level: 2, ks: [1, 2, 3, 4],
    name: 'Paral·lel entre dues sèries',
    short: 'R₁ + (R₂ ∥ R₃) + R₄',
    formula: r`R_1 + (R_2 \parallel R_3) + R_4`,
    desc: 'Un grup en paral·lel situat entre dues resistències en sèrie (una a dalt i una a baix).',
    gen(rng) {
      const [R2, R3] = pair(rng);
      const R1 = rng.pick(SER), R4 = rng.pick(SER);
      return { R1, R2, R3, R4, V: chooseV(rng, R1 + R4 + par(R2, R3)) };
    },
    solve({ V, R1, R2, R3, R4 }) {
      const R23 = par(R2, R3), Req = R1 + R23 + R4, I = V / Req, V23 = I * R23;
      return {
        R23, Req, I, V23, I1: I, I4: I, V1: I * R1, V4: I * R4,
        V2: V23, V3: V23, I2: V23 / R2, I3: V23 / R3, P: V * I,
      };
    },
    questions: (v, s) => [
      Q('Req', r`Resistència equivalent $R_{eq}$`, 'Ω', s.Req, {
        explain: r`R_{23}=\dfrac{${n(v.R2)}\cdot ${n(v.R3)}}{${n(v.R2)}+${n(v.R3)}}=${n(s.R23)}\,\Omega\qquad R_{eq}=${n(v.R1)}+${n(s.R23)}+${n(v.R4)}=${n(s.Req)}\,\Omega`,
        hint: r`Redueix $R_2 \parallel R_3$ i suma-li $R_1$ i $R_4$ (estan en sèrie).`,
        focus: ['R1', 'R2', 'R3', 'R4'], reveal: ['Req'],
      }),
      { ...qI(v, s), reveal: ['I', 'I1', 'I4'] },
      Q('V1', r`Voltatge en $R_1$`, 'V', s.V1, {
        explain: r`V_1=I\cdot R_1=${n(s.I)}\cdot ${n(v.R1)}=${n(s.V1)}\,\text{V}`,
        hint: r`$V_1 = I \cdot R_1$`, focus: ['R1'], reveal: ['V1'],
      }),
      Q('V4', r`Voltatge en $R_4$`, 'V', s.V4, {
        explain: r`V_4=I\cdot R_4=${n(s.I)}\cdot ${n(v.R4)}=${n(s.V4)}\,\text{V}`,
        hint: r`$V_4 = I \cdot R_4$`, focus: ['R4'], reveal: ['V4'],
      }),
      Q('V23', r`Voltatge en el paral·lel ($V_2 = V_3$)`, 'V', s.V23, {
        explain: r`V_{23}=V-V_1-V_4=${n(v.V)}-${n(s.V1)}-${n(s.V4)}=${n(s.V23)}\,\text{V}`,
        hint: r`$V_{23} = I \cdot R_{23}$, o bé $V - V_1 - V_4$.`, focus: ['R2', 'R3'], reveal: ['V2', 'V3'],
      }),
      Q('I2', r`Intensitat per $R_2$`, 'A', s.I2, {
        explain: r`I_2=\dfrac{V_{23}}{R_2}=\dfrac{${n(s.V23)}}{${n(v.R2)}}=${n(s.I2)}\,\text{A}`,
        hint: r`$I_2 = V_{23} / R_2$`, focus: ['R2'], reveal: ['I2'],
      }),
      Q('I3', r`Intensitat per $R_3$`, 'A', s.I3, {
        explain: r`I_3=\dfrac{V_{23}}{R_3}=\dfrac{${n(s.V23)}}{${n(v.R3)}}=${n(s.I3)}\,\text{A}`,
        hint: r`$I_3 = V_{23} / R_3$`, focus: ['R3'], reveal: ['I3'],
      }),
      qP(v, s),
    ],
    layout(v, s, sh, { groups = false } = {}) {
      const R = builder(v, s, sh, this.ks);
      return circuit({
        wires: [
          { pts: [[100, 212], [100, 80], [420, 80]], I: s.I },
          { pts: [[420, 80], [420, 360]], I: s.I2 },
          { pts: [[420, 80], [600, 80], [600, 360], [420, 360]], I: s.I3 },
          { pts: [[420, 360], [100, 360], [100, 228]], I: s.I },
        ],
        nodes: [[420, 80], [420, 360]],
        comps: [bat(v), R(1, 250, 80), R(2, 420, 220, 'v'), R(3, 600, 220, 'v'), R(4, 260, 360)],
        tags: baseTags(s, sh, 150, 290),
        groups: groups ? [{ x: 392, y: 146, w: 316, h: 148, name: 'R_23', value: '= R₂ ∥ R₃' }] : [],
      });
    },
  },

  // ───────────────────────── D ─────────────────────────
  {
    id: 'D', level: 2, ks: [1, 2, 3, 4],
    name: 'Dos paral·lels en sèrie',
    short: '(R₁ ∥ R₂) + (R₃ ∥ R₄)',
    formula: r`(R_1 \parallel R_2) + (R_3 \parallel R_4)`,
    desc: 'Dos grups en paral·lel connectats un darrere l’altre. Tota la intensitat passa per cada grup.',
    gen(rng) {
      const [R1, R2] = pair(rng);
      const [R3, R4] = pair(rng, ([a, b]) => !(a === R1 && b === R2) && !(a === R2 && b === R1));
      return { R1, R2, R3, R4, V: chooseV(rng, par(R1, R2) + par(R3, R4)) };
    },
    solve({ V, R1, R2, R3, R4 }) {
      const R12 = par(R1, R2), R34 = par(R3, R4), Req = R12 + R34, I = V / Req;
      const V12 = I * R12, V34 = I * R34;
      return {
        R12, R34, Req, I, V12, V34, V1: V12, V2: V12, V3: V34, V4: V34,
        I1: V12 / R1, I2: V12 / R2, I3: V34 / R3, I4: V34 / R4, P: V * I,
      };
    },
    questions: (v, s) => [
      Q('Req', r`Resistència equivalent $R_{eq}$`, 'Ω', s.Req, {
        explain: r`R_{12}=\dfrac{${n(v.R1)}\cdot ${n(v.R2)}}{${n(v.R1)}+${n(v.R2)}}=${n(s.R12)}\,\Omega\quad R_{34}=\dfrac{${n(v.R3)}\cdot ${n(v.R4)}}{${n(v.R3)}+${n(v.R4)}}=${n(s.R34)}\,\Omega\quad R_{eq}=${n(s.R12)}+${n(s.R34)}=${n(s.Req)}\,\Omega`,
        hint: r`Calcula $R_{12}$ i $R_{34}$ per separat i després suma'ls (estan en sèrie).`,
        focus: ['R1', 'R2', 'R3', 'R4'], reveal: ['Req'],
      }),
      qI(v, s),
      Q('V12', r`Voltatge en el primer grup ($V_1 = V_2$)`, 'V', s.V12, {
        explain: r`V_{12}=I\cdot R_{12}=${n(s.I)}\cdot ${n(s.R12)}=${n(s.V12)}\,\text{V}`,
        hint: r`$V_{12} = I \cdot R_{12}$`, focus: ['R1', 'R2'], reveal: ['V1', 'V2'],
      }),
      Q('V34', r`Voltatge en el segon grup ($V_3 = V_4$)`, 'V', s.V34, {
        explain: r`V_{34}=V-V_{12}=${n(v.V)}-${n(s.V12)}=${n(s.V34)}\,\text{V}`,
        hint: r`$V_{34} = I \cdot R_{34}$, o bé $V - V_{12}$.`, focus: ['R3', 'R4'], reveal: ['V3', 'V4'],
      }),
      Q('I1', r`Intensitat per $R_1$`, 'A', s.I1, {
        explain: r`I_1=\dfrac{V_{12}}{R_1}=\dfrac{${n(s.V12)}}{${n(v.R1)}}=${n(s.I1)}\,\text{A}`,
        hint: r`$I_1 = V_{12} / R_1$`, focus: ['R1'], reveal: ['I1'],
      }),
      Q('I2', r`Intensitat per $R_2$`, 'A', s.I2, {
        explain: r`I_2=\dfrac{V_{12}}{R_2}=${n(s.I2)}\,\text{A}\quad(I_1+I_2=I)`,
        hint: r`$I_2 = V_{12} / R_2$, o bé $I - I_1$.`, focus: ['R2'], reveal: ['I2'],
      }),
      Q('I3', r`Intensitat per $R_3$`, 'A', s.I3, {
        explain: r`I_3=\dfrac{V_{34}}{R_3}=\dfrac{${n(s.V34)}}{${n(v.R3)}}=${n(s.I3)}\,\text{A}`,
        hint: r`$I_3 = V_{34} / R_3$`, focus: ['R3'], reveal: ['I3'],
      }),
      Q('I4', r`Intensitat per $R_4$`, 'A', s.I4, {
        explain: r`I_4=\dfrac{V_{34}}{R_4}=${n(s.I4)}\,\text{A}\quad(I_3+I_4=I)`,
        hint: r`$I_4 = V_{34} / R_4$, o bé $I - I_3$.`, focus: ['R4'], reveal: ['I4'],
      }),
    ],
    layout(v, s, sh, { groups = false } = {}) {
      const R = builder(v, s, sh, this.ks);
      return circuit({
        wires: [
          { pts: [[100, 212], [100, 110], [200, 110]], I: s.I },
          { pts: [[200, 110], [200, 60], [440, 60], [440, 110]], I: s.I1 },
          { pts: [[200, 110], [200, 160], [440, 160], [440, 110]], I: s.I2 },
          { pts: [[440, 110], [620, 110], [620, 330], [440, 330]], I: s.I },
          { pts: [[440, 330], [440, 280], [200, 280], [200, 330]], I: s.I3 },
          { pts: [[440, 330], [440, 380], [200, 380], [200, 330]], I: s.I4 },
          { pts: [[200, 330], [100, 330], [100, 228]], I: s.I },
        ],
        nodes: [[200, 110], [440, 110], [440, 330], [200, 330]],
        comps: [bat(v), R(1, 320, 60), R(2, 320, 160), R(3, 320, 280), R(4, 320, 380)],
        tags: baseTags(s, sh, 152, 292),
        groups: groups
          ? [
              { x: 172, y: 26, w: 296, h: 178, name: 'R_12', value: '= R₁ ∥ R₂' },
              { x: 172, y: 246, w: 296, h: 178, name: 'R_34', value: '= R₃ ∥ R₄' },
            ]
          : [],
      });
    },
  },

  // ───────────────────────── E ─────────────────────────
  {
    id: 'E', level: 3, ks: [1, 2, 3, 4],
    name: 'Repte: paral·lel dins d’un paral·lel',
    short: 'R₁ ∥ (R₂ + R₃ ∥ R₄)',
    formula: r`R_1 \parallel \big(R_2 + (R_3 \parallel R_4)\big)`,
    desc: 'Repte final! Una branca simple en paral·lel amb una branca que conté una sèrie i un altre paral·lel.',
    w: 760,
    gen(rng) {
      // parella exterior (R1, X) amb X = R2 + R34
      for (;;) {
        let [a, b] = pair(rng, ([x, y]) => Math.max(x, y) >= 4);
        if (a < 4 || (b >= 4 && rng.next() < 0.5)) [a, b] = [b, a];
        const X = a, R1 = b;
        const inner = NICE.filter(([p, q]) => par(p, q) <= X - 1);
        if (!inner.length) continue;
        let [R3, R4] = rng.pick(inner);
        if (rng.next() < 0.5) [R3, R4] = [R4, R3];
        const R2 = X - par(R3, R4);
        return { R1, R2, R3, R4, V: chooseV(rng, par(R1, X)) };
      }
    },
    solve({ V, R1, R2, R3, R4 }) {
      const R34 = par(R3, R4), Rb = R2 + R34, Req = par(R1, Rb), I = V / Req;
      const Ib = V / Rb, V2 = Ib * R2, V34 = Ib * R34;
      return {
        R34, Rb, Req, I, Ib, V2, V34, I1: V / R1, V1: V, I2: Ib,
        V3: V34, V4: V34, I3: V34 / R3, I4: V34 / R4, P: V * I,
      };
    },
    questions: (v, s) => [
      Q('Req', r`Resistència equivalent $R_{eq}$`, 'Ω', s.Req, {
        explain: r`R_{34}=\dfrac{${n(v.R3)}\cdot ${n(v.R4)}}{${n(v.R3)}+${n(v.R4)}}=${n(s.R34)}\,\Omega\quad R_b=R_2+R_{34}=${n(s.Rb)}\,\Omega\quad R_{eq}=\dfrac{${n(v.R1)}\cdot ${n(s.Rb)}}{${n(v.R1)}+${n(s.Rb)}}=${n(s.Req)}\,\Omega`,
        hint: r`De dins cap a fora: $R_{34}$, després $R_b = R_2 + R_{34}$ i finalment $R_1 \parallel R_b$.`,
        focus: ['R1', 'R2', 'R3', 'R4'], reveal: ['Req'],
      }),
      qI(v, s),
      Q('I1', r`Intensitat per $R_1$`, 'A', s.I1, {
        explain: r`I_1=\dfrac{V}{R_1}=\dfrac{${n(v.V)}}{${n(v.R1)}}=${n(s.I1)}\,\text{A}`,
        hint: r`$R_1$ té tot el voltatge de la pila.`, focus: ['R1'], reveal: ['I1', 'V1'],
      }),
      Q('I2', r`Intensitat per $R_2$ (branca de la dreta)`, 'A', s.I2, {
        explain: r`I_2=I-I_1=${n(s.I)}-${n(s.I1)}=${n(s.I2)}\,\text{A}`,
        hint: r`$I_2 = V / R_b$, o bé $I - I_1$.`, focus: ['R2', 'R3', 'R4'], reveal: ['I2'],
      }),
      Q('V2', r`Voltatge en $R_2$`, 'V', s.V2, {
        explain: r`V_2=I_2\cdot R_2=${n(s.I2)}\cdot ${n(v.R2)}=${n(s.V2)}\,\text{V}`,
        hint: r`$V_2 = I_2 \cdot R_2$`, focus: ['R2'], reveal: ['V2'],
      }),
      Q('V34', r`Voltatge en el paral·lel $R_3 \parallel R_4$`, 'V', s.V34, {
        explain: r`V_{34}=V-V_2=${n(v.V)}-${n(s.V2)}=${n(s.V34)}\,\text{V}`,
        hint: r`$V_{34} = V - V_2$`, focus: ['R3', 'R4'], reveal: ['V3', 'V4'],
      }),
      Q('I3', r`Intensitat per $R_3$`, 'A', s.I3, {
        explain: r`I_3=\dfrac{V_{34}}{R_3}=\dfrac{${n(s.V34)}}{${n(v.R3)}}=${n(s.I3)}\,\text{A}`,
        hint: r`$I_3 = V_{34} / R_3$`, focus: ['R3'], reveal: ['I3'],
      }),
      Q('I4', r`Intensitat per $R_4$`, 'A', s.I4, {
        explain: r`I_4=\dfrac{V_{34}}{R_4}=${n(s.I4)}\,\text{A}\quad(I_3+I_4=I_2)`,
        hint: r`$I_4 = V_{34} / R_4$, o bé $I_2 - I_3$.`, focus: ['R4'], reveal: ['I4'],
      }),
    ],
    layout(v, s, sh, { groups = false } = {}) {
      const R = builder(v, s, sh, this.ks);
      return circuit({
        w: 760,
        wires: [
          { pts: [[100, 212], [100, 80], [260, 80]], I: s.I },
          { pts: [[260, 80], [260, 360]], I: s.I1 },
          { pts: [[260, 80], [500, 80]], I: s.Ib },
          { pts: [[500, 80], [500, 360]], I: s.I3 },
          { pts: [[500, 80], [660, 80], [660, 360], [500, 360]], I: s.I4 },
          { pts: [[500, 360], [260, 360]], I: s.Ib },
          { pts: [[260, 360], [100, 360], [100, 228]], I: s.I },
        ],
        nodes: [[260, 80], [500, 80], [500, 360], [260, 360]],
        comps: [bat(v), R(1, 260, 220, 'v'), R(2, 380, 80), R(3, 500, 220, 'v'), R(4, 660, 220, 'v')],
        tags: baseTags(s, sh),
        groups: groups
          ? [
              { x: 474, y: 150, w: 280, h: 140, name: 'R_34', value: '= R₃ ∥ R₄' },
              { x: 336, y: 30, w: 422, h: 356, name: 'R_b', value: '= R₂ + R₃₄', cls: 'alt' },
            ]
          : [],
      });
    },
  },
];

export const byId = (id) => templates.find((t) => t.id === id) || templates[0];
