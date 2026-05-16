import type {
  GameState,
  Student,
  ExperimentDataPoint,
} from '../types';
import type { StudentTemplate } from '../data/students';
import { applyEffects, pushLog, setNarration } from '../engine/effects';
import { PROTOCOLS } from '../data/protocols';
import { EQUIPMENT_BY_ID } from '../data/equipments';
import { createRng, rngChance } from '../rng';

const HIRE_TIME = 1;
const HIRE_BONUS_COST = 200; // 初期出費 (机/PC/手続き)

export function hireStudent(state: GameState, tpl: StudentTemplate): GameState {
  if (state.daily.timeSlots < HIRE_TIME) return state;
  if (state.resources.funds < HIRE_BONUS_COST) {
    return setNarration(state, 'セットアップに必要な資金が無い。');
  }
  const idx = state.students.length;
  const student: Student = {
    ...tpl,
    id: `stu-${state.day}-${idx}`,
    joinedOnDay: state.day,
  };
  let next = applyEffects(state, [
    { kind: 'timeSlot', amount: -HIRE_TIME },
    { kind: 'funds', amount: -HIRE_BONUS_COST },
  ]);
  next = { ...next, students: [...next.students, student] };
  next = pushLog(next, { kind: 'good', text: `[採用] ${student.name} がラボに加わった` });
  next = setNarration(
    next,
    `${student.name} と席を用意する。「よろしくお願いします」の声に、自分も気が引き締まる。`,
  );
  return next;
}

/** 1on1指導: 学生のスキル・独立性・モチベを上げる */
export function menterStudent(state: GameState, student: Student): GameState {
  if (state.daily.timeSlots < 1) return state;
  const management = state.player.skills.management.level;
  const skillUp = student.skill < 10 ? 0.3 + management * 0.05 : 0;
  const indepUp = 3 + management * 0.4;
  const motivUp = 8 + management * 0.5;

  let next = applyEffects(state, [
    { kind: 'timeSlot', amount: -1 },
    { kind: 'focus', amount: -10 },
    { kind: 'skillXp', skill: 'management', amount: 12 },
  ]);

  next = {
    ...next,
    students: next.students.map((s) =>
      s.id === student.id
        ? {
            ...s,
            skill: Math.min(10, Math.round((s.skill + skillUp) * 10) / 10),
            independence: Math.min(100, s.independence + indepUp),
            motivation: Math.min(100, s.motivation + motivUp),
          }
        : s,
    ),
  };
  next = pushLog(next, {
    kind: 'info',
    text: `[指導] ${student.name}: 独立性+${indepUp.toFixed(0)}, モチベ+${motivUp.toFixed(0)}`,
  });
  next = setNarration(
    next,
    `${student.name} の進捗を一緒に整理。詰まっていた部分が見えると、表情が明らかに変わる。`,
  );
  return next;
}

/** 各学生がこのターン中に自動で実験を1回試みる (turn end時に呼ぶ) */
export function studentsAutoWork(state: GameState): GameState {
  if (state.students.length === 0) return state;
  let next = state;
  for (const student of state.students) {
    next = studentDailyWork(next, student);
  }
  return next;
}

function studentDailyWork(state: GameState, student: Student): GameState {
  // モチベ/メンタル低いと働かない
  if (student.motivation < 20 || student.mental < 20) {
    return pushLog(state, {
      kind: 'warn',
      text: `[学生] ${student.name} は今日は何も手につかなかった`,
    });
  }
  // 学生は専門タグに合うプロトコルから一つ選ぶ
  const choosable = PROTOCOLS.filter((p) => {
    if (student.specialties.includes('wet') && p.category === 'wet') return true;
    if (student.specialties.includes('dry') && p.category === 'dry') return true;
    if (p.tags.some((t) => student.specialties.includes(t))) return true;
    return false;
  });
  if (choosable.length === 0) return state;
  const rng = createRng(state.rngSeed + student.id.length);
  const pick = choosable[Math.floor(rng() * choosable.length)];

  // 資金不足/機器不足は静かに諦める
  if (state.resources.funds < pick.costFunds) return state;

  // 成功率: 学生のスキル + 独立性 (独立性低いと指示なしで失敗多発)
  const labTags = state.lab.equipments.flatMap((inst) => {
    const def = EQUIPMENT_BY_ID.get(inst.defId);
    return def ? def.tags : [];
  });
  const matched = (pick.preferredEquipmentTags ?? []).some((t) => labTags.includes(t));
  const successRate =
    pick.baseSuccessRate * (student.skill / 8) * (0.4 + student.independence / 100) +
    (matched ? 0.08 : 0);
  const success = rngChance(rng, successRate);
  const nextSeed = Math.floor(rng() * 0xffffffff);

  let next: GameState = { ...state, rngSeed: nextSeed };

  // 試薬代だけは引く (学生実験)
  next = applyEffects(next, [{ kind: 'funds', amount: -pick.costFunds }]);

  if (success) {
    // RP/データを得る (プレイヤー単独より少なめ)
    const dp: ExperimentDataPoint = {
      id: `dp-stu-${state.day}-${student.id}-${next.projects.length}`,
      protocolId: pick.id,
      day: next.day,
      quality: 40 + student.skill * 4,
      reproducibility: 40 + student.independence * 0.3,
      success: true,
      projectId:
        (student.assignedProjectId && next.projects.find((p) => p.id === student.assignedProjectId)?.id) ||
        next.projects[0]?.id,
    };
    const targetProj = dp.projectId
      ? next.projects.find((p) => p.id === dp.projectId)
      : undefined;
    if (targetProj) {
      next = {
        ...next,
        projects: next.projects.map((p) =>
          p.id === targetProj.id
            ? {
                ...p,
                dataPoints: [...p.dataPoints, dp],
                progress: Math.min(100, p.progress + 3),
              }
            : p,
        ),
      };
    }
    next = {
      ...next,
      resources: { ...next.resources, researchPoints: next.resources.researchPoints + 4 },
    };
    next = pushLog(next, { kind: 'good', text: `[学生] ${student.name} が ${pick.name} を成功させた` });
  } else {
    // 失敗: モチベ少し下がる
    next = {
      ...next,
      students: next.students.map((s) =>
        s.id === student.id ? { ...s, motivation: Math.max(0, s.motivation - 5) } : s,
      ),
    };
    next = pushLog(next, { kind: 'warn', text: `[学生] ${student.name} の ${pick.name} は失敗` });
  }
  return next;
}
