import { describe, expect, it } from 'vitest';
import { actionsFor, availableTopics, END_AT, initialNight, nightTitle, starVisible, type ObjectId } from './night';

const objects: ObjectId[] = ['janela', 'abajur', 'vitrola', 'cozinha', 'poltrona', 'mesa', 'planta', 'relogio'];

describe('uma noite, vários caminhos', () => {
  it('todos os objetos oferecem alguma ação no início', () => {
    const s = initialNight();
    for (const o of objects) expect(actionsFor(o, s).length, o).toBeGreaterThan(0);
  });

  it('as ações mudam o cômodo e o que vem depois', () => {
    let s = initialNight();
    s = actionsFor('cozinha', s)
      .find((a) => a.id === 'cha')!
      .run(s);
    expect(s.tea).toBe('fervendo');
    expect(actionsFor('cozinha', s).some((a) => a.id === 'esperar')).toBe(true);
    s = actionsFor('janela', s)
      .find((a) => a.id === 'chuva')!
      .run(s);
    expect(availableTopics(s).some((t) => t.id === 'chuva')).toBe(true);
  });

  it('ler exige luz', () => {
    let s = initialNight();
    s = actionsFor('abajur', s)[0].run(s);
    expect(actionsFor('poltrona', s).find((a) => a.id === 'ler')?.disabledReason).toBeTruthy();
  });

  it('a estrela só aparece com a luz apagada, sem chuva, depois das 21h', () => {
    let s = initialNight();
    expect(starVisible(s)).toBe(false);
    s = actionsFor('abajur', s)[0].run(s);
    expect(starVisible(s)).toBe(false);
    s = actionsFor('relogio', s)[0].run(s);
    s = actionsFor('relogio', s)[0].run(s);
    expect(starVisible(s)).toBe(true);
    s = actionsFor('janela', s)
      .find((a) => a.id === 'chuva')!
      .run(s);
    expect(starVisible(s)).toBe(false);
  });

  it('o relógio nunca passa do fim da noite e a noite pode ser encerrada', () => {
    let s = initialNight();
    for (let i = 0; i < 20; i++) {
      const a = actionsFor('relogio', s).find((x) => x.id === 'avancar');
      if (a) s = a.run(s);
    }
    expect(s.minutes).toBe(END_AT);
    s = actionsFor('relogio', s)
      .find((x) => x.id === 'terminar')!
      .run(s);
    expect(s.ended).toBe(true);
    expect(nightTitle(s)).toMatch(/^Uma noite de /);
  });
});
