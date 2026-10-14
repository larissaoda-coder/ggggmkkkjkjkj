/**
 * Onde o conteúdo editável é guardado.
 *
 * - Modo "artifact": quando a página roda publicada no claude.ai, usa o banco
 *   de dados do artifact (documento site/content) e o armazenamento de
 *   arquivos para as fotografias. Somente quem tem permissão de edição
 *   consegue salvar — a regra é aplicada pelo servidor, não pela página.
 * - Modo "site": na Vercel, a função /api/site guarda o conteúdo e os
 *   arquivos no Vercel Blob. Ler é aberto a todos; gravar pede a senha da
 *   área de edição, conferida no servidor. A senha fica guardada só no
 *   navegador de quem edita.
 */
import type { Content } from './types';

export type BackendMode = 'artifact' | 'site';

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
export async function idbDelete(id: string) {
  const db = await idb();
  await new Promise<void>((resolve) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/* ---------------- Área de edição na hospedagem (Vercel) ---------------- */
const API = '/api/site';
const PASS_KEY = 'annelise:v1:senha';

export function savedPassword(): string | null {
  try {
    return localStorage.getItem(PASS_KEY);
  } catch {
    return null;
  }
}
export function setSavedPassword(password: string | null) {
  try {
    if (password) localStorage.setItem(PASS_KEY, password);
    else localStorage.removeItem(PASS_KEY);
  } catch {
    /* armazenamento bloqueado */
  }
}

const auth = (password: string | null) => ({ 'x-senha': encodeURIComponent(password ?? '') });

class SiteError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

async function apiJson(res: Response): Promise<Record<string, unknown> | null> {
  if (!(res.headers.get('content-type') ?? '').includes('json')) return null;
  return (await res.json().catch(() => null)) as Record<string, unknown> | null;
}

/** O que já foi configurado na Vercel: o armazenamento (Blob) e a senha. Null se a função não existe aqui. */
export async function siteSetup(): Promise<{ armazenamento: boolean; senha: boolean } | null> {
  try {
    const data = await apiJson(await fetch(`${API}?acao=estado`, { cache: 'no-store' }));
    return data ? { armazenamento: Boolean(data.armazenamento), senha: Boolean(data.senha) } : null;
  } catch {
    return null;
  }
}

export async function checkPassword(password: string): Promise<'ok' | 'senha' | 'sem-senha' | 'rede'> {
  try {
    const res = await fetch(`${API}?acao=entrar`, { method: 'POST', headers: auth(password), cache: 'no-store' });
    const data = await apiJson(res);
    if (!data) return 'rede';
    if (res.ok) return 'ok';
    return data.erro === 'sem-senha' ? 'sem-senha' : res.status === 401 ? 'senha' : 'rede';
  } catch {
    return 'rede';
  }
}

/** Mensagem para quem edita quando o servidor recusa uma gravação. */
export function siteErrorText(e: unknown): string | null {
  if (!(e instanceof SiteError)) return null;
  if (e.status === 401) return 'A senha mudou. Saia deste aparelho e entre de novo com a senha nova.';
  if (e.code === 'armazenamento')
    return 'O armazenamento ainda não está ligado ao projeto na Vercel (Storage → Blob → Connect).';
  if (e.status === 413) return 'O conteúdo ficou grande demais para salvar de uma vez.';
  return null;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
};

function siteBackend(): Backend {
  const password = savedPassword();
  return {
    mode: 'site',
    canEdit: Boolean(password),
    hasDb: false,
    canUpload: Boolean(password),
    async load() {
      try {
        // Quem edita pula o cache da borda para ver na hora o que acabou de salvar.
        const res = await fetch(password ? `${API}?v=${Date.now()}` : API, { cache: 'no-store' });
        if (res.status !== 200) return null;
        return (await apiJson(res)) as Partial<Content> | null;
      } catch {
        return null;
      }
    },
    subscribe() {
      return () => {};
    },
    async save(content) {
      const res = await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth(savedPassword()) },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new SiteError(res.status, String((await apiJson(res))?.erro ?? res.status));
    },
    async uploadImage(blob) {
      const { upload } = await import('@vercel/blob/client');
      const audio = blob.type.startsWith('audio/');
      const ext = EXT[blob.type] ?? (audio ? 'mp3' : 'jpg');
      const result = await upload(`${audio ? 'musicas' : 'fotos'}/${Date.now().toString(36)}.${ext}`, blob, {
        access: 'public',
        handleUploadUrl: `${API}?acao=enviar`,
        headers: auth(savedPassword()),
        contentType: blob.type || undefined,
        multipart: blob.size > 8 * 1024 * 1024,
      });
      return result.url;
    },
    async deleteImage(src) {
      // Só apaga o que foi enviado pela área de edição; os arquivos que vieram com o site ficam.
      if (!/^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(src)) return;
      await fetch(`${API}?url=${encodeURIComponent(src)}`, { method: 'DELETE', headers: auth(savedPassword()) });
    },
  };
}

/** Descobre o ambiente e devolve o armazenamento adequado. */
export async function createBackend(): Promise<Backend> {
  const claude = window.claude;
  if (!claude?.use) return siteBackend();

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
