import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { usePersistentState } from '../lib/usePersistentState';
import { useMediaQuery } from '../lib/useMediaQuery';

export type ThemePref = 'sistema' | 'claro' | 'escuro';

interface SettingsValue {
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = usePersistentState<ThemePref>('theme', 'sistema');
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const resolvedTheme: 'light' | 'dark' =
    theme === 'sistema' ? (systemDark ? 'dark' : 'light') : theme === 'escuro' ? 'dark' : 'light';

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.motion = reduced ? 'minima' : 'completa';
    root.style.setProperty('--motion-scale', reduced ? '0' : '1');
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((m) => (m.content = resolvedTheme === 'dark' ? '#111111' : '#F5F3EE'));
  }, [resolvedTheme, reduced]);

  const toggleTheme = useCallback(
    () => setTheme(resolvedTheme === 'dark' ? 'claro' : 'escuro'),
    [resolvedTheme, setTheme],
  );
  const value = useMemo(() => ({ resolvedTheme, toggleTheme }), [resolvedTheme, toggleTheme]);

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

/** Transições do framer-motion, desligadas quando o sistema pede menos movimento. */
export function useMotion() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
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
