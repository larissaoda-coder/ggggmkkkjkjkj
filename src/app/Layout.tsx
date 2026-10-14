import { Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotion } from '../context/SettingsContext';
import { ADMIN_PATH, sectionForPath } from './sections';
import { Menu } from '../components/Menu';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Icon } from '../components/Icon';
import { useRadio } from '../features/radio/RadioContext';
import { useSpotify } from '../features/radio/SpotifyContext';
import { SpotifyDock } from '../features/radio/SpotifyDock';

function transitionKey(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'inicio';
  return parts.length > 1 ? `${parts[0]}-detalhe` : parts[0];
}

export function Layout({ children }: { children: (location: ReturnType<typeof useLocation>) => ReactNode }) {
  const location = useLocation();
  const m = useMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = useCallback(() => setMenuOpen(false), []);
  const isHome = location.pathname === '/';
  const section = sectionForPath(location.pathname);
  const immersive = Boolean(section?.immersive);
  const chrome = !isHome && !immersive;
  const radio = useRadio();
  const spotify = useSpotify();
  const isAdmin = location.pathname === ADMIN_PATH;
  const { setOpen: setSpotifyOpen } = spotify;
  useEffect(() => {
    if (isAdmin) setSpotifyOpen(false);
  }, [isAdmin, setSpotifyOpen]);
  const showPlayer =
    radio.track?.kind === 'audio' && (radio.playing || radio.time > 0) && location.pathname !== '/radio';

  useEffect(() => {
    const titles: Record<string, string> = {
      '/indice': 'Índice',
      [ADMIN_PATH]: 'Administração',
      '/antes-de-sair': 'Antes de sair',
    };
    const name = section?.title ?? titles[location.pathname];
    document.title = name ? `${name} · Para Annelise` : 'Para Annelise';
  }, [section, location.pathname]);

  return (
    <div
      className="app"
      data-chrome={chrome}
      data-area={section?.id ?? location.pathname.slice(1).split('/')[0] ?? 'inicio'}
    >
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      {chrome && (
        <header className="topbar">
          <Link to="/indice" className="topbar__brand">
            Para Annelise
          </Link>
          {showPlayer && radio.track && (
            <div className="topbar__player">
              <button
                type="button"
                className="topbar__play"
                onClick={radio.toggle}
                aria-label={radio.playing ? 'Pausar' : 'Reproduzir'}
              >
                <Icon name={radio.playing ? 'pause' : 'play'} size={14} />
              </button>
              <Link to="/radio" className="topbar__track">
                {radio.track.title || 'Faixa sem título'}
              </Link>
            </div>
          )}
          <button
            type="button"
            className="topbar__menu"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
          >
            <span>Menu</span>
            <span className="topbar__lines" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </header>
      )}
      <Menu open={menuOpen} onClose={close} />
      <SpotifyDock hidden={isAdmin || menuOpen} />
      <main id="conteudo" className="app__main" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
          <motion.div
            key={transitionKey(location.pathname)}
            className="page-transition"
            initial={{ opacity: 0, y: m.reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={m.t(0.4)}
          >
            <ErrorBoundary>
              <Suspense fallback={<div className="page-loading" role="status" aria-label="Carregando" />}>
                {children(location)}
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
