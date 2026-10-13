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
        <h1 className="title">{chunk ? 'A página não carregou.' : 'A página apresentou um erro.'}</h1>
        <div className="row-actions">
          <button type="button" className="btn btn--solid" onClick={() => window.location.reload()}>
            Recarregar
          </button>
          <Link to="/carta" className="btn">
            Ir para a carta
          </Link>
        </div>
      </div>
    );
  }
}
