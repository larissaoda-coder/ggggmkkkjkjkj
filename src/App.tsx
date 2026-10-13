import { lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { ProgressProvider } from './context/ProgressContext';
import { Layout } from './app/Layout';
import Home from './pages/Home';
import IndexPage from './pages/IndexPage';

const LetterPage = lazy(() => import('./pages/LetterPage'));
const FragmentsPage = lazy(() => import('./pages/FragmentsPage'));
const FragmentDetailPage = lazy(() => import('./pages/FragmentDetailPage'));
const SimulatorPage = lazy(() => import('./features/simulator/SimulatorPage'));
const MusicPage = lazy(() => import('./features/music/MusicPage'));
const LabyrinthPage = lazy(() => import('./features/labyrinth/LabyrinthPage'));
const TablePage = lazy(() => import('./features/table/TablePage'));
const NightPage = lazy(() => import('./features/night/NightPage'));
const PathsPage = lazy(() => import('./features/paths/PathsPage'));
const IntervalPage = lazy(() => import('./features/interval/IntervalPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ObservatoryPage = lazy(() => import('./features/observatory/ObservatoryPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <HashRouter>
          <Layout>
            {(location) => (
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/sumario" element={<IndexPage />} />
                <Route path="/carta" element={<LetterPage />} />
                <Route path="/fragmentos" element={<FragmentsPage />} />
                <Route path="/fragmentos/:n" element={<FragmentDetailPage />} />
                <Route path="/escolhas" element={<SimulatorPage />} />
                <Route path="/musicas" element={<MusicPage />} />
                <Route path="/labirinto" element={<LabyrinthPage />} />
                <Route path="/mesa" element={<TablePage />} />
                <Route path="/noite" element={<NightPage />} />
                <Route path="/caminho" element={<PathsPage />} />
                <Route path="/intervalo" element={<IntervalPage />} />
                <Route path="/ajustes" element={<SettingsPage />} />
                <Route path="/observatorio" element={<ObservatoryPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            )}
          </Layout>
        </HashRouter>
      </ProgressProvider>
    </SettingsProvider>
  );
}
