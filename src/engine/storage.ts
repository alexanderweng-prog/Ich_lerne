// Speicherung lokal auf dem Gerät (keine Daten verlassen das Gerät ohne aktiven Export).
// Achtung: Safari/iPadOS löscht Website-Daten nach 7 Tagen ohne Nutzung, wenn die App NICHT
// zum Home-Bildschirm hinzugefügt wurde. Deshalb: App installieren und regelmässig exportieren.

import { migrate, type Profile } from './model';
import { SKILLS } from '../curriculum';

const KEY = 'mastery-mathe.v1';

export interface Settings { decimalComma: boolean; confidencePrompts: boolean }
interface Store { profiles: Profile[]; active: string | null; settings: Settings }

const DEFAULT: Store = { profiles: [], active: null, settings: { decimalComma: false, confidencePrompts: true } };

export function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const s = JSON.parse(raw) as Store;
    s.profiles = s.profiles.map(migrate);
    s.settings = { ...DEFAULT.settings, ...s.settings };
    return s;
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function save(s: Store): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/** Persistenten Speicher anfragen (verhindert automatisches Löschen, wo der Browser das unterstützt). */
export async function requestPersistence() {
  try { await navigator.storage?.persist?.(); } catch { /* egal */ }
}

// ---------- Export für Lehrperson / Sicherung ----------

export interface ExportFile {
  format: 'mastery-mathe-export';
  version: 1;
  exported: string;
  profile: Profile;
}

export function exportProfile(p: Profile): string {
  const f: ExportFile = { format: 'mastery-mathe-export', version: 1, exported: new Date().toISOString(), profile: p };
  return JSON.stringify(f);
}

export function parseExport(text: string): Profile {
  const f = JSON.parse(text) as ExportFile;
  if (f.format !== 'mastery-mathe-export' || !f.profile?.skills) throw new Error('Keine gültige Lernstand-Datei.');
  for (const id of Object.keys(f.profile.skills)) if (!SKILLS.some((s) => s.id === id)) delete f.profile.skills[id];
  return migrate(f.profile);
}

export function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
