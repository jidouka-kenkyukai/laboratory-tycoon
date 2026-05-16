import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { GRANT_BY_ID } from '../../src/domain/data/grants';
import {
  canApplyGrant,
  startGrantApplication,
  progressGrantWriting,
  submitGrant,
  resolveGrant,
} from '../../src/domain/actions/grants';

describe('grants', () => {
  it('rejects application below reputation/publication threshold', () => {
    const s = createInitialState({ seed: 1 });
    const big = GRANT_BY_ID.get('kakenhi-b')!;
    const check = canApplyGrant(s, big);
    expect(check.ok).toBe(false);
  });

  it('starts a drafting application for accessible grant', () => {
    const s = createInitialState({ seed: 1 });
    const small = GRANT_BY_ID.get('internal-young')!;
    const s2 = startGrantApplication(s, small);
    expect(s2.grants).toHaveLength(1);
    expect(s2.grants[0].stage).toBe('drafting');
  });

  it('progresses writing and can be submitted once complete', () => {
    let s = createInitialState({ seed: 1 });
    s = { ...s, daily: { ...s.daily, timeSlots: 99, focus: 100, mental: 100 } };
    const small = GRANT_BY_ID.get('internal-young')!;
    s = startGrantApplication(s, small);
    // 何度も書く
    for (let i = 0; i < 20; i++) {
      s = progressGrantWriting(s, s.grants[0]);
    }
    expect(s.grants[0].writingProgress).toBeGreaterThanOrEqual(small.writingRequired);
    s = submitGrant(s, s.grants[0]);
    expect(s.grants[0].stage).toBe('submitted');
  });

  it('resolves grant to awarded or declined with reproducible seed', () => {
    let s = createInitialState({ seed: 7 });
    const small = GRANT_BY_ID.get('internal-young')!;
    s = startGrantApplication(s, small);
    const after = resolveGrant(s, s.grants[0]);
    expect(['awarded', 'declined']).toContain(after.grants[0].stage);
  });
});
