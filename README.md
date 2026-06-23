# Trade Lab — 投資判断の仮説検証ツール

株式投資における「押し目買い」「ブレイクアウト」などのチャートパターンについて、
仮想エントリーを記録し、成功パターン・失敗パターンを分析するツール。

## 構成

```txt
frontend/   React 18 + TypeScript + Vite + TailwindCSS
backend/    Python 3.12 + FastAPI + Mangum (Lambda)
infra/      AWS CDK (TypeScript)
```

## セットアップ

### フロントエンド（ローカル開発）

```bash
cd frontend
npm install
cp .env.example .env.local   # API URLを設定
npm run dev
```

### バックエンド（ローカル開発）

LocalStack を使って AWS リソース（DynamoDB・S3）をローカルでエミュレートします。  
事前に [Docker](https://www.docker.com/) のインストールが必要です。

#### 1. LocalStack 起動

```bash
cd backend/docker
docker compose up -d
```

#### 2. テーブル・バケット作成（初回のみ）

```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test \
  bash backend/scripts/setup-localstack.sh
```

#### 3. 環境変数の設定

```bash
cp backend/.env.example backend/.env
```

`backend/.env` の内容はそのまま使えます（LocalStack 用の設定があらかじめ記載されています）。

#### 4. サーバー起動

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
set -a && source .env && set +a   # 環境変数読み込み
uvicorn app.main:app --reload --port 8000
```

> 本物の AWS に接続する場合は `backend/.env` の `AWS_ENDPOINT_URL` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` の3行をコメントアウトし、`~/.aws/credentials` に実際の認証情報を設定してください。

### テスト

```bash
cd backend
python -m pytest tests/ -v
```

| テスト種別 | ファイル | LocalStack が必要か |
| --- | --- | --- |
| 単体テスト | `tests/test_entries.py` / `tests/test_analysis.py` | 不要（InMemory で動作） |
| 統合テスト | `tests/test_integration.py` | 必要（`AWS_ENDPOINT_URL` が設定されている場合のみ実行） |

LocalStack を起動した状態で統合テストも実行する場合：

```bash
set -a && source .env && set +a
python -m pytest tests/ -v
```

### インフラ（AWS CDK）

```bash
cd infra
npm install
npx cdk bootstrap   # 初回のみ
npx cdk deploy
```

デプロイ後、出力される `ApiEndpoint` を `frontend/.env.local` の `VITE_API_URL` に設定し、
`npm run build` でビルドして `FrontendBucket` にアップロードする。

## 機能

- **仮説登録**: エントリー記録 / 見送り記録
- **価格自動計算**: エントリー価格 + 利確/損切 % → 目標価格を自動計算
- **根拠記録**: 7種類の固定チェックボックス + 自由入力
- **チャート画像**: S3へのアップロード対応
- **結果入力**: 終了価格・最大含み益損・振り返りメモ
- **分析**: パターン別・根拠別の成功率グラフ
