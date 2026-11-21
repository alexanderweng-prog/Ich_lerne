import { useState } from 'preact/hooks';
import { SKILLS, BY_ID } from '../curriculum';
import { parseExport } from '../engine/storage';
import { stats, type Profile, type Status } from '../engine/model';
import { AREAS } from './Screens';

const SHORT: Record<Status, string> = { new: '', learning: '…', learned: '✓', mastered: '★' };

export function Teacher({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<Profile[]>([]);
  const [err, setErr] = useState<string[]>([]);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const out = [...rows];
    const errors: string[] = [];
    for (const f of Array.from(files)) {
      try {
        const p = parseExport(await f.text());
        const i = out.findIndex((x) => x.id === p.id);
        if (i >= 0) out[i] = p; else out.push(p);
      } catch (e) { errors.push(`${f.name}: ${(e as Error).message}`); }
    }
    out.sort((a, b) => a.klasse.localeCompare(b.klasse) || a.name.localeCompare(b.name));
    setRows(out); setErr(errors);
  }

  // Häufigste Fehlvorstellungen über alle SuS
  const mis = new Map<string, { skill: string; n: number; students: number }>();
  for (const p of rows) for (const s of SKILLS) for (const [msg, n] of Object.entries(p.skills[s.id].mis)) {
    const k = `${s.id}|${msg}`;
    const e = mis.get(k) ?? { skill: s.id, n: 0, students: 0 };
    e.n += n; e.students++;
    mis.set(k, e);
  }
  const topMis = [...mis.entries()].sort((a, b) => b[1].students - a[1].students || b[1].n - a[1].n).slice(0, 10);

  // Wer hängt wo? (Thema begonnen, Trefferquote tief)
  const stuck = rows.flatMap((p) => SKILLS.filter((s) => {
    const st = p.skills[s.id];
    return st.status === 'learning' && st.total >= 8 && st.correct / st.total < 0.5;
  }).map((s) => ({ p, s })));

  return (
    <>
      <section class="card">
        <h2>Übersicht für Lehrpersonen</h2>
        <p>Die SuS exportieren ihren Lernstand («Profil» → «Lernstand exportieren») und geben dir die Datei (z. B. über eure Lernplattform). Hier kannst du mehrere Dateien gleichzeitig laden. Die Daten werden nur in diesem Browserfenster angezeigt und nicht gespeichert.</p>
        <label class="btn primary file">Lernstand-Dateien laden
          <input type="file" accept=".json,application/json" multiple onChange={(e) => onFiles((e.target as HTMLInputElement).files)} />
        </label>
        <button class="btn ghost" onClick={onBack}>Zurück</button>
        {err.length > 0 && <ul class="bad-text">{err.map((e) => <li key={e}>{e}</li>)}</ul>}
      </section>

      {rows.length > 0 && (
        <>
          <section class="card">
            <h3>Klassenübersicht</h3>
            <p class="muted small">★ gemeistert · ✓ gelernt · … begonnen · leer = offen</p>
            <div class="table-wrap">
              <table class="grid">
                <thead>
                  <tr>
                    <th>Name</th><th>Kl.</th><th>gel.</th>
                    {AREAS.flatMap((a) => SKILLS.filter((s) => s.area === a)).map((s) => <th key={s.id} title={s.title} class="rot"><span>{s.id}</span></th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const c = stats(p);
                    return (
                      <tr key={p.id}>
                        <td>{p.name}</td><td>{p.klasse}</td><td>{c.learned + c.mastered}</td>
                        {SKILLS.map((s) => {
                          const st = p.skills[s.id];
                          return <td key={s.id} class={`cell ${st.status}`} title={`${s.title}: ${st.correct}/${st.total} richtig`}>{SHORT[st.status]}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {stuck.length > 0 && (
            <section class="card">
              <h3>Wer hängt fest?</h3>
              <p class="muted small">Thema begonnen, mindestens 8 Versuche, weniger als die Hälfte richtig.</p>
              <ul>{stuck.map(({ p, s }) => <li key={p.id + s.id}><strong>{p.name}</strong>: {s.title} ({p.skills[s.id].correct}/{p.skills[s.id].total})</li>)}</ul>
            </section>
          )}

          {topMis.length > 0 && (
            <section class="card">
              <h3>Häufigste Fehlvorstellungen</h3>
              <p class="muted small">Geeignet als Einstieg für eine Klassen- oder Gruppensequenz.</p>
              <table class="list">
                <thead><tr><th>Thema</th><th>Fehlermuster</th><th>SuS</th><th>Anzahl</th></tr></thead>
                <tbody>{topMis.map(([k, v]) => <tr key={k}><td>{BY_ID[v.skill].title}</td><td>{k.split('|')[1]}</td><td>{v.students}</td><td>{v.n}</td></tr>)}</tbody>
              </table>
            </section>
          )}
        </>
      )}
    </>
  );
}
