// =============================================================================
// Core IDs
// =============================================================================
export type ProtocolId = string;
export type EquipmentId = string;
export type EquipmentInstanceId = string;
export type ProjectId = string;
export type PaperId = string;
export type JournalId = string;
export type StudentId = string;
export type GrantId = string;
export type EventId = string;
export type PerkId = string;
export type SceneId =
  | 'lab'
  | 'office'
  | 'home'
  | 'conference'
  | 'classroom';

// =============================================================================
// Skills
// =============================================================================
export type SkillId =
  | 'experiment' // 実験技術
  | 'analysis'   // データ解析
  | 'writing'    // 執筆
  | 'english'    // 英語
  | 'presentation' // プレゼン
  | 'management' // マネジメント
  | 'admin';     // ラボ運営

export type Skills = Record<SkillId, { level: number; xp: number }>;

// =============================================================================
// Resources / Stats
// =============================================================================
export type DailyResources = {
  timeSlots: number;     // 今日残っている行動枠
  maxTimeSlots: number;  // 今日の枠の上限
  focus: number;         // 0-100
  mental: number;        // 0-100
};

export type PersistentResources = {
  funds: number;          // 研究資金
  researchPoints: number; // RP
  reputation: number;     // 評判
  publications: number;   // 累計論文数
  hIndex: number;         // 簡易H-index
};

export type CareerTier =
  | 'graduate'   // 院生
  | 'postdoc'
  | 'assistant'  // 助教
  | 'associate'  // 准教授
  | 'professor'
  | 'leader';    // 拠点リーダー

// =============================================================================
// Domain: Equipment / Protocol / Project / Paper
// =============================================================================
export type Category = 'wet' | 'dry';

export type EquipmentDef = {
  id: EquipmentId;
  name: string;
  category: Category;
  icon: string;
  cost: number;
  description: string;
  /** どんな実験タグに効くか */
  tags: string[];
  /** 機器導入による効果 */
  bonuses: {
    successRate?: number;     // +%
    qualityMultiplier?: number; // ×
    timeMultiplier?: number;    // × (0.8で20%短縮)
  };
  /** 自動化レベル: 高いと学生/プレイヤー不要 */
  automation: 'manual' | 'semi-auto' | 'auto';
  spaceUsage: number;
  upkeep: number; // 毎月の維持費
  /** 同時にセットできる SOP の数。省略時は 1。 */
  parallelSlots?: number;
};

export type EquipmentInstance = {
  instanceId: EquipmentInstanceId;
  defId: EquipmentId;
  condition: number;      // 0-100, 劣化で下がる
  acquiredOnDay: number;
};

export type Effect =
  | { kind: 'rp'; amount: number }
  | { kind: 'funds'; amount: number }
  | { kind: 'reputation'; amount: number }
  | { kind: 'mental'; amount: number }
  | { kind: 'focus'; amount: number }
  | { kind: 'skillXp'; skill: SkillId; amount: number }
  | { kind: 'timeSlot'; amount: number }
  | { kind: 'progressProject'; projectId: ProjectId; amount: number }
  | { kind: 'addExperimentData'; projectId?: ProjectId; quality: number; reproducibility: number };

export type ProtocolDef = {
  id: ProtocolId;
  name: string;
  category: Category;
  icon: string;
  tags: string[];
  description: string;
  /** このプロトコルを回すのに必要な時間スロット数 */
  timeSlots: number;
  /** 集中力消費 */
  focusCost: number;
  /** メンタル消費 */
  mentalCost: number;
  /** 試薬コスト ($) */
  costFunds: number;
  /** 基礎成功率 (0-1) */
  baseSuccessRate: number;
  /** 必要スキル (該当スキルが低いと成功率に影響) */
  primarySkill: SkillId;
  /** 必要機器タグ (ラボにこのタグの機器があれば bonus 適用) */
  preferredEquipmentTags?: string[];
  /** 成功時の効果 */
  successEffects: Effect[];
  /** 失敗時の効果 */
  failureEffects: Effect[];
};

export type ExperimentDataPoint = {
  id: string;
  projectId?: ProjectId;
  protocolId: ProtocolId;
  day: number;
  quality: number;         // 0-100
  reproducibility: number; // 0-100
  success: boolean;
};

export type ProjectStage =
  | 'planning'
  | 'preliminary'
  | 'main'
  | 'analysis'
  | 'writing'
  | 'submitted'
  | 'revising'
  | 'accepted'
  | 'rejected';

export type Project = {
  id: ProjectId;
  name: string;
  tags: string[];          // 'wet', 'dry', 'basic', 'applied', ...
  stage: ProjectStage;
  progress: number;        // 0-100 (各stageでリセットしない、連続累積)
  startedOnDay: number;
  dataPoints: ExperimentDataPoint[];
  paperId?: PaperId;
};

export type JournalDef = {
  id: JournalId;
  name: string;
  impactFactor: number;
  acceptanceRateBase: number; // 0-1
  reputationGain: number;
  rpGain: number;
};

export type PaperStage =
  | 'drafting'
  | 'submitted'
  | 'underReview'
  | 'majorRevision'
  | 'minorRevision'
  | 'accepted'
  | 'rejected';

export type Paper = {
  id: PaperId;
  title: string;
  projectId: ProjectId;
  journalId?: JournalId;
  stage: PaperStage;
  qualityScore: number; // 0-100
  daysInStage: number;
};

// =============================================================================
// Scene / View Model abstraction (UI-agnostic)
// =============================================================================
/** ドメインから出す「画面の文脈」。UIはこれを見て描画 */
export type SceneContext = {
  sceneId: SceneId;
  /** シーンに居る人物のID列。立ち絵候補。 */
  presentCharacters: string[];
  /** プレイヤーへのナレーション/状況テキスト */
  narration: string;
};

/** UI 描画用のアクション記述。テキストUIでもカードUIでも同じ */
export type ActionDescriptor = {
  id: string;
  label: string;
  icon: string;
  description: string;
  disabledReason?: string;
  /** 効果プレビュー (UI に出す用、純粋表示) */
  effectPreview?: string[];
};

// =============================================================================
// Grant (申請書)
// =============================================================================
export type GrantTier = 'small' | 'mid' | 'large' | 'mega';

export type GrantDef = {
  id: GrantId;
  name: string;
  tier: GrantTier;
  icon: string;
  description: string;
  /** 申請書を完成させるのに必要な「執筆ポイント」総量 */
  writingRequired: number;
  /** 採択時の総額 (一括) */
  award: number;
  /** 採択率の基準 */
  baseAcceptanceRate: number;
  /** 必要評判 (最低) */
  minReputation: number;
  /** 必要論文数 (最低) */
  minPublications: number;
};

export type GrantApplicationStage =
  | 'drafting'      // 執筆中
  | 'submitted'     // 投稿後、審査待ち
  | 'awarded'       // 採択
  | 'declined';     // 不採択

export type GrantApplication = {
  id: string;
  defId: GrantId;
  stage: GrantApplicationStage;
  writingProgress: number; // 0-requiredまで
  startedOnDay: number;
  daysInStage: number;
};

// =============================================================================
// Student / Staff
// =============================================================================
export type StudentRank = 'B4' | 'M1' | 'M2' | 'D1' | 'D2' | 'D3' | 'postdoc';

export type Student = {
  id: StudentId;
  name: string;
  rank: StudentRank;
  /** 実験スキル 1-10 */
  skill: number;
  /** 独立性 0-100, 高いと指示なしでも上手く回せる */
  independence: number;
  /** モチベ 0-100 */
  motivation: number;
  /** メンタル 0-100 */
  mental: number;
  /** 専門タグ ('wet' / 'dry' / 'ml' / ...) */
  specialties: string[];
  /** 担当プロジェクトID (なければ手すき) */
  assignedProjectId?: ProjectId;
  /** 雇用日 */
  joinedOnDay: number;
  /** 給与 (月次) */
  salary: number;
};

// =============================================================================
// Conference (学会)
// =============================================================================
export type ConferenceScale = 'local' | 'national' | 'international';
export type ConferenceTalkKind = 'poster' | 'oral' | 'invited';

export type ConferenceDef = {
  id: string;
  name: string;
  scale: ConferenceScale;
  icon: string;
  description: string;
  /** 参加費 + 旅費 */
  cost: number;
  /** 拘束日数 (会期中はその分時間スロット消費しつつ自分の研究時間が無くなる) */
  daysSpent: number;
  /** 発表で得られる評判 (種別補正前) */
  baseReputation: number;
  /** RP獲得 (アイデア・知見) */
  rpGain: number;
  /** 英語スキル要求 (国際学会) */
  requiresEnglish?: number;
  /** プレゼンスキル要求 */
  requiresPresentation?: number;
};

export type ConferenceRegistrationStage =
  | 'registered'  // 申込済
  | 'attending'   // 会期中
  | 'completed'   // 完了
  | 'rejected';   // 不採択 (発表枠取れなかった等)

export type ConferenceRegistration = {
  id: string;
  defId: string;
  talkKind: ConferenceTalkKind;
  stage: ConferenceRegistrationStage;
  /** 申込日 */
  registeredOnDay: number;
  /** 会期開始日 (申込からN日後) */
  startsOnDay: number;
  /** 関連プロジェクト (発表ネタ) */
  projectId?: ProjectId;
};

// =============================================================================
// SOP (機器の自動実行設定)
// =============================================================================
export type SOP = {
  id: string;
  /** 対象機器の instanceId */
  equipmentInstanceId: EquipmentInstanceId;
  /** どのプロトコルを回すか */
  protocolId: ProtocolId;
  /** 担当プロジェクト */
  projectId?: ProjectId;
  active: boolean;
  /** 作成日 */
  createdOnDay: number;
};

// =============================================================================
// Promotion (昇進)
// =============================================================================
export type PromotionCriteria = {
  fromTier: CareerTier;
  toTier: CareerTier;
  minPublications: number;
  minReputation: number;
  minHIndex: number;
  minGrantsAwarded: number;
};

// =============================================================================
// Collaboration (共同研究)
// =============================================================================
export type CollaboratorDef = {
  id: string;
  name: string;
  affiliation: string;
  icon: string;
  specialties: string[];
  /** 受諾に必要な評判 */
  minReputation: number;
  /** 毎ターンの貢献度 (相手側からのデータ/RP) */
  contributionPerTurn: {
    rp?: number;
    /** プロジェクトに加わるデータ品質 */
    dataQuality?: number;
    /** 月次の維持コスト (打合せの経費) */
    monthlyCost?: number;
  };
  /** 完結時 (一定日数経過) のボーナス */
  completionBonus: {
    reputation?: number;
    funds?: number;
    coAuthoredPaperQuality?: number;
  };
  /** デフォルト共同期間 (日) */
  defaultDurationDays: number;
};

export type CollaborationStage = 'active' | 'completed' | 'declined';

export type Collaboration = {
  id: string;
  defId: string;
  stage: CollaborationStage;
  startedOnDay: number;
  endsOnDay: number;
  projectId?: ProjectId;
};

// =============================================================================
// Random Event
// =============================================================================
export type RandomEventDef = {
  id: EventId;
  title: string;
  icon: string;
  category: 'lab' | 'paper' | 'student' | 'career' | 'social';
  /** 発火条件 */
  predicate?: (s: GameState) => boolean;
  /** 重み (高いほど出やすい) */
  weight: number;
  /** 状況テキスト */
  narration: string;
  /** プレイヤーが選べる選択肢。1つだけなら自動。 */
  choices: EventChoice[];
};

export type EventChoice = {
  id: string;
  label: string;
  description?: string;
  effects: Effect[];
  /** ログテキスト */
  log?: string;
};

/** 現在発生中のイベント (UIで表示中) */
export type PendingEvent = {
  defId: EventId;
  day: number;
};

// =============================================================================
// Log / Event
// =============================================================================
export type LogEntry = {
  id: string;
  day: number;
  kind: 'info' | 'good' | 'warn' | 'bad';
  text: string;
};

// =============================================================================
// Game State (root)
// =============================================================================
export type GameState = {
  /** セーブデータバージョン */
  version: number;
  /** 経過日数 (Day 1 から開始) */
  day: number;
  /** 現在のシーン */
  scene: SceneId;

  player: {
    name: string;
    tier: CareerTier;
    skills: Skills;
  };

  daily: DailyResources;
  resources: PersistentResources;

  lab: {
    /** 設置済み機器 */
    equipments: EquipmentInstance[];
    spaceCapacity: number;
  };

  projects: Project[];
  papers: Paper[];

  /** 進行中のグラント申請書 / 採択済み */
  grants: GrantApplication[];

  /** 雇用済みの学生・スタッフ */
  students: Student[];

  /** 学会の申込/参加 */
  conferences: ConferenceRegistration[];

  /** 機器の自動運転設定 */
  sops: SOP[];

  /** 進行中・完了済の共同研究 */
  collaborations: Collaboration[];

  /** 採択済みグラント数 (昇進判定用、簡易キャッシュ) */
  grantsAwardedCount: number;

  /** 現在表示すべきイベント (プレイヤーが選択肢を選ぶまで残る) */
  pendingEvent?: PendingEvent;

  /** プレイヤー視点のログ。古いものは適宜捨てる */
  log: LogEntry[];

  /** 直近のイベント結果説明など、ナレーション専用 */
  narration: string;

  /** 端末側の決定論用シード (将来) */
  rngSeed: number;
};
