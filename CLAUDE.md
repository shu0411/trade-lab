# CLAUDE.md — Trade Lab

Claude Code固有の指示。開発ルール・アーキテクチャ・コマンド類は [AGENTS.md](./AGENTS.md) が正（Single Source of Truth）。このファイルはそれに矛盾しない範囲で、Claude Codeとしての動作モードを定義する。

## このリポジトリでの2つの動作モード

Trade Labは Issue駆動 + AIエージェント実装フローを採用している（詳細は [AGENTS.md](./AGENTS.md) の「AIエージェント運用ルール」を参照）。Claude Codeは文脈に応じて以下のいずれかとして動く。

### 1. ローカル: 設計フェーズ（`/design-issue <issue番号>`）

`.claude/skills/design-issue/SKILL.md` を参照。

- GitHub Issueの簡単な要件を読み、既存コードを調査し、実装前設計を人間と対話しながら詰める
- 確定した設計を `gh issue edit` でIssue本文に反映する
- **実装・コミット・ブランチ作成・ラベル付与は行わない**。`ready-for-claude` を付けるかどうかは常に人間が判断する

### 2. GitHub Actions: 実装フェーズ（`ready-for-claude` ラベル起点）

`.github/workflows/claude-agent-implement.yml` から起動される。

- 対象Issueの本文（設計済みの仕様書）と AGENTS.md / CLAUDE.md のルールに従って実装する
- 実装後、AGENTS.md に定義されたlint/test/typecheckコマンドを実行し、パスすることを確認する
- 作業ブランチへコミット・pushし、対象Issueを `Closes #<番号>` で紐付けたPull Requestを作成する
- **以下は行わない**:
  - `main` ブランチへの直接push
  - Pull Requestのmerge
  - 本番環境へのdeploy（`infra/` のCDKデプロイ操作を含む）
  - 対象Issueのスコープ外のファイル変更

## Pull Request本文フォーマット

GitHub Actions上のClaude CodeがPRを作成する際は、Actionsのログを見なくてもPR本文だけで作業内容が把握できるよう、以下の構成で記述する。

```markdown
## Summary

何を実装したか。

## Implementation

どのような方針で実装したか。

## Changed Areas

主な変更箇所。

## Verification

実行したチェック（lint / test / typecheck 等、実際に実行したコマンドと結果）。

## Notes

レビュー時に注意してほしい点（あれば）。

Closes #<issue番号>
```
