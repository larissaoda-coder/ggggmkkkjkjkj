import { describe, expect, it } from 'vitest';
import { closing, endings, items, places, placeById, times, type Journey } from './paths';

const combos = (arr: string[], k: number): string[][] =>
  k === 0 ? [[]] : arr.flatMap((x, i) => combos(arr.slice(i + 1), k - 1).map((c) => [x, ...c]));

describe('encontre seu próprio caminho', () => {
  it('cada desfecho pertence a um lugar existente', () => {
    for (const e of endings) expect(placeById[e.place], e.id).toBeDefined();
  });

  it('todo lugar fica disponível em alguma combinação de hora e objetos', () => {
    const ids = items.map((i) => i.id);
    const all = [0, 1, 2, 3].flatMap((k) => combos(ids, k));
    for (const p of places) {
      const ok = times.some((t) =>
        all.some((it) => p.check({ items: it, time: t.id, place: null, ending: null }) === true),
      );
      expect(ok, p.id).toBe(true);
    }
  });

  it('a hora e os objetos realmente mudam as possibilidades', () => {
    const base: Journey = { items: [], time: 'noite', place: null, ending: null };
    expect(placeById.rio.check(base)).not.toBe(true);
    expect(placeById.rio.check({ ...base, items: ['cachecol'] })).toBe(true);
    expect(placeById.feira.check(base)).not.toBe(true);
    expect(placeById.feira.check({ ...base, time: 'manha' })).toBe(true);
  });

  it('os textos de desfecho e de fechamento são gerados sem lacunas', () => {
    for (const t of times) {
      for (const it of [[], ['caderno'], ['camera', 'bicicleta', 'agua']]) {
        const j: Journey = { items: it, time: t.id, place: null, ending: null };
        for (const e of endings) {
          const text = e.text(j);
          expect(text).not.toMatch(/undefined|null|\$\{/);
        }
        expect(closing(j)).not.toMatch(/undefined|null/);
      }
    }
  });
});
