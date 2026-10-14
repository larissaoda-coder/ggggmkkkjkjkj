type SpotifyKind = 'playlist' | 'album' | 'track' | 'artist';

function parse(input: string): { kind: SpotifyKind; id: string } | null {
  const value = input.trim();
  const match =
    value.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?(playlist|album|track|artist)\/([A-Za-z0-9]+)/) ??
    value.match(/^spotify:(playlist|album|track|artist):([A-Za-z0-9]+)$/);
  return match ? { kind: match[1] as SpotifyKind, id: match[2] } : null;
}

/** Converte um link ou URI do Spotify no endereço do player incorporado. */
export function spotifyEmbedUrl(input: string, dark: boolean): string | null {
  const p = parse(input);
  if (!p) return null;
  return `https://open.spotify.com/embed/${p.kind}/${p.id}?utm_source=generator${dark ? '&theme=0' : ''}`;
}

/** Converte um link do Spotify (com ou sem parâmetros como ?si=) em URI: spotify:playlist:… */
export function spotifyUri(input: string): string | null {
  const p = parse(input);
  return p ? `spotify:${p.kind}:${p.id}` : null;
}

/** Link limpo para abrir no Spotify. */
export function spotifyOpenUrl(input: string): string | null {
  const p = parse(input);
  return p ? `https://open.spotify.com/${p.kind}/${p.id}` : null;
}
