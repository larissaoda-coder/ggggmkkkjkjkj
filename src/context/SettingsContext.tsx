import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { usePersistentState } from '../lib/usePersistentState';
import { useMediaQuery } from '../lib/useMediaQuery';

export type ThemePref = 'sistema' | 'claro' | 'escuro';

export interface Prefs {
  theme: ThemePref;
  reduceMotion: boolean;
  sound: boolean;
  largeText: boolean;
}

const defaults: Prefs = { theme: 'sistema', reduceMotion: false, sound: false, largeText: false };

interface SettingsValue {
  prefs: Prefs;
  update: (patch: Partial<Prefs>) => void;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
  reduced: boolean;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function isPrefs(v: unknown): v is Prefs {
  return typeof v === 'object' && v !== null && 'theme' in v;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = usePersistentState<Prefs>('preferencias', defaults, isPrefs);
  const prefs = useMemo(() => ({ ...defaults, ...stored }), [stored]);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const reduced = prefs.reduceMotion || systemReduced;
  const resolvedTheme: 'light' | 'dark' =
    prefs.theme === 'sistema' ? (systemDark ? 'dark' : 'light') : prefs.theme === 'escuro' ? 'dark' : 'light';

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.motion = reduced ? 'minima' : 'completa';
    root.style.setProperty('--motion-scale', reduced ? '0' : '1');
    root.style.fontSize = prefs.largeText ? '19px' : '';
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((m) => (m.content = resolvedTheme === 'dark' ? '#111111' : '#F5F3EE'));
  }, [resolvedTheme, reduced, prefs.largeText]);

  const update = useCallback(
    (patch: Partial<Prefs>) => setStored((p) => ({ ...defaults, ...p, ...patch })),
    [setStored],
  );
  const toggleTheme = useCallback(
    () => update({ theme: resolvedTheme === 'dark' ? 'claro' : 'escuro' }),
    [resolvedTheme, update],
  );

  const value = useMemo(
    () => ({ prefs, update, resolvedTheme, toggleTheme, reduced }),
    [prefs, update, resolvedTheme, toggleTheme, reduced],
  );
  return (
    <SettingsContext.Provider value={value}>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings precisa estar dentro de SettingsProvider');
  return ctx;
}

/** Transições do framer-motion, desligadas quando se pede menos movimento. */
export function useMotion() {
  const { reduced } = useSettings();
  const factor = reduced ? 0 : 1;
  return useMemo(
    () => ({
      reduced,
      factor,
      t: (duration: number, extra: Record<string, unknown> = {}) => ({
        duration: duration * factor,
        ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
        ...extra,
      }),
    }),
    [reduced, factor],
  );
}
