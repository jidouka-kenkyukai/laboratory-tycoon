import type { GameState, GrantDef, GrantApplication } from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';
import { createRng } from '../rng';
import { GRANT_BY_ID } from '../data/grants';

const GRANT_WRITE_TIME = 1;
const GRANT_WRITE_FOCUS = 14;
const GRANT_WRITE_MENTAL = 6;

export function canApplyGrant(state: GameState, def: GrantDef): { ok: boolean; reason?: string } {
  if (state.resources.reputation < def.minReputation) {
    return { ok: false, reason: `評判 ${def.minReputation} 必要` };
  }
  if (state.resources.publications < def.minPublications) {
    return { ok: false, reason: `論文 ${def.minPublications}本 必要` };
  }
  // 既に同じ defId で作業中ならNG
  if (state.grants.some((g) => g.defId === def.id && (g.stage === 'drafting' || g.stage === 'submitted'))) {
    return { ok: false, reason: '既に申請中' };
  }
  return { ok: true };
}

export function startGrantApplication(state: GameState, def: GrantDef): GameState {
  const check = canApplyGrant(state, def);
  if (!check.ok) return state;
  const app: GrantApplication = {
    id: `grant-${def.id}-${state.day}`,
    defId: def.id,
    stage: 'drafting',
    writingProgress: 0,
    startedOnDay: state.day,
    daysInStage: 0,
  };
  let next: GameState = { ...state, grants: [...state.grants, app] };
  next = pushLog(next, { kind: 'info', text: `[グラント] 「${def.name}」の申請書執筆を開始` });
  next = setNarration(
    next,
    `${def.name} の申請書テンプレートを開く。研究の意義を、これから1ヶ月で説明し尽くす。`,
  );
  return next;
}

/** 1ターン分執筆を進める */
export function progressGrantWriting(state: GameState, app: GrantApplication): GameState {
  if (app.stage !== 'drafting') return state;
  if (state.daily.timeSlots < GRANT_WRITE_TIME) return state;

  const writing = state.player.skills.writing.level;
  const admin = state.player.skills.admin.level;
  const progressDelta = 8 + writing * 1.5 + admin * 0.5;

  let next = applyEffects(state, [
    { kind: 'timeSlot', amount: -GRANT_WRITE_TIME },
    { kind: 'focus', amount: -GRANT_WRITE_FOCUS },
    { kind: 'mental', amount: -GRANT_WRITE_MENTAL },
    { kind: 'skillXp', skill: 'writing', amount: 8 },
    { kind: 'skillXp', skill: 'admin', amount: 5 },
  ]);

  next = {
    ...next,
    grants: next.grants.map((g) =>
      g.id === app.id ? { ...g, writingProgress: g.writingProgress + progressDelta } : g,
    ),
  };
  const def = GRANT_BY_ID.get(app.defId);
  next = pushLog(next, {
    kind: 'info',
    text: `[グラント執筆] ${def?.name ?? '?'} +${progressDelta.toFixed(0)} (${Math.round(
      Math.min(100, ((app.writingProgress + progressDelta) / (def?.writingRequired ?? 1)) * 100),
    )}%)`,
  });
  return next;
}

/** 完成した申請書を投稿 */
export function submitGrant(state: GameState, app: GrantApplication): GameState {
  const def = GRANT_BY_ID.get(app.defId);
  if (!def) return state;
  if (app.writingProgress < def.writingRequired) return state;
  if (state.daily.timeSlots < 1) return state;

  let next = applyEffects(state, [{ kind: 'timeSlot', amount: -1 }]);
  next = {
    ...next,
    grants: next.grants.map((g) =>
      g.id === app.id ? { ...g, stage: 'submitted', daysInStage: 0 } : g,
    ),
  };
  next = pushLog(next, { kind: 'info', text: `[グラント投稿] ${def.name} を提出した` });
  next = setNarration(next, `提出ボタンを押す。あとは1ヶ月、結果を待つだけ。`);
  return next;
}

/** 投稿後一定日経過したら採否を解決 */
export function resolveGrant(state: GameState, app: GrantApplication): GameState {
  const def = GRANT_BY_ID.get(app.defId);
  if (!def) return state;
  // 評判と論文数で補正
  const repBonus = Math.min(0.3, state.resources.reputation / 400);
  const pubBonus = Math.min(0.2, state.resources.publications / 30);
  const acceptanceRate = def.baseAcceptanceRate + repBonus + pubBonus;
  const rng = createRng(state.rngSeed + app.daysInStage);
  const roll = rng();
  const nextSeed = Math.floor(rng() * 0xffffffff);
  let next: GameState = { ...state, rngSeed: nextSeed };

  if (roll < acceptanceRate) {
    next = {
      ...next,
      grants: next.grants.map((g) => (g.id === app.id ? { ...g, stage: 'awarded', daysInStage: 0 } : g)),
      resources: {
        ...next.resources,
        funds: next.resources.funds + def.award,
        reputation: next.resources.reputation + Math.floor(def.award / 200),
      },
    };
    next = pushLog(next, { kind: 'good', text: `[採択!] ${def.name} (+$${def.award.toLocaleString()})` });
    next = setNarration(
      next,
      `メールに「採択」の文字。一瞬、立ち上がってガッツポーズをし、誰も見ていないのを確認して座り直す。`,
    );
  } else {
    next = {
      ...next,
      grants: next.grants.map((g) => (g.id === app.id ? { ...g, stage: 'declined', daysInStage: 0 } : g)),
    };
    next = pushLog(next, { kind: 'bad', text: `[不採択] ${def.name}` });
    next = setNarration(
      next,
      `「貴重なご応募をいただきましたが…」 通知メールの定型句を5回読んで、ようやく現実が呑み込めた。`,
    );
  }
  return next;
}
