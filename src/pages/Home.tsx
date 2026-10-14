import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotion } from '../context/SettingsContext';
import { useContent } from '../content/ContentContext';
import { PhotoObject } from '../components/Ornaments';
import './home.css';

export default function Home() {
  const m = useMotion();
  const { content } = useContent();
  const { title, subtitle, footer } = content.home;
  const hero = content.photos.find((p) => p.category === 'favoritas') ?? content.photos[0];
  const fade = (delay: number, y = 10) => ({
    initial: { opacity: 0, y: m.reduced ? 0 : y },
    animate: { opacity: 1, y: 0 },
    transition: m.t(1.2, { delay: delay * m.factor }),
  });

  return (
    <div className="home" data-photo={Boolean(hero)}>
      <div className="home__grid">
        {hero && (
          <motion.figure className="home__figure" {...fade(0.2, 16)}>
            <PhotoObject photo={hero} />
          </motion.figure>
        )}
        <div className="home__text">
          <motion.h1 className="home__title" {...fade(0.7)}>
            {title}
          </motion.h1>
          <motion.p className="home__subtitle" {...fade(1.1)}>
            {subtitle}
          </motion.p>
          <motion.div {...fade(1.5)}>
            <Link to="/indice" className="home__enter">
              Entrar
            </Link>
          </motion.div>
        </div>
      </div>
      <motion.p className="home__footer" {...fade(1.9, 0)}>
        {footer}
      </motion.p>
    </div>
  );
}
