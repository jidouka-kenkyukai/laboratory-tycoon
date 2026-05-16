import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { runExperiment } from '../../src/domain/actions/runExperiment';
import { PROTOCOL_BY_ID } from '../../src/domain/data/protocols';

describe('runExperiment', () => {
  it('deducts time slot and funds regardless of success', () => {
    const s0 = createInitialState({ seed: 12345 });
    const pcr = PROTOCOL_BY_ID.get('pcr')!;
    const { state: s1 } = runExperiment(s0, pcr);
    expect(s1.daily.timeSlots).toBe(s0.daily.timeSlots - pcr.timeSlots);
    expect(s1.resources.funds).toBe(s0.resources.funds - pcr.costFunds);
  });

  it('produces a data point on success', () => {
    // 種を変えて何回か試し、少なくとも1回は成功するはず
    let success = false;
    for (let seed = 0; seed < 20; seed++) {
      const s0 = createInitialState({ seed });
      const pcr = PROTOCOL_BY_ID.get('pcr')!;
      const { state, success: ok } = runExperiment(s0, pcr);
      if (ok) {
        success = true;
        expect(state.projects[0].dataPoints.length).toBe(1);
        break;
      }
    }
    expect(success).toBe(true);
  });

  it('does not mutate input state', () => {
    const s0 = createInitialState({ seed: 7 });
    const snapshot = JSON.parse(JSON.stringify(s0));
    runExperiment(s0, PROTOCOL_BY_ID.get('pcr')!);
    expect(s0).toEqual(snapshot);
  });

  it('progresses rng seed (determinism check)', () => {
    const s0 = createInitialState({ seed: 999 });
    const { state: a } = runExperiment(s0, PROTOCOL_BY_ID.get('pcr')!);
    const { state: b } = runExperiment(s0, PROTOCOL_BY_ID.get('pcr')!);
    // 同じ seed なら同じ結果
    expect(a.rngSeed).toBe(b.rngSeed);
  });
});
