import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { buyEquipment } from '../../src/domain/actions/buyEquipment';
import { repairEquipment, canRepair } from '../../src/domain/actions/repair';
import { EQUIPMENT_BY_ID } from '../../src/domain/data/equipments';

describe('repair', () => {
  function setup() {
    let s = createInitialState({ seed: 1 });
    s = { ...s, resources: { ...s.resources, funds: 10000 } };
    s = buyEquipment(s, EQUIPMENT_BY_ID.get('gpu-rig')!);
    // condition を下げる
    s = {
      ...s,
      lab: {
        ...s.lab,
        equipments: s.lab.equipments.map((e) => ({ ...e, condition: 40 })),
      },
    };
    return s;
  }

  it('canRepair returns false when funds are zero', () => {
    const s = { ...setup(), resources: { ...setup().resources, funds: 0 } };
    const r = canRepair(s, s.lab.equipments[0]);
    expect(r.ok).toBe(false);
  });

  it('repair restores condition to 100', () => {
    const s = setup();
    const s2 = repairEquipment(s, s.lab.equipments[0]);
    expect(s2.lab.equipments[0].condition).toBe(100);
    expect(s2.resources.funds).toBeLessThan(s.resources.funds);
  });

  it('canRepair rejects when condition >= 95', () => {
    let s = createInitialState({ seed: 1 });
    s = { ...s, resources: { ...s.resources, funds: 10000 } };
    s = buyEquipment(s, EQUIPMENT_BY_ID.get('gpu-rig')!);
    expect(canRepair(s, s.lab.equipments[0]).ok).toBe(false);
  });
});
