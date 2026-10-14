import { describe, expect, it } from 'vitest';
import { defaultContent } from './defaults';
import { mergeContent } from './ContentContext';
import { cards, closingNote, positions, shuffle } from '../features/oracle/cards';

describe('conteúdo padrão', () => {
  it('tem os cinco envelopes pedidos, na ordem', () => {
    expect(defaultContent.envelopes.map((e) => e.label)).toEqual([
      'Abra quando sentir saudade',
      'Abra quando precisar sorrir',
      'Abra quando quiser saber o que penso de você',
      'Abra quando estiver em dúvida',
      'Abra quando quiser ler algo sem precisar responder',
    ]);
    const bodies = new Set(defaultContent.envelopes.map((e) => e.body));
    expect(bodies.size).toBe(5);
  });

  it('tem as sete cenas da outra fase da vida', () => {
    expect(defaultContent.future).toHaveLength(7);
    defaultContent.future.forEach((s) => expect(s.lines.length).toBeGreaterThan(1));
  });

  it('usa só as fotografias enviadas, sem legendas inventadas', () => {
    // Arquivos que existem de fato em public/fotos.
    const files = Object.keys(import.meta.glob('../../public/fotos/*.jpg')).map((f) => f.replace('../../public/', ''));
    expect(defaultContent.photos.length).toBeGreaterThan(0);
    for (const p of defaultContent.photos) {
      expect(files).toContain(p.src);
      expect(p.caption).toBe('');
      expect(p.dedication).toBe('');
    }
    expect(defaultContent.tracks).toEqual([]);
    expect(defaultContent.museum).toEqual([]);
  });

  it('usa os textos exigidos na página inicial', () => {
    expect(defaultContent.home).toEqual({
      title: 'Para Annelise.',
      subtitle: 'Algumas coisas merecem ser lidas com calma.',
      footer: 'Feito para você, com atenção aos detalhes.',
    });
  });

  it('evita frases feitas proibidas', () => {
    const all = JSON.stringify(defaultContent).toLowerCase();
    for (const cliche of [
      'duas almas',
      'minha estrela',
      'amor é infinito',
      'universo conspirou',
      'entrelaçados',
      'porto seguro',
    ]) {
      expect(all).not.toContain(cliche);
    }
  });
});

describe('mergeContent', () => {
  it('mantém o padrão para chaves ausentes ou de tipo errado', () => {
    const merged = mergeContent(defaultContent, { photos: 'x' as never, home: { title: 'Outro' } as never });
    expect(merged.photos).toEqual(defaultContent.photos);
    expect(merged.home.title).toBe('Outro');
    expect(merged.home.subtitle).toBe(defaultContent.home.subtitle);
  });

  it('ignora conteúdo inválido', () => {
    expect(mergeContent(defaultContent, null)).toBe(defaultContent);
  });
});

describe('oráculo', () => {
  it('tem doze cartas com uma leitura para cada posição', () => {
    expect(cards).toHaveLength(12);
    expect(positions).toEqual(['O que ficou para trás', 'O que existe agora', 'O que ainda pode acontecer']);
    cards.forEach((c) => c.readings.forEach((r) => expect(r.trim().length).toBeGreaterThan(10)));
    expect(new Set(cards.map((c) => c.id)).size).toBe(12);
  });

  it('embaralha sem perder nem repetir cartas', () => {
    const ids = cards.map((c) => c.id).sort();
    for (let i = 0; i < 20; i++)
      expect(
        shuffle(cards)
          .map((c) => c.id)
          .sort(),
      ).toEqual(ids);
  });

  it('termina com o aviso pedido', () => {
    expect(closingNote).toBe(
      'As cartas não decidem por você. Esta leitura é uma interpretação simbólica sobre escolhas, vínculos e possibilidades.',
    );
  });
});
