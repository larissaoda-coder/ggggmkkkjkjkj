import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useCanAdmin } from '../content/useCanAdmin';
import { ADMIN_PATH } from '../app/sections';

/** Estado vazio elegante; quem administra vê um atalho para preencher. */
export function EmptyState({ text, adminTab, children }: { text: string; adminTab?: string; children?: ReactNode }) {
  const canAdmin = useCanAdmin();
  return (
    <div className="empty">
      <span className="empty__mark" aria-hidden="true" />
      <p className="empty__text">{text}</p>
      {children}
      {canAdmin && adminTab && (
        <Link to={`${ADMIN_PATH}?aba=${adminTab}`} className="empty__admin">
          Adicionar na administração
        </Link>
      )}
    </div>
  );
}
