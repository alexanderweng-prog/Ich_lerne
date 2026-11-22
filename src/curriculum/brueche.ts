import { Q, gcd, lcm } from '../math/rational';
import type { Misconception } from '../math/check';
import type { Rng, Skill, Step } from './types';
import { fq, p, mixed } from './fmt';

/** Echter, gekürzter Bruch mit Nenner aus der Liste. */
function properFrac(r: Rng, dens: number[]): [number, number] {
  for (;;) {
    const d = r.pick(dens);
    const n = r.int(1, d - 1);
    if (gcd(n, d) === 1) return [n, d];
  }
}

/** Schritt «kürzen», falls nötig. */
function reduceStep(num: number, den: number): Step[] {
  const g = gcd(num, den);
  const res = Q.of(num, den);
  if (g === 1 || g === 0) return [];
  return [{ m: fq(res), why: `Kürzen mit ${g}` }];
}

/** Fehlvorstellungen entfernen, die zufällig mit der richtigen Lösung übereinstimmen. */
function only(correct: Q, mis: Array<Misconception | null>): Misconception[] {
  return mis.filter((m): m is Misconception => !!m && !(m.value instanceof Q && m.value.eq(correct)));
}

/** Gemischte Zahl als zwei Mathe-Abschnitte für den Aufgabentext. */
const mixedM = (q: Q): string => {
  const s = mixed(q);
  const m = /^(-?\d+) (\d+\/\d+)$/.exec(s);
  return m ? `$${m[1]}$$${m[2]}$` : `$${s}$`;
};

export const brueche: Skill[] = [
  {
    id: 'B1', title: 'Was ist ein Bruch?', area: 'Brüche', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.1.g', prereqs: ['G4'],
    intro: 'Ein Ganzes wird in gleich grosse Teile geteilt. Der Nenner (unten) sagt, in wie viele Teile. Der Zähler (oben) sagt, wie viele Teile du nimmst.',
    tip: 'Nenner = Anzahl aller Teile. Zähler = Anzahl gefärbter Teile.',
    selfExplain: {
      q: 'Ein Streifen hat 8 gleich grosse Teile, 3 davon sind gefärbt. Warum ist das 3/8 und nicht 3/5?',
      options: ['Weil der Nenner die Anzahl aller Teile angibt, nicht die der ungefärbten.', 'Weil 8 grösser ist als 5.', 'Weil man Zähler und Nenner addieren muss.'],
      correct: 0,
      why: 'Der Nenner beschreibt, in wie viele gleich grosse Teile das Ganze geteilt ist – hier 8.',
    },
    gen: (r) => {
      const n = r.int(2, 12), k = r.int(1, n - 1);
      return {
        prompt: 'Welcher Bruchteil des Streifens ist gefärbt?',
        visual: { type: 'bar', parts: n, shaded: k },
        answer: { kind: 'number', value: Q.of(k, n) },
        inputHint: 'als Bruch, z. B. 3/8',
        steps: [{ m: `${k}/${n}`, why: `${k} gefärbte von ${n} gleich grossen Teilen` }],
        misconceptions: only(Q.of(k, n), [
          { value: Q.of(k, n - k), msg: 'Du hast gefärbte durch ungefärbte Teile geteilt. Der Nenner ist die Anzahl ALLER Teile.' },
          { value: Q.of(n - k, n), msg: 'Das ist der ungefärbte Teil. Gefragt ist der gefärbte.' },
        ]),
      };
    },
  },
  {
    id: 'B2', title: 'Brüche erweitern', area: 'Brüche', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.f', prereqs: ['B1', 'G2'],
    intro: 'Erweitern heisst: Zähler und Nenner mit derselben Zahl multiplizieren. Der Wert des Bruchs bleibt gleich – die Teile werden nur feiner.',
    tip: 'Mit welcher Zahl wurde der Nenner multipliziert? Mit derselben Zahl multiplizierst du den Zähler.',
    selfExplain: {
      q: 'Warum ist 3/4 = 6/8?',
      options: ['Jedes Viertel wird in zwei Achtel geteilt – die Menge bleibt gleich.', 'Weil man zu Zähler und Nenner dieselbe Zahl addiert.', 'Weil 6/8 grösser ist.'],
      correct: 0,
      why: 'Erweitern macht die Teile feiner, aber nimmt nichts weg und fügt nichts hinzu.',
    },
    gen: (r) => {
      const [a, b] = properFrac(r, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const k = r.int(2, 7);
      return {
        prompt: `Erweitere $${a}/${b}$ so, dass der Nenner $${b * k}$ ist. Wie heisst der neue Zähler?`,
        answer: { kind: 'number', value: Q.of(a * k), form: 'integer' },
        steps: [
          { m: `${b} · ${k} = ${b * k}`, why: `Der Nenner wurde mit ${k} multipliziert` },
          { m: `(${a} · ${k})/(${b} · ${k})`, why: 'Zähler mit derselben Zahl multiplizieren' },
          { m: `${a * k}/${b * k}` },
        ],
        misconceptions: only(Q.of(a * k), [{ value: Q.of(a + b * k - b), msg: 'Du hast addiert. Beim Erweitern wird multipliziert.' }]),
      };
    },
  },
  {
    id: 'B3', title: 'Brüche kürzen', area: 'Brüche', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.f', prereqs: ['B2', 'G6'],
    intro: 'Kürzen heisst: Zähler und Nenner durch dieselbe Zahl teilen. Vollständig gekürzt ist ein Bruch, wenn Zähler und Nenner keinen gemeinsamen Teiler mehr haben. Am schnellsten kürzt du mit dem ggT.',
    tip: 'Bestimme den ggT von Zähler und Nenner und teile beide dadurch.',
    gen: (r) => {
      const [a, b] = properFrac(r, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const k = r.int(2, 9);
      return {
        prompt: `Kürze vollständig: $${a * k}/${b * k}$`,
        answer: { kind: 'number', value: Q.of(a, b), form: 'reduced' },
        inputHint: 'als vollständig gekürzter Bruch',
        steps: [
          { m: `ggT(${a * k}, ${b * k}) = ${k}`, why: 'Grössten gemeinsamen Teiler suchen' },
          { m: `(${a * k} : ${k})/(${b * k} : ${k})`, why: `Zähler und Nenner durch ${k} teilen` },
          { m: `${a}/${b}` },
        ],
      };
    },
  },
  {
    id: 'B4', title: 'Gemischte Zahlen', area: 'Brüche', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.1.g', prereqs: ['B1', 'G4'],
    intro: 'Eine gemischte Zahl wie 2 1/3 bedeutet 2 + 1/3. Umwandeln in einen Bruch: Ganze mal Nenner, plus Zähler. Umgekehrt: Zähler durch Nenner teilen – das Ergebnis sind die Ganzen, der Rest ist der neue Zähler.',
    tip: '2 1/3: Ein Ganzes sind 3 Drittel, zwei Ganze sind 6 Drittel, dazu 1 Drittel.',
    gen: (r) => {
      const [z, n] = properFrac(r, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const w = r.int(1, 6);
      const v = Q.of(w * n + z, n);
      if (r.bool()) {
        return {
          prompt: `Schreibe ${mixedM(v)} als Bruch.`,
          answer: { kind: 'number', value: v, form: 'improper' },
          inputHint: 'als Bruch, z. B. 7/3',
          steps: [{ m: `(${w} · ${n} + ${z})/${n}`, why: `${w} Ganze sind ${w * n}/${n}, dazu ${z}/${n}` }, { m: `${w * n + z}/${n}` }],
          misconceptions: only(v, [{ value: Q.of(w + z, n), msg: `Die Ganzen müssen zuerst in ${n}tel umgerechnet werden: ${w} · ${n}.` }]),
        };
      }
      return {
        prompt: `Schreibe $${w * n + z}/${n}$ als gemischte Zahl.`,
        answer: { kind: 'number', value: v, form: 'mixed' },
        inputHint: 'gemischte Zahl mit Leerschlag, z. B. 3 2/5',
        steps: [{ m: `${w * n + z} : ${n} = ${w} Rest ${z}`, why: `${w} Ganze, Rest ${z}` }, { m: mixed(v) }],
      };
    },
  },
  {
    id: 'B5', title: 'Brüche vergleichen', area: 'Brüche', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.2.g', prereqs: ['B2', 'G7'],
    intro: 'Brüche mit gleichem Nenner kannst du direkt am Zähler vergleichen. Haben sie verschiedene Nenner, machst du sie zuerst gleichnamig (gemeinsamer Nenner).',
    tip: 'Erweitere beide Brüche auf das kgV der Nenner.',
    gen: (r) => {
      let [a, b] = properFrac(r, [2, 3, 4, 5, 6, 8, 9, 10, 12]);
      let [c, d] = properFrac(r, [2, 3, 4, 5, 6, 8, 9, 10, 12]);
      if (b === d) d = d === 12 ? 8 : d + 1, c = Math.min(c, d - 1);
      if (r.bool(0.2)) { const k = r.int(2, 3); c = a * k; d = b * k; }
      const L = lcm(b, d);
      const A = (a * L) / b, C = (c * L) / d;
      const rel = A < C ? 0 : A > C ? 1 : 2;
      return {
        prompt: `Welches Zeichen gehört zwischen die beiden Brüche? $${a}/${b}$ ☐ $${c}/${d}$`,
        answer: { kind: 'choice', options: ['<', '>', '='], correct: rel },
        steps: [
          { m: `${a}/${b} = ${A}/${L}`, why: `Auf den Nenner ${L} erweitern` },
          { m: `${c}/${d} = ${C}/${L}` },
          { m: `${A}/${L} ${['<', '>', '='][rel]} ${C}/${L}`, why: 'Zähler vergleichen' },
        ],
      };
    },
  },
  {
    id: 'B6', title: 'Gleichnamige Brüche addieren und subtrahieren', area: 'Brüche', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.f', prereqs: ['B3', 'B4'],
    intro: 'Haben Brüche denselben Nenner, addierst bzw. subtrahierst du nur die Zähler. Der Nenner bleibt gleich – er sagt ja nur, welche Art von Teilen du zählst. Am Schluss kürzen.',
    tip: '2 Fünftel + 1 Fünftel = 3 Fünftel – so wie 2 Äpfel + 1 Apfel = 3 Äpfel.',
    selfExplain: {
      q: 'Warum ist 2/7 + 3/7 = 5/7 und nicht 5/14?',
      options: ['Siebtel plus Siebtel ergibt Siebtel – die Grösse der Teile ändert sich nicht.', 'Weil man Nenner nie verändern darf, auch nicht beim Kürzen.', 'Weil 14 zu gross ist.'],
      correct: 0,
      why: 'Der Nenner benennt die Teilgrösse. Würde man 7 + 7 rechnen, wären die Teile plötzlich halb so gross.',
    },
    gen: (r) => {
      const n = r.int(3, 12);
      const add = r.bool(0.6);
      let a = r.int(1, n - 1), b = r.int(1, n - 1);
      if (!add) { a = r.int(2, n - 1); b = r.int(1, a - 1); }
      const num = add ? a + b : a - b;
      const res = Q.of(num, n);
      return {
        prompt: `Berechne $${a}/${n} ${add ? '+' : '-'} ${b}/${n}$.`,
        answer: { kind: 'number', value: res, form: 'reduced' },
        inputHint: 'vollständig gekürzt',
        steps: [
          { m: `(${a} ${add ? '+' : '-'} ${b})/${n}`, why: 'Zähler verrechnen, Nenner bleibt' },
          { m: `${num}/${n}` }, ...reduceStep(num, n),
        ],
        misconceptions: only(res, [add ? { value: Q.of(a + b, 2 * n), msg: 'Du hast auch die Nenner addiert. Der Nenner bleibt gleich!' } : null]),
      };
    },
  },
  {
    id: 'B7', title: 'Ungleichnamige Brüche addieren und subtrahieren', area: 'Brüche', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.i', prereqs: ['B6', 'G7'],
    intro: 'Brüche mit verschiedenen Nennern musst du zuerst gleichnamig machen: beide auf den Hauptnenner (kgV der Nenner) erweitern. Danach wie gleichnamige Brüche rechnen und kürzen.',
    tip: 'Hauptnenner = kgV der Nenner. Dann beide Brüche darauf erweitern.',
    selfExplain: {
      q: 'Warum darf man bei 1/2 + 1/3 nicht einfach (1+1)/(2+3) = 2/5 rechnen?',
      options: ['2/5 ist kleiner als 1/2 – durch Dazuzählen kann das Ergebnis aber nicht kleiner werden.', 'Weil man immer zuerst kürzen muss.', 'Doch, das ist richtig.'],
      correct: 0,
      why: 'Halbe und Drittel sind verschieden grosse Teile. Man kann sie erst zusammenzählen, wenn sie gleich gross sind (Sechstel).',
    },
    gen: (r) => {
      let [a, b] = properFrac(r, [2, 3, 4, 5, 6, 8, 9, 10, 12]);
      let [c, d] = properFrac(r, [2, 3, 4, 5, 6, 7, 8, 10]);
      while (d === b) [c, d] = properFrac(r, [2, 3, 4, 5, 6, 7, 8, 10]);
      const add = r.bool(0.6);
      if (!add && Q.of(a, b).lt(Q.of(c, d))) [a, b, c, d] = [c, d, a, b];
      const L = lcm(b, d);
      const A = (a * L) / b, C = (c * L) / d;
      const num = add ? A + C : A - C;
      const res = Q.of(num, L);
      const op = add ? '+' : '-';
      return {
        prompt: `Berechne $${a}/${b} ${op} ${c}/${d}$.`,
        answer: { kind: 'number', value: res, form: 'reduced' },
        inputHint: 'vollständig gekürzt',
        steps: [
          { m: `${A}/${L} ${op} ${C}/${L}`, why: `Hauptnenner kgV(${b}, ${d}) = ${L}` },
          { m: `(${A} ${op} ${C})/${L}`, why: 'Zähler verrechnen' },
          { m: `${num}/${L}` }, ...reduceStep(num, L),
        ],
        misconceptions: only(res, [
          add ? { value: Q.of(a + c, b + d), msg: 'Du hast Zähler plus Zähler und Nenner plus Nenner gerechnet. Mache die Brüche zuerst gleichnamig.' } : null,
          !add && b !== d && a !== c ? (() => { try { return { value: Q.of(a - c, b - d), msg: 'Du hast Zähler minus Zähler und Nenner minus Nenner gerechnet. Mache die Brüche zuerst gleichnamig.' }; } catch { return null; } })() : null,
          { value: Q.of(add ? a + c : a - c, L), msg: 'Der Hauptnenner stimmt, aber die Zähler müssen beim Erweitern mitmultipliziert werden.' },
        ]),
      };
    },
  },
  {
    id: 'B8', title: 'Brüche multiplizieren', area: 'Brüche', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.g', prereqs: ['B3'],
    intro: 'Zähler mal Zähler, Nenner mal Nenner. Tipp: Vor dem Ausrechnen über Kreuz kürzen, dann bleiben die Zahlen klein. Einen gemeinsamen Nenner brauchst du hier nicht.',
    tip: 'Zähler · Zähler und Nenner · Nenner. Kürze vorher, wenn möglich.',
    selfExplain: {
      q: 'Warum ist 1/2 · 1/3 = 1/6 kleiner als beide Faktoren?',
      options: ['Weil man die Hälfte von einem Drittel nimmt – also einen Teil davon.', 'Weil man bei Brüchen immer subtrahiert.', 'Das stimmt nicht, das Produkt ist immer grösser.'],
      correct: 0,
      why: '«Mal einen Bruch kleiner als 1» bedeutet «einen Teil davon nehmen». Deshalb wird das Ergebnis kleiner.',
    },
    gen: (r) => {
      const [a, b] = properFrac(r, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const [c, d] = properFrac(r, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const res = Q.of(a * c, b * d);
      return {
        prompt: `Berechne $${a}/${b} · ${c}/${d}$.`,
        answer: { kind: 'number', value: res, form: 'reduced' },
        inputHint: 'vollständig gekürzt',
        steps: [{ m: `(${a} · ${c})/(${b} · ${d})`, why: 'Zähler mal Zähler, Nenner mal Nenner' }, { m: `${a * c}/${b * d}` }, ...reduceStep(a * c, b * d)],
        misconceptions: only(res, [
          { value: Q.of(a * d, b * c), msg: 'Über Kreuz multipliziert man nicht (nur beim Kürzen schaut man über Kreuz). Zähler · Zähler, Nenner · Nenner.' },
          b === d ? { value: Q.of(a * c, b), msg: 'Beim Multiplizieren bleibt der Nenner nicht gleich: auch Nenner mal Nenner.' } : null,
        ]),
      };
    },
  },
  {
    id: 'B9', title: 'Bruchteile von Grössen', area: 'Brüche', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.g', prereqs: ['B8', 'G3'],
    intro: '3/4 von 60 heisst 3/4 · 60. Rechne zuerst 60 : 4 (ein Viertel), dann mal 3 (drei Viertel).',
    tip: 'Erst durch den Nenner teilen, dann mal den Zähler.',
    gen: (r) => {
      const [a, b] = properFrac(r, [2, 3, 4, 5, 6, 8, 10, 12]);
      const unit = r.pick([['kg', 'Mehl'], ['Fr.', 'Taschengeld'], ['km', 'Wanderweg'], ['Minuten', 'Lektion'], ['SuS', 'Klasse']] as const);
      const total = b * r.int(2, 15);
      const res = (total / b) * a;
      const ctx = unit[0] === 'SuS' ? `Eine Schule hat $${total}$ Schülerinnen und Schüler. $${a}/${b}$ davon kommen mit dem Velo. Wie viele sind das?`
        : `Wie viel sind $${a}/${b}$ von $${total}$ ${unit[0]}?`;
      return {
        prompt: ctx,
        answer: { kind: 'number', value: Q.of(res) },
        steps: [{ m: `${total} : ${b} = ${total / b}`, why: `1/${b} von ${total}` }, { m: `${total / b} · ${a} = ${res}`, why: `${a}/${b} von ${total}` }],
        misconceptions: only(Q.of(res), [
          { value: Q.of(total / b), msg: `Das ist erst 1/${b}. Du brauchst ${a}/${b}, also noch mal ${a}.` },
          { value: Q.of(total * b, a), msg: 'Umgekehrt: zuerst durch den Nenner teilen, dann mal den Zähler.' },
        ]),
      };
    },
  },
  {
    id: 'B10', title: 'Brüche dividieren', area: 'Brüche', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.i', prereqs: ['B8'],
    intro: 'Durch einen Bruch teilen heisst: mit seinem Kehrwert multiplizieren. Kehrwert = Zähler und Nenner vertauschen. Also: a/b : c/d = a/b · d/c.',
    tip: 'Den ZWEITEN Bruch umdrehen, dann multiplizieren.',
    selfExplain: {
      q: 'Warum ist 3 : 1/2 = 6?',
      options: ['In 3 Ganzen haben 6 Halbe Platz.', 'Weil man durch 2 teilt.', 'Weil 3 · 2 = 6 immer gilt.'],
      correct: 0,
      why: 'Dividieren fragt «Wie oft passt … hinein?». Eine Hälfte passt in jedes Ganze zweimal.',
    },
    gen: (r) => {
      const [a, b] = properFrac(r, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
      let [c, d] = properFrac(r, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
      if (a === c && b === d) [c, d] = [1, d === 2 ? 3 : 2];
      const res = Q.of(a * d, b * c);
      return {
        prompt: `Berechne $${a}/${b} : ${c}/${d}$.`,
        answer: { kind: 'number', value: res, form: 'reduced' },
        inputHint: 'vollständig gekürzt',
        steps: [
          { m: `${a}/${b} · ${d}/${c}`, why: 'Mit dem Kehrwert des zweiten Bruchs multiplizieren' },
          { m: `(${a} · ${d})/(${b} · ${c})` }, { m: `${a * d}/${b * c}` }, ...reduceStep(a * d, b * c),
        ],
        misconceptions: only(res, [
          { value: Q.of(a * c, b * d), msg: 'Du hast multipliziert, ohne den zweiten Bruch umzudrehen. Dividieren = mit dem Kehrwert multiplizieren.' },
          { value: Q.of(b * c, a * d), msg: 'Du hast den ersten Bruch umgedreht. Umgedreht wird der zweite (der Divisor).' },
        ]),
      };
    },
  },
  {
    id: 'B11', title: 'Brüche und Dezimalzahlen', area: 'Brüche', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.g', prereqs: ['B3', 'D1'],
    intro: 'Ein Bruch mit Nenner 10, 100, 1000 lässt sich direkt als Dezimalzahl schreiben: 35/100 = 0.35. Andere Brüche erweiterst du zuerst auf einen solchen Nenner (oder rechnest Zähler : Nenner).',
    tip: 'Erweitere auf 10, 100 oder 1000.',
    gen: (r) => {
      const opts: Array<[number, number]> = [];
      for (const d of [2, 4, 5, 8, 20, 25, 50]) for (let n = 1; n < d; n++) if (gcd(n, d) === 1) opts.push([n, d]);
      const [a, b] = r.pick(opts);
      const pow = [10, 100, 1000].find((t) => t % b === 0)!;
      const k = pow / b;
      const v = Q.of(a, b);
      const dec = (v.toNumber()).toString();
      if (r.bool()) {
        return {
          prompt: `Schreibe $${a}/${b}$ als Dezimalzahl.`,
          answer: { kind: 'number', value: v, form: 'decimal' },
          steps: [{ m: `${a * k}/${pow}`, why: `Mit ${k} auf ${pow} erweitern` }, { m: dec }],
          misconceptions: only(v, [{ value: Q.fromDecimal(`${a}.${b}`), msg: 'Der Bruchstrich ist kein Komma. Ein Bruch bedeutet Zähler geteilt durch Nenner.' }]),
        };
      }
      return {
        prompt: `Schreibe $${dec}$ als vollständig gekürzten Bruch.`,
        answer: { kind: 'number', value: v, form: 'reduced' },
        steps: [{ m: `${a * k}/${pow}`, why: 'Stellenwert: Zehntel, Hundertstel, Tausendstel' }, ...reduceStep(a * k, pow)],
      };
    },
  },
  {
    id: 'B12', title: 'Rechnen mit negativen Brüchen', area: 'Brüche', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.i', prereqs: ['B7', 'B10', 'G9'],
    intro: 'Für negative Brüche gelten dieselben Vorzeichenregeln wie für ganze Zahlen. Rechne mit den Beträgen und bestimme das Vorzeichen separat.',
    tip: 'Vorzeichen zuerst klären, dann wie gewohnt rechnen.',
    gen: (r) => {
      const [a, b] = properFrac(r, [2, 3, 4, 5, 6, 8, 10]);
      const [c, d] = properFrac(r, [2, 3, 4, 5, 6, 8, 10]);
      const x = Q.of(-a, b), y = r.bool() ? Q.of(c, d) : Q.of(-c, d);
      const v = r.int(0, 3);
      const ops = ['+', '-', '·', ':'] as const;
      const op = ops[v];
      const res = v === 0 ? x.add(y) : v === 1 ? x.sub(y) : v === 2 ? x.mul(y) : x.div(y);
      const steps: Step[] = [];
      if (v < 2) {
        const L = lcm(b, d);
        const X = x.mul(Q.of(L)), Y = y.mul(Q.of(L));
        const frac = (n: Q) => (n.n < 0n ? `(-${fq(n.neg())}/${L})` : `${fq(n)}/${L}`);
        steps.push({ m: `-${fq(X.neg())}/${L} ${op === '+' ? '+' : '-'} ${frac(Y)}`, why: `Hauptnenner ${L}` });
        const num = v === 0 ? X.add(Y) : X.sub(Y);
        steps.push({ m: num.n < 0n ? `-${fq(num.neg())}/${L}` : `${fq(num)}/${L}`, why: 'Zähler verrechnen (Vorzeichen beachten)' });
        if (res.d !== BigInt(L)) steps.push({ m: fq(res), why: 'Kürzen' });
      } else {
        if (v === 3) steps.push({ m: `${p(x)} · ${p(Q.of(1).div(y))}`, why: 'Mit dem Kehrwert multiplizieren' });
        steps.push({ m: fq(res), why: (x.n < 0n) === (y.n < 0n) ? 'Beträge verrechnen und kürzen; gleiche Vorzeichen → Plus' : 'Beträge verrechnen und kürzen; verschiedene Vorzeichen → Minus' });
      }
      const yStr = y.n < 0n ? `(${fq(y)})` : fq(y);
      return {
        prompt: `Berechne $${fq(x)} ${op} ${yStr}$.`,
        answer: { kind: 'number', value: res, form: 'reduced' },
        inputHint: 'vollständig gekürzt',
        steps,
        misconceptions: res.isZero() ? [] : [{ value: res.neg(), msg: 'Der Betrag stimmt, aber das Vorzeichen nicht.' }],
      };
    },
  },
];
