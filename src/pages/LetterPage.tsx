import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { letterParagraphs, letterWordCount } from '../data/letter';
import { useMotion, useSettings } from '../context/SettingsContext';
import { useProgress } from '../context/ProgressContext';
import { usePersistentState } from '../lib/usePersistentState';
import { Icon } from '../components/Icon';
import './letter.css';

type Phase = 'closed' | 'opening' | 'open';

interface LetterState {
  position: number; // 0–1
  scale: number;
  finished: boolean;
  openedOnce: boolean;
}

const initialLetter: LetterState = { position: 0, scale: 1, finished: false, openedOnce: false };
const SCALES = [0.85, 0.92, 1, 1.1, 1.2, 1.32, 1.45];
const WPM = 190;

export default function LetterPage() {
  const m = useMotion();
  const { resolvedTheme, toggleTheme } = useSettings();
  const { mark } = useProgress();
  const [saved, setSaved] = usePersistentState<LetterState>('letter', initialLetter);
  const [phase, setPhase] = useState<Phase>('closed');
  const [progress, setProgress] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pendingRestore = useRef<number | null>(null);
  const openTimer = useRef<number | undefined>(undefined);

  const totalMinutes = Math.max(1, Math.round(letterWordCount / WPM));

  /* ---------- abertura ---------- */
  const reveal = useCallback(
    (restoreTo: number | null) => {
      window.clearTimeout(openTimer.current);
      pendingRestore.current = restoreTo;
      setPhase('open');
      setSaved((s) => ({ ...s, openedOnce: true }));
    },
    [setSaved],
  );

  const openAnimated = () => {
    if (m.reduced) {
      reveal(null);
      return;
    }
    setPhase('opening');
    openTimer.current = window.setTimeout(() => reveal(null), 1900 * m.factor);
  };

  useEffect(() => () => window.clearTimeout(openTimer.current), []);

  /* ---------- progresso e posição ---------- */
  const measure = useCallback(() => {
    const el = articleRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight * 0.6;
    if (span <= 0) return 1;
    return Math.min(1, Math.max(0, (window.scrollY - top + window.innerHeight * 0.2) / span));
  }, []);

  const scrollToFraction = useCallback((fraction: number) => {
    const el = articleRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight * 0.6;
    const y = top - window.innerHeight * 0.2 + fraction * span;
    window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
  }, []);

  useLayoutEffect(() => {
    if (phase !== 'open') return;
    const target = pendingRestore.current;
    pendingRestore.current = null;
    // Aguarda um quadro para a tipografia assentar antes de restaurar a posição.
    const id = requestAnimationFrame(() => {
      if (target !== null && target > 0) scrollToFraction(target);
      else window.scrollTo({ top: 0 });
      setProgress(measure());
    });
    return () => cancelAnimationFrame(id);
  }, [phase, measure, scrollToFraction]);

  useEffect(() => {
    if (phase !== 'open') return;
    let raf = 0;
    let lastSave = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = measure();
        setProgress(p);
        const now = Date.now();
        if (now - lastSave > 600) {
          lastSave = now;
          setSaved((s) => ({ ...s, position: p, finished: s.finished || p >= 0.995 }));
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      // Salva a posição exata ao sair.
      const p = measure();
      setSaved((s) => ({ ...s, position: p }));
    };
  }, [phase, measure, setSaved]);

  useEffect(() => {
    if (phase !== 'open' || !endRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAtEnd(true);
          mark('carta');
          setSaved((s) => (s.finished ? s : { ...s, finished: true }));
        }
      },
      { threshold: 0.6 },
    );
    io.observe(endRef.current);
    return () => io.disconnect();
  }, [phase, setSaved, mark]);

  /* ---------- tamanho do texto (mantém a posição de leitura) ---------- */
  const changeScale = (dir: 1 | -1) => {
    const i = SCALES.findIndex((s) => s >= saved.scale - 0.001);
    const nextIndex = Math.min(SCALES.length - 1, Math.max(0, (i === -1 ? 2 : i) + dir));
    const current = measure();
    pendingRestore.current = null;
    setSaved((s) => ({ ...s, scale: SCALES[nextIndex] }));
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToFraction(current)));
  };

  const backToStart = () => {
    window.scrollTo({ top: 0, behavior: m.reduced ? 'auto' : 'smooth' });
  };

  const closeLetter = () => {
    setSaved((s) => ({ ...s, position: measure() }));
    setPhase('closed');
    setAtEnd(false);
    window.scrollTo({ top: 0 });
  };

  const remaining = Math.max(0, Math.ceil(totalMinutes * (1 - progress)));
  const hasPosition = saved.position > 0.03 && saved.position < 0.985;

  /* ---------- carta fechada ---------- */
  if (phase !== 'open') {
    const opening = phase === 'opening';
    return (
      <div className="letter-closed">
        <h1 className="visually-hidden">Carta</h1>
        <div className="letter-closed__stage">
          <div className={`envelope${opening ? ' envelope--opening' : ''}`} aria-hidden="true">
            <div className="envelope__paper">
              <span className="envelope__paper-line" />
              <span className="envelope__paper-line" />
              <span className="envelope__paper-line envelope__paper-line--short" />
            </div>
            <div className="envelope__back" />
            <div className="envelope__front">
              <svg viewBox="0 0 100 62" preserveAspectRatio="none">
                <path d="M0 62 L50 30 L100 62" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="envelope__flap" />
            <div className="envelope__seal" />
          </div>
        </div>

        <div className="letter-closed__actions">
          {!opening ? (
            <>
              <button type="button" className="btn btn--solid" onClick={openAnimated}>
                Abrir a carta
              </button>
              {hasPosition ? (
                <button type="button" className="link-btn" onClick={() => reveal(saved.position)}>
                  Continuar de onde parou ({Math.round(saved.position * 100)}%)
                </button>
              ) : (
                <button type="button" className="link-btn" onClick={() => reveal(null)}>
                  Ler sem animação
                </button>
              )}
              {hasPosition && (
                <button type="button" className="link-btn" onClick={() => reveal(null)}>
                  Começar do início
                </button>
              )}
            </>
          ) : (
            <button type="button" className="btn" onClick={() => reveal(null)}>
              <Icon name="skip" size={16} /> Pular animação
            </button>
          )}
        </div>
        <p className="meta letter-closed__meta">
          Cerca de {totalMinutes} minutos de leitura · {letterParagraphs.length} parágrafos
        </p>
      </div>
    );
  }

  /* ---------- carta aberta ---------- */
  return (
    <div className="letter-open">
      <h1 className="visually-hidden">Carta</h1>
      <div className="letter-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="letter-toolbar" role="toolbar" aria-label="Ferramentas de leitura">
        <button type="button" className="icon-btn icon-btn--small" onClick={closeLetter} aria-label="Fechar a carta">
          <Icon name="close" size={18} />
        </button>
        <span className="letter-toolbar__status num" aria-live="off">
          {Math.round(progress * 100)}%
          <span className="letter-toolbar__remaining">{progress >= 0.995 ? ' · lida' : ` · ${remaining} min`}</span>
        </span>
        <span className="letter-toolbar__spacer" />
        <button
          type="button"
          className="icon-btn icon-btn--small"
          onClick={() => changeScale(-1)}
          disabled={saved.scale <= SCALES[0]}
          aria-label="Diminuir o texto"
        >
          <span className="letter-toolbar__a letter-toolbar__a--small">A</span>
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--small"
          onClick={() => changeScale(1)}
          disabled={saved.scale >= SCALES[SCALES.length - 1]}
          aria-label="Aumentar o texto"
        >
          <span className="letter-toolbar__a">A</span>
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--small"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
        >
          <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--small"
          onClick={backToStart}
          aria-label="Voltar ao início da carta"
          disabled={progress < 0.02}
        >
          <Icon name="arrow-up" size={18} />
        </button>
      </div>

      <motion.article
        ref={articleRef}
        className="letter-paper"
        style={{ ['--letter-scale' as string]: saved.scale }}
        initial={{ opacity: 0, y: m.reduced ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={m.t(0.8)}
        aria-label="Carta"
      >
        <div className="letter-paper__body">
          {letterParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div ref={endRef} className={`letter-end${atEnd ? ' letter-end--visible' : ''}`}>
          <span className="letter-end__rule" aria-hidden="true" />
          <span className="letter-end__dot" aria-hidden="true" />
        </div>
      </motion.article>

      <AnimatePresence>
        {atEnd && (
          <motion.nav
            className="letter-after"
            aria-label="Depois da carta"
            initial={{ opacity: 0, y: m.reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={m.t(1.2, { delay: 0.6 * m.factor })}
          >
            <button type="button" className="link-btn" onClick={backToStart}>
              <Icon name="arrow-up" size={16} /> Voltar ao início da carta
            </button>
            <button type="button" className="link-btn" onClick={closeLetter}>
              <Icon name="letter" size={16} /> Fechar a carta
            </button>
            <Link to="/livro" className="link-btn">
              Abrir o livro <Icon name="arrow-right" size={16} />
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
