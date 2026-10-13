import type { ReactElement } from 'react';
import type { Backdrop as BackdropKind } from './engine';

/**
 * Cenários desenhados apenas com linhas finas. Cada um tem uma animação
 * discreta (chuva, vapor, reflexos) que respeita a preferência de movimento.
 */
const scenes: Record<BackdropKind, ReactElement> = {
  'sala-chuva': (
    <>
      <rect x="236" y="18" width="104" height="104" className="bd-line" />
      <path d="M288 18v104M236 70h104" className="bd-line bd-faint" />
      <g className="bd-rain" clipPath="url(#bd-clip-window)">
        {Array.from({ length: 18 }, (_, i) => (
          <path
            key={i}
            d={`M${240 + ((i * 37) % 100)} ${-20 + ((i * 53) % 90)}l-3 14`}
            className="bd-drop"
            style={{ animationDelay: `${-(i * 0.23) % 1.4}s` }}
          />
        ))}
      </g>
      <circle cx="110" cy="64" r="46" className="bd-glow" />
      <path d="M110 74v66M96 140h28" className="bd-line" />
      <path d="M94 74h32l-7-22h-18Z" className="bd-line" />
      <path d="M20 140v-28a8 8 0 0 1 8-8h52a8 8 0 0 1 8 8v28" className="bd-line bd-faint" />
      <path d="M150 128h70M160 128v12M210 128v12" className="bd-line" />
      <rect x="196" y="121" width="9" height="6" className="bd-line bd-phone" />
      <path d="M170 121h12v6h-12zM182 123h3" className="bd-line bd-faint" />
      <path d="M0 140h400" className="bd-line bd-faint" />
    </>
  ),
  manha: (
    <>
      <rect x="220" y="14" width="120" height="96" className="bd-line" />
      <path d="M280 14v96" className="bd-line bd-faint" />
      <circle cx="312" cy="46" r="13" className="bd-sun" />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${232 + i * 18} 110l${-40 + i * 4} 30`} className="bd-line bd-faint bd-ray" />
      ))}
      <path d="M60 116h200" className="bd-line" />
      <path d="M140 116v-14h16v14M156 106h4a3 3 0 0 1 0 6h-4" className="bd-line" />
      <g className="bd-steam">
        <path d="M144 96c-4-6 4-10 0-16" className="bd-line bd-faint" />
        <path d="M151 96c-4-6 4-10 0-16" className="bd-line bd-faint" style={{ animationDelay: '-1.2s' }} />
      </g>
      <path
        d="M86 116v-10h20v10M96 106c-6-10-14-12-18-22M96 106c2-12 10-18 16-26M96 106c-1-12-4-20-2-30"
        className="bd-line"
      />
      <path d="M0 140h400" className="bd-line bd-faint" />
    </>
  ),
  galeria: (
    <>
      <path d="M0 132h400" className="bd-line" />
      <path d="M150 0l-36 112h72Z" className="bd-cone" />
      <path d="M200 0l-40 112h80Z" className="bd-cone" style={{ animationDelay: '-2s' }} />
      <rect x="40" y="44" width="58" height="40" className="bd-line" />
      <rect x="152" y="30" width="96" height="66" className="bd-line" />
      <rect x="166" y="42" width="22" height="30" className="bd-line bd-faint" />
      <path d="M152 86h96" className="bd-line bd-faint" />
      <rect x="300" y="48" width="44" height="56" className="bd-line" />
      <path d="M160 132v-10h80v10" className="bd-line bd-faint" />
    </>
  ),
  cafe: (
    <>
      <rect x="40" y="10" width="320" height="96" className="bd-line bd-faint" />
      {[120, 200, 280].map((x) => (
        <path key={x} d={`M${x} 10v96`} className="bd-line bd-faint" />
      ))}
      <path d="M40 58h320" className="bd-line bd-faint" />
      {[150, 250].map((x, i) => (
        <g key={x} className="bd-sway" style={{ transformOrigin: `${x}px 0px`, animationDelay: `${-i * 1.7}s` }}>
          <path d={`M${x} 0v30`} className="bd-line" />
          <path d={`M${x - 12} 42a12 12 0 0 1 24 0Z`} className="bd-line" />
          <circle cx={x} cy={46} r={18} className="bd-glow bd-glow--small" />
        </g>
      ))}
      <ellipse cx="200" cy="128" rx="70" ry="9" className="bd-line" />
      <path d="M200 137v20" className="bd-line" />
      <path d="M168 124v-8h12v8M220 124v-8h12v8" className="bd-line" />
      <path d="M0 150h400" className="bd-line bd-faint" />
    </>
  ),
  rua: (
    <>
      <path d="M0 112h400" className="bd-line" />
      {[60, 200, 340].map((x) => (
        <g key={x}>
          <path d={`M${x} 112V36M${x} 36h14`} className="bd-line" />
          <path d={`M${x + 8} 36h12l-2 6h-8Z`} className="bd-line" />
          <circle cx={x + 14} cy={44} r={20} className="bd-glow bd-glow--small" />
          {Array.from({ length: 4 }, (_, i) => (
            <path
              key={i}
              d={`M${x + 8 + (i % 2) * 6} ${120 + i * 8}h${12 - i * 2}`}
              className="bd-line bd-shimmer"
              style={{ animationDelay: `${-i * 0.6 - x / 100}s` }}
            />
          ))}
        </g>
      ))}
      <path d="M100 112V60h40v52M240 112V48h56v52" className="bd-line bd-faint" />
      <path d="M110 70h6M124 70h6M110 84h6M250 60h8M268 60h8M250 76h8M268 76h8" className="bd-line bd-faint" />
    </>
  ),
  'casa-noite': (
    <>
      <rect x="230" y="16" width="96" height="96" className="bd-line" />
      <path d="M278 16v96M230 64h96" className="bd-line bd-faint" />
      <circle cx="302" cy="38" r="9" className="bd-moon" />
      {[
        [250, 30],
        [262, 50],
        [246, 88],
        [300, 92],
        [314, 76],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.9} className="bd-star" style={{ animationDelay: `${-i * 0.8}s` }} />
      ))}
      <path d="M90 140V76M76 76h28l-6-18H82Z" className="bd-line" />
      <circle cx="90" cy="70" r="30" className="bd-glow bd-glow--small" />
      <path d="M130 140v-24h80v24M130 124h80" className="bd-line bd-faint" />
      <path d="M150 116h22v-4h-22z" className="bd-line" />
      <path d="M0 140h400" className="bd-line bd-faint" />
    </>
  ),
  lisboa: (
    <>
      <circle cx="300" cy="50" r="22" className="bd-sun" />
      <path
        d="M0 100l20-12 20 12v40H0zM40 104l26-20 26 20v36H40zM92 96l18-14 18 14v44H92zM128 108l30-22 30 22v32h-60zM188 98l22-16 22 16v42h-44z"
        className="bd-line"
      />
      <path d="M232 120h168" className="bd-line" />
      {Array.from({ length: 5 }, (_, i) => (
        <path
          key={i}
          d={`M${250 + i * 26} ${128 + (i % 2) * 6}h${16 - (i % 3) * 3}`}
          className="bd-line bd-shimmer"
          style={{ animationDelay: `${-i * 0.5}s` }}
        />
      ))}
      <path d="M250 30l5 3 5-3M268 22l4 2.5 4-2.5" className="bd-line bd-faint bd-birds" />
    </>
  ),
  cartas: (
    <>
      <rect x="250" y="14" width="100" height="90" className="bd-line bd-faint" />
      <path d="M300 14v90" className="bd-line bd-faint" />
      <circle cx="324" cy="40" r="10" className="bd-sun" />
      <path d="M40 132h300" className="bd-line" />
      <g transform="rotate(-6 120 110)">
        <rect x="80" y="88" width="80" height="44" className="bd-line" />
        <path d="M80 88l40 24 40-24" className="bd-line" />
      </g>
      <g transform="rotate(4 200 112)">
        <rect x="170" y="96" width="70" height="36" className="bd-line bd-faint" />
        <path d="M180 106h40M180 114h50M180 122h30" className="bd-line bd-faint" />
      </g>
      <path d="M252 130l40-26" className="bd-line" />
    </>
  ),
};

export function Backdrop({ kind }: { kind: BackdropKind }) {
  return (
    <svg className="bd" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <clipPath id="bd-clip-window">
          <rect x="236" y="18" width="104" height="104" />
        </clipPath>
        <radialGradient id="bd-glow-grad">
          <stop offset="0%" stopColor="var(--glow)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--glow)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {scenes[kind]}
    </svg>
  );
}
