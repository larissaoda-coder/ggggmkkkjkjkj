import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page page--narrow empty-state">
      <h1 className="title">Página não encontrada.</h1>
      <div className="row-actions">
        <Link className="btn btn--solid" to="/carta">
          Ir para a carta
        </Link>
      </div>
    </div>
  );
}
