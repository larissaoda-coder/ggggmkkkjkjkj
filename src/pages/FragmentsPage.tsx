import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fragments } from '../data/fragments';
import { useMotion } from '../context/SettingsContext';
import { usePersistentState } from '../lib/usePersistentState';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import './fragments.css';

export interface FragmentsRead {
  read: number[];
  last: number | null;
}
export const initialFragmentsRead: FragmentsRead = { read: [], last: null };

export default function FragmentsPage() {
  const m = useMotion();
  const [state] = usePersistentState<FragmentsRead>('fragments', initialFragmentsRead);

  return (
    <div className="page fragments">
      <PageHeader title="Dez fragmentos" />

      <ol className="fragment-grid">
        {fragments.map((f, i) => {
          const read = state.read.includes(f.number);
          const last = state.last === f.number;
          return (
            <motion.li
              key={f.number}
              initial={{ opacity: 0, y: m.reduced ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={m.t(0.5, { delay: i * 0.045 * m.factor })}
            >
              <Link
                to={`/fragmentos/${f.number}`}
                className="fragment-card"
                data-read={read}
                data-last={last}
                aria-label={`Fragmento ${f.number}${read ? ' (já aberto)' : ''}`}
              >
                <span className="fragment-card__num num">{f.number}</span>
                <span className="fragment-card__foot">
                  <span>{last ? 'Aberto por último' : read ? 'Lido' : 'Abrir'}</span>
                  <Icon name="arrow-right" size={16} />
                </span>
              </Link>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
