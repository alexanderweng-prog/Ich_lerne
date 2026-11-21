import { useRef, useState } from 'preact/hooks';
import { BY_ID, TOPO } from '../curriculum';
import { Rng, type Task } from '../curriculum/types';
import { Placement } from '../engine/placement';
import { frontier } from '../engine/model';
import { useApp } from './ctx';
import { TaskView } from './TaskView';

const rng = new Rng();

export function PlacementView() {
  const { profile, update, go } = useApp();
  const pl = useRef(new Placement());
  const [started, setStarted] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [finished, setFinished] = useState(false);

  function advance() {
    const id = pl.current.next();
    if (!id) {
      update((p) => pl.current.apply(p));
      setFinished(true);
      setTask(null);
    } else setTask(BY_ID[id].gen(rng));
  }

  if (!started) {
    return (
      <section class="card">
        <h2>Einstufungstest</h2>
        <p>Der Test findet heraus, was du schon kannst – damit du nicht bei Dingen anfangen musst, die du längst beherrschst.</p>
        <ul>
          <li>Die Aufgaben passen sich an: Wenn du etwas kannst, wird es schwieriger, sonst leichter.</li>
          <li>Du bekommst während des Tests keine Rückmeldung, ob deine Antwort stimmt.</li>
          <li><strong>Rate nicht.</strong> Wenn du etwas nicht weisst, drücke «Weiss ich (noch) nicht». Das ist völlig in Ordnung und macht das Ergebnis genauer.</li>
          <li>Dauer: meist 10–20 Aufgaben.</li>
        </ul>
        <div class="row">
          <button class="btn primary" onClick={() => { setStarted(true); advance(); }}>Test starten</button>
          <button class="btn ghost" onClick={() => go({ name: 'home' })}>Abbrechen</button>
        </div>
      </section>
    );
  }

  if (finished) {
    const known = TOPO.filter((id) => pl.current.known.has(id));
    const start = frontier(profile);
    return (
      <section class="card">
        <h2>Auswertung</h2>
        {known.length ? <p>Du kannst bereits <strong>{known.length}</strong> von {TOPO.length} Themen dieses Lernpfads. Sie werden in den nächsten Tagen kurz überprüft.</p>
          : <p>Wir beginnen ganz am Anfang – so baut alles sauber aufeinander auf.</p>}
        {start.length > 0 && <p>Du startest mit: <strong>{start.slice(0, 3).map((s) => BY_ID[s].title).join(', ')}</strong></p>}
        <div class="row"><button class="btn primary" onClick={() => go({ name: 'home' })}>Los geht's</button></div>
      </section>
    );
  }

  const id = pl.current.current!;
  return (
    <section class="card">
      <div class="eyebrow">Einstufungstest · Aufgabe {pl.current.asked + 1}</div>
      <div class="meter"><div style={{ width: `${pl.current.progress * 100}%` }} /></div>
      {task && <TaskView task={task} skill={BY_ID[id]} placement onDone={(r) => { pl.current.answer(r.ok, task.answer.kind === 'choice'); advance(); }} />}
      <div class="row"><button class="btn ghost small" onClick={() => { update((p) => pl.current.apply(p)); setFinished(true); }}>Test hier beenden</button></div>
    </section>
  );
}
