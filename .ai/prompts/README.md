# Prompt Management Directory

**作成日**: 2025-10-09
**管理者**: AI Operations Lead

---

## 📁 ディレクトリ構造

```
.ai/prompts/
├── agents/          # Agent別プロンプトテンプレート
├── workflows/       # ワークフロー別プロンプト
├── templates/       # 汎用プロンプトテンプレート
├── examples/        # 実行例・サンプル
└── README.md        # このファイル
```

---

## 🎯 用途

### 1. **agents/** - Agent別プロンプト

各Agentの実行時に使用するプロンプトテンプレートを管理。

**例**:
- `codegen-agent.md` - コード生成Agent用プロンプト
- `review-agent.md` - レビューAgent用プロンプト
- `issue-agent.md` - Issue分析Agent用プロンプト
- `pr-agent.md` - PR作成Agent用プロンプト

### 2. **workflows/** - ワークフロー別プロンプト

自律型ワークフローの各フェーズで使用するプロンプト。

**例**:
- `initialization.md` - Phase 1: 初期化フェーズ
- `planning.md` - Phase 2: タスク計画フェーズ
- `execution.md` - Phase 3: 並行実行フェーズ
- `verification.md` - Phase 4: 検証フェーズ
- `handoff.md` - Phase 5: ハンドオフフェーズ

### 3. **templates/** - 汎用テンプレート

プロジェクト横断で使用する共通プロンプトテンプレート。

**例**:
- `code-review-checklist.md` - コードレビューチェックリスト
- `quality-criteria.md` - 品質基準（80点基準等）
- `escalation-protocol.md` - エスカレーションプロトコル
- `ldd-format.md` - ログ駆動開発フォーマット

### 4. **examples/** - 実行例

実際の実行ログやサンプルプロンプト。

**例**:
- `issue-270-execution.md` - Issue #270実行例
- `parallel-execution-sample.md` - 並行実行サンプル
- `escalation-case-study.md` - エスカレーション事例

---

## 📝 プロンプト命名規則

### ファイル名形式

```
{category}-{purpose}-{variant}.md

例:
- codegen-agent-typescript.md
- review-agent-security.md
- workflow-initialization-git.md
```

### フロントマター形式

各プロンプトファイルにはYAMLフロントマターを含める:

```yaml
---
title: "CodeGen Agent - TypeScript専用"
agent: "CodeGenAgent"
version: "1.0.0"
updated: "2025-10-09"
author: "AI Operations Lead"
tags: ["codegen", "typescript", "agent"]
---
```

---

## 🔄 プロンプトバージョニング

### バージョン管理方針

1. **セマンティックバージョニング**: `MAJOR.MINOR.PATCH`
2. **Git管理**: すべてのプロンプトをGit管理下に
3. **変更履歴**: 各ファイル末尾に変更履歴を記録

### 変更履歴フォーマット

```markdown
## 変更履歴

### v1.1.0 (2025-10-09)
- 識学理論5原則に基づく評価基準追加
- エスカレーション条件明確化

### v1.0.0 (2025-10-08)
- 初版作成
```

---

## 🛠️ プロンプト使用方法

### TypeScriptから読み込み

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const promptPath = join(__dirname, '.ai/prompts/agents/codegen-agent.md');
const prompt = readFileSync(promptPath, 'utf-8');

// Claude Code Task tool APIで使用
const result = await taskTool({
  prompt: prompt,
  subagent_type: 'CodeGenAgent'
});
```

### Claude Code Slash Commandから使用

```bash
# .claude/commands/codegen.md
cat .ai/prompts/agents/codegen-agent.md

# 実行
/codegen
```

---

## 📊 プロンプト品質基準

### 必須要素

1. **Intent明確化**: 何を達成するかを5-7語で記述
2. **Plan構造化**: ステップバイステップで手順記載
3. **完了条件**: 明確な成功基準（数値化）
4. **エスカレーション条件**: 人間介入が必要な条件

### 品質スコア

- **80点以上**: 本番環境使用可
- **60-79点**: テスト環境で検証
- **60点未満**: 再作成必須

---

## 🔍 検索・参照

### プロンプト検索

```bash
# Agent別検索
find .ai/prompts/agents -name "*.md" | grep codegen

# タグ検索（フロントマターから）
grep -r "tags:.*typescript" .ai/prompts

# 全文検索
grep -r "識学理論" .ai/prompts
```

### プロンプト統計

```bash
# ファイル数
find .ai/prompts -name "*.md" | wc -l

# 総行数
find .ai/prompts -name "*.md" -exec wc -l {} + | tail -1

# Agent別カウント
ls -1 .ai/prompts/agents/*.md | wc -l
```

---

## 📚 関連ドキュメント

- **Agent運用マニュアル**: `docs/AGENT_OPERATIONS_MANUAL.md`
- **ワークフロー統合ガイド**: `docs/AUTONOMOUS_WORKFLOW_INTEGRATION.md`
- **識学理論5原則**: `CLAUDE.md` L76-82
- **LDD仕様**: `.ai/logs/`

---

## 🤝 貢献ガイドライン

### 新規プロンプト追加手順

1. 適切なディレクトリを選択 (`agents/`, `workflows/`, `templates/`)
2. YAMLフロントマター追加
3. Intent/Plan/Implementation/Verificationセクション記載
4. 変更履歴追加
5. Pull Request作成（Draft PR推奨）

### レビュー基準

- [ ] YAMLフロントマター完備
- [ ] 完了条件明確化
- [ ] エスカレーション条件記載
- [ ] 実行例・サンプル提供
- [ ] 変更履歴更新

---

**次回レビュー予定**: 2025-10-16
**バージョン**: 1.0.0

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
