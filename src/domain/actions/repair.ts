import type { GameState, EquipmentInstance } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';
import { EQUIPMENT_BY_ID } from '../data/equipments';

/** condition が低いほど修理コスト/時間が上がる */
function repairCostFor(inst: EquipmentInstance, defCost: number): { funds: number; time: number } {
  const gap = Math.max(0, 100 - inst.condition); // 失われた割合
  const funds = Math.round((defCost * 0.1) * (gap / 100) + 80); // 最低$80
  const time = gap < 30 ? 0 : 1; // 軽症は時間ゼロ
  return { funds, time };
}

export function canRepair(state: GameState, inst: EquipmentInstance): { ok: boolean; reason?: string } {
  const def = EQUIPMENT_BY_ID.get(inst.defId);
  if (!def) return { ok: false, reason: '機器不明' };
  if (inst.condition >= 95) return { ok: false, reason: 'まだ修理不要' };
  const cost = repairCostFor(inst, def.cost);
  if (state.daily.timeSlots < cost.time) return { ok: false, reason: '時間が足りない' };
  if (state.resources.funds < cost.funds) return { ok: false, reason: `修理費$${cost.funds}不足` };
  return { ok: true };
}

export function repairEquipment(state: GameState, inst: EquipmentInstance): GameState {
  const def = EQUIPMENT_BY_ID.get(inst.defId);
  if (!def) return state;
  const cost = repairCostFor(inst, def.cost);
  const check = canRepair(state, inst);
  if (!check.ok) return state;

  let next = applyEffects(state, [
    { kind: 'timeSlot', amount: -cost.time },
    { kind: 'funds', amount: -cost.funds },
    { kind: 'skillXp', skill: 'experiment', amount: 4 },
  ]);
  next = {
    ...next,
    lab: {
      ...next.lab,
      equipments: next.lab.equipments.map((e) =>
        e.instanceId === inst.instanceId ? { ...e, condition: 100 } : e,
      ),
    },
  };
  next = pushLog(next, { kind: 'good', text: `[修理] ${def.name} を整備 (-$${cost.funds})` });
  next = setNarration(next, `${def.name} を分解掃除し、消耗パーツを交換。回した時の音が明らかに違う。`);
  return next;
}

/** 日次の自然劣化。決定論を保つため state.rngSeed と day から導出。 */
export function dailyEquipmentDecay(state: GameState): GameState {
  return {
    ...state,
    lab: {
      ...state.lab,
      equipments: state.lab.equipments.map((e, i) => {
        // seed/日/インスタンスから決定的に劣化判定
        const h = ((state.rngSeed ^ state.day ^ (i * 2654435761)) >>> 0) % 10;
        return h === 0 ? { ...e, condition: Math.max(0, e.condition - 1) } : e;
      }),
    },
  };
}
