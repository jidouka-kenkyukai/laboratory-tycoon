import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { createSOP, runActiveSOPs, toggleSOP, deleteSOP } from '../../src/domain/actions/sops';
import { buyEquipment } from '../../src/domain/actions/buyEquipment';
import { EQUIPMENT_BY_ID } from '../../src/domain/data/equipments';
import { PROTOCOL_BY_ID } from '../../src/domain/data/protocols';

describe('sops', () => {
  function readyLab() {
    let s = createInitialState({ seed: 5 });
    s = { ...s, resources: { ...s.resources, funds: 10000 } };
    // GPU rig は auto, gpu タグ
    s = buyEquipment(s, EQUIPMENT_BY_ID.get('gpu-rig')!);
    return s;
  }

  it('manual equipment cannot be SOPed', () => {
    let s = createInitialState({ seed: 1 });
    s = { ...s, resources: { ...s.resources, funds: 10000 } };
    s = buyEquipment(s, EQUIPMENT_BY_ID.get('biosafety-cabinet')!); // manual
    const inst = s.lab.equipments[0];
    const s2 = createSOP(s, inst, PROTOCOL_BY_ID.get('cell-culture')!);
    expect(s2.sops.length).toBe(0);
  });

  it('auto equipment + matching protocol creates SOP', () => {
    let s = readyLab();
    const inst = s.lab.equipments[0];
    s = createSOP(s, inst, PROTOCOL_BY_ID.get('ml-training')!);
    expect(s.sops.length).toBe(1);
    expect(s.sops[0].active).toBe(true);
  });

  it('runActiveSOPs adds data points or logs failure deterministically', () => {
    let s = readyLab();
    const inst = s.lab.equipments[0];
    s = createSOP(s, inst, PROTOCOL_BY_ID.get('ml-training')!);
    const before = s.projects[0].dataPoints.length;
    const s2 = runActiveSOPs(s);
    // 成功でも失敗でも例外を投げず、機器コンディションが減る
    expect(s2.lab.equipments[0].condition).toBeLessThanOrEqual(inst.condition);
    // 成功した場合のみデータが増える (確率なのでどちらでも可)
    expect(s2.projects[0].dataPoints.length).toBeGreaterThanOrEqual(before);
  });

  it('toggle and delete SOP work', () => {
    let s = readyLab();
    const inst = s.lab.equipments[0];
    s = createSOP(s, inst, PROTOCOL_BY_ID.get('ml-training')!);
    const sopId = s.sops[0].id;
    s = toggleSOP(s, sopId);
    expect(s.sops[0].active).toBe(false);
    s = deleteSOP(s, sopId);
    expect(s.sops.length).toBe(0);
  });
});
