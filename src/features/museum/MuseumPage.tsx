import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useContent } from '../../content/ContentContext';
import type { Photo } from '../../content/types';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { EmptyState } from '../../components/EmptyState';
import { MediaImg } from '../../components/MediaImg';
import { Lightbox } from '../../components/Lightbox';
import './museum.css';

export default function MuseumPage() {
  const { content, photo } = useContent();
  const { mark } = useProgress();
  const m = useMotion();
  const exhibits = content.museum.filter((e) => e.title.trim() || e.object.trim() || e.text.trim() || e.photoId);
  const [open, setOpen] = useState<number | null>(null);

  const photos = useMemo(
    () => exhibits.map((e) => (e.photoId ? photo(e.photoId) : undefined)).filter((p): p is Photo => Boolean(p)),
    [exhibits, photo],
  );

  useEffect(() => {
    if (!exhibits.length) return;
    const id = window.setTimeout(() => mark('museu'), 10000);
    return () => window.clearTimeout(id);
  }, [exhibits.length, mark]);

  return (
    <div className="page museum">
      <header className="museum__head">
        <span className="museum__eyebrow">Acervo</span>
        <h1 className="museum__title">Coisas que merecem registro</h1>
        <p className="museum__desc">
          Uma coleção de detalhes que, por algum motivo, escolhi não deixar passar despercebidos.
        </p>
      </header>

      {exhibits.length === 0 ? (
        <EmptyState text="Nenhuma peça foi registrada no acervo ainda." adminTab="museu" />
      ) : (
        <ol className="museum__list">
          {exhibits.map((e, i) => {
            const p = e.photoId ? photo(e.photoId) : undefined;
            const inv = `Inv. ${String(i + 1).padStart(3, '0')}`;
            return (
              <motion.li
                key={e.id}
                className="exhibit"
                data-side={i % 2 ? 'direita' : 'esquerda'}
                initial={{ opacity: 0, y: m.reduced ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -60px 0px' }}
                transition={m.t(0.9)}
                onViewportEnter={() => i === exhibits.length - 1 && mark('museu')}
              >
                <div className="exhibit__piece">
                  {p ? (
                    <button
                      type="button"
                      className="exhibit__frame"
                      onClick={() => setOpen(photos.indexOf(p))}
                      aria-label={`Ampliar: ${e.title || 'fotografia'}`}
                    >
                      <span style={{ aspectRatio: `${p.width} / ${p.height}` }}>
                        <MediaImg src={p.src} alt={p.caption || e.title || 'Fotografia'} />
                      </span>
                    </button>
                  ) : (
                    <div className="exhibit__plinth" aria-hidden="true">
                      <span className="exhibit__object">{e.object || e.title}</span>
                      <span className="exhibit__base" />
                    </div>
                  )}
                </div>

                <div className="exhibit__info">
                  <div className="exhibit__label">
                    <span className="exhibit__inv num">{inv}</span>
                    <h2 className="exhibit__title">{e.title || e.object}</h2>
                    <dl>
                      {e.object && e.object !== e.title && (
                        <>
                          <dt>Objeto</dt>
                          <dd>{e.object}</dd>
                        </>
                      )}
                      {e.date && (
                        <>
                          <dt>Data</dt>
                          <dd>{e.date}</dd>
                        </>
                      )}
                      {e.material && (
                        <>
                          <dt>Material</dt>
                          <dd>{e.material}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                  {e.phrase && <p className="exhibit__phrase">{e.phrase}</p>}
                  {e.text && <p className="exhibit__text">{e.text}</p>}
                </div>
              </motion.li>
            );
          })}
        </ol>
      )}

      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </div>
  );
}
