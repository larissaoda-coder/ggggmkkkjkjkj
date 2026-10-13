import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sections } from '../app/sections';
import { useMotion } from '../context/SettingsContext';
import { useProgress } from '../context/ProgressContext';
import { Icon } from '../components/Icon';
import './index-page.css';

export default function IndexPage() {
  const m = useMotion();
  const { visited } = useProgress();
  const [letter, ...rest] = sections;

  return (
    <div className="page index-page">
      <header className="page-head">
        <p className="eyebrow">Sumário</p>
        <h1 className="display">Por onde quiser.</h1>
        <p className="page-head__desc">
          Nada aqui precisa ser percorrido em ordem, nem até o fim. Cada parte guarda o próprio ritmo.
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: m.reduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={m.t(0.6, { delay: 0.1 * m.factor })}
      >
        <Link to={letter.path} className="index-feature">
          <span className="index-feature__num num">01</span>
          <span className="index-feature__body">
            <span className="eyebrow">{letter.title}</span>
            <span className="index-feature__title">A carta</span>
            <span className="index-feature__desc">{letter.description}</span>
          </span>
          <span className="index-feature__envelope" aria-hidden="true">
            <svg viewBox="0 0 120 76" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="119" height="75" />
              <path d="M0.5 0.5 60 44l59.5-43.5" />
            </svg>
          </span>
        </Link>
      </motion.div>

      <ol className="index-list">
        {rest.map((s, i) => (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, y: m.reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={m.t(0.5, { delay: (0.18 + i * 0.05) * m.factor })}
          >
            <Link to={s.path} className="index-item">
              <span className="index-item__num num">{String(i + 2).padStart(2, '0')}</span>
              <span className="index-item__body">
                <span className="index-item__title">{s.title}</span>
                <span className="index-item__desc">{s.description}</span>
              </span>
              <span className="index-item__meta">
                {visited.includes(s.id) && (
                  <span className="index-item__seen" title="Já visitado" aria-label="já visitado" />
                )}
                <Icon name="arrow-right" size={18} />
              </span>
            </Link>
          </motion.li>
        ))}
      </ol>

      <p className="meta index-note">
        Preferências e progresso ficam guardados apenas neste navegador. Nada é enviado a lugar algum.
      </p>
    </div>
  );
}
