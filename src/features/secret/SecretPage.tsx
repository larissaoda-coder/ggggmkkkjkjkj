import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContent } from '../../content/ContentContext';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { useSecretUnlocked } from '../../lib/useSecret';
import { sections } from '../../app/sections';
import { fragments } from '../../data/fragments';
import './secret.css';

const OPENING =
  'Se chegou até aqui, já viu boa parte do que preparei. Deixei esta página por último porque queria reservar um espaço para dizer algo sem distrações.';
const CLOSING =
  'Eu gostaria de ter a oportunidade de tentar novamente com você. Não espero que uma página resolva o que existe entre nós, nem que você tome uma decisão por causa dela. Só queria que soubesse que essa possibilidade ainda importa para mim.';

const excerpt = (t: string, n = 160) => (t.length > n ? `${t.slice(0, n).replace(/\s+\S*$/, '')}…` : t);

export default function SecretPage() {
  const { content, photo } = useContent();
  const { milestones, lastWord, lastStar, starsOpened } = useProgress();
  const unlocked = useSecretUnlocked();
  const m = useMotion();
  const [round, setRound] = useState(0);

  if (!unlocked) {
    const required = content.secret.requires
      .map((id) => sections.find((s) => s.id === id))
      .filter((s): s is (typeof sections)[number] => Boolean(s));
    return (
      <div className="page page--narrow secret secret--locked">
        <h1 className="secret__title">Antes de sair</h1>
        <p className="secret__text">Esta página aparece depois que algumas partes forem vistas.</p>
        <ul className="secret__req">
          {required.map((s) => {
            const done = milestones.includes(s.id);
            return (
              <li key={s.id} data-done={done}>
                <span className="secret__check" aria-hidden="true" />
                {done ? <span>{s.title}</span> : <Link to={s.path}>{s.title}</Link>}
                <span className="secret__how">{done ? 'Visto' : s.milestoneLabel}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  /* O que foi encontrado pelo caminho. */
  const word = content.dictionary.find((d) => d.id === lastWord) ?? content.dictionary[0];
  const star =
    content.stars.find((s) => s.id === lastStar && s.kind !== 'segredo') ??
    content.stars.find((s) => starsOpened.includes(s.id) && s.kind !== 'segredo');
  const starTrack = content.stars
    .filter((s) => s.kind === 'musica' && starsOpened.includes(s.id))
    .map((s) => content.tracks.find((t) => t.id === s.trackId))
    .find(Boolean);
  const track = starTrack ?? content.tracks[0];
  const starText = star
    ? star.kind === 'texto' && star.fragment
      ? (fragments.find((f) => f.number === star.fragment)?.text ?? star.body)
      : star.kind === 'foto' && star.photoId
        ? (photo(star.photoId)?.caption ?? star.body)
        : star.body
    : '';

  const fade = (i: number) => ({
    initial: { opacity: 0, y: m.reduced ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    transition: m.t(1, { delay: (0.3 + i * 0.5) * m.factor }),
  });

  return (
    <div className="page page--narrow secret" key={round}>
      <motion.span className="secret__eyebrow" {...fade(0)}>
        A última página
      </motion.span>
      <motion.h1 className="secret__title" {...fade(0)}>
        Antes de sair
      </motion.h1>
      <motion.p className="secret__text" {...fade(1)}>
        {OPENING}
      </motion.p>

      {(word || star || track) && (
        <motion.section className="secret__found" data-photo={false} aria-label="Pelo caminho" {...fade(2)}>
          <div className="secret__found-col">
            {word && (
              <div className="found">
                <span className="found__label">Um termo</span>
                <p className="found__word">
                  {word.word} {word.grammar && <em>{word.grammar}</em>}
                </p>
                <p className="found__text">{word.definition}</p>
              </div>
            )}
            {star && (
              <div className="found">
                <span className="found__label">Um ponto do mapa</span>
                <p className="found__word">{star.title}</p>
                {starText && <p className="found__text">{excerpt(starText)}</p>}
              </div>
            )}
            {track && (
              <div className="found">
                <span className="found__label">Uma faixa</span>
                <p className="found__word">{track.title}</p>
                {track.artist && <p className="found__text">{track.artist}</p>}
                <Link to={`/radio?faixa=${track.id}`} className="link-btn">
                  Ouvir
                </Link>
              </div>
            )}
          </div>
        </motion.section>
      )}

      <motion.span className="secret__rule" aria-hidden="true" {...fade(3)} />
      <motion.p className="secret__closing" {...fade(4)}>
        {CLOSING}
      </motion.p>

      <motion.div className="secret__actions" {...fade(5)}>
        <button
          type="button"
          className="btn"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: m.reduced ? 'auto' : 'smooth' });
            setRound((r) => r + 1);
          }}
        >
          Ler novamente
        </button>
      </motion.div>
    </div>
  );
}
