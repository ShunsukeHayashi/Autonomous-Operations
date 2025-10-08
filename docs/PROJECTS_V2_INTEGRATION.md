# GitHub Projects V2 Integration

## 🎯 概要

GitHub Projects V2 を**データ永続化層（Database）**として活用し、Agent タスクの状態管理と KPI 収集を自動化します。

**OS Mapping**: `GitHub Projects V2 → Database / Filesystem`

---

## 📋 セットアップ手順

### 1. GitHub Project の作成

```bash
# GitHub UI で作成
# https://github.com/users/YOUR_USERNAME/projects/new
# または
gh project create --owner @me --title "Autonomous Operations"
```

### 2. カスタムフィールドの追加

プロジェクトに以下のカスタムフィールドを追加してください:

| フィールド名 | タイプ | 説明 | 例 |
|------------|--------|------|-----|
| **Status** | Single Select | タスク状態 | `Todo`, `In Progress`, `Done` |
| **Agent** | Text | 担当 Agent 名 | `CodeGenAgent`, `ReviewAgent` |
| **Duration** | Number | 実行時間（分） | `5`, `10`, `30` |
| **Cost** | Number | 実行コスト（$） | `0.05`, `0.12` |
| **Quality Score** | Number | 品質スコア（0-100） | `95`, `87` |
| **Priority** | Single Select | 優先度 | `🔥 Critical`, `⚡ High`, `📝 Low` |

#### Status フィールドのオプション

- `📋 Backlog` - 未着手
- `🔍 Todo` - 着手予定
- `🚀 In Progress` - 実行中
- `✅ Done` - 完了
- `🚫 Blocked` - ブロック中

### 3. GitHub Token のスコープ追加

`.env` ファイルに Projects V2 用のトークンを追加:

```bash
# 既存の GITHUB_TOKEN に加えて
GH_PROJECT_TOKEN=ghp_xxxxxxxxxxxx

# 必要なスコープ:
# - read:project
# - write:project
# - repo (Issues/PRs へのアクセス用)
```

詳細: [GITHUB_TOKEN_SETUP.md](./GITHUB_TOKEN_SETUP.md)

### 4. プロジェクト番号の設定

`.env` に追加:

```bash
GITHUB_PROJECT_NUMBER=1  # あなたのプロジェクト番号
```

プロジェクト番号は URL から確認:
```
https://github.com/users/YOUR_USERNAME/projects/1
                                              ↑ これ
```

---

## 🚀 使い方

### 自動連携（GitHub Actions）

#### Issue 作成時

新しい Issue が作成されると、自動的に Project に追加されます。

**Workflow**: `.github/workflows/auto-add-to-project.yml`

```yaml
on:
  issues:
    types: [opened]
```

#### Issue/PR ステータス更新時

Issue や PR が閉じられると、Project のステータスが自動更新されます。

**Workflow**: `.github/workflows/update-project-status.yml`

| イベント | Project ステータス |
|---------|------------------|
| Issue opened | `🔍 Todo` |
| Issue closed | `✅ Done` |
| Issue reopened | `🚀 In Progress` |
| PR opened | `🔍 Todo` |
| PR merged | `✅ Done` |

### 手動操作（CLI）

#### Project にIssue を追加

```typescript
import { ProjectsV2Client } from './agents/github/projects-v2.js';

const client = new ProjectsV2Client(token, {
  owner: 'YOUR_USERNAME',
  repo: 'Autonomous-Operations',
  projectNumber: 1,
});

await client.initialize();

// Issue をProject に追加
const issueNodeId = await client.getIssueNodeId(123);
const itemId = await client.addIssueToProject(issueNodeId);

console.log(`Added issue #123 to project: ${itemId}`);
```

#### カスタムフィールドを更新

```typescript
// Agent 名を設定
await client.updateFieldValue(itemId, agentFieldId, 'CodeGenAgent');

// Duration を設定
await client.updateFieldValue(itemId, durationFieldId, 10);

// Status を更新
await client.updateStatus(itemId, 'In Progress');
```

#### KPI レポート生成

```typescript
const kpi = await client.generateKPIReport();

console.log(`
📊 KPI Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Issues:        ${kpi.totalIssues}
Completed:           ${kpi.completedIssues}
Completion Rate:     ${(kpi.completedIssues / kpi.totalIssues * 100).toFixed(1)}%

Avg Duration:        ${kpi.avgDuration.toFixed(1)} min
Total Cost:          $${kpi.totalCost.toFixed(2)}
Avg Quality Score:   ${kpi.avgQualityScore.toFixed(1)}/100
`);
```

---

## 📊 データフロー

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Projects V2                       │
│                  (Data Persistence Layer)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────┐      ┌──────────────┐      ┌─────────────┐ │
│  │  Issues   │─────▶│ Project Board│─────▶│ KPI Reports │ │
│  │  #1, #2.. │      │  Status, ...  │      │  Dashboard  │ │
│  └───────────┘      └──────────────┘      └─────────────┘ │
│       ▲                    ▲                      │         │
│       │                    │                      │         │
│       │                    │                      ▼         │
│  ┌────┴─────┐         ┌───┴─────────┐      ┌─────────────┐ │
│  │ GitHub   │         │   Custom    │      │   GraphQL   │ │
│  │ Actions  │         │   Fields    │      │   Queries   │ │
│  │ Workflow │         │  Agent, $, ⏱│      │   API       │ │
│  └──────────┘         └─────────────┘      └─────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                                          ▲
         │ Auto-add                                 │ Fetch data
         │ Auto-update                              │ Generate reports
         ▼                                          │
┌─────────────────────────────────────────────────────────────┐
│                      Agentic OS                              │
│  TaskOrchestrator, WorkerRegistry, Guardian                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 API リファレンス

### ProjectsV2Client

#### Constructor

```typescript
const client = new ProjectsV2Client(token: string, config: ProjectV2Config);
```

**Parameters:**
- `token`: GitHub Personal Access Token (with `read:project`, `write:project` scopes)
- `config.owner`: Repository owner
- `config.repo`: Repository name
- `config.projectNumber`: Project number

#### Methods

##### `initialize(): Promise<void>`

プロジェクトに接続し、Project ID を取得します。

##### `addIssueToProject(issueNodeId: string): Promise<string>`

Issue を Project に追加します。

**Returns**: Project item ID

##### `getIssueNodeId(issueNumber: number): Promise<string>`

Issue 番号から Node ID を取得します。

##### `getCustomFields(): Promise<CustomField[]>`

プロジェクトのカスタムフィールド一覧を取得します。

##### `updateFieldValue(itemId: string, fieldId: string, value: string | number): Promise<void>`

カスタムフィールドの値を更新します。

##### `updateStatus(itemId: string, status: string): Promise<void>`

Status フィールドを更新します。

**Status options**: `Backlog`, `Todo`, `In Progress`, `Done`, `Blocked`

##### `getProjectItems(): Promise<ProjectItem[]>`

Project 内のすべてのアイテムとフィールド値を取得します。

##### `generateKPIReport(): Promise<KPIReport>`

プロジェクトデータから KPI レポートを生成します。

**Returns:**
```typescript
{
  totalIssues: number;
  completedIssues: number;
  avgDuration: number;        // 平均実行時間（分）
  totalCost: number;          // 総コスト（$）
  avgQualityScore: number;    // 平均品質スコア（0-100）
}
```

---

## 📈 KPI トラッキング

### 自動収集される指標

Projects V2 のカスタムフィールドから自動的に以下の KPI を収集:

| 指標 | 説明 | データソース |
|-----|------|------------|
| **完了率** | 完了 Issue / 全 Issue | Status フィールド |
| **平均実行時間** | 平均 Duration | Duration フィールド |
| **総コスト** | 全 Issue のコスト合計 | Cost フィールド |
| **平均品質スコア** | 平均 Quality Score | Quality Score フィールド |
| **Agent 別パフォーマンス** | Agent ごとの統計 | Agent フィールド |

### レポート生成

```bash
# Weekly report
npm run project:report

# Custom date range
npm run project:report -- --from=2025-10-01 --to=2025-10-08
```

**出力例:**

```
📊 Weekly KPI Report (2025-10-01 ~ 2025-10-08)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Overall Performance
  Total Issues:       15
  Completed:          12 (80.0%)
  In Progress:        3

⏱️  Efficiency
  Avg Duration:       8.3 min
  Total Time:         125 min
  Time Saved:         67% (vs baseline 20 min)

💰 Cost Analysis
  Total Cost:         $1.85
  Avg per Issue:      $0.15
  ROI:                3500% (vs $65/hr human)

🏆 Quality
  Avg Quality Score:  92.5/100
  Tests Passed:       100%
  Zero Regressions:   ✓

🤖 Agent Performance
  CodeGenAgent:       8 issues, 7.2 min avg, $0.12 avg
  ReviewAgent:        5 issues, 3.5 min avg, $0.05 avg
  DeploymentAgent:    2 issues, 15.0 min avg, $0.30 avg
```

---

## 🔄 統合パターン

### Pattern 1: Issue → Agent → Project Update

```typescript
// 1. Issue が作成される (GitHub)
// 2. GitHub Actions が Issue を Project に追加
// 3. Agent が Issue を処理
// 4. Agent が Project のカスタムフィールドを更新

import { ProjectsV2Client } from './agents/github/projects-v2.js';

async function processIssue(issueNumber: number) {
  const startTime = Date.now();

  // Issue 処理
  await executeTask(issueNumber);

  // Project 更新
  const client = new ProjectsV2Client(token, config);
  await client.initialize();

  const issueNodeId = await client.getIssueNodeId(issueNumber);
  const itemId = await client.addIssueToProject(issueNodeId);

  // カスタムフィールド更新
  const duration = (Date.now() - startTime) / 1000 / 60; // minutes
  await client.updateFieldValue(itemId, durationFieldId, duration);
  await client.updateFieldValue(itemId, agentFieldId, 'CodeGenAgent');
  await client.updateFieldValue(itemId, costFieldId, 0.12);
  await client.updateStatus(itemId, 'Done');
}
```

### Pattern 2: Weekly KPI Dashboard

```typescript
// Cron job で週次レポートを自動生成
import { ProjectsV2Client } from './agents/github/projects-v2.js';

async function generateWeeklyReport() {
  const client = new ProjectsV2Client(token, config);
  await client.initialize();

  const kpi = await client.generateKPIReport();

  // GitHub Discussions に投稿
  await postToDiscussions({
    category: 'Announcements',
    title: `📊 Weekly KPI Report - ${new Date().toISOString().split('T')[0]}`,
    body: formatKPIReport(kpi),
  });

  // GitHub Pages にデータをプッシュ（ダッシュボード用）
  await updateDashboardData(kpi);
}

// GitHub Actions で毎週月曜 9:00 に実行
// .github/workflows/weekly-kpi-report.yml
```

---

## 🎯 Phase A: 完了基準

- [x] `ProjectsV2Client` 実装完了
- [x] GraphQL クエリ動作確認
- [x] Issue 自動追加ワークフロー作成
- [x] ステータス自動更新ワークフロー作成
- [ ] カスタムフィールド設定（手動、UI で実施）
- [ ] KPI レポート生成テスト
- [ ] ドキュメント完成

---

## 🔗 関連ドキュメント

- [GITHUB_TOKEN_SETUP.md](./GITHUB_TOKEN_SETUP.md) - Token スコープ設定
- [Issue #5](https://github.com/YOUR_USERNAME/Autonomous-Operations/issues/5) - Full OS Integration
- [GitHub Projects V2 API Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)

---

## 🚨 トラブルシューティング

### Error: "not been granted the required scopes"

**原因**: GitHub Token に `read:project`, `write:project` スコープが不足

**解決策**:
1. [GitHub Token 設定](https://github.com/settings/tokens) を開く
2. 既存トークンを編集または新規作成
3. `read:project`, `write:project` をチェック
4. `.env` に `GH_PROJECT_TOKEN` を設定

### Error: "Status option 'xxx' not found"

**原因**: Project の Status フィールドに該当オプションが存在しない

**解決策**:
1. GitHub Project を開く
2. Settings → Fields → Status
3. 必要なステータスオプションを追加: `Backlog`, `Todo`, `In Progress`, `Done`, `Blocked`

### GraphQL Query Timeout

**原因**: Project に大量のアイテムが存在する

**解決策**:
`getProjectItems()` にページネーションを追加:

```typescript
// TODO: Implement pagination for large projects
// Current limit: first 100 items
```

---

## 📚 次のステップ

Phase A 完了後:
- **Phase B**: Webhooks 統合（イベント駆動アーキテクチャ）
- **Phase E**: GitHub Pages ダッシュボード（KPI 可視化）

詳細: [Issue #5](https://github.com/YOUR_USERNAME/Autonomous-Operations/issues/5)
