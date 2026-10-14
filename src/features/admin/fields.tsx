import { useId, useState, type ReactNode } from 'react';
import type { Photo } from '../../content/types';
import { MediaImg } from '../../components/MediaImg';

export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function Text({
  label,
  value,
  onChange,
  hint,
  rows = 1,
  placeholder,
  error,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: ReactNode;
  rows?: number;
  placeholder?: string;
  error?: string | null;
  type?: 'text' | 'url';
}) {
  const id = useId();
  return (
    <div className="af">
      <label htmlFor={id} className="af__label">
        {label}
      </label>
      {rows > 1 ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          spellCheck={type === 'text'}
        />
      )}
      {error ? <span className="af__error">{error}</span> : hint ? <span className="af__hint">{hint}</span> : null}
    </div>
  );
}

export function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="af">
      <label htmlFor={id} className="af__label">
        {label}
      </label>
      <select
        id={id}
        value={String(value)}
        onChange={(e) => {
          const found = options.find((o) => String(o.value) === e.target.value);
          if (found) onChange(found.value);
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="af__hint">{hint}</span>}
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="af af--check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <span className="af__hint"> {hint}</span>}
      </span>
    </label>
  );
}

export function PhotoPicker({
  label,
  value,
  photos,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  photos: Photo[];
  onChange: (id: string) => void;
  hint?: ReactNode;
}) {
  const current = photos.find((p) => p.id === value);
  return (
    <div className="af af--photo">
      <Choice
        label={label}
        value={value}
        options={[
          { value: '', label: 'Nenhuma' },
          ...photos.map((p, i) => ({
            value: p.id,
            label: p.caption ? `${i + 1}. ${p.caption}` : `Fotografia ${i + 1}`,
          })),
        ]}
        onChange={onChange}
        hint={photos.length ? hint : 'Adicione fotografias na aba Fotografias para poder escolher aqui.'}
      />
      {current && (
        <span className="af__thumb" aria-hidden="true">
          <MediaImg src={current.src} alt="" />
        </span>
      )}
    </div>
  );
}

/** Botão de remover com confirmação na própria linha (o navegador do claude.ai não mostra confirm()). */
export function RemoveButton({ onConfirm, label = 'Remover' }: { onConfirm: () => void; label?: string }) {
  const [ask, setAsk] = useState(false);
  if (!ask)
    return (
      <button type="button" className="ab ab--quiet" onClick={() => setAsk(true)}>
        {label}
      </button>
    );
  return (
    <span className="ab-confirm" role="group" aria-label="Confirmar remoção">
      <span>Tem certeza?</span>
      <button
        type="button"
        className="ab ab--danger"
        onClick={() => {
          setAsk(false);
          onConfirm();
        }}
      >
        Sim, remover
      </button>
      <button type="button" className="ab ab--quiet" onClick={() => setAsk(false)}>
        Cancelar
      </button>
    </span>
  );
}

/** Lista editável: cada item abre e fecha, pode subir, descer e ser removido. */
export function Items<T extends { id: string }>({
  items,
  onChange,
  create,
  addLabel,
  title,
  render,
  empty,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  create?: () => T;
  addLabel?: string;
  title: (item: T, index: number) => string;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  empty?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="ai">
      {items.length === 0 && empty && <p className="ai__empty">{empty}</p>}
      <ol className="ai__list">
        {items.map((item, i) => {
          const isOpen = open === item.id;
          return (
            <li key={item.id} className="ai__item" data-open={isOpen}>
              <div className="ai__row">
                <button
                  type="button"
                  className="ai__toggle"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : item.id)}
                >
                  <span className="ai__num num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ai__title">{title(item, i) || 'Sem título'}</span>
                </button>
                <span className="ai__moves">
                  <button
                    type="button"
                    className="ab ab--icon"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="ab ab--icon"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Mover para baixo"
                  >
                    ↓
                  </button>
                </span>
              </div>
              {isOpen && (
                <div className="ai__body">
                  {render(item, (patch) => onChange(items.map((x) => (x.id === item.id ? { ...x, ...patch } : x))), i)}
                  <div className="ai__actions">
                    <RemoveButton onConfirm={() => onChange(items.filter((x) => x.id !== item.id))} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {create && (
        <button
          type="button"
          className="ab"
          onClick={() => {
            const item = create();
            onChange([...items, item]);
            setOpen(item.id);
          }}
        >
          {addLabel ?? 'Adicionar'}
        </button>
      )}
    </div>
  );
}

export function Section({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="as">
      <h2 className="as__title">{title}</h2>
      {note && <div className="as__note">{note}</div>}
      <div className="as__body">{children}</div>
    </section>
  );
}
