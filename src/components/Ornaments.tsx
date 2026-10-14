import type { CSSProperties } from 'react';
import { sections, groupLabels } from '../app/sections';
import type { Photo } from '../content/types';
import { MediaImg } from './MediaImg';
import './ornaments.css';

/* Borda serrilhada de fotografia antiga: ondas pequenas em volta da cópia. */
function deckle(waves: number, amp: number) {
  const pts: string[] = [];
  const steps = waves * 4;
  const off = (i: number) => (amp * (1 - Math.cos((i / 4) * Math.PI * 2))) / 2;
  for (let i = 0; i < steps; i++) pts.push(`${((i / steps) * 100).toFixed(2)}% ${off(i).toFixed(2)}px`);
  for (let i = 0; i < steps; i++) pts.push(`calc(100% - ${off(i).toFixed(2)}px) ${((i / steps) * 100).toFixed(2)}%`);
  for (let i = 0; i < steps; i++)
    pts.push(`${(100 - (i / steps) * 100).toFixed(2)}% calc(100% - ${off(i).toFixed(2)}px)`);
  for (let i = 0; i < steps; i++) pts.push(`${off(i).toFixed(2)}px ${(100 - (i / steps) * 100).toFixed(2)}%`);
  return `polygon(${pts.join(',')})`;
}
const DECKLE = deckle(26, 3.2);

/* Recortes de papel com cantos cortados à tesoura (três variações). */
const CUTS = [
  'polygon(1% 3%, 96% 0, 100% 58%, 93% 62%, 99% 100%, 4% 97%, 0 46%, 4% 41%)',
  'polygon(0 0, 100% 4%, 97% 100%, 52% 96%, 48% 100%, 2% 98%, 4% 54%, 0 50%)',
  'polygon(4% 0, 100% 2%, 98% 38%, 100% 42%, 96% 100%, 0 96%, 2% 14%, 0 10%)',
];

/**
 * Uma fotografia tratada como objeto sobre o papel: sem moldura (a imagem
 * como veio), polaroide, cópia antiga com borda serrilhada ou recorte.
 */
export function PhotoObject({
  photo,
  index = 0,
  className = '',
  style,
}: {
  photo: Photo;
  index?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const frame = photo.frame ?? 'livre';
  const clip = frame === 'serrilhada' ? DECKLE : frame === 'recorte' ? CUTS[index % CUTS.length] : undefined;
  return (
    <span className={`pobj pobj--${frame} ${className}`} style={style}>
      <span className="pobj__print" style={clip ? { clipPath: clip } : undefined}>
        <span className="pobj__img" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
          <MediaImg src={photo.src} alt={photo.caption || 'Fotografia'} />
        </span>
      </span>
    </span>
  );
}

/**
 * Abertura de cada área: a numeração como a etiqueta de um bloco de papel
 * ("05 · para ver"). As fotografias ficam na abertura, no arquivo e no
 * quebra-cabeça; aqui não entram, para nenhuma aparecer duas vezes.
 */
export function AreaMark({ id }: { id: string }) {
  const i = sections.findIndex((s) => s.id === id);
  if (i < 0) return null;
  return (
    <div className="area-plate">
      <span className="area-mark">
        <span className="area-mark__num">{String(i + 1).padStart(2, '0')}</span>
        <span className="area-mark__group">{groupLabels[sections[i].group].toLowerCase()}</span>
      </span>
    </div>
  );
}
