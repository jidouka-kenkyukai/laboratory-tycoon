import { useState } from 'react';
import clsx from 'clsx';
import { useGameStore } from '../../store/gameStore';
import { useUiStore } from '../../store/uiStore';
import type { GameState, Paper, Project, JournalDef, Student } from '../../domain/types';
import {
  selectProjectTasks,
  selectPaperTasks,
  selectGrantTasks,
  selectStudentTasks,
  selectCollaborationTasks,
  selectConferenceTasks,
} from '../presenters/selectors';
import { JOURNALS } from '../../domain/data/journals';
import { TIER_LABEL, nextPromotion } from '../../domain/data/careers';
import { evaluatePromotion } from '../../domain/actions/careers';
import { EQUIPMENT_BY_ID } from '../../domain/data/equipments';
import { PROTOCOL_BY_ID } from '../../domain/data/protocols';
import { SKILL_LABELS } from '../../domain/rules/skills';
import { STUDENT_CANDIDATES, type StudentTemplate } from '../../domain/data/students';
import { COLLABORATORS } from '../../domain/data/collaborators';
import { canStartCollaboration } from '../../domain/actions/collaborations';
import type { CollaboratorDef } from '../../domain/types';

type TabId =
  | 'status'
  | 'projects'
  | 'papers'
  | 'grants'
  | 'students'
  | 'collabs'
  | 'confs';

// =============================================================================
// Top-level
// =============================================================================
export function TaskPanel() {
  const state = useGameStore((g) => g.state);
  const isOpen = useUiStore((u) => u.taskPanelOpen);
  const close = useUiStore((u) => u.closeTaskPanel);
  const [tab, setTab] = useState<TabId>('status');

  const activePapers = state.papers.filter(
    (p) => p.stage !== 'accepted' && p.stage !== 'rejected',
  );
  const pendingGrants = state.grants.filter(
    (g) => g.stage === 'drafting' || g.stage === 'submitted',
  );
  const activeCollabs = state.collaborations.filter((c) => c.stage === 'active');
  const upcomingConfs = state.conferences.filter((c) => c.stage === 'registered');

  const tabs: { id: TabId; label: string; icon: string; badge?: number; alert?: boolean }[] = [
    { id: 'status', label: 'ステータス', icon: '📋' },
    { id: 'projects', label: 'プロジェクト', icon: '📂', badge: state.projects.length },
    {
      id: 'papers',
      label: '論文',
      icon: '📑',
      badge: activePapers.length,
      // Revision待ち or 投稿可能のとき注目
      alert: activePapers.some(
        (p) =>
          p.stage === 'majorRevision' ||
          p.stage === 'minorRevision' ||
          (p.stage === 'drafting' && p.qualityScore >= 40),
      ),
    },
    {
      id: 'grants',
      label: 'グラント',
      icon: '🪙',
      badge: pendingGrants.length,
      alert: state.grants.some(
        (g) => g.stage === 'drafting' && state.daily.timeSlots > 0,
      ),
    },
    {
      id: 'students',
      label: '学生',
      icon: '🧑‍🎓',
      badge: state.students.length,
    },
    { id: 'collabs', label: '共同', icon: '🤝', badge: activeCollabs.length },
    { id: 'confs', label: '学会', icon: '🎫', badge: upcomingConfs.length },
  ];

  return (
    <>
      {/* モバイル時のバックドロップ */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={close}
          aria-label="進行ボードを閉じる"
        />
      )}
      <aside
        className={clsx(
          'flex flex-col border-l border-lab-border bg-lab-panel/95 md:bg-lab-panel/60 backdrop-blur md:backdrop-blur-none',
          // mobile: drawer (fixed, slide-over)
          'fixed top-0 right-0 h-full z-50 w-80 max-w-[85vw] shadow-2xl transition-transform duration-200',
          // md+: in-flow sidebar
          'md:relative md:translate-x-0 md:shadow-none md:z-auto md:h-auto md:max-w-none',
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
        )}
      >
        {/* モバイル用 閉じるボタン */}
        <button
          onClick={close}
          className="md:hidden absolute top-1 right-1 p-1.5 text-lab-muted hover:text-lab-text z-10 text-base leading-none"
          aria-label="閉じる"
        >
          ✕
        </button>
        <div className="flex flex-wrap border-b border-lab-border bg-lab-bg/40">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'px-2 py-1.5 text-[11px] whitespace-nowrap border-r border-lab-border transition flex items-center gap-0.5',
                active
                  ? 'text-lab-accent border-b-2 border-b-lab-accent bg-lab-panel font-semibold'
                  : 'text-lab-muted hover:text-lab-text hover:bg-lab-panel/50',
              )}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span
                  className={clsx(
                    'ml-0.5 text-[9px] px-1 rounded-full',
                    t.alert
                      ? 'bg-lab-warn/30 text-lab-warn'
                      : 'bg-lab-border text-lab-text',
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'status' && <StatusTab state={state} />}
        {tab === 'projects' && <ProjectsTab state={state} />}
        {tab === 'papers' && <PapersTab state={state} />}
        {tab === 'grants' && <GrantsTab state={state} />}
        {tab === 'students' && <StudentsTab state={state} />}
        {tab === 'collabs' && <CollabsTab state={state} />}
        {tab === 'confs' && <ConfsTab state={state} />}
      </div>
      </aside>
    </>
  );
}

// =============================================================================
// Shared
// =============================================================================
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-lab-border px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-lab-muted mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-xs text-lab-muted italic px-3 py-4">{text}</div>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-lab-border px-3 py-2.5 text-xs">{children}</div>;
}

function Tag({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode;
  tone?: 'good' | 'warn' | 'bad' | 'info' | 'muted';
}) {
  const tones: Record<string, string> = {
    good: 'bg-lab-good/20 text-lab-good border-lab-good/30',
    warn: 'bg-lab-warn/20 text-lab-warn border-lab-warn/30',
    bad: 'bg-lab-bad/20 text-lab-bad border-lab-bad/30',
    info: 'bg-lab-accent/20 text-lab-accent border-lab-accent/30',
    muted: 'bg-lab-bg/60 text-lab-muted border-lab-border',
  };
  return (
    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border mr-1', tones[tone])}>
      {children}
    </span>
  );
}

function ProgressBar({ value, max, color = 'bg-lab-accent' }: { value: number; max: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1 mt-1 rounded bg-lab-border overflow-hidden">
      <div className={clsx('h-full', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ActionBtn({
  onClick,
  disabled,
  children,
  tone = 'default',
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  tone?: 'default' | 'good' | 'warn';
}) {
  const tones: Record<string, string> = {
    default: 'border-lab-border hover:border-lab-accent',
    good: 'border-lab-good/40 text-lab-good hover:border-lab-good',
    warn: 'border-lab-warn/40 text-lab-warn hover:border-lab-warn',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'text-[11px] px-2 py-1 rounded border transition flex-1',
        disabled ? 'opacity-40 cursor-not-allowed' : tones[tone],
      )}
    >
      {children}
    </button>
  );
}

// =============================================================================
// Tabs
// =============================================================================
function StatusTab({ state }: { state: GameState }) {
  const reset = useGameStore((g) => g.resetGame);
  const promo = evaluatePromotion(state);
  const next = nextPromotion(state.player.tier);
  return (
    <div>
      <Section title="キャリア">
        <div className="text-xs">
          <div className="font-semibold">{TIER_LABEL[state.player.tier]}</div>
          {next ? (
            <div className="text-lab-muted mt-0.5">
              次: {TIER_LABEL[next.toTier]}
              <div className="mt-0.5">
                {promo.eligible ? (
                  <span className="text-lab-good">▶ 昇進可能 (居室で受諾)</span>
                ) : (
                  <span>不足: {promo.missing.join(', ')}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-lab-muted">最終ランク到達</div>
          )}
        </div>
      </Section>

      <Section title="ラボ機器">
        {state.lab.equipments.length === 0 && <div className="text-xs text-lab-muted italic">機器なし</div>}
        {state.lab.equipments.map((inst) => {
          const def = EQUIPMENT_BY_ID.get(inst.defId);
          if (!def) return null;
          const tone =
            inst.condition < 30 ? 'bad' : inst.condition < 60 ? 'warn' : 'good';
          return (
            <div key={inst.instanceId} className="text-xs flex justify-between mb-0.5">
              <span>{def.name}</span>
              <span className="flex gap-1">
                <Tag tone="muted">{def.automation}</Tag>
                <Tag tone={tone}>{inst.condition}</Tag>
              </span>
            </div>
          );
        })}
        <div className="text-[10px] text-lab-muted mt-1">
          スペース: {state.lab.equipments.length} / {state.lab.spaceCapacity}
        </div>
      </Section>

      <Section title="自動運転 (SOP)">
        {state.sops.length === 0 ? (
          <div className="text-xs text-lab-muted italic">SOPはまだ無い (lab で設定)</div>
        ) : (
          state.sops.map((sop) => {
            const inst = state.lab.equipments.find((e) => e.instanceId === sop.equipmentInstanceId);
            const eq = inst ? EQUIPMENT_BY_ID.get(inst.defId) : undefined;
            const pr = PROTOCOL_BY_ID.get(sop.protocolId);
            if (!eq || !pr) return null;
            return (
              <div key={sop.id} className="text-xs mb-0.5 flex justify-between gap-1">
                <span>
                  <span className="font-semibold">{eq.name}</span>
                  <span className="text-lab-muted"> → {pr.name}</span>
                </span>
                <span className={sop.active ? 'text-lab-good' : 'text-lab-muted'}>
                  {sop.active ? '稼働中' : '停止'}
                </span>
              </div>
            );
          })
        )}
      </Section>

      <Section title="スキル">
        {Object.entries(state.player.skills).map(([id, sk]) => (
          <div key={id} className="text-xs flex justify-between">
            <span>{SKILL_LABELS[id as keyof typeof SKILL_LABELS]}</span>
            <span className="text-lab-muted">
              Lv{sk.level} <span className="opacity-60">({sk.xp}xp)</span>
            </span>
          </div>
        ))}
      </Section>

      <Section title="ログ (直近)">
        <div className="max-h-44 overflow-y-auto pr-1">
          {state.log.slice(0, 30).map((e) => (
            <div
              key={e.id}
              className={clsx(
                'text-[11px] mb-0.5',
                e.kind === 'good' && 'text-lab-good',
                e.kind === 'warn' && 'text-lab-warn',
                e.kind === 'bad' && 'text-lab-bad',
                e.kind === 'info' && 'text-lab-muted',
              )}
            >
              <span className="text-lab-muted">[D{e.day}]</span> {e.text}
            </div>
          ))}
        </div>
      </Section>

      <div className="p-3">
        <button
          className="w-full text-xs py-1.5 rounded border border-lab-border bg-lab-panel hover:border-lab-bad hover:text-lab-bad"
          onClick={() => {
            if (confirm('セーブを消してゲームを最初からやり直す?')) reset();
          }}
        >
          リセット (デバッグ)
        </button>
      </div>
    </div>
  );
}

function ProjectsTab({ state }: { state: GameState }) {
  const tasks = selectProjectTasks(state);
  const store = useGameStore.getState;
  if (tasks.length === 0) return <Empty text="進行中のプロジェクトはない" />;
  return (
    <div>
      {tasks.map((t) => {
        const canWrite = state.daily.timeSlots >= 1;
        const stageTone =
          t.project.stage === 'writing' ? 'info' : t.project.stage === 'analysis' ? 'info' : 'muted';
        return (
          <Card key={t.project.id}>
            <div className="font-semibold">{t.project.name}</div>
            <div className="mt-1">
              <Tag tone={stageTone}>{t.project.stage}</Tag>
              <Tag>データ {t.project.dataPoints.length}本</Tag>
              {t.draftingPaper && <Tag tone="info">ドラフト中</Tag>}
            </div>
            <ProgressBar value={t.project.progress} max={100} />
            <div className="mt-2 flex gap-1">
              <ActionBtn
                disabled={!canWrite}
                onClick={() => store().doWritePaper(t.project)}
              >
                ✍️ 論文を書く / 進める
              </ActionBtn>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function PapersTab({ state }: { state: GameState }) {
  const tasks = selectPaperTasks(state);
  if (tasks.length === 0) return <Empty text="まだ論文ドラフトは無い" />;
  return (
    <div>
      {tasks.map((t) => (
        <PaperCard key={t.paper.id} paper={t.paper} project={t.project} journal={t.journal} state={state} />
      ))}
    </div>
  );
}

function JournalPicker({
  paper,
  disabled,
  onSubmit,
}: {
  paper: Paper;
  disabled: boolean;
  onSubmit: (j: JournalDef) => void;
}) {
  return (
    <div className="mt-1 space-y-1">
      {JOURNALS.map((j) => {
        const expectedRate = j.acceptanceRateBase * (0.4 + (paper.qualityScore / 100) * 1.2);
        const rateColor =
          expectedRate >= 0.6
            ? 'text-lab-good'
            : expectedRate >= 0.25
            ? 'text-lab-warn'
            : 'text-lab-bad';
        return (
          <button
            key={j.id}
            disabled={disabled}
            onClick={() => onSubmit(j)}
            className={clsx(
              'w-full text-left border rounded px-2 py-1.5 transition',
              disabled
                ? 'opacity-40 cursor-not-allowed border-lab-border'
                : 'border-lab-border bg-lab-bg/40 hover:border-lab-accent hover:bg-lab-bg/60',
            )}
          >
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-[11px]">{j.name}</span>
              <span className="text-[10px] text-lab-muted">IF {j.impactFactor}</span>
            </div>
            <div className="text-[10px] mt-0.5 flex gap-2">
              <span className={rateColor}>採択率 ~{Math.round(expectedRate * 100)}%</span>
              <span className="text-lab-muted">評判+{j.reputationGain}</span>
              <span className="text-lab-muted">RP+{j.rpGain}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PaperCard({
  paper,
  project,
  journal,
  state,
}: {
  paper: Paper;
  project?: Project;
  journal?: JournalDef;
  state: GameState;
}) {
  const store = useGameStore.getState;
  const [showJournals, setShowJournals] = useState(false);
  const stageTone =
    paper.stage === 'accepted'
      ? 'good'
      : paper.stage === 'rejected'
      ? 'bad'
      : paper.stage === 'majorRevision' || paper.stage === 'minorRevision'
      ? 'warn'
      : 'info';
  const canTime = state.daily.timeSlots >= 1;
  const canSubmit = paper.stage === 'drafting' && paper.qualityScore >= 40 && canTime;

  return (
    <Card>
      <div className="font-semibold">{paper.title}</div>
      <div className="mt-1 flex flex-wrap">
        <Tag tone={stageTone}>{paper.stage}</Tag>
        {journal && <Tag>{journal.name}</Tag>}
        <Tag>品質 {Math.round(paper.qualityScore)}</Tag>
        {(paper.stage === 'submitted' ||
          paper.stage === 'majorRevision' ||
          paper.stage === 'minorRevision') && <Tag tone="warn">{paper.daysInStage}日</Tag>}
      </div>
      <ProgressBar value={paper.qualityScore} max={100} />

      {paper.stage === 'drafting' && project && (
        <div className="mt-2 space-y-1">
          <ActionBtn
            disabled={!canTime}
            onClick={() => store().doWritePaper(project)}
          >
            ✍️ 執筆を進める
          </ActionBtn>
          {paper.qualityScore >= 40 ? (
            <>
              <ActionBtn
                disabled={!canSubmit}
                tone={showJournals ? 'default' : 'good'}
                onClick={() => setShowJournals(!showJournals)}
              >
                {showJournals ? '▲ 投稿先を閉じる' : '📤 投稿先を選ぶ ▼'}
              </ActionBtn>
              {showJournals && (
                <JournalPicker
                  paper={paper}
                  disabled={!canSubmit}
                  onSubmit={(j) => {
                    store().doSubmitPaper(paper, j);
                    setShowJournals(false);
                  }}
                />
              )}
            </>
          ) : (
            <div className="text-[10px] text-lab-muted">品質40以上で投稿可</div>
          )}
        </div>
      )}

      {paper.stage === 'submitted' && (
        <div className="mt-2 text-[11px] text-lab-muted">
          審査中… 結果まであと {Math.max(0, 21 - paper.daysInStage)} 日
        </div>
      )}

      {(paper.stage === 'majorRevision' || paper.stage === 'minorRevision') && (
        <div className="mt-2 flex gap-1">
          <ActionBtn disabled={!canTime} onClick={() => store().doReviseResponse(paper)}>
            🔧 対応
          </ActionBtn>
          <ActionBtn disabled={!canTime} tone="good" onClick={() => store().doResubmit(paper)}>
            📤 再投稿
          </ActionBtn>
        </div>
      )}

      {paper.stage === 'accepted' && (
        <div className="mt-2 text-[11px] text-lab-good">✓ 受理済み</div>
      )}
      {paper.stage === 'rejected' && (
        <div className="mt-2 text-[11px] text-lab-bad">✗ リジェクト</div>
      )}
    </Card>
  );
}

function GrantsTab({ state }: { state: GameState }) {
  const tasks = selectGrantTasks(state);
  const store = useGameStore.getState;
  if (tasks.length === 0) return <Empty text="申請中・採択済のグラントは無い" />;
  return (
    <div>
      {tasks.map(({ app, def }) => {
        const pct = Math.min(100, (app.writingProgress / def.writingRequired) * 100);
        const stageTone =
          app.stage === 'awarded'
            ? 'good'
            : app.stage === 'declined'
            ? 'bad'
            : app.stage === 'submitted'
            ? 'info'
            : 'warn';
        const canWrite = app.stage === 'drafting' && state.daily.timeSlots >= 1;
        const complete = app.stage === 'drafting' && app.writingProgress >= def.writingRequired;
        return (
          <Card key={app.id}>
            <div className="font-semibold">
              {def.icon} {def.name}
            </div>
            <div className="mt-1 flex flex-wrap">
              <Tag tone={stageTone}>{app.stage}</Tag>
              <Tag>${def.award.toLocaleString()}</Tag>
              {app.stage === 'submitted' && <Tag tone="warn">{app.daysInStage}日経過</Tag>}
            </div>
            {app.stage === 'drafting' && (
              <>
                <ProgressBar value={app.writingProgress} max={def.writingRequired} color="bg-lab-good" />
                <div className="text-[10px] text-lab-muted mt-0.5">
                  {Math.round(pct)}% 完成 ({Math.round(app.writingProgress)}/{def.writingRequired})
                </div>
                <div className="mt-2 flex gap-1">
                  <ActionBtn disabled={!canWrite} onClick={() => store().doWriteGrant(app)}>
                    📝 執筆を進める
                  </ActionBtn>
                  <ActionBtn
                    disabled={!complete || state.daily.timeSlots < 1}
                    tone="good"
                    onClick={() => store().doSubmitGrant(app)}
                  >
                    📤 提出
                  </ActionBtn>
                </div>
              </>
            )}
            {app.stage === 'submitted' && (
              <div className="mt-2 text-[11px] text-lab-muted">
                審査中… 結果まであと {Math.max(0, 28 - app.daysInStage)} 日
              </div>
            )}
            {app.stage === 'awarded' && (
              <div className="mt-2 text-[11px] text-lab-good">✓ 採択 +${def.award.toLocaleString()}</div>
            )}
            {app.stage === 'declined' && (
              <div className="mt-2 text-[11px] text-lab-bad">✗ 不採択</div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function StudentsTab({ state }: { state: GameState }) {
  const tasks = selectStudentTasks(state);
  const hiredNames = new Set(state.students.map((s) => s.name));
  const candidates = STUDENT_CANDIDATES.filter((t) => !hiredNames.has(t.name));
  return (
    <div>
      <Section title={`在籍 (${tasks.length})`}>
        {tasks.length === 0 ? (
          <div className="text-xs text-lab-muted italic">まだ学生はいない</div>
        ) : (
          tasks.map(({ student }) => (
            <StudentCard key={student.id} student={student} state={state} />
          ))
        )}
      </Section>
      <Section title={`採用候補 (${candidates.length})`}>
        {candidates.length === 0 ? (
          <div className="text-xs text-lab-muted italic">候補は出尽くした</div>
        ) : (
          candidates.map((tpl) => (
            <CandidateCard key={tpl.name} tpl={tpl} state={state} />
          ))
        )}
      </Section>
    </div>
  );
}

function CandidateCard({ tpl, state }: { tpl: StudentTemplate; state: GameState }) {
  const store = useGameStore.getState;
  const HIRE_COST = 200;
  const reason =
    state.daily.timeSlots < 1
      ? '時間が足りない'
      : state.resources.funds < HIRE_COST
      ? `セットアップ費 $${HIRE_COST}不足`
      : undefined;
  return (
    <div className="border border-lab-border rounded-md p-2 mb-2 bg-lab-bg/40">
      <div className="font-semibold flex items-center gap-1">
        <span>🧑‍🎓</span>
        <span>{tpl.name}</span>
      </div>
      <div className="mt-1 flex flex-wrap">
        <Tag>{tpl.rank}</Tag>
        <Tag>スキル {tpl.skill}</Tag>
        <Tag>独立 {tpl.independence}</Tag>
        <Tag>モチベ {tpl.motivation}</Tag>
      </div>
      <div className="text-[10px] text-lab-muted mt-1">専門: {tpl.specialties.join(', ')}</div>
      <div className="text-[10px] text-lab-muted">
        初期費 ${HIRE_COST} / 月給 ${tpl.salary}
      </div>
      <div className="mt-2">
        <ActionBtn
          disabled={!!reason}
          tone="good"
          onClick={() => store().doHireStudent(tpl)}
        >
          🧑‍🎓 採用する
        </ActionBtn>
        {reason && <div className="text-[10px] text-lab-bad mt-1">⛔ {reason}</div>}
      </div>
    </div>
  );
}

function StudentCard({ student, state }: { student: Student; state: GameState }) {
  const store = useGameStore.getState;
  const canMentor = state.daily.timeSlots >= 1;
  const motTone = student.motivation < 30 ? 'bad' : student.motivation < 60 ? 'warn' : 'good';
  const menTone = student.mental < 30 ? 'bad' : student.mental < 60 ? 'warn' : 'good';
  return (
    <Card>
      <div className="font-semibold">{student.name}</div>
      <div className="mt-1 flex flex-wrap">
        <Tag>{student.rank}</Tag>
        <Tag>スキル {student.skill}</Tag>
        <Tag>独立 {student.independence}</Tag>
        <Tag tone={motTone}>モチベ {student.motivation}</Tag>
        <Tag tone={menTone}>メンタル {student.mental}</Tag>
      </div>
      <div className="text-[10px] text-lab-muted mt-1">専門: {student.specialties.join(', ')}</div>
      <div className="mt-2 flex gap-1">
        <ActionBtn disabled={!canMentor} onClick={() => store().doMentorStudent(student)}>
          🗣️ 指導 (1on1)
        </ActionBtn>
      </div>
    </Card>
  );
}

function CollabsTab({ state }: { state: GameState }) {
  const tasks = selectCollaborationTasks(state);
  const activeIds = new Set(state.collaborations.filter((c) => c.stage === 'active').map((c) => c.defId));
  const offers = COLLABORATORS.filter((c) => !activeIds.has(c.id));
  return (
    <div>
      <Section title={`進行中・履歴 (${tasks.length})`}>
        {tasks.length === 0 ? (
          <div className="text-xs text-lab-muted italic">まだ共同研究はない</div>
        ) : (
          tasks.map(({ collab, def }) => {
            if (!def) return null;
            const remaining = Math.max(0, collab.endsOnDay - state.day);
            const totalDays = collab.endsOnDay - collab.startedOnDay;
            const elapsed = totalDays - remaining;
            const stageTone =
              collab.stage === 'completed' ? 'good' : collab.stage === 'declined' ? 'bad' : 'info';
            return (
              <Card key={collab.id}>
                <div className="font-semibold">
                  {def.icon} {def.name}
                </div>
                <div className="text-[11px] text-lab-muted">{def.affiliation}</div>
                <div className="mt-1 flex flex-wrap">
                  <Tag tone={stageTone}>{collab.stage}</Tag>
                  {collab.stage === 'active' && <Tag>あと {remaining} 日</Tag>}
                </div>
                {collab.stage === 'active' && (
                  <>
                    <ProgressBar value={elapsed} max={totalDays} color="bg-lab-good" />
                    <div className="text-[10px] text-lab-muted mt-0.5">
                      毎日: RP+{def.contributionPerTurn.rp ?? 0} データ品質{def.contributionPerTurn.dataQuality ?? 0}
                      {def.contributionPerTurn.monthlyCost ? ` ・月額$${def.contributionPerTurn.monthlyCost}` : ''}
                    </div>
                    <div className="text-[10px] text-lab-muted">
                      完了時: 評判+{def.completionBonus.reputation ?? 0}
                      {def.completionBonus.funds ? `, $${def.completionBonus.funds}` : ''}
                    </div>
                  </>
                )}
                {collab.stage === 'completed' && (
                  <div className="mt-2 text-[11px] text-lab-good">✓ 完了</div>
                )}
              </Card>
            );
          })
        )}
      </Section>

      <Section title={`オファー中 (${offers.length})`}>
        {offers.length === 0 ? (
          <div className="text-xs text-lab-muted italic">候補は出尽くした</div>
        ) : (
          offers.map((col) => <CollabOfferCard key={col.id} col={col} state={state} />)
        )}
      </Section>
    </div>
  );
}

function CollabOfferCard({ col, state }: { col: CollaboratorDef; state: GameState }) {
  const store = useGameStore.getState;
  const check = canStartCollaboration(state, col);
  return (
    <div className="border border-lab-border rounded-md p-2 mb-2 bg-lab-bg/40">
      <div className="font-semibold flex items-center gap-1">
        <span>{col.icon}</span>
        <span>{col.name}</span>
      </div>
      <div className="text-[11px] text-lab-muted">{col.affiliation}</div>
      <div className="mt-1 flex flex-wrap">
        <Tag>{col.defaultDurationDays}日</Tag>
        <Tag>専門: {col.specialties.join('/')}</Tag>
      </div>
      <div className="text-[10px] text-lab-muted mt-1">
        毎日: RP+{col.contributionPerTurn.rp ?? 0} / データ品質{col.contributionPerTurn.dataQuality ?? 0}
        {col.contributionPerTurn.monthlyCost ? ` / 月額$${col.contributionPerTurn.monthlyCost}` : ' / 無償'}
      </div>
      <div className="text-[10px] text-lab-muted">
        完了ボーナス: 評判+{col.completionBonus.reputation ?? 0}
        {col.completionBonus.funds ? `, $${col.completionBonus.funds}` : ''}
        {col.completionBonus.coAuthoredPaperQuality
          ? `, 共著論文 品質+${col.completionBonus.coAuthoredPaperQuality}`
          : ''}
      </div>
      <div className="mt-2">
        <ActionBtn
          disabled={!check.ok}
          tone="good"
          onClick={() => store().doStartCollaboration(col)}
        >
          🤝 受諾する
        </ActionBtn>
        {!check.ok && <div className="text-[10px] text-lab-bad mt-1">⛔ {check.reason}</div>}
      </div>
    </div>
  );
}


function ConfsTab({ state }: { state: GameState }) {
  const tasks = selectConferenceTasks(state);
  if (tasks.length === 0) return <Empty text="申込中の学会は無い (学会会場で申込)" />;
  return (
    <div>
      {tasks.map(({ reg, def }) => {
        if (!def) return null;
        const until = Math.max(0, reg.startsOnDay - state.day);
        const stageTone =
          reg.stage === 'completed' ? 'good' : reg.stage === 'rejected' ? 'bad' : 'info';
        return (
          <Card key={reg.id}>
            <div className="font-semibold">
              {def.icon} {def.name}
            </div>
            <div className="mt-1 flex flex-wrap">
              <Tag tone={stageTone}>{reg.stage}</Tag>
              <Tag>{reg.talkKind}</Tag>
              {reg.stage === 'registered' && <Tag>あと {until} 日</Tag>}
            </div>
            <div className="text-[10px] text-lab-muted mt-1">
              評判+{def.baseReputation} / RP+{def.rpGain}
              {def.requiresEnglish ? ` / 英Lv${def.requiresEnglish}` : ''}
            </div>
            {reg.stage === 'completed' && <div className="mt-1 text-[11px] text-lab-good">✓ 参加完了</div>}
          </Card>
        );
      })}
    </div>
  );
}
