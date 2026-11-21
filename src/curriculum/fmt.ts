// Hilfsfunktionen, um Mathe-Notation für Aufgaben zu erzeugen.
import { Q } from '../math/rational';

/** Zahl, negative in Klammern: für Produkte und Subtraktionen. */
export const p = (n: number | Q): string => {
  const s = typeof n === 'number' ? `${n}` : fq(n);
  return s.startsWith('-') ? `(${s})` : s;
};

/** Bruch als Text "3/4", ganze Zahl als "2". */
export const fq = (q: Q): string => q.toString();

/** Gemischte Zahl "2 1/3" (Text, nicht Mathe-Notation). */
export function mixed(q: Q): string {
  const neg = q.n < 0n;
  const a = neg ? q.neg() : q;
  const whole = a.n / a.d;
  const rest = a.n % a.d;
  const body = whole === 0n ? `${rest}/${a.d}` : rest === 0n ? `${whole}` : `${whole} ${rest}/${a.d}`;
  return (neg ? '-' : '') + body;
}

/**
 * Summe aus Koeffizient-Monom-Paaren als Term: lin([[3,'x'],[-2,'']]) = "3x - 2".
 * Koeffizient 1 wird weggelassen, 0 übersprungen.
 */
export function lin(terms: Array<[number | Q, string]>): string {
  let s = '';
  for (const [c0, mono] of terms) {
    const c = typeof c0 === 'number' ? Q.of(c0) : c0;
    if (c.isZero()) continue;
    const neg = c.n < 0n;
    const a = neg ? c.neg() : c;
    let coef = a.toString();
    if (mono && a.eq(Q.of(1))) coef = '';
    const body = coef + mono;
    if (!s) s = neg ? `-${body}` : body;
    else s += neg ? ` - ${body}` : ` + ${body}`;
  }
  return s || '0';
}

/** Vorzeichen-Schreibweise für einen Summanden: "+ 3" bzw. "- 3". */
export const sgn = (n: number): string => (n < 0 ? `- ${-n}` : `+ ${n}`);
