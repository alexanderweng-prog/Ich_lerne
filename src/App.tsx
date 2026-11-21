import { useEffect, useState } from 'preact/hooks';
import { load, save, exportProfile, parseExport, download, requestPersistence, type Settings } from './engine/storage';
import { newProfile, type Profile } from './engine/model';
import { AppCtx, type Route } from './ui/ctx';
import { Home, MapView, About } from './ui/Screens';
import { Learn } from './ui/Learn';
import { Review } from './ui/Review';
import { PlacementView } from './ui/PlacementView';
import { Teacher } from './ui/Teacher';
import { fmt } from './ui/MathView';

export function App() {
  const [store, setStore] = useState(load);
  const [route, setRoute] = useState<Route>(() => (store.active ? { name: 'home' } : { name: 'profiles' }));
  const [saveError, setSaveError] = useState(false);
  fmt.decimalComma = store.settings.decimalComma;

  useEffect(() => { requestPersistence(); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  const commit = (s: typeof store) => { setSaveError(!save(s)); setStore(s); };
  const profile = store.profiles.find((p) => p.id === store.active) ?? null;

  if (route.name === 'teacher') return <Shell><Teacher onBack={() => setRoute({ name: 'profiles' })} /></Shell>;

  if (!profile || route.name === 'profiles') {
    return (
      <Shell>
        <Profiles
          profiles={store.profiles}
          onPick={(id) => { commit({ ...store, active: id }); setRoute({ name: 'home' }); }}
          onCreate={(name, klasse) => {
            const p = newProfile(name, klasse);
            commit({ ...store, profiles: [...store.profiles, p], active: p.id });
            setRoute({ name: 'home' });
          }}
          onImport={(p) => {
            const others = store.profiles.filter((x) => x.id !== p.id);
            commit({ ...store, profiles: [...others, p], active: p.id });
            setRoute({ name: 'home' });
          }}
          onTeacher={() => setRoute({ name: 'teacher' })}
        />
      </Shell>
    );
  }

  const ctx = {
    profile,
    settings: store.settings,
    go: setRoute,
    update: (fn: (p: Profile) => void) => {
      const s = structuredClone(store);
      const p = s.profiles.find((x) => x.id === s.active)!;
      fn(p);
      commit(s);
    },
  };

  let body;
  switch (route.name) {
    case 'home': body = <Home />; break;
    case 'placement': body = <PlacementView />; break;
    case 'learn': body = <Learn key={route.id} id={route.id} />; break;
    case 'review': body = <Review key={String(route.mixed)} mixed={route.mixed} />; break;
    case 'map': body = <MapView />; break;
    case 'about': body = <About />; break;
    case 'settings': body = (
      <SettingsView
        profile={profile}
        settings={store.settings}
        onSettings={(st) => commit({ ...store, settings: st })}
        onSwitch={() => setRoute({ name: 'profiles' })}
        onDelete={() => {
          commit({ ...store, profiles: store.profiles.filter((p) => p.id !== profile.id), active: null });
          setRoute({ name: 'profiles' });
        }}
      />
    ); break;
  }

  return (
    <AppCtx.Provider value={ctx}>
      <Shell nav={
        <nav class="nav">
          <button class={route.name === 'home' ? 'on' : ''} onClick={() => setRoute({ name: 'home' })}>Übersicht</button>
          <button class={route.name === 'map' ? 'on' : ''} onClick={() => setRoute({ name: 'map' })}>Karte</button>
          <button class={route.name === 'settings' ? 'on' : ''} onClick={() => setRoute({ name: 'settings' })}>{profile.name}</button>
          <button class={route.name === 'about' ? 'on' : ''} onClick={() => setRoute({ name: 'about' })} aria-label="Wie funktioniert die App?">?</button>
        </nav>
      }>
        {saveError && <p class="note">Achtung: Der Lernstand konnte nicht gespeichert werden (privates Fenster oder Speicher voll?).</p>}
        {body}
      </Shell>
    </AppCtx.Provider>
  );
}

function Shell({ children, nav }: { children: preact.ComponentChildren; nav?: preact.ComponentChildren }) {
  return (
    <div class="app">
      <header class="top">
        <div class="brand"><span class="logo" aria-hidden="true">∑</span> Mastery Mathe</div>
        {nav}
      </header>
      <main>{children}</main>
    </div>
  );
}

function Profiles({ profiles, onPick, onCreate, onImport, onTeacher }: {
  profiles: Profile[]; onPick: (id: string) => void; onCreate: (n: string, k: string) => void;
  onImport: (p: Profile) => void; onTeacher: () => void;
}) {
  const [name, setName] = useState('');
  const [klasse, setKlasse] = useState('');
  const [err, setErr] = useState('');
  return (
    <>
      {profiles.length > 0 && (
        <section class="card">
          <h2>Wer lernt?</h2>
          <div class="topic-list">
            {profiles.map((p) => <button key={p.id} class="topic" onClick={() => onPick(p.id)}><span class="t">{p.name}</span><span class="eyebrow">{p.klasse}</span></button>)}
          </div>
        </section>
      )}
      <section class="card">
        <h2>Neues Profil</h2>
        <p class="muted small">Verwende ein Kürzel oder einen Vornamen, keinen vollständigen Namen.</p>
        <form class="form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) onCreate(name.trim(), klasse.trim()); }}>
          <label>Kürzel / Vorname <input value={name} maxLength={30} onInput={(e) => setName((e.target as HTMLInputElement).value)} /></label>
          <label>Klasse <input value={klasse} maxLength={12} placeholder="z. B. 1b" onInput={(e) => setKlasse((e.target as HTMLInputElement).value)} /></label>
          <button class="btn primary" disabled={!name.trim()}>Profil erstellen</button>
        </form>
      </section>
      <section class="card">
        <h2>Weitere</h2>
        <div class="row wrap">
          <label class="btn file">Lernstand wiederherstellen
            <input type="file" accept=".json,application/json" onChange={async (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (!f) return;
              try { onImport(parseExport(await f.text())); } catch (x) { setErr((x as Error).message); }
            }} />
          </label>
          <button class="btn" onClick={onTeacher}>Für Lehrpersonen</button>
        </div>
        {err && <p class="bad-text">{err}</p>}
      </section>
    </>
  );
}

function SettingsView({ profile, settings, onSettings, onSwitch, onDelete }: {
  profile: Profile; settings: Settings; onSettings: (s: Settings) => void; onSwitch: () => void; onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const file = `lernstand-${profile.name.replace(/[^\wäöüÄÖÜ-]/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
  return (
    <>
      <section class="card">
        <h2>Profil: {profile.name} {profile.klasse && `(${profile.klasse})`}</h2>
        <div class="row wrap">
          <button class="btn primary" onClick={() => download(file, exportProfile(profile))}>Lernstand exportieren</button>
          <button class="btn" onClick={onSwitch}>Profil wechseln</button>
        </div>
        <p class="muted small">Die Datei kannst du der Lehrperson geben oder als Sicherung aufbewahren. Auf iPads: Die App über «Teilen → Zum Home-Bildschirm» installieren, sonst kann Safari die Daten nach 7 Tagen ohne Nutzung löschen.</p>
      </section>
      <section class="card">
        <h2>Einstellungen</h2>
        <label class="check"><input type="checkbox" checked={settings.decimalComma} onChange={(e) => onSettings({ ...settings, decimalComma: (e.target as HTMLInputElement).checked })} /> Dezimalkomma statt Dezimalpunkt anzeigen</label>
        <label class="check"><input type="checkbox" checked={settings.confidencePrompts} onChange={(e) => onSettings({ ...settings, confidencePrompts: (e.target as HTMLInputElement).checked })} /> Bei Wiederholungen nach Sicherheit fragen («sicher / unsicher»)</label>
      </section>
      <section class="card">
        <h2>Profil löschen</h2>
        {!confirm ? <button class="btn danger" onClick={() => setConfirm(true)}>Profil löschen …</button> : (
          <div class="row"><span>Wirklich? Der Lernstand geht verloren, wenn er nicht exportiert wurde.</span>
            <button class="btn danger" onClick={onDelete}>Ja, löschen</button><button class="btn" onClick={() => setConfirm(false)}>Abbrechen</button></div>
        )}
      </section>
    </>
  );
}
