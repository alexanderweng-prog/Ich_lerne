import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Profile } from '../engine/model';
import type { Settings } from '../engine/storage';

export type Route =
  | { name: 'profiles' }
  | { name: 'home' }
  | { name: 'placement' }
  | { name: 'learn'; id: string }
  | { name: 'review'; mixed?: boolean }
  | { name: 'map' }
  | { name: 'teacher' }
  | { name: 'settings' }
  | { name: 'about' };

export interface Ctx {
  profile: Profile;
  settings: Settings;
  update: (fn: (p: Profile) => void) => void;
  go: (r: Route) => void;
}

export const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => useContext(AppCtx)!;
