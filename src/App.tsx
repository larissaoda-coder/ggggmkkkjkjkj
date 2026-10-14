import { lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { ProgressProvider } from './context/ProgressContext';
import { ContentProvider } from './content/ContentContext';
import { ADMIN_PATH } from './app/sections';
import { Layout } from './app/Layout';
import { RadioProvider } from './features/radio/RadioContext';
import { SpotifyProvider } from './features/radio/SpotifyContext';
import Home from './pages/Home';

const IndexPage = lazy(() => import('./pages/IndexPage'));
const LetterPage = lazy(() => import('./pages/LetterPage'));
const FragmentsPage = lazy(() => import('./pages/FragmentsPage'));
const FragmentDetailPage = lazy(() => import('./pages/FragmentDetailPage'));
const ArchivePage = lazy(() => import('./features/archive/ArchivePage'));
const BookPage = lazy(() => import('./features/book/BookPage'));
const AtlasPage = lazy(() => import('./features/atlas/AtlasPage'));
const RadioPage = lazy(() => import('./features/radio/RadioPage'));
const OraclePage = lazy(() => import('./features/oracle/OraclePage'));
const EnvelopesPage = lazy(() => import('./features/envelopes/EnvelopesPage'));
const PuzzlePage = lazy(() => import('./features/puzzle/PuzzlePage'));
const MuseumPage = lazy(() => import('./features/museum/MuseumPage'));
const DictionaryPage = lazy(() => import('./features/dictionary/DictionaryPage'));
const FuturePage = lazy(() => import('./features/future/FuturePage'));
const GardenPage = lazy(() => import('./features/garden/GardenPage'));
const SecretPage = lazy(() => import('./features/secret/SecretPage'));
const AdminPage = lazy(() => import('./features/admin/AdminPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <ContentProvider>
          <RadioProvider>
            <SpotifyProvider>
              <HashRouter>
                <Layout>
                  {(location) => (
                    <Routes location={location}>
                      <Route path="/" element={<Home />} />
                      <Route path="/indice" element={<IndexPage />} />
                      <Route path="/carta" element={<LetterPage />} />
                      <Route path="/fragmentos" element={<FragmentsPage />} />
                      <Route path="/fragmentos/:n" element={<FragmentDetailPage />} />
                      <Route path="/arquivo" element={<ArchivePage />} />
                      <Route path="/livro" element={<BookPage />} />
                      <Route path="/mapa" element={<AtlasPage />} />
                      <Route path="/radio" element={<RadioPage />} />
                      <Route path="/oraculo" element={<OraclePage />} />
                      <Route path="/cartas" element={<EnvelopesPage />} />
                      <Route path="/quebra-cabeca" element={<PuzzlePage />} />
                      <Route path="/museu" element={<MuseumPage />} />
                      <Route path="/dicionario" element={<DictionaryPage />} />
                      <Route path="/futuro" element={<FuturePage />} />
                      <Route path="/intervalo" element={<GardenPage />} />
                      <Route path="/antes-de-sair" element={<SecretPage />} />
                      <Route path={ADMIN_PATH} element={<AdminPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  )}
                </Layout>
              </HashRouter>
            </SpotifyProvider>
          </RadioProvider>
        </ContentProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}
