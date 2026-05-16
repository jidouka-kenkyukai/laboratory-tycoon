import type { SkillId, Skills } from '../types';

export const SKILL_IDS: SkillId[] = [
  'experiment',
  'analysis',
  'writing',
  'english',
  'presentation',
  'management',
  'admin',
];

export const SKILL_LABELS: Record<SkillId, string> = {
  experiment: '実験技術',
  analysis: 'データ解析',
  writing: '執筆',
  english: '英語',
  presentation: 'プレゼン',
  management: 'マネジメント',
  admin: 'ラボ運営',
};

export function createInitialSkills(): Skills {
  return SKILL_IDS.reduce((acc, id) => {
    acc[id] = { level: 1, xp: 0 };
    return acc;
  }, {} as Skills);
}

/** XPを加算しレベルアップ判定。三角数的に必要XP増加。 */
export function addSkillXp(skills: Skills, skill: SkillId, amount: number): Skills {
  const cur = skills[skill];
  let level = cur.level;
  let xp = cur.xp + amount;
  while (xp >= xpForLevel(level + 1)) {
    xp -= xpForLevel(level + 1);
    level += 1;
  }
  return { ...skills, [skill]: { level, xp } };
}

export function xpForLevel(level: number): number {
  return 50 + (level - 1) * 30;
}

/** スキルレベルが行動成功率に与えるボーナス (1 level = +2%) */
export function skillBonus(skills: Skills, skill: SkillId): number {
  return (skills[skill].level - 1) * 0.02;
}
