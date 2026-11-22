// Prüft Schülerantworten: zuerst ob der WERT stimmt, dann ob die verlangte FORM stimmt,
// danach ob ein bekanntes Fehlermuster (Fehlvorstellung) vorliegt.

import { Q } from './rational';
import {
  parse, evaluate, toPoly, polyEq, isExpanded, countSummands, isProductWithSum,
  commonFactor, variables, ParseError, NotPolynomial, type Node, type Poly,
} from './expr';

export type NumberForm = 'any' | 'reduced' | 'improper' | 'mixed' | 'decimal' | 'integer';
export type ExprForm = 'any' | 'expanded' | 'simplified' | 'factored' | 'monomial' | 'primefactors';

export type AnswerSpec =
  | { kind: 'number'; value: Q; form?: NumberForm; unit?: string }
  /** Gerundete Ergebnisse (z. B. mit π): richtig, wenn |Eingabe − Wert| ≤ tol */
  | { kind: 'approx'; value: number; tol: number; dec: number; unit?: string }
  /** Punkt im Koordinatensystem, Eingabe z. B. (3|−2) */
  | { kind: 'point'; x: Q; y: Q }
  /** Mehrere Lösungen, z. B. x = 2 oder x = −2 */
  | { kind: 'solutions'; variable: string; values: Q[] }
  | { kind: 'expr'; value: string; form?: ExprForm }
  | { kind: 'solution'; variable: string; value: Q }
  | { kind: 'formula'; variable: string; value: string }
  | { kind: 'choice'; options: string[]; correct: number };

/** Ein typischer Fehler: Wenn die Antwort diesem Wert entspricht, wird gezielt reagiert. */
export interface Misconception { value: Q | string; msg: string }

export interface CheckResult {
  correct: boolean;
  /** Antwort war nicht lesbar – zählt nicht als Fehler. */
  invalid?: boolean;
  /** Wert stimmt, nur die Form nicht – zählt nicht als Fehler, muss aber korrigiert werden. */
  formOnly?: boolean;
  msg?: string;
  misconception?: boolean;
}

const MIXED = /^\s*(-|−)?\s*(\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/;
const FRACTION = /^\s*(-|−)?\s*\(?\s*(-|−)?\s*(\d+)\s*\/\s*(\d+)\s*\)?\s*$/;
const INTEGER = /^\s*(-|−)?\s*\d+\s*$/;
const DECIMAL = /^\s*(-|−)?\s*\d*[.,]\d+\s*$/;

/** Zahl aus Schülereingabe lesen (Bruch, gemischte Zahl, Dezimalzahl, Rechenausdruck). */
export function readNumber(input: string): Q {
  const m = MIXED.exec(input);
  if (m) {
    const whole = Q.of(Number(m[2]));
    const frac = Q.of(Number(m[3]), Number(m[4]));
    const v = whole.add(frac);
    return m[1] ? v.neg() : v;
  }
  const node = parse(input);
  if (variables(node).size > 0) throw new ParseError('Hier wird eine Zahl erwartet, keine Variable.');
  return evaluate(node, {});
}

function numberFormIssue(input: string, value: Q, form: NumberForm): string | null {
  const s = input.trim();
  switch (form) {
    case 'any': return null;
    case 'integer':
      return INTEGER.test(s) ? null : 'Schreibe das Ergebnis als ganze Zahl.';
    case 'decimal':
      return DECIMAL.test(s) || INTEGER.test(s) ? null : 'Schreibe das Ergebnis als Dezimalzahl.';
    case 'mixed': {
      if (value.isInt()) return INTEGER.test(s) ? null : 'Das Ergebnis ist eine ganze Zahl.';
      const abs = value.n < 0n ? value.neg() : value;
      if (abs.n < abs.d) return FRACTION.test(s) ? reducedIssue(s) : 'Schreibe das Ergebnis als Bruch.';
      const m = MIXED.exec(s);
      if (!m) return 'Schreibe das Ergebnis als gemischte Zahl, z. B. 2 1/3 (Leerschlag zwischen Ganzen und Bruch).';
      if (Number(m[3]) >= Number(m[4])) return 'Der Bruchteil einer gemischten Zahl muss kleiner als 1 sein.';
      return reducedIssue(`${m[3]}/${m[4]}`);
    }
    case 'improper':
    case 'reduced': {
      if (value.isInt()) {
        if (INTEGER.test(s)) return null;
        if (FRACTION.test(s)) return 'Der Bruch lässt sich noch weiter vereinfachen – das Ergebnis ist eine ganze Zahl.';
        return 'Schreibe das Ergebnis als ganze Zahl.';
      }
      if (MIXED.test(s)) return form === 'improper' ? 'Schreibe das Ergebnis als (unechten) Bruch, nicht als gemischte Zahl.' : reducedIssue(s.replace(MIXED, '$3/$4'));
      if (!FRACTION.test(s)) return 'Schreibe das Ergebnis als Bruch, z. B. 3/4.';
      return reducedIssue(s);
    }
  }
}

function reducedIssue(s: string): string | null {
  const m = FRACTION.exec(s) ?? /(\d+)\s*\/\s*(\d+)/.exec(s);
  if (!m) return null;
  const a = Number(m[m.length - 2]);
  const b = Number(m[m.length - 1]);
  let x = a, y = b;
  while (y) [x, y] = [y, x % y];
  return x > 1 ? `Der Bruch ist noch nicht vollständig gekürzt (Zähler und Nenner sind beide durch ${x} teilbar).` : null;
}

function exprFormIssue(node: Node, target: Poly, form: ExprForm): string | null {
  switch (form) {
    case 'any': return null;
    case 'expanded':
      if (!isExpanded(node)) return 'Der Wert stimmt, aber es hat noch Klammern. Multipliziere sie aus.';
      if (countSummands(node) > Math.max(1, target.size)) return 'Der Wert stimmt, aber du kannst noch zusammenfassen.';
      return null;
    case 'simplified':
      if (countSummands(node) > Math.max(1, target.size)) return 'Der Wert stimmt, aber du kannst noch weiter zusammenfassen.';
      return null;
    case 'monomial': {
      const msg = 'Der Wert stimmt, aber vereinfache noch: Zahlen ausrechnen und gleiche Variablen als Potenz schreiben (x · x = x²).';
      if (countSummands(node) > 1 || !isExpanded(node)) return msg;
      let nums = 0;
      const names: string[] = [];
      const walk = (m: Node): boolean => {
        if (m.t === 'neg' || m.t === 'par') return walk(m.e);
        if (m.t === 'num') { nums++; return true; }
        if (m.t === 'var') { names.push(m.name); return true; }
        if (m.op === '*') return walk(m.l) && walk(m.r);
        if (m.op === '^' && m.l.t === 'var' && m.r.t === 'num') { names.push(m.l.name); return true; }
        return false;
      };
      if (!walk(node) || nums > 1 || new Set(names).size !== names.length) return msg;
      return null;
    }
    case 'primefactors':
      return primeProduct(node) ? null : 'Der Wert stimmt, aber es müssen alles Primzahlen sein (z. B. 2³ · 3 · 5).';
    case 'factored': {
      if (!isProductWithSum(node)) return 'Der Wert stimmt, aber der Term soll als Produkt geschrieben werden (ausklammern).';
      // Der Inhalt der Klammer darf keinen gemeinsamen Faktor mehr haben.
      const inner = findSumFactor(node);
      if (inner) {
        const cf = commonFactor(toPoly(inner));
        if (cf.num > 1 || cf.vars.length > 0) return 'Gut, aber in der Klammer steckt noch ein gemeinsamer Faktor. Klammere alles aus, was geht.';
      }
      return null;
    }
  }
}

function findSumFactor(n: Node): Node | null {
  if (n.t === 'par') {
    const e = n.e;
    if (e.t === 'bin' && (e.op === '+' || e.op === '-')) return e;
    return findSumFactor(e);
  }
  if (n.t === 'neg') return findSumFactor(n.e);
  if (n.t === 'bin' && n.op === '*') return findSumFactor(n.l) ?? findSumFactor(n.r);
  return null;
}

/** Zufällige Testwerte für numerischen Vergleich von Formeln (mit Bruchtermen). */
function sameFunction(a: Node, b: Node, vars: string[]): boolean {
  const vals = [Q.of(2), Q.of(3), Q.of(5), Q.of(7, 2), Q.of(11), Q.of(-3), Q.of(13, 3), Q.of(17)];
  let tested = 0;
  for (let i = 0; i < 6; i++) {
    const env: Record<string, Q> = {};
    vars.forEach((v, j) => { env[v] = vals[(i + j * 3) % vals.length].add(Q.of(i)); });
    try {
      if (!evaluate(a, env).eq(evaluate(b, env))) return false;
      tested++;
    } catch { /* Division durch 0 bei diesem Testwert: überspringen */ }
  }
  return tested >= 3;
}

function stripLhs(input: string, variable: string): string | null {
  const parts = input.split('=');
  if (parts.length === 1) return input;
  if (parts.length > 2) return null;
  const [l, r] = parts.map((p) => p.trim());
  if (l === variable) return r;
  if (r === variable) return l;
  return null;
}

/** Einheit oder Prozentzeichen am Ende (und «Fr.» am Anfang) entfernen: «12.5 cm» → «12.5». */
export function stripUnit(s: string): string {
  return s.trim()
    .replace(/^(fr\.?|chf)\s*/i, '')
    .replace(/(\s*(%|‰|°|[a-zA-ZäöüÄÖÜ][a-zA-ZäöüÄÖÜ.²³/]*))+\s*$/, '')
    .trim();
}

function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (let i = 2n; i * i <= n; i++) if (n % i === 0n) return false;
  return true;
}

/** Ist der Ausdruck ein Produkt aus Primzahlen bzw. Primzahlpotenzen? */
function primeProduct(n: Node): boolean {
  if (n.t === 'par') return primeProduct(n.e);
  if (n.t === 'num') return n.v.isInt() && isPrime(n.v.n);
  if (n.t === 'bin' && n.op === '*') return primeProduct(n.l) && primeProduct(n.r);
  if (n.t === 'bin' && n.op === '^') return n.l.t === 'num' && n.l.v.isInt() && isPrime(n.l.v.n) && n.r.t === 'num';
  return false;
}

function readPoint(raw: string): [Q, Q] | null {
  const s = raw.replace(/[−–]/g, '-').trim();
  const xy = /x\s*=\s*([^,;|y]+)[,;|\s]+y\s*=\s*(.+)$/i.exec(s);
  if (xy) return [readNumber(xy[1]), readNumber(xy[2])];
  const inner = s.replace(/^[A-Za-z]?\s*\(/, '').replace(/\)\s*$/, '');
  let parts = inner.split(/[|;]/);
  if (parts.length !== 2) parts = inner.split(/,\s+/);
  if (parts.length !== 2) return null;
  return [readNumber(parts[0]), readNumber(parts[1])];
}

export function check(spec: AnswerSpec, input: string, mis: Misconception[] = []): CheckResult {
  const raw = input.trim();
  if (spec.kind === 'choice') {
    const idx = Number(raw);
    return idx === spec.correct ? { correct: true } : { correct: false };
  }
  if (!raw) return { correct: false, invalid: true, msg: 'Bitte gib eine Antwort ein.' };

  try {
    switch (spec.kind) {
      case 'number': {
        const v = readNumber(stripUnit(raw) || raw);
        if (v.eq(spec.value)) {
          const issue = numberFormIssue(stripUnit(raw) || raw, v, spec.form ?? 'any');
          return issue ? { correct: false, formOnly: true, msg: issue } : { correct: true };
        }
        return wrong(mis, (m) => typeof m === 'string' ? false : v.eq(m));
      }
      case 'approx': {
        const v = readNumber(stripUnit(raw) || raw).toNumber();
        if (Math.abs(v - spec.value) <= spec.tol + 1e-9) return { correct: true };
        return wrong(mis, (m) => typeof m !== 'string' && Math.abs(v - m.toNumber()) <= spec.tol + 1e-9);
      }
      case 'point': {
        const pt = readPoint(raw);
        if (!pt) return { correct: false, invalid: true, msg: 'Schreibe den Punkt als (x|y), z. B. (3|−2).' };
        if (pt[0].eq(spec.x) && pt[1].eq(spec.y)) return { correct: true };
        if (pt[0].eq(spec.y) && pt[1].eq(spec.x) && !spec.x.eq(spec.y)) return { correct: false, misconception: true, msg: 'Du hast x und y vertauscht. Zuerst kommt die x-Koordinate (nach rechts), dann die y-Koordinate (nach oben).' };
        return { correct: false };
      }
      case 'solutions': {
        const cleaned = raw.replace(/[LＬ]\s*=/g, '').replace(new RegExp(`${spec.variable}\\s*[₁₂12]?\\s*=`, 'g'), '').replace(/[{}]/g, '');
        const parts = cleaned.split(/\s+oder\s+|\s+und\s+|;|\||,\s+/).map((x) => x.trim()).filter(Boolean);
        if (!parts.length) return { correct: false, invalid: true, msg: 'Gib alle Lösungen an, z. B. x = 2 oder x = −3.' };
        const vals = parts.map((x) => readNumber(x));
        const uniq = vals.filter((v, i) => vals.findIndex((w) => w.eq(v)) === i);
        const allRight = uniq.every((v) => spec.values.some((w) => w.eq(v)));
        if (allRight && uniq.length === spec.values.length) return { correct: true };
        if (allRight) return { correct: false, misconception: true, msg: `Richtig, aber nicht vollständig: Es gibt ${spec.values.length} Lösungen.` };
        return { correct: false };
      }
      case 'solution': {
        const rhs = stripLhs(raw, spec.variable);
        if (rhs === null) return { correct: false, invalid: true, msg: `Schreibe die Lösung als ${spec.variable} = … oder nur die Zahl.` };
        const v = readNumber(rhs);
        if (v.eq(spec.value)) return { correct: true };
        return wrong(mis, (m) => typeof m === 'string' ? false : v.eq(m));
      }
      case 'expr': {
        const node = parse(raw);
        const target = toPoly(parse(spec.value));
        let p: Poly;
        try { p = toPoly(node); } catch (e) {
          if (e instanceof NotPolynomial) return { correct: false, invalid: true, msg: 'Dieser Term kann so nicht geprüft werden (Division durch eine Variable?).' };
          throw e;
        }
        if (polyEq(p, target)) {
          const issue = exprFormIssue(node, target, spec.form ?? 'any');
          return issue ? { correct: false, formOnly: true, msg: issue } : { correct: true };
        }
        return wrong(mis, (m) => {
          try { return polyEq(p, toPoly(parse(typeof m === 'string' ? m : m.toString()))); } catch { return false; }
        });
      }
      case 'formula': {
        const rhs = stripLhs(raw, spec.variable);
        if (rhs === null || raw.indexOf('=') === -1) return { correct: false, invalid: true, msg: `Schreibe die Formel als ${spec.variable} = …` };
        const a = parse(rhs);
        const b = parse(spec.value);
        if (variables(a).has(spec.variable)) return { correct: false, msg: `Auf der rechten Seite darf ${spec.variable} nicht mehr vorkommen.` };
        const vars = [...new Set([...variables(a), ...variables(b)])];
        if (sameFunction(a, b, vars)) return { correct: true };
        return wrong(mis, (m) => {
          try { return sameFunction(a, parse(String(m)), vars); } catch { return false; }
        });
      }
    }
  } catch (e) {
    if (e instanceof ParseError) return { correct: false, invalid: true, msg: e.message };
    if (e instanceof Error && e.message === 'Division durch 0') return { correct: false, invalid: true, msg: 'In deiner Eingabe wird durch 0 geteilt.' };
    return { correct: false, invalid: true, msg: 'Die Eingabe konnte nicht gelesen werden.' };
  }
}

function wrong(mis: Misconception[], matches: (m: Q | string) => boolean): CheckResult {
  for (const m of mis) if (matches(m.value)) return { correct: false, misconception: true, msg: m.msg };
  return { correct: false };
}
