import type { AnswerSpec, Misconception } from '../math/check';

/** Ein Rechenschritt im Lösungsweg. `m` ist Mathe-Notation (wird gesetzt), `why` die Begründung. */
export interface Step { m: string; why?: string }

export type Shape = 'rect' | 'rtriangle' | 'triangle' | 'parallelogram' | 'trapez' | 'circle' | 'cuboid' | 'cylinder' | 'prism' | 'pyramid' | 'cone' | 'sphere';

export type Visual =
  | { type: 'bar'; parts: number; shaded: number }
  /** Koordinatensystem von −r bis r mit Punkten und/oder Geraden y = m·x + q */
  | { type: 'coords'; r?: number; points?: Array<{ label: string; x: number; y: number }>; lines?: Array<{ m: number; q: number }> }
  /** Skizze (nicht massstäblich) mit Beschriftungen, z. B. { a: '5 cm' } */
  | { type: 'figure'; shape: Shape; labels: Partial<Record<string, string>> };

export interface Task {
  /** Text; Mathe steht zwischen $…$ */
  prompt: string;
  answer: AnswerSpec;
  /** Lösungsweg: dient als Lösungsbeispiel, für das Ausblenden (Fading) und als gestufte Hilfe. */
  steps: Step[];
  misconceptions?: Misconception[];
  visual?: Visual;
  /** Kurzer Hinweis zur Eingabeform, z. B. "als vollständig gekürzter Bruch". */
  inputHint?: string;
}

export type Area =
  | 'Zahlen' | 'Grundlagen' | 'Dezimalzahlen' | 'Brüche' | 'Potenzen' | 'Terme' | 'Gleichungen'
  | 'Prozent' | 'Grössen' | 'Geometrie' | 'Funktionen' | 'Daten';

export interface SelfExplain {
  q: string;
  options: string[];
  correct: number;
  why: string;
}

export interface Skill {
  id: string;
  title: string;
  area: Area;
  /** Typische Schulstufe (vorläufig, an Lehrmittel anpassen). */
  stage: 'Zyklus 1' | 'Primar' | 'Sek 1' | 'Sek 2' | 'Sek 3';
  /** 'alle' = Grundanspruch; 'erweitert' = v. a. höheres Niveau (vorläufig). */
  niveau: 'alle' | 'erweitert';
  /** Lehrplan 21 (Thurgau): Kompetenz und Kompetenzstufe, z. B. 'MA.1.A.3.i' */
  lp21: string;
  prereqs: string[];
  /** Kurze Erklärung (2–4 Sätze). */
  intro: string;
  /** Strategie-Tipp, erste Stufe der Hilfe. */
  tip: string;
  selfExplain?: SelfExplain;
  gen: (r: Rng) => Task;
}

// ---------- Zufall (mit Startwert, damit Tests reproduzierbar sind) ----------

export class Rng {
  private s: number;
  constructor(seed = Date.now()) { this.s = seed >>> 0; }
  next(): number {
    // mulberry32
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min: number, max: number): number { return min + Math.floor(this.next() * (max - min + 1)); }
  /** Ganze Zahl ≠ 0 */
  nz(min: number, max: number): number { let v = 0; while (v === 0) v = this.int(min, max); return v; }
  pick<T>(a: readonly T[]): T { return a[Math.floor(this.next() * a.length)]; }
  bool(p = 0.5): boolean { return this.next() < p; }
  shuffle<T>(a: T[]): T[] {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    return b;
  }
}
