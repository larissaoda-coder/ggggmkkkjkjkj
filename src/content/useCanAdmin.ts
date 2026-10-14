import { useEffect, useState } from 'react';
import { readStored, writeStored } from '../lib/storage';
import { useContent } from './ContentContext';

const KEY = 'admin:aparelho';

/** Marca este navegador como o de quem administra (usado só no modo local). */
export function rememberAdminDevice() {
  writeStored(KEY, true);
}

/**
 * Mostrar atalhos para a administração?
 * No claude.ai, só para quem tem permissão de edição (decidido pelo servidor).
 * Fora dele não existe login: os atalhos aparecem apenas no navegador em que a
 * página /admin já foi aberta, para não aparecerem para quem só visita.
 */
export function useCanAdmin(): boolean {
  const { backend } = useContent();
  const [device, setDevice] = useState(() => readStored<boolean>(KEY, false) === true);
  useEffect(() => {
    const on = () => setDevice(readStored<boolean>(KEY, false) === true);
    window.addEventListener('annelise:storage', on);
    return () => window.removeEventListener('annelise:storage', on);
  }, []);
  if (!backend?.canEdit) return false;
  return backend.mode === 'artifact' || device;
}
