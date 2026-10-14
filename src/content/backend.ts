/**
 * Onde o conteúdo editável é guardado.
 *
 * - Modo "artifact": quando a página roda publicada no claude.ai, usa o banco
 *   de dados do artifact (documento site/content) e o armazenamento de
 *   arquivos para as fotografias. Somente quem tem permissão de edição
 *   consegue salvar — a regra é aplicada pelo servidor, não pela página.
 * - Modo "local": em qualquer outra hospedagem, salva apenas no navegador
 *   (localStorage para textos, IndexedDB para imagens). Nada é enviado a
 *   lugar nenhum.
 */
import type { Content } from './types';

export type BackendMode = 'artifact' | 'local';

/* Tipos mínimos das capacidades do claude.ai usadas aqui. */
interface DocSnap {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
interface DocRef {
  get(): Promise<DocSnap>;
  set(data: Record<string, unknown>): Promise<void>;
  onSnapshot(next: (s: DocSnap) => void, error?: (e: { code: string }) => void): () => void;
}
interface DbApi {
  doc(path: string): DocRef;
}
interface UserApi {
  isOwner(): Promise<boolean>;
  canEdit(): Promise<boolean>;
}
interface AssetsApi {
  upload(blob: Blob, options?: { type?: string }): Promise<{ id: string; url: string }>;
  delete(idOrUrl: string): Promise<void>;
}
interface ClaudeRuntime {
  use(name: string): Promise<unknown>;
}

declare global {
  interface Window {
    claude?: ClaudeRuntime;
  }
}

export interface Backend {
  mode: BackendMode;
  /** A pessoa que está vendo pode editar e salvar. */
  canEdit: boolean;
  /** Banco disponível para leitura (no artifact, só para quem está conectado). */
  hasDb: boolean;
  /** Upload de imagens disponível. */
  canUpload: boolean;
  load(): Promise<Partial<Content> | null>;
  subscribe(cb: (c: Partial<Content> | null) => void): () => void;
  save(content: Content): Promise<void>;
  uploadImage(blob: Blob): Promise<string>;
  deleteImage(src: string): Promise<void>;
}

const DOC_PATH = 'site/content';
const LOCAL_KEY = 'annelise:v1:content';

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => window.setTimeout(() => r(fallback), ms))]);
}

function parseDoc(snap: DocSnap): Partial<Content> | null {
  if (!snap.exists) return null;
  const raw = snap.data()?.json;
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as Partial<Content>;
  } catch {
    return null;
  }
}

/* ---------------- Imagens no navegador (IndexedDB) ---------------- */
const IDB_NAME = 'annelise-media';
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('images');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function idbPut(id: string, blob: Blob) {
  const db = await idb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export async function idbGet(id: string): Promise<Blob | null> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = db.transaction('images').objectStore('images').get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(id: string) {
  const db = await idb();
  await new Promise<void>((resolve) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

function localBackend(): Backend {
  return {
    mode: 'local',
    canEdit: true,
    hasDb: false,
    canUpload: typeof indexedDB !== 'undefined',
    async load() {
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        return raw ? (JSON.parse(raw) as Partial<Content>) : null;
      } catch {
        return null;
      }
    },
    subscribe() {
      return () => {};
    },
    async save(content) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(content));
    },
    async uploadImage(blob) {
      const id = `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      await idbPut(id, blob);
      return `idb:${id}`;
    },
    async deleteImage(src) {
      if (src.startsWith('idb:')) await idbDelete(src.slice(4));
    },
  };
}

/** Descobre o ambiente e devolve o armazenamento adequado. */
export async function createBackend(): Promise<Backend> {
  const claude = window.claude;
  if (!claude?.use) return localBackend();

  const [db, user, assets] = await Promise.all([
    withTimeout(claude.use('db') as Promise<DbApi | null>, 10000, null),
    withTimeout(claude.use('user') as Promise<UserApi | null>, 10000, null),
    withTimeout(claude.use('assets') as Promise<AssetsApi | null>, 10000, null),
  ]);
  const owner = user ? await user.isOwner().catch(() => false) : false;
  const editor = user ? await user.canEdit().catch(() => false) : false;
  const canEdit = Boolean(db) && (owner || editor);

  return {
    mode: 'artifact',
    canEdit,
    hasDb: Boolean(db),
    canUpload: Boolean(assets) && canEdit,
    async load() {
      if (!db) return null;
      try {
        return parseDoc(await db.doc(DOC_PATH).get());
      } catch {
        return null;
      }
    },
    subscribe(cb) {
      if (!db) return () => {};
      return db.doc(DOC_PATH).onSnapshot((snap) => cb(parseDoc(snap)));
    },
    async save(content) {
      if (!db) throw new Error('sem-banco');
      await db.doc(DOC_PATH).set({ json: JSON.stringify(content), updatedAt: new Date().toISOString() });
    },
    async uploadImage(blob) {
      if (!assets) throw new Error('sem-upload');
      const result = await assets.upload(blob, { type: blob.type || 'image/jpeg' });
      return `/_blob/${result.id}`;
    },
    async deleteImage(src) {
      if (assets && src.startsWith('/_blob/')) await assets.delete(src.slice('/_blob/'.length)).catch(() => {});
    },
  };
}

/** Reduz a imagem antes de guardar: no máximo 2000 px no lado maior. */
export async function optimizeImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const max = 2000;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
  if (!blob) throw new Error('encode');
  return { blob, width, height };
}
