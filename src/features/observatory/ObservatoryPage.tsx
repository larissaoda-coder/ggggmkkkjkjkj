import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProgress } from '../../context/ProgressContext';
import { useMotion } from '../../context/SettingsContext';
import { usePersistentState } from '../../lib/usePersistentState';
import { sections } from '../../app/sections';
import { sfx } from '../../lib/sound';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { Icon } from '../../components/Icon';
import './observatory.css';

/**
 * O observatório: encontrado ao apagar o abajur numa noite de céu limpo.
 * Cada seção já visitada vira uma estrela com nome. É possível ligar estrelas
 * e dar um nome à própria constelação. Nada aqui é necessário para o resto.
 */

interface Sky {
  lines: [number, number][];
  name: string;
}

interface Star {
  x: number;
  y: number;
  r: number;
  label?: string;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function ObservatoryPage() {
  const { secretFound, visited } = useProgress();
  const m = useMotion();
  const [sky, setSky] = usePersistentState<Sky>('observatorio', { lines: [], name: '' });
  const [pending, setPending] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  // Em telas verticais o céu também fica vertical, e as estrelas sobem para longe do painel.
  const portrait = useMediaQuery('(max-aspect-ratio: 1/1)');
  const W = portrait ? 600 : 1000;
  const H = portrait ? 1000 : 700;

  const stars = useMemo<Star[]>(() => {
    const rand = seeded(20251031);
    const cx = W / 2;
    const cy = portrait ? H * 0.32 : H * 0.42;
    const rx = portrait ? W * 0.36 : W * 0.34;
    const ry = portrait ? H * 0.2 : H * 0.28;
    const named: Star[] = sections
      .filter((s) => visited.includes(s.id))
      .map((s, i) => {
        const a = (i / Math.max(1, sections.length)) * Math.PI * 2 + 0.6;
        const k = 0.72 + ((i * 53) % 4) * 0.1;
        return { x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k, r: 3.2, label: s.label };
      });
    const loose: Star[] = Array.from({ length: 34 }, () => ({
      x: 30 + rand() * (W - 60),
      y: 30 + rand() * (portrait ? H * 0.58 : H - 60),
      r: 1.4 + rand() * 1.4,
    }));
    return [...named, ...loose];
  }, [visited, portrait, W, H]);

  const dust = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: 160 }, () => ({ x: rand() * W, y: rand() * H, r: 0.3 + rand() * 0.7, d: rand() * 6 }));
  }, [W, H]);

  if (!secretFound) {
    return (
      <div className="page page--narrow empty-state">
        <p className="eyebrow">Observatório</p>
        <h1 className="title">Este lugar ainda não foi encontrado.</h1>
        <p className="lede">
          Ele aparece para quem explora, sem pressa. Algumas janelas mostram mais quando a luz se apaga.
        </p>
        <div className="row-actions">
          <Link to="/sumario" className="btn">
            Voltar ao sumário
          </Link>
        </div>
      </div>
    );
  }

  const tap = (i: number) => {
    if (pending === null) {
      setPending(i);
      sfx.tick();
      return;
    }
    if (pending === i) {
      setPending(null);
      return;
    }
    const exists = sky.lines.some(([a, b]) => (a === pending && b === i) || (a === i && b === pending));
    if (!exists) {
      setSky((s) => ({ ...s, lines: [...s.lines, [pending, i]] }));
      sfx.select();
    }
    setPending(i);
  };

  return (
    <div className="observatory">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="observatory__sky"
        role="group"
        aria-label="Céu do observatório"
      >
        <defs>
          <radialGradient id="obs-halo">
            <stop offset="0%" stopColor="#F5F3EE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#F5F3EE" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="observatory__rotate" style={{ transformOrigin: `${W / 2}px ${H / 2}px` }}>
          {dust.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} className="obs-dust" style={{ animationDelay: `${-d.d}s` }} />
          ))}
        </g>
        <path d="M-50 120 L260 40" className="obs-shooting" />

        {sky.lines.map(([a, b], i) =>
          stars[a] && stars[b] ? (
            <motion.line
              key={`${a}-${b}-${i}`}
              x1={stars[a].x}
              y1={stars[a].y}
              x2={stars[b].x}
              y2={stars[b].y}
              className="obs-line"
              initial={{ pathLength: m.reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={m.t(0.8)}
            />
          ) : null,
        )}

        {stars.map((s, i) => (
          <motion.g
            key={i}
            className="obs-star"
            data-named={Boolean(s.label)}
            data-pending={pending === i}
            role="button"
            tabIndex={0}
            aria-label={s.label ? `Estrela: ${s.label}` : `Estrela ${i + 1}`}
            onClick={() => tap(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tap(i);
              }
            }}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={m.t(1.2, { delay: (s.label ? 0.4 : 0.9) * m.factor + (i % 12) * 0.08 * m.factor })}
          >
            <circle cx={s.x} cy={s.y} r={18} className="obs-hit" />
            {s.label && <circle cx={s.x} cy={s.y} r={16} fill="url(#obs-halo)" />}
            <circle cx={s.x} cy={s.y} r={s.r} className="obs-dot" />
            {s.label && (hover === i || pending === i || sky.lines.some(([a, b]) => a === i || b === i)) && (
              <text x={s.x} y={s.y + 22} textAnchor="middle" className="obs-label">
                {s.label}
              </text>
            )}
          </motion.g>
        ))}
      </svg>

      <div className="observatory__panel">
        <Link to="/noite" className="observatory__back">
          <Icon name="arrow-left" size={16} /> Voltar à janela
        </Link>
        <div className="observatory__text">
          <p className="obs-eyebrow">Observatório</p>
          <h1 className="observatory__title">{sky.name.trim() || 'Um céu só seu'}</h1>
          <p className="observatory__lede">
            Cada lugar que você visitou neste espaço virou uma estrela. Toque numa estrela e depois em outra para
            ligá-las.
          </p>
        </div>
        <div className="observatory__tools">
          <label className="visually-hidden" htmlFor="obs-name">
            Nome da constelação
          </label>
          <input
            id="obs-name"
            className="observatory__input"
            placeholder="Dar um nome à constelação"
            maxLength={40}
            value={sky.name}
            onChange={(e) => setSky((s) => ({ ...s, name: e.target.value }))}
          />
          <button
            type="button"
            className="observatory__btn"
            onClick={() => setSky((s) => ({ ...s, lines: s.lines.slice(0, -1) }))}
            disabled={!sky.lines.length}
          >
            <Icon name="undo" size={14} /> Desfazer
          </button>
          <button
            type="button"
            className="observatory__btn"
            onClick={() => {
              setSky({ lines: [], name: sky.name });
              setPending(null);
            }}
            disabled={!sky.lines.length}
          >
            <Icon name="reset" size={14} /> Apagar linhas
          </button>
        </div>
        <p className="observatory__meta">
          {sky.lines.length} {sky.lines.length === 1 ? 'linha' : 'linhas'} · {stars.filter((s) => s.label).length}{' '}
          estrelas com nome · guardado neste navegador
        </p>
      </div>
    </div>
  );
}
