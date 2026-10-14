/**
 * Onde o conteúdo editável é guardado.
 *
 * - Modo "artifact": quando a página roda publicada no claude.ai, usa o banco
 *   de dados do artifact (documento site/content) e o armazenamento de
 *   arquivos para as fotografias. Somente quem tem permissão de edição
 *   consegue salvar — a regra é aplicada pelo servidor, não pela página.
 * - Modo "github": em qualquer outra hospedagem (Vercel), salvar grava
 *   public/content.json e as fotografias enviadas direto no repositório do
 *   site, e a hospedagem publica a nova versão sozinha. Só salva quem colou
 *   um token do GitHub com permissão de escrita; o token fica apenas no
 *   navegador de quem administra.
 */
import type { Content } from './types';

export type BackendMode = 'artifact' | 'github';

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

/* ---------------- GitHub: publica no repositório do site ---------------- */
export const REPO = { owner: 'larissaoda-coder', name: 'ggggmkkkjkjkj', branch: 'claude/annelise-app' };
const TOKEN_KEY = 'annelise:v1:github-token';
const CONTENT_PATH = 'public/content.json';

export function githubToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setGithubToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* armazenamento bloqueado */
  }
}

/** Arquivos enviados nesta sessão que a hospedagem ainda não publicou: mostrados a partir da memória. */
export const pendingMedia = new Map<string, string>();

class GithubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function gh(path: string, token: string, init: RequestInit = {}) {
  const url = `https://api.github.com/repos/${REPO.owner}/${REPO.name}${path}`;
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok && res.status !== 404) throw new GithubError(res.status, `GitHub ${res.status}`);
  return res;
}

function bytesToBase64(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function fileSha(path: string, token: string): Promise<string | undefined> {
  const res = await gh(`/contents/${path}?ref=${encodeURIComponent(REPO.branch)}`, token);
  if (res.status === 404) return undefined;
  return ((await res.json()) as { sha: string }).sha;
}

async function putFile(path: string, bytes: Uint8Array, message: string, token: string) {
  const sha = await fileSha(path, token);
  const body = { message, content: bytesToBase64(bytes), branch: REPO.branch, ...(sha ? { sha } : {}) };
  const res = await gh(`/contents/${path}`, token, { method: 'PUT', body: JSON.stringify(body) });
  if (res.status === 404) throw new GithubError(404, 'repositório não encontrado');
}

/** Confere se o token abre o repositório. A permissão de escrita só se confirma ao salvar. */
export async function checkGithubToken(token: string): Promise<'ok' | 'invalido' | 'sem-acesso' | 'rede'> {
  try {
    const res = await gh('', token);
    return res.ok ? 'ok' : 'sem-acesso';
  } catch (e) {
    if (e instanceof GithubError) return e.status === 401 ? 'invalido' : 'sem-acesso';
    return 'rede';
  }
}

/** Mensagem para quem administra quando o GitHub recusa uma gravação. */
export function githubErrorText(e: unknown): string | null {
  if (!(e instanceof GithubError)) return null;
  if (e.status === 401) return 'O token do GitHub não vale mais. Desconecte este aparelho e cole um token novo.';
  if (e.status === 403 || e.status === 404)
    return 'O token do GitHub não tem permissão para gravar no repositório. Ele precisa de "Contents: Read and write".';
  if (e.status === 409 || e.status === 422)
    return 'O conteúdo mudou no GitHub enquanto você editava. Recarregue a página e tente de novo.';
  return null;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
};

function githubBackend(): Backend {
  const token = githubToken();
  return {
    mode: 'github',
    canEdit: Boolean(token),
    hasDb: false,
    canUpload: Boolean(token),
    async load() {
      // Quem administra vê a última versão gravada, mesmo antes de a hospedagem terminar de publicar.
      if (!token) return null;
      try {
        const res = await fetch(
          `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(REPO.branch)}`,
          {
            cache: 'no-store',
            headers: { Accept: 'application/vnd.github.raw+json', Authorization: `Bearer ${token}` },
          },
        );
        return res.ok ? ((await res.json()) as Partial<Content>) : null;
      } catch {
        return null;
      }
    },
    subscribe() {
      return () => {};
    },
    async save(content) {
      const t = githubToken();
      if (!t) throw new GithubError(401, 'sem token');
      const bytes = new TextEncoder().encode(JSON.stringify(content, null, 2) + '\n');
      await putFile(CONTENT_PATH, bytes, 'Conteúdo atualizado pela administração', t);
    },
    async uploadImage(blob) {
      const t = githubToken();
      if (!t) throw new GithubError(401, 'sem token');
      const audio = blob.type.startsWith('audio/');
      const ext = EXT[blob.type] ?? (audio ? 'mp3' : 'jpg');
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const src = `${audio ? 'musicas' : 'fotos'}/up-${id}.${ext}`;
      await putFile(`public/${src}`, new Uint8Array(await blob.arrayBuffer()), 'Arquivo enviado pela administração', t);
      pendingMedia.set(src, URL.createObjectURL(blob));
      return src;
    },
    async deleteImage(src) {
      // Só apaga o que foi enviado pela administração; os arquivos que vieram com o site ficam.
      const t = githubToken();
      if (!t || !/^(fotos|musicas)\/up-/.test(src)) return;
      const sha = await fileSha(`public/${src}`, t);
      if (!sha) return;
      await gh(`/contents/public/${src}`, t, {
        method: 'DELETE',
        body: JSON.stringify({ message: 'Arquivo removido pela administração', sha, branch: REPO.branch }),
      });
    },
  };
}

/** Descobre o ambiente e devolve o armazenamento adequado. */
export async function createBackend(): Promise<Backend> {
  const claude = window.claude;
  if (!claude?.use) return githubBackend();

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
