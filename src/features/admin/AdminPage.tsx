import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useContent } from '../../content/ContentContext';
import { checkPassword, setSavedPassword, siteSetup } from '../../content/backend';
import type { Content } from '../../content/types';
import { useProgress } from '../../context/ProgressContext';
import { Text } from './fields';
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
    return backend.mode === 'site' ? (
      <SignIn />
    ) : (
      <div className="page page--narrow admin">
        <h1 className="admin__title">Edição</h1>
        <p className="admin__lead">
          {backend.hasDb
            ? 'Esta área é só para quem administra o site. A conta conectada não tem permissão de edição.'
            : 'Para administrar, abra esta página conectado ao claude.ai com a conta que tem permissão de edição.'}
        </p>
      </div>
    );
  }

  const size = new Blob([draftJson]).size;
  const Comp = tab.Comp;

  return (
    <div className="page page--wide admin">
      <header className="admin__head">
        <h1 className="admin__title">Edição</h1>
        {backend.mode === 'artifact' ? (
          <p className="admin__lead">
            As alterações são salvas no banco de dados deste site no claude.ai. Só contas com permissão de edição
            conseguem salvar; a regra é aplicada pelo servidor. Quem visita sem estar conectado ao claude.ai vê a versão
            publicada com o site, não as alterações salvas aqui.
          </p>
        ) : (
          <p className="admin__lead">
            As alterações ficam guardadas no armazenamento do site e aparecem para quem abrir o site logo depois de
            salvar. A senha fica lembrada só neste navegador.{' '}
            <button
              type="button"
              className="admin__disconnect"
              onClick={() => {
                setSavedPassword(null);
                window.location.reload();
              }}
            >
              Sair deste aparelho
            </button>
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

/** Entrada da área de edição: senha conferida pela função do site. */
function SignIn() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<{ armazenamento: boolean; senha: boolean } | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void siteSetup().then((s) => alive && setSetup(s));
    return () => {
      alive = false;
    };
  }, []);

  const enter = async () => {
    const p = password;
    if (!p) return;
    setBusy(true);
    setError(null);
    const result = await checkPassword(p);
    if (result === 'ok') {
      setSavedPassword(p);
      window.location.reload();
      return;
    }
    setBusy(false);
    setError(
      result === 'senha'
        ? 'Senha incorreta.'
        : result === 'sem-senha'
          ? 'A senha ainda não foi definida na Vercel (veja os passos acima).'
          : 'Não foi possível falar com o servidor do site agora. Tente de novo em instantes.',
    );
  };

  const ready = setup?.armazenamento && setup.senha;

  return (
    <div className="page page--narrow admin">
      <h1 className="admin__title">Edição</h1>
      {setup === null && (
        <p className="admin__lead">
          A área de edição funciona no endereço publicado na Vercel. Por aqui não há servidor para guardar as
          alterações.
        </p>
      )}
      {setup && !ready && (
        <>
          <p className="admin__lead">Falta ligar duas coisas no projeto da Vercel, uma vez só:</p>
          <ol className="admin__steps">
            <li data-done={setup.armazenamento}>
              Em <b>Storage</b>, crie um <b>Blob</b> e ligue ao projeto (<b>Connect Project</b>).
              {setup.armazenamento && ' Feito.'}
            </li>
            <li data-done={setup.senha}>
              Em <b>Settings → Environment Variables</b>, crie <b>ADMIN_PASSWORD</b> com a senha que você quer usar
              aqui.{setup.senha && ' Feito.'}
            </li>
            <li>
              Em <b>Deployments</b>, abra o menu da publicação mais recente e escolha <b>Redeploy</b>.
            </li>
          </ol>
        </>
      )}
      {setup !== null && (
        <form
          className="admin__connect"
          onSubmit={(e) => {
            e.preventDefault();
            void enter();
          }}
        >
          <Text label="Senha" type="password" value={password} onChange={setPassword} />
          <button type="submit" className="ab ab--solid" disabled={busy || !password}>
            {busy ? 'Conferindo' : 'Entrar'}
          </button>
        </form>
      )}
      {error && (
        <p className="a-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
