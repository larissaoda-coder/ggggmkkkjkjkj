import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cards, closingNote, finalReading, lotusArt, positions, shuffle, type OracleCard } from './cards';
import { useContent } from '../../content/ContentContext';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import './oracle.css';

type Phase = 'inicio' | 'embaralhando' | 'escolha' | 'revelacao';

function CardBack() {
  return (
    <svg viewBox="0 0 100 140" className="ocard__svg" aria-hidden="true">
      <rect x="6" y="6" width="88" height="128" rx="3" className="ocard__frame" />
      <circle cx="50" cy="70" r="30" className="ocard__thin" />
      <circle cx="50" cy="70" r="20" className="ocard__thin" />
      <circle cx="50" cy="70" r="10" className="ocard__thin" />
      <path
        d="M50 78c-3-6-3-12 0-18 3 6 3 12 0 18ZM50 78c-6-3-9-8-9-14 6 2 8 7 9 14ZM50 78c6-3 9-8 9-14-6 2-8 7-9 14Z"
        className="ocard__line"
      />
      {[
        [20, 22],
        [30, 30],
        [24, 40],
        [78, 112],
        [70, 118],
        [80, 124],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.9" className="ocard__dot" />
      ))}
      <path d="M20 22 30 30 24 40M78 112l-8 6 10 6" className="ocard__thin" />
    </svg>
  );
}

function CardFace({ number, name, art }: { number: number | string; name: string; art: ReactElement }) {
  return (
    <svg viewBox="0 0 100 140" className="ocard__svg" aria-hidden="true">
      <rect x="6" y="6" width="88" height="128" rx="3" className="ocard__frame" />
      <rect x="10" y="10" width="80" height="120" rx="2" className="ocard__thin" />
      <text x="50" y="26" textAnchor="middle" className="ocard__num">
        {number}
      </text>
      <g className="ocard__art">{art}</g>
      <text x="50" y="122" textAnchor="middle" className="ocard__name">
        {name}
      </text>
    </svg>
  );
}

export default function OraclePage() {
  const { content } = useContent();
  const { mark } = useProgress();
  const m = useMotion();
  const [phase, setPhase] = useState<Phase>('inicio');
  const [deck, setDeck] = useState<OracleCard[]>(cards);
  const [chosen, setChosen] = useState<OracleCard[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [lotus, setLotus] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const shuffleDeck = () => {
    setPhase('embaralhando');
    setChosen([]);
    setFocus(null);
    setRevealed(0);
    setLotus(false);
    setDeck(shuffle(cards));
    timers.current.push(window.setTimeout(() => setPhase('escolha'), Math.max(200, 1800 * m.factor)));
  };

  const pick = () => {
    const card = deck.find((c) => c.id === focus);
    if (!card || chosen.length >= 3) return;
    setChosen((c) => [...c, card]);
    setFocus(null);
  };

  const reveal = () => {
    setPhase('revelacao');
    mark('oraculo');
    [1, 2, 3, 4].forEach((n, i) =>
      timers.current.push(window.setTimeout(() => setRevealed(n), (300 + i * 1400) * m.factor)),
    );
  };

  const restart = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPhase('inicio');
    setChosen([]);
    setFocus(null);
    setRevealed(0);
    setLotus(false);
  };

  const remaining = useMemo(() => deck.filter((c) => !chosen.some((x) => x.id === c.id)), [deck, chosen]);

  return (
    <div className="oracle" data-phase={phase}>
      <header className="oracle__head">
        <svg viewBox="0 0 60 30" className="oracle__lotus" aria-hidden="true">
          <path d="M30 26c-3-6-3-14 0-20 3 6 3 14 0 20ZM30 26c-7-3-11-9-11-16 7 2 10 8 11 16ZM30 26c7-3 11-9 11-16-7 2-10 8-11 16ZM30 26c-11 0-17-4-20-10 8-1 15 3 20 10ZM30 26c11 0 17-4 20-10-8-1-15 3-20 10Z" />
        </svg>
        <h1 className="oracle__title">Uma leitura simbólica</h1>
        <p className="oracle__desc">Escolha três cartas e veja a interpretação criada para esta experiência.</p>
      </header>

      {/* Posições da leitura */}
      <ol className="oracle__slots" aria-label="Posições da leitura">
        {positions.map((label, i) => {
          const card = chosen[i];
          const open = phase === 'revelacao' && revealed > i;
          return (
            <li key={label} className="oracle__slot" data-filled={Boolean(card)}>
              <span className="oracle__slot-label">{label}</span>
              <div className="ocard ocard--slot" data-open={open}>
                {card ? (
                  <div className="ocard__inner">
                    <div className="ocard__side ocard__side--back">
                      <CardBack />
                    </div>
                    <div className="ocard__side ocard__side--front">
                      <CardFace number={card.number} name={card.name} art={card.art} />
                    </div>
                  </div>
                ) : (
                  <span className="ocard__empty" aria-hidden="true" />
                )}
              </div>
              <AnimatePresence>
                {open && card && (
                  <motion.div
                    className="oracle__reading"
                    initial={{ opacity: 0, y: m.reduced ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={m.t(0.8, { delay: 0.5 * m.factor })}
                  >
                    <span className="oracle__keyword">{card.keyword}</span>
                    <p>{card.readings[i]}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>

      {/* Baralho */}
      {phase !== 'revelacao' && (
        <section className="oracle__table" aria-label="Baralho">
          {phase === 'inicio' && (
            <div className="oracle__stack">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="ocard ocard--stack"
                  style={{ transform: `translate(${i * 1.5}px, ${-i * 1.5}px)` }}
                >
                  <CardBack />
                </div>
              ))}
            </div>
          )}

          {phase === 'embaralhando' && (
            <div className="oracle__stack oracle__stack--shuffle" aria-live="polite">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="ocard ocard--stack"
                  animate={
                    m.reduced
                      ? {}
                      : {
                          x: [0, i % 2 ? 70 : -70, 0, i % 2 ? -40 : 40, 0],
                          rotate: [0, i % 2 ? 8 : -8, 0, i % 2 ? -4 : 4, 0],
                        }
                  }
                  transition={{ duration: 1.6, ease: 'easeInOut', delay: i * 0.04 }}
                >
                  <CardBack />
                </motion.div>
              ))}
              <span className="visually-hidden">Embaralhando</span>
            </div>
          )}

          {phase === 'escolha' && (
            <div className="oracle__spread" role="listbox" aria-label="Cartas viradas para baixo">
              {remaining.map((c, i) => (
                <motion.button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={focus === c.id}
                  aria-label={`Carta ${i + 1}`}
                  className="ocard ocard--pick"
                  data-focus={focus === c.id}
                  disabled={chosen.length >= 3}
                  onClick={() => setFocus(focus === c.id ? null : c.id)}
                  initial={{ opacity: 0, y: m.reduced ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={m.t(0.5, { delay: i * 0.04 * m.factor })}
                  style={{ ['--r' as string]: `${(i - (remaining.length - 1) / 2) * 1.6}deg` }}
                >
                  <CardBack />
                </motion.button>
              ))}
              {/* a carta especial fica escondida sob o baralho */}
              <div className="ocard ocard--hidden" aria-hidden="true">
                <CardBack />
              </div>
            </div>
          )}

          <div className="oracle__actions">
            {phase === 'inicio' && (
              <button type="button" className="oracle__btn oracle__btn--main" onClick={shuffleDeck}>
                Embaralhar
              </button>
            )}
            {phase === 'escolha' && chosen.length < 3 && (
              <>
                <p className="oracle__hint" aria-live="polite">
                  {focus
                    ? `Carta para: ${positions[chosen.length].toLowerCase()}.`
                    : `Toque numa carta. Faltam ${3 - chosen.length}.`}
                </p>
                <button type="button" className="oracle__btn oracle__btn--main" onClick={pick} disabled={!focus}>
                  Escolher esta carta
                </button>
              </>
            )}
            {phase === 'escolha' && chosen.length === 3 && (
              <button type="button" className="oracle__btn oracle__btn--main" onClick={reveal}>
                Revelar leitura
              </button>
            )}
          </div>
        </section>
      )}

      {/* Leitura final */}
      <AnimatePresence>
        {phase === 'revelacao' && revealed >= 4 && (
          <motion.section
            className="oracle__final"
            initial={{ opacity: 0, y: m.reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={m.t(1.2)}
            aria-live="polite"
          >
            <span className="oracle__rule" aria-hidden="true" />
            <p className="oracle__final-text">{finalReading}</p>

            {!lotus ? (
              <button type="button" className="oracle__hidden-btn" onClick={() => setLotus(true)}>
                <span className="oracle__hidden-glow" aria-hidden="true" />
                Uma carta ficou de fora. Ver a carta escondida
              </button>
            ) : (
              <motion.div
                className="oracle__lotus-card"
                initial={{ opacity: 0, scale: m.reduced ? 1 : 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={m.t(0.9)}
              >
                <div className="ocard ocard--lotus">
                  <CardFace number="∞" name="O Lótus" art={lotusArt} />
                </div>
                <p>{content.oracle.hiddenCard}</p>
              </motion.div>
            )}

            <p className="oracle__closing">{closingNote}</p>
            <button type="button" className="oracle__btn" onClick={restart}>
              Refazer leitura
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
