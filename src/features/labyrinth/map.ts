/**
 * O labirinto de possibilidades: um mapa de lugares ligados por caminhos.
 * Independente do simulador. Cada lugar guarda uma pequena situação; as
 * decisões revelam lugares novos, fecham outros e deixam marcas que mudam
 * o que se encontra mais adiante.
 */

export interface LabState {
  current: string;
  visited: string[];
  revealed: string[];
  closed: string[];
  decisions: Record<string, string>;
  flags: string[];
  /** Ordem em que os lugares foram percorridos. */
  trail: string[];
  lit: boolean;
}

export interface LabOption {
  id: string;
  label: string;
  result: string;
  reveal?: string[];
  /** Lugares que deixam de ser possíveis (aparecem como caminho não tomado). */
  close?: string[];
  set?: string[];
  requires?: string;
  lockedHint?: string;
}

export interface LabNode {
  id: string;
  x: number;
  y: number;
  name: string;
  text: (s: LabState) => string;
  options?: LabOption[];
}

const has = (s: LabState, f: string) => s.flags.includes(f);

export const nodes: LabNode[] = [
  {
    id: 'origem',
    x: 500,
    y: 500,
    name: 'Origem',
    text: (s) =>
      s.visited.length > 1
        ? 'O ponto de partida continua aqui, no meio de tudo. Voltar a ele não desfaz nenhum caminho.'
        : 'Um ponto no meio de tudo. Quatro caminhos partem daqui, e nenhum deles é o certo.',
  },

  /* ---------- norte ---------- */
  {
    id: 'escada',
    x: 500,
    y: 320,
    name: 'A escada',
    text: () => 'Uma escada em caracol sobe até onde a vista não alcança. Os degraus são estreitos, mas firmes.',
    options: [
      {
        id: 'subir',
        label: 'Subir até o fim',
        result: 'Lá em cima, uma porta dá para um terraço aberto.',
        reveal: ['terraco'],
      },
      {
        id: 'sentar',
        label: 'Sentar no degrau do meio',
        result:
          'Do meio da escada dá para ouvir a cidade de baixo e o vento de cima. Por uma janela estreita, você vê um jardim que não estava no mapa.',
        reveal: ['jardim'],
        set: ['pausa'],
      },
    ],
  },
  {
    id: 'terraco',
    x: 500,
    y: 140,
    name: 'O terraço',
    text: (s) =>
      has(s, 'pausa')
        ? 'Você chegou ao terraço sem pressa, e a cidade parece esperar por você.'
        : 'A cidade inteira cabe daqui. Falta pouco para amanhecer.',
    options: [
      {
        id: 'amanhecer',
        label: 'Esperar o amanhecer',
        result:
          'O sol nasce devagar, primeiro nas antenas, depois nas janelas. Do outro lado do mapa, um jardim se ilumina.',
        reveal: ['jardim'],
        set: ['amanhecer'],
      },
      {
        id: 'descer',
        label: 'Descer pela outra escada',
        result: 'A outra escada termina numa rua estreita que você não conhecia.',
        reveal: ['rua'],
      },
    ],
  },
  {
    id: 'jardim',
    x: 270,
    y: 210,
    name: 'O jardim suspenso',
    text: (s) =>
      (has(s, 'livro') ? 'Você reconhece este jardim: é o da capa do livro que encontrou no litoral. ' : '') +
      (has(s, 'amanhecer')
        ? 'A luz da manhã atravessa as folhas. Há uma mesa e duas cadeiras; uma delas está ligeiramente afastada.'
        : 'Um jardim no telhado de um prédio vizinho, com uma mesa e duas cadeiras. Uma delas está ligeiramente afastada, como se alguém tivesse acabado de se levantar.'),
    options: [
      {
        id: 'regar',
        label: 'Regar as plantas',
        result:
          'Você rega as plantas sem pressa. Ninguém aparece, e isso não é ruim. Atrás de um vaso, uma escada de pedra desce até o mar.',
        reveal: ['litoral'],
        set: ['cuidou'],
      },
      {
        id: 'sentar',
        label: 'Sentar e esperar',
        result:
          'Ninguém vem. Depois de um tempo, você percebe que não estava esperando ninguém. Do parapeito, avista uma rua estreita.',
        reveal: ['rua'],
        set: ['esperou'],
      },
    ],
  },
  {
    id: 'rua',
    x: 740,
    y: 190,
    name: 'A rua estreita',
    text: (s) =>
      has(s, 'bilhete')
        ? 'As varandas quase se tocam. Numa delas, presa por um prego, há uma chave — e, ao lado, um bilhete dobrado que parece o seu.'
        : 'Uma rua tão estreita que as varandas quase se tocam. Numa delas, alguém esqueceu uma chave pendurada num prego.',
    options: [
      {
        id: 'pegar',
        label: 'Pegar a chave',
        result: 'A chave é pequena, de ferro, e parece abrir algo antigo.',
        set: ['chave'],
      },
      {
        id: 'deixar',
        label: 'Deixar a chave onde está',
        result: 'Você deixa a chave no prego. Talvez alguém precise voltar para buscá-la. Talvez seja você.',
        set: ['deixouChave'],
      },
    ],
  },

  /* ---------- leste ---------- */
  {
    id: 'ponte',
    x: 700,
    y: 500,
    name: 'A ponte',
    text: () => 'Uma ponte estreita sobre um rio lento. Do outro lado, uma luz acesa.',
    options: [
      {
        id: 'atravessar',
        label: 'Atravessar',
        result: 'Do outro lado há uma casa com a porta aberta. O barco que estava amarrado na margem já não está lá.',
        reveal: ['casa'],
        close: ['rio'],
      },
      {
        id: 'descer',
        label: 'Descer até a água',
        result: 'Junto à margem, um barco amarrado com os remos dentro. Lá em cima, alguém apaga a luz da casa.',
        reveal: ['rio'],
        close: ['casa'],
      },
    ],
  },
  {
    id: 'casa',
    x: 870,
    y: 360,
    name: 'A casa aberta',
    text: () => 'Na mesa, dois copos d’água e um bilhete em branco. Ninguém em casa.',
    options: [
      {
        id: 'escrever',
        label: 'Escrever algo no bilhete',
        result:
          'Você escreve uma frase que não precisa ser lida por ninguém. Dobra o papel e o leva consigo. Pela janela dos fundos, uma rua estreita sobe a colina.',
        reveal: ['rua'],
        set: ['bilhete'],
      },
      {
        id: 'agua',
        label: 'Beber um copo d’água e seguir',
        result: 'A água está fresca. Pela janela dos fundos, uma rua estreita sobe a colina.',
        reveal: ['rua'],
      },
    ],
  },
  {
    id: 'rio',
    x: 870,
    y: 640,
    name: 'O rio',
    text: () => 'O barco desliza quase sozinho. A correnteza parece conhecer o caminho melhor do que você.',
    options: [
      {
        id: 'remar',
        label: 'Remar até a ilha',
        result: 'Os remos pesam no começo e depois deixam de pesar. A ilha se aproxima.',
        reveal: ['ilha'],
      },
      {
        id: 'correnteza',
        label: 'Deixar a correnteza decidir',
        result: 'O barco encosta, sem pressa, na margem de uma ilha pequena.',
        reveal: ['ilha'],
        set: ['correnteza'],
      },
    ],
  },
  {
    id: 'ilha',
    x: 830,
    y: 830,
    name: 'A ilha',
    text: (s) =>
      has(s, 'correnteza')
        ? 'Você chegou sem escolher a direção, e mesmo assim parece o lugar certo. Uma árvore, um banco e, ao longe, um farol.'
        : 'Uma ilha pequena, com uma árvore e um banco. Ao longe, um farol. A maré está alta.',
    options: [
      {
        id: 'mare',
        label: 'Esperar a maré baixar',
        result: 'Quando a água recua, aparece um caminho de pedras até o farol.',
        reveal: ['farol'],
      },
      {
        id: 'descansar',
        label: 'Descansar à sombra da árvore',
        result: 'Você dorme um pouco. Ao acordar, a maré já baixou e o caminho até o farol está à vista.',
        reveal: ['farol'],
        set: ['descansou'],
      },
    ],
  },

  /* ---------- oeste ---------- */
  {
    id: 'estacao',
    x: 300,
    y: 500,
    name: 'A estação',
    text: () => 'Dois trens parados, portas abertas. Nenhum anuncia o destino.',
    options: [
      {
        id: 'esquerda',
        label: 'O trem da esquerda',
        result: 'O trem parte assim que você entra. Pela janela, o outro trem fica para trás.',
        reveal: ['litoral'],
        close: ['cidade'],
      },
      {
        id: 'direita',
        label: 'O trem da direita',
        result: 'O trem parte assim que você entra. Pela janela, o outro trem fica para trás.',
        reveal: ['cidade'],
        close: ['litoral'],
      },
      {
        id: 'ficar',
        label: 'Ficar na plataforma',
        result:
          'Os dois trens partem sem você. A plataforma esvazia, e só então você repara num banco com um livro esquecido.',
        reveal: ['banco'],
        close: ['litoral', 'cidade'],
      },
    ],
  },
  {
    id: 'litoral',
    x: 120,
    y: 360,
    name: 'O litoral',
    text: (s) =>
      has(s, 'cuidou')
        ? 'A escada de pedra termina numa praia fora de estação. Tudo está fechado, exceto uma livraria pequena.'
        : 'Uma cidade de praia fora de estação. Tudo está fechado, exceto uma livraria pequena.',
    options: [
      {
        id: 'livraria',
        label: 'Entrar na livraria',
        result: 'Você folheia um livro de capa cinza. Na capa, um jardim suspenso, com duas cadeiras.',
        set: ['livro'],
        reveal: ['jardim'],
      },
      {
        id: 'areia',
        label: 'Caminhar pela areia',
        result: 'O mar está calmo. Na areia molhada, as suas pegadas são as únicas — e duram pouco.',
        set: ['mar'],
      },
    ],
  },
  {
    id: 'cidade',
    x: 120,
    y: 650,
    name: 'A cidade desconhecida',
    text: () => 'Ruas que você nunca viu e que, ainda assim, parecem familiares.',
    options: [
      {
        id: 'perguntar',
        label: 'Pedir uma informação',
        result: 'Uma senhora aponta para o sul: “Há uma sala com um piano, se você gosta de silêncio.”',
        reveal: ['sala'],
      },
      {
        id: 'perder',
        label: 'Perder-se de propósito',
        result:
          'Você vira à esquerda três vezes e chega a uma plataforma de onde se vê a estação inteira. Num banco, um livro esquecido.',
        reveal: ['banco'],
        set: ['perdeu'],
      },
    ],
  },
  {
    id: 'banco',
    x: 290,
    y: 760,
    name: 'O banco',
    text: () =>
      'Alguém esqueceu um livro aberto no banco. Na página marcada, um mapa desenhado à mão; servindo de marcador, uma chave.',
    options: [
      {
        id: 'mapa',
        label: 'Seguir o mapa desenhado',
        result: 'O mapa aponta para uma sala ao sul. Você guarda a chave no bolso, por precaução.',
        reveal: ['sala'],
        set: ['chave'],
      },
      {
        id: 'devolver',
        label: 'Fechar o livro e deixá-lo onde estava',
        result:
          'Você fecha o livro com a chave dentro. Quem o esqueceu talvez volte. Do banco, ouve-se um piano distante.',
        reveal: ['sala'],
      },
    ],
  },

  /* ---------- sul ---------- */
  {
    id: 'sala',
    x: 500,
    y: 680,
    name: 'A sala do piano',
    text: () => 'Uma sala vazia, com um piano fechado. A tampa está empoeirada; as teclas, não.',
    options: [
      {
        id: 'tocar',
        label: 'Abrir o piano e tocar uma nota',
        result: 'A nota fica no ar mais tempo do que deveria. Atrás de você, uma porta range.',
        reveal: ['porta'],
        set: ['nota'],
      },
      {
        id: 'ouvir',
        label: 'Ouvir o silêncio',
        result: 'O silêncio tem textura. Depois de um tempo, você ouve passos atrás de uma porta que não tinha visto.',
        reveal: ['porta'],
        set: ['escutou'],
      },
    ],
  },
  {
    id: 'porta',
    x: 500,
    y: 860,
    name: 'A porta trancada',
    text: (s) =>
      (has(s, 'escutou') ? 'Do outro lado, os passos que você ouviu antes param. ' : '') +
      (has(s, 'nota') ? 'A nota do piano ainda parece ecoar no corredor. ' : '') +
      'A porta é antiga, de madeira escura, com uma fechadura pequena de ferro.',
    options: [
      {
        id: 'abrir',
        label: 'Abrir com a chave',
        requires: 'chave',
        lockedHint: 'A porta está trancada. Talvez outro lugar do mapa guarde algo para ela.',
        result: 'A chave gira sem esforço. A porta dá para um corredor que termina na base de um farol.',
        reveal: ['farol'],
      },
    ],
  },
  {
    id: 'farol',
    x: 690,
    y: 940,
    name: 'O farol',
    text: (s) =>
      (has(s, 'amanhecer')
        ? 'O sol já nasceu lá no norte; a luz do farol seria só um gesto. Às vezes um gesto basta.'
        : 'Ainda é noite deste lado do mapa. Do alto do farol, tudo o que você percorreu aparece de uma vez.') +
      (has(s, 'descansou') ? ' Você chega descansada.' : ''),
    options: [
      {
        id: 'acender',
        label: 'Acender a luz',
        result:
          'A luz gira e, por um instante, ilumina o mapa inteiro: os caminhos percorridos, os que ficaram para depois, os que não foram tomados. Nenhum deles foi um erro.',
        set: ['aceso'],
      },
    ],
  },
];

export const edges: [string, string][] = [
  ['origem', 'escada'],
  ['escada', 'terraco'],
  ['escada', 'jardim'],
  ['terraco', 'jardim'],
  ['terraco', 'rua'],
  ['jardim', 'rua'],
  ['jardim', 'litoral'],
  ['origem', 'ponte'],
  ['ponte', 'casa'],
  ['ponte', 'rio'],
  ['casa', 'rua'],
  ['rio', 'ilha'],
  ['ilha', 'farol'],
  ['origem', 'estacao'],
  ['estacao', 'litoral'],
  ['estacao', 'cidade'],
  ['estacao', 'banco'],
  ['cidade', 'banco'],
  ['cidade', 'sala'],
  ['banco', 'sala'],
  ['origem', 'sala'],
  ['sala', 'porta'],
  ['porta', 'farol'],
];

export const nodeById: Record<string, LabNode> = Object.fromEntries(nodes.map((n) => [n.id, n]));

export const initialLab = (): LabState => ({
  current: 'origem',
  visited: ['origem'],
  revealed: ['origem', 'escada', 'ponte', 'estacao', 'sala'],
  closed: [],
  decisions: {},
  flags: [],
  trail: ['origem'],
  lit: false,
});

export function neighbors(id: string): string[] {
  return edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
}

/** Um lugar pode ser alcançado se estiver revelado, aberto e ligado a algum lugar já percorrido. */
export function isReachable(s: LabState, id: string): boolean {
  if (s.visited.includes(id)) return true;
  if (!s.revealed.includes(id) || s.closed.includes(id)) return false;
  return neighbors(id).some((n) => s.visited.includes(n));
}

export function travel(s: LabState, id: string): LabState {
  if (!isReachable(s, id)) return s;
  return {
    ...s,
    current: id,
    visited: s.visited.includes(id) ? s.visited : [...s.visited, id],
    trail: s.trail[s.trail.length - 1] === id ? s.trail : [...s.trail, id],
  };
}

export function decide(s: LabState, nodeId: string, option: LabOption): LabState {
  if (s.decisions[nodeId]) return s;
  if (option.requires && !s.flags.includes(option.requires)) return s;
  const close = (option.close ?? []).filter((c) => !s.visited.includes(c));
  return {
    ...s,
    decisions: { ...s.decisions, [nodeId]: option.id },
    revealed: Array.from(new Set([...s.revealed, ...(option.reveal ?? []), ...close])),
    closed: Array.from(new Set([...s.closed, ...close])).filter((c) => !(option.reveal ?? []).includes(c)),
    flags: Array.from(new Set([...s.flags, ...(option.set ?? [])])),
    lit: s.lit || (option.set ?? []).includes('aceso'),
  };
}
