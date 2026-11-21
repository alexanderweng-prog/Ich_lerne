import { useEffect, useRef, useState } from 'preact/hooks';
import type { Skill, Task, Step, Visual } from '../curriculum/types';
import { check, type CheckResult } from '../math/check';
import { solutionText } from '../engine/canonical';
import { MathExpr, Rich } from './MathView';

export interface TaskResult { ok: boolean; assisted: boolean; confident?: boolean; misMsg?: string }

interface Props {
  task: Task;
  skill: Skill;
  /** Anzahl Lösungsschritte, die bereits vorgegeben sind (Fading). */
  givenSteps?: number;
  hints?: boolean;
  askConfidence?: boolean;
  /** Einstufungstest: keine Rückmeldung, «Weiss ich nicht»-Knopf */
  placement?: boolean;
  onDone: (r: TaskResult) => void;
}

export function BarVisual({ v }: { v: Visual }) {
  const w = 320, h = 56, pad = 2;
  const pw = (w - 2 * pad) / v.parts;
  return (
    <svg class="bar" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Streifen mit ${v.parts} Teilen, ${v.shaded} gefärbt`}>
      {Array.from({ length: v.parts }, (_, i) => (
        <rect key={i} x={pad + i * pw} y={pad} width={pw} height={h - 2 * pad} class={i < v.shaded ? 'on' : 'off'} />
      ))}
    </svg>
  );
}

export function StepsView({ steps, count }: { steps: Step[]; count?: number }) {
  const shown = steps.slice(0, count ?? steps.length);
  return (
    <ol class="steps">
      {shown.map((s, i) => (
        <li key={i}>
          <span class="step-m"><MathExpr src={s.m} /></span>
          {s.why && <span class="step-why">{s.why}</span>}
        </li>
      ))}
    </ol>
  );
}

const KEYS: Array<[string, string]> = [['x', 'x'], ['²', '²'], ['(', '('], [')', ')'], ['/', 'Bruch /'], ['·', '·'], [':', ':'], ['−', '−'], ['=', '=']];

export function TaskView({ task, skill, givenSteps = 0, hints = true, askConfidence = false, placement = false, onDone }: Props) {
  const [input, setInput] = useState('');
  const [hint, setHint] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [result, setResult] = useState<(CheckResult & { confident?: boolean; chosen?: number }) | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput(''); setHint(0); setNote(null); setResult(null);
    setTimeout(() => ref.current?.focus(), 30);
  }, [task]);

  const isChoice = task.answer.kind === 'choice';
  const maxHint = 1 + Math.max(0, task.steps.length - 1 - givenSteps);

  function submit(value: string, confident?: boolean) {
    const r = check(task.answer, value, task.misconceptions);
    if (placement) {
      if (r.invalid) { setNote(r.msg ?? null); return; }
      onDone({ ok: r.correct || !!r.formOnly, assisted: false });
      return;
    }
    if (r.invalid || r.formOnly) { setNote(r.msg ?? null); return; }
    setNote(null);
    setResult({ ...r, confident, chosen: isChoice ? Number(value) : undefined });
  }

  function insert(k: string) {
    const el = ref.current;
    if (!el) { setInput(input + k); return; }
    const s = el.selectionStart ?? input.length, e = el.selectionEnd ?? input.length;
    const v = input.slice(0, s) + k + input.slice(e);
    setInput(v);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + k.length, s + k.length); }, 0);
  }

  const answered = !!result;

  return (
    <div class="task">
      <p class="prompt"><Rich text={task.prompt} /></p>
      {task.visual && <BarVisual v={task.visual} />}

      {givenSteps > 0 && (
        <div class="given">
          <div class="label">Lösungsweg – vervollständige ihn:</div>
          <StepsView steps={task.steps} count={givenSteps} />
          <div class="step-next">… und das Ergebnis?</div>
        </div>
      )}

      {!answered && isChoice && task.answer.kind === 'choice' && (
        <div class="choices">
          {task.answer.options.map((o, i) => (
            <button key={i} class="btn choice" onClick={() => submit(String(i))}>{o}</button>
          ))}
        </div>
      )}

      {!answered && !isChoice && (
        <form class="answer" onSubmit={(e) => { e.preventDefault(); if (!askConfidence) submit(input); }}>
          <label class="sr" for="ans">Antwort</label>
          <input id="ans" ref={ref} value={input} autoComplete="off" autoCapitalize="off" spellcheck={false} inputMode="text"
            placeholder={task.inputHint ? `Antwort (${task.inputHint})` : 'Antwort'}
            onInput={(e) => { setInput((e.target as HTMLInputElement).value); setNote(null); }} />
          <div class="preview" aria-live="polite">{input.trim() && <>Vorschau: <MathExpr src={input} /></>}</div>
          <div class="keys">
            {KEYS.map(([k, label]) => <button type="button" key={k} class="key" onClick={() => insert(k === '/' ? '/' : k)}>{label}</button>)}
          </div>
          {askConfidence ? (
            <div class="row">
              <button type="button" class="btn primary" disabled={!input.trim()} onClick={() => submit(input, true)}>Prüfen – ich bin sicher</button>
              <button type="button" class="btn" disabled={!input.trim()} onClick={() => submit(input, false)}>Prüfen – ich bin unsicher</button>
            </div>
          ) : (
            <div class="row"><button type="submit" class="btn primary" disabled={!input.trim()}>Prüfen</button></div>
          )}
        </form>
      )}

      {note && <p class="note" role="status">{note}</p>}

      {placement && (
        <div class="row"><button class="btn ghost" onClick={() => onDone({ ok: false, assisted: false })}>Weiss ich (noch) nicht</button></div>
      )}

      {!placement && !answered && hints && hint < maxHint && (
        <button class="btn ghost small" onClick={() => setHint(hint + 1)}>{hint === 0 ? 'Tipp anzeigen' : 'Nächster Schritt'}</button>
      )}
      {!placement && hint > 0 && !answered && (
        <div class="hint">
          <p><strong>Tipp:</strong> <Rich text={skill.tip} /></p>
          {hint > 1 && <StepsView steps={task.steps} count={givenSteps + hint - 1} />}
          <p class="muted small">Mit Tipp gelöste Aufgaben zählen noch nicht für «gelernt».</p>
        </div>
      )}

      {answered && result && (
        <div class={`feedback ${result.correct ? 'ok' : 'bad'}`} role="status">
          {result.correct ? (
            <p class="fb-title">Richtig!{result.confident === false ? ' Du warst unsicher – gut, dass es geklappt hat.' : ''}</p>
          ) : (
            <>
              <p class="fb-title">{result.confident ? 'Nicht ganz – obwohl du sicher warst. Schau dir den Weg genau an.' : 'Nicht ganz.'}</p>
              {result.msg && <p class="fb-mis">{result.msg}</p>}
              <p>Richtig ist: <strong>{task.answer.kind === 'choice' ? solutionText(task.answer) : <MathExpr src={solutionText(task.answer)} />}</strong></p>
            </>
          )}
          <details open={!result.correct}>
            <summary>Lösungsweg</summary>
            <StepsView steps={task.steps} />
          </details>
          <div class="row">
            <button class="btn primary" autoFocus onClick={() => onDone({ ok: result.correct, assisted: hint > 0, confident: result.confident, misMsg: result.misconception ? result.msg : undefined })}>Weiter</button>
          </div>
        </div>
      )}
    </div>
  );
}
