// Funktionen und Daten/Zufall
import { Q, gcd } from '../math/rational';
import type { Skill } from './types';
import { dec, lin, p } from './fmt';

const q = (n: number, d = 1) => Q.of(n, d);
const num = (v: Q, unit?: string) => ({ kind: 'number' as const, value: v, unit });

export const funktionen: Skill[] = [
  {
    id: 'N1', title: 'Zahlenfolgen fortsetzen', area: 'Funktionen', stage: 'Primar', niveau: 'alle', lp21: 'MA.3.A.3.c', prereqs: ['Z4', 'G2'],
    intro: 'Bei einer Zahlenfolge suchst du die Regel. Schau dir die Differenzen an: Sind sie gleich (z. B. immer +9), ist die Folge linear. Wachsen die Differenzen gleichmässig (1, 3, 5, 7 …), entstehen z. B. Quadratzahlen.',
    tip: 'Bilde die Differenzen zwischen benachbarten Zahlen.',
    gen: (r) => {
      const v = r.int(0, 2);
      let seq: number[];
      let rule: string;
      if (v === 0) { const a = r.int(-20, 50), d = r.nz(-12, 15); seq = [0, 1, 2, 3, 4].map((i) => a + i * d); rule = `immer ${d > 0 ? '+' : '−'} ${Math.abs(d)}`; }
      else if (v === 1) { const s = r.int(1, 6); seq = [0, 1, 2, 3, 4].map((i) => (s + i) ** 2); rule = 'Quadratzahlen'; }
      else { const s = r.int(1, 4); seq = [0, 1, 2, 3, 4].map((i) => ((s + i) * (s + i + 1)) / 2); rule = 'Differenzen wachsen um 1'; }
      const diffs = seq.slice(1).map((x, i) => x - seq[i]);
      const next = v === 0 ? seq[4] + diffs[0] : v === 1 ? (Math.sqrt(seq[4]) + 1) ** 2 : seq[4] + diffs[3] + 1;
      return {
        prompt: `Setze die Folge fort: ${seq.slice(0, 4).join(', ')}, ${seq[4]}, …`, answer: num(q(next)),
        steps: [{ m: `Differenzen: ${diffs.join(', ')}`, why: rule }, { m: `${next}` }],
        misconceptions: v > 0 ? [{ value: q(seq[4] + diffs[3]), msg: 'Die Differenzen sind nicht gleich – sie wachsen.' }] : [],
      };
    },
  },
  {
    id: 'N2', title: 'Wertetabellen (proportional)', area: 'Funktionen', stage: 'Primar', niveau: 'alle', lp21: 'MA.3.A.3.d', prereqs: ['R1'],
    intro: 'In einer proportionalen Wertetabelle wird die zweite Grösse immer mit derselben Zahl multipliziert (z. B. 1 kg → 5.40 Fr.). Diese Zahl heisst Proportionalitätsfaktor.',
    tip: 'Finde den Faktor: zweite Zahl durch erste Zahl.',
    gen: (r) => {
      const f = q(r.int(12, 95), 10);
      const xs = r.shuffle([1, 2, 3, 4, 5, 6, 8, 10]).slice(0, 3).sort((a, b) => a - b);
      const target = r.pick([7, 9, 12, 15, 20].filter((t) => !xs.includes(t)));
      return {
        prompt: `Ergänze die Tabelle (proportional): ${xs.map((x) => `${x} kg → ${dec(f.mul(q(x)))} Fr.`).join('; ')}; ${target} kg → ? Fr.`,
        answer: { kind: 'number', value: f.mul(q(target)), form: 'decimal', unit: 'Fr.' },
        steps: [{ m: `${dec(f.mul(q(xs[0])))} : ${xs[0]} = ${dec(f)}`, why: 'Preis pro kg' }, { m: `${dec(f)} · ${target} = ${dec(f.mul(q(target)))}` }],
      };
    },
  },
  {
    id: 'N3', title: 'Funktionswerte berechnen', area: 'Funktionen', stage: 'Sek 2', niveau: 'alle', lp21: 'MA.3.A.3.i', prereqs: ['T1'],
    intro: 'Eine Funktionsgleichung wie y = 2x + 1 ordnet jedem x genau ein y zu. Für x = 7 setzt du ein: y = 2 · 7 + 1 = 15.',
    tip: 'x einsetzen – negative Zahlen in Klammern.',
    gen: (r) => {
      const m = r.nz(-5, 5), b = r.int(-9, 9), x = r.int(-6, 8);
      const y = m * x + b;
      return {
        prompt: `Gegeben ist $y = ${lin([[m, 'x'], [b, '']])}$. Berechne y für $x = ${x}$.`, answer: num(q(y)),
        steps: [{ m: `y = ${m} · ${p(x)} ${b < 0 ? '-' : '+'} ${Math.abs(b)}` }, { m: `y = ${y}` }],
        misconceptions: m * -x + b !== y ? [{ value: q(m * -x + b), msg: 'Achte auf das Vorzeichen beim Einsetzen.' }] : [],
      };
    },
  },
  {
    id: 'N4', title: 'Graphen ablesen', area: 'Funktionen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.A.3.g', prereqs: ['F13'],
    intro: 'Um einen Funktionswert abzulesen, gehst du beim gegebenen x senkrecht bis zum Graphen und dann waagrecht zur y-Achse.',
    tip: 'Von x aus senkrecht zum Graphen, dann waagrecht zur y-Achse.',
    gen: (r) => {
      const m = r.pick([-2, -1, 1, 2, 0.5, -0.5]), b = r.int(-3, 3);
      let x = r.int(-4, 4);
      if (!Number.isInteger(m * x)) x += 1;
      const y = m * x + b;
      if (Math.abs(y) > 6) return { prompt: `Lies am Graphen ab: Welchen y-Wert hat die Gerade bei $x = 0$?`, visual: { type: 'coords', r: 6, lines: [{ m, q: b }] }, answer: num(q(b)), steps: [{ m: `y = ${b}`, why: 'Schnittpunkt mit der y-Achse' }] };
      return {
        prompt: `Lies am Graphen ab: Welchen y-Wert hat die Gerade bei $x = ${x}$?`, visual: { type: 'coords', r: 6, lines: [{ m, q: b }] },
        answer: num(Q.fromDecimal(String(y))),
        steps: [{ m: `x = ${x}`, why: 'senkrecht zum Graphen' }, { m: `y = ${y}`, why: 'waagrecht zur y-Achse' }],
        misconceptions: y !== x ? [{ value: q(x), msg: 'Das ist der x-Wert. Gesucht ist der zugehörige y-Wert.' }] : [],
      };
    },
  },
  {
    id: 'N5', title: 'Steigung und y-Achsenabschnitt', area: 'Funktionen', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.3.A.3.k', prereqs: ['N3', 'N4', 'B12'],
    intro: 'Bei y = m · x + q ist m die Steigung (um wie viel y wächst, wenn x um 1 wächst) und q der y-Achsenabschnitt (y bei x = 0). Aus zwei Punkten: m = (y₂ − y₁) : (x₂ − x₁).',
    tip: 'Steigung = Höhenunterschied : waagrechter Unterschied.',
    gen: (r) => {
      const m = q(r.nz(-6, 6), r.pick([1, 1, 2])), b = r.int(-8, 8);
      const x1 = r.int(-4, 2), x2 = x1 + r.pick([2, 4]);
      const y1 = m.mul(q(x1)).add(q(b)), y2 = m.mul(q(x2)).add(q(b));
      if (r.bool()) return {
        prompt: `Eine Gerade geht durch $P(${x1}|${dec(y1)})$ und $Q(${x2}|${dec(y2)})$. Berechne die Steigung m.`,
        answer: num(m), inputHint: 'Bruch oder Dezimalzahl',
        steps: [{ m: `m = (${dec(y2)} - ${p(y1)}) : (${x2} - ${p(x1)})` }, { m: `m = ${dec(y2.sub(y1))} : ${x2 - x1} = ${m.toString()}` }],
        misconceptions: [{ value: q(x2 - x1).div(y2.sub(y1).isZero() ? q(1) : y2.sub(y1)), msg: 'Umgekehrt: y-Unterschied durch x-Unterschied.' }].filter((mm) => !mm.value.eq(m)),
      };
      return {
        prompt: `Eine Gerade hat die Steigung $m = ${m.toString()}$ und geht durch $P(${x1}|${dec(y1)})$. Wie gross ist der y-Achsenabschnitt q?`,
        answer: num(q(b)),
        steps: [{ m: `${dec(y1)} = ${m.toString()} · ${p(x1)} + q` }, { m: `q = ${b}` }],
      };
    },
  },
  {
    id: 'N6', title: 'Nullstelle einer linearen Funktion', area: 'Funktionen', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.3.A.3.k', prereqs: ['N3', 'L4'],
    intro: 'Die Nullstelle ist das x, bei dem der Graph die x-Achse schneidet – also y = 0. Setze y = 0 und löse die Gleichung nach x auf.',
    tip: 'y = 0 setzen und nach x auflösen.',
    gen: (r) => {
      const m = r.nz(-6, 6), x0 = q(r.int(-8, 8), r.pick([1, 1, 2]));
      const b = q(-m).mul(x0);
      if (!b.isInt()) return { prompt: `Bestimme die Nullstelle von $y = ${m}x$.`, answer: { kind: 'solution', variable: 'x', value: q(0) }, steps: [{ m: `0 = ${m}x` }, { m: 'x = 0' }] };
      return {
        prompt: `Bestimme die Nullstelle von $y = ${lin([[m, 'x'], [b, '']])}$.`, answer: { kind: 'solution', variable: 'x', value: x0 },
        steps: [{ m: `0 = ${lin([[m, 'x'], [b, '']])}`, why: 'y = 0 setzen' }, { m: `${m}x = ${b.neg().toString()}` }, { m: `x = ${x0.toString()}` }],
        misconceptions: !b.isZero() ? [{ value: b, msg: 'Das ist der y-Achsenabschnitt. Die Nullstelle ist dort, wo y = 0 ist.' }].filter((mm) => !mm.value.eq(x0)) : [],
      };
    },
  },
  {
    id: 'N7', title: 'Schnittpunkt zweier Geraden', area: 'Funktionen', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.3.A.3.j', prereqs: ['N3', 'L5'],
    intro: 'Im Schnittpunkt haben beide Geraden denselben y-Wert. Setze die Terme gleich: m₁x + q₁ = m₂x + q₂, löse nach x und berechne dann y.',
    tip: 'Rechte Seiten gleichsetzen, x berechnen, x in eine Gleichung einsetzen.',
    gen: (r) => {
      let m1 = 0, m2 = 0;
      do { m1 = r.nz(-4, 4); m2 = r.nz(-4, 4); } while (m1 === m2);
      const x = r.int(-4, 4), y = r.int(-5, 5);
      const q1 = y - m1 * x, q2 = y - m2 * x;
      return {
        prompt: `Bestimme den Schnittpunkt der Geraden $y = ${lin([[m1, 'x'], [q1, '']])}$ und $y = ${lin([[m2, 'x'], [q2, '']])}$.`,
        answer: { kind: 'point', x: q(x), y: q(y) }, inputHint: 'als (x|y)',
        steps: [{ m: `${lin([[m1, 'x'], [q1, '']])} = ${lin([[m2, 'x'], [q2, '']])}`, why: 'gleichsetzen' }, { m: `${lin([[m1 - m2, 'x']])} = ${q2 - q1}` }, { m: `x = ${x}` }, { m: `y = ${m1} · ${p(x)} ${q1 < 0 ? '-' : '+'} ${Math.abs(q1)} = ${y}` }],
      };
    },
  },
  {
    id: 'N8', title: 'Lineare Zusammenhänge im Alltag', area: 'Funktionen', stage: 'Sek 2', niveau: 'alle', lp21: 'MA.3.C.2.f', prereqs: ['N3', 'D6'],
    intro: 'Viele Preise setzen sich aus einem festen Grundbetrag und einem Betrag pro Einheit zusammen, z. B. Taxi: Preis = Grundtaxe + Preis pro km · Anzahl km. Das ist eine lineare Funktion.',
    tip: 'Grundbetrag + Betrag pro Einheit · Anzahl.',
    gen: (r) => {
      const g = q(r.int(6, 15)), k = q(r.int(25, 45), 10), km = r.int(2, 25);
      const res = g.add(k.mul(q(km)));
      return {
        prompt: `Ein Taxi kostet ${dec(g)} Fr. Grundtaxe plus ${dec(k)} Fr. pro km. Wie viel kostet eine Fahrt von ${km} km?`,
        answer: { kind: 'number', value: res, form: 'decimal', unit: 'Fr.' },
        steps: [{ m: `Preis = ${dec(g)} + ${dec(k)} · ${km}` }, { m: `${dec(g)} + ${dec(k.mul(q(km)))} = ${dec(res)}` }],
        misconceptions: [{ value: g.add(k).mul(q(km)), msg: 'Die Grundtaxe zahlt man nur einmal, nicht pro km.' }, { value: k.mul(q(km)), msg: 'Die Grundtaxe fehlt noch.' }],
      };
    },
  },
];

export const daten: Skill[] = [
  {
    id: 'W1', title: 'Arithmetisches Mittel', area: 'Daten', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.A.1.j', prereqs: ['G4', 'D4'],
    intro: 'Das arithmetische Mittel (Durchschnitt) erhältst du, indem du alle Werte addierst und durch die Anzahl der Werte teilst.',
    tip: 'Summe durch Anzahl.',
    gen: (r) => {
      const n = r.int(4, 7);
      const vals = Array.from({ length: n }, () => r.int(1, 30));
      const s = vals.reduce((a, b) => a + b, 0);
      if (r.bool(0.35)) {
        const mean = r.int(10, 20); const k = n - 1; const known = vals.slice(0, k); const missing = mean * n - known.reduce((a, b) => a + b, 0);
        if (missing > 0) return { prompt: `Der Durchschnitt von ${n} Zahlen ist ${mean}. ${k} davon sind ${known.join(', ')}. Wie heisst die fehlende Zahl?`, answer: num(q(missing)), steps: [{ m: `${mean} · ${n} = ${mean * n}`, why: 'Summe aller Zahlen' }, { m: `${mean * n} - ${known.reduce((a, b) => a + b, 0)} = ${missing}` }] };
      }
      return {
        prompt: `Berechne den Durchschnitt (arithmetisches Mittel): ${vals.join(', ')}`, answer: { kind: 'number', value: q(s, n), form: 'any' },
        inputHint: 'Bruch oder Dezimalzahl',
        steps: [{ m: `${vals.join(' + ')} = ${s}` }, { m: `${s} : ${n} = ${q(s, n).toString()}` }],
        misconceptions: [{ value: q(s), msg: 'Die Summe muss noch durch die Anzahl der Werte geteilt werden.' }],
      };
    },
  },
  {
    id: 'W2', title: 'Absolute und relative Häufigkeit', area: 'Daten', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.3.A.1.k', prereqs: ['R5'],
    intro: 'Die absolute Häufigkeit zählt, wie oft etwas vorkommt. Die relative Häufigkeit ist der Anteil: absolute Häufigkeit : Gesamtzahl (oft in %).',
    tip: 'Relativ = Anzahl : Gesamtzahl.',
    gen: (r) => {
      const total = r.pick([20, 25, 40, 50, 80, 100, 200]);
      const k = r.int(1, total / 2);
      const rel = q(k, total).mul(q(100));
      return {
        prompt: `Bei ${total} Würfen mit einem Reissnagel landete er ${k}-mal mit der Spitze nach oben. Wie gross ist die relative Häufigkeit in Prozent?`,
        answer: { kind: 'number', value: rel, form: 'decimal', unit: '%' },
        steps: [{ m: `${k} : ${total} = ${dec(q(k, total))}` }, { m: `${dec(rel)} %` }],
        misconceptions: [{ value: q(k, total), msg: 'Das ist der Anteil als Dezimalzahl. In Prozent: mal 100.' }].filter((m) => !m.value.eq(rel)),
      };
    },
  },
  {
    id: 'W3', title: 'Wahrscheinlichkeit (Laplace)', area: 'Daten', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.3.A.1.k', prereqs: ['B3'],
    intro: 'Sind alle Ergebnisse gleich wahrscheinlich (Würfel, Münze, Lose), gilt: Wahrscheinlichkeit = Anzahl günstige Ergebnisse : Anzahl mögliche Ergebnisse.',
    tip: 'Günstige durch mögliche Ergebnisse – als gekürzter Bruch.',
    gen: (r) => {
      if (r.bool()) {
        const ev = r.pick([
          { t: 'eine gerade Zahl', k: 3 }, { t: 'eine Zahl grösser als 4', k: 2 }, { t: 'eine 6', k: 1 }, { t: 'eine Primzahl', k: 3 }, { t: 'höchstens eine 2', k: 2 }, { t: 'eine Zahl kleiner als 5', k: 4 },
        ]);
        return { prompt: `Du würfelst einmal mit einem normalen Würfel. Wie gross ist die Wahrscheinlichkeit für ${ev.t}?`, answer: { kind: 'number', value: q(ev.k, 6), form: 'reduced' }, inputHint: 'als gekürzter Bruch', steps: [{ m: `${ev.k} günstige von 6 möglichen` }, { m: `${ev.k}/6 = ${q(ev.k, 6).toString()}` }], misconceptions: [{ value: q(ev.k, 6 - ev.k), msg: 'Im Nenner stehen ALLE möglichen Ergebnisse (6), nicht nur die ungünstigen.' }].filter((m) => !m.value.eq(q(ev.k, 6))) };
      }
      const red = r.int(1, 9), blue = r.int(1, 9), green = r.int(0, 6);
      const tot = red + blue + green;
      return {
        prompt: `In einer Urne liegen ${red} rote, ${blue} blaue und ${green} grüne Kugeln. Du ziehst eine Kugel. Wie gross ist die Wahrscheinlichkeit für eine rote Kugel?`,
        answer: { kind: 'number', value: q(red, tot), form: 'reduced' }, inputHint: 'als gekürzter Bruch',
        steps: [{ m: `${red} günstige von ${tot} möglichen` }, { m: `${red}/${tot}${gcd(red, tot) > 1 ? ' = ' + q(red, tot).toString() : ''}` }],
        misconceptions: [{ value: q(red, tot - red), msg: 'Im Nenner steht die Anzahl ALLER Kugeln.' }].filter((m) => !m.value.eq(q(red, tot))),
      };
    },
  },
  {
    id: 'W4', title: 'Kombinatorik: Möglichkeiten zählen', area: 'Daten', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.B.2.d', prereqs: ['G2'],
    intro: 'Bei Anordnungen hilft das Zählprinzip: Für den 1. Platz gibt es n Möglichkeiten, für den 2. noch n − 1 usw. 3 Personen anordnen: 3 · 2 · 1 = 6. Bei Händeschütteln zählt jedes Paar nur einmal.',
    tip: 'Mögliche Wahlen pro Schritt multiplizieren. Paare: n · (n − 1) : 2.',
    gen: (r) => {
      const v = r.int(0, 2);
      if (v === 0) { const n = r.int(3, 6); const f = [1, 1, 2, 6, 24, 120, 720][n]; return { prompt: `Wie viele verschiedene Reihenfolgen gibt es, wenn sich ${n} Personen in eine Reihe stellen?`, answer: num(q(f)), steps: [{ m: Array.from({ length: n }, (_, i) => n - i).join(' · ') }, { m: `${f}` }], misconceptions: [{ value: q(n * n), msg: 'Für jeden weiteren Platz gibt es eine Möglichkeit weniger: n · (n − 1) · …' }].filter((m) => !m.value.eq(q(f))) }; }
      if (v === 1) { const n = r.int(4, 12); return { prompt: `${n} Personen geben sich gegenseitig je einmal die Hand. Wie viele Händedrücke gibt es?`, answer: num(q((n * (n - 1)) / 2)), steps: [{ m: `${n} · ${n - 1} = ${n * (n - 1)}`, why: 'Jede Person mit jeder anderen' }, { m: `${n * (n - 1)} : 2 = ${(n * (n - 1)) / 2}`, why: 'Jedes Paar wurde doppelt gezählt' }], misconceptions: [{ value: q(n * (n - 1)), msg: 'Jeder Händedruck wurde doppelt gezählt (A–B und B–A). Durch 2 teilen.' }] }; }
      const a = r.int(2, 5), b = r.int(2, 5), c = r.int(2, 4);
      return { prompt: `Ein Menü besteht aus Vorspeise, Hauptgang und Dessert. Es gibt ${a} Vorspeisen, ${b} Hauptgänge und ${c} Desserts. Wie viele verschiedene Menüs sind möglich?`, answer: num(q(a * b * c)), steps: [{ m: `${a} · ${b} · ${c} = ${a * b * c}`, why: 'Zählprinzip: multiplizieren' }], misconceptions: [{ value: q(a + b + c), msg: 'Jede Vorspeise lässt sich mit jedem Hauptgang kombinieren: multiplizieren, nicht addieren.' }] };
    },
  },
  {
    id: 'W5', title: 'Zweistufige Zufallsexperimente', area: 'Daten', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.3.C.1.i', prereqs: ['W3', 'B8'],
    intro: 'Bei mehrstufigen Experimenten hilft ein Baumdiagramm. Entlang eines Pfades werden die Wahrscheinlichkeiten multipliziert. Zweimal Kopf mit einer Münze: 1/2 · 1/2 = 1/4.',
    tip: 'Pfadregel: entlang des Pfades multiplizieren.',
    gen: (r) => {
      if (r.bool()) {
        const k = r.int(2, 3);
        return { prompt: `Eine Münze wird ${k}-mal geworfen. Wie gross ist die Wahrscheinlichkeit, jedes Mal Kopf zu werfen?`, answer: { kind: 'number', value: q(1, 2 ** k), form: 'reduced' }, steps: [{ m: Array(k).fill('1/2').join(' · ') }, { m: `1/${2 ** k}` }], misconceptions: [{ value: q(1, 2 * k), msg: 'Die Wahrscheinlichkeiten werden multipliziert, nicht addiert.' }].filter((m) => !m.value.eq(q(1, 2 ** k))) };
      }
      const red = r.int(2, 6), blue = r.int(2, 6), tot = red + blue;
      const res = q(red, tot).mul(q(red - 1, tot - 1));
      return {
        prompt: `In einer Urne liegen ${red} rote und ${blue} blaue Kugeln. Du ziehst zwei Kugeln ohne Zurücklegen. Wie gross ist die Wahrscheinlichkeit, zwei rote zu ziehen?`,
        answer: { kind: 'number', value: res, form: 'reduced' }, inputHint: 'als gekürzter Bruch',
        steps: [{ m: `${red}/${tot} · ${red - 1}/${tot - 1}`, why: 'Ohne Zurücklegen: beim 2. Zug eine Kugel weniger' }, { m: res.toString() }],
        misconceptions: [{ value: q(red * red, tot * tot), msg: 'Ohne Zurücklegen: Beim zweiten Zug ist eine rote Kugel weniger drin – und insgesamt eine weniger.' }],
      };
    },
  },
];
