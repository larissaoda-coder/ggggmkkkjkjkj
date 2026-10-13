/**
 * Encontre seu próprio caminho — um dia imaginário, montado por etapas.
 *
 * Cada etapa usa uma interface diferente (uma bolsa, um controle de horário,
 * um pequeno mapa, um lugar com sua própria interação). O que se escolhe em
 * uma etapa muda o que aparece na seguinte. Não há pontuação nem diagnóstico:
 * os resultados são lugares e momentos, nunca traços de personalidade.
 */

export interface Item {
  id: string;
  label: string;
  /** Como o objeto aparece numa frase. */
  phrase: string;
}

export const items: Item[] = [
  { id: 'guarda-chuva', label: 'Guarda-chuva', phrase: 'um guarda-chuva' },
  { id: 'camera', label: 'Câmera', phrase: 'uma câmera' },
  { id: 'caderno', label: 'Caderno', phrase: 'um caderno' },
  { id: 'livro', label: 'Livro', phrase: 'um livro' },
  { id: 'bicicleta', label: 'Chave da bicicleta', phrase: 'a chave da bicicleta' },
  { id: 'agua', label: 'Garrafa d’água', phrase: 'uma garrafa d’água' },
  { id: 'cachecol', label: 'Cachecol', phrase: 'um cachecol' },
  { id: 'fones', label: 'Fones de ouvido', phrase: 'fones de ouvido' },
];

export const MAX_ITEMS = 3;

export const times = [
  { id: 'manha', label: 'Manhã', clock: '8h', sky: 0.15 },
  { id: 'tarde', label: 'Tarde', clock: '14h', sky: 0.05 },
  { id: 'fim', label: 'Fim de tarde', clock: '17h30', sky: 0.45 },
  { id: 'noite', label: 'Noite', clock: '21h', sky: 0.9 },
] as const;

export type TimeId = (typeof times)[number]['id'];

export interface Journey {
  items: string[];
  time: TimeId | null;
  place: string | null;
  ending: string | null;
}

export const emptyJourney: Journey = { items: [], time: null, place: null, ending: null };

export interface Place {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Disponível? Se não, devolve o motivo — mostrado com delicadeza no mapa. */
  check: (j: Journey) => true | string;
  intro: (j: Journey) => string;
}

const has = (j: Journey, id: string) => j.items.includes(id);

export const places: Place[] = [
  {
    id: 'cafe',
    name: 'O café da esquina',
    x: 30,
    y: 62,
    check: () => true,
    intro: (j) =>
      j.time === 'noite'
        ? 'Quase vazio a esta hora. Três lugares livres: junto à janela, no balcão, no canto do fundo.'
        : 'O cheiro de café chega antes da porta. Três lugares livres: junto à janela, no balcão, no canto do fundo.',
  },
  {
    id: 'biblioteca',
    name: 'A biblioteca',
    x: 68,
    y: 30,
    check: (j) => (j.time === 'fim' || j.time === 'noite' ? 'A biblioteca fecha às 17h.' : true),
    intro: () => 'Um corredor estreito, uma estante baixa. Três lombadas chamam a atenção.',
  },
  {
    id: 'feira',
    name: 'A feira de flores',
    x: 22,
    y: 26,
    check: (j) => (j.time === 'manha' ? true : 'A feira só acontece pela manhã.'),
    intro: () =>
      'As bancas ainda estão sendo montadas. Há flores de todo tipo — e um balde de galhos secos, quase esquecido.',
  },
  {
    id: 'mirante',
    name: 'O mirante',
    x: 80,
    y: 70,
    check: (j) =>
      j.time === 'manha'
        ? 'De manhã, a névoa cobre a vista inteira.'
        : j.time === 'tarde' && !has(j, 'guarda-chuva')
          ? 'À tarde cai uma chuva passageira — sem guarda-chuva, o mirante fica para outro dia.'
          : true,
    intro: (j) =>
      j.time === 'noite'
        ? 'A cidade inteira acesa lá embaixo. O vento sobe pela encosta.'
        : j.time === 'tarde'
          ? 'Debaixo do guarda-chuva, a cidade molhada brilha.'
          : 'O sol começa a descer atrás dos prédios. A luz muda a cada minuto.',
  },
  {
    id: 'rio',
    name: 'A beira do rio',
    x: 52,
    y: 84,
    check: (j) =>
      j.time === 'noite' && !has(j, 'cachecol')
        ? 'À noite, o vento da beira do rio é frio demais sem um cachecol.'
        : j.time === 'tarde' && !has(j, 'guarda-chuva')
          ? 'Com a chuva da tarde e sem guarda-chuva, a margem fica alagada.'
          : true,
    intro: (j) =>
      has(j, 'bicicleta')
        ? 'A ciclovia acompanha o rio nos dois sentidos. A bicicleta pede movimento.'
        : 'Um caminho de terra acompanha o rio nos dois sentidos.',
  },
  {
    id: 'cinema',
    name: 'O cinema de rua',
    x: 58,
    y: 50,
    check: (j) => (j.time === 'fim' || j.time === 'noite' ? true : 'O cinema só abre no fim da tarde.'),
    intro: () => 'Uma sala antiga, de poltronas vermelhas que o tempo tornou cor de vinho. Quase todas livres.',
  },
];

export interface Ending {
  id: string;
  place: string;
  title: string;
  text: (j: Journey) => string;
}

const timePhrase: Record<TimeId, string> = {
  manha: 'pela manhã',
  tarde: 'à tarde',
  fim: 'no fim da tarde',
  noite: 'à noite',
};

export const endings: Ending[] = [
  {
    id: 'cafe-janela',
    place: 'cafe',
    title: 'Uma mesa junto à janela',
    text: (j) =>
      has(j, 'caderno')
        ? 'Você abre o caderno e escreve uma página inteira sem levantar os olhos. Do lado de fora, a cidade passa — e não precisa de você para isso.'
        : has(j, 'livro')
          ? 'O livro fica aberto sobre a mesa; você lê menos do que olha a rua. Às vezes é exatamente isso que se veio fazer.'
          : 'Você observa as pessoas passando e inventa, para cada uma, uma pressa diferente.',
  },
  {
    id: 'cafe-balcao',
    place: 'cafe',
    title: 'Conversa de balcão',
    text: (j) =>
      `A pessoa que prepara os cafés comenta o ${j.time === 'noite' ? 'silêncio da noite' : 'movimento do dia'}, e uma conversa pequena nasce sem esforço. Você sai sabendo o nome dela.`,
  },
  {
    id: 'cafe-canto',
    place: 'cafe',
    title: 'O canto que ninguém escolhe',
    text: (j) =>
      has(j, 'fones')
        ? 'Com os fones, o canto vira um quarto à parte. Uma música inteira, depois outra, sem que ninguém peça nada.'
        : 'Do canto se vê o café inteiro e quase ninguém vê você. Um esconderijo com cheiro bom.',
  },
  {
    id: 'biblioteca-poemas',
    place: 'biblioteca',
    title: 'Um verso sublinhado',
    text: () =>
      'Alguém, anos atrás, sublinhou um único verso a lápis neste livro de poemas. Você não sabe por quê — e passa um tempo imaginando.',
  },
  {
    id: 'biblioteca-atlas',
    place: 'biblioteca',
    title: 'Um atlas antigo',
    text: (j) =>
      `Fronteiras que já não existem, cidades com nomes antigos. ${has(j, 'caderno') ? 'Você copia no caderno o desenho de um litoral.' : 'Você passa o dedo sobre um litoral desenhado à mão.'}`,
  },
  {
    id: 'biblioteca-anonimo',
    place: 'biblioteca',
    title: 'O livro sem título',
    text: () =>
      'A lombada não diz nada. Dentro, um diário de viagem de alguém que nunca assinou. Você lê duas páginas e o devolve ao lugar, com cuidado.',
  },
  {
    id: 'feira-flores',
    place: 'feira',
    title: 'Flores para levar',
    text: () =>
      'Você sai da feira com um maço embrulhado em jornal. Não é para ninguém em particular — e talvez por isso pareça tão bonito.',
  },
  {
    id: 'feira-galho',
    place: 'feira',
    title: 'Um galho seco',
    text: () =>
      'Entre todas as flores, você escolhe o galho seco. O vendedor ri e não cobra. Em casa, ele vai parecer uma pequena escultura.',
  },
  {
    id: 'mirante-luz',
    place: 'mirante',
    title: 'A última luz',
    text: (j) =>
      j.time === 'noite'
        ? 'Você espera até as luzes da cidade começarem a se apagar, uma a uma. Ninguém marca a hora certa de ir embora.'
        : 'Você espera até a última luz sumir atrás dos prédios. Durante alguns minutos, tudo fica da mesma cor.',
  },
  {
    id: 'mirante-foto',
    place: 'mirante',
    title: 'Uma fotografia',
    text: () =>
      'Você fotografa a vista uma vez só, sem conferir como ficou. Vai descobrir depois — e isso também faz parte.',
  },
  {
    id: 'rio-acima',
    place: 'rio',
    title: 'Rio acima',
    text: (j) =>
      has(j, 'bicicleta')
        ? 'Contra a correnteza, a bicicleta pesa um pouco mais. No fim da ciclovia, uma ponte que você nunca tinha atravessado.'
        : 'Rio acima, a cidade rareia. Uma garça parada na margem parece esperar a mesma coisa que você.',
  },
  {
    id: 'rio-abaixo',
    place: 'rio',
    title: 'Rio abaixo',
    text: (j) =>
      `Seguindo a correnteza, você chega ao lugar onde o rio se alarga. ${has(j, 'agua') ? 'Senta, bebe um pouco d’água e deixa o tempo passar.' : 'Senta numa pedra e deixa o tempo passar.'}`,
  },
  {
    id: 'cinema-frente',
    place: 'cinema',
    title: 'Na primeira fileira',
    text: () => 'A tela ocupa tudo. Por duas horas, não existe nada além daquela história.',
  },
  {
    id: 'cinema-fundo',
    place: 'cinema',
    title: 'Na última fileira',
    text: () =>
      'Do fundo, você vê o filme e também a sala: as cabeças, os risos fora de hora, a luz do projetor cortando o escuro.',
  },
];

export const endingById: Record<string, Ending> = Object.fromEntries(endings.map((e) => [e.id, e]));
export const placeById: Record<string, Place> = Object.fromEntries(places.map((p) => [p.id, p]));

export function closing(j: Journey): string {
  return `Um dia que começou com ${j.items.length ? listItems(j) : 'as mãos livres'}, saindo de casa ${j.time ? timePhrase[j.time] : ''}.`;
}

function listItems(j: Journey) {
  const names = j.items.map((id) => items.find((i) => i.id === id)?.phrase ?? id);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}
