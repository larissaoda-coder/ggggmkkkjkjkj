import { useCallback, useEffect, useRef, useState } from 'react';
import { readStored, writeStored } from './storage';

/**
 * Estado React sincronizado com o armazenamento local.
 * `validate` permite descartar dados antigos ou corrompidos.
 */
export function usePersistentState<T>(key: string, initial: T | (() => T), validate?: (value: unknown) => value is T) {
  const [state, setState] = useState<T>(() => {
    const fallback = typeof initial === 'function' ? (initial as () => T)() : initial;
    const stored = readStored<unknown>(key, undefined);
    if (stored === undefined) return fallback;
    if (validate && !validate(stored)) return fallback;
    return stored as T;
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    writeStored(key, state);
  }, [key, state]);

  const reset = useCallback(() => {
    const fallback = typeof initial === 'function' ? (initial as () => T)() : initial;
    setState(fallback);
  }, [initial]);

  return [state, setState, reset] as const;
}
