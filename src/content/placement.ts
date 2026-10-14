import type { Content, Photo } from './types';

/* Cada fotografia aparece num lugar só. Abertura, carta e quebra-cabeça têm prioridade; o arquivo fica com o resto. */

function fixedIds(c: Content) {
  return new Set([...c.home.photoIds, c.letter.topPhotoId, c.letter.bottomPhotoId].filter(Boolean));
}

/** A imagem do quebra-cabeça: a escolhida ou, sem escolha, a primeira que não está na abertura nem na carta. */
export function puzzlePhoto(c: Content): Photo | undefined {
  const chosen = c.puzzle.photoId ? c.photos.find((p) => p.id === c.puzzle.photoId) : undefined;
  if (chosen) return chosen;
  const fixed = fixedIds(c);
  return c.photos.find((p) => !fixed.has(p.id));
}

/** Fotografias do arquivo: todas, menos as que já aparecem em outro lugar. */
export function archivePhotos(c: Content): Photo[] {
  const used = fixedIds(c);
  const pz = puzzlePhoto(c);
  if (pz) used.add(pz.id);
  return c.photos.filter((p) => !used.has(p.id));
}
