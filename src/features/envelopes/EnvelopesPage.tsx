import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type TargetAndTransition } from 'framer-motion';
import { useContent } from '../../content/ContentContext';
import type { Envelope } from '../../content/types';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { usePersistentState } from '../../lib/usePersistentState';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import './envelopes.css';
import { AreaMark, Postmark, Tape } from '../../components/Ornaments';

/**
 * Cada envelope abre de um jeito:
 * aba — a aba levanta e o papel sobe;
 * salto — o papel salta para fora;
 * selo — o lacre se parte antes de abrir;
 * dobra — a carta se desdobra em três partes;
 * nevoa — o envelope se dissolve devagar.
 */
const variants = ['aba', 'salto', 'selo', 'dobra', 'nevoa'] as const;
type Variant = (typeof variants)[number];
const OPENING_MS: Record<Variant, number> = { aba: 1500, salto: 1300, selo: 1700, dobra: 1100, nevoa: 1600 };

const isIds = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

function EnvelopeArt({
  variant,
  stage,
  number,
}: {
  variant: Variant;
  stage: 'fechado' | 'abrindo' | 'lido';
  number: number;
}) {
  return (
    <div className="env" data-variant={variant} data-stage={stage} aria-hidden="true">
      <div className="env__back" />
      <div className="env__paper">
        <span />
        <span />
        <span />
      </div>
      <svg className="env__pocket" viewBox="0 0 160 100" preserveAspectRatio="none">
        <path d="M0 0 80 50 160 0v100H0Z" className="env__pocket-fill" />
        <path d="M0 100 68 48M160 100 92 48" className="env__fold" />
      </svg>
      <div className="env__flap" />
      <span className="env__seal">
        <i />
        <i />
      </span>
      <span className="env__num">N.º {String(number).padStart(2, '0')}</span>
      <Postmark
        className="env__postmark"
        top="CORREIO PARTICULAR"
        bottom="CARTAS GUARDADAS"
        center={String(number)}
        tone={number % 2 ? 'ink' : 'red'}
        rotate={number % 2 ? -14 : 10}
        size={62}
      />
    </div>
  );
}

function letterMotion(
  variant: Variant,
  reduced: boolean,
): { initial: TargetAndTransition; animate: TargetAndTransition } {
  if (reduced) return { initial: { opacity: 0 }, animate: { opacity: 1 } };
  switch (variant) {
    case 'aba':
      return {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
      };
    case 'salto':
      return {
        initial: { opacity: 0, y: 80, scale: 0.92, rotate: -2 },
        animate: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 180, damping: 14 } },
      };
    case 'selo':
      return {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: 'easeOut' } },
      };
    case 'dobra':
      return {
        initial: { opacity: 0, scaleY: 0.34 },
        animate: { opacity: 1, scaleY: 1, transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } },
      };
    case 'nevoa':
      return {
        initial: { opacity: 0, filter: 'blur(8px)' },
        animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: 1.6, ease: 'easeOut' } },
      };
  }
}

function Reader({
  envelope,
  variant,
  index,
  saved,
  onSave,
  onClose,
}: {
  envelope: Envelope;
  variant: Variant;
  index: number;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const m = useMotion();
  const [stage, setStage] = useState<'abrindo' | 'lendo'>(m.reduced ? 'lendo' : 'abrindo');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (stage !== 'abrindo') return;
    const id = window.setTimeout(() => setStage('lendo'), OPENING_MS[variant]);
    return () => window.clearTimeout(id);
  }, [stage, variant]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const opener = document.activeElement as HTMLElement | null;
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      opener?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  const lm = letterMotion(variant, m.reduced);

  return (
    <motion.div
      className="env-reader"
      role="dialog"
      aria-modal="true"
      aria-label={envelope.label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={m.t(0.35)}
    >
      <div className="env-reader__bar">
        <span className="env-reader__label">{envelope.label}</span>
        <button ref={closeRef} type="button" className="env-reader__close" onClick={onClose}>
          Fechar <Icon name="close" size={16} />
        </button>
      </div>

      <div className="env-reader__stage">
        {stage === 'abrindo' ? (
          <div className="env-reader__opening">
            <EnvelopeArt variant={variant} stage="abrindo" number={index + 1} />
          </div>
        ) : (
          <motion.article
            className="env-letter"
            data-variant={variant}
            initial={lm.initial}
            animate={lm.animate}
            style={{ transformOrigin: 'top center' }}
          >
            <Tape className="env-letter__tape" rotate={-2} />
            <h2 className="env-letter__title">{envelope.label}</h2>
            <div className="env-letter__body">
              {envelope.body
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
            <footer className="env-letter__foot">
              <p>Você pode guardar esta mensagem e voltar a ela depois.</p>
              <div className="env-letter__actions">
                <button type="button" className="btn" aria-pressed={saved} onClick={onSave}>
                  {saved ? (
                    <>
                      <Icon name="check" size={16} /> Guardada
                    </>
                  ) : (
                    'Guardar mensagem'
                  )}
                </button>
                <button type="button" className="btn btn--ghost" onClick={onClose}>
                  Fechar
                </button>
              </div>
            </footer>
          </motion.article>
        )}
      </div>
    </motion.div>
  );
}

export default function EnvelopesPage() {
  const { content } = useContent();
  const { envelopesOpened, openEnvelope, mark } = useProgress();
  const m = useMotion();
  const [saved, setSaved] = usePersistentState<string[]>('cartas:guardadas', [], isIds);
  const [openId, setOpenId] = useState<string | null>(null);
  const envelopes = content.envelopes.filter((e) => e.label.trim() || e.body.trim());
  const openIndex = envelopes.findIndex((e) => e.id === openId);
  const current = openIndex >= 0 ? envelopes[openIndex] : null;

  const open = (id: string) => {
    setOpenId(id);
    openEnvelope(id);
    mark('cartas');
  };

  return (
    <div className="page envelopes">
      <header className="envelopes__head">
        <AreaMark id="cartas" />
        <h1 className="envelopes__title">Cartas guardadas</h1>
        <p className="envelopes__desc">Algumas mensagens foram escritas para momentos específicos.</p>
      </header>

      {envelopes.length === 0 ? (
        <EmptyState text="Nenhuma carta foi guardada aqui ainda." adminTab="cartas" />
      ) : (
        <ul className="envelopes__grid">
          {envelopes.map((e, i) => {
            const read = envelopesOpened.includes(e.id);
            const isSaved = saved.includes(e.id);
            return (
              <motion.li
                key={e.id}
                className="envelopes__item"
                initial={{ opacity: 0, y: m.reduced ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={m.t(0.6, { delay: i * 0.08 * m.factor })}
              >
                <EnvelopeArt variant={variants[i % variants.length]} stage={read ? 'lido' : 'fechado'} number={i + 1} />
                <p className="envelopes__label">{e.label}</p>
                <div className="envelopes__meta">
                  {read && <span>Lida</span>}
                  {isSaved && <span className="envelopes__saved">Guardada</span>}
                </div>
                <button type="button" className="btn" onClick={() => open(e.id)}>
                  Abrir envelope
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>
        {current && (
          <Reader
            key={current.id}
            envelope={current}
            variant={variants[openIndex % variants.length]}
            index={openIndex}
            saved={saved.includes(current.id)}
            onSave={() =>
              setSaved((s) => (s.includes(current.id) ? s.filter((x) => x !== current.id) : [...s, current.id]))
            }
            onClose={() => setOpenId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
