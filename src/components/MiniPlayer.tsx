import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import { useMotion } from '../context/SettingsContext';
import { Icon } from './Icon';
import { Equalizer } from './Equalizer';

/** Reprodutor compacto, visível em todas as seções depois que uma faixa é tocada. */
export function MiniPlayer() {
  const p = usePlayer();
  const m = useMotion();
  const location = useLocation();
  const onMusicPage = location.pathname.startsWith('/musicas');
  const show = p.active && p.current && !onMusicPage;
  const progress = p.duration ? Math.min(1, p.time / p.duration) : 0;

  return (
    <AnimatePresence>
      {show && p.current && (
        <motion.div
          className="mini-player"
          role="region"
          aria-label="Reprodutor"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={m.t(0.35)}
        >
          <div className="mini-player__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
          <Link to="/musicas" className="mini-player__info">
            <Equalizer playing={p.playing} />
            <span className="mini-player__text">
              <span className="mini-player__title">{p.current.title}</span>
              <span className="mini-player__artist">{p.error ? 'Não foi possível reproduzir' : p.current.artist}</span>
            </span>
          </Link>
          <div className="mini-player__controls">
            <button type="button" className="icon-btn icon-btn--small" onClick={p.prev} aria-label="Faixa anterior">
              <Icon name="prev" size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={p.toggle}
              aria-label={p.playing ? 'Pausar' : 'Reproduzir'}
            >
              <Icon name={p.playing ? 'pause' : 'play'} size={18} />
            </button>
            <button type="button" className="icon-btn icon-btn--small" onClick={p.next} aria-label="Próxima faixa">
              <Icon name="next" size={16} />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--small mini-player__close"
              onClick={p.stop}
              aria-label="Fechar o reprodutor"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
