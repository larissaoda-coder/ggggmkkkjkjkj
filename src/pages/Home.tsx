import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotion, useSettings } from '../context/SettingsContext';
import { Icon } from '../components/Icon';
import './home.css';

const NAME = 'Annelise';

export default function Home() {
  const m = useMotion();
  const { resolvedTheme, toggleTheme } = useSettings();

  return (
    <div className="home">
      <button
        type="button"
        className="icon-btn home__theme"
        onClick={toggleTheme}
        aria-label={resolvedTheme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
      >
        <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>

      <div className="home__inner">
        <h1 className="home__name" aria-label={NAME}>
          {NAME.split('').map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              initial={{ opacity: 0, y: m.reduced ? 0 : 14, filter: m.reduced ? 'none' : 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={m.t(1.1, { delay: 0.25 + i * 0.07 * m.factor })}
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        <motion.span
          className="home__rule"
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={m.t(1.4, { delay: 0.9 * m.factor })}
        />

        <motion.p
          className="home__intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={m.t(1.2, { delay: 1.3 * m.factor })}
        >
          Um lugar feito devagar, para ser percorrido no seu tempo.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={m.t(1, { delay: 1.8 * m.factor })}>
          <Link to="/sumario" className="home__enter">
            <span>Entrar</span>
            <span className="home__enter-line" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
