import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface State {
  error: Error | null;
}

/** Evita que uma falha numa seção derrube o aplicativo inteiro. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunk = /dynamically imported module|Loading chunk|Failed to fetch/i.test(this.state.error.message);
    return (
      <div className="page page--narrow empty-state" role="alert">
        <p className="eyebrow">Algo não saiu como esperado</p>
        <h1 className="title">{chunk ? 'Esta seção não carregou.' : 'Esta seção encontrou um problema.'}</h1>
        <p className="lede">
          {chunk
            ? 'Talvez a conexão tenha oscilado. Tente recarregar a página.'
            : 'O restante do espaço continua disponível. Você pode tentar novamente ou seguir por outro caminho.'}
        </p>
        <div className="row-actions">
          <button type="button" className="btn btn--solid" onClick={() => window.location.reload()}>
            Recarregar
          </button>
          <Link to="/sumario" className="btn">
            Ir ao sumário
          </Link>
        </div>
      </div>
    );
  }
}
