import type {
  GameState,
  SceneId,
  ActionDescriptor,
  ProtocolDef,
  Project,
  Paper,
  JournalDef,
  EquipmentDef,
  EquipmentInstance,
  GrantDef,
  GrantApplication,
  Student,
  ConferenceDef,
  ConferenceTalkKind,
  ConferenceRegistration,
  SOP,
  CollaboratorDef,
  Collaboration,
} from '../../domain/types';
import { PROTOCOLS, PROTOCOL_BY_ID } from '../../domain/data/protocols';
import { EQUIPMENTS, EQUIPMENT_BY_ID } from '../../domain/data/equipments';
import { JOURNALS, JOURNAL_BY_ID } from '../../domain/data/journals';
import { GRANTS, GRANT_BY_ID } from '../../domain/data/grants';
import type { StudentTemplate } from '../../domain/data/students';
import { CONFERENCES, CONFERENCE_BY_ID } from '../../domain/data/conferences';
import { COLLABORATOR_BY_ID } from '../../domain/data/collaborators';
import { canBuyEquipment } from '../../domain/actions/buyEquipment';
import { canApplyGrant } from '../../domain/actions/grants';
import { canRegisterConference } from '../../domain/actions/conferences';
import { evaluatePromotion } from '../../domain/actions/careers';
import { TIER_LABEL } from '../../domain/data/careers';
import { canRepair } from '../../domain/actions/repair';

// =============================================================================
// Scene meta + characters
// =============================================================================
export function selectPresentCharacters(state: GameState): string[] {
  const base = ['player'];
  if (state.scene === 'lab' && state.students.length > 0) {
    return [...base, `stu:${state.students[0].id}`];
  }
  if (state.scene === 'office' && state.students.length > 0) {
    return [...base, `stu:${state.students[0].id}`];
  }
  return base;
}

export const SCENE_META: Record<SceneId, { label: string; icon: string; bgClass: string }> = {
  lab: { label: '実験室', icon: '🧪', bgClass: 'from-emerald-950 to-slate-900' },
  office: { label: '居室', icon: '💻', bgClass: 'from-indigo-950 to-slate-900' },
  home: { label: '自宅', icon: '🏠', bgClass: 'from-stone-900 to-slate-900' },
  conference: { label: '学会会場', icon: '🎤', bgClass: 'from-amber-950 to-slate-900' },
  classroom: { label: '教室', icon: '📚', bgClass: 'from-sky-950 to-slate-900' },
};

/** SceneNav が並べる順 */
export const SCENE_ORDER: SceneId[] = ['lab', 'office', 'conference', 'home'];

// =============================================================================
// Action descriptors
// =============================================================================
export type ExperimentAction = ActionDescriptor & { type: 'experiment'; protocol: ProtocolDef };
export type WritePaperAction = ActionDescriptor & { type: 'writePaper'; project: Project };
export type SubmitPaperAction = ActionDescriptor & { type: 'submitPaper'; paper: Paper; journal: JournalDef };
export type ReviseAction = ActionDescriptor & { type: 'revise'; paper: Paper };
export type ResubmitAction = ActionDescriptor & { type: 'resubmit'; paper: Paper };
export type BuyEquipmentAction = ActionDescriptor & { type: 'buyEquipment'; equipment: EquipmentDef };
export type StartProjectAction = ActionDescriptor & { type: 'startProject' };
export type StartGrantAction = ActionDescriptor & { type: 'startGrant'; grant: GrantDef };
export type WriteGrantAction = ActionDescriptor & { type: 'writeGrant'; app: GrantApplication };
export type SubmitGrantAction = ActionDescriptor & { type: 'submitGrant'; app: GrantApplication };
export type HireStudentAction = ActionDescriptor & { type: 'hireStudent'; template: StudentTemplate };
export type MentorAction = ActionDescriptor & { type: 'mentor'; student: Student };
export type RestAction = ActionDescriptor & { type: 'rest' };
export type ChangeSceneAction = ActionDescriptor & { type: 'changeScene'; scene: SceneId };
export type EndDayAction = ActionDescriptor & { type: 'endDay' };
export type RegisterConferenceAction = ActionDescriptor & {
  type: 'registerConference';
  conference: ConferenceDef;
  talkKind: ConferenceTalkKind;
};
export type PromoteAction = ActionDescriptor & { type: 'promote' };
export type CreateSOPAction = ActionDescriptor & {
  type: 'createSOP';
  equipment: EquipmentInstance;
  protocol: ProtocolDef;
};
export type ToggleSOPAction = ActionDescriptor & { type: 'toggleSOP'; sop: SOP };
export type DeleteSOPAction = ActionDescriptor & { type: 'deleteSOP'; sop: SOP };
export type RepairAction = ActionDescriptor & { type: 'repair'; equipment: EquipmentInstance };
export type StartCollaborationAction = ActionDescriptor & {
  type: 'startCollaboration';
  collaborator: CollaboratorDef;
};

export type AnyAction =
  | ExperimentAction
  | WritePaperAction
  | SubmitPaperAction
  | ReviseAction
  | ResubmitAction
  | BuyEquipmentAction
  | StartProjectAction
  | StartGrantAction
  | WriteGrantAction
  | SubmitGrantAction
  | HireStudentAction
  | MentorAction
  | RestAction
  | ChangeSceneAction
  | EndDayAction
  | RegisterConferenceAction
  | PromoteAction
  | CreateSOPAction
  | ToggleSOPAction
  | DeleteSOPAction
  | RepairAction
  | StartCollaborationAction;

function dis(state: GameState, timeSlots: number, costFunds: number): string | undefined {
  if (state.daily.timeSlots < timeSlots) return '時間が足りない';
  if (state.resources.funds < costFunds) return '資金不足';
  return undefined;
}

export function selectActions(state: GameState): AnyAction[] {
  // pendingEventがあればアクション選択肢を出さない (イベント解決を促す)
  if (state.pendingEvent) return [];

  const acts: AnyAction[] = [];

  // -------- LAB --------
  if (state.scene === 'lab') {
    for (const p of PROTOCOLS) {
      acts.push({
        type: 'experiment',
        protocol: p,
        id: `exp-${p.id}`,
        label: p.name,
        icon: p.category === 'wet' ? '🧫' : '💻',
        description: p.description,
        disabledReason: dis(state, p.timeSlots, p.costFunds),
        effectPreview: [
          `時間 -${p.timeSlots}`,
          `資金 -$${p.costFunds}`,
          `成功率 ~${Math.round(p.baseSuccessRate * 100)}%`,
          `成功時 RP +${p.successEffects.find((e) => e.kind === 'rp')?.amount ?? 0}`,
        ],
      });
    }
  }

  // -------- OFFICE --------
  if (state.scene === 'office') {
    // 新規プロジェクト
    acts.push({
      type: 'startProject',
      id: 'start-project',
      label: '新規プロジェクト立ち上げ',
      icon: '✨',
      description: '新しい研究テーマを始める。最初は planning ステージから。',
      disabledReason: state.daily.timeSlots < 1 ? '時間が足りない' : undefined,
      effectPreview: ['時間 -1', '集中 -8'],
    });

    // 論文執筆 (writing/analysis 段階のもの)
    for (const proj of state.projects.filter((p) =>
      ['writing', 'analysis', 'main', 'preliminary'].includes(p.stage),
    )) {
      acts.push({
        type: 'writePaper',
        project: proj,
        id: `write-${proj.id}`,
        label: `論文執筆: ${proj.name}`,
        icon: '✍️',
        description: `${proj.stage} 段階 / データ ${proj.dataPoints.length}本`,
        disabledReason: state.daily.timeSlots < 1 ? '時間が足りない' : undefined,
        effectPreview: ['時間 -1', '集中 -18', 'メンタル -6'],
      });
    }

    // 投稿 (drafting & 品質40+)
    for (const paper of state.papers.filter((p) => p.stage === 'drafting' && p.qualityScore >= 40)) {
      for (const j of JOURNALS) {
        acts.push({
          type: 'submitPaper',
          paper,
          journal: j,
          id: `submit-${paper.id}-${j.id}`,
          label: `${j.name} に投稿`,
          icon: '📤',
          description: `IF=${j.impactFactor} ベース採択率 ${(j.acceptanceRateBase * 100).toFixed(0)}%`,
          disabledReason: state.daily.timeSlots < 1 ? '時間が足りない' : undefined,
          effectPreview: [`論文品質: ${Math.round(paper.qualityScore)}`, `受理時 評判+${j.reputationGain}`],
        });
      }
    }

    // Revision 対応
    for (const paper of state.papers.filter(
      (p) => p.stage === 'majorRevision' || p.stage === 'minorRevision',
    )) {
      acts.push({
        type: 'revise',
        paper,
        id: `revise-${paper.id}`,
        label: `${paper.stage === 'majorRevision' ? 'Major' : 'Minor'} Revision 対応`,
        icon: '🔧',
        description: '査読コメントに回答し、品質を上げる',
        disabledReason: state.daily.timeSlots < 1 ? '時間が足りない' : undefined,
        effectPreview: ['時間 -1', '品質+', 'メンタル -8'],
      });
      acts.push({
        type: 'resubmit',
        paper,
        id: `resubmit-${paper.id}`,
        label: `${paper.title} を再投稿`,
        icon: '📤',
        description: 'Revision letter を添えて再投稿',
        disabledReason: state.daily.timeSlots < 1 ? '時間が足りない' : undefined,
      });
    }

    // 機器購入
    for (const def of EQUIPMENTS) {
      const owned = state.lab.equipments.some((i) => i.defId === def.id);
      const check = canBuyEquipment(state, def);
      acts.push({
        type: 'buyEquipment',
        equipment: def,
        id: `buy-${def.id}`,
        label: `${def.name}${owned ? ' (もう1台)' : ''}`,
        icon: '🛒',
        description: def.description,
        disabledReason: check.ok ? undefined : check.reason,
        effectPreview: [`コスト -$${def.cost}`, `自動化: ${def.automation}`, `タグ: ${def.tags.join(', ')}`],
      });
    }

    // グラント新規申請
    for (const def of GRANTS) {
      const check = canApplyGrant(state, def);
      acts.push({
        type: 'startGrant',
        grant: def,
        id: `grant-${def.id}`,
        label: `${def.icon} ${def.name} に応募`,
        icon: '🪙',
        description: `${def.description} / 報酬 $${def.award.toLocaleString()}`,
        disabledReason: check.ok ? undefined : check.reason,
        effectPreview: [
          `必要執筆 ${def.writingRequired}pt`,
          `採択率 ~${(def.baseAcceptanceRate * 100).toFixed(0)}%`,
          `必要評判 ${def.minReputation}`,
          `必要論文 ${def.minPublications}本`,
        ],
      });
    }

    // 申請中グラントの執筆/投稿
    for (const app of state.grants.filter((g) => g.stage === 'drafting')) {
      const def = GRANT_BY_ID.get(app.defId);
      if (!def) continue;
      const done = app.writingProgress >= def.writingRequired;
      acts.push({
        type: done ? 'submitGrant' : 'writeGrant',
        app,
        id: `gw-${app.id}`,
        label: done ? `${def.name} を提出` : `${def.name} 執筆`,
        icon: done ? '📤' : '📝',
        description: `${Math.round((app.writingProgress / def.writingRequired) * 100)}% 完成`,
        disabledReason: state.daily.timeSlots < 1 ? '時間が足りない' : undefined,
      });
    }
  }


  // -------- LAB: 修理 --------
  if (state.scene === 'lab') {
    for (const inst of state.lab.equipments) {
      const def = EQUIPMENT_BY_ID.get(inst.defId);
      if (!def) continue;
      if (inst.condition >= 95) continue;
      const check = canRepair(state, inst);
      acts.push({
        type: 'repair',
        equipment: inst,
        id: `repair-${inst.instanceId}`,
        label: `🔧 修理: ${def.name}`,
        icon: '🔧',
        description: `現在のコンディション: ${inst.condition}/100`,
        disabledReason: check.ok ? undefined : check.reason,
        effectPreview: [`Condition → 100`, '症状軽度なら時間ゼロ'],
      });
    }
  }

  // -------- LAB: SOP管理 --------
  if (state.scene === 'lab') {
    // 既存SOPのトグル/削除
    for (const sop of state.sops) {
      const inst = state.lab.equipments.find((e) => e.instanceId === sop.equipmentInstanceId);
      const eq = inst ? EQUIPMENT_BY_ID.get(inst.defId) : undefined;
      const pr = PROTOCOL_BY_ID.get(sop.protocolId);
      if (!inst || !eq || !pr) continue;
      acts.push({
        type: 'toggleSOP',
        sop,
        id: `sop-toggle-${sop.id}`,
        label: sop.active ? `⏸ ${eq.name}/${pr.name}` : `▶ ${eq.name}/${pr.name}`,
        icon: '⚙️',
        description: sop.active ? '自動運転を一時停止' : '自動運転を再開',
      });
      acts.push({
        type: 'deleteSOP',
        sop,
        id: `sop-del-${sop.id}`,
        label: `SOP削除: ${eq.name}`,
        icon: '🗑️',
        description: 'SOPを破棄する',
      });
    }
    // 新規SOP登録 (semi-auto/auto機器 × 対応プロトコル)
    for (const inst of state.lab.equipments) {
      const eqDef = EQUIPMENT_BY_ID.get(inst.defId);
      if (!eqDef || eqDef.automation === 'manual') continue;
      // 並列スロットが埋まっているならスキップ
      const slots = eqDef.parallelSlots ?? 1;
      const using = state.sops.filter((s) => s.equipmentInstanceId === inst.instanceId).length;
      if (using >= slots) continue;
      for (const pr of PROTOCOLS) {
        if (
          pr.preferredEquipmentTags &&
          !pr.preferredEquipmentTags.some((t) => eqDef.tags.includes(t))
        )
          continue;
        acts.push({
          type: 'createSOP',
          equipment: inst,
          protocol: pr,
          id: `sop-new-${inst.instanceId}-${pr.id}`,
          label: `SOP化: ${eqDef.name} で ${pr.name}`,
          icon: '🛠️',
          description: `${eqDef.name} を ${pr.name} の自動運転にセットアップ`,
          disabledReason: state.daily.timeSlots < 1 ? '時間が足りない' : undefined,
          effectPreview: ['時間 -1', '集中 -12', '試薬代は40%削減'],
        });
      }
    }
  }

  // -------- OFFICE: 昇進アクション --------
  if (state.scene === 'office') {
    const promo = evaluatePromotion(state);
    if (promo.eligible && promo.criteria) {
      acts.push({
        type: 'promote',
        id: 'promote',
        label: `🎓 昇進: ${TIER_LABEL[promo.criteria.toTier]} へ`,
        icon: '🎓',
        description: '昇進条件を満たしている。受諾すれば新しい立場に進む。',
        effectPreview: ['時間スロット変動', 'ラボ拡張', '雑務増加'],
      });
    } else if (promo.criteria) {
      acts.push({
        type: 'promote',
        id: 'promote-locked',
        label: `🔒 昇進まで: ${TIER_LABEL[promo.criteria.toTier]}`,
        icon: '🔒',
        description: `不足: ${promo.missing.join(' / ')}`,
        disabledReason: '条件未達',
      });
    }
  }

  // -------- CONFERENCE --------
  if (state.scene === 'conference') {
    for (const def of CONFERENCES) {
      const check = canRegisterConference(state, def);
      const talkKinds: ConferenceTalkKind[] = ['poster', 'oral'];
      for (const k of talkKinds) {
        acts.push({
          type: 'registerConference',
          conference: def,
          talkKind: k,
          id: `conf-${def.id}-${k}`,
          label: `${def.icon} ${def.name} (${k})`,
          icon: '🎫',
          description: `${def.description} / 費用$${def.cost} / 日数${def.daysSpent}`,
          disabledReason: check.ok ? undefined : check.reason,
          effectPreview: [
            `参加費 -$${def.cost}`,
            `評判 +${def.baseReputation}`,
            `RP +${def.rpGain}`,
            def.requiresEnglish ? `英Lv${def.requiresEnglish}必要` : '',
          ].filter(Boolean),
        });
      }
    }
  }

  // -------- HOME --------
  if (state.scene === 'home') {
    acts.push({
      type: 'rest',
      id: 'rest-home',
      label: '少し休む',
      icon: '☕',
      description: '集中力とメンタルを回復する。',
      disabledReason: state.daily.timeSlots < 1 ? '時間が足りない' : undefined,
      effectPreview: ['時間 -1', '集中 +25', 'メンタル +10'],
    });
  }


  return acts;
}

// =============================================================================
// Action grouping (ActionPanel タブ用)
// =============================================================================

export type ActionGroupId =
  | 'experiment'
  | 'compute'
  | 'sop'
  | 'equipment'
  | 'plan'
  | 'grantNew'
  | 'conference'
  | 'rest'
  | 'promote';

export const ACTION_GROUP_META: Record<
  ActionGroupId,
  { label: string; icon: string; order: number }
> = {
  experiment: { label: '実験', icon: '🧫', order: 1 },
  compute: { label: '計算', icon: '💻', order: 2 },
  sop: { label: '自動化', icon: '⚙️', order: 3 },
  equipment: { label: '機器', icon: '🛒', order: 4 },
  plan: { label: '計画', icon: '✨', order: 5 },
  grantNew: { label: '申請', icon: '📜', order: 6 },
  conference: { label: '学会', icon: '🎫', order: 9 },
  rest: { label: '休憩', icon: '☕', order: 10 },
  promote: { label: '昇進', icon: '🎓', order: 11 },
};

/** AnyAction → どのタブに入るか。null は ActionPanel から除外 (TaskPanel / SceneNav 行き)。 */
function classifyAction(a: AnyAction): ActionGroupId | null {
  switch (a.type) {
    case 'experiment':
      return a.protocol.category === 'wet' ? 'experiment' : 'compute';
    case 'startProject':
      return 'plan';
    case 'startGrant':
      return 'grantNew';
    case 'registerConference':
      return 'conference';
    case 'createSOP':
    case 'toggleSOP':
    case 'deleteSOP':
      return 'sop';
    case 'repair':
    case 'buyEquipment':
      return 'equipment';
    case 'rest':
      return 'rest';
    case 'promote':
      return 'promote';
    // ↓ TaskPanel 側の管理: 採用・共同・論文/グラント/学生のステートフル操作
    case 'hireStudent':
    case 'startCollaboration':
    case 'writePaper':
    case 'submitPaper':
    case 'revise':
    case 'resubmit':
    case 'writeGrant':
    case 'submitGrant':
    case 'mentor':
    // ↓ SceneNav 側の管理
    case 'changeScene':
    case 'endDay':
      return null;
  }
}

export type ActionGroup = {
  id: ActionGroupId;
  label: string;
  icon: string;
  actions: AnyAction[];
};

/** ActionPanel のタブ群を生成。空タブは省く。 */
export function selectActionGroups(state: GameState): ActionGroup[] {
  if (state.pendingEvent) return [];
  const buckets = new Map<ActionGroupId, AnyAction[]>();
  for (const a of selectActions(state)) {
    const id = classifyAction(a);
    if (!id) continue;
    if (!buckets.has(id)) buckets.set(id, []);
    buckets.get(id)!.push(a);
  }
  const groups: ActionGroup[] = [];
  for (const [id, actions] of buckets) {
    groups.push({
      id,
      label: ACTION_GROUP_META[id].label,
      icon: ACTION_GROUP_META[id].icon,
      actions,
    });
  }
  groups.sort((a, b) => ACTION_GROUP_META[a.id].order - ACTION_GROUP_META[b.id].order);
  return groups;
}

// =============================================================================
// Task views (TaskPanel のカード用) — 型は冒頭でまとめてimport済
// =============================================================================
export type ProjectTaskView = {
  project: Project;
  draftingPaper?: Paper;
};

export type PaperTaskView = {
  paper: Paper;
  project?: Project;
  journal?: JournalDef;
};

export type GrantTaskView = {
  app: GrantApplication;
  def: GrantDef;
};

export type StudentTaskView = {
  student: Student;
};

export type CollaborationTaskView = {
  collab: Collaboration;
  def: ReturnType<typeof COLLABORATOR_BY_ID.get>;
};

export type ConferenceTaskView = {
  reg: ConferenceRegistration;
  def: ReturnType<typeof CONFERENCE_BY_ID.get>;
};

export function selectProjectTasks(state: GameState): ProjectTaskView[] {
  return state.projects.map((project) => ({
    project,
    draftingPaper: state.papers.find(
      (p) => p.projectId === project.id && p.stage === 'drafting',
    ),
  }));
}

export function selectPaperTasks(state: GameState): PaperTaskView[] {
  return state.papers.map((paper) => ({
    paper,
    project: state.projects.find((p) => p.id === paper.projectId),
    journal: paper.journalId ? JOURNAL_BY_ID.get(paper.journalId) : undefined,
  }));
}

export function selectGrantTasks(state: GameState): GrantTaskView[] {
  const result: GrantTaskView[] = [];
  for (const app of state.grants) {
    const def = GRANT_BY_ID.get(app.defId);
    if (!def) continue;
    result.push({ app, def });
  }
  return result;
}

export function selectStudentTasks(state: GameState): StudentTaskView[] {
  return state.students.map((student) => ({ student }));
}

export function selectCollaborationTasks(state: GameState): CollaborationTaskView[] {
  return state.collaborations.map((collab) => ({
    collab,
    def: COLLABORATOR_BY_ID.get(collab.defId),
  }));
}

export function selectConferenceTasks(state: GameState): ConferenceTaskView[] {
  return state.conferences.map((reg) => ({
    reg,
    def: CONFERENCE_BY_ID.get(reg.defId),
  }));
}
