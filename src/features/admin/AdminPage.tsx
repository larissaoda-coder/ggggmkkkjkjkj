import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useContent } from '../../content/ContentContext';
import { rememberAdminDevice } from '../../content/useCanAdmin';
import type { Content } from '../../content/types';
import { useProgress } from '../../context/ProgressContext';
import {
  DataTab,
  DictionaryTab,
  EnvelopesTab,
  FutureTab,
  GardenTab,
  HomeTab,
  MapTab,
  MuseumTab,
  MusicTab,
  OracleTab,
  PhotosTab,
  PuzzleTab,
  SecretTab,
  StoryTab,
  type TabProps,
} from './tabs';
import './admin.css';

const tabs: { id: string; label: string; Comp: ComponentType<TabProps> }[] = [
  { id: 'inicio', label: 'Início e livro', Comp: HomeTab },
  { id: 'fotos', label: 'Fotografias', Comp: PhotosTab },
  { id: 'mapa', label: 'Mapa', Comp: MapTab },
  { id: 'musicas', label: 'Músicas', Comp: MusicTab },
  { id: 'oraculo', label: 'Oráculo', Comp: OracleTab },
  { id: 'cartas', label: 'Cartas guardadas', Comp: EnvelopesTab },
  { id: 'dicionario', label: 'Dicionário', Comp: DictionaryTab },
  { id: 'museu', label: 'Museu', Comp: MuseumTab },
  { id: 'futuro', label: 'Outra fase', Comp: FutureTab },
  { id: 'historia', label: 'História', Comp: StoryTab },
  { id: 'quebra-cabeca', label: 'Quebra-cabeça', Comp: PuzzleTab },
  { id: 'jardim', label: 'Intervalo', Comp: GardenTab },
  { id: 'final', label: 'Página final', Comp: SecretTab },
  { id: 'dados', label: 'Exportar e importar', Comp: DataTab },
];

const DOC_LIMIT = 256 * 1024;

export default function AdminPage() {
  const { content, backend, ready, save, saveState, saveError } = useContent();
  const { reset: resetProgress } = useProgress();
  const [params, setParams] = useSearchParams();
  const tab = tabs.find((t) => t.id === params.get('aba')) ?? tabs[0];
  const [draft, setDraft] = useState<Content>(content);
  const savedJson = useMemo(() => JSON.stringify(content), [content]);
  const draftJson = useMemo(() => JSON.stringify(draft), [draft]);
  const dirty = savedJson !== draftJson;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const uploads = useRef<Set<string>>(new Set());
  const [progressCleared, setProgressCleared] = useState(false);

  // Sem alterações pendentes, o rascunho acompanha o que está salvo (inclusive mudanças vindas de outra aba).
  useEffect(() => {
    if (!dirtyRef.current) setDraft(content);
  }, [content]);

  useEffect(() => {
    if (backend?.mode === 'local') rememberAdminDevice();
  }, [backend]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const patch = useCallback((fn: (d: Content) => Content) => setDraft((d) => fn(d)), []);
  const onUploaded = useCallback((src: string) => uploads.current.add(src), []);

  const onSave = async () => {
    if (!backend) return;
    const kept = new Set(draft.photos.map((p) => p.src).concat(draft.tracks.map((t) => t.url)));
    const removed = content.photos.map((p) => p.src).filter((src) => !kept.has(src));
    const ok = await save(draft);
    if (ok) {
      // Arquivos que deixaram de ser usados são apagados depois que o novo conteúdo foi salvo.
      for (const src of [...removed, ...[...uploads.current].filter((s) => !kept.has(s))])
        await backend.deleteImage(src).catch(() => {});
      uploads.current.clear();
    }
  };

  const onDiscard = async () => {
    if (backend) {
      const saved = new Set(content.photos.map((p) => p.src).concat(content.tracks.map((t) => t.url)));
      for (const src of uploads.current) if (!saved.has(src)) await backend.deleteImage(src).catch(() => {});
    }
    uploads.current.clear();
    setDraft(content);
  };

  if (!ready || !backend) {
    return (
      <div className="page admin">
        <p className="a-status" role="status">
          Carregando a administração.
        </p>
      </div>
    );
  }

  if (!backend.canEdit) {
    return (
      <div className="page page--narrow admin">
        <h1 className="admin__title">Administração</h1>
        <p className="admin__lead">
          {backend.hasDb
            ? 'Esta área é só para quem administra o site. A conta conectada não tem permissão de edição.'
            : 'Para administrar, abra esta página conectado ao claude.ai com a conta que tem permissão de edição.'}
        </p>
        <Link to="/indice" className="link-btn">
          Voltar ao índice
        </Link>
      </div>
    );
  }

  const size = new Blob([draftJson]).size;
  const Comp = tab.Comp;

  return (
    <div className="page page--wide admin">
      <header className="admin__head">
        <h1 className="admin__title">Administração</h1>
        {backend.mode === 'artifact' ? (
          <p className="admin__lead">
            As alterações são salvas no banco de dados deste site no claude.ai. Só contas com permissão de edição
            conseguem salvar; a regra é aplicada pelo servidor. Quem visita sem estar conectado ao claude.ai vê a versão
            publicada com o site, não as alterações salvas aqui.
          </p>
        ) : (
          <p className="admin__lead admin__lead--warn">
            Modo local: tudo o que for salvo aqui fica apenas neste navegador, neste aparelho. Não há login nem
            servidor, então esta área não é protegida e ninguém mais vê estas alterações. Para publicar para outras
            pessoas, use Exportar e importar.
          </p>
        )}
      </header>

      <div className="admin__layout">
        <nav className="admin__tabs" aria-label="Seções da administração">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={t.id === tab.id ? 'page' : undefined}
              onClick={() => setParams({ aba: t.id }, { replace: true })}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin__panel">
          <Comp draft={draft} patch={patch} backend={backend} onUploaded={onUploaded} />

          {tab.id === 'final' && (
            <section className="as">
              <h2 className="as__title">Progresso deste aparelho</h2>
              <div className="as__note">Útil para testar: apaga o que este navegador já marcou como visto.</div>
              <button
                type="button"
                className="ab"
                onClick={() => {
                  resetProgress();
                  setProgressCleared(true);
                }}
              >
                {progressCleared ? 'Progresso apagado' : 'Apagar progresso deste aparelho'}
              </button>
            </section>
          )}
        </div>
      </div>

      <div className="admin__savebar" data-dirty={dirty}>
        <span className="admin__savestate" role="status" aria-live="polite">
          {saveState === 'saving'
            ? 'Salvando.'
            : saveState === 'error'
              ? saveError
              : dirty
                ? 'Há alterações não salvas.'
                : saveState === 'saved'
                  ? 'Alterações salvas.'
                  : 'Tudo salvo.'}
          {backend.mode === 'artifact' && (
            <span className="admin__size num" data-over={size > DOC_LIMIT * 0.9}>
              {' '}
              · {Math.ceil(size / 1024)} KB de {DOC_LIMIT / 1024} KB
            </span>
          )}
        </span>
        <div className="admin__savebtns">
          <button
            type="button"
            className="ab ab--quiet"
            onClick={() => void onDiscard()}
            disabled={!dirty || saveState === 'saving'}
          >
            Descartar
          </button>
          <button
            type="button"
            className="ab ab--solid"
            onClick={() => void onSave()}
            disabled={!dirty || saveState === 'saving' || (backend.mode === 'artifact' && size > DOC_LIMIT)}
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
