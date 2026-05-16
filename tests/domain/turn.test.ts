import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { advanceTurn } from '../../src/domain/engine/advanceTurn';

describe('advanceTurn', () => {
  it('increments day by 1', () => {
    const s0 = createInitialState({ seed: 1 });
    const s1 = advanceTurn(s0);
    expect(s1.day).toBe(s0.day + 1);
  });

  it('resets daily time slots to max', () => {
    const s0 = { ...createInitialState({ seed: 1 }) };
    s0.daily = { ...s0.daily, timeSlots: 0 };
    const s1 = advanceTurn(s0);
    expect(s1.daily.timeSlots).toBe(s0.daily.maxTimeSlots);
  });

  it('is pure: input state is not mutated', () => {
    const s0 = createInitialState({ seed: 1 });
    const snapshot = JSON.parse(JSON.stringify(s0));
    advanceTurn(s0);
    expect(s0).toEqual(snapshot);
  });
});
