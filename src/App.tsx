import { lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { Layout } from './app/Layout';
import Home from './pages/Home';

const LetterPage = lazy(() => import('./pages/LetterPage'));
const FragmentsPage = lazy(() => import('./pages/FragmentsPage'));
const FragmentDetailPage = lazy(() => import('./pages/FragmentDetailPage'));
const MusicPage = lazy(() => import('./features/music/MusicPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <SettingsProvider>
      <HashRouter>
        <Layout>
          {(location) => (
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/carta" element={<LetterPage />} />
              <Route path="/fragmentos" element={<FragmentsPage />} />
              <Route path="/fragmentos/:n" element={<FragmentDetailPage />} />
              <Route path="/musicas" element={<MusicPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </Layout>
      </HashRouter>
    </SettingsProvider>
  );
}
