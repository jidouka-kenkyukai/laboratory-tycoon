import type {
  GameState,
  ConferenceDef,
  ConferenceRegistration,
  ConferenceTalkKind,
  Project,
} from '../types';
import { applyEffects, pushLog, setNarration } from '../engine/effects';
import { CONFERENCE_BY_ID } from '../data/conferences';

const REGISTER_TIME = 1;
const REGISTER_FOCUS = 6;
/** 申込から会期開始までの日数 (準備期間) */
const DAYS_UNTIL_START = 14;

export function canRegisterConference(
  state: GameState,
  def: ConferenceDef,
): { ok: boolean; reason?: string } {
  if (state.daily.timeSlots < REGISTER_TIME) return { ok: false, reason: '時間が足りない' };
  if (state.resources.funds < def.cost) return { ok: false, reason: '参加費が足りない' };
  if (def.requiresEnglish && state.player.skills.english.level < def.requiresEnglish) {
    return { ok: false, reason: `英語Lv${def.requiresEnglish}必要` };
  }
  if (state.conferences.some((c) => c.defId === def.id && c.stage !== 'completed' && c.stage !== 'rejected')) {
    return { ok: false, reason: '既に申込済' };
  }
  return { ok: true };
}

export function registerConference(
  state: GameState,
  def: ConferenceDef,
  talkKind: ConferenceTalkKind = 'poster',
  project?: Project,
): GameState {
  const check = canRegisterConference(state, def);
  if (!check.ok) return state;
  let next = applyEffects(state, [
    { kind: 'timeSlot', amount: -REGISTER_TIME },
    { kind: 'focus', amount: -REGISTER_FOCUS },
    { kind: 'funds', amount: -def.cost },
  ]);
  const reg: ConferenceRegistration = {
    id: `conf-${def.id}-${state.day}`,
    defId: def.id,
    talkKind,
    stage: 'registered',
    registeredOnDay: state.day,
    startsOnDay: state.day + DAYS_UNTIL_START,
    projectId: project?.id,
  };
  next = { ...next, conferences: [...next.conferences, reg] };
  next = pushLog(next, { kind: 'info', text: `[学会] ${def.name} に ${talkKind} で申込` });
  next = setNarration(
    next,
    `${def.name} に申し込んだ。発表まであと${DAYS_UNTIL_START}日。スライドはまだ1枚も作っていない。`,
  );
  return next;
}

/** 会期到来した学会を解決する (advanceTurn 内で呼ばれる) */
export function resolveDueConferences(state: GameState): GameState {
  let next = state;
  for (const reg of state.conferences) {
    if (reg.stage !== 'registered') continue;
    if (next.day < reg.startsOnDay) continue;
    const def = CONFERENCE_BY_ID.get(reg.defId);
    if (!def) continue;
    next = attendConference(next, reg, def);
  }
  return next;
}

function attendConference(state: GameState, reg: ConferenceRegistration, def: ConferenceDef): GameState {
  // 種別補正
  const talkBonus = reg.talkKind === 'invited' ? 2.0 : reg.talkKind === 'oral' ? 1.4 : 1.0;
  const presLevel = state.player.skills.presentation.level;
  const engLevel = state.player.skills.english.level;
  const presBonus = 1 + (presLevel - 1) * 0.05;
  const englishPenalty =
    def.scale === 'international' && engLevel < (def.requiresEnglish ?? 0)
      ? 0.6
      : 1.0;

  const repGain = Math.round(def.baseReputation * talkBonus * presBonus * englishPenalty);
  const rpGain = Math.round(def.rpGain * talkBonus * presBonus * englishPenalty);

  let next = applyEffects(state, [
    { kind: 'reputation', amount: repGain },
    { kind: 'rp', amount: rpGain },
    { kind: 'mental', amount: -6 }, // 出張は疲れる
    { kind: 'skillXp', skill: 'presentation', amount: 15 + (def.scale === 'international' ? 10 : 0) },
    { kind: 'skillXp', skill: 'english', amount: def.scale === 'international' ? 15 : 2 },
  ]);
  next = {
    ...next,
    conferences: next.conferences.map((c) =>
      c.id === reg.id ? { ...c, stage: 'completed' } : c,
    ),
  };
  next = pushLog(next, {
    kind: 'good',
    text: `[学会参加] ${def.name} 完了 (評判 +${repGain} / RP +${rpGain})`,
  });
  next = setNarration(
    next,
    `${def.name} から帰ってきた。名刺の束と、いくつかの「またディスカッションしましょう」のメッセージ。`,
  );
  return next;
}
