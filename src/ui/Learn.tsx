import { useEffect, useMemo, useState } from 'preact/hooks';
import { BY_ID } from '../curriculum';
import { Rng, type Task } from '../curriculum/types';
import { recordPractice, recordMisconception, criterionProgress, demote, frontier } from '../engine/model';
import { useApp } from './ctx';
import { TaskView, StepsView, SolutionView } from './TaskView';
import { VisualView } from './Visuals';
import { Rich } from './MathView';

const rng = new Rng();

export function Learn({ id }: { id: string }) {
  const { profile, update, go } = useApp();
  const skill = BY_ID[id];
  const st = profile.skills[id];
  const [task, setTask] = useState<Task>(() => skill.gen(rng));
  const [count, setCount] = useState(0);
  const [wrongRow, setWrongRow] = useState(0);
  const [done, setDone] = useState(false);
  const [check, setCheck] = useState<null | { queue: string[]; failed: string[]; task: Task }>(null);
  const newTask = () => setTask(skill.gen(rng));

  if (done) {
    const next = frontier(profile).filter((x) => x !== id);
    return (
      <section class="card center">
        <div class="big-icon" aria-hidden="true">★</div>
        <h2>«{skill.title}» gelernt!</h2>
        <p>Du hast das Lernkriterium erreicht. In etwa einem Tag kommt eine kurze Kontrolle – erst wenn du es dann noch kannst, gilt das Thema als <strong>gemeistert</strong>.</p>
        <div class="row center">
          {next[0] && <button class="btn primary" onClick={() => go({ name: 'learn', id: next[0] })}>Weiter: {BY_ID[next[0]].title}</button>}
          <button class="btn" onClick={() => go({ name: 'home' })}>Zur Übersicht</button>
        </div>
      </section>
    );
  }

  // ---------- Grundlagen-Check, wenn es hakt ----------
  if (check) {
    if (check.queue.length === 0) {
      return (
        <section class="card">
          <h2>Grundlagen-Check</h2>
          {check.failed.length ? (
            <>
              <p>Bei diesen Grundlagen hat es noch gehakt. Es lohnt sich, sie zuerst zu festigen:</p>
              <ul>{check.failed.map((f) => <li key={f}>{BY_ID[f].title}</li>)}</ul>
              <div class="row"><button class="btn primary" onClick={() => go({ name: 'learn', id: check.failed[0] })}>{BY_ID[check.failed[0]].title} üben</button></div>
            </>
          ) : (
            <>
              <p>Die Grundlagen sitzen. Schau dir das Lösungsbeispiel nochmals in Ruhe an.</p>
              <div class="row"><button class="btn primary" onClick={() => { update((p) => { p.skills[id].phase = 'example'; }); setCheck(null); setWrongRow(0); }}>Beispiel ansehen</button></div>
            </>
          )}
        </section>
      );
    }
    const cur = check.queue[0];
    return (
      <section class="card">
        <div class="eyebrow">Grundlagen-Check: {BY_ID[cur].title}</div>
        <TaskView task={check.task} skill={BY_ID[cur]} hints={false} onDone={(r) => {
          const failed = r.ok ? check.failed : [...check.failed, cur];
          if (!r.ok) update((p) => demote(p, cur));
          const queue = check.queue.slice(1);
          setCheck({ queue, failed, task: queue[0] ? BY_ID[queue[0]].gen(rng) : check.task });
        }} />
      </section>
    );
  }

  const header = (
    <header class="learn-head">
      <div class="eyebrow">{skill.area} · {skill.stage}{skill.niveau === 'erweitert' ? ' · erweitert' : ''}</div>
      <h2>{skill.title}</h2>
    </header>
  );

  // ---------- 1. Lösungsbeispiel ----------
  if (st.phase === 'example') return <Example id={id} header={header} />;

  // ---------- 2. Ausgeblendete Schritte (Fading) ----------
  if (st.phase === 'faded') {
    const given = Math.max(0, task.steps.length - 1 - st.fadeStep);
    if (given === 0) return <SkipTo run={() => update((p) => { p.skills[id].phase = 'practice'; })} />;
    return (
      <section class="card">
        {header}
        <div class="phase">Schritt 2 von 3: Lösungsweg ergänzen</div>
        <TaskView task={task} skill={skill} givenSteps={given} onDone={(r) => {
          update((p) => {
            recordPractice(p, id, r.ok, true);
            if (r.ok) {
              const s = p.skills[id];
              s.fadeStep++;
              if (s.fadeStep >= 2 || task.steps.length - 1 - s.fadeStep <= 0) s.phase = 'practice';
            }
          });
          newTask();
        }} />
      </section>
    );
  }

  // ---------- 3. Selbständig üben bis zum Lernkriterium ----------
  const prog = criterionProgress(st);
  return (
    <section class="card">
      {header}
      <div class="phase">Schritt 3 von 3: Selbständig üben</div>
      <div class="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(prog * 100)} aria-label="Fortschritt bis «gelernt»">
        <div style={{ width: `${prog * 100}%` }} />
      </div>
      <p class="muted small">Ziel: 4 von 5 Aufgaben ohne Tipp richtig, die letzten zwei in Folge.</p>

      {wrongRow >= 3 ? (
        <div class="stuck">
          <p><strong>Das ist gerade schwierig – das ist normal beim Lernen.</strong> Was möchtest du tun?</p>
          <div class="row">
            <button class="btn" onClick={() => { update((p) => { p.skills[id].phase = 'example'; }); setWrongRow(0); }}>Beispiel nochmals ansehen</button>
            {skill.prereqs.length > 0 && (
              <button class="btn" onClick={() => setCheck({ queue: [...skill.prereqs], failed: [], task: BY_ID[skill.prereqs[0]].gen(rng) })}>Grundlagen prüfen</button>
            )}
            <button class="btn ghost" onClick={() => setWrongRow(0)}>Weiter üben</button>
          </div>
        </div>
      ) : (
        <>
          {count >= 15 && <p class="note">Du übst schon lange an diesem Thema. Eine Pause oder ein anderes Thema hilft oft mehr als weiterüben – morgen geht es meist leichter.</p>}
          <TaskView task={task} skill={skill} onDone={(r) => {
            let met = false;
            update((p) => {
              if (r.misMsg) recordMisconception(p, id, r.misMsg);
              met = recordPractice(p, id, r.ok, r.assisted);
            });
            setCount(count + 1);
            setWrongRow(r.ok ? 0 : wrongRow + 1);
            if (met) setDone(true); else newTask();
          }} />
        </>
      )}
    </section>
  );
}

function SkipTo({ run }: { run: () => void }) {
  useEffect(run, []);
  return null;
}

function Example({ id, header }: { id: string; header: preact.ComponentChildren }) {
  const { update } = useApp();
  const skill = BY_ID[id];
  const ex = useMemo(() => skill.gen(rng), [id]);
  const [choice, setChoice] = useState<number | null>(null);
  const se = skill.selfExplain;
  return (
    <section class="card">
      {header}
      <div class="phase">Schritt 1 von 3: Verstehen</div>
      <p class="intro"><Rich text={skill.intro} /></p>
      <div class="example">
        <div class="label">Lösungsbeispiel</div>
        <p class="prompt"><Rich text={ex.prompt} /></p>
        {ex.visual && <VisualView v={ex.visual} />}
        <StepsView steps={ex.steps} />
        <p class="result">Ergebnis: <strong><SolutionView a={ex.answer} /></strong></p>
      </div>
      {se && (
        <div class="selfexp">
          <div class="label">Kurz nachdenken</div>
          <p>{se.q}</p>
          <div class="choices col">
            {se.options.map((o, i) => (
              <button key={i} disabled={choice !== null}
                class={`btn choice left ${choice !== null && i === se.correct ? 'right' : ''} ${choice === i && i !== se.correct ? 'wrong' : ''}`}
                onClick={() => setChoice(i)}>{o}</button>
            ))}
          </div>
          {choice !== null && <p class={choice === se.correct ? 'ok-text' : 'bad-text'}>{choice === se.correct ? 'Genau. ' : 'Nicht ganz. '}{se.why}</p>}
        </div>
      )}
      <div class="row">
        <button class="btn primary" disabled={!!se && choice === null} onClick={() => update((p) => {
          const s = p.skills[id];
          s.phase = 'faded'; s.fadeStep = 0;
          if (s.status === 'new') s.status = 'learning';
        })}>Jetzt probiere ich es selbst</button>
      </div>
    </section>
  );
}
