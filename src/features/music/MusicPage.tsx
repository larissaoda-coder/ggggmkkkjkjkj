import { useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  categories as baseCategories,
  parseYouTubeId,
  platformName,
  type Track,
  type TrackSource,
} from '../../data/tracks';
import { formatTime, isPlayable, usePlayer } from '../../context/PlayerContext';
import { useMotion } from '../../context/SettingsContext';
import { PageHeader } from '../../components/PageHeader';
import { Range } from '../../components/Range';
import { Icon } from '../../components/Icon';
import { Equalizer } from '../../components/Equalizer';
import { Cover } from './Cover';
import './music.css';

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)(\?.*)?$/i;

/** No iPhone/iPad, o volume de elementos de áudio só pode ser ajustado pelos botões do aparelho. */
const isIOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

function sourceLabel(t: Track): string {
  if (t.source.kind === 'audio') return 'Arquivo de áudio';
  if (t.source.kind === 'youtube') return 'YouTube';
  return `Abre no ${platformName(t.source.url)}`;
}

function detectSource(link: string): TrackSource | null {
  const value = link.trim();
  if (!value) return null;
  const yt = parseYouTubeId(value);
  if (yt) return { kind: 'youtube', videoId: yt };
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return null;
    if (AUDIO_EXT.test(url.pathname)) return { kind: 'audio', src: value };
    return { kind: 'external', url: value };
  } catch {
    if (AUDIO_EXT.test(value) && !value.includes(' ')) return { kind: 'audio', src: value.replace(/^\//, '') };
    return null;
  }
}

export default function MusicPage() {
  const p = usePlayer();
  const m = useMotion();
  const [filter, setFilter] = useState<string>('todas');
  const [adding, setAdding] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);

  const allCategories = useMemo(() => {
    const extra = p.library.map((t) => t.category).filter((c) => c && !baseCategories.includes(c));
    return [...baseCategories, ...Array.from(new Set(extra))];
  }, [p.library]);

  const visible = useMemo(
    () => (filter === 'todas' ? p.library : p.library.filter((t) => t.category === filter)),
    [p.library, filter],
  );
  const queue = visible.filter(isPlayable).map((t) => t.id);
  const featured = p.current ?? p.library.find(isPlayable) ?? null;
  const hasDemo = p.library.some((t) => t.demo);
  const isCurrent = (t: Track) => p.current?.id === t.id;

  const commitScrub = () => {
    if (scrub !== null) p.seek(scrub);
    setScrub(null);
  };

  const linksFor = (t: Track) => {
    const links = [...(t.links ?? [])];
    if (t.source.kind === 'youtube' && !links.some((l) => /youtu/.test(l.url)))
      links.push({ label: 'YouTube', url: `https://www.youtube.com/watch?v=${t.source.videoId}` });
    return links;
  };

  return (
    <div className="page music">
      <PageHeader
        eyebrow="Músicas"
        title="Para ouvir enquanto percorre."
        description="A reprodução continua enquanto você navega pelas outras seções. Um pequeno reprodutor fica sempre ao alcance."
      />

      {/* ---------------- Em reprodução ---------------- */}
      {featured ? (
        <section className="now card" aria-label="Faixa atual">
          <Cover track={featured} size="lg" />
          <div className="now__body">
            <p className="eyebrow now__state">
              {p.current ? (
                <>
                  <Equalizer playing={p.playing} size={12} />
                  {p.loading ? 'Carregando…' : p.playing ? 'Tocando agora' : 'Em pausa'}
                </>
              ) : (
                'Pronta para tocar'
              )}
            </p>
            <h2 className="now__title">{featured.title}</h2>
            <p className="now__artist">
              {featured.artist}
              {featured.demo && <span className="tag now__tag">demonstração</span>}
            </p>
            {featured.note && <p className="meta now__note">{featured.note}</p>}

            {p.error && isCurrent(featured) && (
              <p className="now__error" role="alert">
                {p.error}
              </p>
            )}

            <div className="now__progress">
              <Range
                label="Posição na faixa"
                min={0}
                max={p.duration || 1}
                step={0.1}
                value={isCurrent(featured) ? (scrub ?? p.time) : 0}
                onValue={(v) => setScrub(v)}
                onPointerUp={commitScrub}
                onKeyUp={commitScrub}
                onTouchEnd={commitScrub}
                onBlur={() => scrub !== null && commitScrub()}
                disabled={!isCurrent(featured) || !p.duration}
                aria-valuetext={`${formatTime(scrub ?? p.time)} de ${formatTime(p.duration)}`}
              />
              <div className="now__times num">
                <span>{isCurrent(featured) ? formatTime(scrub ?? p.time) : '0:00'}</span>
                <span>{isCurrent(featured) && p.duration ? formatTime(p.duration) : '—'}</span>
              </div>
            </div>

            <div className="now__controls">
              <button
                type="button"
                className="icon-btn"
                onClick={p.prev}
                aria-label="Faixa anterior"
                disabled={!p.current}
              >
                <Icon name="prev" />
              </button>
              <button
                type="button"
                className="now__play"
                onClick={() => (p.current ? p.toggle() : p.playTrack(featured.id, queue.length ? queue : undefined))}
                aria-label={p.playing ? 'Pausar' : 'Reproduzir'}
              >
                <Icon name={p.playing ? 'pause' : 'play'} size={22} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={p.next}
                aria-label="Próxima faixa"
                disabled={!p.current}
              >
                <Icon name="next" />
              </button>

              <div className="now__volume">
                <button
                  type="button"
                  className="icon-btn icon-btn--small"
                  onClick={p.toggleMute}
                  aria-pressed={p.muted}
                  aria-label={p.muted ? 'Ativar som' : 'Silenciar'}
                >
                  <Icon name={p.muted || p.volume === 0 ? 'volume-off' : 'volume'} size={18} />
                </button>
                {isIOS && p.engine !== 'youtube' ? (
                  <span className="meta">Use os botões de volume do aparelho.</span>
                ) : (
                  <Range label="Volume" value={p.muted ? 0 : p.volume} onValue={p.setVolume} />
                )}
              </div>
            </div>

            {linksFor(featured).length > 0 && (
              <p className="now__links">
                <span className="meta">Ouvir na plataforma original:</span>
                {linksFor(featured).map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="link-btn">
                    {l.label} <Icon name="external" size={13} />
                  </a>
                ))}
              </p>
            )}
            {featured.source.kind === 'youtube' && isCurrent(featured) && (
              <p className="meta">
                O vídeo aparece num pequeno quadro no canto da tela e pode ser recolhido sem interromper a música.
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="now card now--empty">
          <p className="lede">Nenhuma faixa reproduzível por enquanto.</p>
          <p className="meta">Adicione um link do YouTube ou de um arquivo de áudio logo abaixo.</p>
        </section>
      )}

      {/* ---------------- Categorias ---------------- */}
      <div className="music__filters" role="group" aria-label="Categorias">
        {['todas', ...allCategories].map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => setFilter(c)}>
            {c === 'todas' ? 'Todas' : c}
            <span className="chip__count num">
              {c === 'todas' ? p.library.length : p.library.filter((t) => t.category === c).length}
            </span>
          </button>
        ))}
      </div>

      {/* ---------------- Lista ---------------- */}
      {visible.length === 0 ? (
        <p className="music__empty meta">Nenhuma faixa nesta categoria ainda.</p>
      ) : (
        <ol className="tracklist">
          <AnimatePresence initial={false}>
            {visible.map((t, i) => {
              const playable = isPlayable(t);
              const current = isCurrent(t);
              const inner = (
                <>
                  <span className="track__index num" aria-hidden="true">
                    {current ? <Equalizer playing={p.playing} size={12} /> : String(i + 1).padStart(2, '0')}
                  </span>
                  <Cover track={t} size="sm" />
                  <span className="track__text">
                    <span className="track__title">{t.title}</span>
                    <span className="track__artist">
                      {t.artist}
                      {t.demo && <span className="tag">demonstração</span>}
                      {t.local && <span className="tag">adicionada aqui</span>}
                    </span>
                  </span>
                  <span className="track__source meta">
                    {sourceLabel(t)}
                    {!playable && <Icon name="external" size={13} />}
                  </span>
                </>
              );
              return (
                <motion.li
                  key={t.id}
                  layout={!m.reduced}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={m.t(0.3)}
                  className="track"
                  data-current={current}
                >
                  {playable ? (
                    <button
                      type="button"
                      className="track__main"
                      onClick={() => (current ? p.toggle() : p.playTrack(t.id, queue))}
                      aria-label={`${current && p.playing ? 'Pausar' : 'Reproduzir'} ${t.title}, de ${t.artist}`}
                    >
                      {inner}
                    </button>
                  ) : (
                    <a
                      className="track__main"
                      href={(t.source as { url: string }).url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t.title}, de ${t.artist} — abre fora do aplicativo, no ${platformName((t.source as { url: string }).url)}`}
                    >
                      {inner}
                    </a>
                  )}
                  {t.local && (
                    <button
                      type="button"
                      className="icon-btn icon-btn--small track__remove"
                      onClick={() => p.removeLocalTrack(t.id)}
                      aria-label={`Remover ${t.title}`}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}

      {/* ---------------- Adicionar ---------------- */}
      <section className="music__add">
        <button type="button" className="btn" aria-expanded={adding} onClick={() => setAdding((v) => !v)}>
          <Icon name={adding ? 'minus' : 'plus'} size={16} /> Adicionar uma faixa
        </button>
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={m.t(0.35)}
              style={{ overflow: 'hidden' }}
            >
              <AddTrackForm
                categories={allCategories}
                onAdd={(t) => {
                  const added = p.addLocalTrack(t);
                  setAdding(false);
                  if (added.source.kind !== 'external')
                    setFilter((f) => (f === 'todas' || f === added.category ? f : 'todas'));
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <p className="meta music__note">
        {hasDemo && 'As faixas marcadas como demonstração são peças curtas geradas apenas para testar o reprodutor. '}
        Faixas do YouTube tocam aqui pela integração oficial; links de outras plataformas abrem fora do aplicativo.
        Faixas adicionadas por esta página ficam salvas somente neste navegador.
      </p>
    </div>
  );
}

function AddTrackForm({
  categories,
  onAdd,
}: {
  categories: string[];
  onAdd: (t: Omit<Track, 'id' | 'local'>) => void;
}) {
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [category, setCategory] = useState(categories[0] ?? '');
  const [touched, setTouched] = useState(false);
  const source = detectSource(link);

  const hint = !link.trim()
    ? 'Cole um link do YouTube, de um arquivo de áudio (.mp3, .m4a…) ou de outra plataforma.'
    : !source
      ? 'Este link não parece válido.'
      : source.kind === 'youtube'
        ? 'YouTube: a faixa será reproduzida aqui mesmo.'
        : source.kind === 'audio'
          ? 'Arquivo de áudio: a faixa será reproduzida aqui mesmo.'
          : `Link externo: a faixa abrirá fora do aplicativo, no ${platformName(source.url)}.`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!source || !title.trim()) return;
    onAdd({
      title: title.trim(),
      artist: artist.trim() || 'Artista não informado',
      category: category.trim() || 'Sem categoria',
      source,
      links: source.kind === 'external' ? [{ label: platformName(source.url), url: source.url }] : undefined,
    });
    setLink('');
    setTitle('');
    setArtist('');
    setTouched(false);
  };

  return (
    <form className="add-form" onSubmit={submit} noValidate>
      <div className="field add-form__wide">
        <label htmlFor="add-link">Link</label>
        <input
          id="add-link"
          className="input"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          inputMode="url"
          autoComplete="off"
          aria-describedby="add-link-hint"
          aria-invalid={touched && !source}
        />
        <p id="add-link-hint" className="meta" data-error={touched && !source}>
          {hint}
        </p>
      </div>
      <div className="field">
        <label htmlFor="add-title">Título</label>
        <input
          id="add-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={touched && !title.trim()}
          required
        />
        {touched && !title.trim() && (
          <p className="meta" data-error="true">
            Dê um título à faixa.
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="add-artist">Artista</label>
        <input id="add-artist" className="input" value={artist} onChange={(e) => setArtist(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="add-cat">Categoria</label>
        <input
          id="add-cat"
          className="input"
          list="add-cat-list"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Escolha ou escreva uma nova"
        />
        <datalist id="add-cat-list">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="add-form__actions">
        <button type="submit" className="btn btn--solid">
          <Icon name="plus" size={16} /> Adicionar
        </button>
      </div>
    </form>
  );
}
