// Mini-llibreria per a dibuixar circuits en SVG (símbols normalitzats IEC).
// Els cables es dibuixen en el sentit convencional del corrent (+ → −);
// la capa .flow porta els "punts" de corrent que anima animator.js.

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** "R_23" → R amb subíndex 23; "V" → V */
export function label(name, value) {
  const [base, subi] = String(name).split('_');
  let s = `<tspan class="nm">${esc(base)}</tspan>`;
  if (subi) s += `<tspan class="nm sub" dy="4">${esc(subi)}</tspan>`;
  if (value) s += `<tspan class="val" dx="6"${subi ? ' dy="-4"' : ''}>${esc(value)}</tspan>`;
  return s;
}

const tipAttr = (c) => (c.tip ? ` data-tip="${esc(c.tip)}"` : '');

function labels(c, r) {
  const { x, y, dir = 'h', side, name, value, meas } = c;
  if (!name && !meas) return '';
  if (dir === 'h') {
    const below = side === 'below';
    const ly = below ? y + r + 19 : y - r - 9;
    const my = below ? y + r + 36 : y + r + 19;
    return (
      (name ? `<text class="lbl" x="${x}" y="${ly}" text-anchor="middle">${label(name, value)}</text>` : '') +
      (meas ? `<text class="meas" x="${x}" y="${my}" text-anchor="middle">${esc(meas)}</text>` : '')
    );
  }
  const left = side === 'left';
  const ax = left ? x - r - 12 : x + r + 12;
  const anchor = left ? 'end' : 'start';
  return (
    (name ? `<text class="lbl" x="${ax}" y="${y - 3}" text-anchor="${anchor}">${label(name, value)}</text>` : '') +
    (meas ? `<text class="meas" x="${ax}" y="${y + 15}" text-anchor="${anchor}">${esc(meas)}</text>` : '')
  );
}

export function resistor(c) {
  const { id, x, y, dir = 'h', heat = 0 } = c;
  const w = dir === 'h' ? 58 : 22;
  const h = dir === 'h' ? 22 : 58;
  const hx = x - w / 2, hy = y - h / 2;
  return `<g class="comp res${c.hl ? ' hl' : ''}${c.clickable ? ' clickable' : ''}" data-id="${id}"${tipAttr(c)}>
    <rect class="hit" x="${hx - 10}" y="${hy - 10}" width="${w + 20}" height="${h + 20}"/>
    <rect class="body" x="${hx}" y="${hy}" width="${w}" height="${h}" rx="4"/>
    <rect class="heat" x="${hx + 2.5}" y="${hy + 2.5}" width="${w - 5}" height="${h - 5}" rx="2.5" style="opacity:${Math.min(1, heat).toFixed(2)}"/>
    ${labels(c, dir === 'h' ? 11 : 11)}
  </g>`;
}

export function bulb(c) {
  const { id, x, y, bright = 0, fused } = c;
  const b = fused ? 0 : Math.max(0, Math.min(1, bright));
  const d = 11.5;
  const filament = fused
    ? `M${x - d} ${y - d} L${x - 3} ${y - 3} M${x + 3} ${y + 3} L${x + d} ${y + d} M${x + d} ${y - d} L${x + 3} ${y - 3} M${x - 3} ${y + 3} L${x - d} ${y + d}`
    : `M${x - d} ${y - d} L${x + d} ${y + d} M${x + d} ${y - d} L${x - d} ${y + d}`;
  return `<g class="comp bulb${fused ? ' fused' : ''}${c.hl ? ' hl' : ''}${c.clickable ? ' clickable' : ''}" data-id="${id}"${tipAttr(c)}>
    <circle class="glow" cx="${x}" cy="${y}" r="62" style="opacity:${b.toFixed(2)}"/>
    <circle class="hit" cx="${x}" cy="${y}" r="28"/>
    <circle class="body" cx="${x}" cy="${y}" r="17"/>
    <circle class="fill" cx="${x}" cy="${y}" r="15.5" style="opacity:${(b * 0.95).toFixed(2)}"/>
    <path class="x" d="${filament}"/>
    ${labels(c, 17)}
  </g>`;
}

/** Pila vertical amb el pol + a dalt. Borns a (x, y-8) i (x, y+8). */
export function battery(c) {
  const { x, y, value } = c;
  return `<g class="comp battery${c.hl ? ' hl' : ''}" data-id="${c.id || 'B'}"${tipAttr(c)}>
    <rect class="hit" x="${x - 34}" y="${y - 26}" width="68" height="52"/>
    <line class="plate-pos" x1="${x - 22}" y1="${y - 8}" x2="${x + 22}" y2="${y - 8}"/>
    <line class="plate-neg" x1="${x - 11}" y1="${y + 8}" x2="${x + 11}" y2="${y + 8}"/>
    <text class="pol" x="${x + 26}" y="${y - 13}">+</text>
    <text class="pol" x="${x + 26}" y="${y + 24}">−</text>
    <text class="lbl bat" x="${x - 32}" y="${y - 3}" text-anchor="end"><tspan class="nm">V</tspan></text>
    <text class="val bat" x="${x - 32}" y="${y + 14}" text-anchor="end">${esc(value)}</text>
  </g>`;
}

/** Interruptor horitzontal. Borns a (x-22, y) i (x+22, y). */
export function switchComp(c) {
  const { x, y, closed } = c;
  const x2 = closed ? x + 22 : x + 13;
  const y2 = closed ? y : y - 24;
  return `<g class="comp switch clickable${closed ? ' on' : ''}${c.hl ? ' hl' : ''}" data-id="${c.id || 'S'}"${tipAttr(c)}>
    <rect class="hit" x="${x - 34}" y="${y - 36}" width="68" height="56"/>
    <line class="lever" x1="${x - 22}" y1="${y}" x2="${x2}" y2="${y2}"/>
    <circle class="term" cx="${x - 22}" cy="${y}" r="4"/>
    <circle class="term" cx="${x + 22}" cy="${y}" r="4"/>
    <text class="meas" x="${x}" y="${y + 30}" text-anchor="middle">${closed ? 'tancat' : 'obert · clica!'}</text>
  </g>`;
}

const DRAW = { R: resistor, L: bulb, B: battery, S: switchComp };

export function wire(wr, Imax) {
  const pts = wr.pts.map(([x, y]) => `${x},${y}`).join(' ');
  const I = Math.abs(wr.I || 0);
  const speed = I > 1e-9 && Imax > 0 ? Math.min(320, Math.max(10, (135 * I) / Imax)) : 0;
  const key = wr.key || pts;
  return `<polyline class="wire${wr.cls ? ' ' + wr.cls : ''}" points="${pts}"/>${
    speed ? `<polyline class="flow" data-key="${key}" data-speed="${speed.toFixed(1)}" points="${pts}"/>` : ''
  }`;
}

function group(g) {
  return `<g class="group${g.cls ? ' ' + g.cls : ''}">
    <rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="14"/>
    <text class="glbl" x="${g.x + 12}" y="${g.y + 18}">${label(g.name, g.value)}</text>
  </g>`;
}

function tag(t) {
  return `<text class="tag ${t.cls || ''}" x="${t.x}" y="${t.y}" text-anchor="${t.anchor || 'start'}">${
    t.name ? label(t.name, t.value) : esc(t.text)
  }</text>`;
}

const DEFS = `
  <pattern id="gridDots" width="20" height="20" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="rgba(200,190,255,0.07)"/>
  </pattern>
  <radialGradient id="gBulb">
    <stop offset="0" stop-color="#ffd166" stop-opacity="0.85"/>
    <stop offset="0.35" stop-color="#fbbf24" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#f59e0b" stop-opacity="0"/>
  </radialGradient>`;

/**
 * Dibuixa un circuit complet.
 * @param {object} o { w, h, wires:[{pts,I}], comps:[{type,...}], nodes:[[x,y]], groups, tags, Imax }
 */
export function circuit(o) {
  const { w = 720, h = 440, wires = [], comps = [], nodes = [], groups = [], tags = [] } = o;
  const Imax = o.Imax ?? Math.max(0, ...wires.map((x) => Math.abs(x.I || 0)));
  return `<svg class="circuit" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Esquema del circuit">
    <defs>${DEFS}</defs>
    <rect class="bg" x="0" y="0" width="${w}" height="${h}" fill="url(#gridDots)"/>
    <g class="groups">${groups.map(group).join('')}</g>
    <g class="wires">${wires.map((x) => wire(x, Imax)).join('')}</g>
    <g class="nodes">${nodes.map(([x, y]) => `<circle class="node" cx="${x}" cy="${y}" r="4.5"/>`).join('')}</g>
    <g class="comps">${comps.map((c) => DRAW[c.type](c)).join('')}</g>
    <g class="tags">${tags.map(tag).join('')}</g>
  </svg>`;
}
