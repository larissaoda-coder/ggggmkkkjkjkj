import { describe, expect, it } from 'vitest';
import { decide, edges, initialLab, isReachable, nodeById, nodes, travel, type LabState } from './map';

/** Joga uma sequência de [lugar, escolha], exigindo que cada lugar seja alcançável. */
function play(steps: [string, string | null][]): LabState {
  let s = initialLab();
  for (const [id, optionId] of steps) {
    expect(isReachable(s, id), `alcançar ${id}`).toBe(true);
    s = travel(s, id);
    if (optionId) {
      const option = nodeById[id].options!.find((o) => o.id === optionId)!;
      const next = decide(s, id, option);
      expect(next, `decidir ${id}/${optionId}`).not.toBe(s);
      s = next;
    }
  }
  return s;
}

describe('labirinto de possibilidades', () => {
  it('todas as arestas ligam lugares existentes', () => {
    for (const [a, b] of edges) {
      expect(nodeById[a], a).toBeDefined();
      expect(nodeById[b], b).toBeDefined();
    }
  });

  it('todo lugar pode ser alcançado em algum percurso', () => {
    const a = play([
      ['ponte', 'atravessar'],
      ['casa', 'escrever'],
      ['rua', 'pegar'],
      ['escada', 'subir'],
      ['terraco', 'amanhecer'],
      ['jardim', 'regar'],
      ['litoral', 'livraria'],
      ['sala', 'tocar'],
      ['porta', 'abrir'],
      ['farol', 'acender'],
    ]);
    const b = play([
      ['ponte', 'descer'],
      ['rio', 'correnteza'],
      ['ilha', 'mare'],
      ['farol', 'acender'],
      ['estacao', 'direita'],
      ['cidade', 'perder'],
      ['banco', 'mapa'],
    ]);
    expect(a.lit && b.lit).toBe(true);
    const all = new Set([...a.visited, ...b.visited]);
    expect(nodes.map((n) => n.id).filter((id) => !all.has(id))).toEqual([]);
  });

  it('um caminho fechado pode reabrir por outra rota', () => {
    const s = play([
      ['estacao', 'direita'],
      ['escada', 'sentar'],
      ['jardim', 'regar'],
    ]);
    expect(s.closed).not.toContain('litoral');
    expect(isReachable(s, 'litoral')).toBe(true);
  });

  it('escolhas exclusivas fecham o caminho alternativo', () => {
    let s = travel(initialLab(), 'ponte');
    s = decide(s, 'ponte', nodeById.ponte.options![0]);
    expect(s.closed).toContain('rio');
    expect(isReachable(s, 'rio')).toBe(false);
    expect(isReachable(s, 'casa')).toBe(true);
  });

  it('a porta só abre com a chave', () => {
    let s = travel(initialLab(), 'sala');
    s = decide(s, 'sala', nodeById.sala.options![0]);
    s = travel(s, 'porta');
    const abrir = nodeById.porta.options![0];
    expect(decide(s, 'porta', abrir)).toBe(s);
    const comChave = { ...s, flags: [...s.flags, 'chave'] };
    expect(decide(comChave, 'porta', abrir).revealed).toContain('farol');
  });

  it('não é possível pular para um lugar não ligado ao percurso', () => {
    const s = initialLab();
    expect(travel(s, 'farol')).toBe(s);
  });
});
