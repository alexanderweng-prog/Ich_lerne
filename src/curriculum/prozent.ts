// Proportionalität, Prozent, Zins, Massstab (Zyklus 2 bis Sek)
import { Q } from '../math/rational';
import type { Skill } from './types';
import { dec, big } from './fmt';

const D = (q: Q, unit?: string) => ({ kind: 'number' as const, value: q, form: 'decimal' as const, unit });
const Nq = (q: Q, unit?: string) => ({ kind: 'number' as const, value: q, unit });

export const prozent: Skill[] = [
  {
    id: 'R1', title: 'Proportionalität (Dreisatz)', area: 'Prozent', stage: 'Primar', niveau: 'alle', lp21: 'MA.3.A.3.e', prereqs: ['G4', 'D6'],
    intro: 'Proportional heisst: doppelt so viel → doppelt so teuer. Mit dem Dreisatz rechnest du zuerst auf 1 (oder eine passende Zwischengrösse) und dann auf die gesuchte Menge.',
    tip: 'Zuerst auf 1 Stück (oder 100 g) zurückrechnen, dann hochrechnen.',
    gen: (r) => {
      const ctx = r.pick([
        { item: 'g Käse', unit: 'Fr.', base: 100, per: Q.of(r.int(18, 45), 10) },
        { item: 'Liter Benzin', unit: 'Fr.', base: 1, per: Q.of(r.int(165, 199), 100) },
        { item: 'Hefte', unit: 'Fr.', base: 1, per: Q.of(r.int(12, 35), 10) },
      ]);
      const a = ctx.base === 100 ? r.int(2, 6) * 100 : r.int(2, 9);
      let b = ctx.base === 100 ? r.int(2, 9) * 50 : r.int(2, 15);
      if (b === a) b += ctx.base === 100 ? 50 : 1;
      const priceA = ctx.per.mul(Q.of(a)).div(Q.of(ctx.base));
      const res = ctx.per.mul(Q.of(b)).div(Q.of(ctx.base));
      return {
        prompt: `${a} ${ctx.item} kosten ${dec(priceA)} Fr. Wie viel kosten ${b} ${ctx.item}?`, answer: D(res, 'Fr.'),
        steps: [
          { m: `${ctx.base === 100 ? '100' : '1'} → ${dec(ctx.per)}`, why: `${dec(priceA)} : ${a / ctx.base}` },
          { m: `${b} → ${dec(ctx.per)} · ${b / ctx.base} = ${dec(res)}`, why: 'hochrechnen' },
        ],
        misconceptions: [{ value: priceA.add(Q.of(b - a)), msg: 'Proportional heisst multiplizieren, nicht addieren: zuerst auf 1 zurückrechnen.' }].filter((m) => !m.value.eq(res)),
      };
    },
  },
  {
    id: 'R2', title: 'Umgekehrte Proportionalität', area: 'Prozent', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.A.3.g', prereqs: ['R1'],
    intro: 'Umgekehrt proportional heisst: doppelt so viele Personen → halb so viel pro Person. Das Produkt bleibt gleich: 72 Karten für 4 Personen = 18 pro Person; für 6 Personen 12.',
    tip: 'Erst das Ganze berechnen (Produkt), dann neu aufteilen.',
    selfExplain: {
      q: '4 Personen brauchen 6 Tage für eine Arbeit. Warum brauchen 8 Personen nicht 12 Tage?',
      options: ['Mehr Personen schaffen die Arbeit schneller – doppelt so viele brauchen halb so lange.', 'Weil man immer verdoppeln muss.', 'Doch, es sind 12 Tage.'],
      correct: 0,
      why: 'Die Arbeit bleibt gleich gross: 4 · 6 = 24 Personentage. 24 : 8 = 3 Tage.',
    },
    gen: (r) => {
      const total = r.pick([24, 36, 48, 60, 72, 120]);
      const divs = [2, 3, 4, 5, 6, 8, 10, 12].filter((d) => total % d === 0);
      const a = r.pick(divs);
      let b = r.pick(divs);
      while (b === a) b = r.pick(divs);
      if (r.bool()) return {
        prompt: `${total} Spielkarten werden gleichmässig verteilt. Bei ${a} Mitspielenden erhält jede Person ${total / a} Karten. Wie viele Karten erhält jede Person bei ${b} Mitspielenden?`,
        answer: Nq(Q.of(total / b)),
        steps: [{ m: `${a} · ${total / a} = ${total}`, why: 'Gesamtzahl bleibt gleich' }, { m: `${total} : ${b} = ${total / b}` }],
        misconceptions: [{ value: Q.of(total / a).mul(Q.of(b)).div(Q.of(a)), msg: 'Mehr Personen → weniger pro Person. Das ist umgekehrt proportional.' }].filter((m) => !m.value.eq(Q.of(total / b))),
      };
      return {
        prompt: `${a} Personen brauchen für eine Arbeit ${total / a} Stunden. Wie lange brauchen ${b} Personen (gleich schnell arbeitend)?`,
        answer: Nq(Q.of(total / b), 'h'),
        steps: [{ m: `${a} · ${total / a} = ${total}`, why: 'Arbeitsstunden insgesamt' }, { m: `${total} : ${b} = ${total / b}` }],
        misconceptions: [{ value: Q.of(total / a).mul(Q.of(b)).div(Q.of(a)), msg: 'Mehr Personen brauchen weniger Zeit – umgekehrt proportional.' }].filter((m) => !m.value.eq(Q.of(total / b))),
      };
    },
  },
  {
    id: 'R3', title: 'Brüche, Dezimalzahlen und Prozent', area: 'Prozent', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.1.h', prereqs: ['B11'],
    intro: 'Prozent heisst «von hundert»: 25 % = 25/100 = 0.25 = 1/4. Von der Dezimalzahl zu Prozent: mal 100. Von Prozent zur Dezimalzahl: durch 100.',
    tip: 'Prozent = Hundertstel.',
    gen: (r) => {
      const opts: Array<[number, number]> = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [1, 20], [3, 20], [1, 50], [7, 50], [1, 8], [3, 8]];
      const [a, b] = r.pick(opts);
      const v = Q.of(a, b);
      const pct = v.mul(Q.of(100));
      const k = r.int(0, 2);
      if (k === 0) return { prompt: `Schreibe $${a}/${b}$ in Prozent.`, answer: D(pct, '%'), inputHint: 'Zahl in %', steps: [{ m: `${a}/${b} = ${dec(v)}` }, { m: `${dec(v)} · 100 = ${dec(pct)}`, why: 'in Prozent' }], misconceptions: [{ value: v, msg: 'Das ist die Dezimalzahl. Für Prozent noch mal 100.' }] };
      if (k === 1) return { prompt: `Schreibe $${dec(pct)}$ % als Dezimalzahl.`, answer: D(v), steps: [{ m: `${dec(pct)} : 100 = ${dec(v)}` }], misconceptions: [{ value: pct.div(Q.of(10)), msg: 'Prozent heisst durch 100, nicht durch 10.' }] };
      return { prompt: `Schreibe $${dec(pct)}$ % als vollständig gekürzten Bruch.`, answer: { kind: 'number', value: v, form: 'reduced' }, steps: [{ m: `${dec(pct)}/100` }, { m: `${a}/${b}`, why: 'kürzen' }] };
    },
  },
  {
    id: 'R4', title: 'Prozentwert berechnen', area: 'Prozent', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.A.3.g', prereqs: ['R3', 'R1'],
    intro: 'Wie viel sind 7 % von 35? Prozentwert = Grundwert · Prozentsatz : 100. Oder mit Dreisatz: 1 % von 35 = 0.35, also 7 % = 2.45.',
    tip: 'Zuerst 1 % berechnen (durch 100), dann mal den Prozentsatz.',
    gen: (r) => {
      const p = r.pick([5, 10, 12, 15, 20, 25, 30, 40, 60, 75, 8, 3]);
      const g = r.int(2, 60) * r.pick([5, 10, 20]);
      const res = Q.of(g * p, 100);
      return {
        prompt: `Wie viel sind $${p}$ % von $${big(g)}$ Fr.?`, answer: D(res, 'Fr.'),
        steps: [{ m: `1 % = ${big(g)} : 100 = ${dec(Q.of(g, 100))}` }, { m: `${p} % = ${dec(Q.of(g, 100))} · ${p} = ${dec(res)}` }],
        misconceptions: [{ value: Q.of(g, p), msg: 'Nicht durch den Prozentsatz teilen: Prozentwert = Grundwert · p : 100.' }].filter((m) => !m.value.eq(res)),
      };
    },
  },
  {
    id: 'R5', title: 'Prozentsatz berechnen', area: 'Prozent', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.A.3.g', prereqs: ['R4'],
    intro: 'Wie viel Prozent sind 7 von 35? Teile den Teil durch das Ganze und multipliziere mit 100: 7 : 35 = 0.2 = 20 %.',
    tip: 'Prozentsatz = Teil : Ganzes · 100.',
    gen: (r) => {
      const p = r.pick([5, 10, 15, 20, 25, 30, 40, 45, 60, 75, 80]);
      const g = r.int(2, 30) * 20;
      const w = (g * p) / 100;
      return {
        prompt: `In einer Schule mit ${g} Schülerinnen und Schülern kommen ${w} mit dem Velo. Wie viel Prozent sind das?`, answer: D(Q.of(p), '%'),
        steps: [{ m: `${w} : ${g} = ${dec(Q.of(w, g))}`, why: 'Teil durch Ganzes' }, { m: `${dec(Q.of(w, g))} · 100 = ${p}`, why: 'in Prozent' }],
        misconceptions: [{ value: Q.of(g, w), msg: 'Umgekehrt: Teil durch Ganzes, also ' + w + ' : ' + g + '.' }, { value: Q.of(w, g), msg: 'Fast: Das ist der Anteil als Dezimalzahl. Für Prozent noch mal 100.' }].filter((m) => !m.value.eq(Q.of(p))),
      };
    },
  },
  {
    id: 'R6', title: 'Grundwert berechnen', area: 'Prozent', stage: 'Sek 2', niveau: 'alle', lp21: 'MA.3.A.3.i', prereqs: ['R5'],
    intro: 'Wenn du den Teil und den Prozentsatz kennst, suchst du das Ganze (100 %). 30 % sind 45 → 1 % ist 1.5 → 100 % sind 150.',
    tip: 'Vom bekannten Prozentsatz auf 1 % und dann auf 100 % rechnen.',
    gen: (r) => {
      const p = r.pick([10, 20, 25, 30, 40, 60, 75, 15]);
      const g = r.int(2, 40) * 20;
      const w = Q.of(g * p, 100);
      return {
        prompt: `${p} % einer Strecke sind ${dec(w)} km. Wie lang ist die ganze Strecke?`, answer: D(Q.of(g), 'km'),
        steps: [{ m: `1 % = ${dec(w)} : ${p} = ${dec(w.div(Q.of(p)))}` }, { m: `100 % = ${dec(w.div(Q.of(p)))} · 100 = ${g}` }],
        misconceptions: [{ value: w.mul(Q.of(p)).div(Q.of(100)), msg: 'Gesucht ist das Ganze (100 %), nicht ein Teil davon.' }].filter((m) => !m.value.eq(Q.of(g))),
      };
    },
  },
  {
    id: 'R7', title: 'Rabatt und Aufschlag', area: 'Prozent', stage: 'Sek 2', niveau: 'alle', lp21: 'MA.3.A.3.i', prereqs: ['R4'],
    intro: 'Bei 20 % Rabatt zahlst du noch 80 % des Preises: neuer Preis = alter Preis · 0.8. Bei 7.7 % Aufschlag (z. B. Mehrwertsteuer) zahlst du 107.7 %: · 1.077.',
    tip: 'Rabatt: mal (100 − p) %. Aufschlag: mal (100 + p) %.',
    gen: (r) => {
      const p = r.pick([10, 15, 20, 25, 30, 40, 50]);
      const old = r.int(4, 80) * 5;
      const up = r.bool(0.3);
      const f = Q.of(up ? 100 + p : 100 - p, 100);
      const res = Q.of(old).mul(f);
      return {
        prompt: up ? `Ein Velo kostet ${old} Fr. Der Preis wird um ${p} % erhöht. Wie viel kostet es jetzt?` : `Ein Pullover kostet ${old} Fr. Es gibt ${p} % Rabatt. Wie viel bezahlst du?`,
        answer: D(res, 'Fr.'),
        steps: [{ m: `${up ? 100 + p : 100 - p} % von ${old}`, why: up ? `100 % + ${p} %` : `100 % − ${p} %` }, { m: `${old} · ${dec(f)} = ${dec(res)}` }],
        misconceptions: p === 50 && !up ? [] : [{ value: Q.of(old * p, 100), msg: up ? 'Das ist nur die Erhöhung. Sie muss noch zum Preis dazugezählt werden.' : 'Das ist der Rabatt. Gefragt ist, was du noch bezahlst.' }],
      };
    },
  },
  {
    id: 'R8', title: 'Zins', area: 'Prozent', stage: 'Sek 3', niveau: 'alle', lp21: 'MA.3.A.3.i', prereqs: ['R4'],
    intro: 'Zins ist der Preis für geliehenes Geld. Jahreszins = Kapital · Zinssatz : 100. Für eine kürzere Zeit rechnest du anteilig (Marchzins): Zins = Kapital · Zinssatz : 100 · Tage : 360.',
    tip: 'Erst den Jahreszins, dann den Anteil des Jahres.',
    gen: (r) => {
      const k = r.int(2, 50) * 500, p = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]);
      const pz = Q.fromDecimal(String(p));
      const jz = Q.of(k).mul(pz).div(Q.of(100));
      if (r.bool()) return {
        prompt: `Auf einem Sparkonto liegen ${big(k)} Fr. zu einem Zinssatz von ${p} %. Wie viel Zins gibt es nach einem Jahr?`, answer: D(jz, 'Fr.'),
        steps: [{ m: `${big(k)} · ${p} : 100 = ${dec(jz)}` }],
        misconceptions: [{ value: Q.of(k).mul(pz), msg: 'Der Zinssatz ist in Prozent: noch durch 100 teilen.' }],
      };
      const months = r.pick([3, 4, 6, 8, 9]);
      const res = jz.mul(Q.of(months, 12));
      return {
        prompt: `${big(k)} Fr. werden zu ${p} % angelegt. Wie viel Zins gibt es nach ${months} Monaten?`, answer: { kind: 'approx', value: res.toNumber(), tol: 0.0051, dec: 2, unit: 'Fr.' },
        inputHint: 'in Fr., auf Rappen genau',
        steps: [{ m: `${dec(jz)}`, why: 'Jahreszins' }, { m: `${dec(jz)} · ${months}/12 ≈ ${res.toNumber().toFixed(2)}`, why: `${months} von 12 Monaten` }],
        misconceptions: [{ value: jz, msg: `Das ist der Zins für ein ganzes Jahr. Gefragt sind ${months} Monate.` }],
      };
    },
  },
  {
    id: 'R9', title: 'Massstab', area: 'Prozent', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.A.3.h', prereqs: ['R1', 'M1'],
    intro: 'Massstab 1 : 25\'000 heisst: 1 cm auf der Karte sind 25\'000 cm = 250 m in Wirklichkeit. Rechne zuerst in derselben Einheit, dann wandle um.',
    tip: 'Kartenlänge · Massstabzahl, danach in m oder km umwandeln.',
    gen: (r) => {
      const m = r.pick([10000, 25000, 50000, 100000]);
      const cm = Q.of(r.int(2, 40), 2);
      const real = cm.mul(Q.of(m)).div(Q.of(100000));
      if (r.bool()) return {
        prompt: `Auf einer Karte im Massstab 1 : ${big(m)} misst eine Strecke ${dec(cm)} cm. Wie lang ist sie in Wirklichkeit (in km)?`, answer: D(real, 'km'),
        steps: [{ m: `${dec(cm)} · ${big(m)} = ${big(Number(cm.mul(Q.of(m)).toNumber()))} cm` }, { m: `${dec(real)} km`, why: '100\'000 cm = 1 km' }],
        misconceptions: [{ value: cm.mul(Q.of(m)).div(Q.of(100)), msg: 'Das ist in Metern. Gefragt sind Kilometer (1 km = 1000 m).' }],
      };
      return {
        prompt: `Eine Wanderung ist ${dec(real)} km lang. Wie lang ist sie auf einer Karte im Massstab 1 : ${big(m)} (in cm)?`, answer: D(cm, 'cm'),
        steps: [{ m: `${dec(real)} km = ${big(real.mul(Q.of(100000)).toNumber())} cm` }, { m: `${big(real.mul(Q.of(100000)).toNumber())} : ${big(m)} = ${dec(cm)}` }],
      };
    },
  },
  {
    id: 'R10', title: 'Anteile vergleichen', area: 'Prozent', stage: 'Primar', niveau: 'alle', lp21: 'MA.3.A.3.f', prereqs: ['R1'],
    intro: 'Um Anteile fair zu vergleichen, rechnest du auf dieselbe Bezugsgrösse um, z. B. «pro 1000 Personen» oder in Prozent.',
    tip: 'Beide auf dieselbe Bezugsgrösse umrechnen.',
    gen: (r) => {
      const a1 = r.int(2, 6), p1 = a1 * r.int(3, 9) * 1000;
      const a2 = r.int(3, 9), p2 = a2 * r.int(3, 9) * 1000;
      const x = p1 / a1, y = p2 / a2;
      return {
        prompt: `In Dorf X leben ${big(p1)} Menschen und es gibt ${a1} Spielwarengeschäfte. In Dorf Y leben ${big(p2)} Menschen mit ${a2} Geschäften. Wo gibt es im Verhältnis mehr Geschäfte?`,
        answer: { kind: 'choice', options: ['in X', 'in Y', 'gleich viele'], correct: x < y ? 0 : x > y ? 1 : 2 },
        steps: [{ m: `X: ${big(p1)} : ${a1} = ${big(x)} Menschen pro Geschäft` }, { m: `Y: ${big(p2)} : ${a2} = ${big(y)} Menschen pro Geschäft`, why: 'Weniger Menschen pro Geschäft = mehr Geschäfte im Verhältnis' }],
      };
    },
  },
];
