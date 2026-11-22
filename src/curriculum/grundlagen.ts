import { Q, gcd, lcm } from '../math/rational';
import type { Skill } from './types';
import { p } from './fmt';

const N = (v: number) => Q.of(v);

export const grundlagen: Skill[] = [
  {
    id: 'G1', title: 'Plus und Minus', area: 'Grundlagen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.d', prereqs: ['Z4'],
    intro: 'Beim Addieren zählst du Mengen zusammen, beim Subtrahieren nimmst du weg. Bei grösseren Zahlen rechnest du stellenweise: Einer, Zehner, Hunderter.',
    tip: 'Zerlege eine Zahl: 47 + 38 = 47 + 30 + 8.',
    gen: (r) => {
      const a = r.int(12, 480), b = r.int(8, 300);
      const add = r.bool();
      const [x, y] = add || a >= b ? [a, b] : [b, a];
      const op = add ? '+' : '-';
      // Zweite Zahl in Hunderter, Zehner, Einer zerlegen und schrittweise verrechnen
      const parts = [Math.floor(y / 100) * 100, Math.floor((y % 100) / 10) * 10, y % 10].filter((v) => v > 0);
      const steps = [];
      if (parts.length > 1) {
        steps.push({ m: `${x} ${op} ${parts.join(` ${op} `)}`, why: 'Zweite Zahl zerlegen' });
        let acc = x;
        for (let i = 0; i < parts.length - 1; i++) {
          acc = add ? acc + parts[i] : acc - parts[i];
          steps.push({ m: [acc, ...parts.slice(i + 1)].join(` ${op} `) });
        }
      }
      steps.push({ m: `${add ? x + y : x - y}` });
      return { prompt: `Berechne $${x} ${op} ${y}$.`, answer: { kind: 'number', value: N(add ? x + y : x - y), form: 'integer' }, steps };
    },
  },
  {
    id: 'G2', title: 'Einmaleins', area: 'Grundlagen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.d', prereqs: ['Z5'],
    intro: 'Multiplizieren heisst: gleiche Summanden zusammenfassen. 4 · 7 = 7 + 7 + 7 + 7. Das kleine Einmaleins solltest du auswendig und schnell können – alles Weitere baut darauf auf.',
    tip: 'Nutze Nachbaraufgaben: 7 · 8 = 7 · 7 + 7.',
    gen: (r) => {
      const a = r.int(2, 10), b = r.int(2, 10);
      return {
        prompt: `Berechne $${a} · ${b}$.`, answer: { kind: 'number', value: N(a * b), form: 'integer' },
        steps: [{ m: `${a} · ${b}`, why: `${a}-mal die ${b}` }, { m: `${a * b}` }],
        misconceptions: a + b !== a * b ? [{ value: N(a + b), msg: 'Du hast addiert statt multipliziert.' }] : [],
      };
    },
  },
  {
    id: 'G3', title: 'Mehrstellig multiplizieren', area: 'Grundlagen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.e', prereqs: ['G2'],
    intro: 'Zerlege die grössere Zahl in Zehner und Einer und multipliziere beide Teile einzeln. Danach zählst du die Teilergebnisse zusammen.',
    tip: '23 · 7 = 20 · 7 + 3 · 7',
    gen: (r) => {
      const a = r.int(1, 9) * 10 + r.int(1, 9), b = r.int(3, 9);
      const t = Math.floor(a / 10) * 10, e = a % 10;
      return {
        prompt: `Berechne $${a} · ${b}$.`, answer: { kind: 'number', value: N(a * b), form: 'integer' },
        steps: [
          { m: `${t} · ${b} + ${e} · ${b}`, why: `${a} in ${t} und ${e} zerlegen` },
          { m: `${t * b} + ${e * b}` }, { m: `${a * b}` },
        ],
        misconceptions: [{ value: N(t * b + e), msg: `Du hast nur die Zehner mit ${b} multipliziert. Auch die Einer müssen mal ${b} gerechnet werden.` }],
      };
    },
  },
  {
    id: 'G4', title: 'Dividieren', area: 'Grundlagen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.e', prereqs: ['G2'],
    intro: 'Dividieren ist die Umkehrung des Multiplizierens. 56 : 8 fragt: Wie oft passt 8 in 56? Oder: Welche Zahl mal 8 ergibt 56?',
    tip: 'Suche im Einmaleins: ? · 8 = 56.',
    gen: (r) => {
      const b = r.int(2, 12), q = r.int(2, 25);
      const a = b * q;
      return {
        prompt: `Berechne $${a} : ${b}$.`, answer: { kind: 'number', value: N(q), form: 'integer' },
        steps: [{ m: `${a} : ${b}`, why: `Welche Zahl mal ${b} ergibt ${a}?` }, { m: `${q}`, why: `Kontrolle: ${q} · ${b} = ${a}` }],
      };
    },
  },
  {
    id: 'G5', title: 'Teilbarkeit', area: 'Grundlagen', stage: 'Primar', niveau: 'erweitert', lp21: 'MA.1.A.4.h', prereqs: ['G4'],
    intro: 'Eine Zahl ist durch eine andere teilbar, wenn die Division ohne Rest aufgeht. Regeln: durch 2 (letzte Ziffer gerade), durch 5 (endet auf 0 oder 5), durch 3 bzw. 9 (Quersumme durch 3 bzw. 9 teilbar), durch 10 (endet auf 0).',
    tip: 'Quersumme bilden: 1+2+6 = 9.',
    gen: (r) => {
      const k = r.pick([2, 3, 4, 5, 6, 9, 10]);
      const yes = r.bool();
      let n = k * r.int(4, 60);
      if (!yes) n += r.int(1, k - 1);
      const qs = String(n).split('').reduce((s, d) => s + Number(d), 0);
      const reason: Record<number, string> = {
        2: `Letzte Ziffer ${n % 10} ist ${n % 2 === 0 ? '' : 'nicht '}gerade`,
        3: `Quersumme ${qs} ist ${qs % 3 === 0 ? '' : 'nicht '}durch 3 teilbar`,
        4: `Die letzten zwei Ziffern ${n % 100} sind ${(n % 100) % 4 === 0 ? '' : 'nicht '}durch 4 teilbar`,
        5: `Letzte Ziffer ist ${n % 5 === 0 ? '' : 'nicht '}0 oder 5`,
        6: `Durch 6 heisst: durch 2 und durch 3 (Quersumme ${qs})`,
        9: `Quersumme ${qs} ist ${qs % 9 === 0 ? '' : 'nicht '}durch 9 teilbar`,
        10: `Letzte Ziffer ist ${n % 10 === 0 ? '' : 'nicht '}0`,
      };
      return {
        prompt: `Ist $${n}$ durch $${k}$ teilbar?`,
        answer: { kind: 'choice', options: ['Ja', 'Nein'], correct: n % k === 0 ? 0 : 1 },
        steps: [{ m: `${n} : ${k}`, why: reason[k] }, { m: n % k === 0 ? `${n / k}` : `${Math.floor(n / k)} Rest ${n % k}`, why: n % k === 0 ? 'Geht auf → teilbar' : 'Rest → nicht teilbar' }],
      };
    },
  },
  {
    id: 'G6', title: 'Grösster gemeinsamer Teiler (ggT)', area: 'Grundlagen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.i', prereqs: ['G5'],
    intro: 'Der ggT ist die grösste Zahl, die beide Zahlen ohne Rest teilt. Du brauchst ihn zum Kürzen von Brüchen.',
    tip: 'Schreibe die Teiler der kleineren Zahl auf und prüfe von gross nach klein.',
    gen: (r) => {
      const g = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 12]);
      let a = 0, b = 0;
      do { a = g * r.int(2, 9); b = g * r.int(2, 9); } while (a === b || gcd(a, b) !== g || a > 100 || b > 100);
      const divs = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0).join(', ');
      return {
        prompt: `Bestimme den ggT von $${a}$ und $${b}$.`, answer: { kind: 'number', value: N(g), form: 'integer' },
        steps: [
          { m: `T(${a}) = {${divs(a)}}`, why: `Teiler von ${a}` },
          { m: `T(${b}) = {${divs(b)}}`, why: `Teiler von ${b}` },
          { m: `ggT = ${g}`, why: 'Grösste Zahl, die in beiden Listen vorkommt' },
        ],
        misconceptions: [
          { value: N(lcm(a, b)), msg: 'Das ist das kleinste gemeinsame Vielfache (kgV). Gesucht ist der grösste gemeinsame TEILER.' },
          { value: N(a * b), msg: 'Das Produkt ist ein Vielfaches, kein Teiler. Der ggT ist höchstens so gross wie die kleinere Zahl.' },
        ],
      };
    },
  },
  {
    id: 'G7', title: 'Kleinstes gemeinsames Vielfaches (kgV)', area: 'Grundlagen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.i', prereqs: ['G5'],
    intro: 'Das kgV ist die kleinste Zahl, die in beiden Einmaleins-Reihen vorkommt. Du brauchst es für den Hauptnenner beim Addieren von Brüchen.',
    tip: 'Gehe die Vielfachen der grösseren Zahl durch, bis eines durch die kleinere teilbar ist.',
    gen: (r) => {
      let a = 0, b = 0;
      do { a = r.int(2, 15); b = r.int(2, 15); } while (a === b || lcm(a, b) > 120 || a % b === 0 || b % a === 0);
      const big = Math.max(a, b), small = Math.min(a, b);
      const l = lcm(a, b);
      const mult = [] as number[];
      for (let m = big; m <= l; m += big) mult.push(m);
      return {
        prompt: `Bestimme das kgV von $${a}$ und $${b}$.`, answer: { kind: 'number', value: N(l), form: 'integer' },
        steps: [
          { m: `V(${big}) = {${mult.join(', ')}, …}`, why: `Vielfache von ${big}` },
          { m: `kgV = ${l}`, why: `Erstes Vielfaches, das auch durch ${small} teilbar ist` },
        ],
        misconceptions: [
          ...(a * b !== l ? [{ value: N(a * b), msg: `${a * b} ist zwar ein gemeinsames Vielfaches, aber nicht das kleinste.` }] : []),
          ...(gcd(a, b) > 1 ? [{ value: N(gcd(a, b)), msg: 'Das ist der ggT. Gesucht ist das kleinste gemeinsame VIELFACHE.' }] : []),
        ],
      };
    },
  },
  {
    id: 'G8', title: 'Negative Zahlen: Plus und Minus', area: 'Grundlagen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.i', prereqs: ['G1'],
    intro: 'Stell dir den Zahlenstrahl vor. Plus heisst nach rechts, Minus nach links. Eine negative Zahl subtrahieren ist dasselbe wie die positive Zahl addieren: 3 − (−5) = 3 + 5.',
    tip: 'Zwei Minus direkt hintereinander werden zu Plus: −(−5) = +5.',
    selfExplain: {
      q: 'Warum ist 3 − (−5) = 8?',
      options: ['Weil man −5 wegnimmt, also Schulden wegnimmt – das ist ein Gewinn von 5.', 'Weil minus mal minus immer minus gibt.', 'Weil man die Zahlen einfach ohne Vorzeichen addiert.'],
      correct: 0,
      why: 'Eine negative Zahl wegnehmen heisst auf dem Zahlenstrahl nach rechts gehen: 3 − (−5) = 3 + 5 = 8.',
    },
    gen: (r) => {
      const a = r.nz(-15, 15), b = r.nz(-15, 15);
      const op = r.pick(['+', '-'] as const);
      const res = op === '+' ? a + b : a - b;
      const simple = op === '+' ? (b < 0 ? `${a} - ${-b}` : `${a} + ${b}`) : (b < 0 ? `${a} + ${-b}` : `${a} - ${b}`);
      const mis = [] as { value: Q; msg: string }[];
      if (op === '-' && b < 0) mis.push({ value: N(a + b), msg: 'Minus eine negative Zahl wird zu Plus: a − (−b) = a + b.' });
      if (res !== 0 && !mis.some((m) => m.value.eq(N(-res)))) mis.push({ value: N(-res), msg: 'Der Betrag stimmt, aber das Vorzeichen nicht. Stell dir den Zahlenstrahl vor.' });
      return {
        prompt: `Berechne $${a} ${op} ${p(b)}$.`, answer: { kind: 'number', value: N(res), form: 'integer' },
        steps: [{ m: simple, why: 'Rechen- und Vorzeichen zusammenfassen' }, { m: `${res}` }],
        misconceptions: mis,
      };
    },
  },
  {
    id: 'G9', title: 'Negative Zahlen: Mal und Durch', area: 'Grundlagen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.i', prereqs: ['G8', 'G4'],
    intro: 'Rechne zuerst mit den Beträgen (ohne Vorzeichen). Dann das Vorzeichen: gleiche Vorzeichen ergeben Plus, verschiedene Vorzeichen ergeben Minus.',
    tip: 'Zähle die Minuszeichen: gerade Anzahl → Plus, ungerade → Minus.',
    gen: (r) => {
      let a = r.nz(-12, 12);
      const b = r.nz(-12, 12);
      if (a > 0 && b > 0 && r.bool(0.7)) a = -a;
      if (r.bool()) {
        const res = a * b;
        return {
          prompt: `Berechne $${p(a)} · ${p(b)}$.`, answer: { kind: 'number', value: N(res), form: 'integer' },
          steps: [{ m: `${Math.abs(a)} · ${Math.abs(b)} = ${Math.abs(res)}`, why: 'Beträge multiplizieren' }, { m: `${res}`, why: (a < 0) === (b < 0) ? 'Gleiche Vorzeichen → Plus' : 'Verschiedene Vorzeichen → Minus' }],
          misconceptions: [{ value: N(-res), msg: 'Der Betrag stimmt, das Vorzeichen nicht. Gleiche Vorzeichen → Plus, verschiedene → Minus.' }],
        };
      }
      const prod = a * b;
      return {
        prompt: `Berechne $${prod} : ${p(b)}$.`, answer: { kind: 'number', value: N(a), form: 'integer' },
        steps: [{ m: `${Math.abs(prod)} : ${Math.abs(b)} = ${Math.abs(a)}`, why: 'Beträge dividieren' }, { m: `${a}`, why: (prod < 0) === (b < 0) ? 'Gleiche Vorzeichen → Plus' : 'Verschiedene Vorzeichen → Minus' }],
        misconceptions: [{ value: N(-a), msg: 'Der Betrag stimmt, das Vorzeichen nicht. Gleiche Vorzeichen → Plus, verschiedene → Minus.' }],
      };
    },
  },
  {
    id: 'G10', title: 'Rechenreihenfolge', area: 'Grundlagen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.4.h', prereqs: ['G3', 'G4'],
    intro: 'Reihenfolge: 1. Klammern, 2. Potenzen, 3. Punktrechnung (· und :), 4. Strichrechnung (+ und −). Gleichrangiges von links nach rechts.',
    tip: 'Markiere zuerst, was Punktrechnung ist.',
    selfExplain: {
      q: 'Warum ist 2 + 3 · 4 = 14 und nicht 20?',
      options: ['Punkt vor Strich: zuerst 3 · 4 = 12, dann 2 + 12.', 'Man rechnet immer von links nach rechts.', 'Weil 3 · 4 grösser ist als 2 + 3.'],
      correct: 0,
      why: '3 · 4 bedeutet «drei Vierer». Diese Gruppe gehört zusammen, deshalb Punkt vor Strich.',
    },
    gen: (r) => {
      const a = r.int(2, 20), b = r.int(2, 9), c = r.int(2, 9);
      const v = r.int(0, 3);
      if (v === 0) return {
        prompt: `Berechne $${a} + ${b} · ${c}$.`, answer: { kind: 'number', value: N(a + b * c), form: 'integer' },
        steps: [{ m: `${a} + ${b * c}`, why: 'Punkt vor Strich' }, { m: `${a + b * c}` }],
        misconceptions: [{ value: N((a + b) * c), msg: 'Du hast von links nach rechts gerechnet. Punkt vor Strich!' }],
      };
      if (v === 1) return {
        prompt: `Berechne $(${a} + ${b}) · ${c}$.`, answer: { kind: 'number', value: N((a + b) * c), form: 'integer' },
        steps: [{ m: `${a + b} · ${c}`, why: 'Klammer zuerst' }, { m: `${(a + b) * c}` }],
        misconceptions: [{ value: N(a + b * c), msg: 'Die Klammer kommt zuerst – sie ist stärker als Punkt vor Strich.' }],
      };
      if (v === 2) {
        const big = b * c + r.int(1, 30);
        return {
          prompt: `Berechne $${big} - ${b * c} : ${c}$.`, answer: { kind: 'number', value: N(big - b), form: 'integer' },
          steps: [{ m: `${big} - ${b}`, why: 'Punkt vor Strich' }, { m: `${big - b}` }],
          misconceptions: (big - b * c) % c === 0 ? [{ value: N((big - b * c) / c), msg: 'Du hast von links nach rechts gerechnet. Die Division kommt vor der Subtraktion.' }] : [],
        };
      }
      return {
        prompt: `Berechne $${a} - ${b} · ${c} + ${c}$.`, answer: { kind: 'number', value: N(a - b * c + c), form: 'integer' },
        steps: [{ m: `${a} - ${b * c} + ${c}`, why: 'Punkt vor Strich' }, { m: `${a - b * c} + ${c}`, why: 'Von links nach rechts' }, { m: `${a - b * c + c}` }],
        misconceptions: [{ value: N(a - (b * c + c)), msg: 'Strichrechnungen werden von links nach rechts gerechnet: zuerst −, dann +.' }],
      };
    },
  },
];
