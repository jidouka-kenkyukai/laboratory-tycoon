import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { evaluatePromotion, promote } from '../../src/domain/actions/careers';

describe('careers', () => {
  it('initial graduate cannot promote', () => {
    const s = createInitialState({ seed: 1 });
    const r = evaluatePromotion(s);
    expect(r.eligible).toBe(false);
    expect(r.missing.length).toBeGreaterThan(0);
  });

  it('with enough stats, graduate can promote to postdoc', () => {
    let s = createInitialState({ seed: 1 });
    s = {
      ...s,
      resources: { ...s.resources, publications: 3, reputation: 20, hIndex: 2 },
      grantsAwardedCount: 0,
    };
    const r = evaluatePromotion(s);
    expect(r.eligible).toBe(true);
    const s2 = promote(s);
    expect(s2.player.tier).toBe('postdoc');
  });

  it('promote is a no-op if not eligible', () => {
    const s = createInitialState({ seed: 1 });
    const s2 = promote(s);
    expect(s2.player.tier).toBe(s.player.tier);
  });

  it('promotion adjusts max time slots and space capacity', () => {
    let s = createInitialState({ seed: 1 });
    s = {
      ...s,
      resources: { ...s.resources, publications: 10, reputation: 100, hIndex: 5 },
      grantsAwardedCount: 1,
    };
    const s2 = promote(s);
    expect(s2.daily.maxTimeSlots).toBe(4);
    expect(s2.lab.spaceCapacity).toBe(8);
  });
});
