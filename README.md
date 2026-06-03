# Trade Lab — 投資判断の仮説検証ツール

株式投資における「押し目買い」「ブレイクアウト」などのチャートパターンについて、
仮想エントリーを記録し、成功パターン・失敗パターンを分析するツール。

## 構成

```
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

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
pip install uvicorn
uvicorn app.main:app --reload --port 8000
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
