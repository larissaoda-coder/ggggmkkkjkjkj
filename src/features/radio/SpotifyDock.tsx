import { Icon } from '../../components/Icon';
import { useSpotify } from './SpotifyContext';

/** Controle discreto da playlist, no canto da tela, presente em todas as páginas. */
export function SpotifyDock({ hidden }: { hidden: boolean }) {
  const s = useSpotify();
  if (!s.available || hidden || (!s.started && !s.open)) return null;

  // Se o player não carregar, o aviso fica só na página de músicas, sem ocupar as outras.
  if (s.status === 'erro') return null;

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
