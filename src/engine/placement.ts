// Adaptiver Einstufungstest auf dem Wissensgraphen.
// Idee: Wer ein Thema sicher kann, kann (sehr wahrscheinlich) auch dessen Voraussetzungen.
// Wer es nicht kann, kann die darauf aufbauenden Themen auch nicht.
// Deshalb wird jeweils ein Thema «in der Mitte» des noch unklaren Bereichs geprüft –
// ähnlich wie bei einer binären Suche. So reichen meist 10–20 Aufgaben statt 40.

import { SKILLS, TOPO, ancestors, descendants } from '../curriculum';
import type { Profile } from './model';
import { DAY } from './model';

export const MAX_QUESTIONS = 30;

export class Placement {
  unknown = new Set(SKILLS.map((s) => s.id));
  known = new Set<string>();
  notKnown = new Set<string>();
  asked = 0;
  current: string | null = null;
  /** Bei Auswahlaufgaben (Raten möglich) braucht es zwei richtige Antworten. */
  private needSecond = false;

  next(): string | null {
    if (this.needSecond && this.current) return this.current;
    if (this.unknown.size === 0 || this.asked >= MAX_QUESTIONS) return (this.current = null);
    let best: string | null = null;
    let bestScore = -1;
    const mid = TOPO.length / 2;
    for (const id of TOPO) {
      if (!this.unknown.has(id)) continue;
      const a = [...ancestors(id)].filter((x) => this.unknown.has(x)).length;
      const d = [...descendants(id)].filter((x) => this.unknown.has(x)).length;
      const score = Math.min(a + 1, d + 1) * 100 - Math.abs(TOPO.indexOf(id) - mid);
      if (score > bestScore) { bestScore = score; best = id; }
    }
    return (this.current = best);
  }

  answer(ok: boolean, wasChoice: boolean) {
    const id = this.current;
    if (!id) return;
    this.asked++;
    if (ok && wasChoice && !this.needSecond) { this.needSecond = true; return; }
    this.needSecond = false;
    if (ok) {
      for (const x of [id, ...ancestors(id)]) if (this.unknown.delete(x)) this.known.add(x);
    } else {
      for (const x of [id, ...descendants(id)]) if (this.unknown.delete(x)) this.notKnown.add(x);
    }
  }

  get progress(): number {
    return 1 - this.unknown.size / SKILLS.length;
  }

  /** Ergebnis ins Profil übernehmen. Unklare Themen gelten als «noch nicht gekonnt». */
  apply(p: Profile, now = Date.now()) {
    let i = 0;
    for (const id of TOPO) {
      if (!this.known.has(id)) continue;
      const st = p.skills[id];
      if (st.status === 'mastered' || st.status === 'learned') continue;
      st.status = 'learned';
      st.placed = true;
      st.stability = 2;
      // Bestätigung verteilt über die nächsten Tage (Grundlagen zuerst)
      st.due = now + (1 + (i++ % 4)) * DAY;
    }
    p.placementDone = true;
  }
}
