import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page page--narrow empty-state">
      <p className="eyebrow">Fora do mapa</p>
      <h1 className="title">Este endereço não leva a lugar nenhum.</h1>
      <p className="lede">Talvez o link esteja incompleto. O sumário mostra todos os caminhos disponíveis.</p>
      <div className="row-actions">
        <Link className="btn btn--solid" to="/sumario">
          Ir ao sumário
        </Link>
        <Link className="btn" to="/">
          Início
        </Link>
      </div>
    </div>
  );
}
