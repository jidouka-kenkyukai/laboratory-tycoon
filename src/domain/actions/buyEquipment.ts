import type { GameState, EquipmentDef, EquipmentInstance } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';

export function canBuyEquipment(state: GameState, def: EquipmentDef): { ok: boolean; reason?: string } {
  if (state.resources.funds < def.cost) return { ok: false, reason: '資金不足' };
  const usedSpace = state.lab.equipments.reduce((s, _) => s + 1, 0);
  if (usedSpace + def.spaceUsage > state.lab.spaceCapacity) {
    return { ok: false, reason: 'ラボのスペースが足りない' };
  }
  return { ok: true };
}

export function buyEquipment(state: GameState, def: EquipmentDef): GameState {
  const check = canBuyEquipment(state, def);
  if (!check.ok) return state;
  let next = applyEffects(state, [{ kind: 'funds', amount: -def.cost }]);
  const inst: EquipmentInstance = {
    instanceId: `eq-${def.id}-${next.day}-${next.lab.equipments.length}`,
    defId: def.id,
    condition: 100,
    acquiredOnDay: next.day,
  };
  next = {
    ...next,
    lab: { ...next.lab, equipments: [...next.lab.equipments, inst] },
  };
  next = pushLog(next, { kind: 'good', text: `[購入] ${def.name} を導入した` });
  next = setNarration(next, `${def.name} が届いた。段ボールを開ける時の高揚感は、何度経験しても変わらない。`);
  return next;
}
