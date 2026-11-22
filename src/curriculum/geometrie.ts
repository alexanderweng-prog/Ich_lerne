// Geometrie: Umfang, Fläche, Volumen, Winkel, Pythagoras, Kreis, Körper, Ähnlichkeit, Koordinaten
import { Q } from '../math/rational';
import type { Skill } from './types';
import { dec } from './fmt';

const q = (n: number, d = 1) => Q.of(n, d);
const exact = (v: Q, unit: string) => ({ kind: 'number' as const, value: v, form: 'decimal' as const, unit });
/** Gerundete Antworten mit π: Toleranz erlaubt auch das Rechnen mit π ≈ 3.14 */
const approx = (v: number, unit: string, dec2 = 2) => ({ kind: 'approx' as const, value: v, tol: Math.max(0.006, Math.abs(v) * 0.0012), dec: dec2, unit });
const r2 = (x: number) => x.toFixed(2);

export const geometrie: Skill[] = [
  {
    id: 'F1', title: 'Umfang von Rechteck und Quadrat', area: 'Geometrie', stage: 'Primar', niveau: 'alle', lp21: 'MA.2.A.3.e', prereqs: ['G1', 'G2'],
    intro: 'Der Umfang ist die Länge des Randes – einmal ganz herum. Rechteck: u = 2 · a + 2 · b. Quadrat: u = 4 · a.',
    tip: 'Alle Seiten zusammenzählen.',
    gen: (r) => {
      const a = r.int(2, 30), b = r.int(2, 30);
      return {
        prompt: `Ein Rechteck ist ${a} cm lang und ${b} cm breit. Wie gross ist sein Umfang?`, visual: { type: 'figure', shape: 'rect', labels: { a: `${a} cm`, b: `${b} cm` } },
        answer: exact(q(2 * a + 2 * b), 'cm'),
        steps: [{ m: `u = 2 · ${a} + 2 · ${b}` }, { m: `${2 * a} + ${2 * b} = ${2 * a + 2 * b}` }],
        misconceptions: [{ value: q(a * b), msg: 'Das ist der Flächeninhalt. Der Umfang ist die Länge des Randes.' }, { value: q(a + b), msg: 'Ein Rechteck hat vier Seiten: zwei Längen und zwei Breiten.' }].filter((m) => !m.value.eq(q(2 * a + 2 * b))),
      };
    },
  },
  {
    id: 'F2', title: 'Fläche von Rechteck und Quadrat', area: 'Geometrie', stage: 'Primar', niveau: 'alle', lp21: 'MA.2.A.3.e', prereqs: ['F1'],
    intro: 'Der Flächeninhalt sagt, wie viele Einheitsquadrate (z. B. cm²) hineinpassen. Rechteck: A = a · b. Die Einheit ist «Quadrat»: cm², m².',
    tip: 'Länge mal Breite – Einheit im Quadrat.',
    gen: (r) => {
      const a = r.int(2, 25), b = r.int(2, 25);
      if (r.bool(0.3)) return {
        prompt: `Ein Rechteck hat den Flächeninhalt ${a * b} m² und ist ${a} m lang. Wie breit ist es?`, visual: { type: 'figure', shape: 'rect', labels: { a: `${a} m`, b: '?' } },
        answer: exact(q(b), 'm'), steps: [{ m: `b = A : a` }, { m: `${a * b} : ${a} = ${b}` }],
      };
      return {
        prompt: `Ein Rechteck ist ${a} cm lang und ${b} cm breit. Wie gross ist sein Flächeninhalt?`, visual: { type: 'figure', shape: 'rect', labels: { a: `${a} cm`, b: `${b} cm` } },
        answer: exact(q(a * b), 'cm²'), steps: [{ m: `A = ${a} · ${b}` }, { m: `${a * b}` }],
        misconceptions: [{ value: q(2 * a + 2 * b), msg: 'Das ist der Umfang. Für die Fläche: Länge mal Breite.' }].filter((m) => !m.value.eq(q(a * b))),
      };
    },
  },
  {
    id: 'F3', title: 'Volumen des Quaders', area: 'Geometrie', stage: 'Primar', niveau: 'alle', lp21: 'MA.2.A.3.f', prereqs: ['F2'],
    intro: 'Das Volumen sagt, wie viele Einheitswürfel (z. B. cm³) hineinpassen. Quader: V = a · b · c (Länge · Breite · Höhe).',
    tip: 'Grundfläche mal Höhe.',
    gen: (r) => {
      const a = r.int(2, 15), b = r.int(2, 12), c = r.int(2, 10);
      return {
        prompt: `Ein Quader ist ${a} cm lang, ${b} cm breit und ${c} cm hoch. Wie gross ist sein Volumen?`, visual: { type: 'figure', shape: 'cuboid', labels: { a: `${a} cm`, b: `${b} cm`, c: `${c} cm` } },
        answer: exact(q(a * b * c), 'cm³'), steps: [{ m: `V = ${a} · ${b} · ${c}` }, { m: `${a * b} · ${c} = ${a * b * c}` }],
        misconceptions: [{ value: q(a + b + c), msg: 'Volumen heisst multiplizieren: Länge · Breite · Höhe.' }, { value: q(2 * (a * b + a * c + b * c)), msg: 'Das ist die Oberfläche. Gesucht ist das Volumen.' }].filter((m) => !m.value.eq(q(a * b * c))),
      };
    },
  },
  {
    id: 'F4', title: 'Fläche des Dreiecks', area: 'Geometrie', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.2.A.3.g', prereqs: ['F2', 'B9'],
    intro: 'Ein Dreieck ist halb so gross wie ein Rechteck mit gleicher Grundlinie und Höhe: A = g · h : 2. Die Höhe steht senkrecht auf der Grundlinie.',
    tip: 'Grundlinie mal Höhe, durch 2.',
    selfExplain: {
      q: 'Warum teilt man bei der Dreiecksfläche durch 2?',
      options: ['Zwei gleiche Dreiecke ergeben zusammen ein Parallelogramm mit der Fläche g · h.', 'Weil ein Dreieck drei Ecken hat.', 'Weil man immer durch 2 teilt.'],
      correct: 0,
      why: 'Verdoppelt man das Dreieck und dreht die Kopie, entsteht ein Parallelogramm (bzw. Rechteck) mit Fläche g · h.',
    },
    gen: (r) => {
      const g = r.int(3, 30), h = r.int(2, 20);
      const A = q(g * h, 2);
      return {
        prompt: `Ein Dreieck hat die Grundlinie g = ${g} cm und die Höhe h = ${h} cm. Berechne den Flächeninhalt.`, visual: { type: 'figure', shape: 'triangle', labels: { g: `${g} cm`, h: `${h} cm` } },
        answer: exact(A, 'cm²'), steps: [{ m: `A = ${g} · ${h} : 2` }, { m: `${g * h} : 2 = ${dec(A)}` }],
        misconceptions: [{ value: q(g * h), msg: 'Ein Dreieck ist nur halb so gross wie das Rechteck: durch 2 teilen.' }],
      };
    },
  },
  {
    id: 'F5', title: 'Parallelogramm und Trapez', area: 'Geometrie', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.2.A.3.g', prereqs: ['F4'],
    intro: 'Parallelogramm: A = g · h (wie ein schiefes Rechteck). Trapez: A = (a + c) : 2 · h – der Mittelwert der beiden parallelen Seiten mal die Höhe.',
    tip: 'Immer die Höhe verwenden, nicht die schräge Seite.',
    gen: (r) => {
      const h = r.int(2, 15);
      if (r.bool()) {
        const g = r.int(3, 25);
        return { prompt: `Ein Parallelogramm hat die Grundlinie ${g} m und die Höhe ${h} m. Wie gross ist die Fläche?`, visual: { type: 'figure', shape: 'parallelogram', labels: { g: `${g} m`, h: `${h} m` } }, answer: exact(q(g * h), 'm²'), steps: [{ m: `A = ${g} · ${h} = ${g * h}` }], misconceptions: [{ value: q(g * h, 2), msg: 'Beim Parallelogramm wird nicht durch 2 geteilt – das ist die Dreiecksformel.' }] };
      }
      const a = r.int(6, 25), c = r.int(2, a - 2);
      const A = q((a + c) * h, 2);
      return { prompt: `Ein Trapez hat die parallelen Seiten a = ${a} cm und c = ${c} cm, die Höhe ist ${h} cm. Berechne die Fläche.`, visual: { type: 'figure', shape: 'trapez', labels: { a: `${a} cm`, c: `${c} cm`, h: `${h} cm` } }, answer: exact(A, 'cm²'), steps: [{ m: `A = (${a} + ${c}) : 2 · ${h}` }, { m: `${dec(q(a + c, 2))} · ${h} = ${dec(A)}` }], misconceptions: [{ value: q((a + c) * h), msg: 'Die beiden parallelen Seiten werden gemittelt: (a + c) : 2.' }] };
    },
  },
  {
    id: 'F6', title: 'Oberfläche des Quaders', area: 'Geometrie', stage: 'Sek 1', niveau: 'alle', lp21: 'MA.2.A.3.g', prereqs: ['F3'],
    intro: 'Die Oberfläche ist die Summe aller sechs Seitenflächen. Je zwei gegenüberliegende sind gleich: O = 2 · (a·b + a·c + b·c). Hilfreich: das Netz zeichnen.',
    tip: 'Drei verschiedene Rechtecke, jedes kommt zweimal vor.',
    gen: (r) => {
      const a = r.int(2, 12), b = r.int(2, 10), c = r.int(2, 8);
      const O = 2 * (a * b + a * c + b * c);
      return {
        prompt: `Berechne die Oberfläche eines Quaders mit a = ${a} cm, b = ${b} cm, c = ${c} cm.`, visual: { type: 'figure', shape: 'cuboid', labels: { a: `${a} cm`, b: `${b} cm`, c: `${c} cm` } },
        answer: exact(q(O), 'cm²'), steps: [{ m: `2 · (${a} · ${b} + ${a} · ${c} + ${b} · ${c})` }, { m: `2 · (${a * b} + ${a * c} + ${b * c}) = ${O}` }],
        misconceptions: [{ value: q(O / 2), msg: 'Jede Seitenfläche kommt zweimal vor (oben/unten, vorne/hinten, links/rechts).' }, { value: q(a * b * c), msg: 'Das ist das Volumen. Gesucht ist die Oberfläche.' }].filter((m) => !m.value.eq(q(O))),
      };
    },
  },
  {
    id: 'F7', title: 'Winkel berechnen', area: 'Geometrie', stage: 'Sek 1', niveau: 'erweitert', lp21: 'MA.2.A.3.i', prereqs: ['G1'],
    intro: 'Nebenwinkel ergänzen sich zu 180°. Scheitelwinkel sind gleich gross. Die Winkelsumme im Dreieck ist 180°, im Viereck 360°.',
    tip: 'Welche Winkelsumme gilt hier? Davon die bekannten Winkel abziehen.',
    gen: (r) => {
      const v = r.int(0, 2);
      if (v === 0) { const a = r.int(20, 160); return { prompt: `Ein Winkel misst ${a}°. Wie gross ist sein Nebenwinkel?`, answer: exact(q(180 - a), '°'), steps: [{ m: `180 - ${a} = ${180 - a}`, why: 'Nebenwinkel ergänzen sich zu 180°' }], misconceptions: [{ value: q(90 - a), msg: 'Nebenwinkel ergänzen sich zu 180°, nicht zu 90°.' }].filter(() => a < 90) }; }
      if (v === 1) { const a = r.int(25, 100), b = r.int(20, 150 - a); return { prompt: `In einem Dreieck sind α = ${a}° und β = ${b}°. Wie gross ist γ?`, answer: exact(q(180 - a - b), '°'), steps: [{ m: `180 - ${a} - ${b} = ${180 - a - b}`, why: 'Winkelsumme im Dreieck: 180°' }], misconceptions: [{ value: q(360 - a - b), msg: 'Im Dreieck ist die Winkelsumme 180°, nicht 360°.' }] }; }
      const a = r.int(50, 130), b = r.int(50, 130), c = r.int(40, Math.min(130, 330 - a - b));
      return { prompt: `In einem Viereck sind drei Winkel ${a}°, ${b}° und ${c}°. Wie gross ist der vierte?`, answer: exact(q(360 - a - b - c), '°'), steps: [{ m: `360 - ${a} - ${b} - ${c} = ${360 - a - b - c}`, why: 'Winkelsumme im Viereck: 360°' }], misconceptions: [{ value: q(180 - a - b - c), msg: 'Im Viereck ist die Winkelsumme 360°.' }] };
    },
  },
  {
    id: 'F8', title: 'Satz des Pythagoras', area: 'Geometrie', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.2.A.3.h', prereqs: ['P1', 'F4'],
    intro: 'Im rechtwinkligen Dreieck gilt: a² + b² = c². c ist die Hypotenuse (gegenüber dem rechten Winkel, die längste Seite), a und b sind die Katheten.',
    tip: 'Hypotenuse gesucht: c = √(a² + b²). Kathete gesucht: a = √(c² − b²).',
    selfExplain: {
      q: 'Warum ist bei a = 3 und b = 4 die Hypotenuse 5 und nicht 7?',
      options: ['Weil die Quadrate addiert werden: 9 + 16 = 25 = 5², nicht die Seiten selbst.', 'Weil man 3 + 4 rechnen muss.', 'Weil die Hypotenuse immer 5 ist.'],
      correct: 0,
      why: 'Der Satz gilt für die Flächen der Quadrate über den Seiten, nicht für die Seitenlängen.',
    },
    gen: (r) => {
      const [a0, b0, c0] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29]]);
      const k = r.int(1, 3);
      const [a, b, c] = [a0 * k, b0 * k, c0 * k];
      if (r.bool()) return { prompt: `Ein rechtwinkliges Dreieck hat die Katheten a = ${a} cm und b = ${b} cm. Wie lang ist die Hypotenuse c?`, visual: { type: 'figure', shape: 'rtriangle', labels: { a: `${a} cm`, b: `${b} cm`, c: 'c = ?' } }, answer: exact(q(c), 'cm'), steps: [{ m: `c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}` }, { m: `c = √${c * c} = ${c}` }], misconceptions: [{ value: q(a + b), msg: 'Nicht die Seiten addieren, sondern ihre Quadrate: c² = a² + b².' }] };
      return { prompt: `Ein rechtwinkliges Dreieck hat die Hypotenuse c = ${c} cm und die Kathete a = ${a} cm. Wie lang ist die Kathete b?`, visual: { type: 'figure', shape: 'rtriangle', labels: { a: `${a} cm`, b: 'b = ?', c: `${c} cm` } }, answer: exact(q(b), 'cm'), steps: [{ m: `b² = ${c}² - ${a}² = ${c * c} - ${a * a} = ${b * b}` }, { m: `b = √${b * b} = ${b}` }], misconceptions: [{ value: q(c - a), msg: 'Mit den Quadraten rechnen: b² = c² − a².' }, { value: Q.fromDecimal(Math.sqrt(c * c + a * a).toFixed(2)), msg: 'Gesucht ist eine Kathete: c² − a², nicht c² + a².' }] };
    },
  },
  {
    id: 'F9', title: 'Kreis: Umfang und Fläche', area: 'Geometrie', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.2.A.3.i', prereqs: ['F2', 'D6', 'P1'],
    intro: 'Umfang: u = 2 · π · r = π · d. Fläche: A = π · r². π ≈ 3.14159… Achtung: d (Durchmesser) ist doppelt so lang wie r (Radius).',
    tip: 'Radius oder Durchmesser gegeben? Für die Fläche brauchst du r.',
    gen: (r) => {
      const rad = r.int(2, 25);
      const useD = r.bool(0.35);
      const lbl = useD ? { d: `d = ${2 * rad} cm` } : { r: `r = ${rad} cm` };
      const given = useD ? `den Durchmesser ${2 * rad} cm` : `den Radius ${rad} cm`;
      if (r.bool()) {
        const u = 2 * Math.PI * rad;
        return { prompt: `Ein Kreis hat ${given}. Berechne den Umfang (auf 2 Dezimalen).`, visual: { type: 'figure', shape: 'circle', labels: lbl }, answer: approx(u, 'cm'), steps: [{ m: `u = 2 · π · ${rad}` }, { m: `≈ ${r2(u)}` }], misconceptions: rad === 2 ? [] : [{ value: Q.fromDecimal(r2(Math.PI * rad * rad)), msg: 'Das ist die Fläche (π · r²). Der Umfang ist 2 · π · r.' }] };
      }
      const A = Math.PI * rad * rad;
      return { prompt: `Ein Kreis hat ${given}. Berechne die Fläche (auf 2 Dezimalen).`, visual: { type: 'figure', shape: 'circle', labels: lbl }, answer: approx(A, 'cm²'), steps: [...(useD ? [{ m: `r = ${2 * rad} : 2 = ${rad}` }] : []), { m: `A = π · ${rad}²` }, { m: `≈ ${r2(A)}` }], misconceptions: [{ value: Q.fromDecimal(r2(Math.PI * 4 * rad * rad)), msg: 'Für die Fläche brauchst du den Radius, nicht den Durchmesser.' }, { value: Q.fromDecimal(r2(2 * Math.PI * rad)), msg: 'Das ist der Umfang. Die Fläche ist π · r².' }].filter(() => rad !== 2) };
    },
  },
  {
    id: 'F10', title: 'Prisma und Zylinder', area: 'Geometrie', stage: 'Sek 2', niveau: 'erweitert', lp21: 'MA.2.A.3.i', prereqs: ['F3', 'F4', 'F9'],
    intro: 'Für alle geraden Prismen und Zylinder gilt: Volumen = Grundfläche · Höhe. Beim Zylinder ist die Grundfläche ein Kreis: V = π · r² · h.',
    tip: 'Zuerst die Grundfläche, dann mal die Höhe.',
    gen: (r) => {
      if (r.bool()) {
        const g = r.int(3, 12), hd = r.int(2, 10), h = r.int(3, 20);
        const V = q(g * hd * h, 2);
        return { prompt: `Ein Prisma hat als Grundfläche ein Dreieck mit g = ${g} cm und h = ${hd} cm. Das Prisma ist ${h} cm hoch. Berechne das Volumen.`, visual: { type: 'figure', shape: 'prism', labels: { c: `${h} cm` } }, answer: exact(V, 'cm³'), steps: [{ m: `G = ${g} · ${hd} : 2 = ${dec(q(g * hd, 2))}` }, { m: `V = ${dec(q(g * hd, 2))} · ${h} = ${dec(V)}` }], misconceptions: [{ value: q(g * hd * h), msg: 'Die Grundfläche ist ein Dreieck: g · h : 2.' }] };
      }
      const rad = r.int(2, 12), h = r.int(3, 25);
      const V = Math.PI * rad * rad * h;
      return { prompt: `Ein Zylinder hat den Radius ${rad} cm und die Höhe ${h} cm. Berechne das Volumen (auf 2 Dezimalen).`, visual: { type: 'figure', shape: 'cylinder', labels: { r: `${rad} cm`, h: `${h} cm` } }, answer: approx(V, 'cm³'), steps: [{ m: `G = π · ${rad}² ≈ ${r2(Math.PI * rad * rad)}` }, { m: `V ≈ ${r2(Math.PI * rad * rad)} · ${h} ≈ ${r2(V)}` }], misconceptions: rad === 2 ? [] : [{ value: Q.fromDecimal(r2(2 * Math.PI * rad * h)), msg: 'Grundfläche ist π · r², nicht 2 · π · r.' }] };
    },
  },
  {
    id: 'F11', title: 'Pyramide, Kegel und Kugel', area: 'Geometrie', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.2.A.3.i', prereqs: ['F10'],
    intro: 'Spitze Körper haben einen Drittel des Volumens des passenden Prismas bzw. Zylinders: Pyramide V = G · h : 3, Kegel V = π · r² · h : 3. Kugel: V = 4/3 · π · r³.',
    tip: 'Spitzkörper: Grundfläche · Höhe : 3.',
    gen: (r) => {
      const v = r.int(0, 2);
      if (v === 0) { const a = r.int(2, 12), h = r.int(3, 18); const V = q(a * a * h, 3); return { prompt: `Eine Pyramide hat eine quadratische Grundfläche mit a = ${a} cm und die Höhe ${h} cm. Berechne das Volumen.`, visual: { type: 'figure', shape: 'pyramid', labels: { a: `${a} cm`, h: `${h} cm` } }, answer: { kind: 'approx', value: V.toNumber(), tol: 0.006, dec: 2, unit: 'cm³' }, inputHint: 'auf 2 Dezimalen', steps: [{ m: `G = ${a}² = ${a * a}` }, { m: `V = ${a * a} · ${h} : 3 ≈ ${r2(V.toNumber())}` }], misconceptions: [{ value: q(a * a * h), msg: 'Bei Spitzkörpern noch durch 3 teilen.' }] }; }
      if (v === 1) { const rad = r.int(2, 10), h = r.int(3, 20); const V = Math.PI * rad * rad * h / 3; return { prompt: `Ein Kegel hat den Radius ${rad} cm und die Höhe ${h} cm. Berechne das Volumen (auf 2 Dezimalen).`, visual: { type: 'figure', shape: 'cone', labels: { r: `${rad} cm`, h: `${h} cm` } }, answer: approx(V, 'cm³'), steps: [{ m: `V = π · ${rad}² · ${h} : 3` }, { m: `≈ ${r2(V)}` }], misconceptions: [{ value: Q.fromDecimal(r2(V * 3)), msg: 'Das ist das Zylindervolumen. Beim Kegel noch durch 3.' }] }; }
      const rad = r.int(1, 12); const V = (4 / 3) * Math.PI * rad ** 3;
      return { prompt: `Eine Kugel hat den Radius ${rad} cm. Berechne ihr Volumen (auf 2 Dezimalen).`, visual: { type: 'figure', shape: 'sphere', labels: { r: `${rad} cm` } }, answer: approx(V, 'cm³'), steps: [{ m: `V = 4/3 · π · ${rad}³` }, { m: `≈ ${r2(V)}` }], misconceptions: [{ value: Q.fromDecimal(r2(Math.PI * rad * rad)), msg: 'Das ist eine Kreisfläche. Kugelvolumen: 4/3 · π · r³.' }] };
    },
  },
  {
    id: 'F12', title: 'Strecken und Ähnlichkeit', area: 'Geometrie', stage: 'Sek 3', niveau: 'erweitert', lp21: 'MA.2.A.3.k', prereqs: ['F2', 'F3', 'R1'],
    intro: 'Bei einer Streckung mit Faktor k werden alle Längen mit k multipliziert, Flächen mit k² und Volumen mit k³. Doppelte Seitenlänge → vierfache Fläche → achtfaches Volumen.',
    tip: 'Längen · k, Flächen · k², Volumen · k³.',
    selfExplain: {
      q: 'Ein Quadrat wird mit Faktor 3 gestreckt. Warum wird die Fläche 9-mal so gross?',
      options: ['Länge UND Breite werden mal 3 genommen: 3 · 3 = 9.', 'Weil man immer mal 9 rechnet.', 'Die Fläche wird nur 3-mal so gross.'],
      correct: 0,
      why: 'Fläche = Länge · Breite. Beide Faktoren werden verdreifacht.',
    },
    gen: (r) => {
      const k = r.int(2, 4);
      const v = r.int(0, 2);
      if (v === 0) { const a = r.int(2, 15); return { prompt: `Ein Dreieck hat eine Seite von ${a} cm. Es wird mit dem Faktor ${k} gestreckt. Wie lang ist diese Seite danach?`, answer: exact(q(a * k), 'cm'), steps: [{ m: `${a} · ${k} = ${a * k}` }] }; }
      if (v === 1) { const A = r.int(2, 30); return { prompt: `Eine Figur hat den Flächeninhalt ${A} cm². Sie wird mit dem Faktor ${k} gestreckt. Wie gross ist die neue Fläche?`, answer: exact(q(A * k * k), 'cm²'), steps: [{ m: `${A} · ${k}² = ${A} · ${k * k} = ${A * k * k}` }], misconceptions: [{ value: q(A * k), msg: `Flächen wachsen mit k², also mal ${k * k}.` }] }; }
      const V = r.int(2, 20);
      return { prompt: `Ein Würfel hat das Volumen ${V} cm³. Alle Kanten werden ${k}-mal so lang. Wie gross ist das neue Volumen?`, answer: exact(q(V * k ** 3), 'cm³'), steps: [{ m: `${V} · ${k}³ = ${V} · ${k ** 3} = ${V * k ** 3}` }], misconceptions: [{ value: q(V * k), msg: `Volumen wachsen mit k³, also mal ${k ** 3}.` }, { value: q(V * k * k), msg: `Das wäre der Faktor für Flächen. Volumen: k³ = ${k ** 3}.` }] };
    },
  },
  {
    id: 'F13', title: 'Punkte im Koordinatensystem', area: 'Geometrie', stage: 'Primar', niveau: 'alle', lp21: 'MA.2.A.1.h', prereqs: ['G8'],
    intro: 'Ein Punkt wird mit zwei Zahlen beschrieben: P(x|y). Zuerst die x-Koordinate (nach rechts bzw. links), dann die y-Koordinate (nach oben bzw. unten).',
    tip: 'Zuerst waagrecht (x), dann senkrecht (y) – «erst laufen, dann springen».',
    gen: (r) => {
      const x = r.int(-5, 5), y = r.int(-5, 5);
      return {
        prompt: 'Welche Koordinaten hat der Punkt A?', visual: { type: 'coords', r: 6, points: [{ label: 'A', x, y }] },
        answer: { kind: 'point', x: q(x), y: q(y) }, inputHint: 'als (x|y)',
        steps: [{ m: `x = ${x}`, why: 'waagrecht vom Ursprung' }, { m: `y = ${y}`, why: 'senkrecht' }, { m: `A(${x}|${y})` }],
      };
    },
  },
];
