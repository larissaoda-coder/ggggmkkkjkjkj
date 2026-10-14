import { useEffect, useMemo, useState } from 'react';
import { useContent } from '../../content/ContentContext';
import type { DictEntry } from '../../content/types';
import { useProgress } from '../../context/ProgressContext';
import { EmptyState } from '../../components/EmptyState';
import './dictionary.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const initial = (w: string) => fold(w.trim()).charAt(0).toUpperCase();

export default function DictionaryPage() {
  const { content } = useContent();
  const { lastWord, setLastWord, mark } = useProgress();
  const [query, setQuery] = useState('');

  const entries = useMemo(
    () =>
      content.dictionary
        .filter((e) => e.word.trim())
        .sort((a, b) => a.word.localeCompare(b.word, 'pt-BR', { sensitivity: 'base' })),
    [content.dictionary],
  );
  const q = fold(query.trim());
  const shown = q ? entries.filter((e) => fold(`${e.word} ${e.definition} ${e.example}`).includes(q)) : entries;
  const groups = useMemo(() => {
    const map = new Map<string, DictEntry[]>();
    shown.forEach((e) => {
      const k = initial(e.word);
      map.set(k, [...(map.get(k) ?? []), e]);
    });
    return map;
  }, [shown]);
  const available = new Set(entries.map((e) => initial(e.word)));

  useEffect(() => {
    if (!entries.length) return;
    const id = window.setTimeout(() => mark('dicionario'), 12000);
    return () => window.clearTimeout(id);
  }, [entries.length, mark]);

  const choose = (id: string) => {
    setLastWord(id);
    mark('dicionario');
  };

  return (
    <div className="page dictionary">
      <header className="dictionary__head">
        <h1 className="dictionary__title">Termos particulares</h1>
        <p className="dictionary__desc">Palavras e definições inspiradas nas características que reconheço em você.</p>
      </header>

      {entries.length === 0 ? (
        <EmptyState text="Nenhum termo foi registrado ainda." adminTab="dicionario" />
      ) : (
        <>
          <div className="dictionary__tools">
            <label className="dictionary__search">
              <span className="visually-hidden">Procurar um termo</span>
              <input
                type="search"
                placeholder="Procurar um termo"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <nav className="dictionary__letters" aria-label="Letras">
              {ALPHABET.map((l) =>
                available.has(l) && (!q || groups.has(l)) ? (
                  <a
                    key={l}
                    href={`#letra-${l}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(`letra-${l}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    {l}
                  </a>
                ) : (
                  <span key={l} aria-hidden="true">
                    {l}
                  </span>
                ),
              )}
            </nav>
            <p className="dictionary__hint">Toque num verbete para marcá-lo.</p>
          </div>

          {shown.length === 0 ? (
            <p className="dictionary__none">Nenhum termo encontrado para “{query.trim()}”.</p>
          ) : (
            <div className="dictionary__body">
              {[...groups.entries()].map(([letter, list]) => (
                <section
                  key={letter}
                  id={`letra-${letter}`}
                  className="dictionary__group"
                  aria-label={`Letra ${letter}`}
                >
                  <h2 className="dictionary__letter">{letter}</h2>
                  <dl className="dictionary__list">
                    {list.map((e) => (
                      <div
                        key={e.id}
                        className="entry"
                        data-marked={lastWord === e.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={lastWord === e.id}
                        onClick={() => choose(e.id)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            choose(e.id);
                          }
                        }}
                      >
                        <dt>
                          <span className="entry__word">{e.word}</span>
                          {e.grammar && <span className="entry__grammar">{e.grammar}</span>}
                        </dt>
                        <dd>
                          <p className="entry__def">{e.definition}</p>
                          {e.example && <p className="entry__example">{e.example}</p>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
