import { useEffect, useRef, useState } from 'react';
import {
  useSettings,
  fontPairs,
  textSizePx,
  type FontPair,
  type MotionPref,
  type TextSize,
  type ThemePref,
  type DesktopNav,
} from '../context/SettingsContext';
import { useProgress } from '../context/ProgressContext';
import { clearAllStored } from '../lib/storage';
import { sfx } from '../lib/sound';
import { PageHeader } from '../components/PageHeader';
import { Segmented } from '../components/Segmented';
import { Switch } from '../components/Switch';
import { Range } from '../components/Range';
import { Icon } from '../components/Icon';
import './settings.css';

export default function SettingsPage() {
  const { settings, update, reset, resolvedTheme, motionLevel } = useSettings();
  const { secretFound } = useProgress();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const firstRender = useRef(true);

  // Salvamento automático: as preferências são gravadas a cada mudança.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSavedAt(Date.now());
    const id = window.setTimeout(() => setSavedAt(null), 1800);
    return () => window.clearTimeout(id);
  }, [settings]);

  const textSizes: { value: TextSize; label: string }[] = [
    { value: 'pequeno', label: 'Pequeno' },
    { value: 'padrao', label: 'Padrão' },
    { value: 'grande', label: 'Grande' },
    { value: 'maior', label: 'Maior' },
  ];

  return (
    <div className="page page--narrow settings">
      <PageHeader
        eyebrow="Personalização do espaço"
        title="Do seu jeito."
        description="Cada alteração vale imediatamente e fica salva neste navegador."
        actions={
          <span className="settings__saved meta" aria-live="polite">
            {savedAt ? (
              <>
                <Icon name="check" size={14} /> Salvo
              </>
            ) : null}
          </span>
        }
      />

      <section className="settings__group" aria-labelledby="s-aparencia">
        <h2 id="s-aparencia" className="settings__heading eyebrow">
          Aparência
        </h2>

        <div className="setting">
          <div className="setting__text">
            <p className="setting__label">Tema</p>
            <p className="setting__hint">
              {settings.theme === 'sistema'
                ? `Segue o sistema (agora: ${resolvedTheme === 'dark' ? 'escuro' : 'claro'}).`
                : 'Fixo, independentemente do sistema.'}
            </p>
          </div>
          <Segmented<ThemePref>
            label="Tema"
            value={settings.theme}
            onChange={(theme) => update({ theme })}
            options={[
              { value: 'sistema', label: 'Sistema' },
              { value: 'claro', label: 'Claro' },
              { value: 'escuro', label: 'Escuro' },
            ]}
          />
        </div>

        <div className="setting setting--stack">
          <div className="setting__text">
            <p className="setting__label">Tipografia</p>
            <p className="setting__hint">Uma serifa para a leitura, uma sans para a interface.</p>
          </div>
          <div className="font-options" role="radiogroup" aria-label="Combinação tipográfica">
            {(Object.keys(fontPairs) as FontPair[]).map((key) => {
              const f = fontPairs[key];
              const checked = settings.fontPair === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  className="font-option"
                  data-fonts-preview={key}
                  onClick={() => {
                    sfx.tick();
                    update({ fontPair: key });
                  }}
                >
                  <span className="font-option__sample">Aa</span>
                  <span className="font-option__name">{f.label}</span>
                  <span className="font-option__desc">
                    {f.serif} · {f.sans}
                  </span>
                  {checked && <Icon name="check" size={14} className="font-option__check" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="setting setting--stack">
          <div className="setting__text">
            <p className="setting__label">Tamanho do texto</p>
            <p className="setting__hint">Base de {textSizePx[settings.textSize]} px para todo o aplicativo.</p>
          </div>
          <Segmented<TextSize>
            label="Tamanho do texto"
            value={settings.textSize}
            onChange={(textSize) => update({ textSize })}
            options={textSizes}
          />
        </div>

        <div className="settings__preview card" aria-label="Prévia">
          <p className="eyebrow">Prévia</p>
          <p className="settings__preview-serif">
            Há uma diferença considerável entre reconhecer a possibilidade de perder alguém e deixar de desejar essa
            pessoa.
          </p>
          <p className="meta">Trecho da carta, na tipografia e no tamanho escolhidos.</p>
        </div>
      </section>

      <section className="settings__group" aria-labelledby="s-movimento">
        <h2 id="s-movimento" className="settings__heading eyebrow">
          Movimento e som
        </h2>

        <div className="setting setting--stack">
          <div className="setting__text">
            <p className="setting__label">Intensidade das animações</p>
            <p className="setting__hint">
              {settings.motion === 'auto'
                ? `Automática: segue a preferência de movimento do sistema (agora: ${
                    motionLevel === 'minima' ? 'reduzido' : 'completo'
                  }).`
                : motionLevel === 'minima'
                  ? 'Transições instantâneas e nenhuma animação decorativa.'
                  : motionLevel === 'suave'
                    ? 'Transições mais curtas e discretas.'
                    : 'Todas as transições e animações.'}
            </p>
          </div>
          <Segmented<MotionPref>
            label="Intensidade das animações"
            value={settings.motion}
            onChange={(motion) => update({ motion })}
            options={[
              { value: 'auto', label: 'Automática' },
              { value: 'completa', label: 'Completa' },
              { value: 'suave', label: 'Suave' },
              { value: 'minima', label: 'Mínima' },
            ]}
          />
          <div className="motion-demo" aria-hidden="true">
            <span />
          </div>
        </div>

        <div className="setting">
          <div className="setting__text">
            <label className="setting__label" htmlFor="sw-sound">
              Efeitos sonoros
            </label>
            <p className="setting__hint">
              Sons discretos, gerados no próprio navegador, ao abrir, escolher e explorar. Desativados por padrão.
            </p>
          </div>
          <Switch
            id="sw-sound"
            label="Efeitos sonoros"
            checked={settings.sound}
            onChange={(sound) => {
              update({ sound });
              if (sound) window.setTimeout(() => sfx.select(), 60);
            }}
          />
        </div>

        {settings.sound && (
          <div className="setting">
            <div className="setting__text">
              <p className="setting__label">Volume dos efeitos</p>
            </div>
            <div className="setting__range">
              <Range
                label="Volume dos efeitos"
                value={settings.soundVolume}
                onValue={(soundVolume) => update({ soundVolume })}
                onPointerUp={() => sfx.select()}
                onKeyUp={() => sfx.tick()}
              />
            </div>
          </div>
        )}
      </section>

      <section className="settings__group" aria-labelledby="s-navegacao">
        <h2 id="s-navegacao" className="settings__heading eyebrow">
          Navegação
        </h2>

        <div className="setting">
          <div className="setting__text">
            <p className="setting__label">Menu no computador</p>
            <p className="setting__hint">Em telas largas, uma coluna lateral ou uma barra superior.</p>
          </div>
          <Segmented<DesktopNav>
            label="Posição do menu no computador"
            value={settings.desktopNav}
            onChange={(desktopNav) => update({ desktopNav })}
            options={[
              { value: 'lateral', label: 'Lateral' },
              { value: 'superior', label: 'Superior' },
            ]}
          />
        </div>

        <div className="setting">
          <div className="setting__text">
            <label className="setting__label" htmlFor="sw-labels">
              Mostrar nomes no menu
            </label>
            <p className="setting__hint">Desligado, o menu exibe apenas os ícones.</p>
          </div>
          <Switch
            id="sw-labels"
            label="Mostrar nomes no menu"
            checked={settings.navLabels}
            onChange={(navLabels) => update({ navLabels })}
          />
        </div>

        <div className="setting">
          <div className="setting__text">
            <label className="setting__label" htmlFor="sw-autohide">
              Esconder o menu inferior ao rolar
            </label>
            <p className="setting__hint">No celular, a barra some ao descer a página e volta ao subir.</p>
          </div>
          <Switch
            id="sw-autohide"
            label="Esconder o menu inferior ao rolar"
            checked={settings.mobileNavAutoHide}
            onChange={(mobileNavAutoHide) => update({ mobileNavAutoHide })}
          />
        </div>
      </section>

      <section className="settings__group" aria-labelledby="s-dados">
        <h2 id="s-dados" className="settings__heading eyebrow">
          Dados neste navegador
        </h2>
        <p className="setting__hint settings__data-text">
          Preferências, posição de leitura, progresso das experiências e composições salvas ficam apenas neste
          dispositivo. Não há conta, servidor nem sincronização.
          {secretFound ? ' Um lugar escondido já foi encontrado.' : ''}
        </p>
        <div className="row-actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              reset();
              sfx.soft();
            }}
          >
            <Icon name="reset" size={16} /> Restaurar preferências
          </button>
          {!confirmClear ? (
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmClear(true)}>
              <Icon name="trash" size={16} /> Apagar tudo o que foi salvo
            </button>
          ) : (
            <span className="settings__confirm">
              <span className="meta">Isso apaga progresso e composições. Continuar?</span>
              <button
                type="button"
                className="btn btn--solid btn--small"
                onClick={() => {
                  clearAllStored();
                  window.location.reload();
                }}
              >
                Apagar
              </button>
              <button type="button" className="btn btn--small" onClick={() => setConfirmClear(false)}>
                Cancelar
              </button>
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
