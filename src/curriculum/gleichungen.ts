import { Q, lcm } from '../math/rational';
import type { Misconception } from '../math/check';
import type { Skill, Task, Rng } from './types';
import { lin, p, fq } from './fmt';

const sol = (v: Q): Task['answer'] => ({ kind: 'solution', variable: 'x', value: v });
const only = (correct: Q, mis: Misconception[]) => mis.filter((m) => !(m.value instanceof Q && m.value.eq(correct)));
const op = (n: number) => (n < 0 ? `- ${-n}` : `+ ${n}`);
/** Umformung als Begründung, z. B. "| − 5" */
const act = (s: string) => `| ${s}`;

/** Für Textaufgaben */
function textTask(r: Rng): Task {
  const v = r.int(0, 3);
  if (v === 0) {
    const a = r.int(2, 9), b = r.int(1, 20), x = r.int(2, 15);
    const c = a * x + b;
    return {
      prompt: `Lea denkt sich eine Zahl. Sie multipliziert sie mit ${a} und addiert ${b}. Sie erhält ${c}. Welche Zahl hat sie sich gedacht?`,
      answer: { kind: 'number', value: Q.of(x) },
      steps: [{ m: `${a}x + ${b} = ${c}`, why: 'Gleichung aufstellen: x = gedachte Zahl' }, { m: `${a}x = ${c - b}`, why: act(`− ${b}`) }, { m: `x = ${x}`, why: act(`: ${a}`) }],
      misconceptions: only(Q.of(x), [{ value: Q.of(c - b), msg: `Fast: ${a}x = ${c - b}, jetzt noch durch ${a} teilen.` }, { value: Q.of(c, a), msg: `Zuerst die ${b} wegbringen, dann durch ${a} teilen.` }]),
    };
  }
  if (v === 1) {
    const d = r.int(2, 12), x = r.int(8, 30);
    const sum = 2 * x + d;
    return {
      prompt: `Noah ist ${d} Jahre älter als seine Schwester Mia. Zusammen sind sie ${sum} Jahre alt. Wie alt ist Mia?`,
      answer: { kind: 'number', value: Q.of(x) },
      steps: [{ m: `x + (x + ${d}) = ${sum}`, why: 'Mia = x, Noah = x + ' + d }, { m: `2x + ${d} = ${sum}`, why: 'Zusammenfassen' }, { m: `2x = ${sum - d}`, why: act(`− ${d}`) }, { m: `x = ${x}`, why: act(': 2') }],
      misconceptions: only(Q.of(x), [{ value: Q.of(x + d), msg: 'Das ist Noahs Alter. Gefragt ist Mia.' }, { value: Q.of(sum, 2), msg: `Die beiden sind nicht gleich alt: Noah ist ${d} Jahre älter.` }]),
    };
  }
  if (v === 2) {
    const b = r.int(3, 12), k = r.int(2, 3);
    const u = 2 * (k * b + b);
    return {
      prompt: `Ein Rechteck ist ${k}-mal so lang wie breit. Sein Umfang beträgt ${u} cm. Wie breit ist es (in cm)?`,
      answer: { kind: 'number', value: Q.of(b) },
      steps: [{ m: `2 · ${k}x + 2 · x = ${u}`, why: `Breite = x, Länge = ${k}x, Umfang = 2 · Länge + 2 · Breite` }, { m: `${2 * k + 2}x = ${u}` }, { m: `x = ${b}`, why: act(`: ${2 * k + 2}`) }],
      misconceptions: only(Q.of(b), [{ value: Q.of(k * b), msg: 'Das ist die Länge. Gefragt ist die Breite.' }, { value: Q.of(u, k + 1), msg: 'Der Umfang besteht aus ZWEI Längen und ZWEI Breiten.' }]),
    };
  }
  const base = r.int(10, 30), per = r.pick([0.1, 0.2, 0.5]), n = r.int(10, 60);
  const total = Q.of(base).add(Q.fromDecimal(String(per)).mul(Q.of(n)));
  return {
    prompt: `Ein Handyabo kostet ${base} Fr. Grundgebühr pro Monat und zusätzlich ${per.toFixed(2)} Fr. pro Gigabyte Daten. Die Rechnung beträgt ${total.toNumber().toFixed(2)} Fr. Wie viele Gigabyte wurden verbraucht?`,
    answer: { kind: 'number', value: Q.of(n) },
    steps: [{ m: `${base} + ${per}x = ${total.toNumber()}`, why: 'x = Anzahl Gigabyte' }, { m: `${per}x = ${total.sub(Q.of(base)).toNumber()}`, why: act(`− ${base}`) }, { m: `x = ${n}`, why: act(`: ${per}`) }],
    misconceptions: [{ value: total.div(Q.fromDecimal(String(per))), msg: 'Die Grundgebühr muss zuerst abgezogen werden.' }],
  };
}

export const gleichungen: Skill[] = [
  {
    id: 'L1', title: 'Lösung einer Gleichung prüfen', area: 'Gleichungen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.4.h', prereqs: ['T1'],
    intro: 'Eine Gleichung ist wie eine Waage im Gleichgewicht. Eine Zahl ist eine Lösung, wenn nach dem Einsetzen links und rechts dasselbe herauskommt.',
    tip: 'Setze die Zahl links und rechts ein und vergleiche.',
    gen: (r) => {
      const a = r.nz(-6, 6), b = r.nz(-10, 10), s = r.nz(-6, 6);
      const c = a * s + b;
      const t = r.bool() ? s : s + r.pick([-2, -1, 1, 2]);
      const val = a * t + b;
      return {
        prompt: `Ist $x = ${t}$ eine Lösung der Gleichung $${lin([[a, 'x'], [b, '']])} = ${c}$?`,
        answer: { kind: 'choice', options: ['Ja', 'Nein'], correct: val === c ? 0 : 1 },
        steps: [{ m: `${a} · ${p(t)} ${op(b)}`, why: 'Linke Seite: einsetzen' }, { m: `${val}`, why: val === c ? `Gleich wie rechts (${c}) → Lösung` : `Rechts steht ${c} → keine Lösung` }],
      };
    },
  },
  {
    id: 'L2', title: 'Gleichungen: x + a = b', area: 'Gleichungen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.4.h', prereqs: ['L1', 'G8'],
    intro: 'Waage-Prinzip: Was du auf einer Seite machst, musst du auch auf der anderen Seite machen. Um x allein zu haben, machst du die Rechnung rückgängig: aus «+ 5» wird «− 5» auf beiden Seiten.',
    tip: 'Umkehroperation: + wird zu −, − wird zu +. Immer auf beiden Seiten!',
    selfExplain: {
      q: 'Bei x + 7 = 12 subtrahiert man auf beiden Seiten 7. Warum auf beiden Seiten?',
      options: ['Damit die Waage im Gleichgewicht bleibt – beide Seiten bleiben gleich gross.', 'Weil es schöner aussieht.', 'Weil man nur rechts rechnen darf.'],
      correct: 0,
      why: 'Eine Gleichung sagt «links = rechts». Das bleibt nur wahr, wenn beide Seiten gleich verändert werden.',
    },
    gen: (r) => {
      const x = r.int(-15, 20), a = r.nz(-15, 15);
      if (r.bool()) {
        const b = x + a;
        return {
          prompt: `Löse die Gleichung: $x ${op(a)} = ${b}$`,
          answer: sol(Q.of(x)),
          steps: [{ m: `x = ${b} ${op(-a)}`, why: act(a > 0 ? `− ${a}` : `+ ${-a}`) }, { m: `x = ${x}` }],
          misconceptions: only(Q.of(x), [{ value: Q.of(b + a), msg: `Um ${op(a)} rückgängig zu machen, brauchst du die Gegenoperation.` }]),
        };
      }
      const b = a + x;
      return {
        prompt: `Löse die Gleichung: $${a} + x = ${b}$`,
        answer: sol(Q.of(x)),
        steps: [{ m: `x = ${b} ${op(-a)}`, why: act(a > 0 ? `− ${a}` : `+ ${-a}`) }, { m: `x = ${x}` }],
        misconceptions: only(Q.of(x), [{ value: Q.of(b + a), msg: 'Gegenoperation verwenden: aus Plus wird Minus.' }]),
      };
    },
  },
  {
    id: 'L3', title: 'Gleichungen: a · x = b', area: 'Gleichungen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.4.h', prereqs: ['L2', 'B3', 'G9'],
    intro: '3x heisst 3 · x. Die Umkehrung von «mal 3» ist «durch 3» – auf beiden Seiten. Bei x : 4 = 5 rechnest du umgekehrt «mal 4».',
    tip: 'Teile beide Seiten durch die Zahl vor dem x. Das Ergebnis darf ein Bruch sein.',
    gen: (r) => {
      const a = r.pick([-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
      if (r.bool(0.7)) {
        const frac = r.bool(0.25);
        const x = frac ? Q.of(r.nz(-9, 9), Math.abs(a)) : Q.of(r.int(-12, 12));
        const b = x.mul(Q.of(a));
        return {
          prompt: `Löse die Gleichung: $${a}x = ${fq(b)}$`,
          answer: sol(x),
          inputHint: 'Bruch oder ganze Zahl',
          steps: [{ m: `x = ${fq(b)} : ${p(a)}`, why: act(`: ${p(a)}`) }, { m: `x = ${fq(x)}` }],
          misconceptions: only(x, [
            { value: b.sub(Q.of(a)), msg: `${a}x heisst ${a} MAL x. Die Umkehrung ist «durch ${a}», nicht «minus ${a}».` },
            { value: b.mul(Q.of(a)), msg: `Umkehroperation von «mal ${a}» ist «durch ${a}».` },
            ...(b.isZero() ? [] : [{ value: Q.of(a).div(b), msg: 'Du hast umgekehrt geteilt. Rechne rechte Seite durch die Zahl vor dem x.' }]),
          ]),
        };
      }
      const b = r.nz(-9, 9), x = b * a;
      return {
        prompt: `Löse die Gleichung: $x : ${p(a)} = ${b}$`,
        answer: sol(Q.of(x)),
        steps: [{ m: `x = ${b} · ${p(a)}`, why: act(`· ${p(a)}`) }, { m: `x = ${x}` }],
        misconceptions: only(Q.of(x), [{ value: Q.of(b, a), msg: `Die Umkehrung von «durch ${a}» ist «mal ${a}».` }]),
      };
    },
  },
  {
    id: 'L4', title: 'Gleichungen: a · x + b = c', area: 'Gleichungen', stage: 'Sek 1', niveau: 'erweitert', lp21: 'MA.1.A.4.j', prereqs: ['L3'],
    intro: 'Zwei Schritte, in umgekehrter Reihenfolge wie beim Ausrechnen: Zuerst die Zahl ohne x wegbringen (+/−), dann durch die Zahl vor dem x teilen.',
    tip: 'Erst + / −, dann · / :. Wie beim Ausziehen: zuerst die Jacke, dann den Pulli.',
    selfExplain: {
      q: 'Warum bringt man bei 3x + 5 = 20 zuerst die 5 weg und teilt erst dann durch 3?',
      options: ['Weil sonst auch die 5 durch 3 geteilt werden müsste – die Reihenfolge wird umgekehrt.', 'Weil man immer von links nach rechts rechnet.', 'Es spielt keine Rolle, man darf auch 20 : 3 rechnen und dann 5 abziehen.'],
      correct: 0,
      why: 'Teilt man zuerst, muss man JEDEN Term teilen: x + 5/3 = 20/3. Das geht auch, ist aber umständlicher.',
    },
    gen: (r) => {
      const a = r.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8]);
      const x = r.int(-10, 10), b = r.nz(-15, 15);
      const c = a * x + b;
      return {
        prompt: `Löse die Gleichung: $${lin([[a, 'x'], [b, '']])} = ${c}$`,
        answer: sol(Q.of(x)),
        steps: [{ m: `${a}x = ${c - b}`, why: act(b > 0 ? `− ${b}` : `+ ${-b}`) }, { m: `x = ${x}`, why: act(`: ${p(a)}`) }],
        misconceptions: only(Q.of(x), [
          { value: Q.of(c + b, a), msg: `Die ${Math.abs(b)} muss mit der Gegenoperation weggebracht werden.` },
          { value: Q.of(c, a).sub(Q.of(b)), msg: 'Wenn du zuerst teilst, muss auch die Zahl ohne x geteilt werden. Einfacher: zuerst +/−, dann teilen.' },
          { value: Q.of(c - b), msg: `Du bist fast fertig – noch durch ${a} teilen.` },
        ]),
      };
    },
  },
  {
    id: 'L5', title: 'Variable auf beiden Seiten', area: 'Gleichungen', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.1.A.4.j', prereqs: ['L4', 'T2'],
    intro: 'Bringe zuerst alle x auf eine Seite (z. B. auf beiden Seiten −2x), dann alle Zahlen auf die andere. Danach wie gewohnt teilen.',
    tip: 'Sortieren: x-Terme links, Zahlen rechts. Jede Umformung auf beiden Seiten.',
    gen: (r) => {
      let a = 0, c = 0;
      do { a = r.nz(-8, 9); c = r.nz(-8, 9); } while (a === c);
      const x = r.int(-9, 9), b = r.nz(-15, 15);
      const d = (a - c) * x + b;
      const mis: Misconception[] = [];
      if (a + c !== 0) mis.push({ value: Q.of(d - b, a + c), msg: `Um ${lin([[c, 'x']])} auf die linke Seite zu bringen, musst du ${c > 0 ? 'subtrahieren' : 'addieren'}.` });
      return {
        prompt: `Löse die Gleichung: $${lin([[a, 'x'], [b, '']])} = ${lin([[c, 'x'], [d, '']])}$`,
        answer: sol(Q.of(x)),
        steps: [
          { m: `${lin([[a - c, 'x'], [b, '']])} = ${d}`, why: act(c > 0 ? `− ${lin([[c, 'x']])}` : `+ ${lin([[-c, 'x']])}`) },
          { m: `${lin([[a - c, 'x']])} = ${d - b}`, why: act(b > 0 ? `− ${b}` : `+ ${-b}`) },
          { m: `x = ${x}`, why: act(`: ${p(a - c)}`) },
        ],
        misconceptions: only(Q.of(x), mis),
      };
    },
  },
  {
    id: 'L6', title: 'Gleichungen mit Klammern', area: 'Gleichungen', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.1.A.4.j', prereqs: ['L5', 'T5'],
    intro: 'Löse zuerst alle Klammern auf (ausmultiplizieren, Minus vor der Klammer beachten), fasse zusammen und löse dann wie gewohnt.',
    tip: 'Schritt 1: Klammern weg. Schritt 2: zusammenfassen. Schritt 3: x isolieren.',
    gen: (r) => {
      const k = r.pick([-5, -4, -3, -2, 2, 3, 4, 5, 6]);
      const b = r.nz(-9, 9), x = r.int(-8, 8);
      if (r.bool()) {
        const c = k * (x + b);
        return {
          prompt: `Löse die Gleichung: $${k}(${lin([[1, 'x'], [b, '']])}) = ${c}$`,
          answer: sol(Q.of(x)),
          steps: [{ m: `${lin([[k, 'x'], [k * b, '']])} = ${c}`, why: 'Ausmultiplizieren' }, { m: `${k}x = ${c - k * b}`, why: act(k * b > 0 ? `− ${k * b}` : `+ ${-k * b}`) }, { m: `x = ${x}`, why: act(`: ${p(k)}`) }],
          misconceptions: only(Q.of(x), [{ value: Q.of(c - b, k), msg: `Beim Ausmultiplizieren muss auch die ${Math.abs(b)} mit ${k} multipliziert werden.` }]),
        };
      }
      let m = 0;
      do { m = r.nz(-6, 6); } while (m === k);
      const d = k * (x + b) - m * x;
      return {
        prompt: `Löse die Gleichung: $${k}(${lin([[1, 'x'], [b, '']])}) = ${lin([[m, 'x'], [d, '']])}$`,
        answer: sol(Q.of(x)),
        steps: [
          { m: `${lin([[k, 'x'], [k * b, '']])} = ${lin([[m, 'x'], [d, '']])}`, why: 'Ausmultiplizieren' },
          { m: `${lin([[k - m, 'x']])} = ${d - k * b}`, why: 'x-Terme nach links, Zahlen nach rechts' },
          { m: `x = ${x}`, why: act(`: ${p(k - m)}`) },
        ],
        misconceptions: only(Q.of(x), k - m !== 0 ? [{ value: Q.of(d - b, k - m), msg: `Beim Ausmultiplizieren muss auch die ${Math.abs(b)} mit ${k} multipliziert werden.` }] : []),
      };
    },
  },
  {
    id: 'L7', title: 'Gleichungen mit Brüchen', area: 'Gleichungen', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.1.A.4.j', prereqs: ['L6', 'B7'],
    intro: 'Multipliziere die ganze Gleichung mit dem Hauptnenner – JEDEN Term auf beiden Seiten. Dann verschwinden die Brüche und du löst wie gewohnt.',
    tip: 'Mit dem Hauptnenner multiplizieren – auch die Terme ohne Bruch!',
    gen: (r) => {
      if (r.bool()) {
        const a = r.int(2, 6), b = r.nz(-9, 9), y = r.int(-6, 8);
        const x = a * y;
        const c = y + b;
        return {
          prompt: `Löse die Gleichung: $x/${a} ${op(b)} = ${c}$`,
          answer: sol(Q.of(x)),
          steps: [{ m: `x ${op(a * b)} = ${a * c}`, why: act(`· ${a} (jeden Term!)`) }, { m: `x = ${x}`, why: act(a * b > 0 ? `− ${a * b}` : `+ ${-a * b}`) }],
          misconceptions: only(Q.of(x), [{ value: Q.of(a * c - b), msg: `Beim Multiplizieren mit ${a} muss JEDER Term mitmultipliziert werden – auch die ${Math.abs(b)}.` }]),
        };
      }
      let a = 0, b = 0;
      do { a = r.int(2, 6); b = r.int(2, 6); } while (a === b);
      const L = lcm(a, b);
      const x = L * r.nz(-4, 4);
      const c = Q.of(x, a).add(Q.of(x, b));
      return {
        prompt: `Löse die Gleichung: $x/${a} + x/${b} = ${fq(c)}$`,
        answer: sol(Q.of(x)),
        steps: [
          { m: `${L / a}x + ${L / b}x = ${fq(c.mul(Q.of(L)))}`, why: act(`· ${L} (Hauptnenner)`) },
          { m: `${L / a + L / b}x = ${fq(c.mul(Q.of(L)))}` },
          { m: `x = ${x}`, why: act(`: ${L / a + L / b}`) },
        ],
        misconceptions: only(Q.of(x), [{ value: c.mul(Q.of(a + b)), msg: 'x/a + x/b ist nicht x/(a+b). Multipliziere mit dem Hauptnenner.' }]),
      };
    },
  },
  {
    id: 'L8', title: 'Textaufgaben mit Gleichungen', area: 'Gleichungen', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.1.A.4.j', prereqs: ['L5'],
    intro: '1. Was ist gesucht? Das wird x. 2. Alle anderen Grössen mit x ausdrücken. 3. Gleichung aufstellen. 4. Lösen. 5. Kontrolle im Text: Passt die Antwort?',
    tip: 'Schreibe zuerst auf: «x = …». Dann übersetze jeden Satz in einen Term.',
    gen: textTask,
  },
  {
    id: 'L9', title: 'Formeln umstellen', area: 'Gleichungen', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.3.C.3.g', prereqs: ['L4', 'B10'],
    intro: 'Formeln umstellen funktioniert wie Gleichungen lösen – nur sind die «Zahlen» Buchstaben. Die gesuchte Grösse wird isoliert, alle anderen Grössen behandelst du wie Zahlen.',
    tip: 'Tu so, als wären alle anderen Buchstaben Zahlen. Welche Umkehroperationen brauchst du?',
    gen: (r) => {
      const f = r.pick([
        { f: 'A = g · h/2', t: 'h', v: '2A/g', ctx: 'Dreiecksfläche', steps: [{ m: '2A = g · h', why: act('· 2') }, { m: 'h = 2A/g', why: act(': g') }], mis: 'A/(2g)' },
        { f: 'U = 2a + 2b', t: 'a', v: '(U - 2b)/2', ctx: 'Rechtecksumfang', steps: [{ m: 'U - 2b = 2a', why: act('− 2b') }, { m: 'a = (U - 2b)/2', why: act(': 2') }], mis: 'U/2 - 2b' },
        { f: 'v = s/t', t: 't', v: 's/v', ctx: 'Geschwindigkeit', steps: [{ m: 'v · t = s', why: act('· t') }, { m: 't = s/v', why: act(': v') }], mis: 's · v' },
        { f: 'F = m · a', t: 'm', v: 'F/a', ctx: 'Kraft', steps: [{ m: 'm = F/a', why: act(': a') }], mis: 'F - a' },
        { f: 'P = U · I', t: 'I', v: 'P/U', ctx: 'elektrische Leistung', steps: [{ m: 'I = P/U', why: act(': U') }], mis: 'U/P' },
        { f: 'V = a · b · c', t: 'c', v: 'V/(a · b)', ctx: 'Quadervolumen', steps: [{ m: 'c = V/(a · b)', why: act(': (a · b)') }], mis: 'V/a · b' },
        { f: 'y = m · x + q', t: 'x', v: '(y - q)/m', ctx: 'Geradengleichung', steps: [{ m: 'y - q = m · x', why: act('− q') }, { m: 'x = (y - q)/m', why: act(': m') }], mis: 'y/m - q' },
      ]);
      return {
        prompt: `Stelle die Formel (${f.ctx}) $${f.f}$ nach $${f.t}$ um.`,
        answer: { kind: 'formula', variable: f.t, value: f.v },
        inputHint: `als ${f.t} = …`,
        steps: f.steps,
        misconceptions: [{ value: f.mis, msg: 'Prüfe die Umkehroperationen und ihre Reihenfolge (zuerst + / −, dann · / :).' }],
      };
    },
  },
];
