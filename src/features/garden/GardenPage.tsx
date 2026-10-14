import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useContent } from '../../content/ContentContext';
import { useSettings } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { Icon } from '../../components/Icon';
import './garden.css';

/**
 * Um lago visto de cima. Tocar na água cria ondulações; as ondulações empurram
 * pétalas e balançam as folhas. Cinco coisas podem ser percebidas, cada uma
 * com uma mensagem curta (editável na administração, na mesma ordem):
 * 0 água parada · 1 pétala na margem · 2 vento · 3 algo sob a folha · 4 ondas cruzadas.
 */
type Event = 0 | 1 | 2 | 3 | 4;

interface Ripple {
  x: number;
  y: number;
  r: number;
  strength: number;
  id: number;
}
interface Pad {
  x: number;
  y: number;
  r: number;
  a: number;
  lotus: boolean;
  fish: boolean;
  ox: number;
  oy: number;
  spin: number;
}
interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  va: number;
  s: number;
}
interface Fish {
  x: number;
  y: number;
  dir: number;
  t: number;
}

/* Som de gota, gerado na hora (sem arquivos). */
let audio: AudioContext | null = null;
function drop(pitch = 1) {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
    const t = audio.currentTime;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(820 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(260 * pitch, t + 0.16);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + 0.4);
  } catch {
    /* sem áudio disponível */
  }
}

export default function GardenPage() {
  const navigate = useNavigate();
  const { content } = useContent();
  const { prefs, update, reduced } = useSettings();
  const { mark } = useProgress();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [intro, setIntro] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [found, setFound] = useState<Event[]>([]);
  const foundRef = useRef<Set<Event>>(new Set());
  const msgTimer = useRef<number | undefined>(undefined);
  const soundRef = useRef(prefs.sound);
  const reducedRef = useRef(reduced);
  soundRef.current = prefs.sound;
  reducedRef.current = reduced;

  const messages = content.garden.messages;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const discover = useCallback(
    (e: Event) => {
      if (foundRef.current.has(e)) return;
      foundRef.current.add(e);
      setFound([...foundRef.current]);
      const text = messagesRef.current[e]?.trim();
      if (text) {
        setMessage(text);
        window.clearTimeout(msgTimer.current);
        msgTimer.current = window.setTimeout(() => setMessage(null), 4800);
      }
      if (foundRef.current.size >= 2) mark('jardim');
    },
    [mark],
  );
  const discoverRef = useRef(discover);
  discoverRef.current = discover;

  const state = useRef({
    ripples: [] as Ripple[],
    pads: [] as Pad[],
    petals: [] as Petal[],
    fish: null as Fish | null,
    wind: { x: 0, y: 0, until: 0 },
    lastTouch: 0,
    touched: false,
    rid: 0,
    crossed: new Set<string>(),
    w: 0,
    h: 0,
  });

  const exit = useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/indice');
  }, [navigate]);

  useEffect(() => {
    const id = window.setTimeout(() => setIntro(false), 9000);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && exit();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(msgTimer.current);
      window.removeEventListener('keydown', onKey);
    };
  }, [exit]);

  /* ---------- desenho ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const s = state.current;
    let raf = 0;
    let last = performance.now();
    let time = 0;

    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      s.w = canvas.clientWidth;
      s.h = canvas.clientHeight;
      canvas.width = Math.round(s.w * dpr);
      canvas.height = Math.round(s.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const u = Math.min(s.w, s.h);
      const spots = [
        [0.2, 0.3, 0.11, true, false],
        [0.78, 0.22, 0.08, false, true],
        [0.68, 0.72, 0.12, false, false],
        [0.3, 0.78, 0.07, false, true],
        [0.86, 0.52, 0.06, false, false],
        [0.12, 0.6, 0.05, false, false],
      ] as const;
      s.pads = spots.map(([x, y, r, lotus, fish], i) => ({
        x: x * s.w,
        y: y * s.h,
        r: Math.max(22, r * u),
        a: i * 1.3 + 0.4,
        lotus,
        fish,
        ox: 0,
        oy: 0,
        spin: 0,
      }));
      if (!s.petals.length) {
        s.petals = Array.from({ length: 11 }, () => ({
          x: Math.random() * s.w,
          y: Math.random() * s.h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          a: Math.random() * Math.PI * 2,
          va: (Math.random() - 0.5) * 0.004,
          s: 4 + Math.random() * 3,
        }));
      }
    };

    const drawPad = (p: Pad) => {
      const x = p.x + p.ox;
      const y = p.y + p.oy;
      const a = p.a + p.spin;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, p.r, 0.18, Math.PI * 2 - 0.18);
      ctx.closePath();
      ctx.fillStyle = '#1f2523';
      ctx.fill();
      ctx.strokeStyle = 'rgba(214, 220, 214, 0.22)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(214, 220, 214, 0.09)';
      for (let i = 1; i < 7; i++) {
        const t = 0.18 + (i / 7) * (Math.PI * 2 - 0.36);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(t) * p.r * 0.9, Math.sin(t) * p.r * 0.9);
        ctx.stroke();
      }
      ctx.restore();
      if (p.lotus) {
        ctx.save();
        ctx.translate(x - p.r * 0.15, y - p.r * 0.1);
        ctx.fillStyle = 'rgba(243, 238, 226, 0.92)';
        ctx.strokeStyle = 'rgba(184, 154, 100, 0.55)';
        ctx.lineWidth = 0.6;
        const k = p.r * 0.32;
        for (let i = 0; i < 8; i++) {
          ctx.save();
          ctx.rotate((i / 8) * Math.PI * 2 + time * 0.00002);
          ctx.beginPath();
          ctx.ellipse(0, -k * 0.6, k * 0.28, k * 0.62, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.beginPath();
        ctx.arc(0, 0, k * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = '#c4a873';
        ctx.fill();
        ctx.restore();
      }
    };

    const frame = (dt: number) => {
      const { w, h } = s;
      // água
      const g = ctx.createRadialGradient(w * 0.45, h * 0.4, 0, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.7);
      g.addColorStop(0, '#1a1e1f');
      g.addColorStop(1, '#0c0e0f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // reflexos parados
      ctx.strokeStyle = 'rgba(220, 228, 230, 0.035)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = ((i + 0.5) / 6) * h + Math.sin(time * 0.0004 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(w * 0.1, y);
        ctx.bezierCurveTo(w * 0.35, y - 6, w * 0.65, y + 6, w * 0.9, y);
        ctx.stroke();
      }

      // vento
      const windy = performance.now() < s.wind.until;
      const wx = windy ? s.wind.x : 0;
      const wy = windy ? s.wind.y : 0;

      // ondulações
      s.ripples = s.ripples.filter((r) => r.strength > 0.01);
      for (const r of s.ripples) {
        r.r += 0.9 * dt;
        r.strength *= Math.pow(0.987, dt);
        for (let k = 0; k < 3; k++) {
          const rr = r.r - k * 9;
          if (rr <= 0) continue;
          ctx.strokeStyle = `rgba(232, 236, 234, ${r.strength * (0.7 - k * 0.2)})`;
          ctx.lineWidth = 1.1 - k * 0.3;
          ctx.beginPath();
          ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // ondas que se cruzam
      for (let i = 0; i < s.ripples.length; i++) {
        for (let j = i + 1; j < s.ripples.length; j++) {
          const a = s.ripples[i];
          const b = s.ripples[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 40 && a.strength > 0.3 && b.strength > 0.3 && d < a.r + b.r && d > Math.abs(a.r - b.r)) {
            const key = `${a.id}-${b.id}`;
            if (!s.crossed.has(key)) {
              s.crossed.add(key);
              discoverRef.current(4);
            }
          }
        }
      }

      // peixe que sai de baixo da folha
      if (s.fish) {
        const f = s.fish;
        f.t += dt;
        f.x += Math.cos(f.dir) * 1.3 * dt;
        f.y += Math.sin(f.dir) * 1.3 * dt;
        f.dir += Math.sin(f.t * 0.05) * 0.01 * dt;
        const alpha = Math.max(0, Math.min(1, f.t / 20) * (1 - f.t / 220));
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.dir);
        ctx.fillStyle = `rgba(214, 218, 220, ${alpha * 0.55})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        const sw = Math.sin(f.t * 0.3) * 4;
        ctx.moveTo(-15, 0);
        ctx.lineTo(-27, -6 + sw);
        ctx.lineTo(-27, 6 + sw);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        if (f.t > 220) s.fish = null;
      }

      // folhas: balançam com as ondas
      for (const p of s.pads) {
        let px = 0;
        let py = 0;
        for (const r of s.ripples) {
          const dx = p.x - r.x;
          const dy = p.y - r.y;
          const d = Math.hypot(dx, dy) || 1;
          const k = Math.exp(-((d - r.r) ** 2) / 1600) * 5 * r.strength;
          px += (dx / d) * k;
          py += (dy / d) * k;
        }
        p.ox += (px - p.ox) * Math.min(1, 0.1 * dt);
        p.oy += (py - p.oy) * Math.min(1, 0.1 * dt);
        p.spin *= Math.pow(0.97, dt);
        drawPad(p);
      }

      // pétalas
      for (const pt of s.petals) {
        for (const r of s.ripples) {
          const dx = pt.x - r.x;
          const dy = pt.y - r.y;
          const d = Math.hypot(dx, dy) || 1;
          const k = Math.exp(-((d - r.r) ** 2) / 900) * 0.05 * r.strength;
          pt.vx += (dx / d) * k * dt;
          pt.vy += (dy / d) * k * dt;
        }
        pt.vx += wx * 0.004 * dt;
        pt.vy += wy * 0.004 * dt;
        pt.vx *= Math.pow(0.992, dt);
        pt.vy *= Math.pow(0.992, dt);
        pt.x += (pt.vx + Math.sin(time * 0.0003 + pt.s) * 0.03) * dt;
        pt.y += (pt.vy + Math.cos(time * 0.0002 + pt.s) * 0.03) * dt;
        pt.a += pt.va * dt + (Math.abs(pt.vx) + Math.abs(pt.vy)) * 0.01;
        const m = 8;
        if (pt.x < m || pt.y < m || pt.x > w - m || pt.y > h - m) {
          if (s.touched) discoverRef.current(1);
          pt.x = Math.min(w - m, Math.max(m, pt.x));
          pt.y = Math.min(h - m, Math.max(m, pt.y));
          pt.vx *= -0.3;
          pt.vy *= -0.3;
        }
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.a);
        ctx.fillStyle = 'rgba(240, 232, 222, 0.85)';
        ctx.beginPath();
        ctx.ellipse(0, 0, pt.s, pt.s * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // água parada depois de um tempo sem toques
      if (s.touched && !s.ripples.length && performance.now() - s.lastTouch > 20000) discoverRef.current(0);
    };

    const loop = (now: number) => {
      const speed = reducedRef.current ? 0.35 : 1;
      const dt = Math.min(3, (now - last) / 16.67) * speed;
      last = now;
      time += dt * 16.67;
      frame(dt);
      raf = requestAnimationFrame(loop);
    };

    layout();
    window.addEventListener('resize', layout);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', layout);
    };
  }, []);

  /* ---------- toque ---------- */
  const press = useRef<{ x: number; y: number; t: number; timer: number } | null>(null);
  const local = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const touchWater = (x: number, y: number, strength = 1) => {
    const s = state.current;
    s.touched = true;
    s.lastTouch = performance.now();
    s.ripples.push({ x, y, r: 0, strength, id: s.rid++ });
    if (s.ripples.length > 14) s.ripples.shift();
    setIntro(false);
    if (soundRef.current) drop(0.85 + Math.random() * 0.3);
    // folha tocada: gira um pouco; algumas escondem alguma coisa
    const pad = s.pads.find((p) => Math.hypot(p.x - x, p.y - y) < p.r);
    if (pad) {
      pad.spin += 0.35;
      if (pad.fish && !s.fish) {
        s.fish = { x: pad.x, y: pad.y, dir: Math.random() * Math.PI * 2, t: 0 };
        discoverRef.current(3);
      }
    }
  };

  return (
    <div className="garden">
      <canvas
        ref={canvasRef}
        className="garden__water"
        role="img"
        aria-label="Um lago visto de cima, com folhas, uma flor de lótus e pétalas. Toque na água para criar ondulações."
        onPointerDown={(e) => {
          const { x, y } = local(e);
          touchWater(x, y);
          const timer = window.setTimeout(() => {
            // segurar o toque: uma rajada de vento leve
            const s = state.current;
            const ang = Math.atan2(y - s.h / 2, x - s.w / 2) + Math.PI;
            s.wind = { x: Math.cos(ang), y: Math.sin(ang), until: performance.now() + 3500 };
            discoverRef.current(2);
          }, 750);
          press.current = { x, y, t: performance.now(), timer };
        }}
        onPointerMove={(e) => {
          const p = press.current;
          if (!p) return;
          const { x, y } = local(e);
          if (Math.hypot(x - p.x, y - p.y) > 40) {
            window.clearTimeout(p.timer);
            touchWater(x, y, 0.55);
            press.current = { x, y, t: performance.now(), timer: 0 };
          }
        }}
        onPointerUp={() => {
          if (press.current) window.clearTimeout(press.current.timer);
          press.current = null;
        }}
        onPointerCancel={() => {
          if (press.current) window.clearTimeout(press.current.timer);
          press.current = null;
        }}
      />

      <div className="garden__bar">
        <button type="button" className="garden__btn" onClick={exit}>
          <Icon name="arrow-left" size={16} /> Voltar
        </button>
        <div className="garden__toggles">
          <button
            type="button"
            className="garden__btn"
            aria-pressed={prefs.sound}
            onClick={() => update({ sound: !prefs.sound })}
          >
            <Icon name={prefs.sound ? 'sound' : 'sound-off'} size={16} />
            {prefs.sound ? 'Som ligado' : 'Som desligado'}
          </button>
          <button
            type="button"
            className="garden__btn"
            aria-pressed={prefs.reduceMotion}
            onClick={() => update({ reduceMotion: !prefs.reduceMotion })}
          >
            {reduced ? 'Movimento reduzido' : 'Reduzir movimento'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {intro && (
          <motion.div
            className="garden__intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 1.2 }}
          >
            <h1>Um intervalo</h1>
            <p>
              Não há nada para resolver aqui. Você pode apenas observar, tocar na água e permanecer pelo tempo que
              quiser.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="garden__foot">
        <AnimatePresence mode="wait">
          {message && (
            <motion.p
              key={message}
              className="garden__msg"
              role="status"
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.8 }}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
        {found.length > 0 && (
          <span className="garden__count num" aria-label={`${found.length} de 5 detalhes percebidos`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} data-on={found.includes(i as Event)} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
