import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  describe,
  modeInfo,
  pieces as basePieces,
  RING_INNER,
  RING_MID,
  spotIn,
  zoneOf,
  zones,
  type Glyph,
  type Mode,
  type Piece,
  type Placed,
} from './pieces';
import { usePersistentState } from '../../lib/usePersistentState';
import { useMotion } from '../../context/SettingsContext';
import { sfx } from '../../lib/sound';
import { useToast } from '../../lib/useToast';
import { PageHeader } from '../../components/PageHeader';
import { Segmented } from '../../components/Segmented';
import { Icon } from '../../components/Icon';
import { Toast } from '../../components/Toast';
import './table.css';

interface TableState {
  mode: Mode;
  comps: Record<Mode, Placed[]>;
  custom: Piece[];
}

interface Slot {
  id: string;
  mode: Mode;
  placed: Placed[];
  custom: Piece[];
  savedAt: number;
}

interface DragInfo {
  id: string;
  from: 'tray' | 'table';
  startX: number;
  startY: number;
  ox: number;
  oy: number;
  moved: boolean;
}

const initialTable: TableState = { mode: 'prioridades', comps: { prioridades: [], convivencia: [] }, custom: [] };
const MAX_SLOTS = 3;
const MAX_CUSTOM = 6;

function isTable(v: unknown): v is TableState {
  const s = v as TableState;
  return typeof s === 'object' && s !== null && Boolean(s.comps?.prioridades) && Array.isArray(s.custom);
}

function GlyphMark({ glyph }: { glyph: Glyph }) {
  return (
    <svg className="glyph" viewBox="0 0 12 12" aria-hidden="true">
      {glyph === 'tempo' && <circle cx="6" cy="6" r="4" />}
      {glyph === 'conversa' && <path d="M2 4.5h8M2 7.5h5.5" />}
      {glyph === 'cuidado' && <rect x="2.5" y="2.5" width="7" height="7" />}
      {glyph === 'mundo' && <path d="M6 2l4.2 7.5H1.8Z" />}
      {glyph === 'livre' && <path d="M2 9.5 9.5 2M7 2h2.5v2.5" />}
    </svg>
  );
}

export default function TablePage() {
  const m = useMotion();
  const [st, setSt] = usePersistentState<TableState>('mesa:state', initialTable, isTable);
  const [slots, setSlots] = usePersistentState<Slot[]>('mesa:slots', []);
  const [undoStack, setUndoStack] = useState<{ mode: Mode; placed: Placed[] }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number; zone: string | null } | null>(null);
  const [customText, setCustomText] = useState('');
  const dragRef = useRef<DragInfo | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const { message, show } = useToast();

  const mode = st.mode;
  const placed = st.comps[mode];
  const allPieces = useMemo(() => [...basePieces, ...st.custom], [st.custom]);
  const pieceById = (id: string) => allPieces.find((p) => p.id === id);
  const placedIds = new Set(placed.map((p) => p.id));
  const tray = allPieces.filter((p) => !placedIds.has(p.id));
  const reading = useMemo(() => describe(mode, placed, allPieces), [mode, placed, allPieces]);

  /* ---------- alterações (com desfazer) ---------- */
  const commit = (next: Placed[]) => {
    setUndoStack((u) => [...u.slice(-49), { mode, placed }]);
    setSt((s) => ({ ...s, comps: { ...s.comps, [s.mode]: next } }));
  };

  const placeAt = (id: string, x: number, y: number) => {
    const pos = { x: Math.min(0.95, Math.max(0.05, x)), y: Math.min(0.94, Math.max(0.06, y)) };
    commit([...placed.filter((p) => p.id !== id), { id, ...pos }]);
    sfx.place();
  };

  const removePiece = (id: string) => {
    if (!placedIds.has(id)) return;
    commit(placed.filter((p) => p.id !== id));
    sfx.soft();
    if (selected === id) setSelected(null);
  };

  const undo = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setUndoStack((u) => u.slice(0, -1));
    setSt((s) => ({ ...s, mode: last.mode, comps: { ...s.comps, [last.mode]: last.placed } }));
    sfx.soft();
  };

  const resetComposition = () => {
    if (!placed.length) return;
    commit([]);
    setSelected(null);
    show('Composição reiniciada. É possível desfazer.');
  };

  const setMode = (next: Mode) => {
    setSelected(null);
    setSt((s) => ({ ...s, mode: next }));
  };

  /* ---------- arrastar ---------- */
  const tableCoords = (clientX: number, clientY: number) => {
    const r = tableRef.current?.getBoundingClientRect();
    if (!r) return null;
    const inside = clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
    return { inside, x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height };
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, id: string, from: 'tray' | 'table') => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      id,
      from,
      startX: e.clientX,
      startY: e.clientY,
      ox: e.clientX - (rect.left + rect.width / 2),
      oy: e.clientY - (rect.top + rect.height / 2),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Rolagem automática quando o arraste se aproxima das bordas da janela.
  const autoScroll = useRef<number | null>(null);
  const scrollSpeed = useRef(0);
  const stopAutoScroll = () => {
    if (autoScroll.current !== null) cancelAnimationFrame(autoScroll.current);
    autoScroll.current = null;
    scrollSpeed.current = 0;
  };
  const runAutoScroll = () => {
    if (!scrollSpeed.current) {
      autoScroll.current = null;
      return;
    }
    window.scrollBy(0, scrollSpeed.current);
    autoScroll.current = requestAnimationFrame(runAutoScroll);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return;
    d.moved = true;
    const edge = 72;
    scrollSpeed.current =
      e.clientY < edge
        ? -Math.ceil((edge - e.clientY) / 6)
        : e.clientY > window.innerHeight - edge
          ? Math.ceil((e.clientY - window.innerHeight + edge) / 6)
          : 0;
    if (scrollSpeed.current && autoScroll.current === null) autoScroll.current = requestAnimationFrame(runAutoScroll);
    const cx = e.clientX - d.ox;
    const cy = e.clientY - d.oy;
    const c = tableCoords(cx, cy);
    setGhost({ id: d.id, x: cx, y: cy, zone: c?.inside ? zoneOf(mode, c.x, c.y) : null });
  };

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    stopAutoScroll();
    setGhost(null);
    if (!d) return;
    if (!d.moved) {
      // Toque simples: seleciona (ou desmarca).
      setSelected((s) => (s === d.id ? null : d.id));
      sfx.tick();
      return;
    }
    const c = tableCoords(e.clientX - d.ox, e.clientY - d.oy);
    if (c?.inside) placeAt(d.id, c.x, c.y);
    else if (d.from === 'table') removePiece(d.id);
    setSelected(null);
  };

  const onPointerCancel = () => {
    stopAutoScroll();
    dragRef.current = null;
    setGhost(null);
  };

  /* ---------- tocar na mesa com uma peça selecionada ---------- */
  const onTableClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!selected || (e.target as HTMLElement).closest('.piece')) return;
    const c = tableCoords(e.clientX, e.clientY);
    if (c?.inside) {
      placeAt(selected, c.x, c.y);
      setSelected(null);
    }
  };

  /* ---------- teclado ---------- */
  const onPieceKey = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const p = placed.find((x) => x.id === id);
    if (e.key === 'Escape') {
      setSelected(null);
      return;
    }
    if (!p) return;
    const step = e.shiftKey ? 0.08 : 0.025;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      placeAt(id, p.x + moves[e.key][0], p.y + moves[e.key][1]);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removePiece(id);
    }
  };

  /* ---------- peças escritas ---------- */
  const addCustom = (e: FormEvent) => {
    e.preventDefault();
    const label = customText.trim();
    if (!label) return;
    if (st.custom.length >= MAX_CUSTOM) {
      show(`Até ${MAX_CUSTOM} peças escritas. Remova uma para criar outra.`);
      return;
    }
    const piece: Piece = { id: `livre-${Date.now().toString(36)}`, label, glyph: 'livre', custom: true };
    setSt((s) => ({ ...s, custom: [...s.custom, piece] }));
    setCustomText('');
    sfx.select();
  };

  const deleteCustom = (id: string) => {
    setSt((s) => ({
      ...s,
      custom: s.custom.filter((p) => p.id !== id),
      comps: {
        prioridades: s.comps.prioridades.filter((p) => p.id !== id),
        convivencia: s.comps.convivencia.filter((p) => p.id !== id),
      },
    }));
  };

  /* ---------- composições salvas ---------- */
  const saveSlot = () => {
    if (!placed.length) {
      show('Coloque ao menos uma peça na mesa antes de salvar.');
      return;
    }
    if (slots.length >= MAX_SLOTS) {
      show('Já há três composições salvas. Apague uma para guardar outra.');
      return;
    }
    const used = st.custom.filter((c) => placedIds.has(c.id));
    setSlots((s) => [...s, { id: Date.now().toString(36), mode, placed, custom: used, savedAt: Date.now() }]);
    sfx.reveal();
    show('Composição salva neste navegador.');
  };

  const loadSlot = (slot: Slot) => {
    setUndoStack((u) => [...u.slice(-49), { mode: slot.mode, placed: st.comps[slot.mode] }]);
    setSt((s) => {
      const known = new Set(s.custom.map((c) => c.id));
      return {
        ...s,
        mode: slot.mode,
        custom: [...s.custom, ...slot.custom.filter((c) => !known.has(c.id))].slice(0, MAX_CUSTOM + 3),
        comps: { ...s.comps, [slot.mode]: slot.placed },
      };
    });
    setSelected(null);
    sfx.select();
    show('Composição carregada. É possível desfazer.');
  };

  const selectedPiece = selected ? pieceById(selected) : null;
  const selectedPlaced = selected ? placed.find((p) => p.id === selected) : null;

  const renderPiece = (piece: Piece, from: 'tray' | 'table', pos?: Placed) => {
    const isSelected = selected === piece.id;
    const dragging = ghost?.id === piece.id;
    const zone = pos ? zones[mode].find((z) => z.id === zoneOf(mode, pos.x, pos.y))?.label : null;
    return (
      <button
        key={piece.id}
        type="button"
        className="piece"
        data-selected={isSelected}
        data-dragging={dragging}
        data-custom={Boolean(piece.custom)}
        style={
          pos
            ? // A âncora desliza com a posição: a peça nunca ultrapassa as bordas da mesa.
              {
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                transform: `translate(${-pos.x * 100}%, ${-pos.y * 100}%)`,
              }
            : undefined
        }
        onPointerDown={(e) => onPointerDown(e, piece.id, from)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={(e) => onPieceKey(e, piece.id)}
        onClick={(e) => {
          // Cliques via teclado (Enter/Espaço) chegam aqui sem eventos de ponteiro.
          if (e.detail === 0) {
            setSelected((s) => (s === piece.id ? null : piece.id));
            sfx.tick();
          }
        }}
        aria-pressed={isSelected}
        aria-label={`${piece.label}${zone ? `, em ${zone}` : ', fora da mesa'}`}
      >
        <GlyphMark glyph={piece.glyph} />
        <span>{piece.label}</span>
      </button>
    );
  };

  return (
    <div className="page page--wide mesa" data-dragging={Boolean(ghost)}>
      <PageHeader
        eyebrow="A mesa de escolhas"
        title="Uma composição para duas pessoas."
        description="Arraste as peças para a mesa e organize-as como quiser. Não há resposta certa: a leitura ao lado apenas descreve a forma do que foi composto."
      />

      <div className="mesa__toolbar">
        <Segmented<Mode>
          label="Tipo de composição"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'prioridades', label: modeInfo.prioridades.label },
            { value: 'convivencia', label: modeInfo.convivencia.label },
          ]}
        />
        <div className="mesa__actions">
          <button type="button" className="btn btn--small" onClick={undo} disabled={!undoStack.length}>
            <Icon name="undo" size={14} /> Desfazer
          </button>
          <button type="button" className="btn btn--small" onClick={resetComposition} disabled={!placed.length}>
            <Icon name="reset" size={14} /> Reiniciar
          </button>
          <button type="button" className="btn btn--small btn--solid" onClick={saveSlot}>
            <Icon name="save" size={14} /> Salvar
          </button>
        </div>
      </div>
      <p className="meta mesa__hint">{modeInfo[mode].hint}</p>

      <div className="mesa__grid">
        <div className="mesa__main">
          <div
            ref={tableRef}
            className={`table-surface table-surface--${mode}`}
            data-armed={Boolean(selected && !selectedPlaced)}
            onClick={onTableClick}
            role="region"
            aria-label={`Mesa — ${modeInfo[mode].label}. ${placed.length} peças colocadas.`}
          >
            <svg className="table-surface__zones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {mode === 'prioridades' ? (
                <>
                  {[1, RING_MID, RING_INNER].map((r) => (
                    <ellipse
                      key={r}
                      cx="50"
                      cy="50"
                      rx={50 * r}
                      ry={50 * r}
                      className="zone-line"
                      data-active={
                        ghost?.zone === (r === 1 ? 'ocasional' : r === RING_MID ? 'importante' : 'essencial')
                      }
                    />
                  ))}
                </>
              ) : (
                <>
                  <path d="M33.33 4V96M66.66 4V96" className="zone-line" />
                  {['meu', 'nosso', 'seu'].map((z, i) => (
                    <rect
                      key={z}
                      x={i * 33.33}
                      y="0"
                      width="33.33"
                      height="100"
                      className="zone-fill"
                      data-active={ghost?.zone === z}
                    />
                  ))}
                </>
              )}
            </svg>
            <div className="table-surface__labels" aria-hidden="true">
              {zones[mode].map((z) => (
                <span key={z.id} data-zone={z.id} data-active={ghost?.zone === z.id}>
                  {z.label}
                </span>
              ))}
            </div>
            {placed.length === 0 && !ghost && (
              <p className="table-surface__empty">
                Arraste peças até aqui — ou toque numa peça e depois num ponto da mesa.
              </p>
            )}
            {placed.map((p) => {
              const piece = pieceById(p.id);
              return piece ? renderPiece(piece, 'table', p) : null;
            })}
          </div>

          <AnimatePresence>
            {selectedPiece && (
              <motion.div
                className="mesa__selection card"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={m.t(0.2)}
                role="group"
                aria-label={`Peça selecionada: ${selectedPiece.label}`}
              >
                <p className="mesa__selection-title">
                  <GlyphMark glyph={selectedPiece.glyph} /> {selectedPiece.label}
                </p>
                <p className="meta">
                  {selectedPlaced
                    ? 'Arraste para mover, use as setas do teclado, ou escolha uma área:'
                    : 'Toque num ponto da mesa, ou escolha uma área:'}
                </p>
                <div className="mesa__selection-actions">
                  {zones[mode].map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      className="chip"
                      onClick={() => {
                        const others = placed.filter((p) => p.id !== selectedPiece.id);
                        const spot = spotIn(mode, z.id, others);
                        placeAt(selectedPiece.id, spot.x, spot.y);
                        setSelected(null);
                      }}
                    >
                      {z.label}
                    </button>
                  ))}
                  {selectedPlaced && (
                    <button type="button" className="chip" onClick={() => removePiece(selectedPiece.id)}>
                      <Icon name="close" size={12} /> Tirar da mesa
                    </button>
                  )}
                  <button type="button" className="link-btn" onClick={() => setSelected(null)}>
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <section className="mesa__tray" aria-label="Peças disponíveis">
            <p className="eyebrow">Peças {tray.length > 0 && <span className="num">· {tray.length}</span>}</p>
            {tray.length === 0 ? (
              <p className="meta">Todas as peças estão na mesa.</p>
            ) : (
              <div className="mesa__pieces">
                {tray.map((p) => (
                  <span key={p.id} className="mesa__tray-item">
                    {renderPiece(p, 'tray')}
                    {p.custom && (
                      <button
                        type="button"
                        className="mesa__delete"
                        onClick={() => deleteCustom(p.id)}
                        aria-label={`Apagar a peça “${p.label}”`}
                      >
                        <Icon name="close" size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            <form className="mesa__custom" onSubmit={addCustom}>
              <label htmlFor="mesa-custom" className="visually-hidden">
                Escrever uma peça
              </label>
              <input
                id="mesa-custom"
                className="input"
                value={customText}
                maxLength={32}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Escrever uma peça…"
              />
              <button type="submit" className="btn btn--small" disabled={!customText.trim()}>
                <Icon name="plus" size={14} /> Criar
              </button>
            </form>
          </section>
        </div>

        <aside className="mesa__side">
          <section className="mesa__reading card" aria-live="polite">
            <p className="eyebrow">Leitura</p>
            <CompositionShape mode={mode} placed={placed} />
            {reading.map((line, i) => (
              <p key={i} className={i === 1 ? 'mesa__reading-main' : 'meta'}>
                {line}
              </p>
            ))}
          </section>

          <section className="mesa__slots" aria-label="Composições salvas">
            <p className="eyebrow">
              Composições salvas{' '}
              <span className="num">
                · {slots.length}/{MAX_SLOTS}
              </span>
            </p>
            {slots.length === 0 ? (
              <p className="meta">Nenhuma ainda. Use “Salvar” para guardar a composição atual.</p>
            ) : (
              <ul className="mesa__slot-list">
                {slots.map((s, i) => (
                  <li key={s.id}>
                    <CompositionShape mode={s.mode} placed={s.placed} small />
                    <span className="mesa__slot-text">
                      <span>Composição {['I', 'II', 'III'][i] ?? i + 1}</span>
                      <span className="meta">
                        {modeInfo[s.mode].label} · {s.placed.length} {s.placed.length === 1 ? 'peça' : 'peças'} ·{' '}
                        {new Date(s.savedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      </span>
                    </span>
                    <button type="button" className="btn btn--small" onClick={() => loadSlot(s)}>
                      Abrir
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--small"
                      onClick={() => setSlots((all) => all.filter((x) => x.id !== s.id))}
                      aria-label={`Apagar composição ${i + 1}`}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {ghost && pieceById(ghost.id) && (
        <div className="piece piece--ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
          <GlyphMark glyph={pieceById(ghost.id)!.glyph} />
          <span>{pieceById(ghost.id)!.label}</span>
        </div>
      )}
      <Toast message={message} />
    </div>
  );
}

/** Desenho que se adapta à composição: uma forma para prioridades, dois círculos para convivência. */
function CompositionShape({ mode, placed, small }: { mode: Mode; placed: Placed[]; small?: boolean }) {
  const size = 120;
  if (mode === 'prioridades') {
    const pts = placed
      .map((p) => ({ x: 10 + p.x * 100, y: 10 + p.y * 100 }))
      .sort((a, b) => Math.atan2(a.y - 60, a.x - 60) - Math.atan2(b.y - 60, b.x - 60));
    return (
      <svg className="shape" data-small={small} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {[50, 50 * RING_MID, 50 * RING_INNER].map((r) => (
          <circle key={r} cx="60" cy="60" r={r} className="shape__ring" />
        ))}
        {pts.length > 2 && <polygon points={pts.map((p) => `${p.x},${p.y}`).join(' ')} className="shape__poly" />}
        {pts.length === 2 && <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} className="shape__poly" />}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={small ? 2.6 : 2.2} className="shape__dot" />
        ))}
      </svg>
    );
  }
  const counts = { meu: 0, nosso: 0, seu: 0 };
  placed.forEach((p) => counts[zoneOf('convivencia', p.x, p.y) as keyof typeof counts]++);
  const total = placed.length || 1;
  const share = counts.nosso / total;
  const gap = 46 - share * 30; // mais coisas em comum → círculos mais sobrepostos
  const cxL = 60 - gap / 2;
  const cxR = 60 + gap / 2;
  const dots = placed.map((p) => {
    const z = zoneOf('convivencia', p.x, p.y);
    const x =
      z === 'nosso' ? 60 + (p.x - 0.5) * (52 - gap) : z === 'meu' ? cxL - 14 + p.x * 20 : cxR - 6 + (p.x - 0.66) * 20;
    return { x, y: 30 + p.y * 60 };
  });
  return (
    <svg className="shape" data-small={small} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={cxL} cy="60" r="32" className="shape__ring shape__ring--strong" />
      <circle cx={cxR} cy="60" r="32" className="shape__ring shape__ring--strong" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={small ? 2.6 : 2.2} className="shape__dot" />
      ))}
    </svg>
  );
}
