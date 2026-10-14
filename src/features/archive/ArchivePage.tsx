import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useContent } from '../../content/ContentContext';
import type { PhotoCategory } from '../../content/types';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { MediaImg } from '../../components/MediaImg';
import { Lightbox } from '../../components/Lightbox';
import { EmptyState } from '../../components/EmptyState';
import './archive.css';

const filters: { id: 'todas' | PhotoCategory; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'retratos', label: 'Retratos' },
  { id: 'detalhes', label: 'Detalhes' },
  { id: 'favoritas', label: 'Favoritas' },
];

export default function ArchivePage() {
  const { content } = useContent();
  const { mark } = useProgress();
  const m = useMotion();
  const [filter, setFilter] = useState<'todas' | PhotoCategory>('todas');
  const [open, setOpen] = useState<number | null>(null);
  const photos = useMemo(
    () => (filter === 'todas' ? content.photos : content.photos.filter((p) => p.category === filter)),
    [content.photos, filter],
  );

  return (
    <div className="page page--wide archive">
      <header className="archive__head">
        <h1 className="archive__title">Arquivo pessoal</h1>
        <p className="archive__desc">Fotografias, detalhes e registros que escolhi guardar.</p>
      </header>

      {content.photos.length > 0 && (
        <div className="archive__filters" role="group" aria-label="Coleções">
          {filters.map((f) => {
            const count =
              f.id === 'todas' ? content.photos.length : content.photos.filter((p) => p.category === f.id).length;
            return (
              <button
                key={f.id}
                type="button"
                className="archive__filter"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label} <span className="num">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {photos.length === 0 ? (
        <EmptyState text="Ainda não há fotografias nesta coleção." adminTab="fotos" />
      ) : (
        <div className="archive__grid">
          {photos.map((p, i) => (
            <motion.button
              key={p.id}
              type="button"
              className={`archive__item archive__item--${p.frame}`}
              onClick={() => {
                setOpen(i);
                mark('arquivo');
              }}
              initial={{ opacity: 0, y: m.reduced ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -40px 0px' }}
              transition={m.t(0.7, { delay: (i % 3) * 0.08 * m.factor })}
              aria-label={p.caption ? `Abrir: ${p.caption}` : 'Abrir fotografia'}
              style={{ ['--tilt' as string]: p.frame === 'polaroide' ? `${((i * 37) % 5) - 2}deg` : '0deg' }}
            >
              <span className="archive__mat" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
                <MediaImg src={p.src} alt={p.caption || 'Fotografia'} />
              </span>
              {p.caption && <span className="archive__caption">{p.caption}</span>}
            </motion.button>
          ))}
        </div>
      )}

      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </div>
  );
}
