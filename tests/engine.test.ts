import { describe, it, expect } from 'vitest';
import { SKILLS, TOPO, ancestors } from '../src/curriculum';
import { Placement, MAX_QUESTIONS } from '../src/engine/placement';
import { newProfile, recordPractice, recordReview, frontier, dueReviews, DAY } from '../src/engine/model';
import { Rng } from '../src/curriculum/types';

describe('Einstufungstest', () => {
  it('findet den Wissensstand einer konsistenten Schülerin', () => {
    const rng = new Rng(42);
    for (let trial = 0; trial < 40; trial++) {
      // Zufälliger, nach unten abgeschlossener Wissensstand
      const knows = new Set<string>();
      const cut = rng.int(0, TOPO.length);
      for (const id of TOPO.slice(0, cut)) if (rng.bool(0.85) && [...ancestors(id)].every((a) => knows.has(a))) knows.add(id);
      const pl = new Placement();
      let id: string | null;
      while ((id = pl.next())) pl.answer(knows.has(id), false);
      expect(pl.asked).toBeLessThanOrEqual(MAX_QUESTIONS);
      if (pl.unknown.size === 0) expect([...pl.known].sort()).toEqual([...knows].sort());
    }
  });
  it('braucht deutlich weniger Fragen als Themen', () => {
    const pl = new Placement();
    let id: string | null;
    const knows = new Set(TOPO.slice(0, 15).filter((x) => x.startsWith('G') || x === 'B1' || x === 'B2'));
    while ((id = pl.next())) pl.answer(knows.has(id), false);
    expect(pl.asked).toBeLessThan(SKILLS.length / 2);
  });
  it('kompletter Anfänger: Start bei null', () => {
    const pl = new Placement();
    while (pl.next()) pl.answer(false, false);
    const p = newProfile('Test', '1a');
    pl.apply(p);
    expect(frontier(p)).toEqual(['G1']);
  });
});

describe('Mastery-Modell', () => {
  it('Lernkriterium, dann verzögerte Prüfung', () => {
    const p = newProfile('A', '1a');
    const t0 = Date.now();
    expect(recordPractice(p, 'G1', true, false, t0)).toBe(false);
    expect(recordPractice(p, 'G1', false, false, t0)).toBe(false);
    expect(recordPractice(p, 'G1', true, false, t0)).toBe(false);
    expect(recordPractice(p, 'G1', true, true, t0)).toBe(false); // mit Hilfe zählt nicht
    expect(recordPractice(p, 'G1', true, false, t0)).toBe(false);
    expect(recordPractice(p, 'G1', true, false, t0)).toBe(true);
    expect(p.skills.G1.status).toBe('learned');
    expect(frontier(p)).toContain('G2');
    expect(dueReviews(p, t0)).toEqual([]);
    expect(dueReviews(p, t0 + DAY)).toEqual(['G1']);
    recordReview(p, 'G1', true, true, t0 + DAY);
    expect(p.skills.G1.status).toBe('mastered');
    expect(p.skills.G1.due).toBeGreaterThan(t0 + 3 * DAY);
  });
  it('zwei Fehler in der Wiederholung → neu lernen', () => {
    const p = newProfile('B', '1a');
    const t0 = Date.now();
    for (let i = 0; i < 4; i++) recordPractice(p, 'G1', true, false, t0);
    expect(p.skills.G1.status).toBe('learned');
    recordReview(p, 'G1', false, undefined, t0 + DAY);
    recordReview(p, 'G1', false, undefined, t0 + DAY);
    expect(p.skills.G1.status).toBe('learning');
    expect(p.skills.G1.phase).toBe('example');
  });
  it('implizite Wiederholung schiebt fällige Voraussetzungen', () => {
    const p = newProfile('C', '1a');
    const t0 = Date.now();
    for (const id of ['G1', 'G2']) for (let i = 0; i < 4; i++) recordPractice(p, id, true, false, t0);
    p.skills.G1.due = t0 + DAY; // fällig morgen
    recordPractice(p, 'G3', true, false, t0 + DAY);
    expect(p.skills.G1.due).toBeGreaterThan(t0 + DAY);
  });
});
