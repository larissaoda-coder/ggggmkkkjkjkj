import type { ReactElement } from 'react';

/**
 * Baralho inspirado no baralho cigano (Lenormand). Doze cartas com
 * ilustrações próprias, em traço fino. Cada carta tem uma leitura para cada
 * posição: o que ficou para trás, o que existe agora e o que ainda pode
 * acontecer. As leituras foram escritas para esta experiência.
 */
export interface OracleCard {
  id: string;
  number: number;
  name: string;
  keyword: string;
  readings: [string, string, string];
  art: ReactElement;
}

export const positions = ['O que ficou para trás', 'O que existe agora', 'O que ainda pode acontecer'] as const;

export const cards: OracleCard[] = [
  {
    id: 'cavaleiro',
    number: 1,
    name: 'O Cavaleiro',
    keyword: 'notícia, movimento',
    readings: [
      'Alguma coisa chegou de repente e mudou o ritmo. Nem tudo o que veio rápido teve tempo de ser compreendido.',
      'Há uma notícia em movimento. Pode ser uma mensagem, um convite ou uma conversa que ainda não aconteceu.',
      'O que vem pela frente tende a chegar antes do esperado. Vale estar atenta ao que se aproxima.',
    ],
    art: (
      <>
        <path d="M38 92a12 12 0 0 1 0-24h24a12 12 0 0 1 0 24" />
        <path d="M38 92v-8M62 92v-8M42 70V58M58 70V58" />
        <path d="M24 60h10M20 68h12M24 76h8" />
      </>
    ),
  },
  {
    id: 'navio',
    number: 3,
    name: 'O Navio',
    keyword: 'distância, travessia',
    readings: [
      'Houve distância. Às vezes de lugar, às vezes de assunto, às vezes só de tom.',
      'Cada um está numa margem. A distância, agora, serve para enxergar melhor o que ficou do outro lado.',
      'Um deslocamento é possível: uma mudança, uma viagem, um movimento em direção a algo novo.',
    ],
    art: (
      <>
        <path d="M28 82h44l-6 10H34Z" />
        <path d="M50 82V44M50 46l18 30H50M50 52 36 76h14" />
        <path d="M22 100c6-3 10 3 16 0s10 3 16 0 10 3 16 0 6 3 10 0" />
      </>
    ),
  },
  {
    id: 'casa',
    number: 4,
    name: 'A Casa',
    keyword: 'base, cuidado',
    readings: [
      'Existiu uma base. Algo que, mesmo com problemas, parecia um lugar conhecido.',
      'A pergunta agora é sobre segurança: o que precisaria existir para alguém se sentir em casa de novo.',
      'A casa aponta para estabilidade construída com rotina, e não com promessas.',
    ],
    art: (
      <>
        <path d="M30 96V62l20-18 20 18v34Z" />
        <path d="M44 96V78h12v18M26 66l24-22 24 22" />
        <path d="M58 64h6v6h-6z" />
      </>
    ),
  },
  {
    id: 'arvore',
    number: 5,
    name: 'A Árvore',
    keyword: 'tempo, raiz',
    readings: [
      'Coisas que levaram tempo para crescer também levam tempo para se desfazer.',
      'É um momento de crescimento lento. Nada aqui pede decisão imediata.',
      'O que for construído a partir de agora tende a durar se tiver raiz, e não pressa.',
    ],
    art: (
      <>
        <circle cx="50" cy="58" r="20" />
        <path d="M50 98V64M50 74l-9-8M50 70l8-7M40 98h20" />
      </>
    ),
  },
  {
    id: 'nuvens',
    number: 6,
    name: 'As Nuvens',
    keyword: 'dúvida',
    readings: [
      'Houve confusão. Coisas ditas pela metade e outras entendidas de outro jeito.',
      'A dúvida existe e é legítima. Esta carta não pede que ela seja ignorada.',
      'Nuvens costumam passar. O que fica depois delas é o que já estava lá.',
    ],
    art: (
      <>
        <path d="M28 70a9 9 0 0 1 4-17 12 12 0 0 1 22-4 9 9 0 0 1 12 9 7 7 0 0 1-2 12Z" />
        <path d="M44 92a7 7 0 0 1 3-13 9 9 0 0 1 17-3 7 7 0 0 1 9 7 5 5 0 0 1-2 9Z" />
      </>
    ),
  },
  {
    id: 'caminhos',
    number: 22,
    name: 'Os Caminhos',
    keyword: 'escolha',
    readings: [
      'Houve uma bifurcação, e cada um seguiu por um lado.',
      'Existem opções abertas. Nenhuma delas é obrigatória.',
      'Os caminhos podem voltar a se aproximar, se for essa a escolha de quem anda por eles.',
    ],
    art: (
      <>
        <path d="M50 100V72L30 44M50 72l20-28" />
        <path d="M44 100V74L26 48M56 100V74l18-26" strokeDasharray="2 3" />
      </>
    ),
  },
  {
    id: 'livro',
    number: 26,
    name: 'O Livro',
    keyword: 'o que não foi dito',
    readings: [
      'Algumas coisas ficaram sem ser ditas.',
      'Há algo guardado esperando uma conversa.',
      'Uma conversa franca pode esclarecer mais do que todo o resto.',
    ],
    art: (
      <>
        <path d="M50 52c-8-5-16-6-24-4v40c8-2 16-1 24 4 8-5 16-6 24-4V48c-8-2-16-1-24 4Z" />
        <path d="M50 52v40M32 58h12M32 64h12M56 58h12M56 64h12" />
      </>
    ),
  },
  {
    id: 'carta',
    number: 27,
    name: 'A Carta',
    keyword: 'mensagem',
    readings: [
      'Mensagens foram trocadas, algumas com cuidado, outras sem.',
      'Esta carta aparece quando há algo escrito para ser lido. Talvez você já esteja lendo.',
      'Uma resposta, quando e se vier, não precisa ser longa.',
    ],
    art: (
      <>
        <rect x="26" y="56" width="48" height="32" />
        <path d="M26 56l24 18 24-18" />
        <circle cx="50" cy="80" r="3" />
      </>
    ),
  },
  {
    id: 'chave',
    number: 33,
    name: 'A Chave',
    keyword: 'abertura',
    readings: [
      'Uma porta se fechou, e por um tempo foi melhor assim.',
      'A chave aparece quando algo pode ser reaberto, mas só por dentro.',
      'Uma solução simples para algo que parecia complicado.',
    ],
    art: (
      <>
        <circle cx="50" cy="52" r="10" />
        <circle cx="50" cy="52" r="4" />
        <path d="M50 62v36M50 84h8M50 92h6" />
      </>
    ),
  },
  {
    id: 'anel',
    number: 25,
    name: 'O Anel',
    keyword: 'compromisso',
    readings: [
      'Houve um vínculo de verdade. Ele não desaparece só porque mudou de forma.',
      'A questão não é o anel, e sim o acordo: o que cada um estaria disposto a cuidar.',
      'Um compromisso renovado, feito com mais consciência do que o primeiro.',
    ],
    art: (
      <>
        <circle cx="50" cy="78" r="16" />
        <path d="M44 58l6-8 6 8-6 6Z" />
      </>
    ),
  },
  {
    id: 'lirios',
    number: 30,
    name: 'Os Lírios',
    keyword: 'serenidade',
    readings: [
      'Houve momentos de calma que vale lembrar sem idealizar.',
      'Esta carta pede serenidade: decidir com calma é diferente de adiar para sempre.',
      'Uma fase mais tranquila, com menos ruído e mais escuta.',
    ],
    art: (
      <>
        <path d="M50 100V60M50 84c-6-2-10-8-10-14M50 78c6-2 10-6 10-12" />
        <path d="M50 60c-6-4-8-12-6-18 4 4 6 8 6 12 0-4 2-8 6-12 2 6 0 14-6 18Z" />
      </>
    ),
  },
  {
    id: 'sol',
    number: 31,
    name: 'O Sol',
    keyword: 'clareza',
    readings: [
      'Teve luz também. Nem tudo o que passou foi difícil.',
      'Clareza: ver as coisas como são, sem aumentar nem diminuir.',
      'Uma fase clara, em que as coisas fazem mais sentido do que fazem agora.',
    ],
    art: (
      <>
        <circle cx="50" cy="70" r="12" />
        <path d="M50 46v8M50 86v8M26 70h8M66 70h8M33 53l6 6M61 81l6 6M33 87l6-6M61 59l6-6" />
      </>
    ),
  },
];

/** A carta especial, escondida no baralho. Inspirada no lótus da tradição budista. */
export const lotusArt = (
  <>
    <circle cx="50" cy="70" r="30" strokeOpacity="0.35" />
    <circle cx="50" cy="70" r="22" strokeOpacity="0.5" />
    <path d="M50 84c-4-8-4-18 0-26 4 8 4 18 0 26Z" />
    <path d="M50 84c-8-4-14-12-14-22 8 2 12 10 14 22ZM50 84c8-4 14-12 14-22-8 2-12 10-14 22Z" />
    <path d="M50 84c-12 0-20-6-24-14 10-2 18 4 24 14ZM50 84c12 0 20-6 24-14-10-2-18 4-24 14Z" />
    <path d="M30 88h40" />
  </>
);

export const finalReading =
  'Lidas em conjunto, as três cartas contam uma história possível: duas pessoas que se afastaram, aprenderam alguma coisa com a distância e encontram uma chance de conversar de novo. Nesta leitura, essa conversa vira um recomeço. Um recomeço sem pressa, com mais cuidado do que antes, que aos poucos volta a ser uma vida dividida: uma casa, uma rotina, planos em comum e, talvez um dia, uma família e filhos.';

export const closingNote =
  'As cartas não decidem por você. Esta leitura é uma interpretação simbólica sobre escolhas, vínculos e possibilidades.';

/** Embaralhamento real (Fisher–Yates com números aleatórios do navegador). */
export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
