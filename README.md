# Annelise

Uma aplicação web pessoal, feita para Annelise: uma carta no centro e, ao redor
dela, experiências interativas que convidam a explorar sem pressa e sem
pressão.

Tudo roda no navegador. Não há login, servidor, conta ou sincronização:
preferências e progresso ficam guardados apenas no `localStorage` do
dispositivo em que o app é aberto.

## Seções

| Rota            | Seção                         | O que faz                                                                                                                                                |
| --------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | Início                        | O nome, uma frase e uma forma discreta de entrar.                                                                                                        |
| `/sumario`      | Sumário                       | Índice editorial de todas as seções; marca as já visitadas.                                                                                              |
| `/carta`        | 01 · Texto                    | A carta, integral. Envelope que se abre (com opção de pular), progresso de leitura, tamanho de fonte, tema, voltar ao início e posição salva.            |
| `/fragmentos`   | 02 · Dez fragmentos           | Galeria de cartões numerados; cada fragmento abre em página própria, com anterior/seguinte, setas do teclado e gesto de deslizar.                        |
| `/escolhas`     | 03 · Simulador de escolhas    | “Depois da chuva”: história ficcional em 5 capítulos, mais de 50 cenas, 7 desfechos, histórico de decisões com “voltar a este momento”, progresso salvo. |
| `/musicas`      | 04 · Músicas                  | Reprodutor persistente (continua tocando entre seções), barra de progresso, volume, categorias, links para a plataforma original e “adicionar faixa”.    |
| `/labirinto`    | O labirinto de possibilidades | Mapa de pontos e linhas; escolhas revelam lugares, fecham outros (mostrados como “não tomados”) e deixam marcas que mudam o que vem depois.              |
| `/mesa`         | A mesa de escolhas            | Peças arrastáveis em duas composições (prioridades / convivência), desfazer, reiniciar, até 3 composições salvas e uma leitura visual que se adapta.     |
| `/noite`        | Uma noite, vários caminhos    | Um cômodo com objetos clicáveis: luz, chuva, vitrola, chá, livro, conversa, relógio. Cada gesto muda o ambiente e as ações seguintes.                    |
| `/caminho`      | Encontre seu próprio caminho  | Um dia imaginário em etapas (bolsa → hora → mapa → lugar), cada uma com uma interface própria. Sem pontuação nem diagnóstico.                            |
| `/intervalo`    | O intervalo                   | Composições em canvas que respondem ao toque/cursor; velocidade, pausa, troca de composição e saída imediata (Esc).                                      |
| `/ajustes`      | Personalização do espaço      | Tema, 3 combinações tipográficas, tamanho do texto, intensidade das animações, efeitos sonoros, menu lateral/superior, rótulos e menu que se esconde.    |
| `/observatorio` | (descoberta opcional)         | Ver abaixo.                                                                                                                                              |

### A descoberta opcional

Em **Uma noite, vários caminhos**, com o abajur apagado, o céu limpo e depois
das 21h, uma estrela diferente aparece na janela. Tocá-la abre o
**Observatório**: um céu noturno em que cada seção visitada vira uma estrela, e
é possível ligá-las e dar nome a uma constelação. Depois de encontrado, ele
ganha um atalho discreto no menu. Nada essencial depende dele.

## Textos

- A carta está em `src/data/letter.ts` (um item por parágrafo).
- Os dez fragmentos estão em `src/data/fragments.ts`.

Os dois arquivos contêm os textos originais, sem edição. Os testes
(`src/data/content.test.ts`) verificam início, fim, número de parágrafos e a
correspondência título/texto dos fragmentos.

## Músicas: como configurar

Edite `src/data/tracks.ts`. Há três tipos de fonte, todos reais:

```ts
// 1. Arquivo de áudio — coloque o arquivo em public/audio/
{ id: 'a', title: '…', artist: '…', category: 'Para a noite',
  source: { kind: 'audio', src: 'audio/minha-musica.mp3' } }

// 2. YouTube — toca dentro do app pela API oficial de iframe
{ id: 'b', title: '…', artist: '…', category: 'Para dividir',
  source: { kind: 'youtube', videoId: 'ID_DO_VIDEO' },
  links: [{ label: 'Spotify', url: 'https://open.spotify.com/track/…' }] }

// 3. Link externo — a interface deixa claro que a faixa abre fora do app
{ id: 'c', title: '…', artist: '…', category: 'Para ouvir devagar',
  source: { kind: 'external', url: 'https://open.spotify.com/track/…' } }
```

As categorias exibidas como filtros ficam em `categories`, no mesmo arquivo.
Também é possível adicionar faixas pela própria página (“Adicionar uma
faixa”); essas ficam salvas só no navegador em que foram adicionadas.

> **Demonstração.** As duas faixas incluídas (`public/audio/demo-*.mp3`) são
> peças curtas geradas por `scripts/generate-demo-audio.py` apenas para que o
> reprodutor possa ser testado. Elas aparecem com a etiqueta “demonstração”.
> Remova-as de `tracks.ts` (e os arquivos de `public/audio/`) ao incluir as
> músicas de vocês.

Observações honestas sobre limites:

- Vídeos do YouTube cujo autor bloqueia a reprodução incorporada mostram uma
  mensagem e o link para abrir no YouTube.
- O vídeo do YouTube aparece num pequeno quadro no canto (pode ser recolhido sem
  parar a música), como exigem os termos do YouTube.
- No iPhone/iPad, o volume de arquivos de áudio só pode ser controlado pelos
  botões do aparelho; o app indica isso no lugar do controle deslizante.

## Desenvolvimento

Requer Node 20 ou superior.

```bash
npm install
npm run dev        # servidor local
npm test           # testes (integridade dos textos e das histórias)
npm run build      # gera dist/
npm run preview    # serve o build
```

### Estrutura

```
src/
  app/          navegação, layout e registro de seções
  components/   componentes reutilizáveis (ícones, controles, navegação, mini-player)
  context/      preferências, progresso e reprodutor (estado global)
  data/         textos originais e catálogo de músicas
  features/     cada experiência: dados/lógica (.ts) + interface (.tsx) + estilo (.css)
  lib/          persistência local, sons sintetizados, YouTube, utilidades
  pages/        início, sumário, carta, fragmentos, ajustes
  styles/       tokens de cor e tipografia, base e layout
```

A lógica de cada experiência fica separada da interface
(`story.ts`/`engine.ts`, `map.ts`, `pieces.ts`, `night.ts`, `paths.ts`) e é
coberta por testes que percorrem os caminhos possíveis (por exemplo: toda cena
do simulador é alcançável e todos os 7 desfechos podem ser atingidos).

### Decisões de projeto

- **Roteamento por hash** (`/#/carta`): funciona em qualquer hospedagem
  estática sem configuração de servidor.
- **Fontes locais** (`@fontsource`): nada é carregado de serviços de terceiros
  até que se toque uma faixa do YouTube.
- **Sons sintetizados** com a Web Audio API: desativados por padrão; nenhum
  arquivo de efeito sonoro.
- **Movimento**: respeita `prefers-reduced-motion` (modo “Automática”) e pode
  ser ajustado em Ajustes.
- **Acessibilidade**: navegação por teclado em todas as experiências (inclusive
  mapa, mesa e cômodo), estados de foco visíveis, rótulos para leitores de tela,
  alvos de toque confortáveis.

## Publicação

O build (`dist/`) é um site estático e pode ser publicado em qualquer
hospedagem (GitHub Pages, Netlify, Vercel, Cloudflare Pages, um servidor
comum). Os caminhos são relativos, então também funciona em subpastas.

Para o **GitHub Pages**, há um workflow em `.github/workflows/deploy.yml`:
ative _Settings → Pages → Source: GitHub Actions_ no repositório e faça push na
branch `main` (ou rode o workflow manualmente).

O `index.html` inclui `noindex, nofollow` para que o endereço não apareça em
buscadores.
