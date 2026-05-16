import type { GameState, Project, ProjectStage } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';

const PROJECT_NAMES = [
  '新規プローブ法の確立',
  'クロマチン制御の機構解析',
  '深層モデルによる構造予測',
  '非平衡系の数値シミュレーション',
  '高速分子イメージング',
  'シーケンス特徴量の自動抽出',
  '触媒設計の最適化',
];

/** 新規プロジェクトを立ち上げる。アイデア+少しの時間を消費。 */
export function startNewProject(state: GameState, name?: string, tags: string[] = []): GameState {
  if (state.daily.timeSlots < 1) return state;
  const idx = state.projects.length;
  const projectName = name ?? PROJECT_NAMES[idx % PROJECT_NAMES.length];
  const newProj: Project = {
    id: `proj-${state.day}-${idx}`,
    name: projectName,
    tags: tags.length > 0 ? tags : ['basic'],
    stage: 'planning',
    progress: 0,
    startedOnDay: state.day,
    dataPoints: [],
  };

  let next = applyEffects(state, [
    { kind: 'timeSlot', amount: -1 },
    { kind: 'focus', amount: -8 },
  ]);
  next = { ...next, projects: [...next.projects, newProj] };
  next = pushLog(next, { kind: 'good', text: `[新規プロジェクト] 「${projectName}」を立ち上げた` });
  next = setNarration(
    next,
    `ノートに新しいプロジェクト名を書く。先のことは見えないが、白紙のページにわくわくする。`,
  );
  return next;
}

/** データ蓄積に応じてプロジェクトのステージを自動進行 */
export function autoProgressProjects(state: GameState): GameState {
  const updatedProjects = state.projects.map((p): Project => {
    const stage = nextStageFor(p);
    if (stage === p.stage) return p;
    return { ...p, stage };
  });
  return { ...state, projects: updatedProjects };
}

function nextStageFor(p: Project): ProjectStage {
  const dataCount = p.dataPoints.length;
  const avgQuality =
    dataCount > 0 ? p.dataPoints.reduce((s, d) => s + d.quality, 0) / dataCount : 0;

  if (p.stage === 'planning' && dataCount >= 1) return 'preliminary';
  if (p.stage === 'preliminary' && dataCount >= 3) return 'main';
  if (p.stage === 'main' && dataCount >= 6 && avgQuality >= 50) return 'analysis';
  if (p.stage === 'analysis' && dataCount >= 8) return 'writing';
  return p.stage;
}
