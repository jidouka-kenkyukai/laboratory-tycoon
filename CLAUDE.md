# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業するときの規律ガイド。
ゲームの全体像は [docs/PLAN.md](./docs/PLAN.md)、現状は [docs/STATUS.md](./docs/STATUS.md) を参照。

---

## 一行サマリ
研究者生活をテーマにした日次ターン制タイクーンゲーム。Web (TypeScript + React + Zustand)。
データ駆動 + ドメイン/UI分離で長期拡張を担保している。**この規律を絶対に崩さない。**

---

## アーキテクチャの絶対ルール

### 3層分離
```
UI (React)  →  State (Zustand)  →  Domain (純粋TS)
```

| ルール | 理由 |
|---|---|
| **ドメイン層は React/DOM に一切依存しない** | Nodeでテスト可・将来のUI差し替え (ソシャゲ風レイアウト) のため |
| **状態変更は純粋関数 `(state, input) => newState`** | Immer (`produce`) を活用、入力Stateを変更しない |
| **Zustandはドメイン関数を呼ぶアダプタに徹する** | ストアに業務ロジックを書かない |
| **UIはドメインを直接importしない** | `ui/presenters/selectors.ts` の `ActionDescriptor` 経由 |

### UI差し替え準備 (重要)
将来ソシャゲ風 (中央キャラ + 背景 + 上下UI) に差し替える。今の `layout/SceneArea.tsx` と `layout/ActionPanel.tsx` だけを差し替えるだけで済むよう、**ドメイン/プレゼンタは絶対に触らない構造を保つ**。

---

## コンテンツ追加は「ファイル末尾に push するだけ」

新プロトコル/機器/学生/グラント/イベント/学会/共同研究先/ジャーナルは、対応する `src/domain/data/*.ts` に push するだけで動く。

```ts
// 例: 新プロトコル追加
PROTOCOLS.push({
  id: 'my-new-protocol',  // 一意のID
  name: '...',
  category: 'wet' | 'dry',
  // ... ProtocolDef の全フィールドを埋める (型補完を活用)
});
```

**やってはいけない**:
- ルール側 (`actions/`, `engine/`, `rules/`) を触ってコンテンツ追加する (ルール側は汎用処理だけ)
- 新しい型を作って既存型と並立させる (まずは既存型を拡張できないか考える)
- ID重複 (`tests/domain/contentIntegrity.test.ts` が落ちる)

---

## よくある作業の手順

### 「新しい実験を追加して」
1. [src/domain/data/protocols.ts](./src/domain/data/protocols.ts) に `PROTOCOLS.push({...})`
2. `npm test` でID重複や型ミスを確認
3. `npm run dev` でラボシーンに自動で出る (presenter が拾う)

### 「新しいアクションを追加して」 (push では済まない場合)
1. `src/domain/actions/myAction.ts` に純粋関数を作る (引数 state, 戻り値 state)
2. `src/domain/types.ts` で必要なら新エンティティ型を追加
3. `src/store/gameStore.ts` に `doMyAction` を生やしてドメイン関数を呼ぶ
4. `src/ui/presenters/selectors.ts` に `MyAction` を追加し `selectActions` に登場条件を書く
5. `src/ui/layout/ActionPanel.tsx` の `handle` switch に case を追加
6. テストを `tests/domain/myAction.test.ts` に書く

### 「新しい場面 (シーン) を追加して」
1. `src/domain/types.ts` の `SceneId` に追加
2. `src/ui/presenters/selectors.ts` の `SCENE_META` に背景クラスを追加
3. `selectActions` でそのシーン用のアクションを返す
4. `selectPresentCharacters` でそのシーンに居るキャラを返す
5. `SCENE_ORDER` に追加すると [SceneNav](src/ui/layout/SceneNav.tsx) の移動ボタンに自動で出る

### 「セーブ互換を壊すフィールド追加」
1. `src/domain/types.ts` の `GameState` を拡張
2. `src/domain/engine/createState.ts` の `SAVE_VERSION` を **bump** + 初期値を追加
3. 既存セーブは migration で初期化される (現状は単純破棄)。長期保存を望むなら `src/store/migrations/index.ts` に旧→新変換を書く

---

## 開発コマンド

```sh
npm run dev         # Vite dev (http://localhost:5173)
npm run typecheck   # tsc --noEmit
npm test            # Vitest 1回
npm run test:watch  # Vitest watch
npm run build       # 本番ビルド
```

検証手順:
1. **型チェック**を通す
2. **テスト**を通す (現在 14 file / 48 test)
3. **ブラウザ動作**で確認 (preview ツール経由で自動操作可)

---

## ハマりやすいポイント

### 決定論
- `runExperiment` / `runActiveSOPs` / `maybeFireRandomEvent` などは `state.rngSeed` を消費して進める純粋関数
- **`Math.random()` を新規コードで使わない** (テストが flaky になる)。`createRng(seed)` を必ず使う

### 評判は0で下限クランプ
- `applyEffects` の `reputation` は `Math.max(0, ...)`。テストで `-2` 効果を見ても 0→0 で変化しない
- 同様に funds も 0 下限

### Effect 型は閉じた union
- 新しい Effect 種別を追加するときは `src/domain/types.ts` の `Effect` 型に追加し、`src/domain/engine/effects.ts` の `applyOne` の switch を網羅
- UI側の `EventModal.formatEffect` も忘れずに

### 学生は **ターン終わり** に動く
- `advanceTurn` の冒頭で `runActiveSOPs` → `studentsAutoWork` → 翌日。SOP/学生は前日の最後に動いた結果が翌朝に反映される

### `repair.ts` の dailyEquipmentDecay
- シードベースの簡易ハッシュで決定論を保っている。`Math.random()` に戻さない

---

## レスポンシブ

`md:` (768px) を境界に PC レイアウト / モバイルレイアウトを切替:
- TaskPanel は md 未満で fixed ドロワー (右からスライドオーバー)、md 以上で常時サイドバー
- HUD は flex-wrap で2段化、一部 stat を `hidden sm:flex` で隠す
- モバイルでは右上の「📋 進行」ボタンで [uiStore](src/store/uiStore.ts) の `taskPanelOpen` をトグル

新規 UI コンポーネントを足すときはこの規律 (Tailwind の `sm/md/lg` 接頭辞、`uiStore` への状態追加) に従う。`Math.random()` と同様、UI状態をゲーム本体 state に混ぜないこと。

## ファイル配置の地図 (一目用)

```
src/
  domain/         ← 純粋TS。React import 禁止
    types.ts
    rng.ts
    data/         ← 全コンテンツ (push で増える)
    actions/      ← ユーザ/システムの行動
    engine/       ← createState, effects, advanceTurn
    rules/        ← skills 等の純粋ルール
  store/
    gameStore.ts  ← ゲーム状態 (persist)、ドメインのアダプタ
    uiStore.ts    ← UI一時状態 (taskPanelOpen 等、永続化しない)
    migrations/
  ui/
    hooks/        ← useActionDispatch 等
    layout/       ← React コンポーネント
                    HUD / SceneArea / SceneNav / NarrationArea /
                    ActionPanel (タブ) / TaskPanel (進行ボード・ドロワー対応) /
                    EventModal / GameShell
    presenters/   ← ドメイン → ViewModel (selectActions / selectActionGroups / selectXxxTasks)
tests/domain/     ← Vitest (14 file / 48 test)
docs/             ← PLAN.md, STATUS.md
.github/workflows/deploy.yml  ← GitHub Pages 自動デプロイ
```

## UI の主要パネル

- **ActionPanel** = 今日の one-shot アクション (シーン依存タブ)
- **TaskPanel** = 進行中の案件管理 (タブ式・モバイルではドロワー)
  - 状態あり (論文/グラント/学生/共同/学会/プロジェクト) のアクションはここに集約
  - 採用候補・共同オファーもカード形式
- **SceneNav** = 移動・1日終了 (SceneArea 右端オーバーレイ)
- **EventModal** = ランダムイベント解決 (覆い被せ)

---

## 計画書とステータスの場所

| 内容 | パス |
|---|---|
| 当初の設計計画 (ゲーム全体像) | [docs/PLAN.md](./docs/PLAN.md) |
| 現状の実装状況 (フェーズ完成度) | [docs/STATUS.md](./docs/STATUS.md) |
| ユーザ承認済のPlanモード計画 | `C:\Users\murat\.claude\plans\functional-mixing-comet.md` |

---

## 進行中フェーズと方針

- **P0〜P6 + P6.5 (UI整理・レスポンシブ) 完了**
- **P7 (UI仕上げ・チュートリアル・サウンド・i18n) は保留**
- 現在はユーザ自身が試遊し、気になった点を改善する反復フェーズ

「P7に着手していい?」と勝手に判断しないこと。ユーザが指示するまでP7は保留。

## デプロイ (GitHub Pages)

- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) が main push で自動デプロイ
- ビルドの base パスは `VITE_BASE_PATH` env で制御 ([vite.config.ts](vite.config.ts))。デフォルト `/`、CI は `/lab-automation-tycoon/`
- リポジトリ名を変えたら workflow の env と README の URL を合わせて変更
- `public/.nojekyll` で Jekyll 処理を抑止 (Vite が自動で dist にコピー)
- ローカルで GH Pages 風に確認: `VITE_BASE_PATH=/lab-automation-tycoon/ npm run build && npm run preview`
