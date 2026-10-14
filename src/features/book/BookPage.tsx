import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fragments } from '../../data/fragments';
import { useContent } from '../../content/ContentContext';
import type { Photo } from '../../content/types';
import { useMotion } from '../../context/SettingsContext';
import { useProgress } from '../../context/ProgressContext';
import { usePersistentState } from '../../lib/usePersistentState';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { MediaImg } from '../../components/MediaImg';
import { Icon } from '../../components/Icon';
import { paginate, type TextBlock } from './paginate';
import './book.css';
import { AreaMark } from '../../components/Ornaments';

type BookPageData =
  | { kind: 'cover' }
  | { kind: 'dedication'; text: string }
  | { kind: 'section'; title: string; note: string }
  | { kind: 'text'; heading: string; blocks: TextBlock[] }
  | { kind: 'photo'; photo: Photo }
  | { kind: 'end' }
  | { kind: 'blank' };

export const BUDGET = 1080;
export const FIRST_BUDGET = 960;

function buildPages(dedication: string, photos: Photo[]): BookPageData[] {
  // O livro guarda só os dez fragmentos; a carta tem a sua própria página.
  const pages: BookPageData[] = [{ kind: 'cover' }, { kind: 'dedication', text: dedication }];
  const queue = [...photos];
  pages.push({ kind: 'section', title: 'Dez fragmentos', note: 'Numerados de 1 a 10' });
  fragments.forEach((f, i) => {
    paginate([f.text], BUDGET, FIRST_BUDGET).forEach((blocks, j) =>
      pages.push({ kind: 'text', heading: j === 0 ? String(f.number) : '', blocks }),
    );
    // Fotografias intercaladas a cada três fragmentos (ou ao fim, se sobrarem).
    if (queue.length && (i % 3 === 2 || i === fragments.length - 1))
      pages.push({ kind: 'photo', photo: queue.shift()! });
  });
  while (queue.length) pages.push({ kind: 'photo', photo: queue.shift()! });
  pages.push({ kind: 'end' });
  return pages;
}

/** Texto de página que reduz levemente a fonte se, por acaso, não couber. */
function FitText({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.scrollHeight > el.clientHeight + 1 && fit > 0.78) setFit((f) => Math.round((f - 0.04) * 100) / 100);
  });
  return (
    <div ref={ref} className="bpage__fit" style={{ ['--fit' as string]: fit }}>
      {children}
    </div>
  );
}

function PageView({ page, index, total }: { page: BookPageData; index: number; total: number }) {
  const folio =
    index > 1 && page.kind !== 'blank' && page.kind !== 'end' ? (
      <span className="bpage__folio num">{index + 1}</span>
    ) : null;
  switch (page.kind) {
    case 'cover':
      return (
        <div className="bpage bpage--cover">
          <span className="bpage__cover-rule" aria-hidden="true" />
          <h2 className="bpage__cover-title">Algumas coisas sobre você</h2>
          <span className="bpage__cover-for">para Annelise</span>
          <span className="bpage__cover-mark" aria-hidden="true" />
        </div>
      );
    case 'dedication':
      return (
        <div className="bpage bpage--dedication">
          <p className="bpage__dedication">{page.text}</p>
        </div>
      );
    case 'section':
      return (
        <div className="bpage bpage--section">
          <span className="bpage__section-note">{page.note}</span>
          <h3 className="bpage__section-title">{page.title}</h3>
          {folio}
        </div>
      );
    case 'text':
      return (
        <div className="bpage bpage--text">
          <FitText>
            {page.heading && <h4 className="bpage__heading">{page.heading}</h4>}
            {page.blocks.map((b, i) => (
              <p key={i} className={b.continued ? 'is-continued' : undefined}>
                {b.text}
              </p>
            ))}
          </FitText>
          {folio}
        </div>
      );
    case 'photo':
      return (
        <div className="bpage bpage--photo">
          <figure>
            <span className="bpage__photo-frame" style={{ aspectRatio: `${page.photo.width} / ${page.photo.height}` }}>
              <MediaImg src={page.photo.src} alt={page.photo.caption || 'Fotografia'} />
            </span>
            {(page.photo.caption || page.photo.dedication) && (
              <figcaption>{page.photo.dedication || page.photo.caption}</figcaption>
            )}
          </figure>
          {folio}
        </div>
      );
    case 'end':
      return (
        <div className="bpage bpage--end">
          <span className="bpage__cover-rule" aria-hidden="true" />
          <p>Você chegou à última página. Pode voltar quando quiser.</p>
          <span className="meta num">{total} páginas</span>
        </div>
      );
    default:
      return <div className="bpage bpage--blank" />;
  }
}

export default function BookPage() {
  const { content } = useContent();
  const { mark } = useProgress();
  const m = useMotion();
  const spread = useMediaQuery('(min-width: 900px) and (min-height: 560px)');
  const stageRef = useRef<HTMLDivElement>(null);
  const [pw, setPw] = useState(320);
  const [savedPage, setSavedPage] = usePersistentState('livro:pagina', 0);
  const [moving, setMoving] = useState<number | null>(null);
  const touch = useRef<number | null>(null);

  const pages = useMemo(
    () =>
      buildPages(
        content.book.dedication,
        content.photos.filter((p) => p.inBook),
      ),
    [content.book.dedication, content.photos],
  );
  // Página dupla: duas páginas por folha. Página única: uma página por folha, verso em branco.
  const leaves = useMemo(() => {
    if (!spread) return pages.map((p) => [p, { kind: 'blank' } as BookPageData] as const);
    const out: (readonly [BookPageData, BookPageData])[] = [];
    for (let i = 0; i < pages.length; i += 2) out.push([pages[i], pages[i + 1] ?? { kind: 'blank' }] as const);
    return out;
  }, [pages, spread]);
  const L = leaves.length;
  const maxK = spread ? L : L - 1;
  const toK = (pageIndex: number) => Math.min(maxK, Math.max(0, spread ? Math.ceil(pageIndex / 2) : pageIndex));
  const k = toK(savedPage);

  const visible = spread ? [2 * k - 1, 2 * k].filter((i) => i >= 0 && i < pages.length) : [k];
  const lastVisible = visible.includes(pages.length - 1);

  useEffect(() => {
    if (lastVisible) mark('livro');
  }, [lastVisible, mark]);

  /* tamanho da página a partir do espaço disponível */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = Math.max(320, window.innerHeight - 230);
      const byWidth = spread ? w / 2 : w;
      setPw(Math.floor(Math.min(byWidth, h / 1.5, spread ? 460 : 520)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [spread]);

  const go = useCallback(
    (nextK: number) => {
      const target = Math.min(maxK, Math.max(0, nextK));
      if (target === k) return;
      setMoving(target > k ? k : target);
      window.setTimeout(() => setMoving(null), 950 * m.factor + 20);
      setSavedPage(spread ? target * 2 : target);
    },
    [k, maxK, m.factor, setSavedPage, spread],
  );
  const next = useCallback(() => go(k + 1), [go, k]);
  const prev = useCallback(() => go(k - 1), [go, k]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Livro fechado no centro; aberto, ocupa as duas páginas.
  const shift = !spread ? -pw : k === 0 ? -pw / 2 : k === L ? pw / 2 : 0;
  const windowStart = Math.max(0, k - 3);
  const windowEnd = Math.min(L - 1, k + 2);
  const progress = pages.length > 1 ? Math.max(...visible) / (pages.length - 1) : 1;

  return (
    <div className="book-area" data-mode={spread ? 'spread' : 'single'}>
      <header className="book-area__head">
        <AreaMark id="livro" />
        <h1 className="book-area__title">Algumas coisas sobre você</h1>
        <p className="book-area__desc">
          Textos que escrevi para registrar o que penso, o que admiro e o que nem sempre consigo dizer em voz alta.
        </p>
      </header>

      <div
        className="book-stage"
        ref={stageRef}
        style={{ height: pw * 1.5 + 8 }}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
        }}
      >
        <div className="book-clip" style={{ width: spread ? pw * 2 : pw, height: pw * 1.5 }}>
          <div
            className="book"
            style={{
              width: pw * 2,
              height: pw * 1.5,
              transform: `translateX(${shift}px)`,
              ['--pw' as string]: `${pw}px`,
            }}
          >
            {leaves.map((leaf, i) => {
              if (i < windowStart || i > windowEnd) return null;
              const flipped = i < k;
              const z = moving === i ? L + 10 : flipped ? i + 1 : L - i;
              return (
                <div
                  key={i}
                  className="leaf"
                  style={{ zIndex: z, transform: `rotateY(${flipped ? -180 : 0}deg)` }}
                  onClick={() => (spread ? (flipped ? prev() : next()) : undefined)}
                >
                  <div className="leaf__face leaf__face--front" aria-hidden={!visible.includes(spread ? 2 * i : i)}>
                    <PageView page={leaf[0]} index={spread ? 2 * i : i} total={pages.length} />
                  </div>
                  <div className="leaf__face leaf__face--back" aria-hidden={!visible.includes(2 * i + 1)}>
                    <PageView page={leaf[1]} index={2 * i + 1} total={pages.length} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="book-controls">
        <div className="book-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        {k === 0 ? (
          <button type="button" className="btn btn--solid" onClick={next}>
            Abrir o livro
          </button>
        ) : (
          <div className="book-controls__row">
            <button type="button" className="btn btn--ghost" onClick={prev} disabled={k === 0}>
              <Icon name="arrow-left" size={16} /> Página anterior
            </button>
            <span className="book-controls__count num" aria-live="polite">
              {visible.length === 2 ? `${visible[0] + 1}–${visible[1] + 1}` : visible[0] + 1} de {pages.length}
            </span>
            <button type="button" className="btn btn--ghost" onClick={next} disabled={k >= maxK}>
              Próxima página <Icon name="arrow-right" size={16} />
            </button>
          </div>
        )}
        {k > 0 && (
          <button type="button" className="link-btn" onClick={() => go(0)}>
            Voltar ao início
          </button>
        )}
      </div>
    </div>
  );
}
