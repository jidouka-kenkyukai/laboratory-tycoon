import type { RandomEventDef } from '../types';

export const EVENTS: RandomEventDef[] = [
  {
    id: 'equip-breakdown',
    title: '機器故障',
    icon: '⚠️',
    category: 'lab',
    weight: 10,
    predicate: (s) => s.lab.equipments.length > 0,
    narration:
      '朝、ラボに行くと「ピーピー」とエラー音。一番よく使う機器が故障している。修理を呼ぶしかない。',
    choices: [
      {
        id: 'repair',
        label: '修理を依頼 ($300)',
        effects: [
          { kind: 'funds', amount: -300 },
          { kind: 'mental', amount: -3 },
        ],
        log: '修理を依頼した。明日には直るだろう。',
      },
      {
        id: 'workaround',
        label: '自力で何とかする',
        description: '時間と集中力を使う。',
        effects: [
          { kind: 'timeSlot', amount: -1 },
          { kind: 'focus', amount: -15 },
          { kind: 'mental', amount: -5 },
          { kind: 'skillXp', skill: 'experiment', amount: 8 },
        ],
        log: '自力で応急処置した。スキルが少し上がった。',
      },
    ],
  },
  {
    id: 'invited-talk',
    title: '招待講演オファー',
    icon: '🎤',
    category: 'career',
    weight: 4,
    predicate: (s) => s.resources.reputation >= 15,
    narration:
      '隣分野の研究会から招待講演のオファー。準備は大変だが、コミュニティで顔を売る絶好の機会だ。',
    choices: [
      {
        id: 'accept',
        label: '受ける',
        effects: [
          { kind: 'reputation', amount: 10 },
          { kind: 'mental', amount: -8 },
          { kind: 'skillXp', skill: 'presentation', amount: 20 },
        ],
        log: '招待講演を受諾。スライド作りが大変そう…',
      },
      {
        id: 'decline',
        label: '丁重に断る',
        effects: [{ kind: 'reputation', amount: -1 }],
        log: '今回は見送り。次の機会に。',
      },
    ],
  },
  {
    id: 'scoop',
    title: '競合グループがスクープ',
    icon: '😱',
    category: 'paper',
    weight: 6,
    predicate: (s) => s.projects.some((p) => p.stage !== 'accepted' && p.stage !== 'rejected'),
    narration:
      '朝のbioRxivチェックで凍りつく。やろうとしていたプロジェクトとほぼ同じ内容が、別グループから先にプレプリント公開されている。',
    choices: [
      {
        id: 'pivot',
        label: '方針転換 (差別化を図る)',
        effects: [
          { kind: 'mental', amount: -10 },
          { kind: 'skillXp', skill: 'analysis', amount: 8 },
        ],
        log: '方針を整理し直す。負けない切り口を探す。',
      },
      {
        id: 'rush',
        label: '突貫で論文化を急ぐ',
        effects: [
          { kind: 'focus', amount: -20 },
          { kind: 'mental', amount: -15 },
        ],
        log: 'とにかく書く。寝る時間が削られる。',
      },
    ],
  },
  {
    id: 'review-request',
    title: '査読依頼',
    icon: '✉️',
    category: 'social',
    weight: 8,
    predicate: (s) => s.resources.publications >= 1,
    narration: '見知らぬエディタからの査読依頼メール。締切は2週間後。',
    choices: [
      {
        id: 'accept',
        label: '引き受ける',
        effects: [
          { kind: 'reputation', amount: 3 },
          { kind: 'timeSlot', amount: -1 },
          { kind: 'skillXp', skill: 'writing', amount: 6 },
        ],
        log: '査読を引き受けた。時間が消えるが、評判には良い。',
      },
      {
        id: 'decline',
        label: '今は無理',
        effects: [{ kind: 'reputation', amount: -1 }],
        log: '丁重にお断りメール。',
      },
    ],
  },
  {
    id: 'student-down',
    title: '学生の不調',
    icon: '🤒',
    category: 'student',
    weight: 6,
    predicate: (s) => s.students.length > 0,
    narration:
      '学生の一人が、最近ずっと元気がない。今朝、研究室に来ていない。声をかけるべきかも。',
    choices: [
      {
        id: 'care',
        label: 'ゆっくり話を聞く',
        effects: [
          { kind: 'timeSlot', amount: -1 },
          { kind: 'mental', amount: -3 },
          { kind: 'skillXp', skill: 'management', amount: 12 },
        ],
        log: '時間を取って話を聞いた。少しは助けになっただろうか。',
      },
      {
        id: 'ignore',
        label: '今は様子を見る',
        effects: [{ kind: 'reputation', amount: -3 }],
        log: '見て見ぬふりは、後で響くかもしれない。',
      },
    ],
  },
  {
    id: 'admin-burden',
    title: '雑務の波',
    icon: '📥',
    category: 'social',
    weight: 7,
    narration:
      '安全教育受講・倫理申請更新・教授会のメール返信が同時に来ている。今日中に対応が必要なものもある。',
    choices: [
      {
        id: 'handle',
        label: '片付ける',
        effects: [
          { kind: 'timeSlot', amount: -1 },
          { kind: 'mental', amount: -6 },
          { kind: 'skillXp', skill: 'admin', amount: 8 },
        ],
        log: '雑務を1時間で片付けた。妙な達成感はあった。',
      },
      {
        id: 'postpone',
        label: '後回し',
        effects: [
          { kind: 'reputation', amount: -2 },
          { kind: 'mental', amount: -2 },
        ],
        log: '後回しにした。罪悪感が薄く積もる。',
      },
    ],
  },
  {
    id: 'collaboration-offer',
    title: '共同研究のオファー',
    icon: '🤝',
    category: 'career',
    weight: 3,
    predicate: (s) => s.resources.reputation >= 25,
    narration: '海外グループから共同研究の打診メール。彼らは強力な機器を持っているらしい。',
    choices: [
      {
        id: 'accept',
        label: '受ける',
        effects: [
          { kind: 'reputation', amount: 6 },
          { kind: 'rp', amount: 30 },
          { kind: 'mental', amount: -5 },
        ],
        log: '共同研究合意。新しいネタが増えそうだ。',
      },
      {
        id: 'decline',
        label: '今回は見送り',
        effects: [],
        log: '余裕が無いので断った。',
      },
    ],
  },
];

// --- P6 追加イベント ---
EVENTS.push(
  {
    id: 'media-interview',
    title: '記者からの取材依頼',
    icon: '📰',
    category: 'social',
    weight: 3,
    predicate: (s) => s.resources.publications >= 3,
    narration: '一般紙の科学記者から研究内容について取材を受けたいとメール。',
    choices: [
      {
        id: 'accept',
        label: '受ける',
        effects: [
          { kind: 'reputation', amount: 4 },
          { kind: 'timeSlot', amount: -1 },
        ],
        log: '取材対応。一般向けに翻訳する作業は学びが多い。',
      },
      {
        id: 'decline',
        label: '断る',
        effects: [],
        log: '今回は遠慮した。誤解されるリスクもある。',
      },
    ],
  },
  {
    id: 'power-outage',
    title: '停電発生',
    icon: '🔌',
    category: 'lab',
    weight: 5,
    predicate: (s) => s.lab.equipments.length >= 2,
    narration: '建物全体で停電。培養細胞は持つだろうか…冷凍庫は…',
    choices: [
      {
        id: 'rescue',
        label: '至急かけつける',
        effects: [
          { kind: 'mental', amount: -8 },
          { kind: 'focus', amount: -10 },
        ],
        log: '駆けつけて非常電源を確保した。被害最小限。',
      },
      {
        id: 'fate',
        label: '運に任せる',
        effects: [{ kind: 'mental', amount: -3 }],
        log: '何も出来なかった。明日確認しよう。',
      },
    ],
  },
  {
    id: 'sample-contamination',
    title: 'サンプル汚染',
    icon: '🦠',
    category: 'lab',
    weight: 5,
    predicate: (s) => s.lab.equipments.some((_) => true),
    narration: '培養細胞のコンタミ発覚。原因切り分けと洗浄が必要だ。',
    choices: [
      {
        id: 'reset',
        label: '全てやり直す',
        effects: [
          { kind: 'timeSlot', amount: -1 },
          { kind: 'mental', amount: -6 },
        ],
        log: '全プレートを廃棄して再起。手痛い遅れ。',
      },
      {
        id: 'salvage',
        label: '一部を救出',
        effects: [{ kind: 'mental', amount: -3 }, { kind: 'focus', amount: -8 }],
        log: '使えそうな分だけ救出。完璧ではないが時間は短縮。',
      },
    ],
  },
  {
    id: 'committee',
    title: '学部委員会の招集',
    icon: '🏛️',
    category: 'social',
    weight: 6,
    predicate: (s) => s.player.tier !== 'graduate',
    narration: '学部委員会から参加要請メール。3時間拘束、議題は教務関係。',
    choices: [
      {
        id: 'attend',
        label: '出席',
        effects: [
          { kind: 'timeSlot', amount: -1 },
          { kind: 'skillXp', skill: 'admin', amount: 8 },
        ],
        log: '出席。話の半分は内職で論文を読む。',
      },
      {
        id: 'send-sub',
        label: '代理を立てる',
        effects: [{ kind: 'reputation', amount: -2 }],
        log: '代理依頼。何度も使えない手だ。',
      },
    ],
  },
  {
    id: 'preprint-citation',
    title: 'プレプリントが引用された',
    icon: '⭐',
    category: 'career',
    weight: 3,
    predicate: (s) => s.resources.publications >= 1,
    narration: 'arXiv/bioRxiv に上げていたプレプリントが、有名グループの論文で引用されているのを発見。',
    choices: [
      {
        id: 'celebrate',
        label: '小さく祝う',
        effects: [
          { kind: 'mental', amount: 6 },
          { kind: 'reputation', amount: 3 },
        ],
        log: '少しコーヒーを贅沢にした。',
      },
    ],
  },
  {
    id: 'safety-audit',
    title: '安全監査',
    icon: '🛡️',
    category: 'lab',
    weight: 4,
    predicate: (s) => s.lab.equipments.length >= 3,
    narration: '突然の安全監査。倉庫の整理が必要。',
    choices: [
      {
        id: 'prep',
        label: 'しっかり対応',
        effects: [
          { kind: 'timeSlot', amount: -1 },
          { kind: 'skillXp', skill: 'admin', amount: 10 },
          { kind: 'reputation', amount: 2 },
        ],
        log: '監査クリア。書類整備の効果は地味だが効く。',
      },
      {
        id: 'wing-it',
        label: 'その場で誤魔化す',
        effects: [
          { kind: 'reputation', amount: -3 },
          { kind: 'mental', amount: -4 },
        ],
        log: '指摘事項が出てしまった。来年は事前準備しよう。',
      },
    ],
  },
);

export const EVENT_BY_ID = new Map(EVENTS.map((e) => [e.id, e]));
