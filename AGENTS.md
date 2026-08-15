# AGENTS.md — Trade Lab

## プロジェクト概要

**Trade Lab** は、株式投資における仮想エントリーを記録し、成功パターン・失敗パターンを分析するWebアプリ。
実際の売買は行わず、判断力向上のための学習データ蓄積が目的。

対象ユーザー: 個人投資家（初心者〜中級者）

---

## アーキテクチャ

```text
frontend/   React 18 + TypeScript + Vite + TailwindCSS
backend/    Python 3.12 + FastAPI + Mangum (AWS Lambda adapter)
infra/      AWS CDK (TypeScript)
```

### AWS構成

| リソース | 用途 |
| --- | --- |
| DynamoDB `trade-lab-hypotheses` | 仮説データ（エントリー・見送り記録） |
| S3 `trade-lab-charts-{account}` | チャートスクリーンショット画像 |
| Lambda `trade-lab-backend` | FastAPI実行 |
| API Gateway (HTTP API) | バックエンドエンドポイント |
| S3 + CloudFront | フロントエンド配信 |

---

## ディレクトリ構成

```text
trade-lab/
├── frontend/src/
│   ├── api/client.ts        # 全APIコール（axios）
│   ├── types/entry.ts       # 共通型定義・定数（PATTERNS, REASONS）
│   ├── components/
│   │   ├── EntryCard.tsx    # 仮説一覧カード
│   │   └── ResultForm.tsx   # 結果入力フォーム
│   └── pages/
│       ├── Dashboard.tsx    # ダッシュボード
│       ├── EntryList.tsx    # 仮説一覧
│       ├── EntryNew.tsx     # 仮説登録
│       ├── EntryDetail.tsx  # 詳細・結果入力
│       └── Analysis.tsx     # 分析（グラフ）
├── backend/app/
│   ├── main.py              # FastAPIアプリ + Mangumハンドラ
│   ├── models/entry.py      # Pydanticモデル・DynamoDB変換関数
│   └── routers/
│       ├── entries.py       # CRUD
│       ├── upload.py        # S3 presigned URL
│       └── analysis.py      # 集計API
└── infra/lib/
    └── trade-lab-stack.ts   # 全AWSリソース定義
```

---

## データモデル

### DynamoDB テーブル: `trade-lab-hypotheses`

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `pk` | String (PK) | `ENTRY#{uuid}` |
| `gsi1pk` | String (GSI PK) | `DATE#{YYYY-MM-DD}` |
| `id` | String | UUID |
| `type` | `"entry"` / `"pass"` | エントリー記録 / 見送り記録 |
| `pattern` | `"押し目"` / `"ブレイクアウト"` / `"その他"` | チャートパターン |
| `status` | `"open"` / `"closed"` | 結果入力前 / 後 |
| `result` | `"success"` / `"failure"` / `"breakeven"` / `null` | 判定結果 |
| `reasons` | `string[]` | 判断根拠（固定7種から選択） |
| `entryPrice` | String (数値) | DynamoDBの数値はStringで保存、取得時にfloat変換 |

**注意**: DynamoDB に数値を保存する際は `str()` に変換して保存し、取得時に `float()` へ変換している（`models/entry.py` の `dynamo_to_response` 参照）。

### 固定根拠リスト（`types/entry.ts` の `REASONS`、`analysis.py` の `FIXED_REASONS` で定義）

`25日線反発` / `75日線反発` / `高値更新` / `出来高増加` / `ゴールデンクロス` / `安値切り上げ` / `移動平均線上向き`

根拠を追加する場合は **両方** のファイルを更新すること。

---

## API エンドポイント

```text
GET    /entries              一覧（?type=entry|pass&status=open|closed）
POST   /entries              新規作成
GET    /entries/{id}         詳細
PUT    /entries/{id}         結果入力（exitPrice, result 等）
DELETE /entries/{id}         削除
POST   /upload/presigned     S3アップロード用presigned URL取得
GET    /upload/signed-url/{key}  S3読み取り用signed URL取得
GET    /analysis/summary     ダッシュボード用サマリー
GET    /analysis/patterns    パターン別成功率
GET    /analysis/reasons     根拠別成功率
```

---

## 開発手順

### フロントエンドのローカル起動

```bash
cd frontend
npm install
# バックエンドが localhost:8000 で起動している場合、vite.config.ts の proxy が /api → 8000 に転送
npm run dev
```

### バックエンドのローカル起動

```bash
cd backend
pip install -r requirements.txt uvicorn
uvicorn app.main:app --reload --port 8000
# ローカルでは TABLE_NAME・IMAGES_BUCKET 環境変数が必要（DynamoDB Local or 実AWS）
```

### 型チェック

```bash
cd frontend && npx tsc --noEmit
```

### AWSデプロイ

```bash
cd infra && npm install && npx cdk deploy
# 出力の ApiEndpoint を frontend/.env.local の VITE_API_URL に設定
cd ../frontend && npm run build
# dist/ を S3 FrontendBucket にアップロード
```

---

## 拡張時の注意点

### 新しい分析軸を追加する場合

1. `backend/app/routers/analysis.py` に新しいエンドポイントを追加
2. `frontend/src/api/client.ts` に対応するAPI関数を追加
3. `frontend/src/pages/Analysis.tsx` にグラフセクションを追加

### 価格データ取得機能を追加する場合（T-08, T-14）

- Yahoo Finance: `yfinance` ライブラリ（Python）で取得可能。銘柄コードは `{ticker}.T` 形式（例: `4062.T`）
- J-Quants API: 無料枠あり、日本株専用で信頼性が高い
- バックエンドに `routers/prices.py` を新設し、Lambda の環境変数で API キーを管理

### 銘柄オートコンプリートを追加する場合（T-07）

- 東証上場銘柄の CSVは JPX（日本取引所グループ）から無料取得可能
- S3に銘柄マスタJSONを置いてフロントエンドから直接参照する方式が低コスト

### チャート表示を追加する場合（T-15, T-16）

- `lightweight-charts`（TradingView製）がローソク足に最適
- `recharts` は現在の分析グラフに使用中。ローソク足は別ライブラリ推奨

---

## タスク管理

Jiraでタスク管理。タスク一覧の番号（T-01〜T-18）はJiraチケットIDの命名規則と対応させる。
フェーズ区分: Phase1（デプロイ）→ Phase2（ブラッシュアップ）→ Phase3（必須拡張）→ Phase4（分析強化）→ Phase5（チャート）→ Phase6（AI）

新規タスクは GitHub Issue で管理し、`ready-for-claude` ラベルを付与すると
`.github/workflows/claude.yml` 経由で claude-code-action が自動起動して実装を行う
（詳細は本ファイル末尾の「開発ガイドライン（共通規約）」を参照）。

---

## 開発ガイドライン（共通規約）

以下は全プロジェクト共通の開発ガイドラインのうち、本プロジェクトに適用される部分。
ローカルでの対話的な Claude Code セッションと、`ready-for-claude` ラベルで起動する
claude-code-action（GitHub Actions）の両方に適用される。

### コミュニケーション・言語

- 人間の目を通すものはすべて日本語で書く。ユーザーへの質問・回答、Issue/PRへのコメント、
  コミットメッセージ、ドキュメントなどが対象。コード内部（変数名・関数名など）は英語でよい

### 開発時のルール

- **TDD で進める。** ユニットテストを先に書いてから実装に入る
- **責務分離を意識する。** クラス・関数・コンポーネントそれぞれが単一の責務を持つように設計し、
  肥大化したら分割する
- リンター・フォーマッター・テストは既存の構成（frontend: ESLint + Prettier、
  backend: black + pytest）を維持・尊重する

### 設計原則

- **YAGNI**: 要求されていない機能の先回り実装や、過剰な抽象化・カスタマイズをしない。
  まず最小限で動くシンプルなものを作る
- **DRY**: 同じ知識・ロジックの重複を避け、共通化する。ただし偶然似ているだけのコードを
  無理にまとめない
- **SOLID**: 特に単一責任の原則と、インターフェースを介した疎結合（依存性逆転）を意識する

### コーディング全般

- 既存コードのスタイル・命名・イディオムに合わせる
- テストは実装の詳細ではなく、外から見える振る舞いに対して書く
- **ドキュメントを同期する。** 挙動や構成を変えたら、README・本ファイルなどの関連ドキュメントも
  同じ変更内で更新する
- 設計ドキュメントは SSOT（Single Source of Truth）を意識する。同じ内容を複数の箇所に
  繰り返して記載しない

### コミット・PR運用ルール

- 1コミット = 1つの論理的な変更にすること。複数の目的（機能追加・リファクタ・設定変更など）を
  混在させない
- 変更ファイル数は、1コミットあたり10ファイル程度までを目安に、大きくなりすぎる場合は
  意味のある単位で分割する
- **ローカルでの対話的セッションでは、リモートへの `push` は行わない。** ローカルコミットの
  状態でユーザーに提示し、push はユーザー自身が行う
- **例外: claude-code-action による CI 自動実行では、ブランチの push・PR 作成を行ってよい**
  （そうしないと Issue 駆動開発が成立しないため）。ただし main への直接 push・マージは行わず、
  必ず PR を作成してユーザーのレビュー・マージを経る

---

## AIエージェント運用ルール

Trade LabはIssue駆動 + AIエージェント実装フローを採用する。

```text
1. 人間がGitHub Issueに簡単な要件だけ書く
2. ローカルClaude Codeで /design-issue <番号> を実行し、対話しながら実装前設計を詰める
3. Claude Codeがgh CLIでIssue本文を設計済み仕様書に更新する
4. 人間が内容を確認し、ready-for-agent ラベルを付与する（実装開始の明示的な承認）
5. GitHub Actions上のClaude Codeが起動し、Issueを実装してPull Requestを作成する
6. 人間がレビューしてmergeする
```

Claude Code固有の役割分担・PR本文フォーマットは [CLAUDE.md](./CLAUDE.md) を参照。

### 変更してはいけないもの

AIエージェント（ローカル・GitHub Actionsいずれも）は以下を行わない。

- `main` ブランチへの直接push
- Pull Requestのmerge
- 本番環境へのdeploy（`infra/` のCDKデプロイ操作を含む）
- 対象Issueのスコープ外のファイル変更

最終的なmerge・deployの判断と実行は必ず人間が行う。

### コミット粒度

- 1コミット = 1つの論理的な変更にする。複数の目的（機能追加・リファクタ・設定変更など）を混在させない
- 変更ファイル数は1コミットあたり10ファイル程度までを目安に、大きくなりすぎる場合は意味のある単位で分割する

### Agentが実行すべきチェックコマンド

実装後、変更した領域に応じて以下を実行し、パスすることを確認してからコミットする。

```bash
# backend
cd backend && uv run pytest tests/ -v

# frontend
cd frontend && npm run lint && npm run format:check && npx tsc --noEmit && npm run build
```
