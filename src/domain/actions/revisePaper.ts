import type { GameState, Paper } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';

const REVISE_TIME = 1;
const REVISE_FOCUS = 16;
const REVISE_MENTAL = 8;

/** Major/Minor Revision の応答ターン。執筆スキルで品質が上がる。 */
export function reviseResponse(state: GameState, paper: Paper): GameState {
  if (paper.stage !== 'majorRevision' && paper.stage !== 'minorRevision') return state;
  const writing = state.player.skills.writing.level;
  const isMajor = paper.stage === 'majorRevision';
  const qualityDelta = isMajor ? 6 + writing * 1.0 : 3 + writing * 0.7;

  let next: GameState = state;
  next = applyEffects(next, [
    { kind: 'timeSlot', amount: -REVISE_TIME },
    { kind: 'focus', amount: -REVISE_FOCUS },
    { kind: 'mental', amount: -REVISE_MENTAL },
    { kind: 'skillXp', skill: 'writing', amount: 10 },
  ]);
  next = {
    ...next,
    papers: next.papers.map((p) =>
      p.id === paper.id
        ? { ...p, qualityScore: Math.min(100, p.qualityScore + qualityDelta) }
        : p,
    ),
  };
  next = pushLog(next, {
    kind: 'info',
    text: `[Revision] 「${paper.title}」の査読コメントに対応 (+${qualityDelta.toFixed(1)} 品質)`,
  });
  next = setNarration(
    next,
    isMajor
      ? `査読者コメントを1件1件潰していく。"This is unclear" にもう30回出会った気がする。`
      : `Minor Revision。文章の整え直しが中心。エンドが見えていると、執筆の足取りも軽い。`,
  );
  return next;
}

/** Revision完了後、再投稿する */
export function resubmitPaper(state: GameState, paper: Paper): GameState {
  if (paper.stage !== 'majorRevision' && paper.stage !== 'minorRevision') return state;
  let next: GameState = state;
  next = applyEffects(next, [{ kind: 'timeSlot', amount: -1 }]);
  next = {
    ...next,
    papers: next.papers.map((p) =>
      p.id === paper.id ? { ...p, stage: 'submitted', daysInStage: 0 } : p,
    ),
  };
  next = pushLog(next, { kind: 'info', text: `[再投稿] 「${paper.title}」を再投稿した` });
  next = setNarration(next, `Revision letterを書き上げ、再投稿。今度はどう返ってくるだろうか。`);
  return next;
}
