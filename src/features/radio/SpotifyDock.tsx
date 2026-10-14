import { Icon } from '../../components/Icon';
import { useSpotify } from './SpotifyContext';

/** Controle discreto da playlist, no canto da tela, presente em todas as páginas. */
export function SpotifyDock({ hidden }: { hidden: boolean }) {
  const s = useSpotify();
  if (!s.available || hidden || (!s.started && !s.open)) return null;

  if (s.status === 'erro')
    return (
      <div className="sdock">
        <div className="sdock__bar sdock__bar--error" role="status">
          <span className="sdock__label">Não foi possível carregar o player do Spotify.</span>
          {s.openUrl && (
            <a className="sdock__toggle" href={s.openUrl} target="_blank" rel="noreferrer">
              Abrir no Spotify
            </a>
          )}
        </div>
      </div>
    );

  const label =
    s.status === 'carregando'
      ? 'Carregando a playlist'
      : s.needsTap && !s.playing
        ? 'Toque no play do Spotify para começar'
        : s.playing
          ? 'Tocando a playlist'
          : 'Playlist pausada';

  return (
    <div className="sdock" data-open={s.open}>
      <div className="sdock__bar" data-spotify-control>
        <button
          type="button"
          className="sdock__play"
          onClick={s.toggle}
          disabled={s.status !== 'pronto'}
          aria-label={s.playing ? 'Pausar a playlist' : 'Tocar a playlist'}
        >
          <Icon name={s.playing ? 'pause' : 'play'} size={14} />
        </button>
        <span className="sdock__label" role="status">
          {label}
        </span>
        <button type="button" className="sdock__toggle" onClick={() => s.setOpen(!s.open)} aria-expanded={s.open}>
          {s.open ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  );
}
