import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { usePersistentState } from '../lib/usePersistentState';

/**
 * Registro leve do percurso: quais seções já foram visitadas e se o
 * observatório (a descoberta opcional) já foi encontrado.
 * Nada aqui bloqueia o acesso a qualquer seção.
 */
interface ProgressState {
  visited: string[];
  secretFound: boolean;
  secretFoundAt?: number;
}

interface ProgressValue extends ProgressState {
  markVisited: (section: string) => void;
  revealSecret: () => void;
  forget: () => void;
}

const initial: ProgressState = { visited: [], secretFound: false };

const ProgressContext = createContext<ProgressValue | null>(null);

function isProgress(v: unknown): v is ProgressState {
  return typeof v === 'object' && v !== null && Array.isArray((v as ProgressState).visited);
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = usePersistentState<ProgressState>('progress', initial, isProgress);

  const markVisited = useCallback(
    (section: string) =>
      setState((prev) => (prev.visited.includes(section) ? prev : { ...prev, visited: [...prev.visited, section] })),
    [setState],
  );
  const revealSecret = useCallback(
    () => setState((prev) => (prev.secretFound ? prev : { ...prev, secretFound: true, secretFoundAt: Date.now() })),
    [setState],
  );
  const forget = useCallback(() => setState(initial), [setState]);

  const value = useMemo(
    () => ({ ...state, markVisited, revealSecret, forget }),
    [state, markVisited, revealSecret, forget],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress precisa estar dentro de ProgressProvider');
  return ctx;
}
