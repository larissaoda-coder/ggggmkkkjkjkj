import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useContent } from '../../content/ContentContext';
import type { PhotoCategory } from '../../content/types';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { Lightbox } from '../../components/Lightbox';
import { EmptyState } from '../../components/EmptyState';
import './archive.css';
import { AreaMark, PhotoObject } from '../../components/Ornaments';

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
        <AreaMark id="arquivo" />
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
              data-size={i % 4}
              onClick={() => {
                setOpen(i);
                mark('arquivo');
              }}
              initial={{ opacity: 0, y: m.reduced ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -40px 0px' }}
              transition={m.t(0.8, { delay: (i % 3) * 0.08 * m.factor })}
              aria-label={p.caption ? `Ampliar: ${p.caption}` : `Ampliar a fotografia ${i + 1}`}
              style={{
                ['--tilt' as string]: p.frame === 'livre' ? '0deg' : `${(((i * 37) % 5) - 2) * 0.7}deg`,
              }}
            >
              <PhotoObject photo={p} index={i} className="archive__photo" />
              <span className="archive__label">
                <span className="archive__num num">{String(i + 1).padStart(2, '0')}</span>
                {p.caption && <span className="archive__caption">{p.caption}</span>}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </div>
  );
}
