import type { GameState, SOP, EquipmentInstance, ProtocolDef, ExperimentDataPoint } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';
import { EQUIPMENT_BY_ID } from '../data/equipments';
import { PROTOCOL_BY_ID } from '../data/protocols';
import { createRng, rngChance } from '../rng';

const SOP_CREATE_TIME = 1;
const SOP_CREATE_FOCUS = 12;

/** プレイヤーが auto / semi-auto 機器に SOP を紐付ける */
export function createSOP(
  state: GameState,
  inst: EquipmentInstance,
  protocol: ProtocolDef,
): GameState {
  if (state.daily.timeSlots < SOP_CREATE_TIME) return state;
  const def = EQUIPMENT_BY_ID.get(inst.defId);
  if (!def) return state;
  if (def.automation === 'manual') {
    return setNarration(state, `${def.name} は手動運転のみ。SOPを組めない。`);
  }
  // 機器とプロトコルのタグ整合
  if (
    protocol.preferredEquipmentTags &&
    !protocol.preferredEquipmentTags.some((t) => def.tags.includes(t))
  ) {
    return setNarration(state, `${def.name} は ${protocol.name} を回せない (タグ不一致)`);
  }

  // 並列スロット制限内なら追加、超えていれば最古を1つ追い出して追加
  const sameMachine = state.sops.filter((s) => s.equipmentInstanceId === inst.instanceId);
  const slots = def.parallelSlots ?? 1;
  let otherSOPs = state.sops.filter((s) => s.equipmentInstanceId !== inst.instanceId);
  if (sameMachine.length < slots) {
    otherSOPs = [...otherSOPs, ...sameMachine];
  } else {
    // 古い順で残す n-1 個 + 末尾を入れ替え (FIFO)
    otherSOPs = [...otherSOPs, ...sameMachine.slice(1)];
  }
  const sop: SOP = {
    id: `sop-${inst.instanceId}-${state.day}`,
    equipmentInstanceId: inst.instanceId,
    protocolId: protocol.id,
    active: true,
    createdOnDay: state.day,
  };
  let next = applyEffects(state, [
    { kind: 'timeSlot', amount: -SOP_CREATE_TIME },
    { kind: 'focus', amount: -SOP_CREATE_FOCUS },
    { kind: 'skillXp', skill: 'admin', amount: 8 },
  ]);
  next = { ...next, sops: [...otherSOPs, sop] };
  next = pushLog(next, {
    kind: 'good',
    text: `[SOP] ${def.name} で ${protocol.name} を自動運転開始`,
  });
  next = setNarration(
    next,
    `${def.name} の手順を文書化し、自動運転キューに登録。これで毎日勝手に回ってくれる。`,
  );
  return next;
}

export function toggleSOP(state: GameState, sopId: string): GameState {
  return {
    ...state,
    sops: state.sops.map((s) => (s.id === sopId ? { ...s, active: !s.active } : s)),
  };
}

export function deleteSOP(state: GameState, sopId: string): GameState {
  return { ...state, sops: state.sops.filter((s) => s.id !== sopId) };
}

/** ターン終了時に全アクティブSOPを実行する */
export function runActiveSOPs(state: GameState): GameState {
  if (state.sops.length === 0) return state;
  let next = state;
  for (const sop of state.sops) {
    if (!sop.active) continue;
    next = runOneSOP(next, sop);
  }
  return next;
}

function runOneSOP(state: GameState, sop: SOP): GameState {
  const inst = state.lab.equipments.find((e) => e.instanceId === sop.equipmentInstanceId);
  const eqDef = inst ? EQUIPMENT_BY_ID.get(inst.defId) : undefined;
  const protocol = PROTOCOL_BY_ID.get(sop.protocolId);
  if (!inst || !eqDef || !protocol) return state;

  // コンディション低い機器は失敗率増
  const condFactor = inst.condition / 100;
  // 自動機器ボーナス: auto なら効率良く回せる
  const autoBonus = eqDef.automation === 'auto' ? 0.1 : 0.05;

  // 試薬代を引く (足りないと回せない)
  if (state.resources.funds < protocol.costFunds) return state;
  let next: GameState = state;

  const rng = createRng(state.rngSeed ^ inst.instanceId.length);
  const successRate = protocol.baseSuccessRate * (0.7 + condFactor * 0.3) + autoBonus;
  const success = rngChance(rng, successRate);
  const nextSeed = Math.floor(rng() * 0xffffffff);
  next = { ...next, rngSeed: nextSeed };

  next = applyEffects(next, [
    { kind: 'funds', amount: -Math.round(protocol.costFunds * 0.6) }, // 自動運転は試薬使用効率良し
  ]);

  if (success) {
    const targetProj =
      (sop.projectId && next.projects.find((p) => p.id === sop.projectId)) || next.projects[0];
    if (targetProj) {
      const dp: ExperimentDataPoint = {
        id: `dp-sop-${state.day}-${sop.id}-${targetProj.dataPoints.length}`,
        projectId: targetProj.id,
        protocolId: protocol.id,
        day: next.day,
        quality: 50 + Math.round(inst.condition / 8),
        reproducibility: 70 + (eqDef.automation === 'auto' ? 15 : 5),
        success: true,
      };
      next = {
        ...next,
        projects: next.projects.map((p) =>
          p.id === targetProj.id
            ? { ...p, dataPoints: [...p.dataPoints, dp], progress: Math.min(100, p.progress + 3) }
            : p,
        ),
        resources: { ...next.resources, researchPoints: next.resources.researchPoints + 5 },
      };
    }
    // 機器コンディション微減
    next = {
      ...next,
      lab: {
        ...next.lab,
        equipments: next.lab.equipments.map((e) =>
          e.instanceId === inst.instanceId ? { ...e, condition: Math.max(0, e.condition - 1) } : e,
        ),
      },
    };
    next = pushLog(next, {
      kind: 'good',
      text: `[自動運転] ${eqDef.name}: ${protocol.name} 成功`,
    });
  } else {
    next = {
      ...next,
      lab: {
        ...next.lab,
        equipments: next.lab.equipments.map((e) =>
          e.instanceId === inst.instanceId ? { ...e, condition: Math.max(0, e.condition - 3) } : e,
        ),
      },
    };
    next = pushLog(next, {
      kind: 'warn',
      text: `[自動運転] ${eqDef.name}: ${protocol.name} 失敗 (機器消耗)`,
    });
  }
  return next;
}
