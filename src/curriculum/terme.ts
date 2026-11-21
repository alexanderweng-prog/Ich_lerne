import { Q, gcd } from '../math/rational';
import type { Skill } from './types';
import { lin, p } from './fmt';

export const terme: Skill[] = [
  {
    id: 'T1', title: 'Zahlen in Terme einsetzen', area: 'Terme', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A', prereqs: ['G9', 'G10'],
    intro: 'Eine Variable ist ein Platzhalter für eine Zahl. Beim Einsetzen ersetzt du die Variable durch die Zahl – negative Zahlen immer in Klammern. 3x heisst 3 · x.',
    tip: 'Setze die Zahl mit Klammern ein: x = −4 → 3 · (−4).',
    selfExplain: {
      q: 'Warum ist x² für x = −3 gleich 9 und nicht −9?',
      options: ['Weil (−3) · (−3) = 9: minus mal minus gibt plus.', 'Weil man das Minus beim Quadrieren weglässt.', 'Weil Quadratzahlen nie negativ sein dürfen.'],
      correct: 0,
      why: 'x² = x · x. Für x = −3 ist das (−3) · (−3) = 9. Darum die Klammern beim Einsetzen.',
    },
    gen: (r) => {
      const v = r.int(0, 2);
      if (v === 0) {
        const a = r.nz(-9, 9), b = r.nz(-12, 12), x = r.nz(-8, -1);
        const res = a * x + b;
        return {
          prompt: `Berechne den Wert von $${lin([[a, 'x'], [b, '']])}$ für $x = ${x}$.`,
          answer: { kind: 'number', value: Q.of(res), form: 'integer' },
          steps: [{ m: `${a} · ${p(x)} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`, why: 'Einsetzen, mit Klammer' }, { m: `${a * x} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`, why: 'Punkt vor Strich' }, { m: `${res}` }],
          misconceptions: a * -x + b !== res ? [{ value: Q.of(a * -x + b), msg: 'Achte auf das Vorzeichen der eingesetzten Zahl – setze sie mit Klammern ein.' }] : [],
        };
      }
      if (v === 1) {
        const a = r.nz(-6, 6), x = r.int(-6, -2);
        const res = x * x + a * x;
        return {
          prompt: `Berechne den Wert von $${lin([[1, 'x²'], [a, 'x']])}$ für $x = ${x}$.`,
          answer: { kind: 'number', value: Q.of(res), form: 'integer' },
          steps: [{ m: `${p(x)}² ${a < 0 ? '-' : '+'} ${Math.abs(a)} · ${p(x)}`, why: 'Einsetzen, mit Klammer' }, { m: `${x * x} ${a * x < 0 ? '-' : '+'} ${Math.abs(a * x)}`, why: `${p(x)}² = ${x * x}` }, { m: `${res}` }],
          misconceptions: [{ value: Q.of(-x * x + a * x), msg: `${p(x)}² = ${p(x)} · ${p(x)} = ${x * x}. Das Quadrat einer negativen Zahl ist positiv.` }],
        };
      }
      const a = r.nz(-6, 6), b = r.nz(-6, 6), x = r.nz(-5, 5), y = r.nz(-5, 5);
      const res = a * x + b * y;
      return {
        prompt: `Berechne den Wert von $${lin([[a, 'a'], [b, 'b']])}$ für $a = ${x}$ und $b = ${y}$.`,
        answer: { kind: 'number', value: Q.of(res), form: 'integer' },
        steps: [{ m: `${a} · ${p(x)} ${b < 0 ? '-' : '+'} ${Math.abs(b)} · ${p(y)}`, why: 'Einsetzen' }, { m: `${a * x} + ${p(b * y)}` }, { m: `${res}` }],
      };
    },
  },
  {
    id: 'T2', title: 'Gleichartige Terme zusammenfassen', area: 'Terme', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A', prereqs: ['T1'],
    intro: 'Nur gleichartige Terme lassen sich zusammenfassen: 3a + 5a = 8a (wie 3 Äpfel + 5 Äpfel). 3a + 5b bleibt so – Äpfel und Birnen. Auch x und x² sind verschieden.',
    tip: 'Ordne zuerst: alle a zusammen, alle b zusammen. Achte auf das Vorzeichen VOR jedem Term.',
    selfExplain: {
      q: 'Warum ist 2a + 3b nicht 5ab?',
      options: ['a und b stehen für verschiedene Zahlen; nur gleiche Variablen kann man zusammenzählen.', 'Weil man die Zahlen multiplizieren müsste.', 'Doch, 2a + 3b = 5ab.'],
      correct: 0,
      why: 'Probiere a = 1, b = 10: 2 + 30 = 32, aber 5 · 1 · 10 = 50.',
    },
    gen: (r) => {
      const [u, w] = r.pick([['a', 'b'], ['x', 'y'], ['x²', 'x'], ['x', '']] as const);
      let c1 = 0, c2 = 0, c3 = 0, c4 = 0;
      do { c1 = r.nz(-9, 9); c2 = r.nz(-9, 9); c3 = r.nz(-9, 9); c4 = r.nz(-9, 9); } while (c1 + c3 === 0 || c2 + c4 === 0);
      const parts: Array<[number, string]> = r.shuffle([[c1, u], [c2, w], [c3, u], [c4, w]]);
      while (parts[0][1] === '' && parts.length) parts.push(parts.shift()!);
      const A = c1 + c3, B = c2 + c4;
      const value = lin([[A, u], [B, w]]);
      const mis = w && u !== 'x²' ? [{ value: `${A + B}${u}${w}`, msg: `${u} und ${w} sind verschiedene Variablen – diese Terme kann man nicht zusammenfassen.` }] : [];
      return {
        prompt: `Fasse zusammen: $${lin(parts)}$`,
        answer: { kind: 'expr', value, form: 'simplified' },
        steps: [{ m: lin([[c1, u], [c3, u], [c2, w], [c4, w]]), why: 'Gleichartige Terme ordnen (Vorzeichen mitnehmen)' }, { m: value, why: 'Koeffizienten addieren' }],
        misconceptions: mis,
      };
    },
  },
  {
    id: 'T3', title: 'Produkte vereinfachen', area: 'Terme', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A', prereqs: ['T2'],
    intro: 'Bei einem Produkt multiplizierst du die Zahlen miteinander und schreibst die Variablen dahinter. Gleiche Variablen werden zur Potenz: x · x = x².',
    tip: 'Zahlen zu Zahlen, Variablen zu Variablen: 3x · 4y = 3 · 4 · x · y.',
    gen: (r) => {
      const a = r.nz(-9, 9), b = r.nz(-9, 9);
      const same = r.bool(0.4);
      const v2 = same ? 'x' : 'y';
      const mono = same ? 'x²' : 'xy';
      const value = lin([[a * b, mono]]);
      const term = (c: number, v: string) => (c < 0 ? `(${lin([[c, v]])})` : lin([[c, v]]));
      const mis: { value: string; msg: string }[] = [];
      if (same) mis.push({ value: lin([[a * b, 'x']]), msg: 'x · x = x², nicht x.' });
      if (a + b !== a * b && a + b !== 0) mis.push({ value: lin([[a + b, mono]]), msg: 'Bei einem Produkt werden die Zahlen multipliziert, nicht addiert.' });
      if (same && a + b !== 0) mis.push({ value: lin([[a + b, 'x']]), msg: 'Das ist ein Produkt (mal), keine Summe.' });
      return {
        prompt: `Vereinfache: $${term(a, 'x')} · ${term(b, v2)}$`,
        answer: { kind: 'expr', value, form: 'monomial' },
        steps: [{ m: `${p(a)} · ${p(b)} · x · ${v2}`, why: 'Zahlen und Variablen ordnen' }, { m: value }],
        misconceptions: mis,
      };
    },
  },
  {
    id: 'T4', title: 'Minus vor der Klammer', area: 'Terme', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A', prereqs: ['T2', 'G8'],
    intro: 'Steht ein Plus vor der Klammer, kannst du sie einfach weglassen. Steht ein Minus davor, ändern sich beim Weglassen ALLE Vorzeichen in der Klammer.',
    tip: '−(a − b) = −a + b. Jeder Term in der Klammer wechselt das Vorzeichen.',
    selfExplain: {
      q: 'Warum ist 10 − (4 − 1) = 10 − 4 + 1?',
      options: ['Man soll 3 wegnehmen. 4 wegnehmen ist 1 zu viel – also 1 wieder dazu.', 'Weil man Klammern einfach weglassen darf.', 'Weil minus und minus immer minus ergibt.'],
      correct: 0,
      why: '10 − 3 = 7 und 10 − 4 + 1 = 7. Weglassen ohne Vorzeichenwechsel gäbe 10 − 4 − 1 = 5.',
    },
    gen: (r) => {
      const a = r.nz(-9, 9), b = r.nz(-12, 12), c = r.nz(-9, 9), d = r.nz(-12, 12);
      const value = lin([[a - c, 'x'], [b - d, '']]);
      const mis: { value: string; msg: string }[] = [];
      if (d !== 0) mis.push({ value: lin([[a - c, 'x'], [b + d, '']]), msg: 'Nach dem Minus vor der Klammer müssen ALLE Vorzeichen in der Klammer wechseln, auch das zweite.' });
      mis.push({ value: lin([[a + c, 'x'], [b + d, '']]), msg: 'Die Klammer darf nicht einfach weggelassen werden: Minus davor ändert alle Vorzeichen.' });
      return {
        prompt: `Löse die Klammer auf und fasse zusammen: $${lin([[a, 'x'], [b, '']])} - (${lin([[c, 'x'], [d, '']])})$`,
        answer: { kind: 'expr', value, form: 'expanded' },
        steps: [{ m: lin([[a, 'x'], [b, ''], [-c, 'x'], [-d, '']]), why: 'Minus vor der Klammer: alle Vorzeichen in der Klammer wechseln' }, { m: value, why: 'Zusammenfassen' }],
        misconceptions: mis.filter((m) => m.value !== value),
      };
    },
  },
  {
    id: 'T5', title: 'Ausmultiplizieren', area: 'Terme', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A', prereqs: ['T3', 'T4'],
    intro: 'Distributivgesetz: Der Faktor vor der Klammer wird mit JEDEM Term in der Klammer multipliziert: k(a + b) = ka + kb.',
    tip: 'Zeichne Bögen vom Faktor zu jedem Term in der Klammer.',
    selfExplain: {
      q: 'Warum ist 3(x + 2) = 3x + 6 und nicht 3x + 2?',
      options: ['3(x + 2) heisst dreimal (x + 2) – also dreimal x UND dreimal 2.', 'Weil man immer die letzte Zahl verdoppelt.', 'Weil 3 + 2 = 5.'],
      correct: 0,
      why: '3(x + 2) = (x + 2) + (x + 2) + (x + 2) = 3x + 6.',
    },
    gen: (r) => {
      const k = r.pick([-7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7]), a = r.nz(-6, 6), b = r.nz(-9, 9);
      const withX = r.bool(0.3);
      const f = withX ? lin([[k, 'x']]) : `${k}`;
      const value = withX ? lin([[k * a, 'x²'], [k * b, 'x']]) : lin([[k * a, 'x'], [k * b, '']]);
      const inner = lin([[a, 'x'], [b, '']]);
      const prompt = `Multipliziere aus: $${f === '1' ? '' : f === '-1' ? '-' : f}(${inner})$`;
      const mis = [{ value: withX ? lin([[k * a, 'x²'], [b, '']]) : lin([[k * a, 'x'], [b, '']]), msg: 'Der Faktor vor der Klammer muss mit JEDEM Term in der Klammer multipliziert werden.' }];
      return {
        prompt,
        answer: { kind: 'expr', value, form: 'expanded' },
        steps: [{ m: `${p(k)}${withX ? 'x' : ''} · ${a < 0 ? `(${lin([[a, 'x']])})` : lin([[a, 'x']])} + ${p(k)}${withX ? 'x' : ''} · ${p(b)}`, why: 'Jeden Term multiplizieren' }, { m: value }],
        misconceptions: mis.filter((m) => m.value !== value),
      };
    },
  },
  {
    id: 'T6', title: 'Ausklammern', area: 'Terme', stage: 'Sek 2', niveau: 'alle', lp21: 'MA.1.A', prereqs: ['T5', 'G6'],
    intro: 'Ausklammern ist die Umkehrung des Ausmultiplizierens. Suche den grössten Faktor, der in allen Termen steckt (Zahl und Variable), und schreibe ihn vor die Klammer.',
    tip: 'ggT der Zahlen bestimmen; kommt eine Variable in allen Termen vor, gehört sie auch nach vorne. Kontrolle: wieder ausmultiplizieren.',
    gen: (r) => {
      const g = r.int(2, 8);
      let a = 0, b = 0;
      do { a = r.int(1, 7); b = r.nz(-9, 9); } while (gcd(a, b) !== 1 || a === 0);
      const withX = r.bool(0.35);
      const pre = withX ? `${g}x` : `${g}`;
      const inner = lin([[a, 'x'], [b, '']]);
      const value = `${pre}(${inner})`;
      const expanded = withX ? lin([[g * a, 'x²'], [g * b, 'x']]) : lin([[g * a, 'x'], [g * b, '']]);
      return {
        prompt: `Klammere den grössten gemeinsamen Faktor aus: $${expanded}$`,
        answer: { kind: 'expr', value, form: 'factored' },
        inputHint: 'z. B. 3(2x + 5)',
        steps: [
          { m: withX ? `${pre} · ${lin([[a, 'x']])} + ${pre} · ${p(b)}` : `${g} · ${lin([[a, 'x']])} + ${g} · ${p(b)}`, why: `Gemeinsamer Faktor: ${pre}` },
          { m: value, why: 'Faktor vor die Klammer' },
        ],
      };
    },
  },
  {
    id: 'T7', title: 'Klammer mal Klammer', area: 'Terme', stage: 'Sek 2', niveau: 'alle', lp21: 'MA.1.A', prereqs: ['T5'],
    intro: 'Bei (a + b)(c + d) wird jeder Term der ersten Klammer mit jedem Term der zweiten multipliziert: ac + ad + bc + bd. Danach zusammenfassen.',
    tip: 'Vier Produkte bilden, dann gleichartige Terme zusammenfassen.',
    gen: (r) => {
      const k = r.bool(0.3) ? r.int(2, 3) : 1;
      const a = r.nz(-9, 9), b = r.nz(-9, 9);
      const value = lin([[k, 'x²'], [k * b + a, 'x'], [a * b, '']]);
      const f1 = lin([[k, 'x'], [a, '']]), f2 = lin([[1, 'x'], [b, '']]);
      return {
        prompt: `Multipliziere aus und fasse zusammen: $(${f1})(${f2})$`,
        answer: { kind: 'expr', value, form: 'expanded' },
        steps: [
          { m: lin([[k, 'x²'], [k * b, 'x'], [a, 'x'], [a * b, '']]), why: 'Jeder mit jedem' },
          { m: value, why: 'Zusammenfassen' },
        ],
        misconceptions: [{ value: lin([[k, 'x²'], [a * b, '']]), msg: 'Es fehlen die gemischten Terme. Jeder Term der ersten Klammer muss mit jedem der zweiten multipliziert werden (4 Produkte).' }]
          .filter((m) => m.value !== value),
      };
    },
  },
  {
    id: 'T8', title: 'Binomische Formeln', area: 'Terme', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.1.A', prereqs: ['T7'],
    intro: '1. (a + b)² = a² + 2ab + b²   2. (a − b)² = a² − 2ab + b²   3. (a + b)(a − b) = a² − b². Sie sind Abkürzungen für «Klammer mal Klammer».',
    tip: 'Das Quadrat einer Summe hat DREI Terme – das Mischglied 2ab nicht vergessen.',
    selfExplain: {
      q: 'Warum ist (x + 3)² nicht x² + 9?',
      options: ['(x + 3)² = (x + 3)(x + 3) – dabei entsteht zweimal 3x.', 'Weil man 3 nicht quadrieren darf.', 'Doch, das stimmt.'],
      correct: 0,
      why: 'Test mit x = 1: (1 + 3)² = 16, aber 1 + 9 = 10. Es fehlt 2 · 3x = 6x.',
    },
    gen: (r) => {
      const t = r.int(0, 2);
      const k = r.bool(0.3) ? r.int(2, 4) : 1;
      const b = r.int(1, 9);
      const sq = k === 1 ? 'x²' : `(${k}x)²`;
      const ax = lin([[k, 'x']]);
      if (t === 2) {
        const value = lin([[k * k, 'x²'], [-b * b, '']]);
        return {
          prompt: `Multipliziere aus: $(${ax} + ${b})(${ax} - ${b})$`,
          answer: { kind: 'expr', value, form: 'expanded' },
          steps: [{ m: `${sq} - ${b}²`, why: '3. binomische Formel: a² − b²' }, { m: value }],
        };
      }
      const s = t === 0 ? 1 : -1;
      const value = lin([[k * k, 'x²'], [2 * k * b * s, 'x'], [b * b, '']]);
      return {
        prompt: `Multipliziere aus: $(${ax} ${s > 0 ? '+' : '-'} ${b})²$`,
        answer: { kind: 'expr', value, form: 'expanded' },
        steps: [{ m: `${sq} ${s > 0 ? '+' : '-'} 2 · ${ax === 'x' ? 'x' : `${k}x`} · ${b} + ${b}²`, why: `${t + 1}. binomische Formel: a² ${s > 0 ? '+' : '−'} 2ab + b²` }, { m: value }],
        misconceptions: [
          { value: lin([[k * k, 'x²'], [b * b, '']]), msg: 'Das Mischglied fehlt: (a ± b)² = a² ± 2ab + b².' },
          { value: lin([[k * k, 'x²'], [-b * b, '']]), msg: 'Das ist die 3. Formel. Bei (a ± b)² gibt es ein Mischglied und + b².' },
        ],
      };
    },
  },
  {
    id: 'T9', title: 'Terme mit Brüchen', area: 'Terme', stage: 'Sek 2', niveau: 'alle', lp21: 'MA.1.A', prereqs: ['T5', 'B12'],
    intro: 'Brüche als Koeffizienten behandelst du genau wie ganze Zahlen: 1/2 x + 1/3 x = (1/2 + 1/3) x = 5/6 x.',
    tip: 'Rechne die Koeffizienten wie normale Brüche (Hauptnenner).',
    gen: (r) => {
      const dens = [2, 3, 4, 5, 6];
      if (r.bool()) {
        const a = Q.of(r.nz(-5, 5), r.pick(dens)), b = Q.of(r.nz(-5, 5), r.pick(dens));
        const s = a.add(b);
        if (s.isZero()) return terme[8].gen(r);
        const value = lin([[s, 'x']]);
        return {
          prompt: `Fasse zusammen: $${lin([[a, 'x'], [b, 'x']])}$`,
          answer: { kind: 'expr', value, form: 'simplified' },
          inputHint: 'z. B. 5/6x',
          steps: [{ m: `(${a.toString()} + ${p(b)})x`, why: 'Koeffizienten addieren' }, { m: value }],
        };
      }
      const d = r.pick(dens), c = r.nz(-4, 4);
      const f = Q.of(c, d);
      const k1 = r.nz(-4, 4) * d, k2 = r.nz(-9, 9);
      const value = lin([[f.mul(Q.of(k1)), 'x'], [f.mul(Q.of(k2)), '']]);
      return {
        prompt: `Multipliziere aus: $${f.toString()}(${lin([[k1, 'x'], [k2, '']])})$`,
        answer: { kind: 'expr', value, form: 'expanded' },
        steps: [{ m: `${p(f)} · ${p(k1)}x + ${p(f)} · ${p(k2)}`, why: 'Jeden Term multiplizieren' }, { m: value }],
        misconceptions: [{ value: lin([[f.mul(Q.of(k1)), 'x'], [k2, '']]), msg: 'Der Faktor muss mit JEDEM Term in der Klammer multipliziert werden.' }].filter((m) => m.value !== value),
      };
    },
  },
];
