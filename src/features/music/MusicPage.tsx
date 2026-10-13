import { useState, type FormEvent } from 'react';
import { SPOTIFY_PLAYLIST_URL, spotifyEmbedUrl } from '../../data/spotify';
import { useSettings } from '../../context/SettingsContext';
import { usePersistentState } from '../../lib/usePersistentState';
import { PageHeader } from '../../components/PageHeader';
import { Icon } from '../../components/Icon';
import './music.css';

export default function MusicPage() {
  const { resolvedTheme } = useSettings();
  const [savedUrl, setSavedUrl] = usePersistentState('spotify:url', '');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(false);

  const url = SPOTIFY_PLAYLIST_URL || savedUrl;
  const embed = url ? spotifyEmbedUrl(url, resolvedTheme === 'dark') : null;

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!spotifyEmbedUrl(draft, false)) {
      setError(true);
      return;
    }
    setError(false);
    setSavedUrl(draft.trim());
    setDraft('');
  };

  return (
    <div className="page page--narrow music">
      <PageHeader title="Músicas" />

      {embed ? (
        <>
          <iframe
            key={embed}
            className="music__player"
            src={embed}
            title="Playlist no Spotify"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
          <div className="music__links">
            <a className="link-btn" href={url} target="_blank" rel="noopener noreferrer">
              Abrir no Spotify <Icon name="external" size={13} />
            </a>
            {!SPOTIFY_PLAYLIST_URL && (
              <button type="button" className="link-btn" onClick={() => setSavedUrl('')}>
                Trocar playlist
              </button>
            )}
          </div>
          <p className="meta music__note">
            Sem estar conectado ao Spotify neste navegador, o Spotify toca só prévias de 30 segundos. Com a conta
            conectada, as músicas tocam inteiras.
          </p>
        </>
      ) : (
        <form className="music__form card" onSubmit={save}>
          <label htmlFor="spotify-link" className="music__label">
            Cole o link de uma playlist do Spotify
          </label>
          <div className="music__row">
            <input
              id="spotify-link"
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://open.spotify.com/playlist/…"
              inputMode="url"
              autoComplete="off"
              aria-invalid={error}
            />
            <button type="submit" className="btn btn--solid">
              Tocar aqui
            </button>
          </div>
          <p className="meta">
            {error
              ? 'Esse link não parece ser do Spotify. No app do Spotify: Compartilhar → Copiar link da playlist.'
              : 'No app do Spotify: Compartilhar → Copiar link da playlist.'}
          </p>
        </form>
      )}
    </div>
  );
}
