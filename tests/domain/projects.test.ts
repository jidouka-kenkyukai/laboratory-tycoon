import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../src/domain/engine/createState';
import { startNewProject, autoProgressProjects } from '../../src/domain/actions/projects';
import { PROTOCOL_BY_ID } from '../../src/domain/data/protocols';

describe('projects', () => {
  it('starts new project and decrements time', () => {
    const s0 = createInitialState({ seed: 1 });
    const s1 = startNewProject(s0);
    expect(s1.projects.length).toBe(s0.projects.length + 1);
    expect(s1.daily.timeSlots).toBe(s0.daily.timeSlots - 1);
  });

  it('autoProgress advances stage when data accumulates', () => {
    // 強制的にデータ充填してから autoProgress
    let s = createInitialState({ seed: 1 });
    const pcr = PROTOCOL_BY_ID.get('pcr')!;
    // 大量にデータを入れるため、確率に頼らず直接progress→runExperiment成功状態を作るのは難しい。
    // よって直接dataPointsを充填する。
    s = {
      ...s,
      projects: s.projects.map((p, i) =>
        i === 0
          ? {
              ...p,
              dataPoints: Array.from({ length: 4 }).map((_, idx) => ({
                id: `dp-${idx}`,
                protocolId: pcr.id,
                day: 1,
                quality: 60,
                reproducibility: 70,
                success: true,
              })),
            }
          : p,
      ),
    };
    const s2 = autoProgressProjects(s);
    expect(['main', 'analysis', 'writing']).toContain(s2.projects[0].stage);
  });
});
