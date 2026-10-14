import { describe, expect, it } from 'vitest';
import { paginate } from './paginate';
import { letterParagraphs } from '../../data/letter';
import { fragments } from '../../data/fragments';

describe('paginação do livro', () => {
  it('preserva a carta exatamente: os pedaços recompõem cada parágrafo', () => {
    const pages = paginate(letterParagraphs, 1080, 960);
    const rebuilt: string[] = [];
    for (const page of pages)
      for (const block of page) {
        if (block.continued) rebuilt[rebuilt.length - 1] += block.text;
        else rebuilt.push(block.text);
      }
    expect(rebuilt).toEqual([...letterParagraphs]);
  });

  it('respeita o orçamento de cada página', () => {
    const pages = paginate(letterParagraphs, 1080, 960);
    for (const [i, page] of pages.entries()) {
      const used = page.reduce((n, b) => n + b.text.length + 60, 0);
      expect(used, `página ${i + 1}`).toBeLessThanOrEqual(i === 0 ? 960 : 1080);
    }
  });

  it('preserva cada fragmento', () => {
    for (const f of fragments) {
      const pages = paginate([f.text], 1080, 960);
      expect(
        pages
          .flat()
          .map((b) => b.text)
          .join(''),
      ).toBe(f.text);
    }
  });
});
