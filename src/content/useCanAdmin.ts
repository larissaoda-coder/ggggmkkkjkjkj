import { useContent } from './ContentContext';

/**
 * Mostrar atalhos para a administração?
 * No claude.ai, só para quem tem permissão de edição (decidido pelo servidor).
 * Fora dele, só no navegador em que um token do GitHub foi conectado.
 */
export function useCanAdmin(): boolean {
  const { backend } = useContent();
  return Boolean(backend?.canEdit);
}
