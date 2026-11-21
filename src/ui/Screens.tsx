import { useState } from 'preact/hooks';
import { BY_ID, SKILLS } from '../curriculum';
import type { Area } from '../curriculum/types';
import { dueReviews, frontier, stats, streak, unlocked, isDone, type Status } from '../engine/model';
import { useApp } from './ctx';

const STATUS_LABEL: Record<Status, string> = { new: 'offen', learning: 'begonnen', learned: 'gelernt', mastered: 'gemeistert' };
export const AREAS: Area[] = ['Grundlagen', 'Brüche', 'Terme', 'Gleichungen'];

export function Home() {
  const { profile, go, update } = useApp();
  const due = dueReviews(profile);
  const front = frontier(profile);
  const c = stats(profile);
  const s = streak(profile);
  const doneCount = c.learned + c.mastered;
  const hasDone = doneCount > 0;

  if (!profile.placementDone) {
    return (
      <section class="card">
        <h2>Willkommen, {profile.name}!</h2>
        <p>Diese App führt dich Schritt für Schritt durch die Mathematik – von den Grundlagen bis zum Stoff der 3. Sek. Ein neues Thema kommt erst, wenn das vorherige sitzt.</p>
        <p>Zuerst schauen wir, was du schon kannst.</p>
        <div class="row">
          <button class="btn primary" onClick={() => go({ name: 'placement' })}>Einstufungstest starten</button>
          <button class="btn ghost" onClick={() => update((p) => { p.placementDone = true; })}>Ohne Test ganz von vorne beginnen</button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section class="stats">
        <div><span class="num">{c.mastered}</span><span class="lbl">gemeistert</span></div>
        <div><span class="num">{c.learned}</span><span class="lbl">gelernt</span></div>
        <div><span class="num">{SKILLS.length - doneCount}</span><span class="lbl">offen</span></div>
        <div><span class="num">{s}</span><span class="lbl">{s === 1 ? 'Tag' : 'Tage'} in Folge</span></div>
      </section>

      {due.length > 0 && (
        <section class="card accent">
          <h2>Zuerst wiederholen</h2>
          <p>{due.length} {due.length === 1 ? 'Thema ist' : 'Themen sind'} zur Wiederholung fällig. Wiederholen im richtigen Abstand ist der wirksamste Weg, Gelerntes zu behalten.</p>
          <div class="row"><button class="btn primary" onClick={() => go({ name: 'review' })}>Wiederholung starten ({Math.min(due.length, 12)} Aufgaben)</button></div>
        </section>
      )}

      <section class="card">
        <h2>Weiterlernen</h2>
        {front.length === 0 ? <p>Du hast alle Themen dieses Lernpfads gelernt. Stark! Halte sie mit Wiederholungen frisch.</p> : (
          <>
            <p class="muted">Diese Themen sind jetzt freigeschaltet. Du kannst wählen:</p>
            <div class="topic-list">
              {front.slice(0, 4).map((id) => {
                const sk = BY_ID[id];
                const st = profile.skills[id];
                return (
                  <button key={id} class="topic" onClick={() => go({ name: 'learn', id })}>
                    <span class="eyebrow">{sk.area}</span>
                    <span class="t">{sk.title}</span>
                    <span class={`badge ${st.status}`}>{st.status === 'learning' ? 'begonnen' : 'neu'}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section class="row wrap">
        <button class="btn" onClick={() => go({ name: 'map' })}>Wissenskarte</button>
        {hasDone && <button class="btn" onClick={() => go({ name: 'review', mixed: true })}>Gemischt üben</button>}
      </section>
    </>
  );
}

export function MapView() {
  const { profile, go } = useApp();
  const [sel, setSel] = useState<string | null>(null);
  const sk = sel ? BY_ID[sel] : null;
  const st = sel ? profile.skills[sel] : null;
  return (
    <>
      <section class="card">
        <h2>Wissenskarte</h2>
        <p class="muted">Jedes Kästchen ist ein Thema. Pfeile gibt es keine – aber ein Thema wird erst frei, wenn seine Voraussetzungen gelernt sind.</p>
        <div class="legend">
          <span class="chip mastered">gemeistert</span><span class="chip learned">gelernt</span><span class="chip learning">begonnen</span><span class="chip new avail">frei</span><span class="chip new">gesperrt</span>
        </div>
        <div class="map">
          {AREAS.map((a) => (
            <div key={a} class="area">
              <h3>{a}</h3>
              {SKILLS.filter((s) => s.area === a).map((s) => {
                const ss = profile.skills[s.id];
                const avail = ss.status === 'new' && unlocked(profile, s.id);
                return (
                  <button key={s.id} class={`chip ${ss.status} ${avail ? 'avail' : ''} ${sel === s.id ? 'sel' : ''}`} onClick={() => setSel(s.id)}>
                    <span class="id">{s.id}</span> {s.title}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>
      {sk && st && (
        <section class="card">
          <div class="eyebrow">{sk.id} · {sk.area} · {sk.stage} · Niveau: {sk.niveau === 'alle' ? 'alle' : 'erweitert'} · LP21: {sk.lp21}</div>
          <h2>{sk.title}</h2>
          <p>Status: <strong>{STATUS_LABEL[st.status]}</strong>{st.placed ? ' (aus Einstufungstest)' : ''}</p>
          {st.total > 0 && <p>Bisher {st.correct} von {st.total} Aufgaben richtig.</p>}
          {isDone(st) && <p>Nächste Wiederholung: {new Date(st.due).toLocaleDateString('de-CH')}</p>}
          {sk.prereqs.length > 0 && <p class="muted">Voraussetzungen: {sk.prereqs.map((x) => `${BY_ID[x].title} (${STATUS_LABEL[profile.skills[x].status]})`).join(', ')}</p>}
          <div class="row">
            {unlocked(profile, sk.id) && <button class="btn primary" onClick={() => go({ name: 'learn', id: sk.id })}>{isDone(st) ? 'Zusätzlich üben' : 'Lernen'}</button>}
          </div>
        </section>
      )}
    </>
  );
}

export function About() {
  return (
    <section class="card prose">
      <h2>Wie diese App funktioniert</h2>
      <h3>Mastery-Prinzip</h3>
      <p>Ein Thema wird erst freigeschaltet, wenn seine Voraussetzungen sitzen. «Gelernt» heisst: von den letzten 5 Aufgaben ohne Hilfe mindestens 4 richtig, die letzten zwei in Folge. «Gemeistert» heisst: auch nach mindestens einem Tag Abstand noch richtig.</p>
      <h3>Lernschritte</h3>
      <p>1. Kurze Erklärung und vollständig gelöstes Beispiel, danach eine Denkfrage. 2. Lösungswege ergänzen – die Vorgaben werden schrittweise weniger. 3. Selbständig üben, Tipps auf Wunsch.</p>
      <h3>Wiederholen</h3>
      <p>Gelernte Themen kommen in wachsenden Abständen wieder (ca. 1, 2–3, 6, 15 … Tage). Wer ein schwieriges Thema löst, wiederholt dabei auch die Grundlagen – diese werden dann etwas später fällig. Wiederholungen sind gemischt, damit du lernst, das passende Verfahren selbst zu erkennen.</p>
      <h3>Daten</h3>
      <p>Alle Daten bleiben auf diesem Gerät. Nur wenn du deinen Lernstand exportierst, entsteht eine Datei, die du der Lehrperson geben kannst.</p>
    </section>
  );
}
