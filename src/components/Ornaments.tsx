import { useId, type CSSProperties, type ReactNode } from 'react';
import { sections, groupLabels } from '../app/sections';
import './ornaments.css';

/**
 * Elementos de colagem: carimbo postal, selo picotado, fita adesiva e fita de
 * renda. São decorativos (aria-hidden) e herdam as cores do tema.
 */

export function Postmark({
  top,
  bottom,
  center,
  sub,
  tone = 'ink',
  size = 120,
  rotate = -12,
  waves = false,
  className = '',
  style,
}: {
  top: string;
  bottom: string;
  center?: string;
  sub?: string;
  tone?: 'ink' | 'red';
  size?: number;
  rotate?: number;
  waves?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const id = useId().replace(/:/g, '');
  const w = waves ? 300 : 120;
  return (
    <svg
      className={`postmark postmark--${tone} ${className}`}
      viewBox={`0 0 ${w} 120`}
      width={(size * w) / 120}
      height={size}
      style={{ ...style, transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <defs>
        <filter id={`ink${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.7" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" result="c" />
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="d" />
          <feDisplacementMap in="c" in2="d" scale="2.4" />
        </filter>
        <path id={`t${id}`} d="M 18 60 A 42 42 0 0 1 102 60" />
        <path id={`b${id}`} d="M 14 60 A 46 46 0 0 0 106 60" />
      </defs>
      <g filter={`url(#ink${id})`} fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="55" strokeWidth="2.4" />
        <circle cx="60" cy="60" r="35" strokeWidth="1.2" />
        <text className="postmark__ring" fill="currentColor" stroke="none">
          <textPath href={`#t${id}`} startOffset="50%" textAnchor="middle">
            {top}
          </textPath>
        </text>
        <text className="postmark__ring" fill="currentColor" stroke="none">
          <textPath href={`#b${id}`} startOffset="50%" textAnchor="middle">
            {bottom}
          </textPath>
        </text>
        {center && (
          <text
            x="60"
            y={sub ? 58 : 65}
            textAnchor="middle"
            className="postmark__center"
            fill="currentColor"
            stroke="none"
          >
            {center}
          </text>
        )}
        {sub && (
          <text x="60" y="73" textAnchor="middle" className="postmark__sub" fill="currentColor" stroke="none">
            {sub}
          </text>
        )}
        <path d="M 30 22 l 4 -4 M 86 98 l 4 4" strokeWidth="1.4" />
        {waves &&
          [36, 48, 60, 72, 84].map((y) => (
            <path
              key={y}
              d={`M 122 ${y} q 11 -7 22 0 t 22 0 t 22 0 t 22 0 t 22 0 t 22 0 t 22 0 t 22 0`}
              strokeWidth="2"
            />
          ))}
      </g>
    </svg>
  );
}

/** Selo com borda picotada e uma gravura em traço. */
export function Stamp({
  art,
  label,
  value,
  rotate = 4,
  className = '',
  style,
}: {
  art: ReactNode;
  label: string;
  value?: string;
  rotate?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`stamp ${className}`} style={{ ...style, transform: `rotate(${rotate}deg)` }} aria-hidden="true">
      <span className="stamp__inner">
        <svg viewBox="0 0 100 120" className="stamp__art">
          {art}
        </svg>
        <span className="stamp__label">{label}</span>
        {value && <span className="stamp__value">{value}</span>}
      </span>
    </span>
  );
}

/** Pedaço de fita adesiva de papel. */
export function Tape({
  className = '',
  style,
  rotate = -3,
}: {
  className?: string;
  style?: CSSProperties;
  rotate?: number;
}) {
  return (
    <span className={`tape ${className}`} style={{ ...style, ['--r' as string]: `${rotate}deg` }} aria-hidden="true" />
  );
}

/** Fita de renda (vermelho de carimbo). */
export function Lace({ className = '' }: { className?: string }) {
  return <span className={`lace ${className}`} aria-hidden="true" />;
}

/** Marca de catálogo no topo de cada área: "N.º 05 · Para ver". */
export function AreaMark({ id }: { id: string }) {
  const i = sections.findIndex((s) => s.id === id);
  if (i < 0) return null;
  return (
    <span className="area-mark">
      N.º {String(i + 1).padStart(2, '0')} <span aria-hidden="true">·</span> {groupLabels[sections[i].group]}
    </span>
  );
}

/* Gravuras em traço fino para selos. */
export const engravings = {
  lotus: (
    <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="56" r="30" strokeWidth="0.6" />
      <circle cx="50" cy="56" r="22" strokeWidth="0.6" strokeDasharray="1.5 2" />
      <path d="M50 74c-4-8-4-18 0-26 4 8 4 18 0 26Z" />
      <path d="M50 74c-8-4-13-11-13-20 7 2 11 9 13 20ZM50 74c8-4 13-11 13-20-7 2-11 9-13 20Z" />
      <path d="M50 74c-11 0-18-5-21-12 9-2 16 4 21 12ZM50 74c11 0 18-5 21-12-9-2-16 4-21 12Z" />
      <path d="M30 80h40M34 84h32" strokeWidth="0.7" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
        <path key={k} d={`M${30 + k * 6} 88v6`} strokeWidth="0.5" />
      ))}
    </g>
  ),
  envelope: (
    <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
      <rect x="18" y="36" width="64" height="42" />
      <path d="M18 36l32 24 32-24M18 78l24-20M82 78L58 58" />
      <circle cx="50" cy="66" r="5" />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <path key={k} d={`M${22 + k * 11} 86l6 6`} strokeWidth="0.5" />
      ))}
    </g>
  ),
  house: (
    <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
      <path d="M24 84V52l26-22 26 22v32Z" />
      <path d="M20 55l30-26 30 26M44 84V66h12v18M30 60h8v8h-8zM62 60h8v8h-8z" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
        <path key={k} d={`M${16 + k * 8} 90h4`} strokeWidth="0.6" />
      ))}
    </g>
  ),
  key: (
    <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
      <circle cx="50" cy="40" r="13" />
      <circle cx="50" cy="40" r="5" />
      <path d="M50 53v36M50 76h9M50 84h7" />
      <path d="M26 96h48" strokeWidth="0.6" />
    </g>
  ),
};
