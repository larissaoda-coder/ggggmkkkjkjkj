import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { usePersistentState } from '../lib/usePersistentState';

/**
 * Progresso de quem visita, guardado só no próprio aparelho.
 * Marcos (milestones) registram o que já foi visto e liberam a página final.
 */
export interface Progress {
  milestones: string[];
  starsOpened: string[];
  envelopesOpened: string[];
  lastStar: string;
  lastWord: string;
}

const initial: Progress = { milestones: [], starsOpened: [], envelopesOpened: [], lastStar: '', lastWord: '' };

interface ProgressValue extends Progress {
  mark: (milestone: string) => void;
  openStar: (id: string) => void;
  openEnvelope: (id: string) => void;
  setLastWord: (id: string) => void;
  reset: () => void;
}

const ProgressContext = createContext<ProgressValue | null>(null);

function isProgress(v: unknown): v is Progress {
  return typeof v === 'object' && v !== null && Array.isArray((v as Progress).milestones);
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = usePersistentState<Progress>('progresso', initial, isProgress);
  const p = { ...initial, ...state };

  const mark = useCallback(
    (m: string) =>
      setState((s) => (s.milestones.includes(m) ? s : { ...initial, ...s, milestones: [...s.milestones, m] })),
    [setState],
  );
  const openStar = useCallback(
    (id: string) =>
      setState((s) => {
        const cur = { ...initial, ...s };
        return {
          ...cur,
          lastStar: id,
          starsOpened: cur.starsOpened.includes(id) ? cur.starsOpened : [...cur.starsOpened, id],
        };
      }),
    [setState],
  );
  const openEnvelope = useCallback(
    (id: string) =>
      setState((s) => {
        const cur = { ...initial, ...s };
        return cur.envelopesOpened.includes(id) ? cur : { ...cur, envelopesOpened: [...cur.envelopesOpened, id] };
      }),
    [setState],
  );
  const setLastWord = useCallback((id: string) => setState((s) => ({ ...initial, ...s, lastWord: id })), [setState]);
  const reset = useCallback(() => setState(initial), [setState]);

  const value = useMemo(
    () => ({ ...p, mark, openStar, openEnvelope, setLastWord, reset }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, mark, openStar, openEnvelope, setLastWord, reset],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress precisa estar dentro de ProgressProvider');
  return ctx;
}
