import type { IconName } from '../components/Icon';

export type SectionGroup = 'leitura' | 'experiencias' | 'espaco';

export interface Section {
  id: string;
  path: string;
  /** Nome curto, usado na navegação. */
  label: string;
  /** Nome completo, usado em títulos. */
  title: string;
  /** Uma linha discreta sobre o que existe ali. */
  description: string;
  icon: IconName;
  group: SectionGroup;
  /** Aparece na barra inferior do celular (as demais ficam em "Mais"). */
  primary?: boolean;
  /** Esconde a navegação (experiências imersivas). */
  immersive?: boolean;
}

export const sections: Section[] = [
  {
    id: 'carta',
    path: '/carta',
    label: 'Carta',
    title: 'Texto',
    description: 'Uma carta escrita numa noite, diante de uma janela.',
    icon: 'letter',
    group: 'leitura',
    primary: true,
  },
  {
    id: 'fragmentos',
    path: '/fragmentos',
    label: 'Fragmentos',
    title: 'Dez fragmentos',
    description: 'Dez textos breves sobre aquilo que é seu.',
    icon: 'fragments',
    group: 'leitura',
    primary: true,
  },
  {
    id: 'escolhas',
    path: '/escolhas',
    label: 'Escolhas',
    title: 'Simulador de escolhas',
    description: 'Uma história curta em que cada decisão muda o que vem depois.',
    icon: 'choices',
    group: 'experiencias',
    primary: true,
  },
  {
    id: 'musicas',
    path: '/musicas',
    label: 'Músicas',
    title: 'Músicas',
    description: 'Um pequeno reprodutor que acompanha a navegação.',
    icon: 'music',
    group: 'experiencias',
    primary: true,
  },
  {
    id: 'labirinto',
    path: '/labirinto',
    label: 'Labirinto',
    title: 'O labirinto de possibilidades',
    description: 'Um mapa de pontos e linhas que se transforma conforme é percorrido.',
    icon: 'labyrinth',
    group: 'experiencias',
  },
  {
    id: 'mesa',
    path: '/mesa',
    label: 'Mesa',
    title: 'A mesa de escolhas',
    description: 'Peças para dispor, combinar e reorganizar, sem respostas certas.',
    icon: 'table',
    group: 'experiencias',
  },
  {
    id: 'noite',
    path: '/noite',
    label: 'Noite',
    title: 'Uma noite, vários caminhos',
    description: 'Um cômodo, uma janela e o que cada gesto muda ao redor.',
    icon: 'night',
    group: 'experiencias',
  },
  {
    id: 'caminho',
    path: '/caminho',
    label: 'Caminho',
    title: 'Encontre seu próprio caminho',
    description: 'Situações abertas que se desdobram conforme você experimenta.',
    icon: 'path',
    group: 'experiencias',
  },
  {
    id: 'intervalo',
    path: '/intervalo',
    label: 'Intervalo',
    title: 'O intervalo',
    description: 'Formas que respondem ao toque. Nada para ler, nada para decidir.',
    icon: 'interval',
    group: 'experiencias',
    immersive: true,
  },
  {
    id: 'ajustes',
    path: '/ajustes',
    label: 'Ajustes',
    title: 'Personalização do espaço',
    description: 'Tema, tipografia, movimento, som e navegação.',
    icon: 'settings',
    group: 'espaco',
  },
];

export const groupLabels: Record<SectionGroup, string> = {
  leitura: 'Leitura',
  experiencias: 'Experiências',
  espaco: 'Espaço',
};

export function sectionForPath(pathname: string): Section | undefined {
  return sections.find((s) => pathname === s.path || pathname.startsWith(s.path + '/'));
}
