import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  closing,
  emptyJourney,
  endingById,
  endings,
  items,
  MAX_ITEMS,
  placeById,
  places,
  times,
  type Journey,
  type TimeId,
} from './paths';
import { usePersistentState } from '../../lib/usePersistentState';
import { useMotion } from '../../context/SettingsContext';
import { sfx } from '../../lib/sound';
import { PageHeader } from '../../components/PageHeader';
import { Range } from '../../components/Range';
import { Icon } from '../../components/Icon';
import './paths.css';

type Step = 'bolsa' | 'hora' | 'mapa' | 'lugar' | 'fim';

function stepOf(j: Journey, chosenItems: boolean): Step {
  if (j.ending) return 'fim';
  if (j.place) return 'lugar';
  if (j.time) return 'mapa';
  if (chosenItems) return 'hora';
  return 'bolsa';
}

interface Saved {
  journey: Journey;
  packed: boolean;
}

export default function PathsPage() {
  const m = useMotion();
  const [saved, setSaved] = usePersistentState<Saved>('caminho:journey', { journey: emptyJourney, packed: false });
  const [found, setFound] = usePersistentState<string[]>('caminho:found', []);
  const [timeDraft, setTimeDraft] = useState(2);
  const j = saved.journey;
  const step = stepOf(j, saved.packed);

  const update = (patch: Partial<Journey>, packed = saved.packed) => setSaved({ journey: { ...j, ...patch }, packed });

  const goBackTo = (target: Step) => {
    sfx.soft();
    if (target === 'bolsa') setSaved({ journey: { ...emptyJourney, items: j.items }, packed: false });
    if (target === 'hora') setSaved({ journey: { ...j, time: null, place: null, ending: null }, packed: true });
    if (target === 'mapa') update({ place: null, ending: null });
    if (target === 'lugar') update({ ending: null });
  };

  const finish = (endingId: string) => {
    sfx.reveal();
    update({ ending: endingId });
    if (!found.includes(endingId)) setFound([...found, endingId]);
  };

  const restart = () => {
    sfx.soft();
    setSaved({ journey: emptyJourney, packed: false });
  };

  const crumbs: { step: Step; label: string; value: string }[] = [
    {
      step: 'bolsa',
      label: 'A bolsa',
      value: saved.packed
        ? j.items.length
          ? j.items.map((id) => items.find((i) => i.id === id)?.label.toLowerCase()).join(', ')
          : 'nada'
        : '…',
    },
    { step: 'hora', label: 'A hora', value: j.time ? times.find((t) => t.id === j.time)!.label.toLowerCase() : '…' },
    { step: 'mapa', label: 'O lugar', value: j.place ? placeById[j.place].name.toLowerCase() : '…' },
    { step: 'lugar', label: 'O momento', value: j.ending ? endingById[j.ending].title.toLowerCase() : '…' },
  ];
  const order: Step[] = ['bolsa', 'hora', 'mapa', 'lugar', 'fim'];
  const stepIndex = order.indexOf(step);

  return (
    <div className="page paths">
      <PageHeader
        eyebrow="Encontre seu próprio caminho"
        title="Um dia imaginário, escolhido por partes."
        description="Cada etapa muda a seguinte. Não há respostas certas, nem pontuação — só lugares e momentos. Volte a qualquer etapa para experimentar outra possibilidade."
      />

      <nav className="paths__crumbs" aria-label="Etapas do caminho">
        {crumbs.map((c, i) => {
          const reachable = i < stepIndex;
          return (
            <button
              key={c.step}
              type="button"
              className="paths__crumb"
              data-current={order[stepIndex] === c.step || (step === 'fim' && c.step === 'lugar')}
              data-done={reachable}
              disabled={!reachable}
              onClick={() => goBackTo(c.step)}
              aria-label={reachable ? `Voltar à etapa ${c.label} (${c.value})` : `${c.label}: ${c.value}`}
            >
              <span className="eyebrow">{c.label}</span>
              <span className="paths__crumb-value">{c.value}</span>
            </button>
          );
        })}
      </nav>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={step + (j.place ?? '')}
          className="paths__stage"
          initial={{ opacity: 0, x: m.reduced ? 0 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: m.reduced ? 0 : -24 }}
          transition={m.t(0.4)}
        >
          {step === 'bolsa' && (
            <Stage
              title="Antes de sair, o que vai na bolsa?"
              hint={`Escolha até ${MAX_ITEMS} objetos. Eles abrem — ou fecham — caminhos mais adiante.`}
            >
              <div className="bag">
                <div className="bag__items" role="group" aria-label="Objetos">
                  {items.map((it) => {
                    const chosen = j.items.includes(it.id);
                    const full = j.items.length >= MAX_ITEMS && !chosen;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        className="bag__item"
                        aria-pressed={chosen}
                        disabled={full}
                        onClick={() => {
                          sfx.tick();
                          update({ items: chosen ? j.items.filter((x) => x !== it.id) : [...j.items, it.id] });
                        }}
                      >
                        <ItemGlyph id={it.id} />
                        <span>{it.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="bag__visual" aria-hidden="true">
                  <svg viewBox="0 0 160 140">
                    <path d="M30 50h100l-8 80H38Z" className="pth-line" />
                    <path d="M58 50c0-22 44-22 44 0" className="pth-line" />
                    {j.items.map((id, i) => (
                      <g
                        key={id}
                        transform={`translate(${52 + i * 26} ${58 - (i % 2) * 6}) scale(0.9)`}
                        className="bag__in"
                      >
                        <ItemGlyphPaths id={id} />
                      </g>
                    ))}
                  </svg>
                  <p className="meta">
                    {j.items.length}/{MAX_ITEMS}
                  </p>
                </div>
              </div>
              <div className="row-actions">
                <button type="button" className="btn btn--solid" onClick={() => (sfx.select(), update({}, true))}>
                  {j.items.length ? 'Sair de casa' : 'Sair de mãos livres'} <Icon name="arrow-right" size={16} />
                </button>
              </div>
            </Stage>
          )}

          {step === 'hora' && (
            <Stage title="A que horas?" hint="A hora decide o que estará aberto, a luz e o tempo lá fora.">
              <div className="clockface" style={{ ['--sky' as string]: times[timeDraft].sky }}>
                <svg viewBox="0 0 320 140" className="clockface__sky" aria-hidden="true">
                  <rect width="320" height="140" className="clockface__bg" />
                  <circle
                    cx={40 + timeDraft * 80}
                    cy={timeDraft === 3 ? 34 : 100 - Math.sin(((timeDraft + 0.5) / 4) * Math.PI) * 70}
                    r={timeDraft === 3 ? 10 : 14}
                    className={timeDraft === 3 ? 'clockface__moon' : 'clockface__sun'}
                  />
                  {timeDraft === 1 &&
                    Array.from({ length: 14 }, (_, i) => (
                      <path key={i} d={`M${14 + i * 22} ${20 + (i % 3) * 18}l-4 12`} className="clockface__rain" />
                    ))}
                  <path
                    d="M0 112h40v-22h26v22h18v-36h30v36h24v-16h28v16h40v-28h22v28h30v-12h62"
                    className="pth-line clockface__city"
                  />
                </svg>
                <div className="clockface__control">
                  <Range
                    label="Hora de sair"
                    min={0}
                    max={3}
                    step={1}
                    value={timeDraft}
                    onValue={(v) => {
                      setTimeDraft(v);
                      sfx.tick();
                    }}
                    aria-valuetext={`${times[timeDraft].label}, ${times[timeDraft].clock}`}
                  />
                  <div className="clockface__labels">
                    {times.map((t, i) => (
                      <button key={t.id} type="button" data-active={i === timeDraft} onClick={() => setTimeDraft(i)}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="clockface__note meta">
                  {timeDraft === 1
                    ? 'À tarde, uma chuva passageira está prevista.'
                    : timeDraft === 3
                      ? 'À noite, venta perto do rio.'
                      : timeDraft === 0
                        ? 'De manhã, há névoa nas partes altas da cidade.'
                        : 'No fim da tarde, a luz muda a cada minuto.'}
                </p>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn--solid"
                  onClick={() => {
                    sfx.select();
                    update({ time: times[timeDraft].id as TimeId });
                  }}
                >
                  Sair às {times[timeDraft].clock} <Icon name="arrow-right" size={16} />
                </button>
              </div>
            </Stage>
          )}

          {step === 'mapa' && (
            <Stage
              title="Para onde?"
              hint="Alguns lugares dependem da hora e do que você trouxe. Os indisponíveis dizem por quê."
            >
              <div className="minimap">
                <svg viewBox="0 0 100 100" className="minimap__svg" role="group" aria-label="Mapa da cidade">
                  <path d="M0 88c20-6 34 2 52-4s30-8 48-2" className="pth-line minimap__river" />
                  <path d="M10 10v80M40 0v100M70 10v80M0 40h100M0 70h100" className="minimap__street" />
                  <circle cx="45" cy="55" r="1.6" className="minimap__home" />
                  <text x="47" y="58" className="minimap__home-label">
                    casa
                  </text>
                  {places.map((p) => {
                    const ok = p.check(j) === true;
                    return (
                      <g
                        key={p.id}
                        className="minimap__place"
                        data-ok={ok}
                        role="button"
                        tabIndex={ok ? 0 : -1}
                        aria-disabled={!ok}
                        aria-label={`${p.name}${ok ? '' : ` — ${p.check(j)}`}`}
                        onClick={() => ok && (sfx.select(), update({ place: p.id }))}
                        onKeyDown={(e) => {
                          if (ok && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            sfx.select();
                            update({ place: p.id });
                          }
                        }}
                      >
                        <path d={`M45 55L${p.x} ${p.y}`} className="minimap__route" />
                        <circle cx={p.x} cy={p.y} r="7" className="minimap__hit" />
                        <circle cx={p.x} cy={p.y} r="2.4" className="minimap__dot" />
                      </g>
                    );
                  })}
                </svg>
                <ul className="minimap__list">
                  {places.map((p) => {
                    const check = p.check(j);
                    const ok = check === true;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="minimap__option"
                          disabled={!ok}
                          onClick={() => (sfx.select(), update({ place: p.id }))}
                        >
                          <span>{p.name}</span>
                          {ok ? <Icon name="arrow-right" size={14} /> : <span className="minimap__why">{check}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Stage>
          )}

          {step === 'lugar' && j.place && (
            <Stage title={placeById[j.place].name} hint={placeById[j.place].intro(j)}>
              <PlaceInteraction journey={j} onFinish={finish} />
            </Stage>
          )}

          {step === 'fim' && j.ending && (
            <div className="paths__end">
              <p className="eyebrow">Um lugar encontrado</p>
              <h2 className="paths__end-title">{endingById[j.ending].title}</h2>
              <p className="paths__end-text">{endingById[j.ending].text(j)}</p>
              <p className="meta">{closing(j)}</p>
              <div className="row-actions">
                <button type="button" className="btn btn--solid" onClick={() => goBackTo('lugar')}>
                  <Icon name="undo" size={14} /> Outra escolha neste lugar
                </button>
                <button type="button" className="btn" onClick={() => goBackTo('mapa')}>
                  Outro lugar
                </button>
                <button type="button" className="btn btn--ghost" onClick={restart}>
                  <Icon name="reset" size={14} /> Outro dia
                </button>
              </div>
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <section className="paths__notebook" aria-label="Caderno de lugares">
        <p className="eyebrow">
          Caderno de lugares{' '}
          <span className="num">
            · {found.length} de {endings.length}
          </span>
        </p>
        <ul>
          {places.map((p) => {
            const own = endings.filter((e) => e.place === p.id);
            const got = own.filter((e) => found.includes(e.id));
            return (
              <li key={p.id} data-found={got.length > 0}>
                <span className="paths__nb-dots" aria-hidden="true">
                  {own.map((e) => (
                    <span key={e.id} className="paths__nb-dot" data-on={found.includes(e.id)} />
                  ))}
                </span>
                <span>
                  <span className="paths__nb-place">{p.name}</span>
                  <span className="meta">
                    {got.length ? ` · ${got.map((e) => e.title.toLowerCase()).join(' · ')}` : ' · ainda por descobrir'}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stage({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="stage">
      <h2 className="stage__title">{title}</h2>
      <p className="stage__hint">{hint}</p>
      {children}
    </div>
  );
}

/* ---------------- Interações próprias de cada lugar ---------------- */
function PlaceInteraction({ journey: j, onFinish }: { journey: Journey; onFinish: (id: string) => void }) {
  const [light, setLight] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  switch (j.place) {
    case 'cafe':
      return (
        <div className="place place--cafe">
          <svg viewBox="0 0 300 180" className="place__svg" role="group" aria-label="Planta do café">
            <rect x="4" y="4" width="292" height="172" className="pth-line" />
            <path d="M4 40h120" className="pth-line pth-faint" />
            <text x="10" y="28" className="place__label">
              vitrine
            </text>
            {[
              { id: 'cafe-janela', label: 'Junto à janela', d: 'M30 60h60v40H30Z', tx: 60, ty: 120 },
              { id: 'cafe-balcao', label: 'No balcão', d: 'M170 30h110v26H170Z', tx: 225, ty: 76 },
              { id: 'cafe-canto', label: 'No canto do fundo', d: 'M220 120h56v44h-56Z', tx: 248, ty: 112 },
            ].map((seat) => (
              <g
                key={seat.id}
                className="place__seat"
                role="button"
                tabIndex={0}
                aria-label={seat.label}
                onClick={() => onFinish(seat.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onFinish(seat.id))}
              >
                <path d={seat.d} className="place__seat-shape" />
                <text x={seat.tx} y={seat.ty} textAnchor="middle" className="place__label">
                  {seat.label.toLowerCase()}
                </text>
              </g>
            ))}
            <circle cx="120" cy="130" r="12" className="pth-line pth-faint" />
            <circle cx="160" cy="110" r="12" className="pth-line pth-faint" />
          </svg>
          <p className="meta">Toque num lugar para sentar.</p>
        </div>
      );
    case 'biblioteca':
      return (
        <div className="place">
          <svg viewBox="0 0 300 170" className="place__svg" role="group" aria-label="Estante">
            <path d="M20 150h260M20 20h260" className="pth-line" />
            {[
              { id: 'biblioteca-poemas', label: 'Poemas', x: 70, w: 26, h: 110 },
              { id: 'biblioteca-atlas', label: 'Atlas', x: 130, w: 44, h: 96 },
              { id: 'biblioteca-anonimo', label: '—', x: 200, w: 22, h: 120 },
            ].map((b) => (
              <g
                key={b.id}
                className="place__seat"
                role="button"
                tabIndex={0}
                aria-label={b.label === '—' ? 'Um livro sem título' : `Livro: ${b.label}`}
                onClick={() => onFinish(b.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onFinish(b.id))}
              >
                <rect x={b.x} y={150 - b.h} width={b.w} height={b.h} className="place__seat-shape" />
                <text
                  x={b.x + b.w / 2}
                  y={150 - b.h / 2}
                  className="place__label place__label--spine"
                  transform={`rotate(-90 ${b.x + b.w / 2} ${150 - b.h / 2})`}
                  textAnchor="middle"
                >
                  {b.label}
                </text>
              </g>
            ))}
            {[40, 52, 100, 112, 180, 236, 250].map((x, i) => (
              <rect
                key={x}
                x={x}
                y={150 - (70 + (i % 3) * 14)}
                width="10"
                height={70 + (i % 3) * 14}
                className="pth-line pth-faint"
              />
            ))}
          </svg>
          <p className="meta">Toque numa lombada.</p>
        </div>
      );
    case 'feira':
      return (
        <div className="place">
          <div className="flowers" role="group" aria-label="Escolher">
            {[
              { id: 'flores', label: 'Um maço de flores', end: 'feira-flores' },
              { id: 'galho', label: 'O galho seco', end: 'feira-galho' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className="flower"
                aria-pressed={picked === f.id}
                onClick={() => (sfx.tick(), setPicked(f.id))}
              >
                <svg viewBox="0 0 60 80" aria-hidden="true">
                  {f.id === 'flores' ? (
                    <>
                      <path d="M30 78V40M30 60l-10-8M30 52l10-8" className="pth-line" />
                      {[0, 72, 144, 216, 288].map((a) => (
                        <ellipse
                          key={a}
                          cx="30"
                          cy="26"
                          rx="5"
                          ry="11"
                          transform={`rotate(${a} 30 34)`}
                          className="pth-line"
                        />
                      ))}
                      <circle cx="30" cy="34" r="3" className="pth-dot" />
                    </>
                  ) : (
                    <path d="M30 78V30M30 50l-12-14M30 40l10-16M18 36l-6-4M40 24l6-8" className="pth-line" />
                  )}
                </svg>
                <span>{f.label}</span>
              </button>
            ))}
          </div>
          <div className="row-actions">
            <button
              type="button"
              className="btn btn--solid"
              disabled={!picked}
              onClick={() => picked && onFinish(picked === 'flores' ? 'feira-flores' : 'feira-galho')}
            >
              Levar
            </button>
          </div>
        </div>
      );
    case 'mirante': {
      const canPhoto = j.items.includes('camera');
      return (
        <div className="place">
          <div className="mirante" style={{ ['--light' as string]: light / 100 }}>
            <svg viewBox="0 0 300 140" className="place__svg" aria-hidden="true">
              <rect width="300" height="140" className="mirante__sky" />
              <circle cx={220 - light * 0.6} cy={40 + light * 0.9} r="13" className="mirante__sun" />
              <path
                d="M0 120h30v-26h20v26h16v-40h24v40h18v-18h26v18h30v-34h22v34h20v-14h24v14h50"
                className="pth-line"
              />
              {light > 60 &&
                [36, 74, 98, 144, 182, 230].map((x, i) => (
                  <circle key={x} cx={x} cy={108 - (i % 2) * 10} r="1.2" className="mirante__window" />
                ))}
            </svg>
          </div>
          <Range label="Esperar a luz mudar" value={light} min={0} max={100} step={1} onValue={setLight} />
          <p className="meta">Arraste para deixar o tempo passar.</p>
          <div className="row-actions">
            <button
              type="button"
              className="btn btn--solid"
              disabled={light < 90}
              onClick={() => onFinish('mirante-luz')}
            >
              {light < 90 ? 'Esperar até a última luz…' : 'Ficar até a última luz'}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!canPhoto}
              onClick={() => onFinish('mirante-foto')}
              title={canPhoto ? undefined : 'Sem câmera na bolsa'}
            >
              <Icon name="star" size={14} /> {canPhoto ? 'Fotografar agora' : 'Fotografar (sem câmera na bolsa)'}
            </button>
          </div>
        </div>
      );
    }
    case 'rio': {
      const bike = j.items.includes('bicicleta');
      return (
        <div className="place">
          <svg viewBox="0 0 300 100" className="place__svg" aria-hidden="true">
            <path d="M0 50c40-12 80 12 150 0s110-12 150 0" className="pth-line" />
            <path d="M0 62c40-12 80 12 150 0s110-12 150 0" className="pth-line pth-faint rio__flow" />
            <circle cx="150" cy="40" r="3" className="pth-dot" />
          </svg>
          <div className="row-actions place__split">
            <button type="button" className="btn" onClick={() => onFinish('rio-acima')}>
              <Icon name="arrow-left" size={16} /> {bike ? 'Pedalar rio acima' : 'Caminhar rio acima'}
            </button>
            <button type="button" className="btn" onClick={() => onFinish('rio-abaixo')}>
              {bike ? 'Pedalar rio abaixo' : 'Caminhar rio abaixo'} <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      );
    }
    case 'cinema':
      return (
        <div className="place">
          <div className="cinema" role="group" aria-label="Poltronas">
            <div className="cinema__screen" aria-hidden="true">
              tela
            </div>
            {Array.from({ length: 6 }, (_, row) => (
              <div key={row} className="cinema__row">
                {Array.from({ length: 8 }, (_, seat) => (
                  <button
                    key={seat}
                    type="button"
                    className="cinema__seat"
                    aria-label={`Fileira ${row + 1}, poltrona ${seat + 1}`}
                    onClick={() => onFinish(row < 3 ? 'cinema-frente' : 'cinema-fundo')}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="meta">Toque numa poltrona.</p>
        </div>
      );
    default:
      return null;
  }
}

function ItemGlyph({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" className="item-glyph" aria-hidden="true">
      <ItemGlyphPaths id={id} />
    </svg>
  );
}

function ItemGlyphPaths({ id }: { id: string }) {
  switch (id) {
    case 'guarda-chuva':
      return <path d="M3 12a9 9 0 0 1 18 0ZM12 12v7a2 2 0 0 1-4 0" className="pth-line" />;
    case 'camera':
      return (
        <>
          <rect x="3" y="7" width="18" height="12" className="pth-line" />
          <circle cx="12" cy="13" r="3.5" className="pth-line" />
          <path d="M8 7l1.5-2.5h5L16 7" className="pth-line" />
        </>
      );
    case 'caderno':
      return <path d="M6 3h12v18H6ZM9 3v18M11 8h5M11 11h5" className="pth-line" />;
    case 'livro':
      return <path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zv14" className="pth-line" />;
    case 'bicicleta':
      return (
        <>
          <circle cx="8" cy="10" r="4" className="pth-line" />
          <path d="M11 12l9 0v3M17 12v3" className="pth-line" />
        </>
      );
    case 'agua':
      return <path d="M10 3h4v3l2 2v13H8V8l2-2ZM8 12h8" className="pth-line" />;
    case 'cachecol':
      return <path d="M5 6c4 3 10 3 14 0M7 7v12M7 19h3M10 8v9" className="pth-line" />;
    case 'fones':
      return <path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4ZM17 15h3v5h-3Z" className="pth-line" />;
    default:
      return <circle cx="12" cy="12" r="6" className="pth-line" />;
  }
}
