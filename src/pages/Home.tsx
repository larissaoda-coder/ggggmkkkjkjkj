import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotion } from '../context/SettingsContext';
import { useContent } from '../content/ContentContext';
import { PhotoObject } from '../components/Ornaments';
import type { Photo } from '../content/types';
import './home.css';

export default function Home() {
  const m = useMotion();
  const { content, photo } = useContent();
  const { title, subtitle, footer, photoIds } = content.home;
  const heroes = photoIds.map((id) => photo(id)).filter((p): p is Photo => Boolean(p));
  const fade = (delay: number, y = 10) => ({
    initial: { opacity: 0, y: m.reduced ? 0 : y },
    animate: { opacity: 1, y: 0 },
    transition: m.t(1.2, { delay: delay * m.factor }),
  });

  return (
    <div className="home">
      <div className="home__grid">
        {heroes.length > 0 && (
          <div className="home__photos" data-count={heroes.length}>
            {heroes.map((p, i) => (
              <motion.figure
                key={p.id}
                className="home__figure"
                data-shape={p.width > p.height ? 'paisagem' : 'retrato'}
                {...fade(0.2 + i * 0.4, 16)}
              >
                <PhotoObject photo={p} index={i} />
              </motion.figure>
            ))}
          </div>
        )}
        <div className="home__text">
          <motion.h1 className="home__title" {...fade(1)}>
            {title}
          </motion.h1>
          <motion.p className="home__subtitle" {...fade(1.4)}>
            {subtitle}
          </motion.p>
          <motion.div {...fade(1.8)}>
            <Link to="/indice" className="home__enter">
              Entrar
            </Link>
          </motion.div>
        </div>
      </div>
      <motion.p className="home__footer" {...fade(2.2, 0)}>
        {footer}
      </motion.p>
    </div>
  );
}
