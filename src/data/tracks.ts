/**
 * Catálogo de músicas.
 *
 * Três tipos de fonte, todos reais:
 *  - 'audio'    → arquivo de áudio (coloque em /public/audio ou use uma URL
 *                 pública). Reprodução completa: barra de progresso, volume etc.
 *  - 'youtube'  → reprodução pela API oficial de iframe do YouTube. Basta o ID
 *                 do vídeo (o trecho depois de "v=" no link).
 *  - 'external' → apenas um link. A faixa abre fora do aplicativo, e a
 *                 interface deixa isso explícito.
 *
 * As duas faixas abaixo marcadas com `demo: true` são DEMONSTRAÇÕES: peças
 * curtas geradas por `scripts/generate-demo-audio.py`, apenas para que o
 * reprodutor possa ser experimentado. Substitua-as pelas músicas de vocês
 * (veja exemplos comentados no fim do arquivo) — a etiqueta "demonstração"
 * some sozinha quando `demo` não estiver presente.
 */

export type TrackSource =
  { kind: 'audio'; src: string } | { kind: 'youtube'; videoId: string } | { kind: 'external'; url: string };

export interface TrackLink {
  label: string;
  url: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  category: string;
  source: TrackSource;
  /** Imagem de capa opcional. Sem ela, o app desenha uma capa geométrica. */
  cover?: string;
  /** Links para ouvir na plataforma original. */
  links?: TrackLink[];
  /** Uma linha opcional, exibida abaixo do título. */
  note?: string;
  demo?: boolean;
  /** Faixas adicionadas pelo próprio app (salvas neste navegador). */
  local?: boolean;
}

/** Categorias exibidas como filtros, na ordem desejada. */
export const categories: string[] = ['Para ouvir devagar', 'Para a noite', 'Para dividir'];

export const tracks: Track[] = [
  {
    id: 'demo-chuva',
    title: 'Estudo para uma noite de chuva',
    artist: 'Gerada para este projeto',
    category: 'Para a noite',
    source: { kind: 'audio', src: 'audio/demo-estudo-chuva.mp3' },
    note: 'Peça gerada para testar o reprodutor. Substitua por uma música de vocês.',
    demo: true,
  },
  {
    id: 'demo-manha',
    title: 'Peça para uma manhã lenta',
    artist: 'Gerada para este projeto',
    category: 'Para ouvir devagar',
    source: { kind: 'audio', src: 'audio/demo-manha-lenta.mp3' },
    note: 'Peça gerada para testar o reprodutor. Substitua por uma música de vocês.',
    demo: true,
  },

  /* Exemplos de configuração (descomente e preencha):

  {
    id: 'nossa-musica',
    title: 'Título da música',
    artist: 'Artista',
    category: 'Para dividir',
    source: { kind: 'youtube', videoId: 'ID_DO_VIDEO' },
    links: [
      { label: 'Spotify', url: 'https://open.spotify.com/track/...' },
      { label: 'Apple Music', url: 'https://music.apple.com/...' },
    ],
  },
  {
    id: 'arquivo-local',
    title: 'Outra música',
    artist: 'Artista',
    category: 'Para a noite',
    source: { kind: 'audio', src: 'audio/outra-musica.mp3' },
  },
  {
    id: 'so-no-spotify',
    title: 'Uma faixa que abre fora do app',
    artist: 'Artista',
    category: 'Para ouvir devagar',
    source: { kind: 'external', url: 'https://open.spotify.com/track/...' },
  },
  */
];

/** Extrai o ID de um link do YouTube (watch, youtu.be, shorts, embed, music). */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return url.pathname.slice(1, 12) || null;
    if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {
    /* não é uma URL */
  }
  return null;
}

/** Nome legível da plataforma de um link externo. */
export function platformName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('spotify')) return 'Spotify';
    if (host.includes('music.apple')) return 'Apple Music';
    if (host.includes('deezer')) return 'Deezer';
    if (host.includes('youtube') || host === 'youtu.be') return 'YouTube';
    if (host.includes('soundcloud')) return 'SoundCloud';
    if (host.includes('tidal')) return 'Tidal';
    if (host.includes('bandcamp')) return 'Bandcamp';
    return host;
  } catch {
    return 'link';
  }
}
