import type { GameState } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';

/** 短い休憩。時間1スロット消費してメンタル/集中力を回復 */
export function takeBreak(state: GameState): GameState {
  let next = applyEffects(state, [
    { kind: 'timeSlot', amount: -1 },
    { kind: 'focus', amount: 25 },
    { kind: 'mental', amount: 10 },
  ]);
  next = pushLog(next, { kind: 'info', text: '[休憩] コーヒーを淹れて窓の外を眺めた' });
  next = setNarration(
    next,
    '湯気の立つマグを両手で包む。少しだけ、頭の中の雑音が静かになった気がする。',
  );
  return next;
}
