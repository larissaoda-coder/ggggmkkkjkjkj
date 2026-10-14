# Para Annelise

Um site pessoal, em português, com uma carta, dez fragmentos e várias áreas para ler, ver, ouvir e explorar com
calma. Visual minimalista em preto e branco: papel claro, muito espaço, fotografias tratadas como objetos (cópias
antigas com borda serrilhada, polaroides, recortes de papel). Tipografia: EB Garamond no texto e nos títulos, com
versaletes nos nomes, e Jost nos números e etiquetas — servidas junto com o site. Sem dependências além de React,
React Router e Framer Motion.

As fotografias do arquivo ficam em `public/fotos/` e estão listadas em `src/content/defaults.ts`.

Os textos originais da carta e dos fragmentos estão em `src/data/letter.ts` e `src/data/fragments.ts`, sem
edição; um teste confere isso.

## Áreas

| Endereço         | Área                        | O que faz                                                                                       |
| ---------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `/`              | Abertura                    | Título, subtítulo e o botão Entrar.                                                             |
| `/indice`        | Índice                      | Todas as áreas por grupo; marca o que já foi visto.                                             |
| `/carta`         | A carta                     | A carta inteira, com progresso e tamanho de letra.                                              |
| `/livro`         | Algumas coisas sobre você   | Livro com capa, dedicatória, carta, dez fragmentos e fotografias; páginas viram em 3D.          |
| `/cartas`        | Cartas guardadas            | Cinco envelopes "Abra quando…", cada um com sua animação; a mensagem pode ser guardada.         |
| `/dicionario`    | Termos particulares         | Verbetes com busca e navegação por letra.                                                       |
| `/arquivo`       | Arquivo pessoal             | Fotografias em mosaico, coleções, polaroides e tela cheia com legenda e dedicatória.            |
| `/museu`         | Coisas que merecem registro | Peças com fotografia ou objeto, etiqueta de museu, frase e texto.                               |
| `/quebra-cabeca` | Uma imagem por partes       | Quebra-cabeça de uma fotografia: arrastar, trocar, girar peças, progresso e mensagem final.     |
| `/radio`         | Faixas selecionadas         | Player de áudio real, fila, Spotify, links e o modo rádio "Frequência Annelise".                |
| `/mapa`          | Pontos de referência        | Pontos que abrem fotografia, fragmento, música, pergunta, carta curta e um segredo.             |
| `/oraculo`       | Uma leitura simbólica       | Baralho próprio, embaralhamento real, três cartas escolhidas, leitura e carta escondida.        |
| `/futuro`        | Em outra fase da vida       | Sete cenas imaginadas em formato de conversa.                                                   |
| `/intervalo`     | Um intervalo                | Lago interativo com ondulações, pétalas e detalhes para perceber; som e movimento controláveis. |
| `/antes-de-sair` | Antes de sair               | Página final, liberada depois de algumas áreas vistas.                                          |
| `/admin`         | Administração               | Edição de fotos, textos, músicas, mapa, cartas, dicionário, museu, cenas e da página final.     |

O menu também guarda as preferências: tema (sistema, claro, escuro), reduzir movimento, sons do jardim e texto
maior.

## Onde o conteúdo fica salvo

O conteúdo editável (tudo, menos a carta e os fragmentos) vem de três camadas, nesta ordem:

1. **Padrão** em `src/content/defaults.ts`. Não há fotografias nem faixas inventadas: essas áreas começam
   vazias.
2. **`public/content.json`** (opcional): o conteúdo publicado junto com o site. Pode ser gerado em
   _Administração → Exportar e importar_.
3. **O que foi salvo pela administração**, que depende de onde o site está:

| Onde o site roda                              | Salvar e enviar fotos                                                                                                         | Quem vê as alterações                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Publicado como artifact no claude.ai          | Banco de dados e armazenamento de arquivos do próprio artifact. Só contas com permissão de edição salvam (regra no servidor). | Quem abre conectado ao claude.ai. Visitantes sem login veem o `content.json` publicado. |
| Qualquer outra hospedagem (GitHub Pages etc.) | Apenas no navegador de quem administra (localStorage e IndexedDB). Não há login: a área não é protegida.                      | Ninguém além desse navegador, até o conteúdo ser exportado para `public/content.json`.  |

## Playlist

A playlist do Spotify fica em `spotifyPlaylist` (padrão em `src/content/defaults.ts`, editável em
_Administração → Músicas_). Ela toca num player fixo no canto da tela e continua entre as páginas.

Navegadores não permitem som antes de a pessoa interagir com a página, então a playlist começa no primeiro toque
ou clique (normalmente o botão Entrar). Se o navegador recusar mesmo assim (acontece no iPhone), o player abre
pedindo um toque no play do Spotify. Sem conta do Spotify conectada no navegador, o Spotify toca prévias de 30
segundos. A opção _Tocar a playlist ao entrar_ no menu desliga o início automático. No claude.ai o player do
Spotify não carrega; lá a página mostra um link para abrir a playlist.

Limites conhecidos:

- No claude.ai não é possível enviar arquivos de áudio nem incorporar o player do Spotify; a rádio usa endereços
  de arquivos `.mp3` e mostra um link para abrir no Spotify.
- Fotografias e áudios guardados no navegador (endereços `idb:`) não vão junto ao exportar. Para publicar, coloque
  os arquivos em `public/` e use o endereço deles (por exemplo `fotos/praia.jpg`).
- O progresso de quem visita (áreas vistas, envelopes abertos, página final) fica no aparelho dessa pessoa.

## Rodar e publicar

```bash
npm install
npm run dev     # servidor local
npm test        # textos originais, paginação do livro e conteúdo padrão
npm run build   # gera dist/
```

O conteúdo de `dist/` pode ser publicado em qualquer hospedagem estática. Para o GitHub Pages, ative
_Settings → Pages → Source: GitHub Actions_; o workflow `.github/workflows/deploy.yml` publica a cada push em
`main` ou `claude/annelise-app` (ou manualmente, em _Actions → Publicar no GitHub Pages → Run workflow_).

O endereço fica `https://larissaoda-coder.github.io/ggggmkkkjkjkj/`. Para um nome mais curto sem custo, renomeie o
repositório (_Settings → General → Repository name_, por exemplo `para-annelise`); o endereço passa a ser
`https://larissaoda-coder.github.io/para-annelise/`.

### Domínio próprio

1. Compre o domínio (por exemplo em registro.br para `.com.br`).
2. No painel do domínio, crie os registros DNS:
   - `A` em `@` apontando para `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`;
   - `CNAME` em `www` apontando para `larissaoda-coder.github.io`.
3. Crie o arquivo `public/CNAME` contendo só o domínio (por exemplo `paraannelise.com.br`) e publique.
4. Em _Settings → Pages → Custom domain_, informe o mesmo domínio e marque _Enforce HTTPS_ quando liberar.

Os caminhos do build são relativos (`base: './'`), então o mesmo build funciona no endereço do GitHub e no domínio
próprio.
