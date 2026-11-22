// Grössen: Masseinheiten, Geld, Zeit, Geschwindigkeit, Dichte
import { Q } from '../math/rational';
import type { Rng, Skill, Task } from './types';
import { dec } from './fmt';

type Unit = [string, Q];
const q = (n: number, d = 1) => Q.of(n, d);
const LEN: Unit[] = [['km', q(1000)], ['m', q(1)], ['dm', q(1, 10)], ['cm', q(1, 100)], ['mm', q(1, 1000)]];
const MASS: Unit[] = [['t', q(1000)], ['kg', q(1)], ['g', q(1, 1000)]];
const LIQ: Unit[] = [['l', q(1)], ['dl', q(1, 10)], ['cl', q(1, 100)], ['ml', q(1, 1000)]];
const AREA: Unit[] = [['km²', q(1000000)], ['ha', q(10000)], ['a', q(100)], ['m²', q(1)], ['dm²', q(1, 100)], ['cm²', q(1, 10000)]];
const VOL: Unit[] = [['m³', q(1)], ['dm³', q(1, 1000)], ['cm³', q(1, 1000000)]];

/** Umwandlung zwischen zwei Einheiten derselben Tabelle (benachbart oder mit Abstand). */
function convert(r: Rng, table: Unit[], maxGap: number, stepWord: string): Task {
  const i = r.int(0, table.length - 2);
  const j = Math.min(table.length - 1, i + r.int(1, maxGap));
  const [from, to] = r.bool() ? [table[i], table[j]] : [table[j], table[i]];
  const big = from[1].lt(to[1]) ? to : from;
  const small = big === from ? to : from;
  const factor = big[1].div(small[1]);
  const x = r.bool(0.6) ? q(r.int(1, 99) * r.pick([1, 1, 10]), 1) : q(r.int(11, 999), r.pick([10, 100]));
  const res = x.mul(from[1]).div(to[1]);
  const wrongFactor = factor.eq(q(100)) ? q(10) : factor.eq(q(10000)) ? q(100) : factor.eq(q(1000)) ? q(100) : q(10);
  const wrong = from === big ? x.mul(wrongFactor) : x.div(wrongFactor);
  const inverse = from === big ? x.div(factor) : x.mul(factor);
  return {
    prompt: `Wandle um: $${dec(x)}$ ${from[0]} = ? ${to[0]}`,
    answer: { kind: 'number', value: res, form: 'decimal', unit: to[0] },
    steps: [
      { m: `1 ${big[0]} = ${dec(factor)} ${small[0]}`, why: `Umrechnungszahl (${stepWord})` },
      { m: `${dec(x)} ${from === big ? '·' : ':'} ${dec(factor)} = ${dec(res)}`, why: from === big ? 'In kleinere Einheit: mehr Stück → mal' : 'In grössere Einheit: weniger Stück → durch' },
    ],
    misconceptions: [
      ...(!wrong.eq(res) ? [{ value: wrong, msg: `Achtung, falsche Umrechnungszahl: 1 ${big[0]} = ${dec(factor)} ${small[0]}.` }] : []),
      ...(!inverse.eq(res) ? [{ value: inverse, msg: 'Falsche Richtung: In eine kleinere Einheit wird die Zahl grösser, in eine grössere kleiner.' }] : []),
    ],
  };
}

export const groessen: Skill[] = [
  {
    id: 'M1', title: 'Längen umwandeln', area: 'Grössen', stage: 'Primar', niveau: 'alle', lp21: 'MA.3.A.2.g', prereqs: ['D5'],
    intro: '1 km = 1000 m, 1 m = 10 dm = 100 cm = 1000 mm. Bei Längen ist die Umrechnungszahl zwischen benachbarten Einheiten 10 (ausser km → m: 1000).',
    tip: 'In eine kleinere Einheit → die Zahl wird grösser (mal). In eine grössere → kleiner (durch).',
    gen: (r) => convert(r, LEN, 2, 'Längen'),
  },
  {
    id: 'M2', title: 'Gewichte und Hohlmasse umwandeln', area: 'Grössen', stage: 'Primar', niveau: 'alle', lp21: 'MA.3.A.2.g', prereqs: ['M1'],
    intro: '1 t = 1000 kg, 1 kg = 1000 g. Hohlmasse: 1 l = 10 dl = 100 cl = 1000 ml.',
    tip: 'Gewichte: Faktor 1000. Hohlmasse: benachbarte Einheiten Faktor 10.',
    gen: (r) => (r.bool() ? convert(r, MASS, 1, 'Gewichte') : convert(r, LIQ, 2, 'Hohlmasse')),
  },
  {
    id: 'M3', title: 'Rechnen mit Geld', area: 'Grössen', stage: 'Zyklus 1', niveau: 'alle', lp21: 'MA.3.A.2.d', prereqs: ['Z4'],
    intro: '1 Franken = 100 Rappen. 25 Fr. 60 Rp. schreibt man auch 25.60 Fr. Rechne Franken und Rappen getrennt oder alles in Rappen.',
    tip: 'Franken zu Franken, Rappen zu Rappen. 100 Rp. = 1 Fr.',
    gen: (r) => {
      const a = q(r.int(100, 5000), 100), b = q(r.int(50, 3000), 100);
      const rounded = (x: Q) => q(Math.round(x.toNumber() * 20), 20);
      const A = rounded(a), B = rounded(b);
      const add = r.bool() || B.lt(A) === false;
      const res = add ? A.add(B) : A.sub(B);
      return {
        prompt: add ? `Du kaufst ein Buch für ${dec(A)} Fr. und ein Heft für ${dec(B)} Fr. Wie viel bezahlst du?` : `Du hast ${dec(A)} Fr. und gibst ${dec(B)} Fr. aus. Wie viel bleibt?`,
        answer: { kind: 'number', value: res, form: 'decimal', unit: 'Fr.' },
        steps: [{ m: `${dec(A)} ${add ? '+' : '-'} ${dec(B)}`, why: 'Punkt unter Punkt' }, { m: dec(res) }],
      };
    },
  },
  {
    id: 'M4', title: 'Zeitdauer berechnen', area: 'Grössen', stage: 'Primar', niveau: 'alle', lp21: 'MA.3.A.2.f', prereqs: ['Z4'],
    intro: '1 h = 60 min, 1 min = 60 s. Für Zeitdauern rechnest du am besten in Etappen: bis zur vollen Stunde, dann volle Stunden, dann der Rest.',
    tip: 'Achtung: Eine Stunde hat 60 Minuten, nicht 100.',
    gen: (r) => {
      const h1 = r.int(6, 16), m1 = r.int(0, 11) * 5, dur = r.int(4, 40) * 5;
      const end = h1 * 60 + m1 + dur;
      const fmtT = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
      const toFull = (60 - m1) % 60;
      return {
        prompt: `Ein Film beginnt um ${fmtT(h1 * 60 + m1)} Uhr und endet um ${fmtT(end)} Uhr. Wie lange dauert er (in Minuten)?`,
        answer: { kind: 'number', value: q(dur), form: 'integer', unit: 'min' },
        steps: [{ m: `${toFull} min`, why: 'bis zur vollen Stunde' }, { m: `${dur} min`, why: `insgesamt (${Math.floor(dur / 60)} h ${dur % 60} min)` }],
        misconceptions: (() => {
          const naive = (Math.floor(end / 60) * 100 + end % 60) - (h1 * 100 + m1);
          return naive !== dur ? [{ value: q(naive), msg: 'Du hast gerechnet, als hätte eine Stunde 100 Minuten. Sie hat 60.' }] : [];
        })(),
      };
    },
  },
  {
    id: 'M5', title: 'Flächenmasse umwandeln', area: 'Grössen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.A.1.j', prereqs: ['M1'],
    intro: '1 m² ist ein Quadrat mit 1 m Seitenlänge = 10 dm · 10 dm = 100 dm². Deshalb ist die Umrechnungszahl bei Flächen 100: m², dm², cm², mm². Dazu: 1 a = 100 m², 1 ha = 100 a, 1 km² = 100 ha.',
    tip: 'Flächen: Umrechnungszahl 100 zwischen benachbarten Einheiten.',
    selfExplain: {
      q: 'Warum ist 1 m² = 10\'000 cm² und nicht 100 cm²?',
      options: ['Ein Quadrat von 1 m Seite hat 100 cm mal 100 cm = 10\'000 Zentimeterquadrate.', 'Weil man bei Flächen immer mal 1000 rechnet.', 'Doch, es sind 100 cm².'],
      correct: 0,
      why: 'Die Länge wird mit 100 multipliziert – und die Breite auch: 100 · 100 = 10\'000.',
    },
    gen: (r) => convert(r, AREA, 2, 'Flächen'),
  },
  {
    id: 'M6', title: 'Raummasse und Liter', area: 'Grössen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.A.2.j', prereqs: ['M5', 'M2'],
    intro: 'Bei Volumen ist die Umrechnungszahl 1000: 1 m³ = 1000 dm³, 1 dm³ = 1000 cm³. Wichtig: 1 dm³ = 1 l und 1 cm³ = 1 ml.',
    tip: 'Raummasse: Faktor 1000. 1 dm³ = 1 Liter.',
    gen: (r) => {
      if (r.bool(0.35)) {
        const x = q(r.int(2, 900));
        const toL = r.bool();
        return toL
          ? { prompt: `Wie viele Liter sind $${dec(x)}$ dm³?`, answer: { kind: 'number', value: x, form: 'decimal', unit: 'l' }, steps: [{ m: '1 dm³ = 1 l' }, { m: `${dec(x)} l` }] }
          : { prompt: `Wie viele Liter sind $${dec(x)}$ cm³?`, answer: { kind: 'number', value: x.div(q(1000)), form: 'decimal', unit: 'l' }, steps: [{ m: '1000 cm³ = 1 dm³ = 1 l' }, { m: `${dec(x)} : 1000 = ${dec(x.div(q(1000)))}` }], misconceptions: [{ value: x.div(q(100)), msg: 'Bei Volumen ist die Umrechnungszahl 1000.' }] };
      }
      return convert(r, VOL, 1, 'Volumen');
    },
  },
  {
    id: 'M7', title: 'Rechnen mit gemischten Einheiten', area: 'Grössen', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.3.A.2.k', prereqs: ['M1', 'M2', 'D4'],
    intro: 'Bevor du rechnest, bringst du alle Grössen in dieselbe Einheit. 3 m 45 cm + 2 m 80 cm = 3.45 m + 2.80 m = 6.25 m.',
    tip: 'Zuerst alles in dieselbe Einheit umwandeln.',
    gen: (r) => {
      if (r.bool()) {
        const a = r.int(1, 9), b = r.int(5, 95), c = r.int(1, 9), d = r.int(5, 95);
        const res = q(a * 100 + b + c * 100 + d, 100);
        return { prompt: `Berechne in Metern: ${a} m ${b} cm + ${c} m ${d} cm`, answer: { kind: 'number', value: res, form: 'decimal', unit: 'm' }, steps: [{ m: `${dec(q(a * 100 + b, 100))} + ${dec(q(c * 100 + d, 100))}`, why: 'in m umwandeln' }, { m: dec(res) }] };
      }
      const kg = q(r.int(2, 40), 2), g = r.int(50, 950);
      const res = kg.sub(q(g, 1000));
      return { prompt: `Von $${dec(kg)}$ kg Mehl werden ${g} g gebraucht. Wie viele kg bleiben?`, answer: { kind: 'number', value: res, form: 'decimal', unit: 'kg' }, steps: [{ m: `${g} g = ${dec(q(g, 1000))} kg` }, { m: `${dec(kg)} - ${dec(q(g, 1000))} = ${dec(res)}` }], misconceptions: [{ value: kg.sub(q(g)), msg: 'Gramm und Kilogramm zuerst in dieselbe Einheit bringen: 1 kg = 1000 g.' }] };
    },
  },
  {
    id: 'M8', title: 'Geschwindigkeit, Weg und Zeit', area: 'Grössen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.3.A.2.i', prereqs: ['R1', 'M4'],
    intro: 'Geschwindigkeit = Weg : Zeit (v = s : t). Daraus folgt: Weg = Geschwindigkeit · Zeit und Zeit = Weg : Geschwindigkeit. Achte auf passende Einheiten (km und h, m und s).',
    tip: 'Welche zwei Grössen sind gegeben? Dann die passende Formel wählen.',
    gen: (r) => {
      const v = r.pick([4, 5, 12, 15, 18, 20, 60, 80, 90, 100, 120]);
      const t = q(r.int(1, 8), r.pick([1, 2, 4]));
      const s = q(v).mul(t);
      const k = r.int(0, 2);
      if (k === 0) return { prompt: `Ein Auto fährt ${dec(t)} h lang mit ${v} km/h. Wie weit fährt es?`, answer: { kind: 'number', value: s, form: 'decimal', unit: 'km' }, steps: [{ m: 's = v · t' }, { m: `${v} · ${dec(t)} = ${dec(s)}` }] };
      if (k === 1) return { prompt: `Eine Velofahrerin fährt ${dec(s)} km in ${dec(t)} h. Wie gross ist ihre Durchschnittsgeschwindigkeit in km/h?`, answer: { kind: 'number', value: q(v), form: 'decimal', unit: 'km/h' }, steps: [{ m: 'v = s : t' }, { m: `${dec(s)} : ${dec(t)} = ${v}` }], misconceptions: [{ value: t.div(s), msg: 'Umgekehrt: Weg durch Zeit.' }, { value: s.mul(t), msg: 'Geschwindigkeit ist Weg DURCH Zeit.' }].filter((m) => !m.value.eq(q(v))) };
      return { prompt: `Ein Zug fährt mit ${v} km/h. Wie lange braucht er für ${dec(s)} km (in Stunden)?`, answer: { kind: 'number', value: t, form: 'decimal', unit: 'h' }, steps: [{ m: 't = s : v' }, { m: `${dec(s)} : ${v} = ${dec(t)}` }], misconceptions: [{ value: q(v).div(s), msg: 'Zeit = Weg durch Geschwindigkeit.' }].filter((m) => !m.value.eq(t)) };
    },
  },
  {
    id: 'M9', title: 'Geschwindigkeiten umrechnen', area: 'Grössen', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.3.A.2.k', prereqs: ['M8'],
    intro: '1 m/s = 3.6 km/h, denn in einer Stunde (3600 s) legt man 3600 m = 3.6 km zurück. m/s → km/h: mal 3.6. km/h → m/s: durch 3.6.',
    tip: 'm/s → km/h: · 3.6. Umgekehrt: : 3.6.',
    gen: (r) => {
      const ms = r.pick([5, 10, 15, 20, 25, 30, 2.5, 12.5]);
      const kmh = Q.fromDecimal(String(ms)).mul(Q.fromDecimal('3.6'));
      if (r.bool()) return { prompt: `Rechne $${ms}$ m/s in km/h um.`, answer: { kind: 'number', value: kmh, form: 'decimal', unit: 'km/h' }, steps: [{ m: `${ms} · 3.6 = ${dec(kmh)}` }], misconceptions: [{ value: Q.fromDecimal(String(ms)).div(Q.fromDecimal('3.6')), msg: 'Von m/s nach km/h wird die Zahl grösser: mal 3.6.' }] };
      return { prompt: `Rechne $${dec(kmh)}$ km/h in m/s um.`, answer: { kind: 'number', value: Q.fromDecimal(String(ms)), form: 'decimal', unit: 'm/s' }, steps: [{ m: `${dec(kmh)} : 3.6 = ${ms}` }], misconceptions: [{ value: kmh.mul(Q.fromDecimal('3.6')), msg: 'Von km/h nach m/s wird die Zahl kleiner: durch 3.6.' }] };
    },
  },
  {
    id: 'M10', title: 'Dichte', area: 'Grössen', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.3.A.1.m', prereqs: ['M6', 'M8'],
    intro: 'Dichte = Masse : Volumen (ρ = m : V), z. B. in g/cm³. Wasser hat die Dichte 1 g/cm³, Eisen etwa 7.9 g/cm³. Daraus: Masse = Dichte · Volumen.',
    tip: 'Wie bei der Geschwindigkeit: eine Formel, drei Varianten.',
    gen: (r) => {
      const [stoff, rho] = r.pick([['Aluminium', '2.7'], ['Eisen', '7.9'], ['Holz (Fichte)', '0.5'], ['Gold', '19.3'], ['Glas', '2.5']] as const);
      const V = q(r.int(2, 50) * 2);
      const m = Q.fromDecimal(rho).mul(V);
      if (r.bool()) return { prompt: `Ein Würfel aus ${stoff} (Dichte ${rho} g/cm³) hat ein Volumen von ${dec(V)} cm³. Wie schwer ist er (in g)?`, answer: { kind: 'number', value: m, form: 'decimal', unit: 'g' }, steps: [{ m: 'm = ρ · V' }, { m: `${rho} · ${dec(V)} = ${dec(m)}` }], misconceptions: [{ value: V.div(Q.fromDecimal(rho)), msg: 'Masse = Dichte MAL Volumen.' }] };
      return { prompt: `Ein Körper hat eine Masse von ${dec(m)} g und ein Volumen von ${dec(V)} cm³. Wie gross ist seine Dichte in g/cm³?`, answer: { kind: 'number', value: Q.fromDecimal(rho), form: 'decimal', unit: 'g/cm³' }, steps: [{ m: 'ρ = m : V' }, { m: `${dec(m)} : ${dec(V)} = ${rho}` }], misconceptions: [{ value: V.div(m), msg: 'Dichte = Masse durch Volumen.' }] };
    },
  },
];
