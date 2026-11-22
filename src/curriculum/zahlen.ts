// Zyklus 1 und 2: Zahlvorstellung, Kopfrechnen, Stellenwerte, Runden, Überschlagen.
import { Q } from '../math/rational';
import type { Skill } from './types';
import { big } from './fmt';

const N = (v: number) => Q.of(v);
const int = { form: 'integer' as const };

export const zahlen: Skill[] = [
  {
    id: 'Z1', title: 'Zahlen bis 20: vorwärts und rückwärts', area: 'Zahlen', stage: 'Zyklus 1', niveau: 'alle', lp21: 'MA.1.A.2.b', prereqs: [],
    intro: 'Die Zahlen folgen immer in derselben Reihenfolge. Der Nachfolger ist um 1 grösser, der Vorgänger um 1 kleiner. Bei 2er-Schritten springst du jeweils um 2.',
    tip: 'Zähle in Gedanken weiter – oder nutze die Finger.',
    gen: (r) => {
      const v = r.int(0, 2);
      if (v === 0) { const n = r.int(1, 19); return { prompt: `Welche Zahl kommt nach $${n}$?`, answer: { kind: 'number', value: N(n + 1), ...int }, steps: [{ m: `${n} + 1 = ${n + 1}`, why: 'Nachfolger: eins mehr' }] }; }
      if (v === 1) { const n = r.int(2, 20); return { prompt: `Welche Zahl kommt vor $${n}$?`, answer: { kind: 'number', value: N(n - 1), ...int }, steps: [{ m: `${n} - 1 = ${n - 1}`, why: 'Vorgänger: eins weniger' }], misconceptions: [{ value: N(n + 1), msg: 'Das ist die Zahl NACH ' + n + '. Gefragt ist die Zahl davor.' }] }; }
      const s = r.int(1, 7) * 2;
      return { prompt: `Zähle in 2er-Schritten weiter: $${s}$, $${s + 2}$, $${s + 4}$, … Welche Zahl kommt als Nächstes?`, answer: { kind: 'number', value: N(s + 6), ...int }, steps: [{ m: `${s + 4} + 2 = ${s + 6}`, why: 'Immer 2 dazu' }], misconceptions: [{ value: N(s + 5), msg: 'Du hast nur 1 dazugezählt. Es sind 2er-Schritte.' }] };
    },
  },
  {
    id: 'Z2', title: 'Plus und Minus bis 20', area: 'Zahlen', stage: 'Zyklus 1', niveau: 'alle', lp21: 'MA.1.A.3.a', prereqs: ['Z1'],
    intro: 'Rechnungen bis 20 solltest du ohne Zählen können. Hilfreich: über die 10 rechnen. 8 + 5 = 8 + 2 + 3 = 13.',
    tip: 'Ergänze zuerst bis 10, dann den Rest.',
    gen: (r) => {
      const a = r.int(2, 12), b = r.int(2, 9);
      if (r.bool() || a + b > 20) {
        const big2 = Math.max(a, b) + Math.min(a, b);
        const x = Math.min(big2, 20), y = Math.min(a, b);
        return { prompt: `Berechne $${x} - ${y}$.`, answer: { kind: 'number', value: N(x - y), ...int }, steps: x - 10 > 0 && y > x - 10 ? [{ m: `${x} - ${x - 10} - ${y - (x - 10)}`, why: 'Zuerst bis 10 zurück' }, { m: `10 - ${y - (x - 10)}` }, { m: `${x - y}` }] : [{ m: `${x - y}` }] };
      }
      const toTen = 10 - a;
      return { prompt: `Berechne $${a} + ${b}$.`, answer: { kind: 'number', value: N(a + b), ...int }, steps: a < 10 && b > toTen ? [{ m: `${a} + ${toTen} + ${b - toTen}`, why: 'Zuerst bis 10 ergänzen' }, { m: `10 + ${b - toTen}` }, { m: `${a + b}` }] : [{ m: `${a + b}` }] };
    },
  },
  {
    id: 'Z3', title: 'Zehner und Einer', area: 'Zahlen', stage: 'Zyklus 1', niveau: 'alle', lp21: 'MA.1.A.3.b', prereqs: ['Z1'],
    intro: 'Zweistellige Zahlen bestehen aus Zehnern und Einern. 47 sind 4 Zehner und 7 Einer, also 40 + 7.',
    tip: 'Die linke Ziffer zählt die Zehner, die rechte die Einer.',
    gen: (r) => {
      const z = r.int(1, 9), e = r.int(0, 9);
      if (r.bool()) return { prompt: `Welche Zahl hat $${z}$ Zehner und $${e}$ Einer?`, answer: { kind: 'number', value: N(10 * z + e), ...int }, steps: [{ m: `${z} · 10 + ${e}`, why: `${z} Zehner sind ${10 * z}` }, { m: `${10 * z + e}` }], misconceptions: e + z !== 10 * z + e ? [{ value: N(z + e), msg: 'Zehner sind 10 wert, nicht 1. Rechne ' + z + ' · 10 + ' + e + '.' }] : [] };
      return { prompt: `Wie viele Zehner hat die Zahl $${10 * z + e}$?`, answer: { kind: 'number', value: N(z), ...int }, steps: [{ m: `${10 * z + e} = ${10 * z} + ${e}`, why: 'In Zehner und Einer zerlegen' }, { m: `${z}`, why: `${10 * z} sind ${z} Zehner` }], misconceptions: e !== z ? [{ value: N(e), msg: 'Das sind die Einer (rechte Ziffer). Gefragt sind die Zehner.' }] : [] };
    },
  },
  {
    id: 'Z4', title: 'Plus und Minus bis 100', area: 'Zahlen', stage: 'Zyklus 1', niveau: 'alle', lp21: 'MA.1.A.3.c', prereqs: ['Z2', 'Z3'],
    intro: 'Rechne zuerst mit den Zehnern, dann mit den Einern. 47 + 25 = 47 + 20 + 5 = 67 + 5 = 72.',
    tip: 'Zweite Zahl zerlegen: zuerst die Zehner, dann die Einer.',
    gen: (r) => {
      const a = r.int(11, 89), b = r.int(11, Math.min(99 - a, 89) < 11 ? 11 : Math.min(99 - a, 89));
      if (r.bool() && a + b <= 100) {
        const t = Math.floor(b / 10) * 10;
        return { prompt: `Berechne $${a} + ${b}$.`, answer: { kind: 'number', value: N(a + b), ...int }, steps: [{ m: `${a} + ${t} + ${b - t}`, why: 'Zehner, dann Einer' }, { m: `${a + t} + ${b - t}` }, { m: `${a + b}` }] };
      }
      const x = Math.max(a, b), y = Math.min(a, b), t = Math.floor(y / 10) * 10;
      return { prompt: `Berechne $${x} - ${y}$.`, answer: { kind: 'number', value: N(x - y), ...int }, steps: [{ m: `${x} - ${t} - ${y - t}`, why: 'Zehner, dann Einer' }, { m: `${x - t} - ${y - t}` }, { m: `${x - y}` }] };
    },
  },
  {
    id: 'Z5', title: 'Verdoppeln und Halbieren', area: 'Zahlen', stage: 'Zyklus 1', niveau: 'alle', lp21: 'MA.1.A.3.c', prereqs: ['Z4'],
    intro: 'Verdoppeln heisst: die Zahl zweimal nehmen. Halbieren heisst: in zwei gleiche Teile teilen. Zerlege grössere Zahlen: das Doppelte von 36 ist das Doppelte von 30 plus das Doppelte von 6.',
    tip: 'Zehner und Einer getrennt verdoppeln oder halbieren.',
    gen: (r) => {
      if (r.bool()) {
        const n = r.int(6, 49), t = Math.floor(n / 10) * 10;
        return { prompt: `Verdopple $${n}$.`, answer: { kind: 'number', value: N(2 * n), ...int }, steps: [{ m: `${2 * t} + ${2 * (n - t)}`, why: `Doppelt ${t} und doppelt ${n - t}` }, { m: `${2 * n}` }], misconceptions: [{ value: N(n + 2), msg: 'Verdoppeln heisst «mal 2», nicht «plus 2».' }] };
      }
      const n = 2 * r.int(6, 49), t = Math.floor(n / 20) * 20;
      return { prompt: `Halbiere $${n}$.`, answer: { kind: 'number', value: N(n / 2), ...int }, steps: [{ m: `${t / 2} + ${(n - t) / 2}`, why: `Hälfte von ${t} und von ${n - t}` }, { m: `${n / 2}` }], misconceptions: [{ value: N(n - 2), msg: 'Halbieren heisst «durch 2», nicht «minus 2».' }] };
    },
  },
  {
    id: 'Z6', title: 'Platzhalter und Umkehraufgaben', area: 'Zahlen', stage: 'Zyklus 1', niveau: 'alle', lp21: 'MA.1.A.4.c', prereqs: ['Z4'],
    intro: 'Bei 23 + ☐ = 50 suchst du die fehlende Zahl. Die Umkehraufgabe hilft: ☐ = 50 − 23. Plus und Minus machen sich gegenseitig rückgängig.',
    tip: 'Ergänzen: Wie viel fehlt von der kleineren zur grösseren Zahl?',
    gen: (r) => {
      const a = r.int(12, 60), x = r.int(5, 39), s = a + x;
      if (r.bool()) return { prompt: `Welche Zahl gehört in das Kästchen? $${a} + ☐ = ${s}$`, answer: { kind: 'number', value: N(x), ...int }, steps: [{ m: `☐ = ${s} - ${a}`, why: 'Umkehraufgabe' }, { m: `☐ = ${x}` }], misconceptions: [{ value: N(s + a), msg: 'Die Umkehrung von Plus ist Minus: ' + s + ' − ' + a + '.' }] };
      return { prompt: `Ein Geschenk kostet ${s} Fr. Du hast schon ${a} Fr. gespart. Wie viele Franken fehlen noch?`, answer: { kind: 'number', value: N(x), ...int, unit: 'Fr.' }, steps: [{ m: `${a} + ☐ = ${s}`, why: 'Was fehlt bis ' + s + '?' }, { m: `☐ = ${s} - ${a} = ${x}` }], misconceptions: [{ value: N(s + a), msg: 'Gesucht ist, was fehlt – also die Differenz.' }] };
    },
  },
  {
    id: 'Z7', title: 'Stellenwerte bis 1 Million', area: 'Zahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.1.f', prereqs: ['Z3'],
    intro: 'Jede Stelle ist 10-mal so viel wert wie die Stelle rechts davon: Einer, Zehner, Hunderter, Tausender, Zehntausender, Hunderttausender. In der Schweiz trennt man Tausender mit einem Apostroph: 305\'240.',
    tip: 'Zähle die Stellen von rechts: E, Z, H, T, ZT, HT.',
    gen: (r) => {
      const n = r.int(10000, 999999);
      const names = ['Einer', 'Zehner', 'Hunderter', 'Tausender', 'Zehntausender', 'Hunderttausender'];
      const k = r.int(0, String(n).length - 1);
      const digit = Math.floor(n / 10 ** k) % 10;
      if (r.bool()) return {
        prompt: `Welche Ziffer steht in $${big(n)}$ an der ${names[k]}stelle?`, answer: { kind: 'number', value: N(digit), ...int },
        steps: [{ m: big(n), why: `Von rechts zählen: ${names.slice(0, k + 1).join(', ')}` }, { m: `${digit}`, why: `Ziffer an der ${names[k]}stelle` }],
      };
      const t = Math.floor(n / 1000), h = Math.floor((n % 1000) / 100), rest = n % 100;
      return {
        prompt: `Schreibe als Zahl: ${t} Tausender, ${h} Hunderter und ${rest} Einer.`, answer: { kind: 'number', value: N(t * 1000 + h * 100 + rest), ...int },
        steps: [{ m: `${t} · 1000 + ${h} · 100 + ${rest}` }, { m: `${t * 1000} + ${h * 100} + ${rest}` }, { m: `${t * 1000 + h * 100 + rest}` }],
      };
    },
  },
  {
    id: 'Z8', title: 'Natürliche Zahlen runden', area: 'Zahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.4.f', prereqs: ['Z7'],
    intro: 'Beim Runden schaust du auf die Ziffer rechts von der Rundungsstelle: 0–4 → abrunden, 5–9 → aufrunden. 3\'472 auf Hunderter: Die Zehnerziffer ist 7 → aufrunden → 3\'500.',
    tip: 'Nur die Ziffer direkt rechts von der Rundungsstelle entscheidet.',
    gen: (r) => {
      const n = r.int(1000, 99999);
      const [p, name] = r.pick([[10, 'Zehner'], [100, 'Hunderter'], [1000, 'Tausender']] as const);
      const res = Math.round(n / p) * p;
      const nextDigit = Math.floor(n / (p / 10)) % 10;
      return {
        prompt: `Runde $${big(n)}$ auf ${name}.`, answer: { kind: 'number', value: N(res), ...int },
        steps: [{ m: `Entscheidende Ziffer: ${nextDigit}`, why: nextDigit >= 5 ? '5 bis 9 → aufrunden' : '0 bis 4 → abrunden' }, { m: big(res) }],
        misconceptions: [
          ...(Math.floor(n / p) * p !== res ? [{ value: N(Math.floor(n / p) * p), msg: `Die Ziffer ${nextDigit} ist 5 oder grösser – also aufrunden.` }] : []),
          ...(Math.ceil(n / p) * p !== res ? [{ value: N(Math.ceil(n / p) * p), msg: `Die Ziffer ${nextDigit} ist kleiner als 5 – also abrunden.` }] : []),
        ],
      };
    },
  },
  {
    id: 'Z9', title: 'Ergebnisse überschlagen', area: 'Zahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.2.g', prereqs: ['Z8', 'G3'],
    intro: 'Überschlagen heisst: mit gerundeten Zahlen ungefähr rechnen. So merkst du, ob ein Ergebnis ungefähr stimmen kann. 13\'567 + 28\'902 ≈ 14\'000 + 29\'000 = 43\'000.',
    tip: 'Runde die Zahlen so, dass du im Kopf rechnen kannst.',
    gen: (r) => {
      const op = r.pick(['+', '·', ':'] as const);
      let a: number, b: number, exact: number, est: number, ra: number, rb: number;
      if (op === '+') { a = r.int(1000, 49000); b = r.int(1000, 49000); ra = Math.round(a / 1000) * 1000; rb = Math.round(b / 1000) * 1000; exact = a + b; est = ra + rb; }
      else if (op === '·') { a = r.int(21, 98); b = r.int(21, 98); ra = Math.round(a / 10) * 10; rb = Math.round(b / 10) * 10; exact = a * b; est = ra * rb; }
      else { rb = r.int(2, 9) * 100; const qq = r.int(2, 9) * 100; ra = rb * qq; a = ra + r.int(-ra / 20, ra / 20); b = rb + r.int(-8, 8); exact = a / b; est = qq; }
      const mag = 10 ** Math.floor(Math.log10(Math.max(1, est)));
      const options = r.shuffle([est, est * 10, Math.round(est / 10) || mag, est + 3 * mag].filter((v, i, arr) => arr.indexOf(v) === i));
      const correct = options.indexOf(est);
      return {
        prompt: `Welcher Überschlag passt am besten zu $${big(a)} ${op} ${big(b)}$?`,
        answer: { kind: 'choice', options: options.map(big), correct },
        steps: [{ m: `${big(ra)} ${op} ${big(rb)} = ${big(est)}`, why: 'Gerundet rechnen' }, { m: `≈ ${big(est)}`, why: `Exakt wäre es ${big(Math.round(exact * 100) / 100)}` }],
      };
    },
  },
  {
    id: 'Z10', title: 'Schriftlich addieren und subtrahieren', area: 'Zahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.e', prereqs: ['G1', 'Z7'],
    intro: 'Bei grossen Zahlen schreibst du sie stellengerecht untereinander und rechnest von rechts nach links, Stelle für Stelle, mit Übertrag.',
    tip: 'Einer unter Einer, Zehner unter Zehner. Übertrag nicht vergessen.',
    gen: (r) => {
      const a = r.int(10000, 900000), b = r.int(1000, 90000);
      if (r.bool()) return { prompt: `Berechne $${big(a)} + ${big(b)}$.`, answer: { kind: 'number', value: N(a + b), ...int }, steps: [{ m: `${big(a)} + ${big(b)}`, why: 'Stellengerecht untereinander, von rechts mit Übertrag' }, { m: big(a + b) }] };
      const [x, y] = a > b ? [a, b] : [b, a];
      return { prompt: `Berechne $${big(x)} - ${big(y)}$.`, answer: { kind: 'number', value: N(x - y), ...int }, steps: [{ m: `${big(x)} - ${big(y)}`, why: 'Stellengerecht untereinander, von rechts, ggf. entbündeln' }, { m: big(x - y) }] };
    },
  },
  {
    id: 'Z11', title: 'Division mit Rest', area: 'Zahlen', stage: 'Primar', niveau: 'alle', lp21: 'MA.1.A.3.e', prereqs: ['G4'],
    intro: 'Nicht jede Division geht auf. 23 : 4 = 5 Rest 3, denn 5 · 4 = 20 und es bleiben 3 übrig. Der Rest ist immer kleiner als der Divisor.',
    tip: 'Grösstes Vielfaches des Divisors suchen, das noch hineinpasst.',
    gen: (r) => {
      const d = r.int(3, 9), q = r.int(3, 30), rest = r.int(1, d - 1), n = d * q + rest;
      return {
        prompt: `$${n} : ${d}$ = ? Rest ?  Wie gross ist der Rest?`, answer: { kind: 'number', value: N(rest), ...int },
        steps: [{ m: `${q} · ${d} = ${q * d}`, why: 'Grösstes Vielfaches, das passt' }, { m: `${n} - ${q * d} = ${rest}`, why: `Also ${n} : ${d} = ${q} Rest ${rest}` }],
        misconceptions: q !== rest ? [{ value: N(q), msg: `${q} ist das Ergebnis der Division. Gefragt ist der Rest.` }] : [],
      };
    },
  },
];
