/**
 * Registro das áreas. `milestone` é o marco registrado quando a área é
 * percorrida — usado para liberar a página final.
 */
export type Group = 'ler' | 'ver' | 'ouvir' | 'explorar' | 'pausar';

export interface Section {
  id: string;
  path: string;
  title: string;
  description: string;
  group: Group;
  milestoneLabel: string;
  immersive?: boolean;
}

export const sections: Section[] = [
  {
    id: 'carta',
    path: '/carta',
    title: 'A carta',
    description: 'A carta inteira, numa página só.',
    group: 'ler',
    milestoneLabel: 'Ler a carta até o fim',
  },
  {
    id: 'livro',
    path: '/livro',
    title: 'Algumas coisas sobre você',
    description:
      'Textos que escrevi para registrar o que penso, o que admiro e o que nem sempre consigo dizer em voz alta.',
    group: 'ler',
    milestoneLabel: 'Chegar à última página do livro',
  },
  {
    id: 'cartas',
    path: '/cartas',
    title: 'Cartas guardadas',
    description: 'Algumas mensagens foram escritas para momentos específicos.',
    group: 'ler',
    milestoneLabel: 'Abrir um envelope',
  },
  {
    id: 'dicionario',
    path: '/dicionario',
    title: 'Termos particulares',
    description: 'Palavras e definições inspiradas nas características que reconheço em você.',
    group: 'ler',
    milestoneLabel: 'Ler uma definição',
  },
  {
    id: 'arquivo',
    path: '/arquivo',
    title: 'Arquivo pessoal',
    description: 'Fotografias, detalhes e registros que escolhi guardar.',
    group: 'ver',
    milestoneLabel: 'Abrir uma fotografia',
  },
  {
    id: 'museu',
    path: '/museu',
    title: 'Coisas que merecem registro',
    description: 'Uma coleção de detalhes que, por algum motivo, escolhi não deixar passar despercebidos.',
    group: 'ver',
    milestoneLabel: 'Visitar a exposição',
  },
  {
    id: 'quebra-cabeca',
    path: '/quebra-cabeca',
    title: 'Uma imagem por partes',
    description: 'Monte a imagem para revelar o conteúdo completo.',
    group: 'ver',
    milestoneLabel: 'Montar o quebra-cabeça',
  },
  {
    id: 'radio',
    path: '/radio',
    title: 'Faixas selecionadas',
    description:
      'Músicas que escolhi por diferentes motivos. Algumas me lembram você. Outras combinam com coisas que gostaria de compartilhar.',
    group: 'ouvir',
    milestoneLabel: 'Tocar uma faixa',
  },
  {
    id: 'atlas',
    path: '/mapa',
    title: 'Pontos de referência',
    description: 'Escolha uma estrela para abrir o conteúdo associado a ela.',
    group: 'explorar',
    milestoneLabel: 'Abrir três estrelas do mapa',
  },
  {
    id: 'oraculo',
    path: '/oraculo',
    title: 'Uma leitura simbólica',
    description: 'Escolha três cartas e veja a interpretação criada para esta experiência.',
    group: 'explorar',
    milestoneLabel: 'Revelar a leitura',
  },
  {
    id: 'futuro',
    path: '/futuro',
    title: 'Em outra fase da vida',
    description: 'Algumas cenas imaginadas sobre como a vida poderia ser.',
    group: 'explorar',
    milestoneLabel: 'Ler uma cena',
  },
  {
    id: 'jardim',
    path: '/intervalo',
    title: 'Um intervalo',
    description:
      'Não há nada para resolver aqui. Você pode apenas observar, tocar na água e permanecer pelo tempo que quiser.',
    group: 'pausar',
    milestoneLabel: 'Tocar na água',
    immersive: true,
  },
];

export const groupLabels: Record<Group, string> = {
  ler: 'Para ler',
  ver: 'Para ver',
  ouvir: 'Para ouvir',
  explorar: 'Para explorar',
  pausar: 'Para parar um pouco',
};

export const SECRET_PATH = '/antes-de-sair';

export function sectionForPath(pathname: string): Section | undefined {
  return sections.find((s) => pathname === s.path || pathname.startsWith(s.path + '/'));
}
