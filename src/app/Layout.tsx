import { Suspense, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotion } from '../context/SettingsContext';
import { Nav } from '../components/Nav';
import { ErrorBoundary } from '../components/ErrorBoundary';

function transitionKey(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'inicio';
  return parts.length > 1 ? `${parts[0]}-detalhe` : parts[0];
}

export function Layout({ children }: { children: (location: ReturnType<typeof useLocation>) => ReactNode }) {
  const location = useLocation();
  const m = useMotion();
  const isHome = location.pathname === '/';

  return (
    <div className="app" data-chrome={!isHome}>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      {!isHome && <Nav />}
      <main id="conteudo" className="app__main" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
          <motion.div
            key={transitionKey(location.pathname)}
            className="page-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={m.t(0.3)}
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
