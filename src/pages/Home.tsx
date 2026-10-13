import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotion, useSettings } from '../context/SettingsContext';
import { Icon } from '../components/Icon';
import './home.css';

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

      <motion.div
        className="home__inner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={m.t(1.2, { delay: 0.2 * m.factor })}
      >
        <h1 className="home__name">Annelise</h1>
        <p className="home__intro">Escrevi uma carta para você.</p>
        <Link to="/carta" className="btn btn--solid home__enter">
          Ler a carta
        </Link>
      </motion.div>
    </div>
  );
}
