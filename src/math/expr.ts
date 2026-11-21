// Parser, Auswertung und Normalform für Schülereingaben.
// Unterstützt: ganze Zahlen, Dezimalzahlen (Punkt oder Komma), Variablen (einzelne Buchstaben),
// + − · * : / ^ ² ³, Klammern, implizite Multiplikation (2x, 3(x+1), ab).
// Konvention: 3/4x = (3/4)·x (links nach rechts), so wie man es liest.

import { Q } from './rational';

export type Node =
  | { t: 'num'; v: Q; raw: string }
  | { t: 'var'; name: string }
  | { t: 'neg'; e: Node }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; l: Node; r: Node; colon?: boolean }
  | { t: 'par'; e: Node };

export class ParseError extends Error {}

type Tok = { k: 'num'; raw: string } | { k: 'var'; name: string } | { k: 'op'; v: string };

function tokenize(src: string): Tok[] {
  const s = src
    .replace(/[−–]/g, '-')
    .replace(/[·×⋅]/g, '*')
    .replace(/÷/g, ':')
    .replace(/\s+/g, '');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9]/.test(c) || ((c === '.' || c === ',') && /[0-9]/.test(s[i + 1] ?? ''))) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      if ((s[j] === '.' || s[j] === ',') && /[0-9]/.test(s[j + 1] ?? '')) {
        j++;
        while (j < s.length && /[0-9]/.test(s[j])) j++;
      }
      out.push({ k: 'num', raw: s.slice(i, j).replace(',', '.') });
      i = j;
    } else if (/[a-zA-Z]/.test(c)) {
      out.push({ k: 'var', name: c });
      i++;
    } else if ('+-*/:^()²³'.includes(c)) {
      out.push({ k: 'op', v: c });
      i++;
    } else if (c === '[' || c === '{') {
      out.push({ k: 'op', v: '(' });
      i++;
    } else if (c === ']' || c === '}') {
      out.push({ k: 'op', v: ')' });
      i++;
    } else {
      throw new ParseError(`Unbekanntes Zeichen «${c}»`);
    }
  }
  return out;
}

export function parse(src: string): Node {
  const toks = tokenize(src);
  if (toks.length === 0) throw new ParseError('Leere Eingabe');
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.k === 'op' && (peek() as { v: string }).v === v;

  function expr(): Node {
    let l = unary();
    while (isOp('+') || isOp('-')) {
      const op = (toks[p++] as { v: string }).v as '+' | '-';
      l = { t: 'bin', op, l, r: term() };
    }
    return l;
  }
  // Ein Summand nach + oder −: kein weiteres Vorzeichen nötig, aber erlaubt (3 + -2).
  function term(): Node {
    return unaryTerm();
  }
  function unary(): Node {
    return unaryTerm();
  }
  function unaryTerm(): Node {
    if (isOp('-')) { p++; return { t: 'neg', e: unaryTerm() }; }
    if (isOp('+')) { p++; return unaryTerm(); }
    return product();
  }
  function product(): Node {
    let l = power();
    for (;;) {
      if (isOp('*') || isOp('/') || isOp(':')) {
        const raw = (toks[p++] as { v: string }).v;
        const op = raw === '*' ? '*' : '/';
        let r: Node;
        if (isOp('-')) { p++; r = { t: 'neg', e: power() }; } else r = power();
        l = raw === ':' ? { t: 'bin', op, l, r, colon: true } : { t: 'bin', op, l, r };
      } else if (peek() && (peek().k === 'var' || isOp('('))) {
        l = { t: 'bin', op: '*', l, r: power() };
      } else break;
    }
    return l;
  }
  function power(): Node {
    const base = primary();
    if (isOp('^')) {
      p++;
      let ex: Node;
      if (isOp('-')) { p++; ex = { t: 'neg', e: primary() }; } else ex = primary();
      return { t: 'bin', op: '^', l: base, r: ex };
    }
    if (isOp('²')) { p++; return { t: 'bin', op: '^', l: base, r: num('2') }; }
    if (isOp('³')) { p++; return { t: 'bin', op: '^', l: base, r: num('3') }; }
    return base;
  }
  function primary(): Node {
    const tk = peek();
    if (!tk) throw new ParseError('Ausdruck endet unerwartet');
    if (tk.k === 'num') {
      p++;
      // Zahlenbruch wie 3/4 bindet am stärksten: 3/8 : 3/4 = (3/8) : (3/4), 3/4x = (3/4)·x
      const t1 = toks[p], t2 = toks[p + 1], t3 = toks[p + 2];
      if (t1?.k === 'op' && t1.v === '/' && t2?.k === 'num' && !(t3?.k === 'op' && (t3.v === '^' || t3.v === '²' || t3.v === '³'))) {
        p += 2;
        return { t: 'bin', op: '/', l: num(tk.raw), r: num(t2.raw) };
      }
      return num(tk.raw);
    }
    if (tk.k === 'var') { p++; return { t: 'var', name: tk.name }; }
    if (isOp('(')) {
      p++;
      const e = expr();
      if (!isOp(')')) throw new ParseError('Klammer wird nicht geschlossen');
      p++;
      return { t: 'par', e };
    }
    throw new ParseError(`Unerwartetes Zeichen «${(tk as { v: string }).v}»`);
  }

  const e = expr();
  if (p < toks.length) {
    const tk = toks[p];
    if (tk.k === 'op' && tk.v === ')') throw new ParseError('Zu viele schliessende Klammern');
    throw new ParseError('Eingabe konnte nicht ganz gelesen werden');
  }
  return e;
}

function num(raw: string): Node {
  return { t: 'num', v: raw.includes('.') ? Q.fromDecimal(raw) : new Q(BigInt(raw)), raw };
}

// ---------- Auswertung ----------

export function evaluate(n: Node, env: Record<string, Q>): Q {
  switch (n.t) {
    case 'num': return n.v;
    case 'var': {
      const v = env[n.name];
      if (!v) throw new Error(`Variable ${n.name} unbekannt`);
      return v;
    }
    case 'neg': return evaluate(n.e, env).neg();
    case 'par': return evaluate(n.e, env);
    case 'bin': {
      const l = evaluate(n.l, env);
      const r = evaluate(n.r, env);
      switch (n.op) {
        case '+': return l.add(r);
        case '-': return l.sub(r);
        case '*': return l.mul(r);
        case '/': return l.div(r);
        case '^': {
          if (!r.isInt() || r.n > 12n || r.n < -12n) throw new Error('Exponent nicht unterstützt');
          return l.pow(Number(r.n));
        }
      }
    }
  }
}

export function variables(n: Node, acc = new Set<string>()): Set<string> {
  if (n.t === 'var') acc.add(n.name);
  else if (n.t === 'neg' || n.t === 'par') variables(n.e, acc);
  else if (n.t === 'bin') { variables(n.l, acc); variables(n.r, acc); }
  return acc;
}

// ---------- Polynom-Normalform (für Terme) ----------
// Monom-Schlüssel: "x^2*y" o.ä., sortiert. Leerer Schlüssel = Konstante.

export type Poly = Map<string, Q>;

function monoKey(m: Record<string, number>): string {
  return Object.keys(m).filter((k) => m[k] !== 0).sort().map((k) => (m[k] === 1 ? k : `${k}^${m[k]}`)).join('*');
}
function parseKey(k: string): Record<string, number> {
  const m: Record<string, number> = {};
  if (!k) return m;
  for (const part of k.split('*')) {
    const [v, e] = part.split('^');
    m[v] = e ? Number(e) : 1;
  }
  return m;
}
function padd(a: Poly, b: Poly, sign = 1): Poly {
  const r: Poly = new Map(a);
  for (const [k, v] of b) {
    const nv = (r.get(k) ?? Q.of(0)).add(sign === 1 ? v : v.neg());
    if (nv.isZero()) r.delete(k); else r.set(k, nv);
  }
  return r;
}
function pmul(a: Poly, b: Poly): Poly {
  let r: Poly = new Map();
  for (const [ka, va] of a) for (const [kb, vb] of b) {
    const ma = parseKey(ka), mb = parseKey(kb);
    for (const [v, e] of Object.entries(mb)) ma[v] = (ma[v] ?? 0) + e;
    r = padd(r, new Map([[monoKey(ma), va.mul(vb)]]));
  }
  return r;
}
function constOf(p: Poly): Q | null {
  if (p.size === 0) return Q.of(0);
  if (p.size === 1 && p.has('')) return p.get('')!;
  return null;
}

export class NotPolynomial extends Error {}

export function toPoly(n: Node): Poly {
  switch (n.t) {
    case 'num': return n.v.isZero() ? new Map() : new Map([['', n.v]]);
    case 'var': return new Map([[n.name, Q.of(1)]]);
    case 'neg': return padd(new Map(), toPoly(n.e), -1);
    case 'par': return toPoly(n.e);
    case 'bin': {
      const l = toPoly(n.l);
      const r = toPoly(n.r);
      switch (n.op) {
        case '+': return padd(l, r);
        case '-': return padd(l, r, -1);
        case '*': return pmul(l, r);
        case '/': {
          const c = constOf(r);
          if (!c || c.isZero()) throw new NotPolynomial('Division durch einen Term mit Variable');
          return pmul(l, new Map([['', Q.of(1).div(c)]]));
        }
        case '^': {
          const c = constOf(r);
          if (!c || !c.isInt() || c.n < 0n || c.n > 10n) throw new NotPolynomial('Exponent nicht unterstützt');
          let res: Poly = new Map([['', Q.of(1)]]);
          for (let i = 0; i < Number(c.n); i++) res = pmul(res, l);
          return res;
        }
      }
    }
  }
}

export function polyEq(a: Poly, b: Poly): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) { const w = b.get(k); if (!w || !w.eq(v)) return false; }
  return true;
}

// ---------- Strukturprüfungen (Form der Antwort) ----------

const strip = (n: Node): Node => (n.t === 'par' ? strip(n.e) : n);
const isSum = (n: Node): boolean => {
  const s = strip(n);
  return (s.t === 'bin' && (s.op === '+' || s.op === '-')) || (s.t === 'neg' && isSum(s.e));
};

/** Keine Klammer mehr, die noch ausmultipliziert werden könnte. */
export function isExpanded(n: Node): boolean {
  switch (n.t) {
    case 'num': case 'var': return true;
    case 'neg': return n.e.t === 'par' && isSum(n.e) ? false : isExpanded(n.e);
    case 'par': return isExpanded(n.e);
    case 'bin':
      if (n.op === '*' && (isSum(n.l) || isSum(n.r))) return false;
      if (n.op === '^' && isSum(n.l)) return false;
      if (n.op === '/' && isSum(n.l)) return false;
      if ((n.op === '-') && n.r.t === 'par' && isSum(n.r)) return false;
      return isExpanded(n.l) && isExpanded(n.r);
  }
}

/** Anzahl Summanden auf oberster Ebene. */
export function countSummands(n: Node): number {
  if (n.t === 'bin' && (n.op === '+' || n.op === '-')) return countSummands(n.l) + countSummands(n.r);
  if (n.t === 'neg') return countSummands(n.e);
  return 1;
}

/** Ist die Antwort ein Produkt, das eine Summe in Klammern enthält? (z. B. 3(x+2)) */
export function isProductWithSum(n: Node): boolean {
  const s = strip(n);
  if (s.t === 'neg') return isProductWithSum(s.e);
  if (s.t !== 'bin' || s.op !== '*') return false;
  const factors: Node[] = [];
  const collect = (m: Node) => {
    const q = m.t === 'par' && !isSum(m) ? m.e : m;
    if (q.t === 'bin' && q.op === '*') { collect(q.l); collect(q.r); } else factors.push(q);
  };
  collect(s);
  return factors.some(isSum);
}

/** Gemeinsamer Faktor der Koeffizienten (ganzzahlig) und gemeinsame Variablen eines Polynoms. */
export function commonFactor(p: Poly): { num: number; vars: string[] } {
  let g = 0n;
  let allNeg = true;
  for (const v of p.values()) {
    if (!v.isInt()) return { num: 1, vars: [] };
    let a = v.n < 0n ? -v.n : v.n;
    if (v.n > 0n) allNeg = false;
    let b = g;
    while (b) [a, b] = [b, a % b];
    g = a;
  }
  const keys = [...p.keys()].map(parseKey);
  const vars = keys.length
    ? Object.keys(keys[0]).filter((v) => keys.every((m) => (m[v] ?? 0) > 0))
    : [];
  void allNeg;
  return { num: Number(g || 1n), vars };
}

/** Ausdruck in gut lesbaren Text (für Lösungen). */
export function polyToString(p: Poly, order?: string[]): string {
  const keys = [...p.keys()].sort((a, b) => {
    const deg = (k: string) => Object.values(parseKey(k)).reduce((s, e) => s + e, 0);
    if (order) {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
    return deg(b) - deg(a) || a.localeCompare(b);
  });
  if (keys.length === 0) return '0';
  let s = '';
  keys.forEach((k, i) => {
    const c = p.get(k)!;
    const neg = c.n < 0n;
    const abs = neg ? c.neg() : c;
    const mono = k.split('*').filter(Boolean).map((part) => part.replace(/\^2$/, '²').replace(/\^3$/, '³')).join('');
    let coef = abs.toString();
    if (k && abs.eq(Q.of(1))) coef = '';
    else if (k && !abs.isInt()) coef = `${abs.toString()}`;
    const body = coef + mono;
    s += i === 0 ? (neg ? '−' + body : body) : (neg ? ' − ' + body : ' + ' + body);
  });
  return s;
}
