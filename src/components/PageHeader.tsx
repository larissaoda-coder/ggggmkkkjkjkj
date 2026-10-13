import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Usa o tamanho "display" para o título. */
  large?: boolean;
}

export function PageHeader({ eyebrow, title, description, actions, large }: Props) {
  return (
    <header className="page-head">
      {(eyebrow || actions) && (
        <div className="page-head__top">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : <span />}
          {actions && <div className="page-head__actions">{actions}</div>}
        </div>
      )}
      <h1 className={large ? 'display' : 'title'}>{title}</h1>
      {description && <p className="page-head__desc">{description}</p>}
    </header>
  );
}
