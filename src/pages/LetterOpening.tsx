import { motion } from 'framer-motion';
import '@fontsource/shadows-into-light-two/400.css';
import { useContent } from '../content/ContentContext';
import { useMotion } from '../context/SettingsContext';
import { MediaImg } from '../components/MediaImg';
import './letter-opening.css';

const DEFAULT_BOTTOM = 'fotos/carta-varanda.jpg';

/**
 * Abertura da carta em faixas empilhadas: o verso de um envelope com uma frase
 * escrita à mão e uma fotografia embaixo. Uma fotografia em cima só entra se for
 * escolhida na administração. Com `animate`, as faixas aparecem uma de cada vez
 * e a frase surge como se estivesse sendo escrita.
 */
export function LetterOpening({ animate, onContinue }: { animate: boolean; onContinue: () => void }) {
  const { content, photo } = useContent();
  const m = useMotion();
  const play = animate && !m.reduced;
  const top = content.letter.topPhotoId ? photo(content.letter.topPhotoId)?.src : undefined;
  const bottom = (content.letter.bottomPhotoId && photo(content.letter.bottomPhotoId)?.src) || DEFAULT_BOTTOM;
  const note = content.letter.note.trim();

  // Sem a fotografia de cima, tudo começa uma faixa antes.
  const shift = top ? 0 : 0.9;
  const enter = (delay: number) =>
    play
      ? {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] as const, delay },
        }
      : {};

  return (
    <section className="opening" aria-label="Abertura da carta" data-animate={play} data-top={Boolean(top)}>
      {top && (
        <motion.figure className="opening__panel opening__panel--top" {...enter(0.15)}>
          <MediaImg src={top} alt="" />
        </motion.figure>
      )}

      <motion.div className="opening__panel opening__envelope" {...enter(1.05 - shift)}>
        <svg className="opening__paper" viewBox="0 0 1000 625" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="opening-shadow" x="-5%" y="-20%" width="110%" height="140%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <pattern id="opening-laid" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <path d="M0 0v7" stroke="rgba(0,0,0,0.045)" strokeWidth="2" />
            </pattern>
          </defs>
          {/* corpo do envelope, com a trama do papel de segurança */}
          <rect width="1000" height="625" fill="url(#opening-laid)" />
          <path d="M0 625 470 440M1000 625 640 440" className="opening__fold" />
          {/* sombra e aba */}
          <path
            d="M0 132 L515 430 Q560 456 606 432 L1000 236"
            className="opening__flap-shadow"
            filter="url(#opening-shadow)"
          />
          <path d="M0 0H1000V236L606 432Q560 456 515 430L0 132Z" className="opening__flap" />
          <path d="M0 132 L515 430 Q560 456 606 432 L1000 236" className="opening__flap-edge" />
        </svg>
        {note && (
          <p className="opening__note" data-write={play}>
            {note}
          </p>
        )}
      </motion.div>

      <motion.figure className="opening__panel opening__panel--bottom" {...enter(play ? 3.2 - shift : 0)}>
        <MediaImg src={bottom} alt="" />
      </motion.figure>

      <motion.button type="button" className="opening__cue" onClick={onContinue} {...enter(play ? 4.1 - shift : 0)}>
        Ler a carta
        <span aria-hidden="true">↓</span>
      </motion.button>
    </section>
  );
}
