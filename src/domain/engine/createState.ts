import type { GameState } from '../types';
import { createInitialSkills } from '../rules/skills';

// セーブデータ構造を拡張したので bump
export const SAVE_VERSION = 5;

export function createInitialState(opts?: { name?: string; seed?: number }): GameState {
  const name = opts?.name ?? '名もなき院生';
  const seed = opts?.seed ?? Math.floor(Math.random() * 0x7fffffff);

  return {
    version: SAVE_VERSION,
    day: 1,
    scene: 'lab',
    player: {
      name,
      tier: 'graduate',
      skills: createInitialSkills(),
    },
    daily: {
      timeSlots: 3,
      maxTimeSlots: 3,
      focus: 100,
      mental: 80,
    },
    resources: {
      funds: 500,
      researchPoints: 0,
      reputation: 0,
      publications: 0,
      hIndex: 0,
    },
    lab: {
      equipments: [],
      spaceCapacity: 6,
    },
    projects: [
      {
        id: 'proj-starter',
        name: '修論の予備実験プロジェクト',
        tags: ['wet', 'basic'],
        stage: 'preliminary',
        progress: 0,
        startedOnDay: 1,
        dataPoints: [],
      },
    ],
    papers: [],
    grants: [],
    students: [],
    conferences: [],
    sops: [],
    collaborations: [],
    grantsAwardedCount: 0,
    log: [
      {
        id: 'init',
        day: 1,
        kind: 'info',
        text: `${name} のラボ生活が始まった。今日もまた、ピペットを握る一日になりそうだ。`,
      },
    ],
    narration:
      'あなたは大学院に所属する駆け出しの研究者だ。指導教員の期待と、自分の研究の手応えのなさに挟まれながら、今日も一日が始まる。',
    rngSeed: seed,
  };
}
