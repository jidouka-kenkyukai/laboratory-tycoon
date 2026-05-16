import type { CareerTier, PromotionCriteria } from '../types';

export const TIER_LABEL: Record<CareerTier, string> = {
  graduate: '大学院生',
  postdoc: 'ポスドク',
  assistant: '助教',
  associate: '准教授',
  professor: '教授',
  leader: '拠点リーダー',
};

/** 昇進すると貰える/失う特典 */
export type TierBenefits = {
  maxTimeSlots: number;     // 1日のスロット上限
  maxStudents: number;      // 学生定員 (UIヒント、ハード制限ではない)
  spaceCapacity: number;    // ラボ面積上限
  adminBurden: number;      // 0-1, 雑務イベント発火率倍率
};

export const TIER_BENEFITS: Record<CareerTier, TierBenefits> = {
  graduate:  { maxTimeSlots: 3, maxStudents: 0, spaceCapacity: 6,  adminBurden: 0.3 },
  postdoc:   { maxTimeSlots: 4, maxStudents: 1, spaceCapacity: 8,  adminBurden: 0.5 },
  assistant: { maxTimeSlots: 4, maxStudents: 3, spaceCapacity: 12, adminBurden: 0.8 },
  associate: { maxTimeSlots: 3, maxStudents: 6, spaceCapacity: 18, adminBurden: 1.0 },
  professor: { maxTimeSlots: 3, maxStudents: 10, spaceCapacity: 24, adminBurden: 1.4 },
  leader:    { maxTimeSlots: 2, maxStudents: 20, spaceCapacity: 40, adminBurden: 1.8 },
};

/** 昇進条件: from → to */
export const PROMOTIONS: PromotionCriteria[] = [
  {
    fromTier: 'graduate',
    toTier: 'postdoc',
    minPublications: 2,
    minReputation: 10,
    minHIndex: 1,
    minGrantsAwarded: 0,
  },
  {
    fromTier: 'postdoc',
    toTier: 'assistant',
    minPublications: 5,
    minReputation: 40,
    minHIndex: 3,
    minGrantsAwarded: 1,
  },
  {
    fromTier: 'assistant',
    toTier: 'associate',
    minPublications: 10,
    minReputation: 80,
    minHIndex: 6,
    minGrantsAwarded: 2,
  },
  {
    fromTier: 'associate',
    toTier: 'professor',
    minPublications: 20,
    minReputation: 180,
    minHIndex: 12,
    minGrantsAwarded: 4,
  },
  {
    fromTier: 'professor',
    toTier: 'leader',
    minPublications: 40,
    minReputation: 400,
    minHIndex: 25,
    minGrantsAwarded: 8,
  },
];

export function nextPromotion(tier: CareerTier) {
  return PROMOTIONS.find((p) => p.fromTier === tier);
}
