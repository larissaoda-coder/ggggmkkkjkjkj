import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContent } from '../../content/ContentContext';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { usePersistentState } from '../../lib/usePersistentState';
import { EmptyState } from '../../components/EmptyState';
import './future.css';
import { AreaMark } from '../../components/Ornaments';

const who = { hoje: 'Agora', adiante: 'Em outra fase' } as const;

export default function FuturePage() {
  const { content } = useContent();
  const { mark } = useProgress();
  const m = useMotion();
  const scenes = content.future.filter((s) => s.lines.some((l) => l.text.trim()));
  const [saved, setSaved] = usePersistentState('futuro:cena', 0);
  const index = Math.min(Math.max(0, saved), Math.max(0, scenes.length - 1));
  const scene = scenes[index];
  const lines = useMemo(() => (scene ? scene.lines.filter((l) => l.text.trim()) : []), [scene]);
  const [shown, setShown] = useState(m.reduced ? lines.length : 0);
  const [typing, setTyping] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  /* As mensagens aparecem uma de cada vez, como numa conversa. */
  useEffect(() => {
    setShown(m.reduced ? lines.length : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id]);

  useEffect(() => {
    if (shown >= lines.length) {
      setTyping(false);
      return;
    }
    const nextLine = lines[shown];
    const wait = shown === 0 ? 450 : Math.min(2600, 700 + nextLine.text.length * 18);
    setTyping(nextLine.who === 'adiante' && shown > 0);
    const id = window.setTimeout(() => setShown((s) => s + 1), wait);
    return () => window.clearTimeout(id);
  }, [shown, lines]);

  // Rola apenas a conversa, nunca a página inteira.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: m.reduced ? 'auto' : 'smooth' });
  }, [shown, typing, m.reduced]);

  useEffect(() => {
    if (scenes.length && index === scenes.length - 1 && shown >= lines.length) mark('futuro');
  }, [index, scenes.length, shown, lines.length, mark]);

  const go = (i: number) => setSaved(Math.max(0, Math.min(scenes.length - 1, i)));
  const done = shown >= lines.length;

  return (
    <div className="page future">
      <header className="future__head">
        <AreaMark id="futuro" />
        <h1 className="future__title">Em outra fase da vida</h1>
        <p className="future__desc">Algumas cenas imaginadas sobre como a vida poderia ser.</p>
      </header>

      {!scene ? (
        <EmptyState text="Nenhuma cena foi escrita ainda." adminTab="futuro" />
      ) : (
        <div className="future__layout">
          <nav className="future__scenes" aria-label="Cenas">
            <ol>
              {scenes.map((s, i) => (
                <li key={s.id}>
                  <button type="button" aria-current={i === index ? 'true' : undefined} onClick={() => go(i)}>
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    {s.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <section className="chat" aria-label={scene.title}>
            <header className="chat__head">
              <span className="chat__dot" aria-hidden="true" />
              <div>
                <p className="chat__title">{scene.title}</p>
                <p className="chat__sub">
                  Cena imaginada {index + 1} de {scenes.length}
                </p>
              </div>
            </header>

            <div className="chat__log" aria-live="polite" ref={logRef}>
              <AnimatePresence initial={false}>
                {lines.slice(0, shown).map((l, i) => (
                  <motion.div
                    key={`${scene.id}-${i}`}
                    className="msg"
                    data-who={l.who}
                    initial={{ opacity: 0, y: m.reduced ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={m.t(0.35)}
                  >
                    {(i === 0 || lines[i - 1].who !== l.who) && <span className="msg__who">{who[l.who]}</span>}
                    <p className="msg__bubble">{l.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {typing && !done && (
                <div className="msg msg--typing" data-who="adiante" aria-hidden="true">
                  <p className="msg__bubble">
                    <span />
                    <span />
                    <span />
                  </p>
                </div>
              )}
            </div>

            <footer className="chat__foot">
              {done ? (
                <>
                  <button type="button" className="btn btn--ghost" onClick={() => go(index - 1)} disabled={index === 0}>
                    Cena anterior
                  </button>
                  {index < scenes.length - 1 ? (
                    <button type="button" className="btn" onClick={() => go(index + 1)}>
                      Próxima cena
                    </button>
                  ) : (
                    <button type="button" className="btn" onClick={() => go(0)}>
                      Voltar à primeira cena
                    </button>
                  )}
                </>
              ) : (
                <button type="button" className="link-btn" onClick={() => setShown(lines.length)}>
                  Mostrar a cena inteira
                </button>
              )}
            </footer>
          </section>
        </div>
      )}

      <p className="future__note">
        Estas cenas são imaginadas. Não são previsão, promessa nem cobrança: são só uma forma de pensar em como poderia
        ser.
      </p>
    </div>
  );
}
