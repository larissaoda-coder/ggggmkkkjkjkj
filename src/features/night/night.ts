/**
 * Uma noite, vários caminhos — um cômodo explorável.
 * Cada ação muda o estado do cômodo (luz, chuva, música, mesa, relógio) e o
 * que pode acontecer depois. Não há história longa: só gestos e consequências.
 */

export type Disc = 'nenhum' | 'piano' | 'baixo' | 'aberto';
export type Tea = 'nada' | 'fervendo' | 'pronto' | 'servido';

export interface NightState {
  minutes: number; // minutos desde as 20h
  lamp: boolean;
  rain: boolean;
  windowOpen: boolean;
  music: Disc;
  tea: Tea;
  food: boolean;
  reading: boolean;
  plant: number;
  talked: string[];
  log: { t: number; text: string }[];
  ended: boolean;
}

export const initialNight = (): NightState => ({
  minutes: 0,
  lamp: true,
  rain: false,
  windowOpen: false,
  music: 'nenhum',
  tea: 'nada',
  food: false,
  reading: false,
  plant: 0,
  talked: [],
  log: [{ t: 0, text: 'A noite começa. O cômodo está quieto, e há tempo.' }],
  ended: false,
});

export const END_AT = 300; // 01h

export const records: { id: Exclude<Disc, 'nenhum'>; label: string }[] = [
  { id: 'piano', label: 'Piano lento' },
  { id: 'baixo', label: 'Contrabaixo' },
  { id: 'aberto', label: 'Acordes abertos' },
];

export type ObjectId = 'janela' | 'abajur' | 'vitrola' | 'cozinha' | 'poltrona' | 'mesa' | 'planta' | 'relogio';

export interface Action {
  id: string;
  label: string;
  /** Ação indisponível, mas visível com explicação contextual. */
  disabledReason?: string;
  run: (s: NightState) => NightState;
}

export const clock = (minutes: number) => {
  const total = 20 * 60 + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
};

function step(s: NightState, minutes: number, text: string, patch: Partial<NightState> = {}): NightState {
  const t = Math.min(END_AT, s.minutes + minutes);
  return { ...s, ...patch, minutes: t, log: [...s.log, { t, text }] };
}

export const objectNames: { [K in ObjectId]: string } = {
  janela: 'A janela',
  abajur: 'O abajur',
  vitrola: 'A vitrola',
  cozinha: 'A cozinha',
  poltrona: 'A poltrona',
  mesa: 'A mesa',
  planta: 'A planta',
  relogio: 'O relógio',
};

export function describeObject(id: ObjectId, s: NightState): string {
  switch (id) {
    case 'janela':
      return s.rain
        ? s.windowOpen
          ? 'Chove lá fora, e a janela aberta deixa entrar o cheiro da chuva.'
          : 'A chuva escorre pelo vidro em fios finos.'
        : s.lamp
          ? 'O céu está limpo. Daqui, com a luz acesa, mal se veem as estrelas.'
          : 'Com o abajur apagado, o céu da janela parece maior.';
    case 'abajur':
      return s.lamp ? 'Uma luz quente sobre a poltrona.' : 'Apagado. A luz que resta vem da janela.';
    case 'vitrola':
      return s.music === 'nenhum'
        ? 'Três discos ao lado da vitrola, esperando.'
        : `Tocando: ${records.find((r) => r.id === s.music)?.label}.`;
    case 'cozinha':
      return s.tea === 'fervendo'
        ? 'A chaleira começa a chiar.'
        : s.tea === 'pronto'
          ? 'O chá está pronto.'
          : 'Uma chaleira, um pão do dia, uma fruta.';
    case 'poltrona':
      return s.reading ? 'O livro está aberto no braço da poltrona.' : 'Uma poltrona funda e um livro fechado ao lado.';
    case 'mesa':
      return s.tea === 'servido' || s.food
        ? 'Há coisas sobre a mesa agora — e duas cadeiras.'
        : 'Uma mesa pequena, com duas cadeiras.';
    case 'planta':
      return [
        'Uma planta um pouco esquecida.',
        'A terra ainda está úmida.',
        'Folhas novas começam a aparecer.',
        'Ela parece agradecida.',
      ][Math.min(3, s.plant)];
    case 'relogio':
      return s.minutes >= END_AT ? 'Já passa da uma.' : `São ${clock(s.minutes)}.`;
  }
}

/** Assuntos de conversa que dependem do que já aconteceu no cômodo. */
const topics: { id: string; label: string; when: (s: NightState) => boolean; lines: string }[] = [
  {
    id: 'chuva',
    label: 'Falar sobre a chuva',
    when: (s) => s.rain,
    lines: '— Parece que não vai parar tão cedo. — Melhor assim. Ninguém precisa ir a lugar nenhum.',
  },
  {
    id: 'cha',
    label: 'Brindar com chá',
    when: (s) => s.tea === 'servido',
    lines: 'Duas xícaras se encostam sem barulho. Um brinde a nada em particular — que é, às vezes, o melhor motivo.',
  },
  {
    id: 'musica',
    label: 'Perguntar sobre o disco',
    when: (s) => s.music !== 'nenhum',
    lines: '— Você conhecia esse disco? — Não. Mas agora vou lembrar dele por causa desta noite.',
  },
  {
    id: 'livro',
    label: 'Contar sobre o livro',
    when: (s) => s.reading,
    lines:
      'Você conta o começo do livro, e a conversa acaba indo para outro lugar — como costumam ir as boas conversas.',
  },
  {
    id: 'janela',
    label: 'Ouvir a cidade pela janela',
    when: (s) => s.windowOpen && !s.rain,
    lines: 'Um ônibus ao longe, uma risada no prédio da frente. Vocês ficam em silêncio, ouvindo a cidade viver.',
  },
  {
    id: 'escuro',
    label: 'Conversar no escuro',
    when: (s) => !s.lamp,
    lines: 'No escuro, as frases saem mais devagar e mais verdadeiras.',
  },
  {
    id: 'comida',
    label: 'Dividir o pão',
    when: (s) => s.food,
    lines: 'O pão é dividido ao meio, sem cerimônia. A fruta fica para depois.',
  },
  {
    id: 'qualquer',
    label: 'Falar de qualquer coisa',
    when: () => true,
    lines: 'Uma conversa sem assunto definido, que dura mais do que qualquer uma das duas partes esperava.',
  },
];

export function availableTopics(s: NightState) {
  return topics.filter((t) => t.when(s) && !s.talked.includes(t.id));
}

export function actionsFor(id: ObjectId, s: NightState): Action[] {
  const ended = s.ended;
  const a: Action[] = [];
  switch (id) {
    case 'janela':
      if (!s.rain)
        a.push({
          id: 'chuva',
          label: 'Esperar a chuva',
          run: (x) => step(x, 20, 'Nuvens chegam devagar. Começa a chover.', { rain: true }),
        });
      else {
        a.push({
          id: 'observar',
          label: 'Observar a chuva',
          run: (x) => step(x, 15, 'Você observa a chuva por um tempo. Nada acontece, e isso é bom.'),
        });
        a.push({
          id: 'passar',
          label: 'Esperar a chuva passar',
          run: (x) => step(x, 30, 'A chuva diminui até parar. O céu fica limpo.', { rain: false }),
        });
      }
      a.push(
        s.windowOpen
          ? {
              id: 'fechar',
              label: 'Fechar a janela',
              run: (x) => step(x, 5, 'A janela se fecha; o cômodo fica mais silencioso.', { windowOpen: false }),
            }
          : {
              id: 'abrir',
              label: 'Abrir a janela',
              run: (x) =>
                step(
                  x,
                  5,
                  x.rain
                    ? 'Com a janela aberta, o cheiro da chuva entra.'
                    : 'Entra um ar fresco, e com ele os sons da cidade.',
                  {
                    windowOpen: true,
                  },
                ),
            },
      );
      break;
    case 'abajur':
      a.push(
        s.lamp
          ? {
              id: 'apagar',
              label: 'Apagar o abajur',
              run: (x) =>
                step(
                  x,
                  5,
                  x.rain
                    ? 'A luz se apaga. Restam a chuva e o reflexo da rua.'
                    : 'A luz se apaga. Aos poucos, os olhos se acostumam, e o céu da janela aparece inteiro.',
                  {
                    lamp: false,
                    reading: false,
                  },
                ),
            }
          : {
              id: 'acender',
              label: 'Acender o abajur',
              run: (x) => step(x, 5, 'A luz quente volta a ocupar o cômodo.', { lamp: true }),
            },
      );
      break;
    case 'vitrola':
      records.forEach((r) => {
        if (s.music !== r.id)
          a.push({
            id: r.id,
            label: `Tocar “${r.label}”`,
            run: (x) => step(x, 10, `O disco “${r.label}” começa a girar.`, { music: r.id }),
          });
      });
      if (s.music !== 'nenhum')
        a.push({
          id: 'parar',
          label: 'Parar a música',
          run: (x) => step(x, 5, 'A agulha se levanta. Volta o silêncio.', { music: 'nenhum' }),
        });
      break;
    case 'cozinha':
      if (s.tea === 'nada')
        a.push({
          id: 'cha',
          label: 'Pôr água para ferver',
          run: (x) => step(x, 10, 'A chaleira vai ao fogo.', { tea: 'fervendo' }),
        });
      if (s.tea === 'fervendo')
        a.push({
          id: 'esperar',
          label: 'Esperar a água ferver',
          run: (x) => step(x, 10, 'A água ferve. O chá fica pronto.', { tea: 'pronto' }),
        });
      if (s.tea === 'pronto')
        a.push({
          id: 'servir',
          label: 'Servir duas xícaras',
          run: (x) => step(x, 5, 'Duas xícaras vão para a mesa.', { tea: 'servido' }),
        });
      if (!s.food)
        a.push({
          id: 'comer',
          label: 'Preparar algo para comer',
          run: (x) => step(x, 20, 'Pão, queijo e uma fruta cortada — vão para a mesa.', { food: true }),
        });
      break;
    case 'poltrona':
      if (!s.reading)
        a.push({
          id: 'ler',
          label: 'Sentar e ler um pouco',
          disabledReason: s.lamp ? undefined : 'Está escuro demais para ler. O abajur ajudaria.',
          run: (x) => step(x, 30, 'Você lê alguns capítulos. O tempo passa sem pedir licença.', { reading: true }),
        });
      else
        a.push({
          id: 'fechar',
          label: 'Fechar o livro',
          run: (x) => step(x, 5, 'O livro fecha, marcado na página certa.', { reading: false }),
        });
      a.push({
        id: 'cochilar',
        label: 'Fechar os olhos por um instante',
        run: (x) => step(x, 25, 'Um cochilo breve. Ao abrir os olhos, a noite avançou.'),
      });
      break;
    case 'mesa': {
      const avail = availableTopics(s);
      avail.slice(0, 3).forEach((t) =>
        a.push({
          id: `conversa-${t.id}`,
          label: t.label,
          run: (x) => step(x, 20, t.lines, { talked: [...x.talked, t.id] }),
        }),
      );
      if (s.tea === 'servido' || s.food)
        a.push({
          id: 'tirar',
          label: 'Tirar a mesa',
          run: (x) => step(x, 10, 'A mesa fica limpa de novo.', { tea: 'nada', food: false }),
        });
      break;
    }
    case 'planta':
      if (s.plant < 3)
        a.push({
          id: 'regar',
          label: 'Regar a planta',
          run: (x) => step(x, 5, 'Um pouco de água na terra seca.', { plant: x.plant + 1 }),
        });
      else
        a.push({
          id: 'olhar',
          label: 'Olhar as folhas novas',
          run: (x) => step(x, 5, 'As folhas novas estão voltadas para a janela.'),
        });
      break;
    case 'relogio':
      if (s.minutes < END_AT)
        a.push({
          id: 'avancar',
          label: 'Deixar meia hora passar',
          run: (x) => step(x, 30, 'Meia hora passa, sem pressa.'),
        });
      if (s.minutes >= 180 && !s.ended)
        a.push({
          id: 'terminar',
          label: 'Encerrar a noite',
          run: (x) => ({ ...step(x, 0, 'A noite termina.'), ended: true }),
        });
      break;
  }
  return ended ? [] : a;
}

/** Um título para a noite, construído a partir do que aconteceu. */
export function nightTitle(s: NightState): string {
  const parts: string[] = [];
  const everRain = s.rain || s.log.some((l) => l.text.includes('chover') || l.text.includes('chuva'));
  parts.push(everRain ? 'chuva' : 'céu limpo');
  const rec = s.log.map((l) => records.find((r) => l.text.includes(r.label))).filter(Boolean);
  if (rec.length) parts.push(rec[rec.length - 1]!.label.toLowerCase());
  if (s.log.some((l) => l.text.includes('Duas xícaras'))) parts.push('chá');
  if (s.log.some((l) => l.text.includes('Pão, queijo'))) parts.push('pão dividido');
  if (s.log.some((l) => l.text.includes('capítulos'))) parts.push('um livro');
  if (s.talked.length) parts.push(s.talked.length > 1 ? 'conversas' : 'uma conversa');
  if (parts.length === 1) return `Uma noite de ${parts[0]}`;
  return `Uma noite de ${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

/** Condição da descoberta opcional: luz apagada, céu limpo, depois das 21h. */
export function starVisible(s: NightState): boolean {
  return !s.lamp && !s.rain && s.minutes >= 60 && !s.ended;
}
