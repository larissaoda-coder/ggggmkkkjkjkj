import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContent, useMediaSrc } from '../../content/ContentContext';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { EmptyState } from '../../components/EmptyState';
import { shuffle } from '../oracle/cards';
import './puzzle.css';

interface Board {
  /** order[posição] = peça que está naquela posição */
  order: number[];
  /** rot[peça] = quartos de volta (0 = posição correta) */
  rot: number[];
}

function newBoard(n: number): Board {
  const count = n * n;
  let order = shuffle(Array.from({ length: count }, (_, i) => i));
  // Garante que o embaralhamento não deixe metade das peças já no lugar.
  for (let tries = 0; tries < 10 && order.filter((p, i) => p === i).length > Math.floor(count / 4); tries++) {
    order = shuffle(order);
  }
  const rot = Array.from({ length: count }, () => {
    const b = new Uint8Array(1);
    crypto.getRandomValues(b);
    return b[0] % 4;
  });
  return { order, rot };
}

export default function PuzzlePage() {
  const { content, photo } = useContent();
  const { mark } = useProgress();
  const m = useMotion();
  const pz = content.puzzle;
  const chosen = (pz.photoId && photo(pz.photoId)) || content.photos[0];
  const src = useMediaSrc(chosen?.src);
  const n = pz.size === 4 ? 4 : 3;

  const [phase, setPhase] = useState<'inicio' | 'montando' | 'concluido'>('inicio');
  const [board, setBoard] = useState<Board>(() => newBoard(n));
  const [selected, setSelected] = useState<number | null>(null); // posição
  const [peek, setPeek] = useState(false);
  const [drag, setDrag] = useState<{ pos: number; dx: number; dy: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; pos: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const correctAt = useCallback((b: Board, pos: number) => b.order[pos] === pos && b.rot[b.order[pos]] === 0, []);
  const placed = useMemo(() => board.order.filter((_, pos) => correctAt(board, pos)).length, [board, correctAt]);
  const total = n * n;

  // Uma peça que acabou de encaixar fica fixa e deixa de estar selecionada.
  useEffect(() => {
    if (selected !== null && correctAt(board, selected)) setSelected(null);
  }, [board, selected, correctAt]);

  useEffect(() => {
    if (phase === 'montando' && placed === total) {
      setSelected(null);
      const id = window.setTimeout(() => {
        setPhase('concluido');
        mark('quebra-cabeca');
      }, 450 * m.factor);
      return () => window.clearTimeout(id);
    }
  }, [phase, placed, total, mark, m.factor]);

  const start = () => {
    setBoard(newBoard(n));
    setSelected(null);
    setPeek(false);
    setPhase('montando');
  };

  const swap = (a: number, b: number) => {
    if (a === b || correctAt(board, a) || correctAt(board, b)) return;
    setBoard((cur) => {
      const order = [...cur.order];
      [order[a], order[b]] = [order[b], order[a]];
      return { ...cur, order };
    });
  };

  const rotate = (pos: number | null = selected) => {
    if (pos === null || correctAt(board, pos)) return;
    setBoard((cur) => {
      const rot = [...cur.rot];
      const piece = cur.order[pos];
      rot[piece] = (rot[piece] + 1) % 4;
      return { ...cur, rot };
    });
  };

  const tap = (pos: number) => {
    if (correctAt(board, pos)) return;
    if (selected === null) setSelected(pos);
    else if (selected === pos) setSelected(null);
    else {
      swap(selected, pos);
      setSelected(null);
    }
  };

  /* Arrastar: a peça segue o dedo/mouse e troca de lugar com a peça onde for solta. */
  const posFromPoint = (x: number, y: number) => {
    const r = boardRef.current?.getBoundingClientRect();
    if (!r || x < r.left || y < r.top || x > r.right || y > r.bottom) return null;
    const col = Math.min(n - 1, Math.floor(((x - r.left) / r.width) * n));
    const row = Math.min(n - 1, Math.floor(((y - r.top) / r.height) * n));
    return row * n + col;
  };
  const onDown = (e: RPointerEvent, pos: number) => {
    if (correctAt(board, pos) || e.button > 0) return;
    pointer.current = { id: e.pointerId, pos, x: e.clientX, y: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    const p = pointer.current;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.moved && Math.hypot(dx, dy) < 6) return;
    p.moved = true;
    setDrag({ pos: p.pos, dx, dy });
  };
  const onUp = (e: RPointerEvent) => {
    const p = pointer.current;
    if (!p || p.id !== e.pointerId) return;
    pointer.current = null;
    setDrag(null);
    if (!p.moved) return; // o clique é tratado pelo onClick
    // Evita que o clique que acompanha o fim do arraste selecione outra peça.
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 60);
    const target = posFromPoint(e.clientX, e.clientY);
    if (target !== null) swap(p.pos, target);
    setSelected(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'montando') return;
      if ((e.key === 'r' || e.key === 'R') && selected !== null) rotate();
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!chosen) {
    return (
      <div className="page puzzle">
        <header className="puzzle__head">
          <h1 className="puzzle__title">Uma imagem por partes</h1>
          <p className="puzzle__desc">Monte a imagem para revelar o conteúdo completo.</p>
        </header>
        <EmptyState text="Nenhuma imagem foi escolhida para esta parte ainda." adminTab="quebra-cabeca" />
      </div>
    );
  }

  const bg = src ? `url("${src}")` : undefined;

  return (
    <div className="page puzzle" data-phase={phase}>
      <header className="puzzle__head">
        <h1 className="puzzle__title">Uma imagem por partes</h1>
        <p className="puzzle__desc">Monte a imagem para revelar o conteúdo completo.</p>
      </header>

      <div className="puzzle__layout">
        <div className="puzzle__boardwrap">
          <div
            ref={boardRef}
            className="puzzle__board"
            style={{ ['--n' as string]: n }}
            data-done={phase === 'concluido'}
            role={phase === 'montando' ? 'grid' : undefined}
            aria-label={phase === 'montando' ? 'Peças da imagem' : undefined}
          >
            {phase === 'inicio' && (
              <div className="puzzle__cover">
                <span className="puzzle__cover-img" style={{ backgroundImage: bg }} aria-hidden="true" />
                <div className="puzzle__cover-text">
                  <span className="num">
                    {total} peças · {n}×{n}
                  </span>
                  <button type="button" className="btn btn--solid" onClick={start}>
                    Começar
                  </button>
                </div>
              </div>
            )}

            {phase !== 'inicio' &&
              board.order.map((piece, pos) => {
                const ok = correctAt(board, pos);
                const row = Math.floor(piece / n);
                const col = piece % n;
                const dragging = drag?.pos === pos;
                return (
                  <button
                    key={piece}
                    type="button"
                    className="piece"
                    data-piece={piece}
                    data-pos={pos}
                    data-ok={ok}
                    data-selected={selected === pos}
                    data-dragging={dragging}
                    disabled={phase !== 'montando'}
                    aria-label={`Peça na posição ${pos + 1}${ok ? ', no lugar certo' : ''}${selected === pos ? ', selecionada' : ''}`}
                    aria-pressed={selected === pos}
                    onClick={() => {
                      if (suppressClick.current) {
                        suppressClick.current = false;
                        return;
                      }
                      tap(pos);
                    }}
                    onPointerDown={(e) => onDown(e, pos)}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={() => {
                      pointer.current = null;
                      setDrag(null);
                    }}
                    onDoubleClick={() => rotate(pos)}
                    style={{
                      gridRow: Math.floor(pos / n) + 1,
                      gridColumn: (pos % n) + 1,
                      transform: dragging ? `translate(${drag.dx}px, ${drag.dy}px) scale(1.04)` : undefined,
                    }}
                  >
                    <span className="piece__rot" style={{ transform: `rotate(${board.rot[piece] * 90}deg)` }}>
                      <span
                        className="piece__img"
                        style={{
                          backgroundImage: bg,
                          width: `${n * 100}%`,
                          height: `${n * 100}%`,
                          left: `${-col * 100}%`,
                          top: `${-row * 100}%`,
                        }}
                      />
                    </span>
                  </button>
                );
              })}

            <AnimatePresence>
              {peek && phase === 'montando' && (
                <motion.span
                  className="puzzle__peek"
                  style={{ backgroundImage: bg }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={m.t(0.3)}
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <aside className="puzzle__side">
          {phase === 'montando' && (
            <>
              <div className="puzzle__progress">
                <div className="puzzle__bar" aria-hidden="true">
                  <span style={{ transform: `scaleX(${placed / total})` }} />
                </div>
                <span className="num" aria-live="polite">
                  {placed} de {total} peças no lugar
                </span>
              </div>
              <p className="puzzle__help">
                Arraste uma peça até outra para trocá-las de lugar, ou toque em duas peças seguidas. Selecione uma peça
                e use Girar peça para acertar a posição. Peças no lugar certo ficam fixas.
              </p>
              <div className="puzzle__actions">
                <button type="button" className="btn btn--solid" onClick={() => rotate()} disabled={selected === null}>
                  Girar peça
                </button>
                <button type="button" className="btn" aria-pressed={peek} onClick={() => setPeek((p) => !p)}>
                  {peek ? 'Voltar às peças' : 'Ver imagem completa'}
                </button>
                <button type="button" className="btn btn--ghost" onClick={start}>
                  Tentar novamente
                </button>
              </div>
            </>
          )}

          <AnimatePresence>
            {phase === 'concluido' && (
              <motion.div
                className="puzzle__done"
                initial={{ opacity: 0, y: m.reduced ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={m.t(0.9, { delay: 0.6 * m.factor })}
                role="status"
              >
                <span className="puzzle__done-mark" aria-hidden="true" />
                <p className="puzzle__done-title">Imagem concluída.</p>
                {chosen.caption && <p className="puzzle__caption">{chosen.caption}</p>}
                {chosen.dedication && <p className="puzzle__dedication">{chosen.dedication}</p>}
                {pz.message && <p className="puzzle__message">{pz.message}</p>}
                <button type="button" className="btn" onClick={start}>
                  Tentar novamente
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
