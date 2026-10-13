/**
 * A mesa de escolhas: peças que representam aspectos de uma convivência a
 * dois. Não existe disposição correta — a leitura final apenas descreve a
 * forma da composição, sem julgá-la.
 */

export type Glyph = 'tempo' | 'conversa' | 'cuidado' | 'mundo' | 'livre';

export interface Piece {
  id: string;
  label: string;
  glyph: Glyph;
  custom?: boolean;
}

export const glyphNames: Record<Glyph, string> = {
  tempo: 'tempo',
  conversa: 'conversa',
  cuidado: 'cuidado',
  mundo: 'mundo',
  livre: 'escrita por você',
};

export const pieces: Piece[] = [
  { id: 'tempo-so', label: 'Tempo a sós', glyph: 'tempo' },
  { id: 'domingos', label: 'Domingos sem planos', glyph: 'tempo' },
  { id: 'rotina', label: 'Rotina compartilhada', glyph: 'tempo' },
  { id: 'descanso', label: 'Descanso', glyph: 'tempo' },
  { id: 'espontaneidade', label: 'Espontaneidade', glyph: 'tempo' },
  { id: 'conversas', label: 'Conversas longas', glyph: 'conversa' },
  { id: 'silencio', label: 'Silêncio confortável', glyph: 'conversa' },
  { id: 'mensagens', label: 'Mensagens ao longo do dia', glyph: 'conversa' },
  { id: 'discordar', label: 'Discordar com calma', glyph: 'conversa' },
  { id: 'mudar', label: 'Espaço para mudar de ideia', glyph: 'conversa' },
  { id: 'desculpas', label: 'Pedir desculpas', glyph: 'cuidado' },
  { id: 'rituais', label: 'Pequenos rituais', glyph: 'cuidado' },
  { id: 'cozinhar', label: 'Cozinhar', glyph: 'cuidado' },
  { id: 'saude', label: 'Cuidar de si', glyph: 'cuidado' },
  { id: 'viagens', label: 'Viagens', glyph: 'mundo' },
  { id: 'projetos', label: 'Projetos pessoais', glyph: 'mundo' },
  { id: 'amigos-cada', label: 'Amigos de cada um', glyph: 'mundo' },
  { id: 'amigos-comum', label: 'Amigos em comum', glyph: 'mundo' },
  { id: 'familia', label: 'Família', glyph: 'mundo' },
  { id: 'planos', label: 'Planos a longo prazo', glyph: 'mundo' },
];

export type Mode = 'prioridades' | 'convivencia';

export interface Zone {
  id: string;
  label: string;
}

export const zones: Record<Mode, Zone[]> = {
  prioridades: [
    { id: 'essencial', label: 'Essencial' },
    { id: 'importante', label: 'Importante' },
    { id: 'ocasional', label: 'Ocasional' },
  ],
  convivencia: [
    { id: 'meu', label: 'Meu espaço' },
    { id: 'nosso', label: 'Entre nós' },
    { id: 'seu', label: 'Seu espaço' },
  ],
};

export const modeInfo: Record<Mode, { label: string; hint: string }> = {
  prioridades: {
    label: 'Prioridades',
    hint: 'Quanto mais perto do centro, mais essencial. As bordas guardam o que pode variar.',
  },
  convivencia: {
    label: 'Convivência',
    hint: 'À esquerda e à direita, o que é de cada um. No meio, o que se divide.',
  },
};

export interface Placed {
  id: string;
  x: number; // 0–1
  y: number; // 0–1
}

export const RING_INNER = 0.36;
export const RING_MID = 0.7;

export function zoneOf(mode: Mode, x: number, y: number): string {
  if (mode === 'convivencia') return x < 1 / 3 ? 'meu' : x < 2 / 3 ? 'nosso' : 'seu';
  const d = Math.hypot(x - 0.5, y - 0.5) / 0.5;
  return d < RING_INNER ? 'essencial' : d < RING_MID ? 'importante' : 'ocasional';
}

/** Posição livre (determinística) dentro de uma zona, para colocar peças pelo teclado ou por botões. */
export function spotIn(mode: Mode, zone: string, taken: Placed[]): { x: number; y: number } {
  const candidates: { x: number; y: number }[] = [];
  if (mode === 'convivencia') {
    const col = zone === 'meu' ? 0 : zone === 'nosso' ? 1 : 2;
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 2; c++) candidates.push({ x: col / 3 + 0.09 + c * 0.15, y: 0.14 + r * 0.12 });
  } else {
    const [r0, r1] =
      zone === 'essencial' ? [0, RING_INNER] : zone === 'importante' ? [RING_INNER, RING_MID] : [RING_MID, 0.95];
    const radius = ((r0 + r1) / 2) * 0.5;
    const count = zone === 'essencial' ? 1 : zone === 'importante' ? 8 : 12;
    if (zone === 'essencial') {
      [
        [0, 0],
        [0.07, 0.04],
        [-0.07, -0.04],
        [0.06, -0.06],
        [-0.06, 0.06],
      ].forEach(([dx, dy]) => candidates.push({ x: 0.5 + dx, y: 0.5 + dy }));
    } else {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2;
        candidates.push({ x: 0.5 + Math.cos(a) * radius, y: 0.5 + Math.sin(a) * radius });
      }
    }
  }
  const free = candidates.find((c) => taken.every((t) => Math.hypot(t.x - c.x, t.y - c.y) > 0.08));
  const base = free ?? candidates[taken.length % candidates.length];
  return { x: Math.min(0.94, Math.max(0.06, base.x)), y: Math.min(0.94, Math.max(0.06, base.y)) };
}

/** Uma leitura descritiva e neutra da composição. */
export function describe(mode: Mode, placed: Placed[], all: Piece[]): string[] {
  if (placed.length === 0)
    return ['A mesa está vazia. Arraste uma peça para começar — ou toque numa peça e depois na mesa.'];
  const byZone: Record<string, number> = {};
  for (const p of placed) {
    const z = zoneOf(mode, p.x, p.y);
    byZone[z] = (byZone[z] ?? 0) + 1;
  }
  const n = placed.length;
  const lines: string[] = [];
  const glyphCount: Record<string, number> = {};
  for (const p of placed) {
    const g = all.find((x) => x.id === p.id)?.glyph ?? 'livre';
    glyphCount[g] = (glyphCount[g] ?? 0) + 1;
  }
  const topGlyphs = Object.entries(glyphCount)
    .sort((a, b) => b[1] - a[1])
    .filter(([, c], _, arr) => c === arr[0][1])
    .map(([g]) => glyphNames[g as Glyph]);

  if (mode === 'prioridades') {
    const e = byZone.essencial ?? 0;
    const i = byZone.importante ?? 0;
    const o = byZone.ocasional ?? 0;
    lines.push(`${n} ${n === 1 ? 'peça' : 'peças'}: ${e} no centro, ${i} no anel do meio, ${o} nas bordas.`);
    if (e > n / 2) lines.push('Uma composição concentrada: muita coisa foi colocada no centro.');
    else if (o > n / 2)
      lines.push('Uma composição aberta: a maior parte das peças ficou nas bordas, onde há espaço para variar.');
    else if (e === 0) lines.push('O centro está livre — nada foi tratado como inegociável, por enquanto.');
    else lines.push('Uma composição distribuída entre o que é central e o que pode mudar.');
  } else {
    const a = byZone.meu ?? 0;
    const s = byZone.nosso ?? 0;
    const b = byZone.seu ?? 0;
    lines.push(`${n} ${n === 1 ? 'peça' : 'peças'}: ${a} de um lado, ${s} entre vocês, ${b} do outro lado.`);
    if (s > n / 2) lines.push('Muito espaço em comum, com algum espaço próprio de cada lado.');
    else if (s === 0) lines.push('Duas vidas lado a lado, sem nada colocado no meio — ainda.');
    else if (Math.abs(a - b) >= 3)
      lines.push('Os lados estão em proporções diferentes, e isso também é uma forma possível.');
    else lines.push('Um equilíbrio entre o que se divide e o que permanece de cada um.');
  }
  if (n >= 3) lines.push(`Predominam peças de ${topGlyphs.join(' e de ')}.`);
  return lines;
}
