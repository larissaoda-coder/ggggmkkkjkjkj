import type { IconName } from '../components/Icon';

export interface Section {
  id: string;
  path: string;
  label: string;
  icon: IconName;
}

export const sections: Section[] = [
  { id: 'carta', path: '/carta', label: 'Carta', icon: 'letter' },
  { id: 'fragmentos', path: '/fragmentos', label: 'Fragmentos', icon: 'fragments' },
  { id: 'musicas', path: '/musicas', label: 'Músicas', icon: 'music' },
];
