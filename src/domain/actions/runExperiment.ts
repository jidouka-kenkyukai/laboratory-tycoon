import type { GameState, ProtocolDef } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';
import { skillBonus } from '../rules/skills';
import { createRng, rngChance } from '../rng';
import { EQUIPMENT_BY_ID } from '../data/equipments';

export type ExperimentResult = {
  state: GameState;
  success: boolean;
  rolledRate: number;
};

/** プロトコルを1回実行する純粋関数 */
export function runExperiment(state: GameState, protocol: ProtocolDef): ExperimentResult {
  // 機器ボーナス計算
  const labTags = state.lab.equipments.flatMap((inst) => {
    const def = EQUIPMENT_BY_ID.get(inst.defId);
    return def ? def.tags : [];
  });
  const matchedEquipBonus = (protocol.preferredEquipmentTags ?? []).some((t) =>
    labTags.includes(t),
  )
    ? 0.1
    : 0;

  const successRate =
    protocol.baseSuccessRate +
    skillBonus(state.player.skills, protocol.primarySkill) +
    matchedEquipBonus +
    (state.daily.focus < 30 ? -0.15 : state.daily.focus < 60 ? -0.05 : 0) +
    (state.daily.mental < 20 ? -0.2 : 0);

  // RNG 1回消費
  const rng = createRng(state.rngSeed);
  const roll = rng();
  const success = roll < successRate;
  // seed を進める
  const nextSeed = Math.floor(rng() * 0xffffffff);

  let next: GameState = { ...state, rngSeed: nextSeed };

  // コスト適用 (時間スロット・集中力・メンタル・資金)
  next = applyEffects(next, [
    { kind: 'timeSlot', amount: -protocol.timeSlots },
    { kind: 'focus', amount: -protocol.focusCost },
    { kind: 'mental', amount: -protocol.mentalCost },
    { kind: 'funds', amount: -protocol.costFunds },
  ]);

  // 効果適用
  const effects = success ? protocol.successEffects : protocol.failureEffects;
  next = applyEffects(next, effects);

  // ログ + ナレーション
  if (success) {
    next = pushLog(next, {
      kind: 'good',
      text: `[実験] ${protocol.name} 成功 (確率 ${(successRate * 100).toFixed(0)}%)`,
    });
    next = setNarration(
      next,
      `${protocol.name}は上手くいった。データを記録し、ノートに「再現する」とだけ書いておく。`,
    );
  } else {
    next = pushLog(next, {
      kind: 'bad',
      text: `[実験] ${protocol.name} 失敗 (確率 ${(successRate * 100).toFixed(0)}%)`,
    });
    next = setNarration(
      next,
      `${protocol.name}は思うようにいかなかった。なぜ失敗したか、明日また考えよう。`,
    );
  }
  // 補助で rngChance を使うイメージ (将来用)
  void rngChance;
  return { state: next, success, rolledRate: successRate };
}
