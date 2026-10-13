import { describe, expect, it } from 'vitest';
import { letterParagraphs } from './letter';
import { fragments } from './fragments';

describe('conteúdo original', () => {
  it('a carta começa e termina exatamente como o texto fornecido', () => {
    expect(letterParagraphs[0].startsWith('Nesse momento, encontro-me parado diante da janela de meu quarto,')).toBe(
      true,
    );
    expect(letterParagraphs[letterParagraphs.length - 1]).toBe('Diria apenas que gostaria de vivê-lo com você.');
  });

  it('a carta mantém os 29 parágrafos, sem parágrafos vazios', () => {
    expect(letterParagraphs).toHaveLength(29);
    for (const p of letterParagraphs) expect(p.trim()).toBe(p);
    for (const p of letterParagraphs) expect(p.length).toBeGreaterThan(0);
  });

  it('a carta preserva os parágrafos curtos isolados', () => {
    expect(letterParagraphs).toContain('Eu gostaria de descobrir isso com você.');
    expect(letterParagraphs).toContain(
      'Por isso, se me permite, termino estas páginas com a mesma sinceridade com que comecei a escrevê-las.',
    );
  });

  it('há dez fragmentos, numerados de 1 a 10, cada um com título e texto', () => {
    expect(fragments.map((f) => f.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const f of fragments) {
      expect(f.title.length).toBeGreaterThan(10);
      expect(f.text.startsWith(' ')).toBe(false);
      expect(f.text.endsWith('.')).toBe(true);
    }
    expect(fragments[9].title).toBe('O fato de você ser Annelise antes de ser qualquer coisa minha');
    expect(fragments[0].text.startsWith('Admiro a naturalidade com que você existe')).toBe(true);
  });
});
