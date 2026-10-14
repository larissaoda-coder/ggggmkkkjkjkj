import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useContent } from '../../content/ContentContext';
import type { Star, StarCategory } from '../../content/types';
import { fragments } from '../../data/fragments';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { usePersistentState } from '../../lib/usePersistentState';
import { MediaImg } from '../../components/MediaImg';
import { Icon } from '../../components/Icon';
import './atlas.css';

const categoryLabels: Record<StarCategory, string> = {
  memoria: 'Memória',
  musica: 'Música',
  texto: 'Texto',
  pergunta: 'Pergunta',
};

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export default function AtlasPage() {
  const { content } = useContent();
  const { starsOpened, openStar, mark } = useProgress();
  const m = useMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<StarCategory | null>(null);
  const [answers, setAnswers] = usePersistentState<Record<string, string>>('mapa:respostas', {});

  // Estrelas que dependem de material ausente (foto, música) ficam ocultas.
  const stars = useMemo(
    () =>
      content.stars.filter((s) => {
        if (s.kind === 'foto')
          return Boolean(s.photoId ? content.photos.some((p) => p.id === s.photoId) : content.photos.length);
        if (s.kind === 'musica')
          return Boolean(s.trackId ? content.tracks.some((t) => t.id === s.trackId) : content.tracks.length);
        return true;
      }),
    [content.stars, content.photos, content.tracks],
  );
  const regular = stars.filter((s) => s.kind !== 'segredo');
  const regularOpened = regular.filter((s) => starsOpened.includes(s.id)).length;
  const secretReady = regularOpened >= regular.length;
  const allDone = stars.length > 0 && stars.every((s) => starsOpened.includes(s.id));

  const dust = useMemo(() => {
    const r = seeded(11);
    return Array.from({ length: 140 }, () => ({ x: r() * 100, y: r() * 100, r: 0.05 + r() * 0.14, d: r() * 6 }));
  }, []);

  const choose = (s: Star) => {
    if (s.kind === 'segredo' && !secretReady) {
      setSelected(s.id);
      return;
    }
    setSelected(s.id);
    openStar(s.id);
    if (regularOpened + 1 >= 3 || starsOpened.length + 1 >= 3) mark('atlas');
  };

  const current = stars.find((s) => s.id === selected) ?? null;

  const renderContent = (s: Star) => {
    if (s.kind === 'segredo' && !secretReady)
      return <p className="atlas__locked">Esta estrela acende depois que as outras forem abertas.</p>;
    switch (s.kind) {
      case 'foto': {
        const photo = content.photos.find((p) => p.id === s.photoId) ?? content.photos[0];
        return photo ? (
          <figure className="atlas__photo">
            <MediaImg src={photo.src} alt={photo.caption || 'Fotografia'} />
            {(photo.caption || s.body) && <figcaption>{s.body || photo.caption}</figcaption>}
          </figure>
        ) : null;
      }
      case 'texto': {
        const fragment = s.fragment ? fragments.find((f) => f.number === s.fragment) : null;
        return (
          <div className="atlas__text">
            {fragment && <span className="atlas__ref">Fragmento {fragment.number}</span>}
            <p>{fragment ? fragment.text : s.body}</p>
          </div>
        );
      }
      case 'musica': {
        const track = content.tracks.find((t) => t.id === s.trackId) ?? content.tracks[0];
        return track ? (
          <div className="atlas__music">
            <span className="atlas__ref">{track.artist}</span>
            <p className="atlas__track">{track.title}</p>
            {(s.body || track.note) && <p>{s.body || track.note}</p>}
            <Link to={`/radio?faixa=${track.id}`} className="link-btn">
              Ouvir em Faixas selecionadas <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        ) : null;
      }
      case 'pergunta':
        return (
          <div className="atlas__question">
            <p>{s.body}</p>
            <label className="atlas__answer">
              <span className="meta">
                Se quiser responder para você mesma, escreva aqui. Fica guardado só neste aparelho.
              </span>
              <textarea
                id={`resp-${s.id}`}
                value={answers[s.id] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [s.id]: e.target.value }))}
                rows={3}
              />
            </label>
          </div>
        );
      default:
        return <p className="atlas__letter">{s.body}</p>;
    }
  };

  return (
    <div className="atlas">
      <header className="atlas__head">
        <h1 className="atlas__title">Pontos de referência</h1>
        <p className="atlas__desc">Escolha uma estrela para abrir o conteúdo associado a ela.</p>
        <div className="atlas__filters" role="group" aria-label="Categorias">
          {(Object.keys(categoryLabels) as StarCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={filter === c}
              onClick={() => setFilter(filter === c ? null : c)}
            >
              <span className={`atlas__dot atlas__dot--${c}`} aria-hidden="true" />
              {categoryLabels[c]}
            </button>
          ))}
        </div>
      </header>

      <div className="atlas__sky">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="atlas__svg" aria-hidden="true">
          {dust.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} className="atlas__dust" style={{ animationDelay: `${-d.d}s` }} />
          ))}
          {stars.slice(1).map((s, i) => {
            const a = stars[i];
            const lit = starsOpened.includes(a.id) && starsOpened.includes(s.id);
            return <line key={s.id} x1={a.x} y1={a.y} x2={s.x} y2={s.y} className="atlas__line" data-lit={lit} />;
          })}
        </svg>
        {stars.map((s, i) => {
          const opened = starsOpened.includes(s.id);
          const locked = s.kind === 'segredo' && !secretReady;
          const dim = filter !== null && s.category !== filter;
          return (
            <motion.button
              key={s.id}
              type="button"
              className="atlas__star"
              data-opened={opened}
              data-locked={locked}
              data-dim={dim}
              data-active={selected === s.id}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              onClick={() => choose(s)}
              initial={{ opacity: 0, scale: m.reduced ? 1 : 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={m.t(0.9, { delay: 0.2 + i * 0.09 * m.factor })}
              aria-label={`${s.title} — ${categoryLabels[s.category]}${opened ? ', já aberta' : ''}${locked ? ', ainda apagada' : ''}`}
            >
              <span className="atlas__glow" aria-hidden="true" />
              <span className="atlas__core" aria-hidden="true" />
              <span className="atlas__label">{s.title}</span>
            </motion.button>
          );
        })}
      </div>

      <p className="atlas__count num" aria-live="polite">
        {allDone
          ? 'Você percorreu todas as etapas deste mapa.'
          : `${starsOpened.filter((id) => stars.some((s) => s.id === id)).length} de ${stars.length} abertas`}
      </p>

      <AnimatePresence>
        {current && (
          <motion.aside
            key={current.id}
            className="atlas__panel"
            role="dialog"
            aria-label={current.title}
            initial={{ opacity: 0, y: m.reduced ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: m.reduced ? 0 : 20 }}
            transition={m.t(0.45)}
          >
            <div className="atlas__panel-head">
              <span className="atlas__ref">{categoryLabels[current.category]}</span>
              <button type="button" className="atlas__close" onClick={() => setSelected(null)}>
                Fechar <Icon name="close" size={14} />
              </button>
            </div>
            <h2 className="atlas__panel-title">{current.title}</h2>
            {renderContent(current)}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
