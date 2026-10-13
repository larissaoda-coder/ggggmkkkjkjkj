import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { sections } from '../../app/sections';
import { useSettings } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { Icon } from '../Icon';

export function TopNav() {
  const { settings, resolvedTheme, toggleTheme } = useSettings();
  const { secretFound } = useProgress();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const compact = !settings.navLabels;

  const primary = sections.filter((s) => s.primary);
  const experiences = sections.filter((s) => !s.primary && s.group === 'experiencias');
  const settingsSection = sections.find((s) => s.id === 'ajustes')!;
  const inExperiences = experiences.some((s) => location.pathname.startsWith(s.path));

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="top-nav">
      <nav className="top-nav__inner" aria-label="Navegação principal">
        <Link to="/" className="top-nav__brand" aria-label="Início — Annelise">
          Annelise
        </Link>
        <div className="top-nav__items">
          <NavLink to="/sumario" className="top-nav__item" title={compact ? 'Sumário' : undefined}>
            <Icon name="index" size={18} />
            <span className="top-nav__label">Sumário</span>
          </NavLink>
          {primary.map((s) => (
            <NavLink key={s.id} to={s.path} className="top-nav__item" title={compact ? s.label : undefined}>
              <Icon name={s.icon} size={18} />
              <span className="top-nav__label">{s.label}</span>
            </NavLink>
          ))}
          <div className="top-nav__menu-wrap">
            <button
              ref={buttonRef}
              type="button"
              className={`top-nav__item${inExperiences ? ' active' : ''}`}
              aria-expanded={open}
              aria-controls="menu-experiencias"
              onClick={() => setOpen((o) => !o)}
            >
              <Icon name="more" size={18} />
              <span className="top-nav__label">Experiências</span>
            </button>
            {open && (
              <div className="top-nav__menu" id="menu-experiencias" ref={menuRef}>
                {experiences.map((s) => (
                  <NavLink key={s.id} to={s.path} className="top-nav__menu-item">
                    <Icon name={s.icon} size={18} />
                    <span>
                      <span className="top-nav__menu-title">{s.label}</span>
                      <span className="top-nav__menu-desc">{s.description}</span>
                    </span>
                  </NavLink>
                ))}
                {secretFound && (
                  <NavLink to="/observatorio" className="top-nav__menu-item">
                    <Icon name="star" size={18} />
                    <span>
                      <span className="top-nav__menu-title">Observatório</span>
                      <span className="top-nav__menu-desc">Um lugar encontrado por acaso.</span>
                    </span>
                  </NavLink>
                )}
              </div>
            )}
          </div>
          <NavLink to={settingsSection.path} className="top-nav__item" title={compact ? 'Ajustes' : undefined}>
            <Icon name="settings" size={18} />
            <span className="top-nav__label">Ajustes</span>
          </NavLink>
          <button
            type="button"
            className="icon-btn icon-btn--small"
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          >
            <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </nav>
    </header>
  );
}
