import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { fragments } from '../data/fragments';
import { useMotion } from '../context/SettingsContext';
import { usePersistentState } from '../lib/usePersistentState';
import { Icon } from '../components/Icon';
import { initialFragmentsRead, type FragmentsRead } from './FragmentsPage';
import './fragments.css';

export default function FragmentDetailPage() {
  const { n } = useParams();
  const navigate = useNavigate();
  const m = useMotion();
  const number = Number(n);
  const index = fragments.findIndex((f) => f.number === number);
  const fragment = index >= 0 ? fragments[index] : null;
  const prev = index > 0 ? fragments[index - 1] : null;
  const next = index >= 0 && index < fragments.length - 1 ? fragments[index + 1] : null;
  const [, setState] = usePersistentState<FragmentsRead>('fragments', initialFragmentsRead);
  const [prevIndex, setPrevIndex] = useState(index);
  const [direction, setDirection] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  if (prevIndex !== index) {
    setDirection(index > prevIndex ? 1 : -1);
    setPrevIndex(index);
  }

  useEffect(() => {
    if (!fragment) return;
    setState((s) => ({
      read: s.read.includes(fragment.number) ? s.read : [...s.read, fragment.number],
      last: fragment.number,
    }));
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [fragment, setState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight' && next) go(next.number);
      if (e.key === 'ArrowLeft' && prev) go(prev.number);
      if (e.key === 'Escape') navigate('/fragmentos');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const go = (num: number) => {
    navigate(`/fragmentos/${num}`);
  };

  if (!fragment) {
    return (
      <div className="page page--narrow empty-state">
        <p className="eyebrow">Fragmentos</p>
        <h1 className="title">Este fragmento não existe.</h1>
        <p className="lede">São dez, numerados de 1 a 10.</p>
        <div className="row-actions">
          <Link className="btn" to="/fragmentos">
            Voltar à galeria
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="page page--narrow fragment-detail"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) {
          if (dx < 0 && next) go(next.number);
          if (dx > 0 && prev) go(prev.number);
        }
      }}
    >
      <div className="fragment-detail__bar">
        <Link to="/fragmentos" className="link-btn">
          <Icon name="arrow-left" size={16} /> Fragmentos
        </Link>
        <span className="meta num" aria-label={`Fragmento ${fragment.number} de 10`}>
          {fragment.number} / 10
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.article
          key={fragment.number}
          className="fragment-detail__article"
          custom={direction}
          initial={{ opacity: 0, x: m.reduced ? 0 : direction * 36 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: m.reduced ? 0 : direction * -36 }}
          transition={m.t(0.4)}
        >
          <h1 className="fragment-detail__title num" ref={headingRef} tabIndex={-1}>
            {fragment.number}
          </h1>
          <p className="fragment-detail__text">{fragment.text}</p>
        </motion.article>
      </AnimatePresence>

      <nav className="fragment-detail__nav" aria-label="Entre fragmentos">
        {prev ? (
          <Link to={`/fragmentos/${prev.number}`} className="fragment-nav fragment-nav--prev">
            <span className="meta">
              <Icon name="arrow-left" size={14} /> Anterior
            </span>
            <span className="fragment-nav__title">{prev.number}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/fragmentos/${next.number}`} className="fragment-nav fragment-nav--next">
            <span className="meta">
              Seguinte <Icon name="arrow-right" size={14} />
            </span>
            <span className="fragment-nav__title">{next.number}</span>
          </Link>
        ) : (
          <Link to="/fragmentos" className="fragment-nav fragment-nav--next">
            <span className="meta">
              Fim <Icon name="arrow-right" size={14} />
            </span>
            <span className="fragment-nav__title">Voltar aos fragmentos</span>
          </Link>
        )}
      </nav>
      <p className="meta fragment-detail__hint hide-mobile">Use as setas do teclado para avançar ou voltar.</p>
    </div>
  );
}
