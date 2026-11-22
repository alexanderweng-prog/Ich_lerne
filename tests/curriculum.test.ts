import { describe, it, expect } from 'vitest';
import { SKILLS, BY_ID, TOPO } from '../src/curriculum';
import { Rng } from '../src/curriculum/types';
import { check } from '../src/math/check';
import { parse } from '../src/math/expr';
import { canonicalInput } from '../src/engine/canonical';
import { Q } from '../src/math/rational';

const N = 400;

describe('Wissensgraph', () => {
  it('alle Voraussetzungen existieren, keine Zyklen', () => {
    for (const s of SKILLS) for (const p of s.prereqs) expect(BY_ID[p], `${s.id} → ${p}`).toBeDefined();
    expect(TOPO.length).toBe(SKILLS.length);
    const pos = Object.fromEntries(TOPO.map((id, i) => [id, i]));
    for (const s of SKILLS) for (const p of s.prereqs) expect(pos[p]).toBeLessThan(pos[s.id]);
  });
  it('IDs sind eindeutig', () => {
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length);
  });
});

describe.each(SKILLS.map((s) => [s.id, s.title]))('Generator %s (%s)', (id) => {
  const skill = BY_ID[id];
  it(`Musterlösung wird als richtig erkannt (${N} Zufallsaufgaben)`, () => {
    for (let seed = 1; seed <= N; seed++) {
      const t = skill.gen(new Rng(seed * 7919));
      const input = canonicalInput(t.answer);
      const res = check(t.answer, input, t.misconceptions);
      expect(res.correct, `Seed ${seed}: «${t.prompt}» Eingabe «${input}» → ${res.msg}`).toBe(true);
    }
  });
  it('Fehlvorstellungen unterscheiden sich von der richtigen Lösung', () => {
    for (let seed = 1; seed <= N; seed++) {
      const t = skill.gen(new Rng(seed * 104729));
      for (const m of t.misconceptions ?? []) {
        const input = m.value instanceof Q ? m.value.toString() : t.answer.kind === 'solution' ? `x = ${m.value}` : t.answer.kind === 'formula' ? `${t.answer.variable} = ${m.value}` : m.value;
        const r = check(t.answer, input, t.misconceptions);
        expect(r.correct, `Seed ${seed}: Fehlvorstellung «${input}» gilt als richtig bei «${t.prompt}»`).toBe(false);
        expect(r.misconception, `Seed ${seed}: «${input}» wird nicht als Fehlvorstellung erkannt bei «${t.prompt}»`).toBe(true);
      }
    }
  });
  it('Mathe im Aufgabentext ist lesbar', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const t = skill.gen(new Rng(seed));
      const parts = t.prompt.split('$').filter((_, i) => i % 2 === 1);
      for (const m of parts) for (const side of m.split('=')) {
        if (/^\s*\d+\s*$/.test(side) || /[☐√|]/.test(side)) continue;
        expect(() => parse(side), `Seed ${seed}: «${m}»`).not.toThrow();
      }
      expect(t.steps.length).toBeGreaterThan(0);
    }
  });
});
