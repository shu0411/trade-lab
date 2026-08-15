---
name: design-issue
description: GitHub Issue番号を受け取り、簡単な要件だけが書かれたIssueに対して既存コードを調査し、人間と対話しながら実装前設計を行い、gh CLIでIssue本文を仕様書として更新する。実装・コミット・ブランチ作成・ラベル付与は一切行わない。「Issueを設計して」「/design-issue」「設計フェーズ」などの依頼で使用する。
---

# design-issue — GitHub Issueの実装前設計

Trade LabのIssue駆動 + AIエージェント実装フローにおける「設計フェーズ」専用のSkill。
人間が最初に書く簡単な要件（Requirementのみ）を入力として、既存コードを調査しながら
実装可能な粒度の仕様書に育て、GitHub Issue本文そのものを更新する。

全体フローは [AGENTS.md](../../../AGENTS.md) の「AIエージェント運用ルール」、
役割分担は [CLAUDE.md](../../../CLAUDE.md) を参照。

## 最重要原則: 設計と実装を分離する

**このSkillはIssue本文の更新までが責務であり、実装は一切行わない。**

- ソースコードの編集・新規作成をしない
- `git commit` / ブランチ作成をしない
- `ready-for-claude` などのラベル付与をしない（実装開始の承認は常に人間が行う）

実装は、このSkillでIssueが仕様書として詰められた後、人間が内容を確認して
`ready-for-claude` ラベルを付けたときに、GitHub Actions上のClaude Codeが別途行う。

## 入力

`/design-issue <issue番号>` のように、GitHub Issue番号を引数として受け取る。
番号が指定されなければユーザーに確認する。

## 実行手順

### Step 1: Issueを取得する

```bash
gh issue view <issue番号> --json title,body,labels,url,state
```

- `gh` コマンドが失敗する場合（未インストール・未認証）は、その旨を伝えて停止する
- 既に `ready-for-claude` ラベルが付いている場合、実装が既に走っている／走る可能性が
  あることをユーザーに伝えた上で続行してよいか確認する
- 既にSpecification/Technical Design相当のセクションが揃っている場合は、新規設計では
  なく更新であることをユーザーに確認する

### Step 2: Requirementを理解する

Issue本文の `## Requirement`（またはそれに相当する記述）を読み、何を実現したいか・
なぜ必要かを把握する。曖昧な点があればこの時点でメモしておき、Step 5で人間に確認する。

### Step 3: リポジトリを調査する

Requirementに関連する既存コード・設計を調査する。少なくとも以下を確認する。

- `AGENTS.md`（アーキテクチャ、データモデル、APIエンドポイント、拡張時の注意点）
- 関連するディレクトリ（例: `frontend/src/`, `backend/app/`, `infra/lib/`）
- 似た既存機能があれば、その実装パターン・命名規則
- `docs/spec/` 配下の仕様ドキュメント

調査は現状把握が目的であり、この時点でも実装は行わない。

### Step 4: 設計ドラフトを作る

調査結果をもとに、以下のフォーマットでIssue本文のドラフトを作る。
**Issueの規模に応じて項目は調整してよく、無理にすべて埋める必要はない。**

```markdown
## Requirement

人間が最初に書いた要求。何を実現したいか、なぜ必要か。（既存の記述を尊重し、
書き換えない）

## Current Behavior

現在のコード・動作を調査した結果。

## Specification

今回実現する具体的な仕様。

## Acceptance Criteria

- [ ] 条件1
- [ ] 条件2

## Technical Design

既存コードを踏まえた実装方針。必要に応じて以下を含める。

- データフロー
- 責務分担
- API変更
- データモデル変更
- UI変更
- エラー処理

## Affected Areas

主な変更対象。

- `xxx`
- `yyy`

## Test Plan

実装後に確認すべき内容。

- Unit test
- Integration test
- lint / typecheck
- 必要な手動確認
```

### Step 5: 人間と対話して設計を詰める

ドラフトを提示し、以下のような論点について必要に応じて確認する。

- 複数の実装方針が考えられる場合の選択（[AskUserQuestion]相当の確認）
- 既存アーキテクチャとの整合性で判断が割れる点
- スコープの境界（今回やること／やらないこと）

一度で確定させようとせず、対話を通じて仕様を収束させる。

### Step 6: Issue本文を更新する

内容が確定したら、ドラフトをスクラッチ用の一時ファイルに書き出し、`gh issue edit` で
Issue本文を更新する。

```bash
gh issue edit <issue番号> --body-file <一時ファイルパス>
```

更新後、Issue URLをユーザーに提示し、内容を確認した上で `ready-for-claude` ラベルを
付けるかどうかはユーザー自身が判断することを伝える。ラベル付与はこのSkillからは行わない。
