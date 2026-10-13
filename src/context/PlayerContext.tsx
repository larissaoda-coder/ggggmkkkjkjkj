import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { tracks as catalog, type Track } from '../data/tracks';
import { usePersistentState } from '../lib/usePersistentState';
import { loadYouTubeApi, type YTPlayer } from '../lib/youtube';
import { Icon } from '../components/Icon';

/**
 * Reprodutor persistente. Fica acima do roteador, de modo que a música
 * continua tocando enquanto a pessoa navega entre as seções.
 *
 * Dois motores reais:
 *  - HTMLAudioElement para arquivos de áudio;
 *  - API oficial de iframe do YouTube para vídeos do YouTube.
 * Faixas do tipo 'external' nunca são "tocadas" aqui: abrem fora do app.
 */

type Engine = 'audio' | 'youtube' | null;

interface PlayerValue {
  library: Track[];
  current: Track | null;
  playing: boolean;
  loading: boolean;
  time: number;
  duration: number;
  volume: number;
  muted: boolean;
  error: string | null;
  engine: Engine;
  /** A pessoa já interagiu com o reprodutor nesta visita. */
  active: boolean;
  playTrack: (id: string, queue?: string[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  stop: () => void;
  addLocalTrack: (t: Omit<Track, 'id' | 'local'>) => Track;
  removeLocalTrack: (id: string) => void;
  dockCollapsed: boolean;
  setDockCollapsed: (v: boolean) => void;
}

const PlayerContext = createContext<PlayerValue | null>(null);

export const isPlayable = (t: Track) => t.source.kind !== 'external';

function isTrackArray(v: unknown): v is Track[] {
  return Array.isArray(v) && v.every((t) => t && typeof t === 'object' && 'id' in t && 'source' in t);
}

const ytErrors: Record<number, string> = {
  2: 'O identificador deste vídeo do YouTube parece inválido.',
  5: 'O YouTube não conseguiu reproduzir este vídeo no navegador.',
  100: 'Este vídeo não foi encontrado no YouTube (pode ter sido removido).',
  101: 'O autor deste vídeo não permite reprodução fora do YouTube.',
  150: 'O autor deste vídeo não permite reprodução fora do YouTube.',
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [localTracks, setLocalTracks] = usePersistentState<Track[]>('music:local', [], isTrackArray);
  const [prefs, setPrefs] = usePersistentState('music:prefs', { volume: 0.8, muted: false });
  const library = useMemo(() => [...catalog, ...localTracks], [localTracks]);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<Engine>(null);
  const [active, setActive] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytRef = useRef<YTPlayer | null>(null);
  const ytHostRef = useRef<HTMLDivElement | null>(null);
  const ytReadyRef = useRef<Promise<YTPlayer> | null>(null);
  const engineRef = useRef<Engine>(null);
  const nextRef = useRef<() => void>(() => {});
  const requestRef = useRef(0);

  const current = useMemo(() => library.find((t) => t.id === currentId) ?? null, [library, currentId]);

  /* ---------- motor de áudio ---------- */
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = 'metadata';
      a.addEventListener('timeupdate', () => engineRef.current === 'audio' && setTime(a.currentTime));
      a.addEventListener('durationchange', () => {
        if (engineRef.current === 'audio') setDuration(Number.isFinite(a.duration) ? a.duration : 0);
      });
      a.addEventListener('playing', () => {
        if (engineRef.current !== 'audio') return;
        setPlaying(true);
        setLoading(false);
      });
      a.addEventListener('pause', () => engineRef.current === 'audio' && setPlaying(false));
      a.addEventListener('waiting', () => engineRef.current === 'audio' && setLoading(true));
      a.addEventListener('canplay', () => engineRef.current === 'audio' && setLoading(false));
      a.addEventListener('ended', () => engineRef.current === 'audio' && nextRef.current());
      a.addEventListener('error', () => {
        if (engineRef.current !== 'audio' || !a.getAttribute('src')) return;
        setLoading(false);
        setPlaying(false);
        setError('Não foi possível carregar este arquivo de áudio. Verifique o caminho ou a conexão.');
      });
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  /* ---------- motor do YouTube ---------- */
  const getYouTube = useCallback((): Promise<YTPlayer> => {
    if (ytReadyRef.current) return ytReadyRef.current;
    const host = ytHostRef.current;
    if (!host) return Promise.reject(new Error('sem contêiner'));
    const target = document.createElement('div');
    host.replaceChildren(target);
    ytReadyRef.current = loadYouTubeApi()
      .then(
        (YT) =>
          new Promise<YTPlayer>((resolve) => {
            const player = new YT.Player(target, {
              width: '100%',
              height: '100%',
              host: 'https://www.youtube-nocookie.com',
              playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1 },
              events: {
                onReady: () => {
                  ytRef.current = player;
                  resolve(player);
                },
                onStateChange: (e: { data: number }) => {
                  if (engineRef.current !== 'youtube') return;
                  // -1 não iniciado, 0 fim, 1 tocando, 2 pausa, 3 carregando, 5 indicado
                  if (e.data === 1) {
                    setPlaying(true);
                    setLoading(false);
                    setDuration(player.getDuration() || 0);
                  } else if (e.data === 2 || e.data === 5 || e.data === -1) {
                    setPlaying(false);
                    setLoading(false);
                  } else if (e.data === 3) {
                    setLoading(true);
                  } else if (e.data === 0) {
                    setPlaying(false);
                    nextRef.current();
                  }
                },
                onError: (e: { data: number }) => {
                  if (engineRef.current !== 'youtube') return;
                  setPlaying(false);
                  setLoading(false);
                  setError(ytErrors[e.data] ?? 'O YouTube não conseguiu reproduzir este vídeo.');
                },
              },
            });
          }),
      )
      .catch((err) => {
        ytReadyRef.current = null;
        throw err;
      });
    return ytReadyRef.current;
  }, []);

  // Enquanto o YouTube toca, consulta o tempo atual (a API não emite eventos de progresso).
  useEffect(() => {
    if (engine !== 'youtube' || !playing) return;
    const id = window.setInterval(() => {
      const p = ytRef.current;
      if (!p) return;
      setTime(p.getCurrentTime() || 0);
      const d = p.getDuration();
      if (d) setDuration(d);
    }, 400);
    return () => window.clearInterval(id);
  }, [engine, playing]);

  /* ---------- volume ---------- */
  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = prefs.volume;
      a.muted = prefs.muted;
    }
    const p = ytRef.current;
    if (p) {
      p.setVolume(Math.round(prefs.volume * 100));
      if (prefs.muted) p.mute();
      else p.unMute();
    }
  }, [prefs, engine]);

  /* ---------- ações ---------- */
  const playTrack = useCallback(
    (id: string, queueIds?: string[]) => {
      const track = library.find((t) => t.id === id);
      if (!track || !isPlayable(track)) return;
      const request = ++requestRef.current;
      setActive(true);
      setError(null);
      setCurrentId(id);
      if (queueIds) setQueue(queueIds);
      else setQueue((q) => (q.includes(id) ? q : library.filter(isPlayable).map((t) => t.id)));
      setTime(0);
      setDuration(0);
      setLoading(true);

      if (track.source.kind === 'audio') {
        ytRef.current?.pauseVideo();
        engineRef.current = 'audio';
        setEngine('audio');
        const a = getAudio();
        a.volume = prefs.volume;
        a.muted = prefs.muted;
        a.src = track.source.src;
        a.play().catch(() => {
          if (requestRef.current !== request) return;
          setPlaying(false);
          setLoading(false);
        });
      } else if (track.source.kind === 'youtube') {
        const videoId = track.source.videoId;
        audioRef.current?.pause();
        engineRef.current = 'youtube';
        setEngine('youtube');
        setDockCollapsed(false);
        getYouTube()
          .then((p) => {
            if (requestRef.current !== request) return;
            p.setVolume(Math.round(prefs.volume * 100));
            if (prefs.muted) p.mute();
            else p.unMute();
            p.loadVideoById(videoId);
          })
          .catch(() => {
            if (requestRef.current !== request) return;
            setLoading(false);
            setError(
              'Não foi possível carregar o reprodutor do YouTube. Verifique a conexão ou abra a faixa no YouTube.',
            );
          });
      }
    },
    [library, getAudio, getYouTube, prefs.volume, prefs.muted],
  );

  const toggle = useCallback(() => {
    if (!current) {
      const first = library.find(isPlayable);
      if (first) playTrack(first.id);
      return;
    }
    if (engineRef.current === 'audio') {
      const a = getAudio();
      if (a.paused) {
        if (!a.getAttribute('src')) {
          playTrack(current.id);
          return;
        }
        a.play().catch(() => setPlaying(false));
      } else a.pause();
    } else if (engineRef.current === 'youtube') {
      const p = ytRef.current;
      if (!p) {
        playTrack(current.id);
        return;
      }
      if (playing) p.pauseVideo();
      else p.playVideo();
    } else {
      playTrack(current.id);
    }
  }, [current, library, playTrack, getAudio, playing]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const ids = (queue.length ? queue : library.map((t) => t.id)).filter((id) => {
        const t = library.find((x) => x.id === id);
        return t && isPlayable(t);
      });
      if (!ids.length) return;
      const i = currentId ? ids.indexOf(currentId) : -1;
      const nextIndex = (i + dir + ids.length) % ids.length;
      playTrack(ids[nextIndex], queue.length ? queue : undefined);
    },
    [queue, library, currentId, playTrack],
  );

  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => {
    // Como em um reprodutor comum: após 3 s, "anterior" volta ao início da faixa.
    if (time > 3) {
      if (engineRef.current === 'audio' && audioRef.current) audioRef.current.currentTime = 0;
      if (engineRef.current === 'youtube') ytRef.current?.seekTo(0, true);
      setTime(0);
      return;
    }
    step(-1);
  }, [step, time]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const seek = useCallback((seconds: number) => {
    const s = Math.max(0, seconds);
    if (engineRef.current === 'audio' && audioRef.current) audioRef.current.currentTime = s;
    if (engineRef.current === 'youtube') ytRef.current?.seekTo(s, true);
    setTime(s);
  }, []);

  const setVolume = useCallback(
    (v: number) => setPrefs((p) => ({ ...p, volume: Math.max(0, Math.min(1, v)), muted: v === 0 ? p.muted : false })),
    [setPrefs],
  );
  const toggleMute = useCallback(() => setPrefs((p) => ({ ...p, muted: !p.muted })), [setPrefs]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    ytRef.current?.stopVideo();
    engineRef.current = null;
    setEngine(null);
    setPlaying(false);
    setLoading(false);
    setActive(false);
    setCurrentId(null);
    setTime(0);
    setDuration(0);
  }, []);

  const addLocalTrack = useCallback(
    (t: Omit<Track, 'id' | 'local'>) => {
      const track: Track = { ...t, id: `local-${Date.now().toString(36)}`, local: true };
      setLocalTracks((list) => [...list, track]);
      return track;
    },
    [setLocalTracks],
  );

  const removeLocalTrack = useCallback(
    (id: string) => {
      if (id === currentId) stop();
      setLocalTracks((list) => list.filter((t) => t.id !== id));
      setQueue((q) => q.filter((x) => x !== id));
    },
    [setLocalTracks, currentId, stop],
  );

  /* ---------- Media Session (controles na tela de bloqueio) ---------- */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: 'Annelise',
      });
      navigator.mediaSession.setActionHandler('play', toggle);
      navigator.mediaSession.setActionHandler('pause', toggle);
      navigator.mediaSession.setActionHandler('nexttrack', next);
      navigator.mediaSession.setActionHandler('previoustrack', prev);
    } catch {
      /* navegador sem suporte completo */
    }
  }, [current, toggle, next, prev]);

  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [playing]);

  const value = useMemo<PlayerValue>(
    () => ({
      library,
      current,
      playing,
      loading,
      time,
      duration,
      volume: prefs.volume,
      muted: prefs.muted,
      error,
      engine,
      active,
      playTrack,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      stop,
      addLocalTrack,
      removeLocalTrack,
      dockCollapsed,
      setDockCollapsed,
    }),
    [
      library,
      current,
      playing,
      loading,
      time,
      duration,
      prefs,
      error,
      engine,
      active,
      playTrack,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      stop,
      addLocalTrack,
      removeLocalTrack,
      dockCollapsed,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div
        className="yt-dock"
        data-visible={engine === 'youtube' && active ? 'true' : 'false'}
        data-collapsed={dockCollapsed ? 'true' : 'false'}
        aria-hidden={engine !== 'youtube'}
      >
        <div className="yt-dock__frame" ref={ytHostRef} />
        <button
          type="button"
          className="yt-dock__toggle"
          onClick={() => setDockCollapsed(!dockCollapsed)}
          aria-label={dockCollapsed ? 'Mostrar o vídeo' : 'Recolher o vídeo (a música continua)'}
          tabIndex={engine === 'youtube' ? 0 : -1}
        >
          <Icon name={dockCollapsed ? 'arrow-left' : 'arrow-right'} size={14} />
        </button>
      </div>
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer precisa estar dentro de PlayerProvider');
  return ctx;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
