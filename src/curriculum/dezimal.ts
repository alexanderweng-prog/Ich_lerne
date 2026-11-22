// Dezimalzahlen (Zyklus 2 bis Sek 1)
import { Q } from '../math/rational';
import type { Rng, Skill } from './types';
import { dec } from './fmt';

/** Zufällige Dezimalzahl mit k Nachkommastellen zwischen lo und hi. */
function rd(r: Rng, lo: number, hi: number, k: number): Q {
  const f = 10 ** k;
  return Q.of(r.int(lo * f, hi * f), f);
}
const D = (q: Q) => ({ kind: 'number' as const, value: q, form: 'decimal' as const });

export const dezimal: Skill[] = [
  {
    id: 'D1', title: 'Dezimalzahlen: Stellenwerte', area: 'Dezimalzahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.1.g', prereqs: ['Z7'],
    intro: 'Rechts vom Dezimalpunkt kommen Zehntel, Hundertstel, Tausendstel. 3.472 = 3 Einer + 4 Zehntel + 7 Hundertstel + 2 Tausendstel.',
    tip: 'Erste Stelle nach dem Punkt = Zehntel, zweite = Hundertstel, dritte = Tausendstel.',
    gen: (r) => {
      const x = rd(r, 1, 99, 3);
      const s = dec(x).padEnd(dec(x).indexOf('.') + 4, '0');
      const k = r.int(1, 3);
      const names = ['', 'Zehntel', 'Hundertstel', 'Tausendstel'];
      const digit = Number(s[s.indexOf('.') + k]);
      return {
        prompt: `Welche Ziffer steht in $${s}$ an der ${names[k]}stelle?`, answer: { kind: 'number', value: Q.of(digit), form: 'integer' },
        steps: [{ m: s, why: `Nach dem Punkt: ${names.slice(1, k + 1).join(', ')}` }, { m: `${digit}` }],
      };
    },
  },
  {
    id: 'D2', title: 'Dezimalzahlen vergleichen', area: 'Dezimalzahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.2.g', prereqs: ['D1'],
    intro: 'Vergleiche Stelle für Stelle von links. Hilfreich: gleich viele Nachkommastellen machen, indem du Nullen anhängst. 1.5 = 1.50 > 1.43.',
    tip: 'Nullen anhängen, bis beide gleich viele Nachkommastellen haben.',
    selfExplain: {
      q: 'Warum ist 1.5 grösser als 1.43, obwohl 43 grösser als 5 ist?',
      options: ['Weil 1.5 = 1.50 ist und 50 Hundertstel mehr sind als 43 Hundertstel.', 'Weil kürzere Zahlen immer grösser sind.', 'Das stimmt nicht, 1.43 ist grösser.'],
      correct: 0,
      why: 'Die 5 steht an der Zehntelstelle und ist 5 Zehntel = 50 Hundertstel wert.',
    },
    gen: (r) => {
      const a = rd(r, 0, 9, r.int(1, 3));
      let b = rd(r, 0, 9, r.int(1, 3));
      if (r.bool(0.4)) b = Q.of(Math.floor(a.toNumber()) * 100 + r.int(0, 99), 100);
      if (r.bool(0.1)) b = a;
      const rel = a.lt(b) ? 0 : b.lt(a) ? 1 : 2;
      return {
        prompt: `Welches Zeichen gehört dazwischen? $${dec(a)}$ ☐ $${dec(b)}$`, answer: { kind: 'choice', options: ['<', '>', '='], correct: rel },
        steps: [{ m: `${a.toNumber().toFixed(3)} ☐ ${b.toNumber().toFixed(3)}`, why: 'Gleich viele Nachkommastellen' }, { m: `${dec(a)} ${['<', '>', '='][rel]} ${dec(b)}` }],
      };
    },
  },
  {
    id: 'D3', title: 'Dezimalzahlen runden', area: 'Dezimalzahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.4.g', prereqs: ['D1', 'Z8'],
    intro: 'Runden funktioniert wie bei ganzen Zahlen: Die Ziffer rechts von der Rundungsstelle entscheidet. 1.745 auf Zehntel: Hundertstel ist 4 → abrunden → 1.7.',
    tip: 'Nur die nächste Ziffer rechts entscheidet: 0–4 ab, 5–9 auf.',
    gen: (r) => {
      const x = rd(r, 0, 50, 3);
      const k = r.int(0, 2);
      const names = ['Ganze', 'Zehntel', 'Hundertstel'];
      const f = 10 ** k;
      const scaled = x.mul(Q.of(f));
      const fl = scaled.n / scaled.d;
      const rem = scaled.sub(new Q(fl));
      const up = !rem.lt(Q.of(1, 2));
      const res = new Q(fl + (up ? 1n : 0n), BigInt(f));
      const s = x.toNumber().toFixed(3);
      return {
        prompt: `Runde $${s}$ auf ${names[k]}.`, answer: D(res),
        steps: [{ m: `Entscheidende Ziffer: ${s[s.indexOf('.') + k + 1]}`, why: up ? '5 bis 9 → aufrunden' : '0 bis 4 → abrunden' }, { m: res.toNumber().toFixed(k) }],
        misconceptions: up ? [{ value: new Q(fl, BigInt(f)), msg: 'Die entscheidende Ziffer ist 5 oder grösser – aufrunden.' }] : [{ value: new Q(fl + 1n, BigInt(f)), msg: 'Die entscheidende Ziffer ist kleiner als 5 – abrunden.' }],
      };
    },
  },
  {
    id: 'D4', title: 'Dezimalzahlen addieren und subtrahieren', area: 'Dezimalzahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.f', prereqs: ['D1', 'G1'],
    intro: 'Schreibe die Zahlen so untereinander, dass die Dezimalpunkte genau untereinander stehen. Fehlende Stellen mit 0 auffüllen. Dann wie gewohnt rechnen.',
    tip: 'Punkt unter Punkt! 3.5 + 0.25 = 3.50 + 0.25.',
    gen: (r) => {
      const a = rd(r, 1, 60, r.int(1, 2)), b = rd(r, 0, 30, r.int(1, 3));
      const add = r.bool();
      const [x, y] = add || b.lt(a) ? [a, b] : [b, a];
      const res = add ? x.add(y) : x.sub(y);
      const wrongAlign = (() => { // Klassischer Fehler: rechtsbündig statt punktgerecht
        const sx = dec(x).replace('.', ''), sy = dec(y).replace('.', '');
        const kx = (dec(x).split('.')[1] ?? '').length, ky = (dec(y).split('.')[1] ?? '').length;
        if (kx === ky) return null;
        const k = Math.max(kx, ky);
        const v = add ? Number(sx) + Number(sy) : Number(sx) - Number(sy);
        return v >= 0 ? Q.of(v, 10 ** k) : null;
      })();
      return {
        prompt: `Berechne $${dec(x)} ${add ? '+' : '-'} ${dec(y)}$.`, answer: D(res),
        steps: [{ m: `${x.toNumber().toFixed(3)} ${add ? '+' : '-'} ${y.toNumber().toFixed(3)}`, why: 'Gleich viele Nachkommastellen, Punkt unter Punkt' }, { m: dec(res) }],
        misconceptions: wrongAlign && !wrongAlign.eq(res) ? [{ value: wrongAlign, msg: 'Die Dezimalpunkte müssen genau untereinander stehen (Zehntel unter Zehntel).' }] : [],
      };
    },
  },
  {
    id: 'D5', title: 'Mal und durch 10, 100, 1000', area: 'Dezimalzahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.g', prereqs: ['D1'],
    intro: 'Mal 10 verschiebt jede Ziffer um eine Stelle nach links (Zehntel werden zu Einern). Durch 10 verschiebt nach rechts. Bei 100 sind es zwei Stellen, bei 1000 drei.',
    tip: 'Anzahl Nullen = Anzahl Stellen, um die der Punkt wandert.',
    gen: (r) => {
      const x = rd(r, 0, 99, r.int(1, 3));
      const p = r.pick([10, 100, 1000]);
      const mul = r.bool();
      const res = mul ? x.mul(Q.of(p)) : x.div(Q.of(p));
      return {
        prompt: `Berechne $${dec(x)} ${mul ? '·' : ':'} ${p}$.`, answer: D(res),
        steps: [{ m: dec(res), why: `Punkt um ${String(p).length - 1} Stelle(n) nach ${mul ? 'rechts' : 'links'} verschieben` }],
        misconceptions: [{ value: mul ? x.div(Q.of(p)) : x.mul(Q.of(p)), msg: mul ? 'Beim Multiplizieren wird die Zahl grösser – Punkt nach rechts.' : 'Beim Dividieren wird die Zahl kleiner – Punkt nach links.' }],
      };
    },
  },
  {
    id: 'D6', title: 'Dezimalzahlen multiplizieren', area: 'Dezimalzahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.g', prereqs: ['D5', 'G3'],
    intro: 'Rechne zuerst ohne Dezimalpunkte. Das Ergebnis hat so viele Nachkommastellen wie beide Faktoren zusammen. 1.2 · 0.3: 12 · 3 = 36, zwei Nachkommastellen → 0.36.',
    tip: 'Nachkommastellen zählen und addieren.',
    gen: (r) => {
      const ka = r.int(0, 2), kb = r.int(1, 2);
      const a = Q.of(r.int(2, 99), 10 ** ka), b = Q.of(r.int(2, 30), 10 ** kb);
      const res = a.mul(b);
      const ia = Number(dec(a).replace('.', '')), ib = Number(dec(b).replace('.', ''));
      const da = (dec(a).split('.')[1] ?? '').length, db = (dec(b).split('.')[1] ?? '').length;
      return {
        prompt: `Berechne $${dec(a)} · ${dec(b)}$.`, answer: D(res),
        steps: [{ m: `${ia} · ${ib} = ${ia * ib}`, why: 'Ohne Punkt rechnen' }, { m: dec(res), why: `${da} + ${db} Nachkommastelle(n)` }],
        misconceptions: da > 0 && db > 0 ? [{ value: Q.of(ia * ib, 10 ** Math.max(da, db)), msg: 'Die Nachkommastellen beider Faktoren werden zusammengezählt.' }] : [],
      };
    },
  },
  {
    id: 'D7', title: 'Dezimalzahlen dividieren', area: 'Dezimalzahlen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.3.i', prereqs: ['D6', 'G4'],
    intro: 'Teilst du durch eine Dezimalzahl, erweiterst du zuerst: Beide Zahlen mit 10, 100 … multiplizieren, bis der Divisor ganz ist. 4.2 : 0.6 = 42 : 6 = 7.',
    tip: 'Divisor ganz machen – den Dividenden gleich mitverschieben.',
    gen: (r) => {
      const kb = r.int(0, 2);
      const b = Q.of(r.int(2, 9) * (kb ? 1 : 1), 10 ** kb);
      const q = Q.of(r.int(2, 40), 10 ** r.int(0, 1));
      const a = b.mul(q);
      const f = Q.of(10 ** kb);
      return {
        prompt: `Berechne $${dec(a)} : ${dec(b)}$.`, answer: D(q),
        steps: kb ? [{ m: `${dec(a.mul(f))} : ${dec(b.mul(f))}`, why: `Beide mit ${10 ** kb} multiplizieren` }, { m: dec(q) }] : [{ m: dec(q) }],
        misconceptions: kb ? [{ value: q.div(f), msg: 'Wenn du den Divisor mit ' + 10 ** kb + ' multiplizierst, musst du den Dividenden auch damit multiplizieren.' }, { value: q.div(f).div(f), msg: 'Beim Teilen durch eine Zahl kleiner als 1 wird das Ergebnis grösser.' }] : [],
      };
    },
  },
  {
    id: 'D8', title: 'Mit Dezimalzahlen überschlagen', area: 'Dezimalzahlen', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.1.A.2.h', prereqs: ['D3', 'Z9'],
    intro: 'Runde auf eine Stelle, mit der du gut rechnen kannst, und rechne im Kopf. 0.723 − 0.04 ≈ 0.7. Beim Dividieren: 32.7 : 0.085 ≈ 30 : 0.1 = 300.',
    tip: 'Auf eine «schöne» Zahl runden und im Kopf rechnen.',
    gen: (r) => {
      const a = r.int(2, 9) * 10, b = Q.of(r.int(2, 9), r.pick([10, 100]));
      const ap = Q.of(a + r.int(-3, 3)).add(Q.of(r.int(1, 9), 10));
      const bp = b.add(Q.of(r.int(-1, 1), 1000)).add(Q.of(0));
      const est = Q.of(a).div(b);
      const options = r.shuffle([est, est.mul(Q.of(10)), est.div(Q.of(10)), est.div(Q.of(100))]);
      return {
        prompt: `Welcher Überschlag passt zu $${dec(ap)} : ${dec(bp)}$?`,
        answer: { kind: 'choice', options: options.map((o) => dec(o)), correct: options.indexOf(est) },
        steps: [{ m: `${a} : ${dec(b)}`, why: 'Runden' }, { m: dec(est) }],
      };
    },
  },
];
