import { NavLink, Link } from 'react-router-dom';
import { sections, groupLabels, type SectionGroup } from '../../app/sections';
import { useSettings } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { Icon } from '../Icon';

export function SideNav() {
  const { settings, resolvedTheme, toggleTheme } = useSettings();
  const { secretFound } = useProgress();
  const compact = !settings.navLabels;
  const groups: SectionGroup[] = ['leitura', 'experiencias', 'espaco'];

  return (
    <nav className="side-nav" data-compact={compact} aria-label="Navegação principal">
      <Link to="/" className="side-nav__brand" aria-label="Início — Annelise">
        {compact ? <span aria-hidden="true">A</span> : 'Annelise'}
      </Link>

      <NavLink to="/sumario" className="side-nav__item side-nav__item--index" title={compact ? 'Sumário' : undefined}>
        <Icon name="index" />
        <span className="side-nav__label">Sumário</span>
      </NavLink>

      {groups.map((g) => (
        <div className="side-nav__group" key={g} role="group" aria-label={groupLabels[g]}>
          {!compact && <p className="side-nav__group-label eyebrow">{groupLabels[g]}</p>}
          {sections
            .filter((s) => s.group === g)
            .map((s) => (
              <NavLink key={s.id} to={s.path} className="side-nav__item" title={compact ? s.label : undefined}>
                <Icon name={s.icon} />
                <span className="side-nav__label">{s.label}</span>
              </NavLink>
            ))}
        </div>
      ))}

      <div className="side-nav__foot">
        {secretFound && (
          <NavLink to="/observatorio" className="side-nav__item side-nav__item--secret" title="Observatório">
            <Icon name="star" />
            <span className="side-nav__label">Observatório</span>
          </NavLink>
        )}
        <button
          type="button"
          className="side-nav__item"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          title={compact ? (resolvedTheme === 'dark' ? 'Tema claro' : 'Tema escuro') : undefined}
        >
          <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} />
          <span className="side-nav__label">{resolvedTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
        </button>
      </div>
    </nav>
  );
}
