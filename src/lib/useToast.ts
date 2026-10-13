import { useCallback, useEffect, useRef, useState } from 'react';

/** Mensagem breve e discreta, que some sozinha. */
export function useToast(duration = 2400) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback(
    (msg: string) => {
      window.clearTimeout(timer.current);
      setMessage(msg);
      timer.current = window.setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { message, show };
}
