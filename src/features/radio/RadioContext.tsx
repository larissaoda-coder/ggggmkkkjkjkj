import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { resolveMediaSrc, useContent } from '../../content/ContentContext';
import type { Track } from '../../content/types';

/**
 * Player da rádio. Fica acima das páginas para que um arquivo de áudio continue
 * tocando enquanto a pessoa navega. Faixas do Spotify e links externos não passam
 * por aqui: o Spotify toca no próprio player incorporado, e links abrem fora.
 */
export type RadioStatus = 'idle' | 'loading' | 'ready' | 'error';

interface RadioValue {
  tracks: Track[];
  index: number;
  track: Track | undefined;
  playing: boolean;
  status: RadioStatus;
  message: string;
  time: number;
  duration: number;
  volume: number;
  muted: boolean;
  radioMode: boolean;
  interlude: string | null;
  select(index: number, autoplay?: boolean): void;
  toggle(): void;
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  seek(seconds: number): void;
  setVolume(v: number): void;
  toggleMute(): void;
  setRadioMode(on: boolean): void;
  skipInterlude(): void;
}

const RadioContext = createContext<RadioValue | null>(null);
const INTERLUDE_MS = 7000;

export function RadioProvider({ children }: { children: ReactNode }) {
  const { content } = useContent();
  const tracks = content.tracks;
  const interludes = content.radio.interludes.filter((t) => t.trim());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<RadioStatus>('idle');
  const [message, setMessage] = useState('');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [radioMode, setRadioMode] = useState(false);
  const [interlude, setInterlude] = useState<string | null>(null);
  const interludeTimer = useRef<number | null>(null);
  const interludeCount = useRef(0);
  const loadedId = useRef<string | null>(null);

  const track = tracks[index];

  const audio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = 'metadata';
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  /* Mantém o índice válido quando a lista muda. */
  useEffect(() => {
    if (index > 0 && index >= tracks.length) setIndex(Math.max(0, tracks.length - 1));
  }, [tracks.length, index]);

  const startPlayback = useCallback(() => {
    const a = audio();
    a.play().then(
      () => setMessage(''),
      (err: unknown) => {
        setPlaying(false);
        if (err instanceof DOMException && err.name === 'NotAllowedError')
          setMessage('Toque em Reproduzir para começar.');
        else if (err instanceof DOMException && err.name === 'AbortError') return;
        else {
          setStatus('error');
          setMessage(
            'Não foi possível carregar esta faixa. O arquivo pode ter sido removido ou o endereço está incorreto.',
          );
        }
      },
    );
  }, [audio]);

  /* Carrega a faixa atual no elemento de áudio (somente faixas de arquivo). */
  const load = useCallback(
    async (t: Track | undefined, autoplay: boolean) => {
      const a = audio();
      if (!t || t.kind !== 'audio') {
        a.pause();
        a.removeAttribute('src');
        a.load();
        loadedId.current = null;
        setPlaying(false);
        setStatus('idle');
        setTime(0);
        setDuration(0);
        setMessage('');
        return;
      }
      if (loadedId.current === `${t.id}|${t.url}`) {
        if (autoplay) startPlayback();
        return;
      }
      loadedId.current = `${t.id}|${t.url}`;
      setStatus('loading');
      setMessage('');
      setTime(0);
      setDuration(0);
      const url = t.url.trim() ? await resolveMediaSrc(t.url.trim()) : null;
      if (loadedId.current !== `${t.id}|${t.url}`) return;
      if (!url) {
        setStatus('error');
        setPlaying(false);
        setMessage('O arquivo desta faixa não foi encontrado.');
        return;
      }
      a.src = url;
      a.load();
      if (autoplay) startPlayback();
    },
    [audio, startPlayback],
  );

  /* Eventos do elemento de áudio. */
  const onEndedRef = useRef<() => void>(() => {});
  useEffect(() => {
    const a = audio();
    const on = (type: string, fn: () => void) => {
      a.addEventListener(type, fn);
      return () => a.removeEventListener(type, fn);
    };
    const offs = [
      on('loadstart', () => a.src && setStatus('loading')),
      on('waiting', () => setStatus('loading')),
      on('canplay', () => setStatus('ready')),
      on('playing', () => {
        setStatus('ready');
        setPlaying(true);
        window.dispatchEvent(new CustomEvent('annelise:tocando', { detail: 'radio' }));
      }),
      on('play', () => setPlaying(true)),
      on('pause', () => setPlaying(false)),
      on('timeupdate', () => setTime(a.currentTime)),
      on('durationchange', () => setDuration(Number.isFinite(a.duration) ? a.duration : 0)),
      on('loadedmetadata', () => setDuration(Number.isFinite(a.duration) ? a.duration : 0)),
      on('ended', () => onEndedRef.current()),
      on('error', () => {
        if (!a.getAttribute('src')) return;
        setStatus('error');
        setPlaying(false);
        setMessage(
          'Não foi possível carregar esta faixa. O arquivo pode ter sido removido ou o endereço está incorreto.',
        );
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [audio]);

  /* Só um som por vez: se a playlist do Spotify começar, o arquivo pausa. */
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== 'radio') audioRef.current?.pause();
    };
    window.addEventListener('annelise:tocando', onOther);
    return () => window.removeEventListener('annelise:tocando', onOther);
  }, []);

  useEffect(() => {
    const a = audio();
    a.volume = volume;
    a.muted = muted;
  }, [audio, volume, muted]);

  const clearInterlude = () => {
    if (interludeTimer.current) window.clearTimeout(interludeTimer.current);
    interludeTimer.current = null;
    setInterlude(null);
  };

  const select = useCallback(
    (i: number, autoplay = false) => {
      if (!tracks.length) return;
      const n = ((i % tracks.length) + tracks.length) % tracks.length;
      clearInterlude();
      setIndex(n);
      void load(tracks[n], autoplay);
    },
    [tracks, load],
  );

  const goNext = useCallback(
    (autoplay: boolean) => {
      if (!tracks.length) return;
      const target = index + 1;
      if (radioMode && interludes.length && tracks.length > 1) {
        audio().pause();
        const text = interludes[interludeCount.current % interludes.length];
        interludeCount.current += 1;
        if (interludeTimer.current) window.clearTimeout(interludeTimer.current);
        setInterlude(text);
        interludeTimer.current = window.setTimeout(() => select(target, true), INTERLUDE_MS);
        return;
      }
      select(target, autoplay);
    },
    [tracks.length, index, radioMode, interludes, audio, select],
  );

  useEffect(() => {
    onEndedRef.current = () => {
      // No modo rádio, segue sempre; fora dele, para depois da última faixa.
      if (radioMode || index < tracks.length - 1) goNext(true);
      else setPlaying(false);
    };
  }, [radioMode, index, tracks.length, goNext]);

  useEffect(
    () => () => {
      if (interludeTimer.current) window.clearTimeout(interludeTimer.current);
      audioRef.current?.pause();
    },
    [],
  );

  const play = useCallback(() => {
    if (!track || track.kind !== 'audio') return;
    if (loadedId.current !== `${track.id}|${track.url}`) void load(track, true);
    else startPlayback();
  }, [track, load, startPlayback]);
  const pause = useCallback(() => audio().pause(), [audio]);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);
  const next = useCallback(() => goNext(playing), [goNext, playing]);
  const prev = useCallback(() => {
    const a = audio();
    if (track?.kind === 'audio' && a.currentTime > 4) {
      a.currentTime = 0;
      return;
    }
    select(index - 1, playing);
  }, [audio, track, select, index, playing]);
  const seek = useCallback(
    (s: number) => {
      const a = audio();
      if (Number.isFinite(a.duration)) a.currentTime = Math.max(0, Math.min(a.duration, s));
    },
    [audio],
  );

  /* Controles do sistema (tela bloqueada, fones). */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track || track.kind !== 'audio') return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'Faixas selecionadas',
      });
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('nexttrack', next);
      navigator.mediaSession.setActionHandler('previoustrack', prev);
    } catch {
      /* navegador sem suporte completo */
    }
  }, [track, play, pause, next, prev]);

  const value = useMemo<RadioValue>(
    () => ({
      tracks,
      index,
      track,
      playing,
      status,
      message,
      time,
      duration,
      volume,
      muted,
      radioMode,
      interlude,
      select,
      toggle,
      play,
      pause,
      next,
      prev,
      seek,
      setVolume: (v) => {
        setVolumeState(v);
        if (v > 0) setMuted(false);
      },
      toggleMute: () => setMuted((x) => !x),
      setRadioMode: (on) => {
        setRadioMode(on);
        if (!on) clearInterlude();
      },
      skipInterlude: () => {
        if (interludeTimer.current) {
          window.clearTimeout(interludeTimer.current);
          interludeTimer.current = null;
        }
        select(index + 1, true);
      },
    }),
    [
      tracks,
      index,
      track,
      playing,
      status,
      message,
      time,
      duration,
      volume,
      muted,
      radioMode,
      interlude,
      select,
      toggle,
      play,
      pause,
      next,
      prev,
      seek,
    ],
  );

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadio(): RadioValue {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error('useRadio precisa estar dentro de RadioProvider');
  return ctx;
}

export function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}
