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
