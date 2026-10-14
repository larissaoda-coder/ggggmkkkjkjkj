import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Photo } from '../content/types';
import { useMotion } from '../context/SettingsContext';
import { MediaImg } from './MediaImg';
import { Icon } from './Icon';

/** Visualização em tela cheia com navegação entre imagens (setas, teclado e deslize). */
export function Lightbox({
  photos,
  index,
  onClose,
  onIndex,
}: {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const m = useMotion();
  const touch = useRef<number | null>(null);
  const open = index !== null && photos[index];

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % photos.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, photos.length, onClose, onIndex]);

  return (
    <AnimatePresence>
      {open && index !== null && (
        <motion.div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Fotografia em tela cheia"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={m.t(0.35)}
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            touch.current = null;
            if (Math.abs(dx) > 60) onIndex((index + (dx < 0 ? 1 : -1) + photos.length) % photos.length);
          }}
        >
          <div className="lightbox__bar">
            <span className="num">
              {index + 1} / {photos.length}
            </span>
            <button type="button" className="lightbox__btn" onClick={onClose} autoFocus>
              Fechar <Icon name="close" size={16} />
            </button>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={photos[index].id}
              className="lightbox__figure"
              initial={{ opacity: 0, scale: m.reduced ? 1 : 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={m.t(0.35)}
            >
              <MediaImg src={photos[index].src} alt={photos[index].caption || 'Fotografia'} className="lightbox__img" />
              {(photos[index].caption || photos[index].dedication) && (
                <figcaption>
                  {photos[index].caption && <span className="lightbox__caption">{photos[index].caption}</span>}
                  {photos[index].dedication && <span className="lightbox__dedication">{photos[index].dedication}</span>}
                </figcaption>
              )}
            </motion.figure>
          </AnimatePresence>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--prev"
                onClick={() => onIndex((index - 1 + photos.length) % photos.length)}
                aria-label="Fotografia anterior"
              >
                <Icon name="arrow-left" size={20} />
              </button>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--next"
                onClick={() => onIndex((index + 1) % photos.length)}
                aria-label="Próxima fotografia"
              >
                <Icon name="arrow-right" size={20} />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
