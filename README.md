# Lab Automation Tycoon (仮)

研究者の研究活動・研究生活をリアルに表現したタイクーン系シミュレーションゲーム。
大学院生で始め、グラントでラボを自動化し、トップ研究者を目指す **日次ターン制 Web ゲーム**。

> ▶ **プレイする**: `https://<your-username>.github.io/lab-automation-tycoon/`
> *(GitHub Pages を有効化後、main ブランチへの push で自動デプロイされます)*

---

## 主な特徴

- **データ駆動設計** — コンテンツ追加は `src/domain/data/*.ts` のファイル末尾に push するだけ
- **11 プロトコル / 13 機器 / 10 学生 / 10 グラント / 7 ジャーナル / 13 イベント / 4 学会 / 4 共同研究先**
- **機器の自動運転 (SOP)** + ロボット (Opentrons系) で並列処理
- **キャリア昇進 6 段階** (院生 → ポスドク → 助教 → 准教授 → 教授 → 拠点リーダー)
- **スマホ対応** — 進行ボードはスライドオーバードロワー、レスポンシブ完備
- **完全クライアント完結** — セーブは localStorage、サーバ不要

## プレイヤー体験の弧

1. 試薬を量って手作業 PCR から始まる**泥臭い研究**
2. 雑務・申請書・学生指導に追われる**「研究外」のリアル**
3. グラント獲得 → 機器導入 → SOP化 → 自動化されたラボへ
4. 後進育成・コミュニティ貢献の**戦略レイヤー**へ昇華

## 技術スタック

TypeScript / React 18 / Vite / Zustand (+ persist + immer) / Tailwind CSS / Vitest

ドメイン層と UI 層を完全分離 (純粋関数 + ViewModel) しており、将来のソシャゲ風 UI 差し替えに備えてあります。

## 開発

```sh
npm install
npm run dev         # http://localhost:5173
npm run typecheck   # 型チェック
npm test            # 14 ファイル / 48 テスト
npm run build       # 本番ビルド
npm run preview     # ビルド成果物をプレビュー
```

### GitHub Pages 用ビルド (ローカル試験)

```sh
# Linux/Mac
VITE_BASE_PATH=/lab-automation-tycoon/ npm run build

# PowerShell
$env:VITE_BASE_PATH='/lab-automation-tycoon/'; npm run build
```

## デプロイ (GitHub Pages)

1. GitHub に push (リポジトリ名は `lab-automation-tycoon` を想定)
2. リポジトリの **Settings → Pages → Source = GitHub Actions** を選択
3. `main` ブランチへ push すると [.github/workflows/deploy.yml](.github/workflows/deploy.yml) が自動で型チェック・テスト・ビルド・デプロイ
4. リポジトリ名を変える場合は `.github/workflows/deploy.yml` の `VITE_BASE_PATH` を合わせて変更

## ドキュメント

- 📋 [docs/PLAN.md](docs/PLAN.md) — 設計計画書 (ゲーム全体像・3層アーキテクチャ・データ駆動方針)
- 📊 [docs/STATUS.md](docs/STATUS.md) — 開発状況 (フェーズ進捗・コンテンツ件数・ファイルマップ)
- 🤖 [CLAUDE.md](CLAUDE.md) — Claude Code 用の開発ガイド (規律と作業手順)

## プロジェクト構成

```
src/
├── domain/      # 純粋TS層 (React/DOM非依存・Vitestで単独テスト可)
│   ├── data/    # 全コンテンツ定義 (push で増える)
│   ├── actions/ # ユーザ/システムアクション
│   ├── engine/  # createState, effects, advanceTurn
│   └── rules/   # skills 等
├── store/       # Zustand (gameStore / uiStore)
└── ui/
    ├── layout/      # HUD / SceneArea / TaskPanel / ActionPanel / EventModal / SceneNav
    ├── presenters/  # ドメイン → ViewModel
    └── hooks/       # useActionDispatch
tests/domain/    # Vitest
docs/            # PLAN.md, STATUS.md
```

## ライセンス

未指定。研究目的・個人利用は自由ですが、再配布・商用利用予定があれば事前にご相談ください。
