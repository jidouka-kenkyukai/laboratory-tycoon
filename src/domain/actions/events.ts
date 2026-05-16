import type { GameState, EventChoice, PendingEvent } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';
import { EVENTS, EVENT_BY_ID } from '../data/events';
import { createRng } from '../rng';

const EVENT_DAILY_CHANCE = 0.35;

/** ターン開始時に1イベントを抽選 (出ない日もある) */
export function maybeFireRandomEvent(state: GameState): GameState {
  if (state.pendingEvent) return state; // 既に未解決のイベントがある

  const rng = createRng(state.rngSeed ^ state.day);
  if (rng() >= EVENT_DAILY_CHANCE) {
    const nextSeed = Math.floor(rng() * 0xffffffff);
    return { ...state, rngSeed: nextSeed };
  }

  // 条件を満たすイベントだけプールに
  const pool = EVENTS.filter((e) => !e.predicate || e.predicate(state));
  if (pool.length === 0) {
    return { ...state, rngSeed: Math.floor(rng() * 0xffffffff) };
  }
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  const target = rng() * totalWeight;
  let acc = 0;
  let chosen = pool[0];
  for (const e of pool) {
    acc += e.weight;
    if (acc >= target) {
      chosen = e;
      break;
    }
  }
  const nextSeed = Math.floor(rng() * 0xffffffff);
  const pending: PendingEvent = { defId: chosen.id, day: state.day };
  let next: GameState = { ...state, rngSeed: nextSeed, pendingEvent: pending };
  next = setNarration(next, chosen.narration);
  next = pushLog(next, { kind: 'warn', text: `[イベント] ${chosen.title}` });
  return next;
}

/** プレイヤーがイベントの選択肢を選んだ時 */
export function resolvePendingEvent(state: GameState, choice: EventChoice): GameState {
  if (!state.pendingEvent) return state;
  const def = EVENT_BY_ID.get(state.pendingEvent.defId);
  if (!def) return { ...state, pendingEvent: undefined };

  let next = applyEffects(state, choice.effects);
  next = { ...next, pendingEvent: undefined };
  if (choice.log) {
    next = pushLog(next, { kind: 'info', text: `[選択] ${def.title}: ${choice.log}` });
  }
  return next;
}
