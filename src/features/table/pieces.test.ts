import { describe, expect, it } from 'vitest';
import { describe as read, pieces, spotIn, zoneOf, zones, type Placed } from './pieces';

describe('mesa de escolhas', () => {
  it('cada posição pertence a uma zona do modo', () => {
    for (const mode of ['prioridades', 'convivencia'] as const) {
      const ids = zones[mode].map((z) => z.id);
      for (let x = 0; x <= 1; x += 0.1) for (let y = 0; y <= 1; y += 0.1) expect(ids).toContain(zoneOf(mode, x, y));
    }
  });

  it('as posições sugeridas caem na zona pedida', () => {
    for (const mode of ['prioridades', 'convivencia'] as const) {
      for (const z of zones[mode]) {
        const spot = spotIn(mode, z.id, []);
        expect(zoneOf(mode, spot.x, spot.y)).toBe(z.id);
      }
    }
  });

  it('a leitura descreve sem julgar e acompanha a composição', () => {
    const placed: Placed[] = [
      { id: 'conversas', x: 0.5, y: 0.5 },
      { id: 'viagens', x: 0.52, y: 0.48 },
      { id: 'rituais', x: 0.95, y: 0.95 },
    ];
    const text = read('prioridades', placed, pieces).join(' ');
    expect(text).toMatch(/3 peças/);
    expect(text).not.toMatch(/certo|errado|melhor|pior/i);
    expect(read('prioridades', [], pieces)[0]).toMatch(/vazia/);
  });
});
