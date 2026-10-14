import { useMemo, useRef, useState } from 'react';
import type { Backend } from '../../content/backend';
import { optimizeImage } from '../../content/backend';
import { defaultContent } from '../../content/defaults';
import { mergeContent } from '../../content/ContentContext';
import type { Content, FutureScene, Photo, Star, Track } from '../../content/types';
import { MediaImg } from '../../components/MediaImg';
import { fragments } from '../../data/fragments';
import { spotifyEmbedUrl } from '../../data/spotify';
import { sections } from '../../app/sections';
import { scenes as storyScenes, chapters, speakerNames } from '../simulator/story';
import { Check, Choice, Items, PhotoPicker, RemoveButton, Section, Text, uid } from './fields';

export interface TabProps {
  draft: Content;
  patch: (fn: (d: Content) => Content) => void;
  backend: Backend;
  onUploaded: (src: string) => void;
}

const setKey =
  <K extends keyof Content>(patch: TabProps['patch'], key: K) =>
  (value: Content[K]) =>
    patch((d) => ({ ...d, [key]: value }));

function uploadError(e: unknown, name: string) {
  const msg = e instanceof Error ? e.message : '';
  if (msg === 'sem-upload') return `“${name}”: o envio de arquivos não está disponível para esta conta.`;
  if (/decode|bitmap|source image|InvalidState/i.test(msg) || e instanceof DOMException)
    return `“${name}”: este navegador não consegue abrir o formato do arquivo. Use JPG ou PNG.`;
  return `“${name}” não foi enviado. Verifique a conexão e tente de novo.`;
}

function measure(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('load'));
    img.src = url;
  });
}

/* ---------------- Início e livro ---------------- */
export function HomeTab({ draft, patch }: TabProps) {
  const home = draft.home;
  const setHome = (p: Partial<Content['home']>) => patch((d) => ({ ...d, home: { ...d.home, ...p } }));
  return (
    <>
      <Section title="Página inicial">
        <Text label="Título" value={home.title} onChange={(v) => setHome({ title: v })} />
        <Text label="Subtítulo" value={home.subtitle} onChange={(v) => setHome({ subtitle: v })} rows={2} />
        <Text label="Rodapé" value={home.footer} onChange={(v) => setHome({ footer: v })} />
      </Section>
      <Section
        title="Livro: dedicatória"
        note="A carta e os dez fragmentos entram no livro exatamente como foram escritos e não são editados aqui."
      >
        <Text
          label="Dedicatória"
          value={draft.book.dedication}
          onChange={(v) => patch((d) => ({ ...d, book: { ...d.book, dedication: v } }))}
          rows={4}
        />
      </Section>
    </>
  );
}

/* ---------------- Fotografias ---------------- */
const categories = [
  { value: 'retratos' as const, label: 'Retratos' },
  { value: 'detalhes' as const, label: 'Detalhes' },
  { value: 'favoritas' as const, label: 'Favoritas' },
];

export function PhotosTab({ draft, patch, backend, onUploaded }: TabProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [url, setUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const photos = draft.photos;
  const setPhotos = (fn: (p: Photo[]) => Photo[]) => patch((d) => ({ ...d, photos: fn(d.photos) }));

  const upload = async (file: File) => {
    const { blob, width, height } = await optimizeImage(file);
    const src = await backend.uploadImage(blob);
    onUploaded(src);
    return { src, width, height };
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files];
    const errs: string[] = [];
    for (let i = 0; i < list.length; i++) {
      setBusy(`Enviando ${i + 1} de ${list.length}`);
      try {
        const { src, width, height } = await upload(list[i]);
        setPhotos((p) => [
          ...p,
          {
            id: uid('foto'),
            src,
            width,
            height,
            caption: '',
            dedication: '',
            category: 'retratos',
            frame: 'livre',
            inBook: true,
          },
        ]);
      } catch (e) {
        errs.push(uploadError(e, list[i].name));
      }
    }
    setErrors(errs);
    setBusy(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addUrl = async () => {
    const value = url.trim();
    if (!value) return;
    setBusy('Verificando o endereço');
    try {
      const { width, height } = await measure(value);
      setPhotos((p) => [
        ...p,
        {
          id: uid('foto'),
          src: value,
          width,
          height,
          caption: '',
          dedication: '',
          category: 'retratos',
          frame: 'livre',
          inBook: true,
        },
      ]);
      setUrl('');
      setErrors([]);
    } catch {
      setErrors(['Não foi possível carregar uma imagem nesse endereço.']);
    }
    setBusy(null);
  };

  const replace = async (id: string, file: File | undefined) => {
    if (!file) return;
    setBusy('Substituindo');
    try {
      const { src, width, height } = await upload(file);
      setPhotos((p) => p.map((x) => (x.id === id ? { ...x, src, width, height } : x)));
      setErrors([]);
    } catch (e) {
      setErrors([uploadError(e, file.name)]);
    }
    setBusy(null);
  };

  const move = (i: number, d: number) =>
    setPhotos((p) => {
      const j = i + d;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <Section
      title="Fotografias"
      note={
        <>
          <p>
            As imagens são reduzidas para no máximo 2000 px antes de serem guardadas.{' '}
            {backend.mode === 'artifact'
              ? 'Elas ficam no armazenamento deste site no claude.ai.'
              : 'Neste modo elas ficam guardadas apenas neste navegador.'}{' '}
            Novas fotografias aparecem no site depois de salvar.
          </p>
          <p>A ordem aqui é a ordem do arquivo pessoal e do livro.</p>
        </>
      }
    >
      <div className="aphotos__add">
        <label className="ab ab--solid" aria-disabled={!backend.canUpload || Boolean(busy)}>
          Enviar fotografias
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={!backend.canUpload || Boolean(busy)}
            onChange={(e) => void addFiles(e.target.files)}
          />
        </label>
        <div className="aphotos__url">
          <Text
            label="Ou adicionar pelo endereço da imagem"
            value={url}
            onChange={setUrl}
            type="url"
            placeholder="https://… ou fotos/arquivo.jpg"
          />
          <button type="button" className="ab" onClick={() => void addUrl()} disabled={!url.trim() || Boolean(busy)}>
            Adicionar
          </button>
        </div>
      </div>
      {!backend.canUpload && <p className="a-warn">O envio de arquivos não está disponível nesta visualização.</p>}
      <p className="a-status" role="status">
        {busy}
      </p>
      {errors.map((e) => (
        <p key={e} className="a-error" role="alert">
          {e}
        </p>
      ))}

      {photos.length === 0 ? (
        <p className="ai__empty">Ainda não há fotografias.</p>
      ) : (
        <ol className="aphotos">
          {photos.map((p, i) => {
            const up = (q: Partial<Photo>) =>
              setPhotos((list) => list.map((x) => (x.id === p.id ? { ...x, ...q } : x)));
            return (
              <li key={p.id} className="aphoto">
                <span className="aphoto__img" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
                  <MediaImg src={p.src} alt="" />
                </span>
                <div className="aphoto__fields">
                  <span className="aphoto__num num">
                    {i + 1} · {p.width}×{p.height}
                  </span>
                  <Text label="Legenda" value={p.caption} onChange={(v) => up({ caption: v })} />
                  <Text label="Dedicatória" value={p.dedication} onChange={(v) => up({ dedication: v })} rows={2} />
                  <div className="a-row">
                    <Choice
                      label="Coleção"
                      value={p.category}
                      options={categories}
                      onChange={(v) => up({ category: v })}
                    />
                    <Choice
                      label="Moldura"
                      value={p.frame}
                      options={[
                        { value: 'livre', label: 'Sem moldura' },
                        { value: 'polaroide', label: 'Polaroide' },
                        { value: 'serrilhada', label: 'Cópia antiga (borda serrilhada)' },
                        { value: 'recorte', label: 'Recorte de papel' },
                      ]}
                      onChange={(v) => up({ frame: v })}
                    />
                  </div>
                  <Check label="Incluir no livro" checked={p.inBook} onChange={(v) => up({ inBook: v })} />
                  <div className="aphoto__actions">
                    <button
                      type="button"
                      className="ab ab--icon"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Mover para antes"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="ab ab--icon"
                      onClick={() => move(i, 1)}
                      disabled={i === photos.length - 1}
                      aria-label="Mover para depois"
                    >
                      ↓
                    </button>
                    <label className="ab" aria-disabled={!backend.canUpload || Boolean(busy)}>
                      Substituir
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={!backend.canUpload || Boolean(busy)}
                        onChange={(e) => void replace(p.id, e.target.files?.[0])}
                      />
                    </label>
                    <RemoveButton onConfirm={() => setPhotos((list) => list.filter((x) => x.id !== p.id))} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}

/* ---------------- Mapa ---------------- */
const starKinds = [
  { value: 'foto' as const, label: 'Fotografia' },
  { value: 'texto' as const, label: 'Texto' },
  { value: 'musica' as const, label: 'Música' },
  { value: 'pergunta' as const, label: 'Pergunta' },
  { value: 'carta' as const, label: 'Carta curta' },
  { value: 'segredo' as const, label: 'Segredo (abre por último)' },
];
const starCats = [
  { value: 'memoria' as const, label: 'Memória' },
  { value: 'musica' as const, label: 'Música' },
  { value: 'texto' as const, label: 'Texto' },
  { value: 'pergunta' as const, label: 'Pergunta' },
];

export function MapTab({ draft, patch }: TabProps) {
  const pct = (v: string) => Math.max(4, Math.min(96, Number(v) || 50));
  return (
    <Section
      title="Pontos de referência"
      note="Cada ponto abre um conteúdo. A posição vai de 0 a 100 (esquerda→direita, topo→base). O ponto do tipo Segredo só abre depois dos outros."
    >
      <Items<Star>
        items={draft.stars}
        onChange={setKey(patch, 'stars')}
        title={(s) => `${s.title} · ${starKinds.find((k) => k.value === s.kind)?.label ?? ''}`}
        addLabel="Adicionar ponto"
        create={() => ({
          id: uid('ponto'),
          kind: 'texto',
          category: 'texto',
          title: 'Novo ponto',
          body: '',
          fragment: 0,
          photoId: '',
          trackId: '',
          x: 50,
          y: 50,
        })}
        render={(s, up) => (
          <>
            <Text label="Título" value={s.title} onChange={(v) => up({ title: v })} />
            <div className="a-row">
              <Choice label="Tipo de conteúdo" value={s.kind} options={starKinds} onChange={(v) => up({ kind: v })} />
              <Choice
                label="Categoria (filtro)"
                value={s.category}
                options={starCats}
                onChange={(v) => up({ category: v })}
              />
            </div>
            {s.kind === 'texto' && (
              <Choice
                label="Fragmento"
                value={s.fragment}
                options={[
                  { value: 0, label: 'Nenhum: usar o texto abaixo' },
                  ...fragments.map((f) => ({ value: f.number, label: `Fragmento ${f.number}` })),
                ]}
                onChange={(v) => up({ fragment: v })}
              />
            )}
            {s.kind === 'foto' && (
              <PhotoPicker
                label="Fotografia"
                value={s.photoId}
                photos={draft.photos}
                onChange={(v) => up({ photoId: v })}
              />
            )}
            {s.kind === 'musica' && (
              <Choice
                label="Faixa"
                value={s.trackId}
                options={[
                  { value: '', label: 'Nenhuma' },
                  ...draft.tracks.map((t) => ({ value: t.id, label: t.title || 'Sem título' })),
                ]}
                onChange={(v) => up({ trackId: v })}
                hint={draft.tracks.length ? undefined : 'Cadastre faixas na aba Músicas.'}
              />
            )}
            <Text
              label={s.kind === 'pergunta' ? 'Pergunta' : s.kind === 'foto' ? 'Texto junto da fotografia' : 'Texto'}
              value={s.body}
              onChange={(v) => up({ body: v })}
              rows={4}
            />
            <div className="a-row">
              <Text label="Posição horizontal" value={String(s.x)} onChange={(v) => up({ x: pct(v) })} />
              <Text label="Posição vertical" value={String(s.y)} onChange={(v) => up({ y: pct(v) })} />
            </div>
          </>
        )}
      />
    </Section>
  );
}

/* ---------------- Músicas ---------------- */
const trackKinds = [
  { value: 'spotify' as const, label: 'Spotify' },
  { value: 'audio' as const, label: 'Arquivo de áudio' },
  { value: 'link' as const, label: 'Outro link' },
];

export function MusicTab({ draft, patch, backend }: TabProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playlistOk = !draft.spotifyPlaylist.trim() || Boolean(spotifyEmbedUrl(draft.spotifyPlaylist, false));
  const audioUpload = backend.mode === 'local' && backend.canUpload;

  return (
    <>
      <Section title="Playlist do Spotify" note="Aparece inteira no fim da página de músicas.">
        <Text
          label="Link da playlist"
          type="url"
          value={draft.spotifyPlaylist}
          onChange={(v) => patch((d) => ({ ...d, spotifyPlaylist: v }))}
          placeholder="https://open.spotify.com/playlist/…"
          error={playlistOk ? null : 'Este link não parece ser de uma playlist, álbum ou faixa do Spotify.'}
          hint={
            backend.mode === 'artifact'
              ? 'Dentro do claude.ai o player do Spotify não pode ser incorporado; a página mostra um link para abrir no Spotify.'
              : undefined
          }
        />
      </Section>
      <Section
        title="Faixas"
        note={
          backend.mode === 'artifact'
            ? 'Arquivos de áudio não podem ser enviados por aqui no claude.ai. Para uma faixa de áudio, use o endereço de um arquivo .mp3 já hospedado. Faixas do Spotify abrem pelo link.'
            : 'Arquivos de áudio enviados aqui ficam guardados apenas neste navegador.'
        }
      >
        <p className="a-status" role="status">
          {busy}
        </p>
        {error && (
          <p className="a-error" role="alert">
            {error}
          </p>
        )}
        <Items<Track>
          items={draft.tracks}
          onChange={setKey(patch, 'tracks')}
          title={(t) => [t.title, t.artist].filter(Boolean).join(' · ')}
          addLabel="Adicionar faixa"
          empty="Nenhuma faixa ainda."
          create={() => ({
            id: uid('faixa'),
            title: '',
            artist: '',
            note: '',
            kind: 'spotify',
            url: '',
            coverPhotoId: '',
          })}
          render={(t, up) => {
            const spotifyBad = t.kind === 'spotify' && t.url.trim() && !spotifyEmbedUrl(t.url, false);
            return (
              <>
                <div className="a-row">
                  <Text label="Título" value={t.title} onChange={(v) => up({ title: v })} />
                  <Text label="Artista" value={t.artist} onChange={(v) => up({ artist: v })} />
                </div>
                <Text label="Por que esta faixa (opcional)" value={t.note} onChange={(v) => up({ note: v })} rows={3} />
                <Choice label="Origem" value={t.kind} options={trackKinds} onChange={(v) => up({ kind: v })} />
                {t.url.startsWith('idb:') ? (
                  <p className="af__hint">Arquivo guardado neste navegador.</p>
                ) : (
                  <Text
                    label={
                      t.kind === 'spotify'
                        ? 'Link da faixa no Spotify'
                        : t.kind === 'audio'
                          ? 'Endereço do arquivo de áudio'
                          : 'Link'
                    }
                    type="url"
                    value={t.url}
                    onChange={(v) => up({ url: v })}
                    error={spotifyBad ? 'Este link não parece ser do Spotify.' : null}
                  />
                )}
                {t.kind === 'audio' && audioUpload && (
                  <label className="ab" aria-disabled={Boolean(busy)}>
                    {t.url.startsWith('idb:') ? 'Trocar arquivo de áudio' : 'Enviar arquivo de áudio'}
                    <input
                      type="file"
                      accept="audio/*"
                      hidden
                      disabled={Boolean(busy)}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBusy('Guardando o arquivo');
                        setError(null);
                        try {
                          const src = await backend.uploadImage(file);
                          up({ url: src });
                        } catch {
                          setError(`Não foi possível guardar “${file.name}” neste navegador.`);
                        }
                        setBusy(null);
                      }}
                    />
                  </label>
                )}
                <PhotoPicker
                  label="Capa (opcional)"
                  value={t.coverPhotoId}
                  photos={draft.photos}
                  onChange={(v) => up({ coverPhotoId: v })}
                />
              </>
            );
          }}
        />
      </Section>
      <Section title="Frequência Annelise" note="Mensagens curtas que aparecem entre uma faixa e outra no modo rádio.">
        <Items<{ id: string; text: string }>
          items={draft.radio.interludes.map((text, i) => ({ id: `i${i}`, text }))}
          onChange={(list) => patch((d) => ({ ...d, radio: { ...d.radio, interludes: list.map((x) => x.text) } }))}
          title={(x) => x.text.slice(0, 70)}
          addLabel="Adicionar mensagem"
          create={() => ({ id: `i${draft.radio.interludes.length}`, text: '' })}
          render={(x, up) => <Text label="Mensagem" value={x.text} onChange={(v) => up({ text: v })} rows={2} />}
        />
      </Section>
    </>
  );
}

/* ---------------- Oráculo ---------------- */
export function OracleTab({ draft, patch }: TabProps) {
  return (
    <Section
      title="Carta escondida"
      note="As doze cartas e suas leituras fazem parte do código. Aqui você edita o texto da carta especial, que aparece no fim da leitura."
    >
      <Text
        label="Texto da carta"
        value={draft.oracle.hiddenCard}
        onChange={(v) => patch((d) => ({ ...d, oracle: { ...d.oracle, hiddenCard: v } }))}
        rows={6}
      />
    </Section>
  );
}

/* ---------------- Cartas guardadas ---------------- */
export function EnvelopesTab({ draft, patch }: TabProps) {
  return (
    <Section title="Cartas guardadas" note="Cada envelope abre com uma animação diferente, na ordem da lista.">
      <Items
        items={draft.envelopes}
        onChange={setKey(patch, 'envelopes')}
        title={(e) => e.label}
        addLabel="Adicionar envelope"
        create={() => ({ id: uid('envelope'), label: 'Abra quando…', body: '' })}
        render={(e, up) => (
          <>
            <Text label="Frase do envelope" value={e.label} onChange={(v) => up({ label: v })} />
            <Text
              label="Mensagem"
              value={e.body}
              onChange={(v) => up({ body: v })}
              rows={8}
              hint="Deixe uma linha em branco entre parágrafos."
            />
          </>
        )}
      />
    </Section>
  );
}

/* ---------------- Dicionário ---------------- */
export function DictionaryTab({ draft, patch }: TabProps) {
  return (
    <Section title="Termos particulares" note="A página ordena os termos alfabeticamente.">
      <Items
        items={draft.dictionary}
        onChange={setKey(patch, 'dictionary')}
        title={(e) => e.word}
        addLabel="Adicionar termo"
        create={() => ({ id: uid('termo'), word: '', grammar: 's.f.', definition: '', example: '' })}
        render={(e, up) => (
          <>
            <div className="a-row">
              <Text label="Palavra" value={e.word} onChange={(v) => up({ word: v })} />
              <Text
                label="Classe"
                value={e.grammar}
                onChange={(v) => up({ grammar: v })}
                placeholder="s.f., adj., v."
              />
            </div>
            <Text label="Definição" value={e.definition} onChange={(v) => up({ definition: v })} rows={3} />
            <Text label="Exemplo (opcional)" value={e.example} onChange={(v) => up({ example: v })} rows={2} />
          </>
        )}
      />
    </Section>
  );
}

/* ---------------- Museu ---------------- */
export function MuseumTab({ draft, patch }: TabProps) {
  return (
    <Section title="Acervo do museu" note="Cada peça pode ter uma fotografia ou apenas o nome de um objeto.">
      <Items
        items={draft.museum}
        onChange={setKey(patch, 'museum')}
        title={(e) => e.title || e.object}
        addLabel="Adicionar peça"
        empty="O acervo está vazio."
        create={() => ({
          id: uid('peca'),
          title: '',
          object: '',
          phrase: '',
          text: '',
          photoId: '',
          date: '',
          material: '',
        })}
        render={(e, up) => (
          <>
            <Text label="Título da peça" value={e.title} onChange={(v) => up({ title: v })} />
            <Text
              label="Objeto"
              value={e.object}
              onChange={(v) => up({ object: v })}
              hint="Aparece em destaque quando não há fotografia."
            />
            <PhotoPicker
              label="Fotografia (opcional)"
              value={e.photoId}
              photos={draft.photos}
              onChange={(v) => up({ photoId: v })}
            />
            <div className="a-row">
              <Text label="Data" value={e.date} onChange={(v) => up({ date: v })} />
              <Text label="Material" value={e.material} onChange={(v) => up({ material: v })} />
            </div>
            <Text label="Frase" value={e.phrase} onChange={(v) => up({ phrase: v })} rows={2} />
            <Text label="Texto" value={e.text} onChange={(v) => up({ text: v })} rows={5} />
          </>
        )}
      />
    </Section>
  );
}

/* ---------------- Em outra fase da vida ---------------- */
export function FutureTab({ draft, patch }: TabProps) {
  return (
    <Section title="Cenas imaginadas" note="Cada cena é uma conversa entre Agora e Em outra fase.">
      <Items<FutureScene>
        items={draft.future}
        onChange={setKey(patch, 'future')}
        title={(s) => s.title}
        addLabel="Adicionar cena"
        create={() => ({ id: uid('cena'), title: 'Nova cena', lines: [{ who: 'hoje', text: '' }] })}
        render={(s, up) => (
          <>
            <Text label="Título" value={s.title} onChange={(v) => up({ title: v })} />
            <ol className="a-lines">
              {s.lines.map((l, i) => (
                <li key={i} className="a-line">
                  <Choice
                    label="Quem fala"
                    value={l.who}
                    options={[
                      { value: 'hoje', label: 'Agora' },
                      { value: 'adiante', label: 'Em outra fase' },
                    ]}
                    onChange={(v) => up({ lines: s.lines.map((x, j) => (j === i ? { ...x, who: v } : x)) })}
                  />
                  <Text
                    label="Mensagem"
                    value={l.text}
                    onChange={(v) => up({ lines: s.lines.map((x, j) => (j === i ? { ...x, text: v } : x)) })}
                    rows={2}
                  />
                  <button
                    type="button"
                    className="ab ab--quiet"
                    onClick={() => up({ lines: s.lines.filter((_, j) => j !== i) })}
                  >
                    Tirar mensagem
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="ab"
              onClick={() => up({ lines: [...s.lines, { who: 'adiante', text: '' }] })}
            >
              Adicionar mensagem
            </button>
          </>
        )}
      />
    </Section>
  );
}

/* ---------------- História (simulador) ---------------- */
export function StoryTab({ draft, patch }: TabProps) {
  const ids = useMemo(() => Object.keys(storyScenes), []);
  const [sceneId, setSceneId] = useState(ids[0]);
  const scene = storyScenes[sceneId];
  const lines = draft.story.lines[sceneId] ?? [];
  const choices = draft.story.choices[sceneId] ?? [];
  const setLine = (i: number, v: string) =>
    patch((d) => {
      const arr = [...(d.story.lines[sceneId] ?? [])];
      arr[i] = v;
      return { ...d, story: { ...d.story, lines: { ...d.story.lines, [sceneId]: arr } } };
    });
  const setChoice = (i: number, v: string) =>
    patch((d) => {
      const arr = [...(d.story.choices[sceneId] ?? [])];
      arr[i] = v;
      return { ...d, story: { ...d.story, choices: { ...d.story.choices, [sceneId]: arr } } };
    });
  const edited = Object.keys(draft.story.lines).length + Object.keys(draft.story.choices).length;

  return (
    <Section
      title="Uma história em aberto"
      note="Escolha uma cena e reescreva as falas ou as opções. Campo vazio mantém o texto original, que aparece em cinza. As ligações entre cenas não mudam."
    >
      <Choice
        label="Cena"
        value={sceneId}
        options={ids.map((id) => ({
          value: id,
          label: `${chapters[storyScenes[id].chapter - 1] ?? ''} · ${id}${draft.story.lines[id]?.some(Boolean) || draft.story.choices[id]?.some(Boolean) ? ' (editada)' : ''}`,
        }))}
        onChange={setSceneId}
      />
      <ol className="a-lines">
        {scene.lines.map((l, i) => (
          <li key={i}>
            <Text
              label={speakerNames[l.who] ?? l.who}
              value={lines[i] ?? ''}
              placeholder={l.text}
              onChange={(v) => setLine(i, v)}
              rows={2}
            />
          </li>
        ))}
      </ol>
      {(scene.choices ?? []).length > 0 && (
        <>
          <h3 className="as__sub">Opções</h3>
          <ol className="a-lines">
            {(scene.choices ?? []).map((c, i) => (
              <li key={c.id}>
                <Text
                  label={`Opção ${i + 1}`}
                  value={choices[i] ?? ''}
                  placeholder={c.label}
                  onChange={(v) => setChoice(i, v)}
                />
              </li>
            ))}
          </ol>
        </>
      )}
      {edited > 0 && (
        <RemoveButton
          label="Desfazer todas as edições da história"
          onConfirm={() => patch((d) => ({ ...d, story: { lines: {}, choices: {} } }))}
        />
      )}
    </Section>
  );
}

/* ---------------- Quebra-cabeça ---------------- */
export function PuzzleTab({ draft, patch }: TabProps) {
  const pz = draft.puzzle;
  const up = (p: Partial<Content['puzzle']>) => patch((d) => ({ ...d, puzzle: { ...d.puzzle, ...p } }));
  return (
    <Section title="Uma imagem por partes" note="A imagem é recortada num quadrado a partir do centro.">
      <PhotoPicker
        label="Imagem"
        value={pz.photoId}
        photos={draft.photos}
        onChange={(v) => up({ photoId: v })}
        hint="Sem escolha, a página usa a primeira fotografia do arquivo."
      />
      <Choice
        label="Número de peças"
        value={pz.size}
        options={[
          { value: 3, label: '9 peças (3×3)' },
          { value: 4, label: '16 peças (4×4)' },
        ]}
        onChange={(v) => up({ size: v })}
      />
      <Text label="Mensagem depois de concluir" value={pz.message} onChange={(v) => up({ message: v })} rows={4} />
    </Section>
  );
}

/* ---------------- Jardim ---------------- */
const gardenEvents = [
  'Quando a água volta a ficar parada',
  'Quando uma pétala chega à margem',
  'Quando o vento muda (segurar o toque)',
  'Quando algo se move embaixo de uma folha',
  'Quando duas ondas se cruzam',
];
export function GardenTab({ draft, patch }: TabProps) {
  return (
    <Section
      title="Um intervalo"
      note="Cada mensagem aparece uma vez, quando a pessoa percebe o detalhe correspondente."
    >
      {gardenEvents.map((label, i) => (
        <Text
          key={label}
          label={label}
          value={draft.garden.messages[i] ?? ''}
          onChange={(v) =>
            patch((d) => {
              const messages = [...d.garden.messages];
              while (messages.length < gardenEvents.length) messages.push('');
              messages[i] = v;
              return { ...d, garden: { ...d.garden, messages } };
            })
          }
        />
      ))}
    </Section>
  );
}

/* ---------------- Página final ---------------- */
export function SecretTab({ draft, patch }: TabProps) {
  const req = draft.secret.requires;
  const toggle = (id: string, on: boolean) =>
    patch((d) => ({
      ...d,
      secret: { ...d.secret, requires: on ? [...d.secret.requires, id] : d.secret.requires.filter((x) => x !== id) },
    }));
  return (
    <Section
      title="Antes de sair"
      note="A última página aparece quando todas as partes marcadas foram vistas. O progresso é guardado no aparelho de quem visita."
    >
      {sections.map((s) => (
        <Check
          key={s.id}
          label={s.title}
          hint={`(${s.milestoneLabel.toLowerCase()})`}
          checked={req.includes(s.id)}
          onChange={(v) => toggle(s.id, v)}
        />
      ))}
      {req.length === 0 && <p className="a-warn">Sem nenhuma parte marcada, a página final não aparece.</p>}
    </Section>
  );
}

/* ---------------- Dados ---------------- */
export function DataTab({ draft, patch, backend }: TabProps) {
  const json = useMemo(() => JSON.stringify(draft, null, 2), [draft]);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = (text: string) => {
    try {
      const parsed = JSON.parse(text) as Partial<Content>;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('formato');
      patch(() => mergeContent(defaultContent, parsed));
      setMsg({ ok: true, text: 'Conteúdo carregado. Revise as abas e clique em Salvar alterações para aplicar.' });
    } catch {
      setMsg({ ok: false, text: 'O texto não é um conteúdo válido (JSON).' });
    }
  };

  return (
    <>
      <Section
        title="Exportar"
        note={
          backend.mode === 'local'
            ? 'Para publicar este conteúdo para outras pessoas, salve-o como public/content.json no projeto e publique o site de novo. Fotografias e áudios guardados no navegador (endereços que começam com idb:) não vão junto: use endereços de arquivos publicados.'
            : 'Cópia de segurança de tudo o que está salvo aqui.'
        }
      >
        <div className="a-row a-row--start">
          <button
            type="button"
            className="ab"
            onClick={() => {
              const blob = new Blob([json], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'content.json';
              a.click();
              window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
            }}
          >
            Baixar content.json
          </button>
          <button
            type="button"
            className="ab"
            onClick={() =>
              navigator.clipboard.writeText(json).then(
                () => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                },
                () => setCopied(false),
              )
            }
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <textarea
          className="a-json"
          readOnly
          value={json}
          rows={8}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Conteúdo em JSON"
        />
      </Section>
      <Section title="Importar" note="Substitui o rascunho atual. Nada é salvo até você clicar em Salvar alterações.">
        <label className="ab">
          Escolher arquivo
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) load(await f.text());
              e.target.value = '';
            }}
          />
        </label>
        <Text label="Ou cole o conteúdo" value={paste} onChange={setPaste} rows={4} />
        <button type="button" className="ab" disabled={!paste.trim()} onClick={() => load(paste)}>
          Carregar
        </button>
        {msg && (
          <p className={msg.ok ? 'a-status' : 'a-error'} role={msg.ok ? 'status' : 'alert'}>
            {msg.text}
          </p>
        )}
      </Section>
      <Section title="Restaurar textos" note="Volta todos os textos ao padrão, mantendo fotografias e faixas.">
        <RemoveButton
          label="Restaurar textos padrão"
          onConfirm={() =>
            patch((d) => ({
              ...defaultContent,
              photos: d.photos,
              tracks: d.tracks,
              spotifyPlaylist: d.spotifyPlaylist,
            }))
          }
        />
      </Section>
    </>
  );
}
