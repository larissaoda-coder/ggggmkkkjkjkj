import { Link, NavLink } from 'react-router-dom';
import { sections } from '../app/sections';
import { useSettings } from '../context/SettingsContext';
import { Icon } from './Icon';

/** Barra superior no computador, barra inferior no celular. */
export function Nav() {
  const { resolvedTheme, toggleTheme } = useSettings();
  return (
    <nav className="nav" aria-label="Navegação">
      <Link to="/" className="nav__brand">
        Annelise
      </Link>
      <div className="nav__links">
        {sections.map((s) => (
          <NavLink key={s.id} to={s.path} className="nav__item">
            <Icon name={s.icon} size={20} />
            <span>{s.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className="nav__item"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
        >
          <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={20} />
          <span>{resolvedTheme === 'dark' ? 'Claro' : 'Escuro'}</span>
        </button>
      </div>
    </nav>
  );
}
