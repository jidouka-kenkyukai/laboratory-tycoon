import { produce } from 'immer';
import type { Effect, GameState, ExperimentDataPoint, LogEntry } from '../types';
import { addSkillXp } from '../rules/skills';

/** クランプ */
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function applyEffects(state: GameState, effects: Effect[]): GameState {
  return produce(state, (draft) => {
    for (const e of effects) {
      applyOne(draft, e);
    }
  });
}

function applyOne(draft: GameState, e: Effect): void {
  switch (e.kind) {
    case 'rp':
      draft.resources.researchPoints = Math.max(0, draft.resources.researchPoints + e.amount);
      return;
    case 'funds':
      draft.resources.funds = Math.max(0, draft.resources.funds + e.amount);
      return;
    case 'reputation':
      draft.resources.reputation = Math.max(0, draft.resources.reputation + e.amount);
      return;
    case 'mental':
      draft.daily.mental = clamp(draft.daily.mental + e.amount, 0, 100);
      return;
    case 'focus':
      draft.daily.focus = clamp(draft.daily.focus + e.amount, 0, 100);
      return;
    case 'timeSlot':
      draft.daily.timeSlots = Math.max(0, draft.daily.timeSlots + e.amount);
      return;
    case 'skillXp':
      draft.player.skills = addSkillXp(draft.player.skills, e.skill, e.amount);
      return;
    case 'progressProject': {
      const p = draft.projects.find((p) => p.id === e.projectId);
      if (p) p.progress = clamp(p.progress + e.amount, 0, 100);
      return;
    }
    case 'addExperimentData': {
      const target =
        (e.projectId && draft.projects.find((p) => p.id === e.projectId)) ||
        draft.projects[0];
      if (!target) return;
      const dp: ExperimentDataPoint = {
        id: `dp-${draft.day}-${draft.projects.length}-${target.dataPoints.length}`,
        projectId: target.id,
        protocolId: 'unknown',
        day: draft.day,
        quality: clamp(e.quality, 0, 100),
        reproducibility: clamp(e.reproducibility, 0, 100),
        success: true,
      };
      target.dataPoints.push(dp);
      // データが溜まるとプロジェクトも進む
      target.progress = clamp(target.progress + 4, 0, 100);
      return;
    }
  }
}

export function pushLog(state: GameState, entry: Omit<LogEntry, 'id' | 'day'>): GameState {
  return produce(state, (draft) => {
    draft.log.unshift({
      id: `log-${draft.day}-${draft.log.length}`,
      day: draft.day,
      ...entry,
    });
    if (draft.log.length > 200) draft.log.length = 200;
  });
}

export function setNarration(state: GameState, text: string): GameState {
  return produce(state, (draft) => {
    draft.narration = text;
  });
}
