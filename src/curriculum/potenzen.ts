// Potenzen, Wurzeln, wissenschaftliche Schreibweise, Primfaktoren (Sek I)
import { Q } from '../math/rational';
import type { Skill } from './types';
import { dec, big } from './fmt';

const int = (v: number) => ({ kind: 'number' as const, value: Q.of(v), form: 'integer' as const });

function primeFactors(n: number): number[] {
  const f: number[] = [];
  for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; }
  if (n > 1) f.push(n);
  return f;
}
function factorString(f: number[]): string {
  const counts = new Map<number, number>();
  f.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1));
  return [...counts].map(([p, k]) => (k > 1 ? `${p}^${k}` : `${p}`)).join(' · ');
}

export const potenzen: Skill[] = [
  {
    id: 'P1', title: 'Quadratzahlen und Quadratwurzeln', area: 'Potenzen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.1.i', prereqs: ['G2'],
    intro: 'Eine Quadratzahl entsteht, wenn man eine Zahl mit sich selbst multipliziert: 7² = 7 · 7 = 49. Die Quadratwurzel macht das rückgängig: √49 = 7, weil 7² = 49.',
    tip: 'Wurzel: Welche Zahl mal sich selbst ergibt die Zahl unter der Wurzel?',
    gen: (r) => {
      const n = r.int(2, 20);
      if (r.bool()) return { prompt: `Berechne $${n}²$.`, answer: int(n * n), steps: [{ m: `${n} · ${n}` }, { m: `${n * n}` }], misconceptions: n === 2 ? [] : [{ value: Q.of(2 * n), msg: `${n}² heisst ${n} · ${n}, nicht ${n} · 2.` }] };
      return { prompt: `Berechne $√${n * n}$.`, answer: int(n), steps: [{ m: `${n} · ${n} = ${n * n}`, why: 'Welche Zahl mal sich selbst?' }, { m: `${n}` }], misconceptions: n * n % 2 === 0 && n * n / 2 !== n ? [{ value: Q.of(n * n / 2), msg: 'Die Wurzel ist nicht die Hälfte. Gesucht ist die Zahl, die mit sich selbst multipliziert ' + n * n + ' ergibt.' }] : [] };
    },
  },
  {
    id: 'P2', title: 'Potenzen berechnen', area: 'Potenzen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.4.i', prereqs: ['P1', 'G9'],
    intro: 'Eine Potenz ist eine Kurzschreibweise für ein Produkt mit gleichen Faktoren: 2⁵ = 2 · 2 · 2 · 2 · 2 = 32. Die untere Zahl heisst Basis, die obere Exponent.',
    tip: 'Exponent = Anzahl gleicher Faktoren. Negative Basis: Vorzeichen zählen.',
    selfExplain: {
      q: 'Warum ist (−2)⁴ positiv, aber −2⁴ negativ?',
      options: ['Bei (−2)⁴ wird die Klammer viermal multipliziert, bei −2⁴ nur die 2 – das Minus bleibt davor.', 'Weil gerade Exponenten immer positiv sind.', 'Das ist dasselbe.'],
      correct: 0,
      why: '(−2)⁴ = (−2)(−2)(−2)(−2) = 16. −2⁴ = −(2 · 2 · 2 · 2) = −16.',
    },
    gen: (r) => {
      const b = r.pick([2, 3, 4, 5, 10, -2, -3]);
      const e = b === 10 ? r.int(2, 6) : Math.abs(b) <= 3 ? r.int(2, 5) : r.int(2, 3);
      const val = b ** e;
      const base = b < 0 ? `(${b})` : `${b}`;
      return {
        prompt: `Berechne $${base}^${e}$.`, answer: int(val),
        steps: [{ m: Array(e).fill(base).join(' · '), why: `${e} gleiche Faktoren` }, { m: `${val}` }],
        misconceptions: [
          ...(b * e !== val ? [{ value: Q.of(b * e), msg: `Der Exponent sagt, wie oft die Basis mit sich selbst multipliziert wird – nicht «${b} mal ${e}».` }] : []),
          ...(b < 0 && val !== -val ? [{ value: Q.of(-val), msg: 'Achte auf das Vorzeichen: Bei gerader Anzahl negativer Faktoren ist das Ergebnis positiv.' }] : []),
        ],
      };
    },
  },
  {
    id: 'P3', title: 'Wissenschaftliche Schreibweise (grosse Zahlen)', area: 'Potenzen', stage: 'Sek 2', niveau: 'alle', lp21: 'MA.1.A.1.j', prereqs: ['P2', 'D5'],
    intro: 'Sehr grosse Zahlen schreibt man als Zahl zwischen 1 und 10 mal eine Zehnerpotenz: 132\'000\'000 = 1.32 · 10⁸. Der Exponent sagt, um wie viele Stellen der Punkt verschoben wurde.',
    tip: 'Zähle, um wie viele Stellen du den Punkt nach links schiebst, bis nur noch eine Ziffer vor dem Punkt steht.',
    gen: (r) => {
      const m = Q.of(r.int(101, 999), 100);
      const e = r.int(3, 9);
      const n = m.mul(Q.of(10 ** e));
      if (r.bool()) return {
        prompt: `Schreibe $${dec(m)} · 10^${e}$ als gewöhnliche Zahl.`, answer: int(Number(n.n)),
        steps: [{ m: big(Number(n.n)), why: `Punkt um ${e} Stellen nach rechts` }],
      };
      return {
        prompt: `Bestimme den Exponenten $n$: $${big(Number(n.n))} = ${dec(m)} · 10^n$`, answer: int(e),
        steps: [{ m: `${dec(m)} · 10^${e}`, why: `Punkt um ${e} Stellen nach links geschoben` }],
        misconceptions: [{ value: Q.of(String(Number(n.n)).length), msg: 'Nicht die Anzahl Ziffern zählen, sondern die Stellen, um die der Punkt wandert.' }].filter((x) => !x.value.eq(Q.of(e))),
      };
    },
  },
  {
    id: 'P4', title: 'Wissenschaftliche Schreibweise (kleine Zahlen)', area: 'Potenzen', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.1.A.1.k', prereqs: ['P3'],
    intro: 'Sehr kleine Zahlen haben einen negativen Exponenten: 0.00042 = 4.2 · 10⁻⁴. Der Punkt wurde 4 Stellen nach rechts verschoben.',
    tip: 'Negative Exponenten: Punkt nach rechts verschieben, bis eine Ziffer ≠ 0 vor dem Punkt steht.',
    gen: (r) => {
      const m = Q.of(r.int(11, 99), 10);
      const e = r.int(2, 7);
      const n = m.div(Q.of(10 ** e));
      return {
        prompt: `Bestimme den Exponenten $n$: $${dec(n)} = ${dec(m)} · 10^n$`, answer: int(-e),
        steps: [{ m: `${dec(m)} · 10^(-${e})`, why: `Punkt um ${e} Stellen nach rechts → Exponent −${e}` }],
        misconceptions: [{ value: Q.of(e), msg: 'Bei Zahlen kleiner als 1 ist der Exponent negativ.' }],
      };
    },
  },
  {
    id: 'P5', title: 'Primfaktorzerlegung', area: 'Potenzen', stage: 'Sek 1', niveau: 'erweitert', lp21: 'MA.1.A.3.h', prereqs: ['G5', 'P2'],
    intro: 'Jede natürliche Zahl grösser als 1 lässt sich eindeutig als Produkt von Primzahlen schreiben: 60 = 2 · 2 · 3 · 5 = 2² · 3 · 5. Primzahlen haben genau zwei Teiler: 1 und sich selbst.',
    tip: 'Teile immer wieder durch die kleinste mögliche Primzahl: 2, 3, 5, 7 …',
    gen: (r) => {
      let n = 0;
      do { n = r.pick([2, 2, 3, 3, 5, 7]) * r.pick([2, 3, 5]) * r.pick([2, 3, 4, 5, 6, 7, 9, 11]); } while (n < 12 || n > 300 || primeFactors(n).length < 3);
      const f = primeFactors(n);
      const steps = [];
      let m = n;
      for (const p of f.slice(0, -1)) { steps.push({ m: `${m} : ${p} = ${m / p}`, why: `durch ${p}` }); m /= p; }
      steps.push({ m: `${n} = ${factorString(f)}` });
      return {
        prompt: `Zerlege $${n}$ in Primfaktoren.`, answer: { kind: 'expr', value: factorString(f), form: 'primefactors' },
        inputHint: 'z. B. 2^2 · 3 · 5',
        steps,
      };
    },
  },
  {
    id: 'P6', title: 'Potenzgesetze', area: 'Potenzen', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.1.A.4.m', prereqs: ['P2', 'T3'],
    intro: 'Gleiche Basis: Beim Multiplizieren werden die Exponenten addiert (a³ · a⁴ = a⁷), beim Dividieren subtrahiert (a⁷ : a³ = a⁴). Potenz einer Potenz: Exponenten multiplizieren ((a²)³ = a⁶).',
    tip: 'Schreibe die Potenzen als Produkte aus und zähle die Faktoren.',
    selfExplain: {
      q: 'Warum ist a³ · a⁴ = a⁷ und nicht a¹²?',
      options: ['a³ · a⁴ = (a·a·a)·(a·a·a·a) – das sind 3 + 4 = 7 Faktoren.', 'Weil man die Exponenten immer addiert.', 'Doch, es ist a¹².'],
      correct: 0,
      why: 'Ausschreiben zeigt es: Es werden Faktoren aneinandergehängt, also gezählt (addiert).',
    },
    gen: (r) => {
      const b = r.pick(['a', 'b', '2', '5']);
      const m = r.int(2, 6), n = r.int(2, 5);
      const v = r.int(0, 2);
      const B = /\d/.test(b) ? b : b;
      if (v === 0) return { prompt: `Schreibe als eine Potenz: $${B}^${m} · ${B}^${n} = ${B}^k$ Bestimme $k$.`, answer: int(m + n), steps: [{ m: `${B}^(${m} + ${n})`, why: 'Gleiche Basis: Exponenten addieren' }, { m: `${B}^${m + n}` }], misconceptions: [{ value: Q.of(m * n), msg: 'Beim Multiplizieren gleicher Basen werden die Exponenten addiert, nicht multipliziert.' }].filter((x) => m * n !== m + n) };
      if (v === 1) { const big2 = m + n; return { prompt: `Schreibe als eine Potenz: $${B}^${big2} : ${B}^${n} = ${B}^k$ Bestimme $k$.`, answer: int(m), steps: [{ m: `${B}^(${big2} - ${n})`, why: 'Gleiche Basis: Exponenten subtrahieren' }, { m: `${B}^${m}` }], misconceptions: big2 % n === 0 && big2 / n !== m ? [{ value: Q.of(big2 / n), msg: 'Beim Dividieren werden die Exponenten subtrahiert, nicht dividiert.' }] : [] }; }
      return { prompt: `Schreibe als eine Potenz: $(${B}^${m})^${n} = ${B}^k$ Bestimme $k$.`, answer: int(m * n), steps: [{ m: `${B}^(${m} · ${n})`, why: 'Potenz einer Potenz: Exponenten multiplizieren' }, { m: `${B}^${m * n}` }], misconceptions: [{ value: Q.of(m + n), msg: `(${B}^${m})^${n} heisst ${n}-mal ${B}^${m} – also ${n} · ${m} Faktoren.` }].filter(() => m * n !== m + n) };
    },
  },
];

