import { Suspense, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { sectionForPath } from './sections';
import { useSettings, useMotion } from '../context/SettingsContext';
import { useProgress } from '../context/ProgressContext';
import { useMediaQuery } from '../lib/useMediaQuery';
import { SideNav } from '../components/nav/SideNav';
import { TopNav } from '../components/nav/TopNav';
import { BottomNav } from '../components/nav/BottomNav';
import { ErrorBoundary } from '../components/ErrorBoundary';

function transitionKey(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'inicio';
  return parts.length > 1 ? `${parts[0]}-detalhe` : parts[0];
}

export function Layout({ children }: { children: (location: ReturnType<typeof useLocation>) => ReactNode }) {
  const location = useLocation();
  const { settings } = useSettings();
  const m = useMotion();
  const { markVisited } = useProgress();
  const desktop = useMediaQuery('(min-width: 900px)');

  const section = sectionForPath(location.pathname);
  const isHome = location.pathname === '/';
  const immersive = Boolean(section?.immersive) || location.pathname === '/observatorio';
  const chrome = !isHome && !immersive;
  const navMode = !chrome ? 'none' : desktop ? settings.desktopNav : 'bottom';

  useEffect(() => {
    if (section) markVisited(section.id);
  }, [section, markVisited]);

  useEffect(() => {
    const name = section?.title ?? (location.pathname === '/sumario' ? 'Sumário' : null);
    document.title = name ? `${name} — Annelise` : 'Annelise';
  }, [section, location.pathname]);

  return (
    <div className="app" data-nav={navMode} data-compact={!settings.navLabels} data-chrome={chrome}>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      {navMode === 'lateral' && <SideNav />}
      {navMode === 'superior' && <TopNav />}

      <main id="conteudo" className="app__main" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
          <motion.div
            key={transitionKey(location.pathname)}
            className="page-transition"
            initial={{ opacity: 0, y: m.reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: m.reduced ? 0 : -6 }}
            transition={m.t(0.35)}
          >
            <ErrorBoundary>
              <Suspense fallback={<PageLoading />}>{children(location)}</Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {navMode === 'bottom' && <BottomNav />}
    </div>
  );
}

function PageLoading() {
  return (
    <div className="page-loading" role="status">
      <span className="page-loading__line" />
      <span className="visually-hidden">Carregando</span>
    </div>
  );
}
