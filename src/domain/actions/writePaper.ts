import type { GameState, Project, Paper } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';

const PAPER_TIME_COST = 1;
const PAPER_FOCUS_COST = 18;
const PAPER_MENTAL_COST = 6;

/** プロジェクトに対して論文ドラフトを書き進める。1ターン分の執筆。 */
export function writePaperDraft(state: GameState, project: Project): GameState {
  const writingLevel = state.player.skills.writing.level;
  // データ品質平均
  const avgQuality =
    project.dataPoints.length > 0
      ? project.dataPoints.reduce((s, d) => s + d.quality, 0) / project.dataPoints.length
      : 30;

  // 1ターンの品質寄与
  const qualityDelta = Math.min(
    25,
    Math.max(2, avgQuality * 0.15 + writingLevel * 1.2),
  );

  let next: GameState = state;
  next = applyEffects(next, [
    { kind: 'timeSlot', amount: -PAPER_TIME_COST },
    { kind: 'focus', amount: -PAPER_FOCUS_COST },
    { kind: 'mental', amount: -PAPER_MENTAL_COST },
    { kind: 'skillXp', skill: 'writing', amount: 14 },
  ]);

  // Paper を作る or 既存を更新
  const existing = next.papers.find((p) => p.projectId === project.id && p.stage === 'drafting');
  if (existing) {
    next = {
      ...next,
      papers: next.papers.map((p) =>
        p.id === existing.id
          ? { ...p, qualityScore: Math.min(100, p.qualityScore + qualityDelta) }
          : p,
      ),
    };
  } else {
    const paper: Paper = {
      id: `paper-${project.id}-${next.day}`,
      title: `${project.name} に関する研究`,
      projectId: project.id,
      stage: 'drafting',
      qualityScore: Math.min(100, qualityDelta + 5),
      daysInStage: 0,
    };
    next = { ...next, papers: [...next.papers, paper] };
  }

  next = pushLog(next, {
    kind: 'info',
    text: `[執筆] ${project.name} の論文ドラフトを書き進めた (+${qualityDelta.toFixed(1)} 品質)`,
  });
  next = setNarration(
    next,
    `静かな夜のオフィスで、論文の Introduction を何度も書き直す。執筆は「考えるための手作業」だ。`,
  );
  return next;
}
