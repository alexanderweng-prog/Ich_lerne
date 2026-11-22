// Erweiterte Gleichungen (Sek 3): quadratische Gleichungen, Gleichungssysteme
import { Q } from '../math/rational';
import type { Skill } from './types';
import { lin, p } from './fmt';

export const gleichungenErweitert: Skill[] = [
  {
    id: 'L10', title: 'Quadratische Gleichungen (Faktorzerlegung)', area: 'Gleichungen', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.1.A.4.l', prereqs: ['T6', 'T8', 'L3'],
    intro: 'Ein Produkt ist genau dann 0, wenn einer der Faktoren 0 ist. Darum zerlegst du die Gleichung in Faktoren: x² − 4 = 0 → (x − 2)(x + 2) = 0 → x = 2 oder x = −2. Quadratische Gleichungen haben oft zwei Lösungen.',
    tip: 'Ausklammern oder 3. binomische Formel, dann jeden Faktor = 0 setzen.',
    selfExplain: {
      q: 'Warum folgt aus (x − 3)(x + 5) = 0, dass x = 3 oder x = −5 ist?',
      options: ['Ein Produkt ist nur 0, wenn mindestens ein Faktor 0 ist.', 'Weil man die Klammern weglassen darf.', 'Weil 3 + 5 = 8 ist.'],
      correct: 0,
      why: 'Ist x − 3 = 0, ist das Produkt 0. Dasselbe gilt für x + 5 = 0. Andere Zahlen ergeben ein Produkt ≠ 0.',
    },
    gen: (r) => {
      const v = r.int(0, 2);
      if (v === 0) {
        const c = r.int(1, 12);
        return {
          prompt: `Löse die Gleichung: $x² - ${c * c} = 0$`, answer: { kind: 'solutions', variable: 'x', values: [Q.of(c), Q.of(-c)] },
          inputHint: 'z. B. x = 3 oder x = −3',
          steps: [{ m: `(x - ${c})(x + ${c}) = 0`, why: '3. binomische Formel' }, { m: `x = ${c} oder x = -${c}`, why: 'Jeder Faktor kann 0 sein' }],
        };
      }
      if (v === 1) {
        const a = r.nz(-9, 9);
        return {
          prompt: `Löse die Gleichung: $${lin([[1, 'x²'], [-a, 'x']])} = 0$`, answer: { kind: 'solutions', variable: 'x', values: [Q.of(0), Q.of(a)] },
          inputHint: 'alle Lösungen',
          steps: [{ m: `x(${lin([[1, 'x'], [-a, '']])}) = 0`, why: 'x ausklammern' }, { m: `x = 0 oder x = ${a}` }],
          misconceptions: [{ value: Q.of(a), msg: 'Nicht durch x teilen – dabei geht die Lösung x = 0 verloren. Ausklammern!' }],
        };
      }
      let a = 0, b = 0;
      do { a = r.nz(-8, 8); b = r.nz(-8, 8); } while (a === b || a === -b);
      return {
        prompt: `Löse die Gleichung: $(${lin([[1, 'x'], [-a, '']])})(${lin([[1, 'x'], [-b, '']])}) = 0$`, answer: { kind: 'solutions', variable: 'x', values: [Q.of(a), Q.of(b)] },
        steps: [{ m: `${lin([[1, 'x'], [-a, '']])} = 0 oder ${lin([[1, 'x'], [-b, '']])} = 0`, why: 'Ein Faktor muss 0 sein' }, { m: `x = ${a} oder x = ${b}` }],
      };
    },
  },
  {
    id: 'L11', title: 'Lineare Gleichungssysteme', area: 'Gleichungen', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.1.A.4.m', prereqs: ['L5'],
    intro: 'Zwei Gleichungen mit zwei Unbekannten x und y. Additionsverfahren: Gleichungen so mit Zahlen multiplizieren und subtrahieren, dass eine Variable wegfällt. Einsetzungsverfahren: eine Gleichung nach einer Variablen auflösen und in die andere einsetzen.',
    tip: 'Eine Variable eliminieren, die andere berechnen, dann zurück einsetzen. Probe machen!',
    gen: (r) => {
      const x = r.int(-6, 6), y = r.int(-6, 6);
      let a1 = 0, b1 = 0, a2 = 0, b2 = 0;
      do { a1 = r.nz(-4, 4); b1 = r.nz(-4, 4); a2 = r.nz(-4, 4); b2 = r.nz(-4, 4); } while (a1 * b2 - a2 * b1 === 0);
      const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
      const eq = (a: number, b: number, c: number) => `${lin([[a, 'x'], [b, 'y']])} = ${c}`;
      return {
        prompt: `Löse das Gleichungssystem: $${eq(a1, b1, c1)}$ und $${eq(a2, b2, c2)}$`,
        answer: { kind: 'point', x: Q.of(x), y: Q.of(y) }, inputHint: 'als (x|y) oder x = …, y = …',
        steps: [
          { m: eq(a1 * b2, b1 * b2, c1 * b2), why: `1. Gleichung · ${p(b2)}` },
          { m: eq(a2 * b1, b1 * b2, c2 * b1), why: `2. Gleichung · ${p(b1)}` },
          { m: `${lin([[a1 * b2 - a2 * b1, 'x']])} = ${c1 * b2 - c2 * b1}`, why: 'subtrahieren: y fällt weg' },
          { m: `x = ${x}` }, { m: `y = ${y}`, why: 'einsetzen' },
        ],
      };
    },
  },
];
