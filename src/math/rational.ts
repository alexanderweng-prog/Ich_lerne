// Exakte rationale Zahlen auf BigInt-Basis.
// Mathe-Apps dürfen keine Rundungsfehler machen: 1/3 + 1/6 muss exakt 1/2 sein.

function bgcd(a: bigint, b: bigint): bigint {
  if (a < 0n) a = -a;
  if (b < 0n) b = -b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

export class Q {
  readonly n: bigint;
  readonly d: bigint;

  constructor(n: bigint | number, d: bigint | number = 1n) {
    let nn = BigInt(n);
    let dd = BigInt(d);
    if (dd === 0n) throw new DivisionByZero();
    if (dd < 0n) {
      nn = -nn;
      dd = -dd;
    }
    const g = bgcd(nn, dd) || 1n;
    this.n = nn / g;
    this.d = dd / g;
  }

  static of(n: number, d = 1): Q {
    return new Q(BigInt(n), BigInt(d));
  }

  /** Dezimalstring wie "0.75" oder "-1.2" exakt einlesen. */
  static fromDecimal(s: string): Q {
    const neg = s.startsWith('-');
    const t = neg ? s.slice(1) : s;
    const [int, frac = ''] = t.split('.');
    const n = BigInt((int || '0') + frac);
    const d = 10n ** BigInt(frac.length);
    return new Q(neg ? -n : n, d);
  }

  add(o: Q): Q { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o: Q): Q { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o: Q): Q { return new Q(this.n * o.n, this.d * o.d); }
  div(o: Q): Q {
    if (o.n === 0n) throw new DivisionByZero();
    return new Q(this.n * o.d, this.d * o.n);
  }
  neg(): Q { return new Q(-this.n, this.d); }
  pow(k: number): Q {
    if (!Number.isInteger(k)) throw new Error('Nur ganzzahlige Exponenten');
    if (k < 0) return Q.of(1).div(this.pow(-k));
    let r = Q.of(1);
    for (let i = 0; i < k; i++) r = r.mul(this);
    return r;
  }
  eq(o: Q): boolean { return this.n === o.n && this.d === o.d; }
  lt(o: Q): boolean { return this.n * o.d < o.n * this.d; }
  isZero(): boolean { return this.n === 0n; }
  isInt(): boolean { return this.d === 1n; }
  toNumber(): number { return Number(this.n) / Number(this.d); }
  toString(): string { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}

export class DivisionByZero extends Error {
  constructor() { super('Division durch 0'); }
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}
