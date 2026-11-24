// Format i lectura de números en notació catalana (coma decimal)

export function round(x, d = 2) {
  const k = 10 ** d;
  return Math.round(x * k) / k;
}

function decimalsFor(x) {
  const a = Math.abs(x);
  if (a === 0) return 0;
  if (a < 0.1) return 3;
  return 2;
}

/** Número amb coma decimal, fins a 2 decimals (3 per a valors molt menuts). */
export function fmt(x, d) {
  if (x == null || !Number.isFinite(x)) return '—';
  if (d == null) d = decimalsFor(x);
  return round(x, d).toLocaleString('ca-ES', { maximumFractionDigits: d, useGrouping: false });
}

/** Número preparat per a KaTeX (la coma dins de {,} per evitar l'espai). */
export function n(x, d) {
  return fmt(x, d).replace(',', '{,}');
}

/** Accepta "1,5", "1.5", " 2 " ... Retorna NaN si no és un número. */
export function parseNum(s) {
  if (s == null) return NaN;
  let t = String(s).trim().replace(/\s+/g, '');
  if (!t) return NaN;
  t = t.replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return NaN;
  return Number(t);
}

/** Tolerància: 1,5 % relatiu o mitja centèsima (arrodoniment a 2 decimals). */
export function isClose(user, exact) {
  if (!Number.isFinite(user)) return false;
  const tol = Math.max(Math.abs(exact) * 0.015, 0.0051);
  return Math.abs(user - exact) <= tol + 1e-12;
}

export const par = (a, b) => (a * b) / (a + b);
export const parN = (...rs) => 1 / rs.reduce((s, r) => s + 1 / r, 0);
