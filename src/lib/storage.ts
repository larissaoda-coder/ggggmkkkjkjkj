/**
 * Persistência local. Todas as leituras e escritas são protegidas: em janelas
 * privadas, com armazenamento bloqueado ou cheio, o app continua funcionando
 * apenas com o estado em memória.
 */
const PREFIX = 'annelise:v1:';

export function storageKey(key: string): string {
  return PREFIX + key;
}

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('annelise:storage', { detail: key }));
    return true;
  } catch {
    return false;
  }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
    window.dispatchEvent(new CustomEvent('annelise:storage', { detail: key }));
  } catch {
    /* sem armazenamento disponível */
  }
}

/** Remove tudo o que este app guardou neste navegador. */
export function clearAllStored(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* sem armazenamento disponível */
  }
}
