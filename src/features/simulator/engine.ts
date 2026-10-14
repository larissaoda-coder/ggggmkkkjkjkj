/**
 * Motor narrativo do simulador de escolhas.
 *
 * O estado da história é feito de variáveis numéricas (confiança, proximidade,
 * clareza) e de marcadores (flags). Falas e escolhas podem depender desse
 * estado, e o destino de uma escolha pode ser calculado a partir dele.
 * Nada aqui é exibido como pontuação: as variáveis só moldam a narrativa.
 */

export type VarName = 'confianca' | 'proximidade' | 'clareza';

export interface StoryState {
  vars: Record<VarName, number>;
  flags: Record<string, boolean>;
}

export type Cond = (s: StoryState) => boolean;
export type Dyn<T> = T | ((s: StoryState) => T);

export type Speaker = 'narracao' | 'pensamento' | 'teo' | 'lia' | 'voce' | 'msg-teo' | 'msg-voce';

export interface Line {
  who: Speaker;
  text: string;
  if?: Cond;
}

export interface Choice {
  id: string;
  label: string;
  if?: Cond;
  /** Quando indisponível, aparece desativada com esta indicação (em vez de sumir). */
  locked?: string;
  add?: Partial<Record<VarName, number>>;
  set?: string[];
  to: Dyn<string>;
}

export type Backdrop = 'sala-chuva' | 'manha' | 'galeria' | 'cafe' | 'rua' | 'casa-noite' | 'lisboa' | 'cartas';

export interface Scene {
  id: string;
  chapter: number;
  place: Dyn<string>;
  time: Dyn<string>;
  backdrop: Dyn<Backdrop>;
  lines: Line[];
  choices?: Choice[];
  /** Cena sem escolhas: segue para esta cena com um "continuar". */
  next?: Dyn<string>;
  /** Cena final: identificador do desfecho. */
  ending?: string;
  /** Marcadores aplicados ao entrar na cena. */
  onEnter?: { set?: string[]; add?: Partial<Record<VarName, number>> };
}

export interface Ending {
  id: string;
  title: string;
  /** Uma linha neutra: nenhum desfecho é tratado como melhor do que outro. */
  note: string;
}

export const initialState = (): StoryState => ({
  vars: { confianca: 0, proximidade: 0, clareza: 0 },
  flags: {},
});

/* ---------- auxiliares de condição ---------- */
export const has =
  (flag: string): Cond =>
  (s) =>
    Boolean(s.flags[flag]);
export const not =
  (flag: string): Cond =>
  (s) =>
    !s.flags[flag];
export const atLeast =
  (v: VarName, n: number): Cond =>
  (s) =>
    s.vars[v] >= n;
export const below =
  (v: VarName, n: number): Cond =>
  (s) =>
    s.vars[v] < n;
export const all =
  (...conds: Cond[]): Cond =>
  (s) =>
    conds.every((c) => c(s));
export const any =
  (...conds: Cond[]): Cond =>
  (s) =>
    conds.some((c) => c(s));

export function resolve<T>(value: Dyn<T>, s: StoryState): T {
  return typeof value === 'function' ? (value as (s: StoryState) => T)(s) : value;
}

export function applyEffects(
  s: StoryState,
  effects: { add?: Partial<Record<VarName, number>>; set?: string[] } | undefined,
): StoryState {
  if (!effects) return s;
  const vars = { ...s.vars };
  for (const [k, v] of Object.entries(effects.add ?? {})) vars[k as VarName] += v ?? 0;
  const flags = { ...s.flags };
  for (const f of effects.set ?? []) flags[f] = true;
  return { vars, flags };
}

export function visibleLines(scene: Scene, s: StoryState): Line[] {
  return scene.lines.filter((l) => !l.if || l.if(s));
}

export interface ChoiceView {
  choice: Choice;
  available: boolean;
}

/** Escolhas a exibir: disponíveis + indisponíveis que devem aparecer como bloqueadas. */
export function choiceViews(scene: Scene, s: StoryState): ChoiceView[] {
  return (scene.choices ?? [])
    .map((choice) => ({ choice, available: !choice.if || choice.if(s) }))
    .filter((v) => v.available || Boolean(v.choice.locked));
}

/** Aplica a escolha e devolve a próxima cena e o novo estado. */
export function choose(choice: Choice, s: StoryState): { to: string; state: StoryState } {
  const state = applyEffects(s, choice);
  return { to: resolve(choice.to, state), state };
}

export function enter(scene: Scene, s: StoryState): StoryState {
  return applyEffects(s, scene.onEnter);
}
