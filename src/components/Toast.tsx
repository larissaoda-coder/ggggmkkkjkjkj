import { AnimatePresence, motion } from 'framer-motion';
import { useMotion } from '../context/SettingsContext';

export function Toast({ message }: { message: string | null }) {
  const m = useMotion();
  return (
    <div aria-live="polite" className="visually-hidden-live">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            className="toast"
            initial={{ opacity: 0, y: 8, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 8, x: '-50%' }}
            transition={m.t(0.25)}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
