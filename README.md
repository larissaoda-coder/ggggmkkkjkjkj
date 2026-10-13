# Annelise

Um site simples com uma carta para Annelise, dez fragmentos e uma playlist do Spotify.

## Páginas

| Endereço      | Conteúdo                                                                                |
| ------------- | --------------------------------------------------------------------------------------- |
| `/`           | Abertura com o nome e o botão para ler a carta.                                         |
| `/carta`      | A carta inteira, com progresso de leitura, tamanho da letra e posição de leitura salva. |
| `/fragmentos` | Os dez fragmentos; cada um abre em página própria, com anterior e seguinte.             |
| `/musicas`    | A playlist do Spotify, tocando dentro do site.                                          |

Os textos originais estão em `src/data/letter.ts` e `src/data/fragments.ts`, sem edição.

## Playlist do Spotify

Cole o link da playlist em `src/data/spotify.ts`:

```ts
export const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/…';
```

Quem não estiver conectado ao Spotify no navegador ouve prévias de 30 segundos; com a conta conectada, as
músicas tocam inteiras.

## Rodar e publicar

```bash
npm install
npm run dev     # servidor local
npm test        # confere a integridade dos textos
npm run build   # gera dist/
```

O conteúdo de `dist/` pode ser publicado em qualquer hospedagem estática. Para o GitHub Pages, ative
_Settings → Pages → Source: GitHub Actions_ e rode o workflow `.github/workflows/deploy.yml`.
