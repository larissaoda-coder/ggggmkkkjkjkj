import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { defaultContent } from './defaults';
import { createBackend, idbGet, type Backend } from './backend';
import type { Content, Photo } from './types';

/** Junta o conteúdo salvo ao padrão, chave por chave, para tolerar versões antigas. */
export function mergeContent(base: Content, over: Partial<Content> | null | undefined): Content {
  if (!over || typeof over !== 'object') return base;
  const out: Content = { ...base };
  for (const key of Object.keys(base) as (keyof Content)[]) {
    const value = over[key];
    if (value === undefined || value === null) continue;
    const current = base[key];
    if (Array.isArray(current)) {
      if (Array.isArray(value)) (out as unknown as Record<string, unknown>)[key] = value;
    } else if (typeof current === 'object') {
      (out as unknown as Record<string, unknown>)[key] = { ...(current as object), ...(value as object) };
    } else if (typeof value === typeof current) {
      (out as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface ContentValue {
  content: Content;
  backend: Backend | null;
  ready: boolean;
  saveState: SaveState;
  saveError: string | null;
  save: (next: Content) => Promise<boolean>;
  photo: (id: string) => Photo | undefined;
}

const ContentContext = createContext<ContentValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content>(defaultContent);
  const [backend, setBackend] = useState<Backend | null>(null);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const baseRef = useRef<Content>(defaultContent);

  useEffect(() => {
    let unsub = () => {};
    let alive = true;
    (async () => {
      // 1. Conteúdo publicado junto com o site (content.json), quando existir.
      try {
        const res = await fetch('./content.json', { cache: 'no-cache' });
        if (res.ok) baseRef.current = mergeContent(defaultContent, (await res.json()) as Partial<Content>);
      } catch {
        /* sem arquivo publicado: usa o padrão */
      }
      if (!alive) return;
      setContent(baseRef.current);
      // 2. Conteúdo salvo pela área administrativa.
      const b = await createBackend();
      if (!alive) return;
      setBackend(b);
      const saved = await b.load();
      if (!alive) return;
      if (saved) setContent(mergeContent(baseRef.current, saved));
      setReady(true);
      unsub = b.subscribe((remote) => {
        if (remote) setContent(mergeContent(baseRef.current, remote));
      });
    })();
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const save = useCallback(
    async (next: Content) => {
      if (!backend) return false;
      setSaveState('saving');
      setSaveError(null);
      try {
        await backend.save(next);
        setContent(next);
        setSaveState('saved');
        window.setTimeout(() => setSaveState('idle'), 2200);
        return true;
      } catch (e) {
        const code = (e as { code?: string })?.code;
        setSaveError(
          code === 'resource_exhausted' || code === 'quota_exceeded'
            ? 'O conteúdo ficou grande demais para salvar de uma vez. Remova algumas fotografias ou textos longos e tente de novo.'
            : backend.mode === 'local'
              ? 'Não foi possível salvar neste navegador. Verifique se o armazenamento do site não está bloqueado.'
              : 'Não foi possível salvar agora. Verifique a conexão e tente de novo.',
        );
        setSaveState('error');
        return false;
      }
    },
    [backend],
  );

  const photo = useCallback((id: string) => content.photos.find((p) => p.id === id), [content.photos]);

  const value = useMemo(
    () => ({ content, backend, ready, saveState, saveError, save, photo }),
    [content, backend, ready, saveState, saveError, save, photo],
  );
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent precisa estar dentro de ContentProvider');
  return ctx;
}

/** Resolve o endereço exibível de uma imagem (inclusive as guardadas no navegador). */
const objectUrls = new Map<string, string>();

/** Versão sem hook: devolve um endereço tocável/exibível, ou null se o arquivo não existir mais. */
export async function resolveMediaSrc(src: string): Promise<string | null> {
  if (!src.startsWith('idb:')) return src;
  const cached = objectUrls.get(src);
  if (cached) return cached;
  const blob = await idbGet(src.slice(4)).catch(() => null);
  if (!blob) return null;
  const u = URL.createObjectURL(blob);
  objectUrls.set(src, u);
  return u;
}
export function useMediaSrc(src: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() =>
    !src ? undefined : src.startsWith('idb:') ? objectUrls.get(src) : src,
  );
  useEffect(() => {
    if (!src) {
      setUrl(undefined);
      return;
    }
    if (!src.startsWith('idb:')) {
      setUrl(src);
      return;
    }
    const cached = objectUrls.get(src);
    if (cached) {
      setUrl(cached);
      return;
    }
    let alive = true;
    idbGet(src.slice(4))
      .then((blob) => {
        if (!blob || !alive) return;
        const u = URL.createObjectURL(blob);
        objectUrls.set(src, u);
        setUrl(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src]);
  return url;
}
