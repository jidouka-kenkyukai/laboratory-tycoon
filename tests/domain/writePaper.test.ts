import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { writePaperDraft } from '../../src/domain/actions/writePaper';

describe('writePaperDraft', () => {
  it('creates a drafting paper on first call', () => {
    const s0 = createInitialState({ seed: 1 });
    const s1 = writePaperDraft(s0, s0.projects[0]);
    expect(s1.papers).toHaveLength(1);
    expect(s1.papers[0].stage).toBe('drafting');
  });

  it('improves existing draft instead of creating duplicate', () => {
    const s0 = createInitialState({ seed: 1 });
    const s1 = writePaperDraft(s0, s0.projects[0]);
    const s2 = writePaperDraft(s1, s1.projects[0]);
    expect(s2.papers).toHaveLength(1);
    expect(s2.papers[0].qualityScore).toBeGreaterThan(s1.papers[0].qualityScore);
  });
});
