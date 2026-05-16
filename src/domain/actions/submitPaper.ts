import type { GameState, Paper, JournalDef } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';
import { createRng } from '../rng';
import { JOURNAL_BY_ID } from '../data/journals';

const SUBMIT_TIME = 1;
const SUBMIT_FOCUS = 8;

export function submitPaper(state: GameState, paper: Paper, journal: JournalDef): GameState {
  let next: GameState = state;
  next = applyEffects(next, [
    { kind: 'timeSlot', amount: -SUBMIT_TIME },
    { kind: 'focus', amount: -SUBMIT_FOCUS },
  ]);
  next = {
    ...next,
    papers: next.papers.map((p) =>
      p.id === paper.id ? { ...p, stage: 'submitted', journalId: journal.id, daysInStage: 0 } : p,
    ),
  };
  next = pushLog(next, {
    kind: 'info',
    text: `[投稿] 「${paper.title}」を ${journal.name} に投稿`,
  });
  next = setNarration(
    next,
    `投稿ボタンを押す。指が震える。査読者が3週間後に何を言うか分からない。`,
  );
  return next;
}

/** 査読結果を解決する: 投稿後に一定日経過したら結果決定 */
export function resolveReview(state: GameState, paper: Paper): GameState {
  if (!paper.journalId) return state;
  const journal = JOURNAL_BY_ID.get(paper.journalId);
  if (!journal) return state;

  // 品質ベースの採択補正
  const acceptanceRate =
    journal.acceptanceRateBase * (0.4 + (paper.qualityScore / 100) * 1.2);

  const rng = createRng(state.rngSeed + paper.daysInStage);
  const roll = rng();
  const nextSeed = Math.floor(rng() * 0xffffffff);

  let next: GameState = { ...state, rngSeed: nextSeed };

  if (roll < acceptanceRate) {
    next = {
      ...next,
      papers: next.papers.map((p) =>
        p.id === paper.id ? { ...p, stage: 'accepted', daysInStage: 0 } : p,
      ),
      resources: {
        ...next.resources,
        publications: next.resources.publications + 1,
        hIndex: next.resources.hIndex + (journal.impactFactor >= 10 ? 2 : 1),
        reputation: next.resources.reputation + journal.reputationGain,
        researchPoints: next.resources.researchPoints + journal.rpGain,
      },
    };
    next = pushLog(next, {
      kind: 'good',
      text: `[論文受理!] 「${paper.title}」が ${journal.name} に受理された`,
    });
    next = setNarration(
      next,
      `メールを開く。「Accepted」の文字。声を上げそうになり、誰もいない居室で小さくガッツポーズした。`,
    );
  } else if (roll < acceptanceRate + 0.4) {
    next = {
      ...next,
      papers: next.papers.map((p) =>
        p.id === paper.id ? { ...p, stage: 'majorRevision', daysInStage: 0 } : p,
      ),
    };
    next = pushLog(next, {
      kind: 'warn',
      text: `[査読返答] Major Revision: 追加実験と書き直しが必要`,
    });
    next = setNarration(next, `査読者#2 のコメントが30件。落ち込む暇もなく、対応に取り掛かる。`);
  } else {
    next = {
      ...next,
      papers: next.papers.map((p) =>
        p.id === paper.id ? { ...p, stage: 'rejected', daysInStage: 0 } : p,
      ),
    };
    next = pushLog(next, {
      kind: 'bad',
      text: `[Reject] 「${paper.title}」がリジェクトされた`,
    });
    next = setNarration(
      next,
      `「The reviewers were not convinced by the novelty...」 何度読んでも、最初の一文で胃が痛い。`,
    );
  }
  return next;
}
