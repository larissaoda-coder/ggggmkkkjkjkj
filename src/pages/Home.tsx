import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotion } from '../context/SettingsContext';
import { useContent } from '../content/ContentContext';
import './home.css';

export default function Home() {
  const m = useMotion();
  const { content } = useContent();
  const { title, subtitle, footer } = content.home;

  return (
    <div className="home">
      <div className="home__frame" aria-hidden="true" />
      <div className="home__inner">
        <motion.h1
          className="home__title"
          initial={{ opacity: 0, y: m.reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={m.t(1.4, { delay: 0.2 * m.factor })}
        >
          {title}
        </motion.h1>
        <motion.span
          className="home__rule"
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={m.t(1.2, { delay: 0.9 * m.factor })}
        />
        <motion.p
          className="home__subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={m.t(1.2, { delay: 1.2 * m.factor })}
        >
          {subtitle}
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={m.t(1, { delay: 1.7 * m.factor })}>
          <Link to="/indice" className="home__enter">
            Entrar
          </Link>
        </motion.div>
      </div>
      <motion.p
        className="home__footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={m.t(1.2, { delay: 2.1 * m.factor })}
      >
        {footer}
      </motion.p>
    </div>
  );
}
