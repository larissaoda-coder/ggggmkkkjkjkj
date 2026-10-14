import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { sections, groupLabels, SECRET_PATH, type Group } from '../app/sections';
import { useMotion, useSettings, type ThemePref } from '../context/SettingsContext';
import { useSecretUnlocked } from '../lib/useSecret';
import { useCanAdmin } from '../content/useCanAdmin';
import { Icon } from './Icon';

/** Menu recolhível, igual no celular e no computador. */
export function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const m = useMotion();
  const { prefs, update } = useSettings();
  const unlocked = useSecretUnlocked();
  const canAdmin = useCanAdmin();
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const groups: Group[] = ['ler', 'ver', 'ouvir', 'explorar', 'pausar'];

  useEffect(() => {
    if (open) onClose();
    // fecha ao navegar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const themes: { value: ThemePref; label: string }[] = [
    { value: 'sistema', label: 'Sistema' },
    { value: 'claro', label: 'Claro' },
    { value: 'escuro', label: 'Escuro' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          ref={panelRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={m.t(0.35)}
        >
          <div className="menu__top">
            <Link to="/indice" className="menu__brand">
              Para Annelise
            </Link>
            <button type="button" className="menu__close" onClick={onClose}>
              Fechar <Icon name="close" size={18} />
            </button>
          </div>
          <nav className="menu__groups" aria-label="Áreas">
            {groups.map((g, gi) => (
              <motion.section
                key={g}
                className="menu__group"
                initial={{ opacity: 0, y: m.reduced ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={m.t(0.5, { delay: 0.05 + gi * 0.06 * m.factor })}
              >
                <h2 className="menu__group-label">{groupLabels[g]}</h2>
                <ul>
                  {sections
                    .filter((s) => s.group === g)
                    .map((s) => (
                      <li key={s.id}>
                        <NavLink to={s.path} className="menu__link">
                          {s.title}
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </motion.section>
            ))}
            {unlocked && (
              <section className="menu__group">
                <h2 className="menu__group-label">Por último</h2>
                <ul>
                  <li>
                    <NavLink to={SECRET_PATH} className="menu__link">
                      Antes de sair
                    </NavLink>
                  </li>
                </ul>
              </section>
            )}
          </nav>
          <div className="menu__prefs" role="group" aria-label="Preferências">
            <div className="menu__pref">
              <span className="eyebrow">Tema</span>
              <div className="menu__seg" role="radiogroup" aria-label="Tema">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={prefs.theme === t.value}
                    onClick={() => update({ theme: t.value })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="menu__pref menu__check">
              <input
                type="checkbox"
                checked={prefs.reduceMotion}
                onChange={(e) => update({ reduceMotion: e.target.checked })}
              />
              <span>Reduzir movimento</span>
            </label>
            <label className="menu__pref menu__check">
              <input type="checkbox" checked={prefs.sound} onChange={(e) => update({ sound: e.target.checked })} />
              <span>Sons do jardim</span>
            </label>
            <label className="menu__pref menu__check">
              <input
                type="checkbox"
                checked={prefs.largeText}
                onChange={(e) => update({ largeText: e.target.checked })}
              />
              <span>Texto maior</span>
            </label>
            {canAdmin && (
              <Link to="/admin" className="menu__admin">
                Administração
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
