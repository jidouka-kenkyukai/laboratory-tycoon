import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import {
  canRegisterConference,
  registerConference,
  resolveDueConferences,
} from '../../src/domain/actions/conferences';
import { CONFERENCE_BY_ID } from '../../src/domain/data/conferences';

describe('conferences', () => {
  it('cannot register without funds', () => {
    const s = { ...createInitialState({ seed: 1 }), resources: { ...createInitialState({ seed: 1 }).resources, funds: 0 } };
    const def = CONFERENCE_BY_ID.get('jp-society')!;
    expect(canRegisterConference(s, def).ok).toBe(false);
  });

  it('registers local workshop and deducts time', () => {
    const s = createInitialState({ seed: 1 });
    const def = CONFERENCE_BY_ID.get('local-workshop')!;
    const s2 = registerConference(s, def);
    expect(s2.conferences).toHaveLength(1);
    expect(s2.conferences[0].stage).toBe('registered');
  });

  it('resolves when day reaches startsOnDay', () => {
    let s = createInitialState({ seed: 1 });
    const def = CONFERENCE_BY_ID.get('local-workshop')!;
    s = registerConference(s, def);
    const reg = s.conferences[0];
    s = { ...s, day: reg.startsOnDay };
    const before = s.resources.reputation;
    s = resolveDueConferences(s);
    expect(s.conferences[0].stage).toBe('completed');
    expect(s.resources.reputation).toBeGreaterThan(before);
  });
});
