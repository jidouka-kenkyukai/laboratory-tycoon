import type { GameState, CollaboratorDef, Collaboration, ExperimentDataPoint } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';
import { COLLABORATOR_BY_ID } from '../data/collaborators';

export function canStartCollaboration(
  state: GameState,
  def: CollaboratorDef,
): { ok: boolean; reason?: string } {
  if (state.resources.reputation < def.minReputation) {
    return { ok: false, reason: `評判 ${def.minReputation} 必要` };
  }
  if (state.collaborations.some((c) => c.defId === def.id && c.stage === 'active')) {
    return { ok: false, reason: '既に共同研究中' };
  }
  if (state.daily.timeSlots < 1) return { ok: false, reason: '時間が足りない' };
  return { ok: true };
}

export function startCollaboration(state: GameState, def: CollaboratorDef): GameState {
  const check = canStartCollaboration(state, def);
  if (!check.ok) return state;
  // 関連プロジェクト: タグが合う最初のもの、なければ最初のプロジェクト
  const proj =
    state.projects.find((p) => def.specialties.some((s) => p.tags.includes(s))) ||
    state.projects[0];
  const collab: Collaboration = {
    id: `collab-${def.id}-${state.day}`,
    defId: def.id,
    stage: 'active',
    startedOnDay: state.day,
    endsOnDay: state.day + def.defaultDurationDays,
    projectId: proj?.id,
  };
  let next = applyEffects(state, [
    { kind: 'timeSlot', amount: -1 },
    { kind: 'focus', amount: -8 },
  ]);
  next = { ...next, collaborations: [...next.collaborations, collab] };
  next = pushLog(next, {
    kind: 'good',
    text: `[共同研究] ${def.name} と共同研究を開始 (${def.defaultDurationDays}日間)`,
  });
  next = setNarration(
    next,
    `${def.name} とZoomで「これからよろしくお願いします」。机に新しいプロジェクトの稟議書が増えた。`,
  );
  return next;
}

/** 毎ターン: 進行中の共同研究から貢献を受ける */
export function tickCollaborations(state: GameState): GameState {
  if (state.collaborations.length === 0) return state;
  let next = state;
  for (const c of state.collaborations) {
    if (c.stage !== 'active') continue;
    const def = COLLABORATOR_BY_ID.get(c.defId);
    if (!def) continue;
    const target = c.projectId
      ? next.projects.find((p) => p.id === c.projectId)
      : next.projects[0];

    if (def.contributionPerTurn.rp) {
      next = applyEffects(next, [{ kind: 'rp', amount: def.contributionPerTurn.rp }]);
    }
    if (def.contributionPerTurn.dataQuality && target) {
      const dp: ExperimentDataPoint = {
        id: `dp-collab-${next.day}-${c.id}-${target.dataPoints.length}`,
        projectId: target.id,
        protocolId: 'collab-contribution',
        day: next.day,
        quality: def.contributionPerTurn.dataQuality,
        reproducibility: 70,
        success: true,
      };
      next = {
        ...next,
        projects: next.projects.map((p) =>
          p.id === target.id
            ? {
                ...p,
                dataPoints: [...p.dataPoints, dp],
                progress: Math.min(100, p.progress + 2),
              }
            : p,
        ),
      };
    }
  }
  return next;
}

/** 期間満了の共同研究を完了処理 (advanceTurnから) */
export function resolveDueCollaborations(state: GameState): GameState {
  let next = state;
  for (const c of state.collaborations) {
    if (c.stage !== 'active') continue;
    if (next.day < c.endsOnDay) continue;
    const def = COLLABORATOR_BY_ID.get(c.defId);
    if (!def) continue;
    const effects: Parameters<typeof applyEffects>[1] = [];
    if (def.completionBonus.reputation) effects.push({ kind: 'reputation', amount: def.completionBonus.reputation });
    if (def.completionBonus.funds) effects.push({ kind: 'funds', amount: def.completionBonus.funds });
    next = applyEffects(next, effects);

    // 共著論文の品質ブースト: 関連プロジェクトのdrafting/writing論文があれば品質+
    if (def.completionBonus.coAuthoredPaperQuality && c.projectId) {
      next = {
        ...next,
        papers: next.papers.map((p) =>
          p.projectId === c.projectId &&
          (p.stage === 'drafting' || p.stage === 'majorRevision' || p.stage === 'minorRevision')
            ? {
                ...p,
                qualityScore: Math.min(100, p.qualityScore + (def.completionBonus.coAuthoredPaperQuality ?? 0)),
              }
            : p,
        ),
      };
    }

    next = {
      ...next,
      collaborations: next.collaborations.map((x) =>
        x.id === c.id ? { ...x, stage: 'completed' } : x,
      ),
    };
    next = pushLog(next, {
      kind: 'good',
      text: `[共同研究完了] ${def.name} (評判 +${def.completionBonus.reputation ?? 0})`,
    });
  }
  return next;
}

/** 月初に呼ばれる、共同研究の維持費 */
export function monthlyCollaborationCost(state: GameState): { state: GameState; cost: number } {
  let cost = 0;
  for (const c of state.collaborations) {
    if (c.stage !== 'active') continue;
    const def = COLLABORATOR_BY_ID.get(c.defId);
    if (def?.contributionPerTurn.monthlyCost) cost += def.contributionPerTurn.monthlyCost;
  }
  if (cost === 0) return { state, cost: 0 };
  const next: GameState = {
    ...state,
    resources: { ...state.resources, funds: Math.max(0, state.resources.funds - cost) },
  };
  return { state: next, cost };
}
