import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContent } from '../../content/ContentContext';
import type { Track } from '../../content/types';
import { useMotion, useSettings } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { spotifyEmbedUrl } from '../../data/spotify';
import { EmptyState } from '../../components/EmptyState';
import { MediaImg } from '../../components/MediaImg';
import { Icon } from '../../components/Icon';
import { formatTime, useRadio } from './RadioContext';
import { useSpotify } from './SpotifyContext';
import './radio.css';
import { AreaMark } from '../../components/Ornaments';

const kindLabel: Record<Track['kind'], string> = { audio: 'Arquivo', spotify: 'Spotify', link: 'Link' };

function SpotifyFrame({ url, height, label }: { url: string; height: number; label: string }) {
  const { backend } = useContent();
  const { resolvedTheme } = useSettings();
  const embed = spotifyEmbedUrl(url, resolvedTheme === 'dark');
  if (!embed) return <p className="radio__msg">O link do Spotify desta faixa não é válido.</p>;
  // Dentro do claude.ai, players de outros sites não podem ser incorporados.
  if (backend?.mode === 'artifact')
    return (
      <div className="radio__ext">
        <p className="radio__msg">O player do Spotify não abre dentro desta visualização.</p>
        <a className="btn" href={url} target="_blank" rel="noreferrer">
          Abrir no Spotify <Icon name="external" size={15} />
        </a>
      </div>
    );
  return (
    <iframe
      className="radio__spotify"
      title={label}
      src={embed}
      height={height}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    />
  );
}

/** Mostrador de sintonia: a agulha anda conforme a faixa. */
function Dial({ index, total }: { index: number; total: number }) {
  const pos = total > 1 ? index / (total - 1) : 0.5;
  return (
    <div className="radio__dial" aria-hidden="true">
      <div className="radio__scale">
        {Array.from({ length: 41 }, (_, i) => (
          <span key={i} data-major={i % 5 === 0} />
        ))}
      </div>
      <div className="radio__freqs num">
        {[88, 92, 96, 100, 104, 108].map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      <span className="radio__needle" style={{ left: `${4 + pos * 92}%` }} />
    </div>
  );
}

export default function RadioPage() {
  const { content, photo } = useContent();
  const { mark } = useProgress();
  const m = useMotion();
  const r = useRadio();
  const spotify = useSpotify();
  const [params, setParams] = useSearchParams();
  const handled = useRef(false);

  /* Vindo do mapa: /radio?faixa=<id> */
  useEffect(() => {
    if (handled.current) return;
    const id = params.get('faixa');
    if (!id) return;
    handled.current = true;
    const i = r.tracks.findIndex((t) => t.id === id);
    if (i >= 0 && i !== r.index) r.select(i, false);
    params.delete('faixa');
    setParams(params, { replace: true });
  }, [params, r, setParams]);

  const interact = () => mark('radio');
  // Ficar alguns segundos na página também conta como visita.
  useEffect(() => {
    const id = window.setTimeout(() => mark('radio'), 8000);
    return () => window.clearTimeout(id);
  }, [mark]);
  const t = r.track;
  const cover = t?.coverPhotoId ? photo(t.coverPhotoId) : undefined;
  const hasPlaylist = Boolean(content.spotifyPlaylist.trim());
  const total = r.tracks.length;

  if (!total && !hasPlaylist) {
    return (
      <div className="page radio">
        <header className="radio__head">
          <AreaMark id="radio" />
          <h1 className="radio__title">Faixas selecionadas</h1>
          <p className="radio__desc">
            Músicas que escolhi por diferentes motivos. Algumas me lembram você. Outras combinam com coisas que gostaria
            de compartilhar.
          </p>
        </header>
        <EmptyState text="Nenhuma faixa foi adicionada ainda." adminTab="musicas" />
      </div>
    );
  }

  const progress = r.duration ? (r.time / r.duration) * 100 : 0;

  return (
    <div className="page radio">
      <header className="radio__head">
        <AreaMark id="radio" />
        <h1 className="radio__title">Faixas selecionadas</h1>
        <p className="radio__desc">
          Músicas que escolhi por diferentes motivos. Algumas me lembram você. Outras combinam com coisas que gostaria
          de compartilhar.
        </p>
      </header>

      {total > 0 && t && (
        <section className="radio__deck" aria-label="Faixa atual" data-mode={r.radioMode ? 'radio' : 'lista'}>
          <Dial index={r.index} total={total} />

          {r.interlude ? (
            <motion.div
              className="radio__interlude"
              role="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={m.t(0.6)}
            >
              <span className="radio__eyebrow">Frequência Annelise</span>
              <p>{r.interlude}</p>
              <span className="radio__countdown" aria-hidden="true" />
              <button type="button" className="link-btn" onClick={r.skipInterlude}>
                Ir para a próxima faixa
              </button>
            </motion.div>
          ) : (
            <div className="radio__body">
              <div className="radio__cover">
                {cover ? (
                  <MediaImg src={cover.src} alt="" />
                ) : (
                  <svg viewBox="0 0 100 100" aria-hidden="true" className="radio__disc" data-spin={r.playing}>
                    {[46, 40, 34, 28].map((rad) => (
                      <circle key={rad} cx="50" cy="50" r={rad} />
                    ))}
                    <circle cx="50" cy="50" r="13" className="radio__label" />
                    <text x="50" y="53.5" textAnchor="middle" className="radio__label-num">
                      {String(r.index + 1).padStart(2, '0')}
                    </text>
                  </svg>
                )}
              </div>

              <div className="radio__now">
                <span className="radio__eyebrow num">
                  {r.radioMode ? 'Frequência Annelise · ' : ''}Faixa {r.index + 1} de {total} · {kindLabel[t.kind]}
                </span>
                <h2 className="radio__track">{t.title || 'Sem título'}</h2>
                {t.artist && <p className="radio__artist">{t.artist}</p>}
                {t.note && <p className="radio__note">{t.note}</p>}

                {t.kind === 'audio' && (
                  <div className="radio__progress">
                    <input
                      type="range"
                      min={0}
                      max={r.duration || 0}
                      step={0.1}
                      value={Math.min(r.time, r.duration || 0)}
                      onChange={(e) => r.seek(Number(e.target.value))}
                      disabled={!r.duration}
                      aria-label="Posição na faixa"
                      aria-valuetext={`${formatTime(r.time)} de ${formatTime(r.duration)}`}
                      style={{ ['--fill' as string]: `${progress}%` }}
                    />
                    <div className="radio__times num">
                      <span>{formatTime(r.time)}</span>
                      <span>{r.duration ? formatTime(r.duration) : '–:––'}</span>
                    </div>
                  </div>
                )}

                <div className="radio__controls">
                  <button
                    type="button"
                    className="radio__ctl"
                    onClick={() => {
                      interact();
                      r.prev();
                    }}
                    disabled={total < 2 && t.kind !== 'audio'}
                  >
                    <Icon name="prev" size={18} />
                    <span>Faixa anterior</span>
                  </button>
                  {t.kind === 'audio' ? (
                    <button
                      type="button"
                      className="radio__ctl radio__ctl--main"
                      onClick={() => {
                        interact();
                        r.toggle();
                      }}
                      disabled={r.status === 'error'}
                      aria-busy={r.status === 'loading'}
                    >
                      <Icon name={r.playing ? 'pause' : 'play'} size={18} />
                      <span>{r.playing ? 'Pausar' : 'Reproduzir'}</span>
                    </button>
                  ) : t.kind === 'link' ? (
                    <a
                      className="radio__ctl radio__ctl--main"
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={interact}
                    >
                      <Icon name="external" size={18} />
                      <span>Abrir link</span>
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="radio__ctl"
                    onClick={() => {
                      interact();
                      r.next();
                    }}
                    disabled={total < 2}
                  >
                    <span>Próxima faixa</span>
                    <Icon name="next" size={18} />
                  </button>
                </div>

                <p className="radio__status" role="status" aria-live="polite">
                  {r.status === 'loading' && t.kind === 'audio' ? 'Carregando a faixa.' : r.message}
                </p>

                {t.kind === 'audio' && (
                  <div className="radio__volume">
                    <button
                      type="button"
                      className="icon-btn icon-btn--small"
                      onClick={r.toggleMute}
                      aria-pressed={r.muted}
                      aria-label={r.muted ? 'Ativar som' : 'Silenciar'}
                    >
                      <Icon name={r.muted || r.volume === 0 ? 'volume-off' : 'volume'} size={17} />
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={r.muted ? 0 : r.volume}
                      onChange={(e) => r.setVolume(Number(e.target.value))}
                      aria-label="Volume"
                      style={{ ['--fill' as string]: `${(r.muted ? 0 : r.volume) * 100}%` }}
                    />
                  </div>
                )}

                {t.kind === 'spotify' && (
                  <div className="radio__embed" onPointerDown={interact}>
                    <span className="radio__hint">Esta faixa toca pelo player do Spotify.</span>
                    <SpotifyFrame key={t.id} url={t.url} height={152} label={`${t.title} no Spotify`} />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {total > 0 && (
        <div className="radio__modebar">
          <button
            type="button"
            role="switch"
            className="switch"
            aria-checked={r.radioMode}
            aria-labelledby="radio-mode-label"
            onClick={() => {
              interact();
              r.setRadioMode(!r.radioMode);
            }}
          />
          <div>
            <span id="radio-mode-label" className="radio__mode-title">
              Frequência Annelise
            </span>
            <p className="radio__mode-desc">
              Modo rádio: as faixas seguem em sequência, sem parar no fim da lista, com uma breve mensagem entre uma e
              outra.
            </p>
          </div>
        </div>
      )}

      {total > 0 && (
        <section className="radio__queue" aria-labelledby="fila">
          <h2 id="fila" className="radio__section">
            Fila
          </h2>
          <ol>
            {r.tracks.map((tr, i) => (
              <li key={tr.id}>
                <button
                  type="button"
                  className="radio__item"
                  aria-current={i === r.index ? 'true' : undefined}
                  onClick={() => {
                    interact();
                    r.select(i, tr.kind === 'audio');
                  }}
                >
                  <span className="radio__item-num num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="radio__item-text">
                    <span className="radio__item-title">{tr.title || 'Sem título'}</span>
                    {tr.artist && <span className="radio__item-artist">{tr.artist}</span>}
                  </span>
                  <span className="radio__item-kind">
                    {i === r.index && r.playing ? 'Tocando' : kindLabel[tr.kind]}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {hasPlaylist && (
        <section className="radio__playlist" aria-labelledby="playlist">
          <h2 id="playlist" className="radio__section">
            Playlist completa
          </h2>
          {spotify.available ? (
            <div className="radio__pl" data-spotify-control>
              <p className="radio__pl-text">
                A playlist toca num player fixo no canto da tela e continua enquanto você passa pelas outras páginas.
              </p>
              <div className="radio__pl-actions">
                <button
                  type="button"
                  className="btn btn--solid"
                  onClick={() => {
                    interact();
                    spotify.toggle();
                  }}
                  disabled={spotify.status === 'carregando' || spotify.status === 'erro'}
                >
                  <Icon name={spotify.playing ? 'pause' : 'play'} size={16} />
                  {spotify.playing ? 'Pausar a playlist' : 'Tocar a playlist'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => spotify.setOpen(!spotify.open)}
                  aria-expanded={spotify.open}
                >
                  {spotify.open ? 'Ocultar o player' : 'Mostrar o player'}
                </button>
              </div>
              <p className="radio__status" role="status">
                {spotify.status === 'carregando'
                  ? 'Carregando o player do Spotify.'
                  : spotify.status === 'erro'
                    ? 'Não foi possível carregar o player do Spotify.'
                    : ''}
              </p>
              {spotify.openUrl && (
                <a className="link-btn" href={spotify.openUrl} target="_blank" rel="noreferrer">
                  Abrir no Spotify <Icon name="external" size={14} />
                </a>
              )}
            </div>
          ) : (
            <div onPointerDown={interact}>
              <SpotifyFrame url={content.spotifyPlaylist} height={380} label="Playlist no Spotify" />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
