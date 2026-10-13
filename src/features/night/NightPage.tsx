import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  actionsFor,
  clock,
  describeObject,
  END_AT,
  initialNight,
  nightTitle,
  objectNames,
  starVisible,
  type NightState,
  type ObjectId,
} from './night';
import { usePersistentState } from '../../lib/usePersistentState';
import { useMotion, useSettings } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { sfx, startDrone, startRain, stopAmbience } from '../../lib/sound';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import './night.css';

function isNight(v: unknown): v is NightState {
  const s = v as NightState;
  return typeof s === 'object' && s !== null && typeof s.minutes === 'number' && Array.isArray(s.log);
}

const OBJECTS: ObjectId[] = ['janela', 'abajur', 'vitrola', 'cozinha', 'poltrona', 'mesa', 'planta', 'relogio'];

export default function NightPage() {
  const m = useMotion();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { revealSecret, secretFound } = useProgress();
  const [night, setNight] = usePersistentState<NightState>('noite:state', initialNight, isNight);
  const [focus, setFocus] = useState<ObjectId | null>(null);
  const [leaving, setLeaving] = useState(false);
  const logRef = useRef<HTMLOListElement>(null);

  const star = starVisible(night);
  const hourAngle = ((20 * 60 + night.minutes) / 720) * 360;
  const minuteAngle = (night.minutes % 60) * 6;
  const progress = Math.min(1, night.minutes / END_AT);

  /* ---------- ambiência sonora (só com efeitos ativados) ---------- */
  useEffect(() => {
    if (!settings.sound) return;
    if (night.rain) startRain();
    else stopAmbience('rain');
  }, [night.rain, settings.sound]);
  useEffect(() => {
    if (!settings.sound) return;
    stopAmbience('drone');
    if (night.music !== 'nenhum') {
      const id = window.setTimeout(() => startDrone(night.music as 'piano' | 'baixo' | 'aberto'), 900);
      return () => window.clearTimeout(id);
    }
  }, [night.music, settings.sound]);
  useEffect(
    () => () => {
      stopAmbience('rain');
      stopAmbience('drone');
    },
    [],
  );

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [night.log.length]);

  const run = (actionId: string) => {
    if (!focus) return;
    const action = actionsFor(focus, night).find((a) => a.id === actionId);
    if (!action || action.disabledReason) return;
    sfx.select();
    setNight(action.run(night));
  };

  const reset = () => {
    setNight(initialNight());
    setFocus(null);
    sfx.soft();
  };

  const findStar = () => {
    if (!star) return;
    sfx.reveal();
    revealSecret();
    setLeaving(true);
    window.setTimeout(() => navigate('/observatorio'), Math.max(200, 1400 * m.factor));
  };

  const obj = (id: ObjectId, children: ReactNode, extra?: string) => (
    <g
      className={`room__obj${focus === id ? ' is-focus' : ''}${extra ? ' ' + extra : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${objectNames[id]}: ${describeObject(id, night)}`}
      aria-pressed={focus === id}
      onClick={() => {
        setFocus(id);
        sfx.tick();
      }}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFocus(id);
          sfx.tick();
        }
      }}
    >
      {children}
    </g>
  );

  const actions = focus ? actionsFor(focus, night) : [];
  const moonX = 650 - progress * 150;
  const moonY = 120 - Math.sin(progress * Math.PI) * 40;

  return (
    <div className="page page--wide night">
      <PageHeader
        eyebrow="Uma noite, vários caminhos"
        title="Uma noite fictícia, num cômodo qualquer."
        description="Toque nos objetos para ver o que é possível fazer. Cada gesto muda o cômodo — e muda o que pode acontecer depois."
        actions={
          <button type="button" className="btn btn--small" onClick={reset}>
            <Icon name="reset" size={14} /> Recomeçar a noite
          </button>
        }
      />

      <div className="night__grid">
        <div className="night__stage">
          <div
            className="room"
            data-lamp={night.lamp}
            data-rain={night.rain}
            data-window={night.windowOpen ? 'aberta' : 'fechada'}
            data-music={night.music}
            data-tea={night.tea}
            data-leaving={leaving}
            style={{ ['--night' as string]: progress }}
          >
            <svg viewBox="0 0 800 480" className="room__svg" role="group" aria-label="O cômodo">
              <defs>
                <radialGradient id="lamp-glow">
                  <stop offset="0%" stopColor="var(--glow)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="var(--glow)" stopOpacity="0" />
                </radialGradient>
                <clipPath id="win-clip">
                  <rect x="472" y="62" width="196" height="216" />
                </clipPath>
              </defs>

              {/* parede e chão */}
              <rect x="0" y="0" width="800" height="480" className="room__wall" />
              <path d="M0 404h800" className="room__line" />

              {/* janela */}
              {obj(
                'janela',
                <>
                  <rect x="472" y="62" width="196" height="216" className="room__sky" />
                  <g clipPath="url(#win-clip)">
                    {[
                      [500, 90],
                      [540, 140],
                      [612, 98],
                      [588, 190],
                      [520, 230],
                      [650, 240],
                      [560, 80],
                    ].map(([x, y], i) => (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={1.3}
                        className="room__star"
                        style={{ animationDelay: `${-i * 0.7}s` }}
                      />
                    ))}
                    <circle cx={moonX} cy={moonY} r={14} className="room__moon" />
                    <g className="room__rain">
                      {Array.from({ length: 26 }, (_, i) => (
                        <path
                          key={i}
                          d={`M${476 + ((i * 41) % 192)} ${40 + ((i * 67) % 180)}l-5 18`}
                          className="room__drop"
                          style={{ animationDelay: `${-(i * 0.17) % 1.1}s` }}
                        />
                      ))}
                      <path d="M490 92c10-14 32-14 40 0M560 76c12-14 36-14 46 2" className="room__cloud" />
                    </g>
                  </g>
                  <rect x="472" y="62" width="196" height="216" className="room__frame" />
                  <path d="M570 62v216M472 170h196" className="room__frame room__frame--thin" />
                  <path d="M462 52c6 70 4 150 -2 240M678 52c-6 70 -4 150 2 240" className="room__curtain" />
                  <path d="M462 292h216" className="room__line" />
                </>,
              )}
              {star && (
                <g
                  className="room__secret"
                  role="button"
                  tabIndex={0}
                  aria-label="Uma estrela diferente das outras"
                  onClick={findStar}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      findStar();
                    }
                  }}
                >
                  <circle cx="630" cy="150" r="22" className="room__hit" />
                  <circle cx="630" cy="150" r="3" className="room__secret-star" />
                  <path d="M630 140v20M620 150h20" className="room__secret-rays" />
                </g>
              )}

              {/* relógio */}
              {obj(
                'relogio',
                <>
                  <circle cx="330" cy="110" r="30" className="room__hit" />
                  <circle cx="330" cy="110" r="24" className="room__line room__fill" />
                  <path
                    d={`M330 110l0 -12`}
                    className="room__line"
                    style={{ transform: `rotate(${hourAngle}deg)`, transformOrigin: '330px 110px' }}
                  />
                  <path
                    d={`M330 110l0 -18`}
                    className="room__line room__line--thin"
                    style={{ transform: `rotate(${minuteAngle}deg)`, transformOrigin: '330px 110px' }}
                  />
                  <circle cx="330" cy="110" r="1.5" className="room__dot" />
                </>,
              )}

              {/* abajur */}
              {obj(
                'abajur',
                <>
                  <circle cx="130" cy="200" r="130" className="room__glow" fill="url(#lamp-glow)" />
                  <rect x="90" y="150" width="80" height="260" className="room__hit" />
                  <path d="M104 196h52l-12-40h-28Z" className="room__line room__fill" />
                  <path d="M130 196v206M110 404h40" className="room__line" />
                </>,
              )}

              {/* poltrona e livro */}
              {obj(
                'poltrona',
                <>
                  <rect x="170" y="290" width="150" height="120" className="room__hit" />
                  <path d="M186 404v-70a14 14 0 0 1 14-14h96a14 14 0 0 1 14 14v70" className="room__line room__fill" />
                  <path d="M176 404v-46h20v46M300 404v-46h20v46M196 372h104" className="room__line" />
                  {night.reading ? (
                    <path d="M218 354l22-6 22 6M240 348v8M218 354v4l22-4 22 4v-4" className="room__line" />
                  ) : (
                    <rect x="230" y="348" width="26" height="7" className="room__line room__fill" />
                  )}
                </>,
              )}

              {/* mesa */}
              {obj(
                'mesa',
                <>
                  <rect x="340" y="300" width="130" height="110" className="room__hit" />
                  <path d="M346 340h120M356 340v64M456 340v64" className="room__line" />
                  <path d="M336 404v-44h10v-26M476 404v-44h-10v-26" className="room__line room__line--thin" />
                  {night.tea === 'servido' && (
                    <g className="room__appear">
                      <path d="M372 338v-12h14v12M386 330h4a3 3 0 0 1 0 6h-4" className="room__line room__fill" />
                      <path d="M424 338v-12h14v12M438 330h4a3 3 0 0 1 0 6h-4" className="room__line room__fill" />
                      <path d="M376 320c-3-5 3-8 0-13M430 320c-3-5 3-8 0-13" className="room__steam" />
                    </g>
                  )}
                  {night.food && (
                    <g className="room__appear">
                      <ellipse cx="406" cy="336" rx="14" ry="3" className="room__line room__fill" />
                      <path d="M398 333c2-5 12-5 14 0" className="room__line" />
                    </g>
                  )}
                </>,
              )}

              {/* planta */}
              {obj(
                'planta',
                <>
                  <rect x="486" y="300" width="50" height="110" className="room__hit" />
                  <path d="M498 404l4-26h20l4 26Z" className="room__line room__fill" />
                  <g
                    className="room__leaves"
                    style={{ transform: `scale(${1 + night.plant * 0.12})`, transformOrigin: '512px 378px' }}
                  >
                    <path
                      d="M512 378c-2-16-12-24-20-30M512 378c2-18 10-28 18-34M512 378c0-14 0-26-2-36"
                      className="room__line"
                    />
                    {night.plant >= 2 && <path d="M512 370c6-6 14-8 20-8" className="room__line room__appear" />}
                  </g>
                </>,
              )}

              {/* vitrola */}
              {obj(
                'vitrola',
                <>
                  <rect x="560" y="300" width="110" height="110" className="room__hit" />
                  <path d="M566 404v-52h98v52M566 372h98" className="room__line room__fill" />
                  <ellipse cx="604" cy="352" rx="26" ry="5" className="room__line room__disc" />
                  <path d="M646 344l-20 8" className="room__line room__line--thin room__arm" />
                  <g className="room__waves">
                    <path
                      d="M640 326a14 14 0 0 1 0 -18M652 332a26 26 0 0 0 0 -30M664 338a38 38 0 0 0 0 -42"
                      className="room__line room__line--thin"
                    />
                  </g>
                </>,
              )}

              {/* cozinha */}
              {obj(
                'cozinha',
                <>
                  <rect x="684" y="250" width="116" height="160" className="room__hit" />
                  <path d="M690 404v-100h110" className="room__line" />
                  <path d="M690 336h110" className="room__line room__line--thin" />
                  <path
                    d="M718 304c0-16 10-22 22-22s22 6 22 22Z M740 282v-6M762 296l10-8"
                    className="room__line room__fill"
                  />
                  <g className="room__kettle-steam">
                    <path d="M772 282c-4-6 4-10 0-16M778 278c-4-6 4-10 0-16" className="room__steam" />
                  </g>
                </>,
              )}
            </svg>
            <div className="room__dim" aria-hidden="true" />
            <p className="room__clock num" aria-live="polite">
              {clock(night.minutes)}
            </p>
          </div>

          <div className="night__objects" role="group" aria-label="Objetos do cômodo">
            {OBJECTS.map((id) => (
              <button key={id} type="button" className="chip" aria-pressed={focus === id} onClick={() => setFocus(id)}>
                {objectNames[id].replace(/^(A|O) /, '')}
              </button>
            ))}
          </div>
        </div>

        <aside className="night__panel">
          <AnimatePresence mode="wait" initial={false}>
            {night.ended ? (
              <motion.section
                key="fim"
                className="night__end card"
                initial={{ opacity: 0, y: m.reduced ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={m.t(0.6)}
              >
                <p className="eyebrow">A noite termina</p>
                <h2 className="night__end-title">{nightTitle(night)}.</h2>
                <p className="meta">
                  {night.log.length - 1} momentos, das 20h00 às {clock(night.minutes)}. Outra noite pode ser bem
                  diferente.
                </p>
                <button type="button" className="btn btn--solid" onClick={reset}>
                  <Icon name="reset" size={14} /> Recomeçar a noite
                </button>
              </motion.section>
            ) : focus ? (
              <motion.section
                key={focus}
                className="night__focus card"
                initial={{ opacity: 0, y: m.reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={m.t(0.3)}
                aria-label={objectNames[focus]}
              >
                <p className="eyebrow">{objectNames[focus]}</p>
                <p className="night__desc">{describeObject(focus, night)}</p>
                <div className="night__actions">
                  {actions.length === 0 && <p className="meta">Nada a fazer aqui, por enquanto.</p>}
                  {actions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="night__action"
                      onClick={() => run(a.id)}
                      disabled={Boolean(a.disabledReason)}
                    >
                      <span>{a.label}</span>
                      {a.disabledReason && <span className="night__reason">{a.disabledReason}</span>}
                    </button>
                  ))}
                </div>
              </motion.section>
            ) : (
              <motion.section
                key="vazio"
                className="night__focus card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={m.t(0.3)}
              >
                <p className="eyebrow">Por onde começar</p>
                <p className="night__desc">
                  Nenhum objeto escolhido. A janela, o abajur e a vitrola costumam ser bons começos.
                </p>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="night__log" aria-label="Registro da noite">
            <p className="eyebrow">Registro da noite</p>
            <ol ref={logRef}>
              {night.log.map((l, i) => (
                <li key={i}>
                  <span className="num meta">{clock(l.t)}</span>
                  <span>{l.text}</span>
                </li>
              ))}
            </ol>
          </section>
          {secretFound && (
            <p className="meta night__secret-note">
              <Icon name="star" size={12} /> Você já encontrou o que a janela guardava.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
