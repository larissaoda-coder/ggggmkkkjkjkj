/** Converte um link ou URI do Spotify no endereço do player incorporado. */
export function spotifyEmbedUrl(input: string, dark: boolean): string | null {
  const value = input.trim();
  const match =
    value.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?(playlist|album|track|artist)\/([A-Za-z0-9]+)/) ??
    value.match(/^spotify:(playlist|album|track|artist):([A-Za-z0-9]+)$/);
  if (!match) return null;
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator${dark ? '&theme=0' : ''}`;
}
