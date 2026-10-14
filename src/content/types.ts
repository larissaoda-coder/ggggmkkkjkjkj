/**
 * Modelo de conteúdo editável do projeto.
 *
 * Tudo o que a área administrativa altera vive aqui. Os textos originais da
 * carta e dos fragmentos ficam fora deste modelo (src/data) e não são
 * editáveis pelo painel, para que não sejam alterados por engano.
 */

export type PhotoCategory = 'retratos' | 'detalhes' | 'favoritas';

export interface Photo {
  id: string;
  /** Endereço da imagem: '/_blob/<id>' (artifact), 'idb:<id>' (navegador) ou uma URL. */
  src: string;
  width: number;
  height: number;
  caption: string;
  dedication: string;
  category: PhotoCategory;
  frame: 'livre' | 'polaroide';
  inBook: boolean;
}

export type TrackKind = 'audio' | 'spotify' | 'link';

export interface Track {
  id: string;
  title: string;
  artist: string;
  note: string;
  kind: TrackKind;
  /** Arquivo de áudio (URL), link do Spotify ou outro link. */
  url: string;
  /** Fotografia usada como capa (id de Photo) — opcional. */
  coverPhotoId: string;
}

export type StarKind = 'foto' | 'texto' | 'musica' | 'pergunta' | 'carta' | 'segredo';
export type StarCategory = 'memoria' | 'musica' | 'texto' | 'pergunta';

export interface Star {
  id: string;
  kind: StarKind;
  category: StarCategory;
  title: string;
  body: string;
  /** Para 'texto': número de um dos dez fragmentos (0 = usar o corpo). */
  fragment: number;
  photoId: string;
  trackId: string;
  x: number;
  y: number;
}

export interface Envelope {
  id: string;
  label: string;
  body: string;
}

export interface DictEntry {
  id: string;
  word: string;
  grammar: string;
  definition: string;
  example: string;
}

export interface Exhibit {
  id: string;
  title: string;
  object: string;
  phrase: string;
  text: string;
  photoId: string;
  date: string;
  material: string;
}

export interface FutureLine {
  who: 'hoje' | 'adiante';
  text: string;
}

export interface FutureScene {
  id: string;
  title: string;
  lines: FutureLine[];
}

export interface Content {
  version: 1;
  home: { title: string; subtitle: string; footer: string };
  book: { dedication: string };
  photos: Photo[];
  tracks: Track[];
  spotifyPlaylist: string;
  radio: { interludes: string[] };
  stars: Star[];
  oracle: { hiddenCard: string };
  envelopes: Envelope[];
  dictionary: DictEntry[];
  museum: Exhibit[];
  future: FutureScene[];
  puzzle: { photoId: string; size: 3 | 4; message: string };
  garden: { messages: string[] };
  secret: { requires: string[] };
  /** Ajustes de texto do simulador: falas e escolhas, por cena. */
  story: { lines: Record<string, string[]>; choices: Record<string, string[]> };
}
