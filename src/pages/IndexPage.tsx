import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sections, groupLabels, SECRET_PATH, type Group } from '../app/sections';
import { useMotion } from '../context/SettingsContext';
import { useProgress } from '../context/ProgressContext';
import { useSecretUnlocked } from '../lib/useSecret';
import { Postmark, Tape } from '../components/Ornaments';
import './index-page.css';

export default function IndexPage() {
  const m = useMotion();
  const { milestones } = useProgress();
  const unlocked = useSecretUnlocked();
  const groups: Group[] = ['ler', 'ver', 'ouvir', 'explorar', 'pausar'];
  let n = 0;

  return (
    <div className="page index">
      <header className="index__head">
        <span className="area-mark">Índice geral</span>
        <h1 className="index__title">Cada parte pode ser aberta separadamente.</h1>
        <p className="index__lede">Não há ordem obrigatória. O que você já viu fica marcado.</p>
        <Postmark
          className="index__postmark"
          top="ÍNDICE GERAL"
          bottom="CORREIO PARTICULAR"
          center="N.º 2"
          waves
          rotate={-7}
          size={96}
        />
      </header>

      <div className="index__groups">
        {groups.map((g, gi) => (
          <motion.section
            key={g}
            className="index__group torn-shadow"
            style={{ ['--tilt' as string]: `${gi % 2 ? 0.5 : -0.45}deg` }}
            initial={{ opacity: 0, y: m.reduced ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={m.t(0.7, { delay: 0.15 + gi * 0.12 * m.factor })}
          >
            <Tape className="index__tape" rotate={gi % 2 ? 3 : -4} />
            <div className="index__card sheet torn-y">
              <h2 className="index__group-label">{groupLabels[g]}</h2>
              <ol className="index__list">
                {sections
                  .filter((s) => s.group === g)
                  .map((s) => {
                    n += 1;
                    return (
                      <li key={s.id}>
                        <Link to={s.path} className="index__item">
                          <span className="index__num num">N.º {String(n).padStart(2, '0')}</span>
                          <span className="index__body">
                            <span className="index__name">{s.title}</span>
                            <span className="index__desc">{s.description}</span>
                          </span>
                          {milestones.includes(s.id) && <span className="index__seen">Visto</span>}
                        </Link>
                      </li>
                    );
                  })}
              </ol>
            </div>
          </motion.section>
        ))}
      </div>

      <p className="index__last">
        {unlocked ? (
          <Link to={SECRET_PATH} className="index__secret">
            Antes de sair
          </Link>
        ) : (
          <span className="meta">Há uma última página. Ela aparece aqui depois que algumas partes forem vistas.</span>
        )}
      </p>
    </div>
  );
}
