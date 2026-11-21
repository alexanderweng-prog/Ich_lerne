import { useState } from 'preact/hooks';
import { BY_ID, SKILLS } from '../curriculum';
import { Rng, type Task } from '../curriculum/types';
import { dueReviews, recordReview, recordMisconception, implicitCredit, isDone } from '../engine/model';
import { useApp } from './ctx';
import { TaskView } from './TaskView';

const rng = new Rng();

/** Mischt so, dass möglichst nie zwei Aufgaben desselben Bereichs direkt nacheinander kommen (Interleaving). */
function interleave(ids: string[]): string[] {
  const pool = rng.shuffle(ids);
  const out: string[] = [];
  while (pool.length) {
    const lastArea = out.length ? BY_ID[out[out.length - 1]].area : null;
    let i = pool.findIndex((x) => BY_ID[x].area !== lastArea);
    if (i < 0) i = 0;
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export function Review({ mixed = false }: { mixed?: boolean }) {
  const { profile, update, go, settings } = useApp();
  const [queue, setQueue] = useState<string[]>(() => {
    if (mixed) return interleave(rng.shuffle(SKILLS.filter((s) => isDone(profile.skills[s.id])).map((s) => s.id)).slice(0, 10));
    return interleave(dueReviews(profile).slice(0, 12));
  });
  const [retried] = useState(() => new Set<string>());
  const [task, setTask] = useState<Task | null>(() => (queue[0] ? BY_ID[queue[0]].gen(rng) : null));
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const [ask] = useState(() => settings.confidencePrompts);

  if (!queue.length || !task) {
    return (
      <section class="card center">
        <h2>{score.n ? 'Wiederholung abgeschlossen' : 'Nichts fällig'}</h2>
        {score.n > 0 && <p>{score.ok} von {score.n} Aufgaben richtig.</p>}
        <p class="muted">{mixed ? 'Gemischtes Üben trainiert, das richtige Verfahren selbst zu erkennen.' : 'Verteiltes Wiederholen sorgt dafür, dass du das Gelernte langfristig behältst.'}</p>
        <div class="row center"><button class="btn primary" onClick={() => go({ name: 'home' })}>Zur Übersicht</button></div>
      </section>
    );
  }

  const id = queue[0];
  const skill = BY_ID[id];
  const isChoice = task.answer.kind === 'choice';
  return (
    <section class="card">
      <div class="eyebrow">{mixed ? 'Gemischtes Üben' : 'Wiederholung'} · noch {queue.length} · {skill.title}</div>
      <TaskView task={task} skill={skill} hints={false} askConfidence={ask && !isChoice} onDone={(r) => {
        update((p) => {
          if (r.misMsg) recordMisconception(p, id, r.misMsg);
          const due = p.skills[id].due <= Date.now();
          if (!mixed || due || !r.ok) recordReview(p, id, r.ok, r.confident);
          else implicitCredit(p, id);
        });
        setScore({ ok: score.ok + (r.ok ? 1 : 0), n: score.n + 1 });
        let q = queue.slice(1);
        // Falsches nochmals am Ende dieser Runde (einmal)
        if (!r.ok && !retried.has(id)) { retried.add(id); q = [...q, id]; }
        setQueue(q);
        setTask(q[0] ? BY_ID[q[0]].gen(rng) : null);
      }} />
    </section>
  );
}
