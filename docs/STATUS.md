# 開発状況 (STATUS)

最終更新: P6 + UI整理リファクタ完了 / P7 (UI仕上げ・チュートリアル・サウンド・i18n) は保留。
原計画の全体像は [PLAN.md](./PLAN.md) を参照。

---

## 1. フェーズ別 進捗サマリ

| Phase | 内容 | 状態 |
|---|---|---|
| **P0** セットアップ | Vite / React 18 / TypeScript / Tailwind / Zustand / Vitest | ✅ |
| **P1** コアループMVP | 1日ターン進行、実験、RP/資金、機器購入、セーブ/ロード | ✅ |
| **P2** プロジェクト/論文 | 新規プロジェクト、自動stage進行、執筆→投稿→査読→Revision→受理 | ✅ |
| **P3** グラント/学生 | 申請書執筆/採択、学生雇用、指導、毎日の自動実験 | ✅ |
| **P4** 雑務/イベント/学会 | ランダムイベント13種、モーダル選択肢 | ✅ |
| **P5** キャリア/共同研究/自動化 | 昇進、SOP、機器修理、ロボット並列SOP、Collaboration | ✅ |
| **P6** コンテンツ拡充 | 全データファイルに大量追加 | ✅ |
| **P6.5** UI整理リファクタ | ActionPanel タブ化、TaskPanel 新設、SceneNav オーバーレイ、レスポンシブ対応 | ✅ |
| **P7** 仕上げ | UIアセット差し替え、チュートリアル、サウンド、i18n、バランス調整 | ⏸ 保留 |

---

## 2. 今プレイできること

1. **大学院生** として開始 (Day 1, 時間3, $500)
2. **ラボ**で 11 プロトコルから選んで実験 (PCR/WB/NGS/MD/MLなど)
3. **居室**で論文執筆 → ジャーナル投稿 → Major/Minor Revision 対応 → 再投稿 → 受理
4. **グラント** 10種に応募 → 28日後採否、採択で大型資金
5. **進行ボード (右サイド)** で学生10候補から雇用、4 共同研究オファーを受諾、1on1 指導
6. **学会会場**で 4 学会 × ポスター/口頭 申込 → 14日後自動完了
7. **機器 13 種**を購入 (シーケンサ・LC-MS・液体ハンドリングロボット(3並列SOP)・Biomek(5並列)等)
8. **SOP化** で機器を自動運転 → プレイヤー不要で毎ターン実験
9. **機器コンディション**自然劣化 → 「修理」アクションで回復
10. **昇進** 6 段階 (院生→ポスドク→助教→准教授→教授→拠点リーダー)
11. **ランダムイベント 13 種**が日次抽選で発火 (機器故障/招待講演/スクープ/学生不調/停電/コンタミ等)
12. **共同研究**で毎ターン RP+データ貢献、満了で評判+資金+共著論文品質ボーナス

---

## 3. コンテンツ件数

| 種別 | 件数 | 場所 |
|---|---|---|
| 実験プロトコル | **11** (ウェット7 / ドライ4) | [data/protocols.ts](../src/domain/data/protocols.ts) |
| 機器 | **13** (ウェット8 / ドライ4 / ロボット2) | [data/equipments.ts](../src/domain/data/equipments.ts) |
| ジャーナル | **7** | [data/journals.ts](../src/domain/data/journals.ts) |
| グラント | **10** (学内〜NIH R01) | [data/grants.ts](../src/domain/data/grants.ts) |
| 学生候補 | **10** (B4〜ポスドク) | [data/students.ts](../src/domain/data/students.ts) |
| 共同研究先 | **4** (国内/海外/産業) | [data/collaborators.ts](../src/domain/data/collaborators.ts) |
| 学会 | **4** (学内〜ゴードン会議) | [data/conferences.ts](../src/domain/data/conferences.ts) |
| ランダムイベント | **13** | [data/events.ts](../src/domain/data/events.ts) |
| キャリア昇進ルート | 5 (6 tier間) | [data/careers.ts](../src/domain/data/careers.ts) |

---

## 4. テスト状況

| | 件数 |
|---|---|
| テストファイル | **14** |
| テスト | **48 passed** |

主な観点:
- ドメイン純粋性 (`advanceTurn` で input 不変)
- 確率計算・スコアリング
- セーブ/ロード ラウンドトリップ
- データ整合性 (ID一意・スキル名検証・件数下限)

```sh
npm test            # 1回
npm run test:watch  # 監視モード
```

---

## 5. UI構成

### 5.1 レイアウト
```
┌─ HUD ───────────────────────┐
│  日付・リソース ・ [📋 進行] │ ← モバイル時はトグルボタン
├─ SceneArea ─────────────────┤
│   背景 + キャラ立ち絵        │ ← SceneNav (右端オーバーレイ)
│                       [🧪]  │   実験室/居室/学会/自宅/1日終了
│                       [💻]  │
│                       [🌙]  │
├─ NarrationArea ─────────────┤
├─ ActionPanel (高さ固定タブ) ┤
└─────────────────────────────┘
            ↑
     TaskPanel (進行ボード)
     md+: 常時サイドバー
     mobile: ドロワー (📋 でトグル)
```

### 5.2 ActionPanel (今日のアクション)
- シーン依存タブ: 実験/計算/自動化/機器/計画/申請/学会/休憩/昇進
- 高さ固定 (mobile h-60 / pc h-72)、内部スクロール
- 各ボタンは `h-[88px] overflow-hidden`、disabledReason 1行 truncate

### 5.3 TaskPanel (進行ボード)
- 7タブ: ステータス/プロジェクト/論文/グラント/学生/共同/学会
- タブには件数バッジ、要対応はwarn色バッジ
- **状態あり**のもの (論文/グラント/学生/共同/学会) はここでインライン操作
  - 論文: 執筆 / 投稿先選択 (展開式ジャーナルカード, 採択率色付き) / Revision対応 / 再投稿
  - グラント: 執筆を進める / 提出
  - 学生: 在籍カードに [指導]、採用候補カードに [採用する]
  - 共同: 進行中カードに残日数、オファーカードに [受諾する]

### 5.4 SceneNav (移動・1日終了オーバーレイ)
- SceneArea 右端に縦並びで常駐
- 4シーン (実験室/居室/学会会場/自宅) + 1日終了

### 5.5 レスポンシブ
`md:` (768px) を境界に切替:
- TaskPanel: md未満は fixed ドロワー + backdrop、md以上は常時サイドバー
- HUD: flex-wrap で2段化、一部 stat を `hidden sm:flex` で隠す
- SceneNav: ボタンが `w-11 → sm:w-14`
- ActionPanel: 高さが `h-60 → sm:h-72`
- UI状態は [uiStore.ts](../src/store/uiStore.ts) (ゲーム本体stateと独立)

---

## 6. ファイルマップ

```
src/
├── main.tsx
├── App.tsx
├── domain/                         # 純粋TS層 (React/DOM非依存)
│   ├── types.ts                    # 全体の型定義
│   ├── rng.ts                      # Mulberry32 シードRNG
│   ├── data/                       # 全コンテンツ定義
│   │   ├── protocols.ts            # 実験プロトコル
│   │   ├── equipments.ts           # 機器
│   │   ├── journals.ts             # ジャーナル
│   │   ├── grants.ts               # グラント
│   │   ├── students.ts             # 学生候補
│   │   ├── collaborators.ts        # 共同研究先
│   │   ├── conferences.ts          # 学会
│   │   ├── careers.ts              # キャリア tier 定義
│   │   └── events.ts               # ランダムイベント
│   ├── actions/                    # ユーザ/システムアクション (純粋関数)
│   │   ├── runExperiment.ts
│   │   ├── writePaper.ts / submitPaper.ts / revisePaper.ts
│   │   ├── projects.ts / grants.ts / students.ts
│   │   ├── conferences.ts / careers.ts
│   │   ├── sops.ts / repair.ts / buyEquipment.ts
│   │   ├── collaborations.ts / events.ts / rest.ts
│   ├── rules/
│   │   └── skills.ts               # スキル/XPルール
│   └── engine/
│       ├── createState.ts          # 初期State (SAVE_VERSION = 5)
│       ├── effects.ts              # Effect適用/ログ/ナレーション
│       └── advanceTurn.ts          # 1日進める総合関数
├── store/
│   ├── gameStore.ts                # Zustand: ドメイン関数のアダプタ + persist
│   ├── uiStore.ts                  # UI一時状態 (taskPanelOpen)
│   └── migrations/index.ts         # セーブ互換性 (v4→v5)
└── ui/
    ├── hooks/
    │   └── useActionDispatch.ts    # AnyAction → store dispatch
    ├── layout/
    │   ├── GameShell.tsx           # 全体枠
    │   ├── HUD.tsx                 # 上部リソース + モバイル進行ボタン
    │   ├── SceneArea.tsx           # 中央キャラ表示 + SceneNav
    │   ├── SceneNav.tsx            # 右端オーバーレイ (移動・終了)
    │   ├── NarrationArea.tsx
    │   ├── ActionPanel.tsx         # シーン依存タブ
    │   ├── TaskPanel.tsx           # 進行ボード (ドロワー対応)
    │   └── EventModal.tsx
    └── presenters/
        └── selectors.ts            # ドメイン → ViewModel
tests/domain/                       # 14テストファイル
docs/                               # PLAN.md, STATUS.md
```

---

## 7. セーブデータ

- localStorage キー: `lab-tycoon-save`
- 現在の `SAVE_VERSION = 5` (v4→v5 で `scene='meeting'` を `office` に変換)
- バージョン不整合は [migrations/index.ts](../src/store/migrations/index.ts) で初期化される

---

## 8. 開発コマンド

| コマンド | 用途 |
|---|---|
| `npm run dev` | Vite dev サーバ (http://localhost:5173) |
| `npm run typecheck` | TypeScript 型チェックのみ |
| `npm test` | Vitest 1回 |
| `npm run test:watch` | Vitest watch |
| `npm run build` | 本番ビルド (gzip 約80KB) |
| `npm run build:pages` | GitHub Pages 用 (base パス設定) |
| `npm run preview` | ビルド成果物をローカル再生 |

---

## 9. 未実装 (P7 候補) と既知の限界

### P7 で予定 (現在保留)
- **UIアセット**: 立ち絵・背景画像をAI生成/委託で用意し、SceneArea をソシャゲ風に差し替え
- **チュートリアル**: 新規プレイヤー向け導入フロー
- **サウンド/BGM/SE**
- **i18n**: 英語化 (i18next 想定)
- **バランス調整スクリプト**: `scripts/balance-sim.ts` でN日自動プレイ→CSV出力

### 未実装で気付きやすい点
- 共著者表示 (学生筆頭/PI筆頭の論文区別) — UI未実装
- 雑務メーターの可視化 (admin-burdenをイベント抽選率にしか反映していない)
- スキルツリー/パークの解放UI (XP/レベルアップは動作、解放アクションが無い)
- 学生卒業/昇進フロー (在籍は管理できるが進路イベント無し)
- 機器のスペース上限超過時の購入制限 (現状は warning のみ)

### バランス調整が必要そうな箇所
- 序盤の RP獲得カーブ
- グラント採択率 (評判 minimal でも結構通る印象)
- 学生の自動実験コストと貢献のバランス
- SOP の試薬40%割引が強すぎないか
