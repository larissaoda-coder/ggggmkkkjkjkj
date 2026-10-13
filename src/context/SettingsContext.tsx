import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { usePersistentState } from '../lib/usePersistentState';
import { useMediaQuery } from '../lib/useMediaQuery';
import { setSoundEnabled, setSoundVolume } from '../lib/sound';

export type ThemePref = 'sistema' | 'claro' | 'escuro';
export type FontPair = 'editorial' | 'classica' | 'moderna';
export type TextSize = 'pequeno' | 'padrao' | 'grande' | 'maior';
export type MotionPref = 'auto' | 'completa' | 'suave' | 'minima';
export type MotionLevel = 'completa' | 'suave' | 'minima';
export type DesktopNav = 'lateral' | 'superior';

export interface Settings {
  theme: ThemePref;
  fontPair: FontPair;
  textSize: TextSize;
  motion: MotionPref;
  sound: boolean;
  soundVolume: number;
  desktopNav: DesktopNav;
  navLabels: boolean;
  mobileNavAutoHide: boolean;
}

export const defaultSettings: Settings = {
  theme: 'sistema',
  fontPair: 'editorial',
  textSize: 'padrao',
  motion: 'auto',
  sound: false,
  soundVolume: 0.5,
  desktopNav: 'lateral',
  navLabels: true,
  mobileNavAutoHide: false,
};

export const textSizePx: Record<TextSize, number> = {
  pequeno: 15,
  padrao: 17,
  grande: 19,
  maior: 21,
};

export const fontPairs: Record<FontPair, { label: string; serif: string; sans: string; description: string }> = {
  editorial: {
    label: 'Editorial',
    serif: 'Newsreader',
    sans: 'Inter',
    description: 'Serifa de jornal literário com uma sans neutra.',
  },
  classica: {
    label: 'Clássica',
    serif: 'EB Garamond',
    sans: 'Manrope',
    description: 'Garamond de livro antigo com uma sans geométrica.',
  },
  moderna: {
    label: 'Contemporânea',
    serif: 'Literata',
    sans: 'IBM Plex Sans',
    description: 'Serifa de leitura em tela com uma sans técnica.',
  },
};

const motionScale: Record<MotionLevel, number> = { completa: 1, suave: 0.55, minima: 0 };

interface SettingsValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  resolvedTheme: 'light' | 'dark';
  motionLevel: MotionLevel;
  /** Multiplicador de duração das animações (0 = sem animação). */
  motionFactor: number;
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function isSettings(value: unknown): value is Settings {
  return typeof value === 'object' && value !== null && 'theme' in value;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = usePersistentState<Settings>('settings', defaultSettings, isSettings);
  // Mescla com os padrões, para que versões futuras com novas chaves não quebrem.
  const settings = useMemo(() => ({ ...defaultSettings, ...stored }), [stored]);

  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  const resolvedTheme: 'light' | 'dark' =
    settings.theme === 'sistema' ? (systemDark ? 'dark' : 'light') : settings.theme === 'escuro' ? 'dark' : 'light';

  const motionLevel: MotionLevel =
    settings.motion === 'auto' ? (systemReduced ? 'minima' : 'completa') : settings.motion;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.fonts = settings.fontPair;
    root.dataset.motion = motionLevel;
    root.style.fontSize = `${textSizePx[settings.textSize]}px`;
    root.style.setProperty('--motion-scale', String(motionScale[motionLevel]));
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((m) => (m.content = resolvedTheme === 'dark' ? '#111111' : '#F5F3EE'));
  }, [resolvedTheme, settings.fontPair, settings.textSize, motionLevel]);

  useEffect(() => {
    setSoundEnabled(settings.sound);
    setSoundVolume(settings.soundVolume);
  }, [settings.sound, settings.soundVolume]);

  const update = useCallback(
    (patch: Partial<Settings>) => setStored((prev) => ({ ...defaultSettings, ...prev, ...patch })),
    [setStored],
  );
  const reset = useCallback(() => setStored(defaultSettings), [setStored]);
  const toggleTheme = useCallback(
    () => update({ theme: resolvedTheme === 'dark' ? 'claro' : 'escuro' }),
    [resolvedTheme, update],
  );

  const value = useMemo<SettingsValue>(
    () => ({
      settings,
      update,
      reset,
      resolvedTheme,
      motionLevel,
      motionFactor: motionScale[motionLevel],
      toggleTheme,
    }),
    [settings, update, reset, resolvedTheme, motionLevel, toggleTheme],
  );

  return (
    <SettingsContext.Provider value={value}>
      <MotionConfig reducedMotion={motionLevel === 'minima' ? 'always' : 'never'}>{children}</MotionConfig>
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings precisa estar dentro de SettingsProvider');
  return ctx;
}

/** Gera transições do framer-motion já escaladas pela preferência de movimento. */
export function useMotion() {
  const { motionFactor, motionLevel } = useSettings();
  return useMemo(
    () => ({
      level: motionLevel,
      factor: motionFactor,
      reduced: motionLevel === 'minima',
      t: (duration: number, extra: Record<string, unknown> = {}) => ({
        duration: Math.max(0, duration * motionFactor),
        ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
        ...extra,
      }),
    }),
    [motionFactor, motionLevel],
  );
}
