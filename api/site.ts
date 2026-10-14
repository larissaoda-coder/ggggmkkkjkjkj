/**
 * Conteúdo editável do site, guardado no Vercel Blob.
 *
 *   GET    /api/site                conteúdo salvo pela área de edição (público; 204 se ainda não houver)
 *   GET    /api/site?acao=estado    se o armazenamento e a senha já foram configurados
 *   POST   /api/site?acao=entrar    confere a senha
 *   PUT    /api/site                grava o conteúdo (senha)
 *   POST   /api/site?acao=enviar    autoriza o envio de um arquivo direto do navegador (senha)
 *   DELETE /api/site?url=…          apaga um arquivo enviado (senha)
 *
 * Variáveis do projeto na Vercel: BLOB_READ_WRITE_TOKEN (criada ao ligar um Blob ao
 * projeto) e ADMIN_PASSWORD (a senha da área de edição).
 */
import { del, get, put } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

declare const process: { env: Record<string, string | undefined> };

const CONTENT = 'site/conteudo.json';
const MAX_CONTENT = 1024 * 1024;
const MAX_FILE = 50 * 1024 * 1024;
const TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/wav',
];

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

const hasStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const adminPassword = () => process.env.ADMIN_PASSWORD ?? '';

/** Comparação que leva o mesmo tempo acerte ou erre. */
function same(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

async function authorized(request: Request) {
  const expected = adminPassword();
  let given = '';
  try {
    given = decodeURIComponent(request.headers.get('x-senha') ?? '');
  } catch {
    given = '';
  }
  if (expected && given && same(given, expected)) return true;
  await new Promise((r) => setTimeout(r, 700)); // freia tentativas de adivinhar
  return false;
}

export async function GET(request: Request) {
  const acao = new URL(request.url).searchParams.get('acao');
  if (acao === 'estado') return json({ armazenamento: hasStorage(), senha: Boolean(adminPassword()) });

  const empty = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  if (!hasStorage()) return empty();
  const found = await get(CONTENT, { access: 'public', useCache: false }).catch(() => null);
  if (!found || found.statusCode !== 200) return empty();
  const text = await new Response(found.stream).text();
  return new Response(text, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Alguns segundos de cache na borda: quem visita vê a mudança logo depois de salvar.
      'Cache-Control': 'public, max-age=0, s-maxage=5',
    },
  });
}

export async function PUT(request: Request) {
  if (!hasStorage()) return json({ erro: 'armazenamento' }, 503);
  if (!(await authorized(request))) return json({ erro: 'senha' }, 401);
  const text = await request.text();
  if (text.length > MAX_CONTENT) return json({ erro: 'grande' }, 413);
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('formato');
  } catch {
    return json({ erro: 'formato' }, 400);
  }
  await put(CONTENT, text, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
  // Cópia de cada versão salva, para recuperar algo apagado por engano.
  await put(`site/historico/${new Date().toISOString().replace(/[:.]/g, '-')}.json`, text, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'application/json',
  }).catch(() => null);
  return json({ ok: true });
}

export async function POST(request: Request) {
  const acao = new URL(request.url).searchParams.get('acao');

  if (acao === 'entrar') {
    if (!adminPassword()) return json({ erro: 'sem-senha' }, 503);
    return (await authorized(request)) ? json({ ok: true, armazenamento: hasStorage() }) : json({ erro: 'senha' }, 401);
  }

  if (acao === 'enviar') {
    if (!hasStorage()) return json({ erro: 'armazenamento' }, 503);
    const body = (await request.json()) as HandleUploadBody;
    // O pedido de autorização vem do navegador e precisa da senha; o aviso de envio concluído
    // vem da própria Vercel e é conferido por handleUpload.
    if (body.type === 'blob.generate-client-token' && !(await authorized(request))) return json({ erro: 'senha' }, 401);
    try {
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: TYPES,
          maximumSizeInBytes: MAX_FILE,
          addRandomSuffix: true,
        }),
      });
      return json(result);
    } catch (e) {
      return json({ erro: e instanceof Error ? e.message : 'envio' }, 400);
    }
  }

  return json({ erro: 'acao' }, 404);
}

export async function DELETE(request: Request) {
  if (!hasStorage()) return json({ erro: 'armazenamento' }, 503);
  if (!(await authorized(request))) return json({ erro: 'senha' }, 401);
  const url = new URL(request.url).searchParams.get('url') ?? '';
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    host = '';
  }
  if (!host.endsWith('.blob.vercel-storage.com')) return json({ erro: 'url' }, 400);
  await del(url).catch(() => null);
  return json({ ok: true });
}
