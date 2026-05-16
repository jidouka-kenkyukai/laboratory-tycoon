import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import {
  canStartCollaboration,
  startCollaboration,
  tickCollaborations,
  resolveDueCollaborations,
} from '../../src/domain/actions/collaborations';
import { COLLABORATOR_BY_ID } from '../../src/domain/data/collaborators';

describe('collaborations', () => {
  it('cannot start without enough reputation', () => {
    const s = createInitialState({ seed: 1 });
    const mit = COLLABORATOR_BY_ID.get('mit-johnson')!;
    expect(canStartCollaboration(s, mit).ok).toBe(false);
  });

  it('starts active collaboration when eligible', () => {
    let s = createInitialState({ seed: 1 });
    s = { ...s, resources: { ...s.resources, reputation: 80 } };
    const def = COLLABORATOR_BY_ID.get('mit-johnson')!;
    s = startCollaboration(s, def);
    expect(s.collaborations.length).toBe(1);
    expect(s.collaborations[0].stage).toBe('active');
  });

  it('tickCollaborations adds data and RP', () => {
    let s = createInitialState({ seed: 1 });
    s = { ...s, resources: { ...s.resources, reputation: 80 } };
    const def = COLLABORATOR_BY_ID.get('mit-johnson')!;
    s = startCollaboration(s, def);
    const beforeRP = s.resources.researchPoints;
    const beforeData = s.projects[0].dataPoints.length;
    const s2 = tickCollaborations(s);
    expect(s2.resources.researchPoints).toBeGreaterThan(beforeRP);
    expect(s2.projects[0].dataPoints.length).toBeGreaterThan(beforeData);
  });

  it('resolves at end of period with reputation bonus', () => {
    let s = createInitialState({ seed: 1 });
    s = { ...s, resources: { ...s.resources, reputation: 80 } };
    const def = COLLABORATOR_BY_ID.get('mit-johnson')!;
    s = startCollaboration(s, def);
    const c = s.collaborations[0];
    s = { ...s, day: c.endsOnDay };
    const before = s.resources.reputation;
    s = resolveDueCollaborations(s);
    expect(s.collaborations[0].stage).toBe('completed');
    expect(s.resources.reputation).toBeGreaterThan(before);
  });
});
