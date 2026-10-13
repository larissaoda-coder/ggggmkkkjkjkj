import { useState } from 'react';
import type { Track } from '../../data/tracks';

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Capa geométrica gerada a partir do título: única para cada faixa, sempre monocromática. */
function GeneratedCover({ seed }: { seed: string }) {
  const h = hash(seed);
  const variant = h % 4;
  const n = 3 + (h % 5);
  const rot = (h >> 3) % 180;
  return (
    <svg viewBox="0 0 100 100" className="cover__svg" aria-hidden="true">
      <rect width="100" height="100" className="cover__bg" />
      {variant === 0 &&
        Array.from({ length: n }, (_, i) => (
          <circle key={i} cx="50" cy="50" r={8 + i * (36 / n)} className="cover__stroke" />
        ))}
      {variant === 1 && (
        <g transform={`rotate(${rot} 50 50)`}>
          {Array.from({ length: n * 2 }, (_, i) => (
            <path key={i} d={`M${10 + i * (80 / (n * 2))} 15V85`} className="cover__stroke" />
          ))}
        </g>
      )}
      {variant === 2 && (
        <>
          <circle cx={30 + (h % 40)} cy={35 + ((h >> 4) % 30)} r="18" className="cover__fill" />
          <path d="M0 70h100" className="cover__stroke" />
          <path d={`M0 ${78 + (h % 6)}h100M0 ${86 + (h % 4)}h100`} className="cover__stroke cover__faint" />
        </>
      )}
      {variant === 3 && (
        <g transform={`rotate(${rot} 50 50)`}>
          <rect x="25" y="25" width="50" height="50" className="cover__stroke" />
          <rect x="35" y="35" width="30" height="30" className="cover__stroke cover__faint" />
          <path d="M25 25l50 50" className="cover__stroke" />
        </g>
      )}
    </svg>
  );
}

export function Cover({ track, size = 'md' }: { track: Track; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  const src =
    track.cover ??
    (track.source.kind === 'youtube' ? `https://i.ytimg.com/vi/${track.source.videoId}/hqdefault.jpg` : undefined);
  return (
    <span className={`cover cover--${size}`}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="cover__img" />
      ) : (
        <GeneratedCover seed={track.id + track.title} />
      )}
    </span>
  );
}
