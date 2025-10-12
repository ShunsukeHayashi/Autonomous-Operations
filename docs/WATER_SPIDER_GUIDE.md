# 🕷️ Water Spider Pattern - 完全ガイド

**トヨタ生産方式の「Water Spider (資材補充係)」を応用した、永続的自動継続システム**

## 📋 概要

### 現在の決定的弱点

❌ **Claude Codeセッションが停止した時、人間が「次へ」を押す必要がある**
- 自動化の継続性が途切れる
- 完全自律実行ができない
- 並行実行が制限される

### Water Spider Pattern による解決

✅ **完全自律実行**
- 人間の介入なしで永続的に実行
- 「次へ」を押す必要なし
- セッション停止を自動検知 → 即座に継続

✅ **真の並行実行**
- 複数Worktreeで同時に作業
- セッション間の独立性維持
- Just-In-Time資材補充

## 🏗️ アーキテクチャ

```
┌─────────────────────────────────────────────┐
│       CoordinatorAgent (Orchestrator)       │
│       - 全体監視                             │
│       - タスク分解                           │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    WaterSpiderAgent (Auto-Continue)         │
│    - セッション監視 (5秒間隔)                │
│    - 停止検知 → 自動継続                     │
│    - Webhook通信                            │
└────────────────┬────────────────────────────┘
                 │
     ┌───────────┼───────────┬───────────┐
     │           │           │           │
     ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Tmux    │ │ Tmux    │ │ Tmux    │ │ Tmux    │
│ Session │ │ Session │ │ Session │ │ Session │
│ #1      │ │ #2      │ │ #3      │ │ #4      │
│         │ │         │ │         │ │         │
│ Claude  │ │ Claude  │ │ Claude  │ │ Claude  │
│ Code    │ │ Code    │ │ Code    │ │ Code    │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│    Webhook Server (localhost:3002)          │
│    - POST /api/session/status               │
│    - POST /api/session/:id/continue         │
│    - GET  /api/sessions                     │
└─────────────────────────────────────────────┘
```

## 🚀 使い方

### 1. 基本的な起動

```bash
# Water Spider起動 (全自動)
npm run water-spider:start
```

これで以下が自動実行されます:
1. Webhookサーバー起動 (port 3002)
2. 全Worktreeに対してTmuxセッション作成
3. Water Spider監視開始

### 2. 個別操作

#### Tmuxセッション管理

```bash
# 全Worktreeに対してセッション作成
npm run water-spider:create-sessions

# または
npm run tmux:create

# 全セッション確認
npm run tmux:list

# 全セッション終了
npm run tmux:kill
```

#### Webhookサーバーのみ起動

```bash
# デバッグ用: Webhookサーバーのみ起動
npm run water-spider:webhook
```

#### セッション監視のみ

```bash
# Webhookサーバーが既に起動している場合
npm run water-spider:start
```

### 3. Tmuxセッションへの接続

```bash
# 特定のセッションに接続
tsx scripts/tmux/tmux-manager.ts attach miyabi-issue-101-phase3-review

# Detach: Ctrl+B → D
```

## ⚙️ 設定

### 監視設定 (scripts/water-spider-main.ts)

```typescript
const config: WaterSpiderConfig = {
  monitorInterval: 5000,    // 監視間隔: 5秒
  maxIdleTime: 30000,       // 最大アイドル時間: 30秒
  autoRestart: true,        // 自動再起動: 有効
  webhookUrl: 'http://localhost:3002',
};
```

### Webhook設定

- **Port**: 3002 (変更可能)
- **Endpoints**:
  - `POST /api/session/status` - セッション状態受信
  - `POST /api/session/:id/continue` - 継続通知
  - `GET /api/sessions` - 全セッション取得
  - `GET /health` - ヘルスチェック

## 📊 監視ダッシュボード

### セッション状態確認

```bash
# ブラウザで開く
open http://localhost:3002/api/sessions

# または curl
curl http://localhost:3002/api/sessions | jq
```

**レスポンス例**:

```json
{
  "timestamp": "2025-10-13T06:30:00.000Z",
  "total": 4,
  "sessions": [
    {
      "sessionId": "issue-101-phase3-review",
      "status": "running",
      "lastActivity": 1728806400000,
      "idleTime": 0,
      "needsContinue": false,
      "continueCount": 3
    },
    {
      "sessionId": "issue-102-phase4-coverage",
      "status": "idle",
      "lastActivity": 1728806370000,
      "idleTime": 30000,
      "needsContinue": true,
      "continueCount": 5
    }
  ]
}
```

## 🔄 動作フロー

### 1. セッション起動

```
npm run water-spider:start
  ↓
Webhookサーバー起動 (localhost:3002)
  ↓
Tmuxセッション作成 (.worktrees/* → miyabi-*)
  ↓
各セッションでClaude Code起動
  ↓
Water Spider監視開始
```

### 2. 監視ループ (5秒ごと)

```
セッション状態チェック
  ↓
Tmux paneキャプチャ
  ↓
アイドル検出 (「続けますか」「Continue?」等)
  ↓
YES → アイドル時間 > 30秒?
  ↓
YES → 「続けてください」送信
  ↓
Webhook通知
  ↓
次の監視へ (5秒後)
```

### 3. 自動継続

```
停止検知
  ↓
tmux send-keys "続けてください" Enter
  ↓
セッション再開
  ↓
継続カウント +1
  ↓
Webhook通知
```

## 🛠️ トラブルシューティング

### Tmuxセッションが作成されない

```bash
# Tmuxインストール確認
which tmux

# macOS
brew install tmux

# Ubuntu
sudo apt-get install tmux
```

### セッションが停止し続ける

```bash
# セッション状態確認
npm run tmux:list

# 特定のセッションに接続して確認
tsx scripts/tmux/tmux-manager.ts attach miyabi-issue-101

# ログ確認
tail -f logs/*.log
```

### Webhookサーバーが起動しない

```bash
# ポート3002が使用中か確認
lsof -i:3002

# プロセス終了
kill -9 <PID>

# Webhookサーバーのみ起動してテスト
npm run webhook:server
```

### 自動継続が動作しない

```bash
# Hookスクリプト実行権限確認
ls -la .claude/hooks/session-continue.sh

# 手動テスト
./.claude/hooks/session-continue.sh miyabi-issue-101-phase3-review

# アイドル検出テスト
tmux capture-pane -t miyabi-issue-101-phase3-review -p | grep "続けますか"
```

## 📈 パフォーマンス

### リソース使用量

- **CPU**: 低負荷 (監視ループのみ)
- **メモリ**: 各Tmuxセッションごとに ~50MB
- **ネットワーク**: ローカル通信のみ (Webhook)

### スケーラビリティ

- **推奨**: 4-8セッション並行
- **最大**: 制限なし (マシンスペック依存)

## 🎯 期待される効果

### 1. 完全自律実行 ✅

- 人間の介入なし
- 24/7稼働可能
- 自動復帰

### 2. 開発効率向上 ✅

- 並行実行による高速化
- 待ち時間ゼロ
- リソース最適活用

### 3. トヨタ生産方式の実現 ✅

- Just-In-Time補充
- ムダの排除 (待ち時間)
- 継続的フロー

## 🔗 関連ドキュメント

- [OpenAI Dev Day Integration](../CLAUDE.md#git-worktree並列実行アーキテクチャ)
- [CoordinatorAgent](../.claude/agents/specs/coding/coordinator-agent.md)
- [Tmux Best Practices](https://github.com/tmux/tmux/wiki)

## 📝 実装ファイル

### Core Components

- `agents/water-spider/water-spider-agent.ts` - Water Spider本体
- `agents/water-spider/session-manager.ts` - セッション管理
- `agents/water-spider/webhook-client.ts` - Webhook通信

### Infrastructure

- `scripts/tmux/tmux-manager.ts` - Tmux制御
- `scripts/webhook/webhook-server.ts` - Webhookサーバー
- `.claude/hooks/session-continue.sh` - 自動継続Hook

### Entry Point

- `scripts/water-spider-main.ts` - メインエントリーポイント

---

🕷️ **Water Spider Pattern** - ラインを止めない、永続的自動継続システム

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
