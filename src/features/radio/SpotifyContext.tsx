import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useContent } from '../../content/ContentContext';
import { useSettings } from '../../context/SettingsContext';
import { spotifyOpenUrl, spotifyUri } from '../../data/spotify';

/**
 * Playlist do Spotify num player fixo, que continua tocando entre as páginas.
 *
 * Navegadores não deixam uma página tocar som antes de a pessoa interagir com
 * ela. Por isso a playlist começa no primeiro toque ou clique (normalmente o
 * botão Entrar). Se mesmo assim o navegador recusar, o player aparece aberto
 * pedindo um toque no play do próprio Spotify.
 *
 * Usa a API oficial de incorporação do Spotify (iFrame API). Sem conta do
 * Spotify conectada no navegador, o Spotify toca prévias de 30 segundos.
 * Dentro do claude.ai o player não pode ser carregado.
 */
interface PlaybackUpdate {
  data: { isPaused: boolean; isBuffering: boolean; duration: number; position: number };
}
interface EmbedController {
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  loadUri(uri: string): void;
  destroy(): void;
  addListener(event: 'ready', cb: () => void): void;
  addListener(event: 'playback_update', cb: (e: PlaybackUpdate) => void): void;
}
interface IFrameAPI {
  createController(
    el: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    cb: (c: EmbedController) => void,
  ): void;
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
  }
}

export type SpotifyStatus = 'desligado' | 'carregando' | 'pronto' | 'erro';

interface SpotifyValue {
  /** Há playlist e o player pode ser usado neste ambiente. */
  available: boolean;
  /** Fora do claude.ai o player funciona; dentro dele, só o link. */
  blockedHere: boolean;
  status: SpotifyStatus;
  playing: boolean;
  started: boolean;
  needsTap: boolean;
  open: boolean;
  openUrl: string | null;
  toggle(): void;
  pause(): void;
  setOpen(open: boolean): void;
}

const SpotifyContext = createContext<SpotifyValue | null>(null);
const API_URL = 'https://open.spotify.com/embed/iframe-api/v1';

let apiPromise: Promise<IFrameAPI> | null = null;
function loadApi(): Promise<IFrameAPI> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<IFrameAPI>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), 20000);
    window.onSpotifyIframeApiReady = (api) => {
      window.clearTimeout(timer);
      resolve(api);
    };
    const s = document.createElement('script');
    s.src = API_URL;
    s.async = true;
    s.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('script'));
    };
    document.head.appendChild(s);
  }).catch((e) => {
    apiPromise = null;
    throw e;
  });
  return apiPromise;
}

export const PLAYING_EVENT = 'annelise:tocando';

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const { content } = useContent();
  const { prefs } = useSettings();
  const uri = spotifyUri(content.spotifyPlaylist);
  const openUrl = spotifyOpenUrl(content.spotifyPlaylist);
  const blockedHere = typeof window !== 'undefined' && typeof window.claude?.use === 'function';
  const available = Boolean(uri) && !blockedHere;

  const [status, setStatus] = useState<SpotifyStatus>('desligado');
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [open, setOpen] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const ctrl = useRef<EmbedController | null>(null);
  const playingRef = useRef(false);
  const everPlayed = useRef(false);
  const startedRef = useRef(false);
  const pending = useRef(false);
  const loadedUri = useRef<string | null>(null);
  const checkTimer = useRef<number | undefined>(undefined);
  const musicPref = useRef(prefs.music);
  musicPref.current = prefs.music;

  const tryPlay = useCallback(() => {
    const c = ctrl.current;
    if (!c) {
      pending.current = true;
      return;
    }
    pending.current = false;
    if (everPlayed.current) c.resume();
    else c.play();
    window.clearTimeout(checkTimer.current);
    // Se o navegador recusar o início, o player abre pedindo um toque no play.
    checkTimer.current = window.setTimeout(() => {
      if (!playingRef.current) {
        setNeedsTap(true);
        setOpen(true);
      }
    }, 4500);
  }, []);

  /* Cria o player assim que o site abre, para estar pronto no primeiro toque. */
  useEffect(() => {
    if (!available || !uri) return;
    if (ctrl.current) {
      if (loadedUri.current !== uri) {
        loadedUri.current = uri;
        everPlayed.current = false;
        ctrl.current.loadUri(uri);
      }
      return;
    }
    let alive = true;
    setStatus('carregando');
    loadApi().then(
      (api) => {
        const box = boxRef.current;
        if (!alive || !box) return;
        const host = document.createElement('div');
        box.replaceChildren(host);
        loadedUri.current = uri;
        api.createController(host, { uri, width: '100%', height: 152 }, (c) => {
          ctrl.current = c;
          c.addListener('ready', () => {
            setStatus('pronto');
            if (pending.current) tryPlay();
          });
          c.addListener('playback_update', (e) => {
            const isPlaying = !e.data.isPaused;
            if (isPlaying && !playingRef.current)
              window.dispatchEvent(new CustomEvent(PLAYING_EVENT, { detail: 'spotify' }));
            playingRef.current = isPlaying;
            setPlaying(isPlaying);
            if (isPlaying) {
              everPlayed.current = true;
              window.clearTimeout(checkTimer.current);
              setNeedsTap(false);
            }
          });
        });
      },
      () => alive && setStatus('erro'),
    );
    return () => {
      alive = false;
    };
  }, [available, uri, tryPlay]);

  /* Primeiro toque ou tecla em qualquer lugar do site: começa a playlist. */
  useEffect(() => {
    if (!available) return;
    const onFirst = (e: Event) => {
      if (startedRef.current) return;
      if (e instanceof KeyboardEvent && (e.key === 'Escape' || e.key === 'Tab' || e.metaKey || e.ctrlKey)) return;
      // Os próprios controles da playlist decidem o que fazer.
      if ((e.target as HTMLElement | null)?.closest?.('[data-spotify-control]')) return;
      startedRef.current = true;
      setStarted(true);
      if (musicPref.current) tryPlay();
    };
    document.addEventListener('click', onFirst, true);
    document.addEventListener('keydown', onFirst, true);
    return () => {
      document.removeEventListener('click', onFirst, true);
      document.removeEventListener('keydown', onFirst, true);
    };
  }, [available, tryPlay]);

  /* Só um som por vez: se a rádio começar, a playlist pausa. */
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== 'spotify' && playingRef.current) ctrl.current?.pause();
    };
    window.addEventListener(PLAYING_EVENT, onOther);
    return () => window.removeEventListener(PLAYING_EVENT, onOther);
  }, []);

  useEffect(() => () => window.clearTimeout(checkTimer.current), []);

  const toggle = useCallback(() => {
    startedRef.current = true;
    setStarted(true);
    if (playingRef.current) ctrl.current?.pause();
    else tryPlay();
  }, [tryPlay]);
  const pause = useCallback(() => ctrl.current?.pause(), []);

  const value = useMemo<SpotifyValue>(
    () => ({ available, blockedHere, status, playing, started, needsTap, open, openUrl, toggle, pause, setOpen }),
    [available, blockedHere, status, playing, started, needsTap, open, openUrl, toggle, pause],
  );

  return (
    <SpotifyContext.Provider value={value}>
      {children}
      {available && (
        <div
          ref={boxRef}
          className="sdock__player"
          data-open={open}
          inert={!open}
          aria-hidden={!open}
          aria-label="Player da playlist no Spotify"
        />
      )}
    </SpotifyContext.Provider>
  );
}

export function useSpotify(): SpotifyValue {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error('useSpotify precisa estar dentro de SpotifyProvider');
  return ctx;
}
