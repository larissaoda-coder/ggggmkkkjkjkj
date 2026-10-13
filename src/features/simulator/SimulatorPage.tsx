import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { scenes, endings, chapters, START, storyTitle, speakerNames } from './story';
import {
  choose,
  choiceViews,
  enter,
  initialState,
  resolve,
  visibleLines,
  type Choice,
  type StoryState,
} from './engine';
import { Backdrop } from './Backdrop';
import { usePersistentState } from '../../lib/usePersistentState';
import { useMotion, useSettings } from '../../context/SettingsContext';
import { sfx, startRain, stopAmbience } from '../../lib/sound';
import { Icon } from '../../components/Icon';
import './simulator.css';

interface HistoryEntry {
  sceneId: string;
  chapter: number;
  choiceId: string;
  label: string;
  /** Estado na cena, antes da escolha — permite voltar exatamente a este ponto. */
  before: StoryState;
}

interface Save {
  sceneId: string;
  state: StoryState;
  history: HistoryEntry[];
  shown: number;
  /** Cenas visitadas neste percurso (para o indicador de progresso). */
  visited: string[];
}

interface Prefs {
  reveal: 'gradual' | 'imediata';
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function freshSave(): Save {
  const scene = scenes[START];
  return { sceneId: START, state: enter(scene, initialState()), history: [], shown: 1, visited: [START] };
}

function isSave(v: unknown): v is Save | null {
  if (v === null) return true;
  const s = v as Save;
  return (
    typeof s === 'object' && typeof s.sceneId === 'string' && Boolean(scenes[s.sceneId]) && Array.isArray(s.history)
  );
}

export default function SimulatorPage() {
  const m = useMotion();
  const { settings, update } = useSettings();
  const [save, setSave] = usePersistentState<Save | null>('sim:save', null, isSave);
  const [found, setFound] = usePersistentState<string[]>('sim:endings', []);
  const [prefs, setPrefs] = usePersistentState<Prefs>('sim:prefs', { reveal: 'gradual' });
  const [started, setStarted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [chapterCard, setChapterCard] = useState<number | null>(null);
  const linesEndRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const scene = save ? scenes[save.sceneId] : null;
  const state = save?.state;
  const lines = useMemo(() => (scene && state ? visibleLines(scene, state) : []), [scene, state]);
  const shown = save ? (prefs.reveal === 'imediata' ? lines.length : Math.min(save.shown, lines.length)) : 0;
  const allShown = shown >= lines.length;
  const views = useMemo(() => (scene && state ? choiceViews(scene, state) : []), [scene, state]);

  /* ---------- ambiência sonora ---------- */
  const backdrop = scene && state ? resolve(scene.backdrop, state) : null;
  useEffect(() => {
    if (!started || !settings.sound) return;
    if (backdrop === 'sala-chuva') startRain();
    else stopAmbience('rain');
  }, [backdrop, started, settings.sound]);
  useEffect(() => () => stopAmbience('rain'), []);

  /* ---------- registro de desfechos ---------- */
  useEffect(() => {
    if (scene?.ending && allShown && !found.includes(scene.ending)) {
      setFound((f) => [...f, scene.ending!]);
      sfx.reveal();
    }
  }, [scene, allShown, found, setFound]);

  /* ---------- rolagem até a fala mais recente ---------- */
  useEffect(() => {
    if (!started) return;
    linesEndRef.current?.scrollIntoView({ block: 'nearest', behavior: m.reduced ? 'auto' : 'smooth' });
  }, [shown, started, save?.sceneId, m.reduced]);

  /* ---------- cartão de capítulo ---------- */
  useEffect(() => {
    if (chapterCard === null) return;
    const id = window.setTimeout(() => setChapterCard(null), Math.max(1100, 2200 * m.factor));
    return () => window.clearTimeout(id);
  }, [chapterCard, m.factor]);

  const goTo = (to: string, nextState: StoryState, entry?: HistoryEntry) => {
    const target = scenes[to];
    if (!target) return;
    const base = save ?? freshSave();
    if (target.chapter !== scenes[base.sceneId].chapter) {
      setChapterCard(target.chapter);
      sfx.transition();
    }
    setSave({
      sceneId: to,
      state: enter(target, nextState),
      history: entry ? [...base.history, entry] : base.history,
      shown: 1,
      visited: base.visited.includes(to) ? base.visited : [...base.visited, to],
    });
  };

  const advance = useCallback(() => {
    if (!save || allShown) return;
    sfx.tick();
    setSave({ ...save, shown: save.shown + 1 });
  }, [save, allShown, setSave]);

  const revealAll = () => save && setSave({ ...save, shown: lines.length });

  const pick = (choice: Choice) => {
    if (!save || !scene) return;
    sfx.select();
    const result = choose(choice, save.state);
    goTo(result.to, result.state, {
      sceneId: scene.id,
      chapter: scene.chapter,
      choiceId: choice.id,
      label: choice.label,
      before: save.state,
    });
  };

  const continueScene = () => {
    if (!save || !scene?.next) return;
    sfx.tick();
    goTo(resolve(scene.next, save.state), save.state);
  };

  const rewindTo = (index: number) => {
    if (!save) return;
    const entry = save.history[index];
    sfx.transition();
    setSave({
      ...save,
      sceneId: entry.sceneId,
      state: entry.before,
      history: save.history.slice(0, index),
      shown: 999,
    });
    setHistoryOpen(false);
  };

  const restart = () => {
    setSave(freshSave());
    setConfirmRestart(false);
    setHistoryOpen(false);
    setStarted(true);
    setChapterCard(1);
    sfx.transition();
  };

  const begin = () => {
    if (!save) {
      setSave(freshSave());
      setChapterCard(1);
    } else {
      setChapterCard(scenes[save.sceneId].chapter);
    }
    sfx.transition();
    setStarted(true);
  };

  /* ---------- teclado ---------- */
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (historyOpen || el.closest('input, textarea, select, [role="dialog"]')) return;
      if (chapterCard !== null && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setChapterCard(null);
        return;
      }
      if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') && !el.closest('button, a')) {
        if (!allShown) {
          e.preventDefault();
          advance();
        } else if (scene?.next && !scene.choices) {
          e.preventDefault();
          continueScene();
        }
      }
      const n = Number(e.key);
      if (allShown && n >= 1 && n <= 9) {
        const available = views.filter((v) => v.available);
        if (available[n - 1]) pick(available[n - 1].choice);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ================= Tela de abertura ================= */
  if (!started || !save || !scene || !state) {
    const savedChapter = save ? scenes[save.sceneId].chapter : null;
    return (
      <div className="sim-intro">
        <div className="sim-intro__inner">
          <p className="eyebrow">Simulador de escolhas</p>
          <h1 className="sim-intro__title">{storyTitle}</h1>
          <p className="sim-intro__lede">
            Uma história curta, em cinco capítulos. As decisões mudam as cenas seguintes, abrem alguns caminhos e fecham
            outros. Há sete desfechos possíveis — nenhum deles é o certo.
          </p>
          <div className="row-actions sim-intro__actions">
            <button type="button" className="btn btn--solid" onClick={begin}>
              {save && savedChapter ? `Continuar — Capítulo ${ROMAN[savedChapter - 1]}` : 'Começar'}
              <Icon name="arrow-right" size={16} />
            </button>
            {save && (
              <button type="button" className="btn" onClick={restart}>
                Recomeçar do início
              </button>
            )}
          </div>
          <EndingsList found={found} />
          <p className="meta sim-intro__note">
            Personagens e situações são fictícios. O progresso fica salvo neste navegador. Use Espaço ou Enter para
            avançar, e os números para escolher.
          </p>
        </div>
      </div>
    );
  }

  const chapter = scene.chapter;
  const place = resolve(scene.place, state);
  const time = resolve(scene.time, state);
  const ending = scene.ending ? endings.find((e) => e.id === scene.ending) : null;

  /* ================= Cena ================= */
  return (
    <div className="sim" data-backdrop={backdrop}>
      <header className="sim__bar">
        <div className="sim__chapter">
          <span className="eyebrow sim__chapter-num">
            <span className="hide-mobile">Capítulo </span>
            {ROMAN[chapter - 1]}
            <span aria-hidden="true"> / </span>
            <span className="visually-hidden"> de </span>V
          </span>
          <span className="sim__chapter-name">{chapters[chapter - 1]}</span>
        </div>
        <div className="sim__progress" aria-label={`Capítulo ${chapter} de ${chapters.length}`} role="img">
          {chapters.map((_, i) => (
            <span key={i} data-state={i + 1 < chapter ? 'done' : i + 1 === chapter ? 'current' : 'next'} />
          ))}
        </div>
        <div className="sim__tools">
          <button
            type="button"
            className="icon-btn icon-btn--small"
            onClick={() => setHistoryOpen(true)}
            aria-label={`Histórico de decisões (${save.history.length})`}
            title="Histórico de decisões"
          >
            <Icon name="history" size={18} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--small"
            onClick={() => setPrefs({ reveal: prefs.reveal === 'gradual' ? 'imediata' : 'gradual' })}
            aria-pressed={prefs.reveal === 'imediata'}
            aria-label={prefs.reveal === 'gradual' ? 'Mostrar cenas inteiras de uma vez' : 'Revelar falas uma a uma'}
            title={prefs.reveal === 'gradual' ? 'Revelação gradual' : 'Cenas inteiras'}
          >
            <Icon name="skip" size={18} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--small"
            onClick={() => update({ sound: !settings.sound })}
            aria-pressed={settings.sound}
            aria-label={settings.sound ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
            title="Efeitos sonoros"
          >
            <Icon name={settings.sound ? 'sound' : 'sound-off'} size={18} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--small"
            onClick={() => setConfirmRestart(true)}
            aria-label="Recomeçar a história"
            title="Recomeçar"
          >
            <Icon name="reset" size={18} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {confirmRestart && (
          <motion.div
            className="sim__confirm"
            role="alertdialog"
            aria-label="Recomeçar a história"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={m.t(0.2)}
          >
            <p>Recomeçar do início? Os desfechos já encontrados continuam registrados.</p>
            <div className="row-actions">
              <button type="button" className="btn btn--solid btn--small" onClick={restart} autoFocus>
                Recomeçar
              </button>
              <button type="button" className="btn btn--small" onClick={() => setConfirmRestart(false)}>
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sim__backdrop">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={backdrop}
            className="sim__backdrop-art"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={m.t(1.1)}
          >
            {backdrop && <Backdrop kind={backdrop} />}
          </motion.div>
        </AnimatePresence>
        <p className="sim__caption">
          <span>{place}</span>
          <span aria-hidden="true">—</span>
          <span>{time}</span>
        </p>
      </div>

      <div
        className="sim__stage"
        ref={stageRef}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, a')) return;
          advance();
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={save.sceneId + save.history.length}
            className="sim__lines"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={m.t(0.35)}
            aria-live="polite"
          >
            {lines.slice(0, shown).map((line, i) => (
              <motion.div
                key={i}
                className={`sim-line sim-line--${line.who}`}
                data-old={i < shown - 1}
                initial={{ opacity: 0, y: m.reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={m.t(0.5)}
              >
                {speakerNames[line.who] && <span className="sim-line__who">{speakerNames[line.who]}</span>}
                <p className="sim-line__text">{line.text}</p>
              </motion.div>
            ))}
            <div ref={linesEndRef} className="sim__lines-end" />
          </motion.div>
        </AnimatePresence>

        {!allShown && (
          <div className="sim__advance">
            <button type="button" className="sim__next" onClick={advance}>
              <span>Continuar</span>
              <span className="sim__next-dots" aria-hidden="true">
                {shown}/{lines.length}
              </span>
            </button>
            <button type="button" className="link-btn" onClick={revealAll}>
              Mostrar a cena inteira
            </button>
          </div>
        )}

        {allShown && !ending && scene.choices && (
          <motion.ol
            className="sim__choices"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 * m.factor } } }}
            aria-label="Escolhas"
          >
            {views.map(({ choice, available }, i) => {
              const index = views.filter((v) => v.available).indexOf(views[i]) + 1;
              return (
                <motion.li
                  key={choice.id}
                  variants={{ hidden: { opacity: 0, y: m.reduced ? 0 : 8 }, show: { opacity: 1, y: 0 } }}
                  transition={m.t(0.4)}
                >
                  <button
                    type="button"
                    className="sim-choice"
                    disabled={!available}
                    onClick={() => pick(choice)}
                    aria-describedby={!available ? `locked-${choice.id}` : undefined}
                  >
                    <span className="sim-choice__key num" aria-hidden="true">
                      {available ? index : <Icon name="lock" size={12} />}
                    </span>
                    <span className="sim-choice__label">{choice.label}</span>
                    {!available && (
                      <span className="sim-choice__locked" id={`locked-${choice.id}`}>
                        {choice.locked}
                      </span>
                    )}
                  </button>
                </motion.li>
              );
            })}
          </motion.ol>
        )}

        {allShown && !ending && !scene.choices && scene.next && (
          <div className="sim__advance">
            <button type="button" className="btn" onClick={continueScene}>
              Seguir <Icon name="arrow-right" size={16} />
            </button>
          </div>
        )}

        {allShown && ending && (
          <motion.section
            className="sim-ending"
            initial={{ opacity: 0, y: m.reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={m.t(1, { delay: 0.4 * m.factor })}
            aria-labelledby="sim-ending-title"
          >
            <p className="eyebrow">Um desfecho</p>
            <h2 id="sim-ending-title" className="sim-ending__title">
              {ending.title}
            </h2>
            <p className="sim-ending__note">{ending.note}</p>
            <EndingsList found={found} current={ending.id} />
            <div className="row-actions">
              {save.history.length > 0 && (
                <button type="button" className="btn btn--solid" onClick={() => setHistoryOpen(true)}>
                  <Icon name="history" size={16} /> Voltar a uma escolha
                </button>
              )}
              <button type="button" className="btn" onClick={restart}>
                <Icon name="reset" size={16} /> Recomeçar
              </button>
              <Link to="/sumario" className="btn btn--ghost">
                Outra seção
              </Link>
            </div>
          </motion.section>
        )}
      </div>

      {/* ---------- cartão de capítulo ---------- */}
      <AnimatePresence>
        {chapterCard !== null && (
          <motion.button
            type="button"
            className="sim-chapter-card"
            onClick={() => setChapterCard(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={m.t(0.6)}
            aria-label={`Capítulo ${chapterCard}: ${chapters[chapterCard - 1]}. Toque para continuar.`}
          >
            <motion.span
              className="sim-chapter-card__num"
              initial={{ opacity: 0, letterSpacing: m.reduced ? '0.3em' : '0.8em' }}
              animate={{ opacity: 1, letterSpacing: '0.3em' }}
              transition={m.t(1.2)}
            >
              {ROMAN[chapterCard - 1]}
            </motion.span>
            <motion.span
              className="sim-chapter-card__name"
              initial={{ opacity: 0, y: m.reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={m.t(1, { delay: 0.3 * m.factor })}
            >
              {chapters[chapterCard - 1]}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ---------- histórico ---------- */}
      <AnimatePresence>
        {historyOpen && (
          <HistoryPanel
            history={save.history}
            found={found}
            onClose={() => setHistoryOpen(false)}
            onRewind={rewindTo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EndingsList({ found, current }: { found: string[]; current?: string }) {
  return (
    <div className="sim-endings">
      <p className="meta">
        {found.length === 0
          ? 'Nenhum desfecho encontrado ainda.'
          : `${found.length} de ${endings.length} desfechos encontrados`}
      </p>
      <ul className="sim-endings__list" aria-label="Desfechos">
        {endings.map((e) => {
          const known = found.includes(e.id);
          return (
            <li key={e.id} data-known={known} data-current={current === e.id}>
              <span className="sim-endings__dot" aria-hidden="true" />
              <span>{known ? e.title : 'Ainda não encontrado'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HistoryPanel({
  history,
  found,
  onClose,
  onRewind,
}: {
  history: HistoryEntry[];
  found: string[];
  onClose: () => void;
  onRewind: (i: number) => void;
}) {
  const m = useMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        className="sheet-scrim sim-history__scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={m.t(0.25)}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        className="sim-history"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sim-history-title"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={m.t(0.45)}
      >
        <div className="sim-history__head">
          <h2 id="sim-history-title" className="title">
            Decisões
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar o histórico">
            <Icon name="close" size={18} />
          </button>
        </div>
        {history.length === 0 ? (
          <p className="meta">Nenhuma decisão tomada ainda neste percurso.</p>
        ) : (
          <ol className="sim-history__list">
            {history.map((h, i) => (
              <li key={i}>
                <span className="sim-history__chapter eyebrow">
                  {ROMAN[h.chapter - 1]} · {chapters[h.chapter - 1]}
                </span>
                <span className="sim-history__label">{h.label}</span>
                <button type="button" className="link-btn" onClick={() => onRewind(i)}>
                  <Icon name="undo" size={14} /> Voltar a este momento
                </button>
              </li>
            ))}
          </ol>
        )}
        <p className="meta sim-history__note">
          Voltar a uma decisão desfaz as escolhas seguintes. Os desfechos já encontrados ({found.length} de{' '}
          {endings.length}) continuam registrados.
        </p>
      </motion.div>
    </>
  );
}
