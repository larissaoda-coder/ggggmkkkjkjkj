import { describe, expect, it } from 'vitest';
import { scenes, endings, START, chapters } from './story';
import { choose, choiceViews, enter, initialState, resolve, visibleLines, type StoryState } from './engine';

/** Percorre todos os caminhos possíveis, simulando o estado real. */
function explore() {
  const reachedScenes = new Set<string>();
  const reachedEndings = new Set<string>();
  const problems: string[] = [];
  let paths = 0;
  const stack: { id: string; state: StoryState; depth: number }[] = [{ id: START, state: initialState(), depth: 0 }];
  while (stack.length) {
    const { id, state: before, depth } = stack.pop()!;
    const scene = scenes[id];
    if (!scene) {
      problems.push(`cena inexistente: ${id}`);
      continue;
    }
    if (depth > 60) {
      problems.push(`caminho longo demais (laço?) em ${id}`);
      continue;
    }
    const state = enter(scene, before);
    reachedScenes.add(id);
    if (visibleLines(scene, state).length === 0) problems.push(`cena sem falas visíveis: ${id}`);
    for (const key of ['place', 'time', 'backdrop'] as const) {
      if (!resolve(scene[key], state)) problems.push(`${key} vazio em ${id}`);
    }
    if (scene.ending) {
      reachedEndings.add(scene.ending);
      paths++;
      continue;
    }
    const views = choiceViews(scene, state).filter((v) => v.available);
    if (scene.choices?.length) {
      if (views.length === 0) problems.push(`nenhuma escolha disponível em ${id}`);
      for (const v of views) {
        const r = choose(v.choice, state);
        stack.push({ id: r.to, state: r.state, depth: depth + 1 });
      }
    } else if (scene.next) {
      stack.push({ id: resolve(scene.next, state), state, depth: depth + 1 });
    } else {
      problems.push(`cena sem saída: ${id}`);
    }
  }
  return { reachedScenes, reachedEndings, problems, paths };
}

describe('simulador de escolhas', () => {
  const result = explore();

  it('não tem cenas quebradas, sem saída ou sem falas', () => {
    expect(result.problems).toEqual([]);
  });

  it('alcança todas as cenas escritas', () => {
    const unreachable = Object.keys(scenes).filter((id) => !result.reachedScenes.has(id));
    expect(unreachable).toEqual([]);
  });

  it('alcança todos os desfechos', () => {
    expect([...result.reachedEndings].sort()).toEqual(endings.map((e) => e.id).sort());
  });

  it('tem ramificações reais (muitos caminhos distintos)', () => {
    expect(result.paths).toBeGreaterThan(100);
  });

  it('usa cinco capítulos coerentes', () => {
    for (const s of Object.values(scenes)) {
      expect(s.chapter).toBeGreaterThanOrEqual(1);
      expect(s.chapter).toBeLessThanOrEqual(chapters.length);
    }
  });

  it('cada id corresponde à chave da cena', () => {
    for (const [key, s] of Object.entries(scenes)) expect(s.id).toBe(key);
  });
});
