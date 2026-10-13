import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { sections } from '../../app/sections';
import { useSettings, useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { Icon } from '../Icon';

export function BottomNav() {
  const { settings, resolvedTheme, toggleTheme } = useSettings();
  const { secretFound } = useProgress();
  const motionCfg = useMotion();
  const [sheet, setSheet] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const moreRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const primary = sections.filter((s) => s.primary);
  const secondary = sections.filter((s) => !s.primary);
  const inSecondary = secondary.some((s) => location.pathname.startsWith(s.path)) || location.pathname === '/sumario';

  useEffect(() => setSheet(false), [location.pathname]);

  // Preferência: esconder a barra ao rolar para baixo.
  useEffect(() => {
    if (!settings.mobileNavAutoHide) {
      setHidden(false);
      return;
    }
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 8) return;
      setHidden(y > last && y > 80);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [settings.mobileNavAutoHide]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheet(false);
        moreRef.current?.focus();
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const items = sheetRef.current.querySelectorAll<HTMLElement>('a, button');
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    sheetRef.current?.querySelector<HTMLElement>('a')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [sheet]);

  return (
    <>
      <nav className="bottom-nav" data-hidden={hidden && !sheet} aria-label="Navegação principal">
        {primary.map((s) => (
          <NavLink key={s.id} to={s.path} className="bottom-nav__item">
            <Icon name={s.icon} size={22} />
            {settings.navLabels && <span className="bottom-nav__label">{s.label}</span>}
            {!settings.navLabels && <span className="visually-hidden">{s.label}</span>}
          </NavLink>
        ))}
        <button
          ref={moreRef}
          type="button"
          className={`bottom-nav__item${inSecondary || sheet ? ' active' : ''}`}
          aria-expanded={sheet}
          aria-controls="mais-secoes"
          onClick={() => setSheet((v) => !v)}
        >
          <Icon name={sheet ? 'close' : 'more'} size={22} />
          {settings.navLabels ? (
            <span className="bottom-nav__label">Mais</span>
          ) : (
            <span className="visually-hidden">Mais seções</span>
          )}
        </button>
      </nav>

      <AnimatePresence>
        {sheet && (
          <>
            <motion.div
              className="sheet-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={motionCfg.t(0.25)}
              onClick={() => setSheet(false)}
            />
            <motion.div
              ref={sheetRef}
              id="mais-secoes"
              className="sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Mais seções"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={motionCfg.t(0.4)}
            >
              <div className="sheet__handle" aria-hidden="true" />
              <div className="sheet__row">
                <Link to="/" className="sheet__chip">
                  <Icon name="home" size={18} /> Início
                </Link>
                <Link to="/sumario" className="sheet__chip">
                  <Icon name="index" size={18} /> Sumário
                </Link>
                <button type="button" className="sheet__chip" onClick={toggleTheme}>
                  <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={18} />
                  {resolvedTheme === 'dark' ? 'Claro' : 'Escuro'}
                </button>
              </div>
              <ul className="sheet__list">
                {secondary.map((s) => (
                  <li key={s.id}>
                    <NavLink to={s.path} className="sheet__item">
                      <Icon name={s.icon} size={20} />
                      <span>
                        <span className="sheet__title">{s.label}</span>
                        <span className="sheet__desc">{s.description}</span>
                      </span>
                    </NavLink>
                  </li>
                ))}
                {secretFound && (
                  <li>
                    <NavLink to="/observatorio" className="sheet__item">
                      <Icon name="star" size={20} />
                      <span>
                        <span className="sheet__title">Observatório</span>
                        <span className="sheet__desc">Um lugar encontrado por acaso.</span>
                      </span>
                    </NavLink>
                  </li>
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
