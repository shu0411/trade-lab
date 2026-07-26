# Trade Lab — 投資判断の仮説検証ツール

株式投資における「押し目買い」「ブレイクアウト」などのチャートパターンについて、
仮想エントリーを記録し、成功パターン・失敗パターンを分析するツール。

## 構成

```txt
frontend/   React 18 + TypeScript + Vite + TailwindCSS
backend/    Python 3.13 + FastAPI
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

デフォルトでは **SQLite** をデータストアとして使用するため、Docker や LocalStack は不要です。

#### 1. 環境変数の設定

```bash
cp backend/.env.example backend/.env
```

`.env` の内容はそのままで動作します（デフォルトで SQLite が使われます）。

#### 2. サーバー起動

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
set -a && source .env && set +a   # 環境変数読み込み
uvicorn app.main:app --reload --port 8000
```

データは `backend/trade_lab.db` に永続化されます。

#### ストアバックエンドの切り替え

| `STORE_BACKEND` | 使用するストア | 備考 |
| --- | --- | --- |
| 未設定 / `sqlite` | SQLite（`trade_lab.db`） | ローカル開発用 |
| `dynamodb` | DynamoDB / LocalStack | 本番または LocalStack 使用時 |

**LocalStack を使う場合**（事前に [Docker](https://www.docker.com/) が必要）:

```bash
cd backend/docker
docker compose up -d
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test \
  bash backend/scripts/setup-localstack.sh
```

その後 `backend/.env` で `STORE_BACKEND=dynamodb` と `AWS_ENDPOINT_URL=http://localhost:4566` を設定してください。

> 本物の AWS に接続する場合は `STORE_BACKEND=dynamodb` を設定し、`AWS_ENDPOINT_URL` をコメントアウトして `~/.aws/credentials` に実際の認証情報を設定してください。

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

#### 前提: AWS CLI のインストール

```bash
# macOS
brew install awscli

# Windows: https://aws.amazon.com/jp/cli/ からインストーラーをダウンロード

# Linux（/tmp で実行するとカレントディレクトリを汚さない）
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip /tmp/awscliv2.zip -d /tmp && sudo /tmp/aws/install
```

#### 認証: IAM Identity Center（SSO）でログイン

長期的なアクセスキーは使用しない。IAM Identity Center の SSO 経由で一時クレデンシャルを取得する。

##### developers-sso プロファイルの作成（初回のみ）

**IAM Identity Center 側の準備（管理者が実施、初回のみ）**:

1. IAM Identity Center → ユーザー → ユーザーを追加 → `iam-developer` を作成
2. IAM Identity Center → グループ → グループを作成
   - グループ名: `iam-developers`
   - メンバーに `iam-developer` を追加
3. IAM Identity Center → 許可セット → 許可セットを作成
   - 許可セット名: `DevelopersAccess`
   - アクセス許可ポリシー: `PowerUserAccess` + カスタマーマネージドポリシー `cdk-iam-policy`
4. IAM Identity Center → AWS アカウント → 対象アカウント（`388795800221`）を選択 → 「ユーザーまたはグループの割り当て」でグループ `iam-developers` に許可セット `DevelopersAccess` を割り当てる

**ローカル PC 側でのプロファイル設定**:

```bash
aws configure sso --profile developers-sso
```

対話式プロンプトには以下を入力する：

| 項目 | 値 |
| --- | --- |
| SSO session name | 任意（例: `trade-lab`） |
| SSO start URL | `https://d-9567629792.awsapps.com/start` |
| SSO region | `ap-northeast-1` |
| SSO registration scopes | Enter でデフォルト（`sso:account:access`） |
| （ブラウザでログイン後）CLI default client Region | `ap-northeast-1` |
| CLI default output format | 任意（例: `json`） |
| CLI profile name | `developers-sso` |

完了すると `~/.aws/config` に以下の内容が追記される（手動で編集してもよい）：

```ini
[profile developers-sso]
sso_session = trade-lab
sso_account_id = 388795800221
sso_role_name = DevelopersAccess
region = ap-northeast-1
output = json

[sso-session trade-lab]
sso_start_url = https://d-9567629792.awsapps.com/start
sso_region = ap-northeast-1
sso_registration_scopes = sso:account:access
```

##### ログイン

```bash
aws sso login --profile developers-sso
# ブラウザが開いて認証される（セッションは8時間有効）
```

#### 前提: Docker のインストール

CDK の Lambda アセットバンドリング（`lambda.Code.fromAsset` の `bundling`）は、Lambda 実行環境と同じ
イメージで `pip install` を行うために Docker を使用する。`docker: command not found` や
`spawnSync docker ENOENT` のエラーが出た場合は、Docker が未導入または未起動であることが原因。

```bash
# WSL2 (Ubuntu) の場合: Docker Engine を直接インストール
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo systemctl enable --now docker

# グループ変更を反映（新しいターミナルを開くか newgrp docker を実行）
newgrp docker

# 動作確認
docker run hello-world
```

macOS / Windows（WSL2 の Docker Desktop 連携含む）の場合は [Docker Desktop](https://www.docker.com/products/docker-desktop/) をインストールする。

#### CDK デプロイ

```bash
cd infra
npm install
AWS_PROFILE=developers-sso npx cdk bootstrap   # 初回のみ（アカウント×リージョン単位）
AWS_PROFILE=developers-sso npx cdk deploy
```

デプロイ後、出力される `ApiEndpoint` を `frontend/.env.local` の `VITE_API_URL` に設定し、
`npm run build` でビルドして `FrontendBucket` にアップロードする。

#### CI/CD: GitHub Actions OIDC

アクセスキーを GitHub Secrets に持たせず、OIDC でIAMロールを直接引き受ける。

**AWSコンソールでの初期設定（初回のみ）**:

1. IAM → IDプロバイダー → プロバイダーを追加
   - プロバイダーのタイプ: `OpenID Connect`
   - プロバイダーURL: `https://token.actions.githubusercontent.com`
   - 対象者: `sts.amazonaws.com`
2. IAM → ロール → ロールを作成
   - 信頼されたエンティティ: 上記のOIDCプロバイダーを選択
   - 信頼ポリシーの `sub` 条件にリポジトリを指定: `"repo:<GitHubユーザー名>/<リポジトリ名>:*"`
   - `developers` グループと同じポリシー（`PowerUserAccess` + `cdk-iam-policy`）をアタッチ

**GitHub Actions ワークフロー**:

`main` への push で自動デプロイされる。CDK デプロイ、フロントエンドのビルド、S3 へのアップロード、
CloudFront キャッシュの無効化までを行う。詳細は [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) を参照。

## 機能

- **仮説登録**: エントリー記録 / 見送り記録
- **価格自動計算**: エントリー価格 + 利確/損切 % → 目標価格を自動計算
- **根拠記録**: 7種類の固定チェックボックス + 自由入力
- **チャート画像**: S3へのアップロード対応
- **結果入力**: 終了価格・最大含み益損・振り返りメモ
- **分析**: パターン別・根拠別の成功率グラフ
