import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@vercel/blob', () => ({
  put: vi.fn(async (path: string, body: string) => {
    store.set(path, body);
    return { url: `https://loja.public.blob.vercel-storage.com/${path}` };
  }),
  get: vi.fn(async (path: string) =>
    store.has(path) ? { statusCode: 200, stream: new Response(store.get(path)).body } : null,
  ),
  del: vi.fn(async () => undefined),
}));
vi.mock('@vercel/blob/client', () => ({
  handleUpload: vi.fn(async () => ({ type: 'blob.generate-client-token', clientToken: 'token' })),
}));

const { GET, PUT, POST, DELETE } = await import('../api/site');
const { put, del } = await import('@vercel/blob');
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
const URL_API = 'https://annelise.test/api/site';
const withPassword = (p: string) => ({ 'x-senha': encodeURIComponent(p) });

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_teste';
  env.ADMIN_PASSWORD = 'lírio azul';
});

describe('/api/site', () => {
  it('informa o que falta configurar', async () => {
    delete env.ADMIN_PASSWORD;
    delete env.BLOB_READ_WRITE_TOKEN;
    expect(await (await GET(new Request(`${URL_API}?acao=estado`))).json()).toEqual({
      armazenamento: false,
      senha: false,
    });
  });

  it('sem conteúdo salvo, responde vazio', async () => {
    expect((await GET(new Request(URL_API))).status).toBe(204);
  });

  it('só grava com a senha certa', async () => {
    const body = JSON.stringify({ home: { title: 'Outro' } });
    expect((await PUT(new Request(URL_API, { method: 'PUT', body }))).status).toBe(401);
    expect((await PUT(new Request(URL_API, { method: 'PUT', body, headers: withPassword('errada') }))).status).toBe(
      401,
    );
    expect(put).not.toHaveBeenCalled();

    const ok = await PUT(new Request(URL_API, { method: 'PUT', body, headers: withPassword('lírio azul') }));
    expect(ok.status).toBe(200);
    expect(put).toHaveBeenCalledWith(
      'site/conteudo.json',
      body,
      expect.objectContaining({ access: 'public', allowOverwrite: true }),
    );
    const res = await GET(new Request(URL_API));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ home: { title: 'Outro' } });
  });

  it('recusa conteúdo que não é um objeto JSON', async () => {
    const res = await PUT(new Request(URL_API, { method: 'PUT', body: '[1,2]', headers: withPassword('lírio azul') }));
    expect(res.status).toBe(400);
  });

  it('confere a senha na entrada', async () => {
    expect((await POST(new Request(`${URL_API}?acao=entrar`, { method: 'POST' }))).status).toBe(401);
    const ok = await POST(
      new Request(`${URL_API}?acao=entrar`, { method: 'POST', headers: withPassword('lírio azul') }),
    );
    expect(await ok.json()).toEqual({ ok: true, armazenamento: true });
    delete env.ADMIN_PASSWORD;
    expect((await POST(new Request(`${URL_API}?acao=entrar`, { method: 'POST' }))).status).toBe(503);
  });

  it('só autoriza envio de arquivo com a senha', async () => {
    const body = JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname: 'fotos/a.jpg' } });
    expect((await POST(new Request(`${URL_API}?acao=enviar`, { method: 'POST', body }))).status).toBe(401);
    const ok = await POST(
      new Request(`${URL_API}?acao=enviar`, { method: 'POST', body, headers: withPassword('lírio azul') }),
    );
    expect(ok.status).toBe(200);
  });

  it('só apaga arquivos do próprio armazenamento', async () => {
    const h = withPassword('lírio azul');
    const fora = await DELETE(
      new Request(`${URL_API}?url=${encodeURIComponent('https://exemplo.com/a.jpg')}`, {
        method: 'DELETE',
        headers: h,
      }),
    );
    expect(fora.status).toBe(400);
    const blob = 'https://loja.public.blob.vercel-storage.com/fotos/a.jpg';
    const ok = await DELETE(
      new Request(`${URL_API}?url=${encodeURIComponent(blob)}`, { method: 'DELETE', headers: h }),
    );
    expect(ok.status).toBe(200);
    expect(del).toHaveBeenCalledWith(blob);
  });
});
