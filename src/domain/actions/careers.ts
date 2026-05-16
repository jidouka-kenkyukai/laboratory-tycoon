import type { GameState, PromotionCriteria } from '../types';
import { pushLog, setNarration } from '../engine/effects';
import { nextPromotion, TIER_BENEFITS, TIER_LABEL } from '../data/careers';

export type PromotionEligibility = {
  eligible: boolean;
  criteria?: PromotionCriteria;
  missing: string[];
};

export function evaluatePromotion(state: GameState): PromotionEligibility {
  const criteria = nextPromotion(state.player.tier);
  if (!criteria) return { eligible: false, missing: ['キャリアの最終段階'] };
  const missing: string[] = [];
  if (state.resources.publications < criteria.minPublications) {
    missing.push(`論文 ${state.resources.publications}/${criteria.minPublications}`);
  }
  if (state.resources.reputation < criteria.minReputation) {
    missing.push(`評判 ${state.resources.reputation}/${criteria.minReputation}`);
  }
  if (state.resources.hIndex < criteria.minHIndex) {
    missing.push(`H-Index ${state.resources.hIndex}/${criteria.minHIndex}`);
  }
  if (state.grantsAwardedCount < criteria.minGrantsAwarded) {
    missing.push(`採択グラント ${state.grantsAwardedCount}/${criteria.minGrantsAwarded}`);
  }
  return { eligible: missing.length === 0, criteria, missing };
}

/** 昇進を実行する (条件は呼び出し側 or 内部で再確認) */
export function promote(state: GameState): GameState {
  const result = evaluatePromotion(state);
  if (!result.eligible || !result.criteria) return state;
  const toTier = result.criteria.toTier;
  const benefits = TIER_BENEFITS[toTier];

  let next: GameState = {
    ...state,
    player: { ...state.player, tier: toTier },
    daily: {
      ...state.daily,
      maxTimeSlots: benefits.maxTimeSlots,
      timeSlots: Math.max(state.daily.timeSlots, benefits.maxTimeSlots),
    },
    lab: { ...state.lab, spaceCapacity: benefits.spaceCapacity },
  };
  next = pushLog(next, {
    kind: 'good',
    text: `[昇進] ${TIER_LABEL[state.player.tier]} → ${TIER_LABEL[toTier]} に昇進!`,
  });
  next = setNarration(
    next,
    `辞令を受け取る。${TIER_LABEL[toTier]} としての新しい責任が、机にどっさり積まれていく。`,
  );
  return next;
}
