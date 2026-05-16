import { produce } from 'immer';
import type { GameState } from '../types';
import { pushLog, setNarration } from './effects';
import { resolveReview } from '../actions/submitPaper';
import { resolveGrant } from '../actions/grants';
import { studentsAutoWork } from '../actions/students';
import { autoProgressProjects } from '../actions/projects';
import { maybeFireRandomEvent } from '../actions/events';
import { runActiveSOPs } from '../actions/sops';
import { resolveDueConferences } from '../actions/conferences';
import { dailyEquipmentDecay } from '../actions/repair';
import {
  tickCollaborations,
  resolveDueCollaborations,
  monthlyCollaborationCost,
} from '../actions/collaborations';

/** 1日進める。リソース更新、自動進捗、学生・SOPの働き、学会会期、イベント抽選。 */
export function advanceTurn(state: GameState): GameState {
  // 1) 当日終わり: 学生・SOP の自動作業
  let next = runActiveSOPs(state);
  next = studentsAutoWork(next);

  // 2) 翌日に
  next = produce(next, (draft) => {
    draft.day += 1;
    draft.daily.timeSlots = draft.daily.maxTimeSlots;
    draft.daily.focus = Math.min(100, draft.daily.focus + 60);
    draft.daily.mental = Math.min(100, draft.daily.mental + 8);
    draft.papers.forEach((p) => {
      if (
        p.stage === 'submitted' ||
        p.stage === 'underReview' ||
        p.stage === 'majorRevision' ||
        p.stage === 'minorRevision'
      ) {
        p.daysInStage += 1;
      }
    });
    draft.grants.forEach((g) => {
      if (g.stage === 'submitted' || g.stage === 'drafting') {
        g.daysInStage += 1;
      }
    });
    draft.students.forEach((s) => {
      s.motivation = clampRange(s.motivation + (s.motivation < 50 ? -1 : 0), 0, 100);
      s.mental = clampRange(s.mental + (s.mental < 60 ? -1 : 1), 0, 100);
    });
  });

  // 3) 査読決着
  const papersToResolve = next.papers.filter((p) => p.stage === 'submitted' && p.daysInStage >= 21);
  for (const p of papersToResolve) next = resolveReview(next, p);

  // 4) グラント決着 (+ 採択カウンタ更新)
  const grantsToResolve = next.grants.filter((g) => g.stage === 'submitted' && g.daysInStage >= 28);
  for (const g of grantsToResolve) {
    const before = next.grants.find((x) => x.id === g.id);
    next = resolveGrant(next, g);
    const after = next.grants.find((x) => x.id === g.id);
    if (before && after && before.stage !== 'awarded' && after.stage === 'awarded') {
      next = { ...next, grantsAwardedCount: next.grantsAwardedCount + 1 };
    }
  }

  // 5) プロジェクトの自動進行 + 機器自然劣化 + 共同研究の貢献
  next = autoProgressProjects(next);
  next = dailyEquipmentDecay(next);
  next = tickCollaborations(next);

  // 6) 学会の会期到来 + 共同研究の満了
  next = resolveDueConferences(next);
  next = resolveDueCollaborations(next);

  // 7) 月初に維持費 + 給料 + 共同研究費
  if (next.day % 30 === 1 && next.day > 1) {
    let upkeep = 0;
    for (const _inst of next.lab.equipments) upkeep += 20;
    let salary = 0;
    for (const s of next.students) salary += s.salary;
    const collabResult = monthlyCollaborationCost(next);
    next = collabResult.state;
    const total = upkeep + salary + collabResult.cost;
    if (total > 0) {
      next = {
        ...next,
        resources: { ...next.resources, funds: Math.max(0, next.resources.funds - upkeep - salary) },
      };
      next = pushLog(next, {
        kind: 'warn',
        text: `[月次] 機器維持$${upkeep} + 人件費$${salary} + 共同研究費$${collabResult.cost} = $${total}`,
      });
    }
  }

  // 8) ランダムイベント抽選
  next = maybeFireRandomEvent(next);

  if (!next.pendingEvent) {
    next = setNarration(
      next,
      `Day ${next.day}。今日も研究室の扉を開ける。机の上の書類はまた一段、積まれていた。`,
    );
  }
  next = pushLog(next, { kind: 'info', text: `--- Day ${next.day} 開始 ---` });

  return next;
}

function clampRange(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
