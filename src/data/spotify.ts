/**
 * Playlist do Spotify exibida na aba Músicas.
 *
 * Cole aqui o link da playlist (no Spotify: Compartilhar → Copiar link da playlist).
 * Exemplo: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
 *
 * Enquanto estiver vazio, a própria aba Músicas oferece um campo para colar o link
 * (salvo apenas no navegador em que foi colado).
 */
export const SPOTIFY_PLAYLIST_URL = '';

/** Converte um link ou URI do Spotify no endereço do player incorporado. */
export function spotifyEmbedUrl(input: string, dark: boolean): string | null {
  const value = input.trim();
  const match =
    value.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?(playlist|album|track|artist)\/([A-Za-z0-9]+)/) ??
    value.match(/^spotify:(playlist|album|track|artist):([A-Za-z0-9]+)$/);
  if (!match) return null;
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator${dark ? '&theme=0' : ''}`;
}
