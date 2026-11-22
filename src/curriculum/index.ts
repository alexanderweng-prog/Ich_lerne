import type { Skill } from './types';
import { grundlagen } from './grundlagen';
import { brueche } from './brueche';
import { terme } from './terme';
import { gleichungen } from './gleichungen';
import { gleichungenErweitert } from './gleichungen2';
import { zahlen } from './zahlen';
import { dezimal } from './dezimal';
import { potenzen } from './potenzen';
import { prozent } from './prozent';
import { groessen } from './groessen';
import { geometrie } from './geometrie';
import { funktionen, daten } from './funktionen';

export const SKILLS: Skill[] = [
  ...zahlen, ...grundlagen, ...dezimal, ...brueche, ...potenzen, ...terme, ...gleichungen, ...gleichungenErweitert,
  ...prozent, ...groessen, ...geometrie, ...funktionen, ...daten,
];
export const BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

/** Direkte Nachfolger (umgekehrte Voraussetzungs-Kanten). */
export const DEPENDENTS: Record<string, string[]> = Object.fromEntries(SKILLS.map((s) => [s.id, [] as string[]]));
for (const s of SKILLS) for (const pr of s.prereqs) DEPENDENTS[pr].push(s.id);

function closure(id: string, edges: (id: string) => string[]): Set<string> {
  const seen = new Set<string>();
  const stack = [...edges(id)];
  while (stack.length) {
    const x = stack.pop()!;
    if (seen.has(x)) continue;
    seen.add(x);
    stack.push(...edges(x));
  }
  return seen;
}

/** Alle (auch indirekten) Voraussetzungen. */
export const ancestors = (id: string) => closure(id, (x) => BY_ID[x].prereqs);
/** Alle Themen, die (auch indirekt) auf diesem aufbauen. */
export const descendants = (id: string) => closure(id, (x) => DEPENDENTS[x]);

/** Voraussetzungen mit Abstand (1 = direkt). */
export function ancestorsWithDepth(id: string, maxDepth = 3): Map<string, number> {
  const res = new Map<string, number>();
  let frontier = [id];
  for (let d = 1; d <= maxDepth; d++) {
    const next: string[] = [];
    for (const f of frontier) for (const pr of BY_ID[f].prereqs) if (!res.has(pr)) { res.set(pr, d); next.push(pr); }
    frontier = next;
  }
  return res;
}

/** Topologische Reihenfolge (Grundlagen zuerst). */
export const TOPO: string[] = (() => {
  const out: string[] = [];
  const done = new Set<string>();
  const visit = (id: string) => {
    if (done.has(id)) return;
    done.add(id);
    BY_ID[id].prereqs.forEach(visit);
    out.push(id);
  };
  SKILLS.forEach((s) => visit(s.id));
  return out;
})();

export type { Skill } from './types';
