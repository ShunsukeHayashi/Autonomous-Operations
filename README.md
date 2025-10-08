# Miyabi ✨

[![npm version](https://badge.fury.io/js/miyabi.svg)](https://www.npmjs.com/package/miyabi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**一つのコマンドで全てが完結する自律型開発フレームワーク**

## クイックスタート

```bash
npx miyabi
```

たったこれだけ。全て自動で完結します。

## インストール

```bash
# npxで直接実行（推奨）
npx miyabi

# グローバルインストール
npm install -g miyabi
miyabi
```

## 使い方

### ステップ1: コマンドを実行

```bash
npx miyabi
```

### ステップ2: メニューから選択

```
✨ Miyabi

一つのコマンドで全てが完結

? 何をしますか？
  🆕 新しいプロジェクトを作成
  📦 既存プロジェクトに追加
  📊 ステータス確認
  ❌ 終了
```

### ステップ3: あとは待つだけ

AIエージェントが自動で:
- Issueを分析してラベル付け
- タスクに分解
- コードを実装
- コード品質をレビュー
- PRを作成

10-15分でPRが完成。レビューして、マージするだけ。

## 特徴

- **一つのコマンド**: `miyabi`だけ覚えればOK
- **対話形式**: 必要な情報を質問形式で聞きます
- **完全自動**: Issue作成からPR作成まで全自動
- **6つのAIエージェント**: 自律的にタスクを処理
- **日本語対応**: UIは完全日本語

## 何が得られるか

- ✅ 自動Issue分析とラベル付け
- ✅ 自動コード実装
- ✅ 自動テスト作成
- ✅ 自動PR作成
- ✅ リアルタイム進捗確認
- ✅ GitHub Projects連携

## 使用例

### 新規プロジェクト作成

```bash
$ npx miyabi

? 何をしますか？ 🆕 新しいプロジェクトを作成
? プロジェクト名: my-app
? プライベートリポジトリにしますか？ No

🚀 セットアップ開始...
✓ GitHubリポジトリ作成
✓ ラベル設定（53個）
✓ ワークフロー配置（10+個）
✓ Projects設定
✓ ローカルにクローン

完了！🎉
```

### 既存プロジェクトに追加

```bash
$ cd my-existing-project
$ npx miyabi

? 何をしますか？ 📦 既存プロジェクトに追加
? ドライランで確認しますか？ Yes

🔍 プロジェクト解析中...
✓ 言語検出: JavaScript/TypeScript
✓ フレームワーク: Next.js
✓ ビルドツール: Vite
✓ パッケージマネージャー: pnpm

インストール予定:
  - 53個のラベル
  - 10+個のワークフロー
  - Projects V2連携
```

### ステータス確認

```bash
$ npx miyabi

? 何をしますか？ 📊 ステータス確認
? ウォッチモードを有効にしますか？ No

📊 Miyabi ステータス

State         Count  Status
───────────────────────────
Pending       2      ⏳ 待機中
Implementing  3      ⚡ 作業中
Reviewing     1      🔍 レビュー中
Done          15     ✓ 完了

📝 最近のPR:
#42 ユーザーダッシュボード追加
#41 ログインリダイレクト修正
#40 APIエンドポイントのドキュメント化
```

## ドキュメント

- [セットアップガイド](docs/GETTING_STARTED.md)
- [使用例](docs/CLI_USAGE_EXAMPLES.md)
- [パブリッシュガイド](docs/PUBLICATION_GUIDE.md)

## 必要要件

- Node.js >= 18
- GitHubアカウント
- git CLI
- gh CLI

## トラブルシューティング

### OAuth認証エラーが発生する

```
❌ エラーが発生しました: Error: Failed to request device code: Not Found
```

**原因**: OAuth Appが未設定のため、デバイスフロー認証が使えません。

**解決方法**: GitHub Personal Access Tokenを使用してください。

1. https://github.com/settings/tokens/new にアクセス
2. 以下の権限を選択:
   - `repo` - Full control of private repositories
   - `workflow` - Update GitHub Action workflows
   - `read:project`, `write:project` - Access projects
3. トークンを生成してコピー
4. プロジェクトのルートに `.env` ファイルを作成:
   ```bash
   echo "GITHUB_TOKEN=ghp_your_token_here" > .env
   ```
5. もう一度 `npx miyabi` を実行

### 古いバージョンが実行される

**解決方法**:

```bash
# グローバルインストールを削除
npm uninstall -g miyabi

# npxキャッシュをクリア
rm -rf ~/.npm/_npx

# 最新版を明示的に指定
npx miyabi@latest
```

### トークンが無効と表示される

```
⚠️ トークンが無効です。再認証が必要です
```

**解決方法**: `.env` ファイルのトークンを削除または更新してください:

```bash
# 古いトークンを削除
rm .env

# 新しいトークンを作成（上記の手順に従う）
echo "GITHUB_TOKEN=ghp_new_token" > .env
```

## ライセンス

MIT

---

**覚えるコマンドは一つだけ。**

```bash
npx miyabi
```

🤖 Powered by Claude AI
