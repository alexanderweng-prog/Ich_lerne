// Lernmodell: Mastery-Kriterium, verteilte Wiederholung, implizite Wiederholung.
//
// Zustände eines Themas:
//   new       – noch nicht begonnen
//   learning  – in Bearbeitung (Beispiel → Teillösungen → selbständiges Üben)
//   learned   – Lernkriterium erfüllt, wartet auf die erste verzögerte Prüfung
//   mastered  – auch nach mindestens einem Tag Abstand noch sicher gekonnt
//
// Nachfolgende Themen werden ab «learned» freigeschaltet. «mastered» verlangt zusätzlich
// eine erfolgreiche Wiederholung an einem späteren Tag (Bloom/Guskey: Mastery muss stabil sein).

import { SKILLS, BY_ID, ancestors, ancestorsWithDepth } from '../curriculum';

export type Status = 'new' | 'learning' | 'learned' | 'mastered';
export type Phase = 'example' | 'faded' | 'practice';

export interface Attempt { t: number; ok: boolean; assisted: boolean; review: boolean }

export interface SkillState {
  status: Status;
  phase: Phase;
  fadeStep: number;
  /** Letzte Versuche (max. 20) */
  log: Attempt[];
  /** Stabilität in Tagen: so lange hält das Wissen ungefähr */
  stability: number;
  due: number;
  reps: number;
  lapses: number;
  /** Fehlvorstellungen: Text → Anzahl */
  mis: Record<string, number>;
  total: number;
  correct: number;
  /** Aus dem Einstufungstest übernommen */
  placed?: boolean;
}

export interface Profile {
  id: string;
  name: string;
  klasse: string;
  created: number;
  placementDone: boolean;
  skills: Record<string, SkillState>;
  /** Tage mit Aktivität (YYYY-MM-DD) */
  days: string[];
}

export const DAY = 24 * 3600 * 1000;
export const MIN = 60 * 1000;

/** Lernkriterium: von den letzten 5 selbständigen Versuchen mind. 4 richtig, die letzten 2 richtig. */
export const CRITERION = { window: 5, needed: 4, lastInRow: 2 };

export function freshSkill(): SkillState {
  return { status: 'new', phase: 'example', fadeStep: 0, log: [], stability: 0, due: 0, reps: 0, lapses: 0, mis: {}, total: 0, correct: 0 };
}

export function newProfile(name: string, klasse: string): Profile {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name, klasse, created: Date.now(), placementDone: false,
    skills: Object.fromEntries(SKILLS.map((s) => [s.id, freshSkill()])),
    days: [],
  };
}

/** Fehlende Themen ergänzen (wenn neue Inhalte dazukommen). */
export function migrate(p: Profile): Profile {
  let added = false;
  for (const s of SKILLS) if (!p.skills[s.id]) { p.skills[s.id] = freshSkill(); added = true; }
  if (added) {
    // Neue Grundlagen-Themen, die unter bereits gelernten Themen liegen, gelten als gekonnt
    // (sie werden in den nächsten Tagen kurz überprüft).
    const now = Date.now();
    for (const s of SKILLS) {
      if (!isDone(p.skills[s.id])) continue;
      for (const a of ancestors(s.id)) {
        const st = p.skills[a];
        if (st.status === 'new') Object.assign(st, { status: 'learned', placed: true, stability: 2, due: now + DAY });
      }
    }
  }
  return p;
}

export const isDone = (st: SkillState) => st.status === 'learned' || st.status === 'mastered';

export function unlocked(p: Profile, id: string): boolean {
  return BY_ID[id].prereqs.every((pr) => isDone(p.skills[pr]));
}

/** Themen, die jetzt gelernt werden können (Lernfront), in Lehrplan-Reihenfolge. */
export function frontier(p: Profile): string[] {
  return SKILLS.filter((s) => !isDone(p.skills[s.id]) && unlocked(p, s.id)).map((s) => s.id);
}

export function dueReviews(p: Profile, now = Date.now()): string[] {
  return SKILLS.filter((s) => isDone(p.skills[s.id]) && p.skills[s.id].due <= now)
    .sort((a, b) => p.skills[a.id].due - p.skills[b.id].due)
    .map((s) => s.id);
}

export function criterionMet(st: SkillState): boolean {
  const own = st.log.filter((a) => !a.assisted && !a.review).slice(-CRITERION.window);
  if (own.length < CRITERION.window) {
    // Schneller Weg für sichere SuS: 4 von 4 richtig
    return own.length >= 4 && own.every((a) => a.ok);
  }
  const ok = own.filter((a) => a.ok).length;
  const lastOk = own.slice(-CRITERION.lastInRow).every((a) => a.ok);
  return ok >= CRITERION.needed && lastOk;
}

/** Fortschritt Richtung Lernkriterium, 0…1 (für die Anzeige). */
export function criterionProgress(st: SkillState): number {
  const own = st.log.filter((a) => !a.assisted && !a.review).slice(-CRITERION.window);
  let streak = 0;
  for (let i = own.length - 1; i >= 0 && own[i].ok; i--) streak++;
  return Math.min(1, Math.max(streak / 4, own.filter((a) => a.ok).length / CRITERION.window * 0.8));
}

function logAttempt(st: SkillState, a: Attempt) {
  st.log.push(a);
  if (st.log.length > 20) st.log.shift();
  st.total++;
  if (a.ok) st.correct++;
}

function today(now: number) { return new Date(now).toISOString().slice(0, 10); }
function markDay(p: Profile, now: number) {
  const d = today(now);
  if (!p.days.includes(d)) p.days.push(d);
}

export function recordMisconception(p: Profile, id: string, msg: string) {
  const st = p.skills[id];
  st.mis[msg] = (st.mis[msg] ?? 0) + 1;
}

/**
 * Ein Versuch beim Lernen eines neuen Themas. Gibt zurück, ob das Lernkriterium jetzt erfüllt ist.
 */
export function recordPractice(p: Profile, id: string, ok: boolean, assisted: boolean, now = Date.now()): boolean {
  const st = p.skills[id];
  if (st.status === 'new') st.status = 'learning';
  logAttempt(st, { t: now, ok, assisted, review: false });
  markDay(p, now);
  if (ok && !assisted) implicitCredit(p, id, now);
  if (st.status === 'learning' && criterionMet(st)) {
    st.status = 'learned';
    st.stability = 1;
    st.due = now + 1 * DAY - 2 * 3600 * 1000; // ab morgen (mit etwas Spielraum)
    return true;
  }
  return false;
}

/**
 * Ein Wiederholungsversuch.
 * confident: Selbsteinschätzung «sicher» (undefined = nicht gefragt).
 */
export function recordReview(p: Profile, id: string, ok: boolean, confident: boolean | undefined, now = Date.now()) {
  const st = p.skills[id];
  logAttempt(st, { t: now, ok, assisted: false, review: true });
  markDay(p, now);
  if (ok) {
    const factor = confident === false ? 1.6 : 2.5;
    st.stability = Math.max(1, st.stability) * factor;
    st.reps++;
    st.due = now + st.stability * DAY;
    if (st.status === 'learned') st.status = 'mastered';
    implicitCredit(p, id, now);
  } else {
    st.lapses++;
    // Sicher geglaubt, aber falsch: das ist besonders wichtig → stärker zurücksetzen.
    st.stability = confident ? 0.5 : Math.max(0.5, st.stability * 0.3);
    st.due = now + 10 * MIN;
    if (st.status === 'mastered') st.status = 'learned';
    // Zwei Fehler hintereinander in der Wiederholung → nochmals richtig lernen
    const last = st.log.filter((a) => a.review).slice(-2);
    if (last.length === 2 && last.every((a) => !a.ok)) demote(p, id);
  }
}

/** Thema muss neu gelernt werden (Beispiel wieder zeigen). */
export function demote(p: Profile, id: string) {
  const st = p.skills[id];
  st.status = 'learning';
  st.phase = 'example';
  st.fadeStep = 0;
  st.log = st.log.filter((a) => a.review); // Übungsfenster zurücksetzen
}

/**
 * Implizite Wiederholung: Wer eine Aufgabe zu einem Thema löst, wendet dessen Voraussetzungen mit an.
 * Fällige Voraussetzungen werden deshalb etwas nach hinten geschoben (je weiter entfernt, desto weniger).
 * Die Stabilität selbst wird nicht erhöht – ein expliziter Test bleibt nötig.
 */
export function implicitCredit(p: Profile, id: string, now = Date.now()) {
  for (const [pr, depth] of ancestorsWithDepth(id, 3)) {
    const st = p.skills[pr];
    if (!isDone(st)) continue;
    const push = Math.max(0.5, st.stability) * DAY * 0.5 ** depth;
    if (st.due < now + push) st.due = Math.min(now + push, now + 7 * DAY);
  }
}

/** Gemeisterte, gelernte und offene Themen zählen. */
export function stats(p: Profile) {
  const c = { new: 0, learning: 0, learned: 0, mastered: 0 };
  for (const s of SKILLS) c[p.skills[s.id].status]++;
  return c;
}

/** Wie viele Tage in Folge (bis heute oder gestern) gelernt wurde. */
export function streak(p: Profile, now = Date.now()): number {
  const set = new Set(p.days);
  let n = 0;
  let t = now;
  if (!set.has(today(t))) t -= DAY;
  while (set.has(today(t))) { n++; t -= DAY; }
  return n;
}
