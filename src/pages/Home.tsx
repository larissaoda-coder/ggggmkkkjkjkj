import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMotion } from '../context/SettingsContext';
import { useContent } from '../content/ContentContext';
import { Lace, Postmark, Stamp, Tape, engravings } from '../components/Ornaments';
import './home.css';

export default function Home() {
  const m = useMotion();
  const { content } = useContent();
  const { title, subtitle, footer } = content.home;
  const fade = (delay: number, y = 10) => ({
    initial: { opacity: 0, y: m.reduced ? 0 : y },
    animate: { opacity: 1, y: 0 },
    transition: m.t(1.1, { delay: delay * m.factor }),
  });

  return (
    <div className="home">
      <div className="home__stage">
        <motion.div
          className="home__piece torn-shadow"
          initial={{ opacity: 0, y: m.reduced ? 0 : 24, rotate: m.reduced ? -1 : -3 }}
          animate={{ opacity: 1, y: 0, rotate: -1 }}
          transition={m.t(1.2, { delay: 0.15 * m.factor })}
        >
          <div className="home__sheet sheet torn-y">
            <motion.span className="home__eyebrow" {...fade(0.6)}>
              N.º 01 · Correspondência particular
            </motion.span>
            <motion.h1 className="home__title" {...fade(0.8, 14)}>
              {title}
            </motion.h1>
            <motion.div className="home__lace" {...fade(1.2, 0)}>
              <Lace />
            </motion.div>
            <motion.p className="home__subtitle" {...fade(1.4)}>
              {subtitle}
            </motion.p>
            <motion.div {...fade(1.8)}>
              <Link to="/indice" className="home__enter">
                Entrar
              </Link>
            </motion.div>
          </div>
          <Tape className="home__tape home__tape--l" rotate={-32} />
          <Tape className="home__tape home__tape--r" rotate={28} />
        </motion.div>

        <motion.div className="home__stamp" {...fade(1.0, 0)}>
          <Stamp art={engravings.lotus} label="Correio particular" value="1" rotate={6} />
        </motion.div>
        <motion.div className="home__mark home__mark--a" {...fade(1.3, 0)}>
          <Postmark top="CORREIO PARTICULAR" bottom="PRIMEIRA EDIÇÃO" center="N.º 1" waves rotate={-9} size={104} />
        </motion.div>
        <motion.div className="home__mark home__mark--b" {...fade(1.6, 0)}>
          <Postmark top="PARA LER" bottom="COM CALMA" center="✶" tone="red" rotate={14} size={92} />
        </motion.div>
      </div>

      <motion.p className="home__footer script" {...fade(2.2, 0)}>
        {footer}
      </motion.p>
    </div>
  );
}
