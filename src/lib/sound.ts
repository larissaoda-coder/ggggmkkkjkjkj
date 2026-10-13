/**
 * Efeitos sonoros sintetizados em tempo real com a Web Audio API.
 * Nenhum arquivo de áudio é usado aqui: cada som é gerado no navegador.
 * Todos ficam desativados até que a pessoa os ative em Ajustes.
 */

let enabled = false;
let masterVolume = 0.5;
let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (!on) stopAllAmbience();
}

export function setSoundVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
  ambiences.forEach((a) => a.gain.gain.setTargetAtTime(a.level * masterVolume, a.ctx.currentTime, 0.3));
}

export function isSoundEnabled() {
  return enabled;
}

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function getNoise(c: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer;
  const length = c.sampleRate * 2;
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  // Ruído rosa aproximado (filtro de Paul Kellet), mais suave que o ruído branco.
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  noiseBuffer = buffer;
  return buffer;
}

function tone(freq: number, duration: number, level: number, type: OscillatorType = 'sine', delay = 0) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level * masterVolume, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

function noiseBurst(duration: number, level: number, filterFreq: number, q = 0.8, delay = 0) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(filterFreq, t);
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level * masterVolume, t + duration * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t, Math.random());
  src.stop(t + duration + 0.05);
}

export const sfx = {
  /** Toque discreto de seleção. */
  tick() {
    tone(1320, 0.07, 0.05, 'sine');
  },
  /** Seleção um pouco mais presente. */
  select() {
    tone(660, 0.16, 0.06, 'sine');
    tone(990, 0.2, 0.03, 'sine', 0.02);
  },
  /** Papel deslizando. */
  paper() {
    noiseBurst(0.45, 0.22, 2400, 0.6);
    noiseBurst(0.3, 0.12, 4200, 0.9, 0.18);
  },
  /** Algo novo se revelou. */
  reveal() {
    tone(523.25, 0.9, 0.05);
    tone(783.99, 1.1, 0.035, 'sine', 0.12);
    tone(1046.5, 1.3, 0.02, 'sine', 0.24);
  },
  /** Mudança de cena ou de capítulo. */
  transition() {
    noiseBurst(0.9, 0.06, 800, 0.4);
    tone(392, 1.4, 0.03, 'sine', 0.1);
  },
  /** Peça colocada sobre a mesa. */
  place() {
    tone(220, 0.12, 0.08, 'triangle');
    noiseBurst(0.08, 0.05, 1800, 1.2);
  },
  /** Ação desfeita ou removida. */
  soft() {
    tone(440, 0.12, 0.04, 'sine');
  },
};

/* ---------------- Ambiências contínuas ---------------- */

interface Ambience {
  ctx: AudioContext;
  gain: GainNode;
  level: number;
  stop: () => void;
}

const ambiences = new Map<string, Ambience>();

function startAmbience(name: string, level: number, build: (c: AudioContext, out: GainNode) => () => void) {
  const c = getCtx();
  if (!c || ambiences.has(name)) return;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(level * masterVolume, c.currentTime + 1.5);
  gain.connect(c.destination);
  const teardown = build(c, gain);
  ambiences.set(name, {
    ctx: c,
    gain,
    level,
    stop: () => {
      const t = c.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.8);
      window.setTimeout(() => {
        teardown();
        gain.disconnect();
      }, 900);
    },
  });
}

export function stopAmbience(name: string) {
  const a = ambiences.get(name);
  if (!a) return;
  ambiences.delete(name);
  a.stop();
}

export function stopAllAmbience() {
  Array.from(ambiences.keys()).forEach(stopAmbience);
}

/** Chuva: ruído rosa filtrado, com leve oscilação de intensidade. */
export function startRain() {
  startAmbience('rain', 0.5, (c, out) => {
    const src = c.createBufferSource();
    src.buffer = getNoise(c);
    src.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 400;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 900;
    lfo.connect(lfoGain).connect(lp.frequency);
    src.connect(hp).connect(lp).connect(out);
    src.start();
    lfo.start();
    return () => {
      src.stop();
      lfo.stop();
    };
  });
}

/**
 * Um pequeno motivo ambiente, gerado: acordes lentos de seno.
 * Usado na experiência "Uma noite" quando a pessoa liga o rádio.
 */
export function startDrone(variant: 'piano' | 'baixo' | 'aberto' = 'piano') {
  startAmbience('drone', 0.16, (c, out) => {
    const progressions: Record<string, number[][]> = {
      piano: [
        [261.63, 329.63, 392.0, 493.88],
        [220.0, 261.63, 329.63, 392.0],
        [174.61, 220.0, 261.63, 329.63],
        [196.0, 246.94, 293.66, 392.0],
      ],
      baixo: [
        [130.81, 196.0, 246.94, 293.66],
        [110.0, 164.81, 196.0, 261.63],
        [146.83, 220.0, 261.63, 349.23],
        [123.47, 185.0, 220.0, 293.66],
      ],
      aberto: [
        [293.66, 440.0, 587.33],
        [261.63, 392.0, 659.25],
        [246.94, 369.99, 587.33],
        [220.0, 329.63, 554.37],
      ],
    };
    const chords = progressions[variant];
    let step = 0;
    let stopped = false;
    const play = () => {
      if (stopped) return;
      const chord = chords[step % chords.length];
      const t = c.currentTime;
      chord.forEach((f, i) => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = variant === 'baixo' ? 'triangle' : 'sine';
        osc.frequency.value = f;
        const start = t + i * (variant === 'piano' ? 0.35 : 0.05);
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.25, start + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 3.6);
        osc.connect(g).connect(out);
        osc.start(start);
        osc.stop(start + 3.8);
      });
      step++;
    };
    play();
    const id = window.setInterval(play, 3200);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  });
}
