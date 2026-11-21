import { describe, it, expect } from 'vitest';
import { Q } from '../src/math/rational';
import { parse, evaluate, toPoly, polyEq } from '../src/math/expr';
import { check } from '../src/math/check';

const val = (s: string) => evaluate(parse(s), {}).toString();
const same = (a: string, b: string) => polyEq(toPoly(parse(a)), toPoly(parse(b)));

describe('Parser', () => {
  it('rechnet exakt', () => {
    expect(val('1/3 + 1/6')).toBe('1/2');
    expect(val('2 + 3 · 4')).toBe('14');
    expect(val('(2 + 3) * 4')).toBe('20');
    expect(val('12 : 3 : 2')).toBe('2');
    expect(val('-3^2')).toBe('-9');
    expect(val('(-3)^2')).toBe('9');
    expect(val('(-3)²')).toBe('9');
    expect(val('0,75')).toBe('3/4');
    expect(val('3 - -2')).toBe('5');
    expect(val('2 · (-3)')).toBe('-6');
    expect(val('3/8 : 3/4')).toBe('1/2');
    expect(val('1/2 · 3/4')).toBe('3/8');
    expect(val('6 : 2/3')).toBe('9');
    expect(val('12/3/2')).toBe('2');
  });
  it('implizite Multiplikation', () => {
    expect(same('2x', '2*x')).toBe(true);
    expect(same('1/2x', 'x/2')).toBe(true);
    expect(same('3(x+2)', '3x+6')).toBe(true);
    expect(same('(x+1)(x-1)', 'x^2-1')).toBe(true);
    expect(same('2x²', '2*x*x')).toBe(true);
    expect(same('ab', 'b*a')).toBe(true);
    expect(same('-x²', '-(x^2)')).toBe(true);
  });
  it('meldet Fehler verständlich', () => {
    expect(() => parse('3 +')).toThrow();
    expect(() => parse('(3 + 4')).toThrow(/Klammer/);
    expect(() => parse('3 # 4')).toThrow(/Zeichen/);
  });
});

describe('Antwortprüfung', () => {
  it('Zahlen und Formen', () => {
    const spec = { kind: 'number' as const, value: Q.of(3, 4), form: 'reduced' as const };
    expect(check(spec, '3/4').correct).toBe(true);
    expect(check(spec, '0.75').correct).toBe(false);
    const r = check(spec, '6/8');
    expect(r.correct).toBe(false);
    expect(r.formOnly).toBe(true);
    expect(check(spec, '2/3').formOnly).toBeFalsy();
    expect(check({ kind: 'number', value: Q.of(7, 3), form: 'mixed' }, '2 1/3').correct).toBe(true);
    expect(check({ kind: 'number', value: Q.of(7, 3), form: 'mixed' }, '7/3').formOnly).toBe(true);
    expect(check({ kind: 'number', value: Q.of(7, 3), form: 'improper' }, '7/3').correct).toBe(true);
    expect(check({ kind: 'number', value: Q.of(7, 3), form: 'reduced' }, '2 1/3').correct).toBe(true);
    expect(check({ kind: 'number', value: Q.of(-3, 4), form: 'reduced' }, '-3/4').correct).toBe(true);
    expect(check({ kind: 'number', value: Q.of(3, 4), form: 'decimal' }, '0,75').correct).toBe(true);
    expect(check({ kind: 'number', value: Q.of(2), form: 'reduced' }, '4/2').formOnly).toBe(true);
  });
  it('Terme und Formen', () => {
    const exp = { kind: 'expr' as const, value: '6x + 15', form: 'expanded' as const };
    expect(check(exp, '15 + 6x').correct).toBe(true);
    expect(check(exp, '3(2x + 5)').formOnly).toBe(true);
    const fac = { kind: 'expr' as const, value: '3(2x + 5)', form: 'factored' as const };
    expect(check(fac, '3(2x+5)').correct).toBe(true);
    expect(check(fac, '3 · (5 + 2x)').correct).toBe(true);
    expect(check(fac, '6x + 15').formOnly).toBe(true);
    const fac2 = { kind: 'expr' as const, value: '4x(x + 2)', form: 'factored' as const };
    expect(check(fac2, '2x(2x + 4)').formOnly).toBe(true);
    expect(check(fac2, '4(x² + 2x)').formOnly).toBe(true);
    expect(check(fac2, '4x(x+2)').correct).toBe(true);
    const mono = { kind: 'expr' as const, value: '-12xy', form: 'monomial' as const };
    expect(check(mono, '-12xy').correct).toBe(true);
    expect(check(mono, '-12yx').correct).toBe(true);
    expect(check(mono, '3x · (-4y)').formOnly).toBe(true);
    const simp = { kind: 'expr' as const, value: '2a + 7b', form: 'simplified' as const };
    expect(check(simp, '7b + 2a').correct).toBe(true);
    expect(check(simp, 'a + a + 7b').formOnly).toBe(true);
    const mis = check(simp, '9ab', [{ value: '9ab', msg: 'X' }]);
    expect(mis.misconception).toBe(true);
  });
  it('Gleichungen und Formeln', () => {
    const s = { kind: 'solution' as const, variable: 'x', value: Q.of(5) };
    expect(check(s, 'x = 5').correct).toBe(true);
    expect(check(s, '5').correct).toBe(true);
    expect(check(s, '5 = x').correct).toBe(true);
    expect(check(s, 'y = 5').invalid).toBe(true);
    const f = { kind: 'formula' as const, variable: 'h', value: '2A/g' };
    expect(check(f, 'h = 2A/g').correct).toBe(true);
    expect(check(f, 'h = 2·A:g').correct).toBe(true);
    expect(check(f, 'h = A/(2g)').correct).toBe(false);
    expect(check(f, 'h = 2h/g').correct).toBe(false);
    const f2 = { kind: 'formula' as const, variable: 'a', value: '(U - 2b)/2' };
    expect(check(f2, 'a = U/2 - b').correct).toBe(true);
  });
});
