import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMotion, useSettings } from '../../context/SettingsContext';
import { usePersistentState } from '../../lib/usePersistentState';
import { Range } from '../../components/Range';
import { Icon } from '../../components/Icon';
import './interval.css';

type Composition = 'constelacao' | 'ondas' | 'campo';

const compositions: { id: Composition; label: string }[] = [
  { id: 'constelacao', label: 'Constelação' },
  { id: 'ondas', label: 'Ondas' },
  { id: 'campo', label: 'Campo' },
];

interface Prefs {
  composition: Composition;
  speed: number;
}

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Wave {
  x: number;
  y: number;
  r: number;
}

export default function IntervalPage() {
  const navigate = useNavigate();
  const m = useMotion();
  const { resolvedTheme } = useSettings();
  const [prefs, setPrefs] = usePersistentState<Prefs>('intervalo', { composition: 'constelacao', speed: 1 });
  const [paused, setPaused] = useState(m.reduced);
  const [idle, setIdle] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false });
  const points = useRef<Point[]>([]);
  const waves = useRef<Wave[]>([]);
  const angles = useRef<Float32Array | null>(null);
  const speedRef = useRef(prefs.speed);
  const pausedRef = useRef(paused);
  const compRef = useRef(prefs.composition);
  const colors = useRef({ ink: '#111111', bg: '#F5F3EE' });
  const idleTimer = useRef<number | undefined>(undefined);
  const drawOnce = useRef<() => void>(() => {});

  speedRef.current = prefs.speed;
  pausedRef.current = paused;
  compRef.current = prefs.composition;

  const exit = useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/sumario');
  }, [navigate]);

  /* ---------- cores a partir do tema ---------- */
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    colors.current = {
      ink: css.getPropertyValue('--ink').trim() || '#111111',
      bg: css.getPropertyValue('--bg').trim() || '#F5F3EE',
    };
    drawOnce.current();
  }, [resolvedTheme]);

  /* ---------- controles somem quando não há interação ---------- */
  const wake = useCallback(() => {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), 3200);
  }, []);
  useEffect(() => {
    wake();
    return () => window.clearTimeout(idleTimer.current);
  }, [wake]);

  /* ---------- teclado ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      wake();
      if (e.key === 'Escape') exit();
      if (e.key === ' ' && !(e.target as HTMLElement).closest('button, input')) {
        e.preventDefault();
        setPaused((p) => !p);
      }
      const n = Number(e.key);
      if (n >= 1 && n <= compositions.length) setPrefs((p) => ({ ...p, composition: compositions[n - 1].id }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exit, setPrefs, wake]);

  /* ---------- animação ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let autoWave = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, (w * h) / 11000));
      points.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
      angles.current = null;
      drawOnce.current();
    };

    const alpha = (a: number) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
    };

    const drawConstellation = (dt: number) => {
      const pts = points.current;
      const p = pointer.current;
      for (const pt of pts) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (p.active) {
          const dx = p.x - pt.x;
          const dy = p.y - pt.y;
          const d = Math.hypot(dx, dy);
          if (d < 160 && d > 1) {
            // Os pontos se aproximam do toque e o contornam, sem se acumular sobre ele.
            const f = (d < 60 ? -0.012 : 0.004) * dt;
            pt.vx += (dx / d) * f;
            pt.vy += (dy / d) * f;
          }
        }
        pt.vx *= 0.995;
        pt.vy *= 0.995;
        const sp = Math.hypot(pt.vx, pt.vy);
        if (sp < 0.08) {
          pt.vx += (Math.random() - 0.5) * 0.02;
          pt.vy += (Math.random() - 0.5) * 0.02;
        }
        if (pt.x < -20) pt.x = w + 20;
        if (pt.x > w + 20) pt.x = -20;
        if (pt.y < -20) pt.y = h + 20;
        if (pt.y > h + 20) pt.y = -20;
      }
      ctx.lineWidth = 0.7;
      const maxD = Math.min(150, Math.max(90, w / 9));
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < maxD) {
            alpha((1 - d / maxD) * 0.45);
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
        if (p.active) {
          const d = Math.hypot(pts[i].x - p.x, pts[i].y - p.y);
          if (d < 180) {
            alpha((1 - d / 180) * 0.6);
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }
      alpha(0.85);
      for (const pt of pts) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawWaves = (dt: number) => {
      autoWave -= dt;
      if (autoWave <= 0) {
        waves.current.push({ x: w / 2, y: h / 2, r: 0 });
        autoWave = 260;
      }
      if (pointer.current.active && Math.random() < 0.02 * dt) {
        waves.current.push({ x: pointer.current.x, y: pointer.current.y, r: 0 });
      }
      const maxR = Math.hypot(w, h);
      waves.current = waves.current.filter((wv) => wv.r < maxR);
      ctx.lineWidth = 0.8;
      for (const wv of waves.current) {
        wv.r += 0.9 * dt;
        alpha(Math.max(0, 0.55 * (1 - wv.r / (maxR * 0.7))));
        ctx.beginPath();
        ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Pontos de uma grade, deslocados pela passagem das ondas.
      const step = Math.max(26, Math.min(42, w / 26));
      alpha(0.7);
      for (let x = step / 2; x < w; x += step) {
        for (let y = step / 2; y < h; y += step) {
          let ox = 0;
          let oy = 0;
          for (const wv of waves.current) {
            const dx = x - wv.x;
            const dy = y - wv.y;
            const d = Math.hypot(dx, dy) || 1;
            const k = Math.exp(-((d - wv.r) ** 2) / 900) * 6 * (1 - wv.r / maxR);
            ox += (dx / d) * k;
            oy += (dy / d) * k;
          }
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawField = (dt: number) => {
      const step = Math.max(24, Math.min(36, w / 30));
      const cols = Math.ceil(w / step);
      const rows = Math.ceil(h / step);
      if (!angles.current || angles.current.length !== cols * rows) angles.current = new Float32Array(cols * rows);
      const a = angles.current;
      const p = pointer.current;
      ctx.lineWidth = 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * step + step / 2;
          const y = j * step + step / 2;
          let target: number;
          let strength = 0.35;
          if (p.active) {
            target = Math.atan2(p.y - y, p.x - x);
            const d = Math.hypot(p.x - x, p.y - y);
            strength = Math.max(0.3, 1 - d / Math.max(w, h));
          } else {
            target = Math.sin(x * 0.006 + t * 0.0004) * Math.PI + Math.cos(y * 0.005 - t * 0.0003) * 1.4;
          }
          const k = j * cols + i;
          let diff = target - a[k];
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          a[k] += diff * Math.min(1, 0.06 * dt);
          const len = step * 0.36;
          alpha(0.25 + strength * 0.6);
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(a[k]) * len, y - Math.sin(a[k]) * len);
          ctx.lineTo(x + Math.cos(a[k]) * len, y + Math.sin(a[k]) * len);
          ctx.stroke();
        }
      }
    };

    const frame = (dt: number) => {
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.current.bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = colors.current.ink;
      ctx.fillStyle = colors.current.ink;
      if (compRef.current === 'constelacao') drawConstellation(dt);
      else if (compRef.current === 'ondas') drawWaves(dt);
      else drawField(dt);
      ctx.globalAlpha = 1;
    };

    drawOnce.current = () => frame(0);

    const loop = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.67) * speedRef.current;
      last = now;
      if (!pausedRef.current) {
        t += dt * 16.67;
        frame(dt);
      }
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Ao trocar de composição com a animação pausada, mostra o novo desenho.
  useEffect(() => {
    waves.current = [];
    drawOnce.current();
  }, [prefs.composition]);

  const toLocal = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="interval" data-idle={idle} onPointerMove={wake}>
      <h1 className="visually-hidden">O intervalo</h1>
      <canvas
        ref={canvasRef}
        className="interval__canvas"
        aria-label="Composição animada. Mova o cursor ou toque para interagir."
        role="img"
        onPointerMove={(e) => {
          const p = toLocal(e);
          pointer.current = { ...p, active: true };
          if (pausedRef.current) drawOnce.current();
        }}
        onPointerDown={(e) => {
          const p = toLocal(e);
          pointer.current = { ...p, active: true };
          if (compRef.current === 'ondas') waves.current.push({ x: p.x, y: p.y, r: 0 });
          if (compRef.current === 'constelacao') {
            points.current.forEach((pt) => {
              const dx = pt.x - p.x;
              const dy = pt.y - p.y;
              const d = Math.hypot(dx, dy) || 1;
              if (d < 200) {
                pt.vx += (dx / d) * 1.2 * (1 - d / 200);
                pt.vy += (dy / d) * 1.2 * (1 - d / 200);
              }
            });
          }
          wake();
        }}
        onPointerLeave={() => (pointer.current = { ...pointer.current, active: false })}
        onPointerCancel={() => (pointer.current = { ...pointer.current, active: false })}
      />

      <button type="button" className="interval__exit" onClick={exit} aria-label="Sair do intervalo">
        <Icon name="close" size={20} />
        <span>Sair</span>
      </button>

      {paused && m.reduced && (
        <p className="interval__notice">
          O movimento começa pausado, de acordo com a sua preferência de animações. Retome quando quiser.
        </p>
      )}

      <div className="interval__controls" role="toolbar" aria-label="Controles do intervalo">
        <div className="segmented" role="radiogroup" aria-label="Composição">
          {compositions.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={prefs.composition === c.id}
              onClick={() => setPrefs((p) => ({ ...p, composition: c.id }))}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="interval__speed">
          <span className="meta">Velocidade</span>
          <Range
            label="Velocidade da animação"
            min={0.25}
            max={2}
            step={0.05}
            value={prefs.speed}
            onValue={(speed) => setPrefs((p) => ({ ...p, speed }))}
          />
        </label>
        <button
          type="button"
          className="btn btn--small interval__toggle"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
        >
          <Icon name={paused ? 'play' : 'pause'} size={14} /> {paused ? 'Retomar' : 'Pausar'}
        </button>
      </div>
    </div>
  );
}
