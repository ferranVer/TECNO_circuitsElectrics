// Disposicions reutilitzables per al tutorial: bucle simple (sèrie) i escala (paral·lel).
import { circuit } from './svg.js';
import { fmt } from '../lib/format.js';

export const BX = 100, BY = 220, TOP = 90, BOT = 350, RIGHT = 620;

const bat = (V) => ({ type: 'B', x: BX, y: BY, value: `${fmt(V)} V`, tip: `Generador (pila)\nV = ${fmt(V)} V` });

/** Components en sèrie sobre el cable superior. Opcionalment, un interruptor al cable inferior. */
export function loopLayout({ V, Vlabel, items, I, withSwitch = false, closed = true, Imax, tags = [], groups = [] }) {
  const n = items.length;
  const gap = n <= 2 ? 200 : 150;
  const comps = items.map((c, i) => ({ dir: 'h', ...c, x: 360 + (i - (n - 1) / 2) * gap, y: TOP }));
  const wires = withSwitch
    ? [
        { pts: [[BX, BY - 8], [BX, TOP], [RIGHT, TOP], [RIGHT, BOT], [382, BOT]], I },
        { pts: [[338, BOT], [BX, BOT], [BX, BY + 8]], I },
      ]
    : [{ pts: [[BX, BY - 8], [BX, TOP], [RIGHT, TOP], [RIGHT, BOT], [BX, BOT], [BX, BY + 8]], I }];
  const b = bat(V);
  if (Vlabel) b.value = Vlabel;
  const all = [b, ...comps];
  if (withSwitch) all.push({ type: 'S', id: 'S', x: 360, y: BOT, closed, tip: 'Element de control: interruptor' });
  return circuit({ wires, comps: all, tags, groups, Imax });
}

/** Branques en paral·lel entre el cable superior i l'inferior. currents[i] = intensitat de cada branca. */
export function parallelLayout({ V, items, currents, Imax, tags = [] }) {
  const n = items.length;
  const xs = n === 1 ? [450] : n === 2 ? [330, 530] : [290, 445, 600];
  const suf = [];
  let acc = 0;
  for (let i = n - 1; i >= 0; i--) { acc += currents[i]; suf[i] = acc; }
  const It = suf[0];
  const wires = [{ pts: [[BX, BY - 8], [BX, TOP], [xs[0], TOP]], I: It }];
  const nodes = [];
  for (let i = 0; i < n; i++) {
    wires.push({ pts: [[xs[i], TOP], [xs[i], BOT]], I: currents[i] });
    if (i < n - 1) {
      wires.push({ pts: [[xs[i], TOP], [xs[i + 1], TOP]], I: suf[i + 1] });
      wires.push({ pts: [[xs[i + 1], BOT], [xs[i], BOT]], I: suf[i + 1] });
      nodes.push([xs[i], TOP], [xs[i], BOT]);
    }
  }
  wires.push({ pts: [[xs[0], BOT], [BX, BOT], [BX, BY + 8]], I: It });
  const comps = [bat(V), ...items.map((c, i) => ({ ...c, x: xs[i], y: 220, dir: 'v' }))];
  return circuit({ wires, comps, nodes, tags, Imax });
}

export const batteryComp = bat;
