import { useMemo, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { decide, edges, initialLab, isReachable, nodeById, nodes, travel, type LabState } from './map';
import { usePersistentState } from '../../lib/usePersistentState';
import { useMotion } from '../../context/SettingsContext';
import { sfx } from '../../lib/sound';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import './labyrinth.css';

function isLab(v: unknown): v is LabState {
  const s = v as LabState;
  return (
    typeof s === 'object' &&
    s !== null &&
    typeof s.current === 'string' &&
    Array.isArray(s.visited) &&
    Boolean(nodeById[s.current])
  );
}

/** Estrelas de fundo: posições fixas, geradas por uma sequência simples. */
const dust = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 137.5) % 1000,
  y: (i * 89.3 + (i % 7) * 41) % 1000,
  r: 0.8 + ((i * 13) % 10) / 10,
}));

export default function LabyrinthPage() {
  const m = useMotion();
  const [lab, setLab] = usePersistentState<LabState>('lab:state', initialLab, isLab);
  const [confirmReset, setConfirmReset] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);

  const current = nodeById[lab.current];
  const decision = lab.decisions[current.id];
  const chosen = current.options?.find((o) => o.id === decision);

  const visibleNodes = nodes.filter((n) => lab.revealed.includes(n.id));
  const reachable = useMemo(() => new Set(nodes.filter((n) => isReachable(lab, n.id)).map((n) => n.id)), [lab]);
  const notTaken = lab.closed.filter((c) => !lab.visited.includes(c));
  const toDiscover = visibleNodes.filter((n) => reachable.has(n.id) && !lab.visited.includes(n.id));

  const go = (id: string) => {
    if (!reachable.has(id) || id === lab.current) return;
    sfx.tick();
    setLab((s) => travel(s, id));
  };

  const choose = (optionId: string) => {
    const option = current.options?.find((o) => o.id === optionId);
    if (!option) return;
    const before = lab.revealed;
    const next = decide(lab, current.id, option);
    if (next === lab) return;
    const newly = next.revealed.filter((r) => !before.includes(r));
    setFresh(newly);
    if (newly.length) sfx.reveal();
    else sfx.select();
    setLab(next);
  };

  const reset = () => {
    setLab(initialLab());
    setFresh([]);
    setConfirmReset(false);
    sfx.soft();
  };

  const onNodeKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      go(id);
    }
  };

  const edgeState = (a: string, b: string) => {
    if (lab.closed.includes(a) && !lab.visited.includes(a)) return 'closed';
    if (lab.closed.includes(b) && !lab.visited.includes(b)) return 'closed';
    const va = lab.visited.includes(a);
    const vb = lab.visited.includes(b);
    if (va && vb) return 'walked';
    if (va || vb) return 'open';
    return 'hidden';
  };

  return (
    <div className="page page--wide labyrinth" data-lit={lab.lit}>
      <PageHeader
        eyebrow="O labirinto de possibilidades"
        title="Para onde, a partir daqui?"
        description="Toque num ponto ligado ao seu caminho para ir até ele. Algumas escolhas abrem lugares novos; outras fecham caminhos — que continuam visíveis, como possibilidades que ficaram para outro dia."
        actions={
          <button type="button" className="btn btn--small" onClick={() => setConfirmReset(true)}>
            <Icon name="reset" size={14} /> Recomeçar o mapa
          </button>
        }
      />

      {confirmReset && (
        <div className="lab-confirm card" role="alertdialog" aria-label="Recomeçar o mapa">
          <p>Apagar o percurso e começar outra vez a partir da origem?</p>
          <div className="row-actions">
            <button type="button" className="btn btn--solid btn--small" onClick={reset} autoFocus>
              Recomeçar
            </button>
            <button type="button" className="btn btn--small" onClick={() => setConfirmReset(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="lab">
        <div className="lab__map card">
          <svg viewBox="0 0 1000 1000" className="lab__svg" role="group" aria-label="Mapa">
            <g className="lab__dust" aria-hidden="true">
              {dust.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={d.r} />
              ))}
            </g>

            {edges.map(([a, b]) => {
              if (!lab.revealed.includes(a) || !lab.revealed.includes(b)) return null;
              const state = edgeState(a, b);
              if (state === 'hidden') return null;
              const na = nodeById[a];
              const nb = nodeById[b];
              // pathLength (animação de traço) só nos caminhos percorridos: ela sobrescreve o tracejado.
              if (state === 'walked')
                return (
                  <motion.line
                    key={`${a}-${b}`}
                    x1={na.x}
                    y1={na.y}
                    x2={nb.x}
                    y2={nb.y}
                    className="lab__edge lab__edge--walked"
                    initial={{ pathLength: m.reduced ? 1 : 0 }}
                    animate={{ pathLength: 1 }}
                    transition={m.t(1.1)}
                  />
                );
              return (
                <line
                  key={`${a}-${b}-${state}`}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  className={`lab__edge lab__edge--${state}`}
                />
              );
            })}

            {lab.trail.length > 1 && (
              <polyline
                className="lab__trail"
                points={lab.trail.map((id) => `${nodeById[id].x},${nodeById[id].y}`).join(' ')}
                aria-hidden="true"
              />
            )}

            {visibleNodes.map((n) => {
              const visited = lab.visited.includes(n.id);
              const closed = lab.closed.includes(n.id) && !visited;
              const canGo = reachable.has(n.id);
              const isCurrent = n.id === lab.current;
              const isFresh = fresh.includes(n.id);
              const labelBelow = n.y < 900;
              return (
                <g
                  key={n.id}
                  className="lab__node"
                  data-visited={visited}
                  data-closed={closed}
                  data-reachable={canGo && !visited}
                  data-current={isCurrent}
                  role={canGo ? 'button' : 'img'}
                  tabIndex={canGo && !isCurrent ? 0 : -1}
                  aria-label={`${n.name}${isCurrent ? ' — você está aqui' : visited ? ' — já percorrido' : closed ? ' — caminho não tomado' : ' — ainda não percorrido'}`}
                  onClick={() => go(n.id)}
                  onKeyDown={(e) => onNodeKey(e, n.id)}
                >
                  <circle cx={n.x} cy={n.y} r={34} className="lab__hit" />
                  {isFresh && !m.reduced && <circle cx={n.x} cy={n.y} r={12} className="lab__ripple" />}
                  {canGo && !visited && <circle cx={n.x} cy={n.y} r={17} className="lab__halo" />}
                  <circle cx={n.x} cy={n.y} r={n.id === 'origem' ? 11 : 9} className="lab__dot" />
                  {closed && (
                    <path d={`M${n.x - 5} ${n.y - 5}l10 10M${n.x + 5} ${n.y - 5}l-10 10`} className="lab__x" />
                  )}
                  <text
                    x={n.x}
                    y={labelBelow ? n.y + 40 : n.y - 26}
                    textAnchor={n.x < 160 ? 'start' : n.x > 840 ? 'end' : 'middle'}
                    dx={n.x < 160 ? -14 : n.x > 840 ? 14 : 0}
                    className="lab__label"
                  >
                    {n.name}
                  </text>
                </g>
              );
            })}

            <motion.circle
              className="lab__me"
              r={20}
              initial={false}
              animate={{ cx: current.x, cy: current.y }}
              transition={m.t(0.9)}
              aria-hidden="true"
            />
          </svg>
          <div className="lab__legend meta" aria-hidden="true">
            <span>
              <i className="lg lg--walked" /> percorrido
            </span>
            <span>
              <i className="lg lg--open" /> possível
            </span>
            <span>
              <i className="lg lg--closed" /> não tomado
            </span>
          </div>
        </div>

        <aside className="lab__panel" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: m.reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={m.t(0.35)}
            >
              <p className="eyebrow">{current.id === 'origem' ? 'Ponto de partida' : 'Você está em'}</p>
              <h2 className="lab__place">{current.name}</h2>
              <p className="lab__text">{current.text(lab)}</p>

              {current.options && !chosen && (
                <div className="lab__options">
                  {current.options.map((o) => {
                    const locked = Boolean(o.requires && !lab.flags.includes(o.requires));
                    return (
                      <button
                        key={o.id}
                        type="button"
                        className="lab__option"
                        disabled={locked}
                        onClick={() => choose(o.id)}
                      >
                        <span>{o.label}</span>
                        {locked ? <Icon name="lock" size={14} /> : <Icon name="arrow-right" size={14} />}
                        {locked && o.lockedHint && <span className="lab__locked">{o.lockedHint}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {chosen && (
                <div className="lab__result">
                  <p className="lab__result-label meta">
                    <Icon name="check" size={13} /> {chosen.label}
                  </p>
                  <p className="lab__result-text">{chosen.result}</p>
                  {current.options && current.options.length > 1 && (
                    <p className="meta lab__untaken">
                      Não escolhido aqui:{' '}
                      {current.options
                        .filter((o) => o.id !== chosen.id)
                        .map((o) => o.label.toLowerCase())
                        .join(' · ')}
                    </p>
                  )}
                </div>
              )}

              {toDiscover.length > 0 && (
                <div className="lab__next">
                  <p className="eyebrow">Caminhos possíveis</p>
                  <div className="lab__chips">
                    {toDiscover.map((n) => (
                      <button key={n.id} type="button" className="chip" onClick={() => go(n.id)}>
                        {n.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {lab.visited.length > 1 && (
                <div className="lab__next">
                  <p className="eyebrow">Voltar a</p>
                  <div className="lab__chips">
                    {lab.visited
                      .filter((id) => id !== current.id)
                      .map((id) => (
                        <button key={id} type="button" className="chip chip--quiet" onClick={() => go(id)}>
                          {nodeById[id].name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <p className="meta lab__stats">
            {lab.visited.length} de {nodes.length} lugares percorridos
            {notTaken.length > 0 &&
              ` · ${notTaken.length} ${notTaken.length === 1 ? 'caminho não tomado' : 'caminhos não tomados'}`}
            {lab.lit && ' · o farol está aceso'}
          </p>
        </aside>
      </div>
    </div>
  );
}
