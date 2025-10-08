#!/usr/bin/env node

/**
 * Post-install script for Miyabi
 *
 * Automatically runs initial sequence after npm install
 * This ensures users get the full Miyabi experience immediately
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Colors fallback for older terminals
const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

/**
 * Check if we're in a user project (not in Miyabi's own node_modules)
 */
function isUserProject() {
  const cwd = process.cwd();

  // Skip if we're inside Miyabi's own directory
  if (cwd.includes('/Miyabi/') || cwd.includes('/Autonomous-Operations/')) {
    return false;
  }

  // Skip if we're in the global npm directory
  if (cwd.includes('/.npm/') || cwd.includes('/lib/node_modules/')) {
    return false;
  }

  return true;
}

/**
 * Check if this is a fresh install (no .miyabi marker)
 */
function isFreshInstall() {
  const markerPath = path.join(process.cwd(), '.miyabi-initialized');
  return !fs.existsSync(markerPath);
}

/**
 * Create initialization marker
 */
function createMarker() {
  const markerPath = path.join(process.cwd(), '.miyabi-initialized');
  fs.writeFileSync(
    markerPath,
    JSON.stringify({
      initializedAt: new Date().toISOString(),
      miyabiVersion: require('../package.json').version,
    }, null, 2),
    'utf-8'
  );
}

/**
 * Main initial sequence
 */
async function runInitialSequence() {
  // Only run in user projects
  if (!isUserProject()) {
    return;
  }

  // Only run on fresh installs
  if (!isFreshInstall()) {
    return;
  }

  console.log('\n' + colors.cyan(colors.bold('🌸 Miyabi インストール完了！')));
  console.log(colors.gray('初期セットアップを開始します...\n'));

  // Step 1: Display welcome message
  displayWelcome();

  // Step 2: Check environment
  const envCheck = checkEnvironment();
  displayEnvironmentStatus(envCheck);

  // Step 3: Create marker to prevent re-running
  createMarker();

  // Step 4: Display next steps
  displayNextSteps(envCheck);
}

/**
 * Display welcome message
 */
function displayWelcome() {
  console.log(colors.green('✓ Miyabi CLI がインストールされました\n'));

  console.log(colors.cyan('Miyabiとは？'));
  console.log(colors.gray('  一つのコマンドで全てが完結する自律型開発フレームワーク'));
  console.log(colors.gray('  7つのAI Agentが自動的にコードを書き、レビューし、デプロイします\n'));
}

/**
 * Check environment
 */
function checkEnvironment() {
  const checks = {
    node: false,
    git: false,
    githubToken: false,
    hasPackageJson: false,
    hasGitRepo: false,
  };

  // Check Node.js version
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
  checks.node = nodeMajor >= 18;

  // Check if git is available
  try {
    require('child_process').execSync('git --version', { stdio: 'ignore' });
    checks.git = true;
  } catch (error) {
    checks.git = false;
  }

  // Check GITHUB_TOKEN
  checks.githubToken = !!process.env.GITHUB_TOKEN;

  // Check if package.json exists
  checks.hasPackageJson = fs.existsSync(path.join(process.cwd(), 'package.json'));

  // Check if .git directory exists
  checks.hasGitRepo = fs.existsSync(path.join(process.cwd(), '.git'));

  return checks;
}

/**
 * Display environment status
 */
function displayEnvironmentStatus(checks) {
  console.log(colors.cyan('環境チェック:'));

  if (checks.node) {
    console.log(colors.green('  ✓ Node.js ' + process.version + ' (OK)'));
  } else {
    console.log(colors.yellow('  ⚠ Node.js ' + process.version + ' (18以上を推奨)'));
  }

  if (checks.git) {
    console.log(colors.green('  ✓ Git インストール済み'));
  } else {
    console.log(colors.yellow('  ⚠ Git が見つかりません'));
  }

  if (checks.githubToken) {
    console.log(colors.green('  ✓ GITHUB_TOKEN 設定済み'));
  } else {
    console.log(colors.yellow('  ⚠ GITHUB_TOKEN 未設定'));
  }

  if (checks.hasGitRepo) {
    console.log(colors.green('  ✓ Gitリポジトリ検出'));
  }

  console.log('');
}

/**
 * Display next steps
 */
function displayNextSteps(checks) {
  console.log(colors.cyan(colors.bold('次のステップ:')));

  if (!checks.hasGitRepo && !checks.hasPackageJson) {
    // New project scenario
    console.log(colors.green('\n1️⃣  新しいプロジェクトを作成:'));
    console.log(colors.gray('   npx miyabi init my-project\n'));

    console.log(colors.green('2️⃣  または、既存プロジェクトにインストール:'));
    console.log(colors.gray('   cd my-existing-project'));
    console.log(colors.gray('   npx miyabi install\n'));
  } else {
    // Existing project scenario
    console.log(colors.green('\n1️⃣  Miyabiを既存プロジェクトに統合:'));
    console.log(colors.gray('   npx miyabi install\n'));

    console.log(colors.green('2️⃣  プロジェクト状態を確認:'));
    console.log(colors.gray('   npx miyabi status\n'));
  }

  console.log(colors.green('3️⃣  対話モードで実行:'));
  console.log(colors.gray('   npx miyabi\n'));

  if (!checks.githubToken) {
    console.log(colors.yellow('💡 GitHub Token設定方法:'));
    console.log(colors.gray('   export GITHUB_TOKEN=ghp_your_token_here'));
    console.log(colors.gray('   または、npx miyabi を実行して認証フローを開始\n'));
  }

  console.log(colors.cyan('📚 ドキュメント:'));
  console.log(colors.gray('   https://github.com/ShunsukeHayashi/Miyabi\n'));

  console.log(colors.green('🌸 Miyabi - Beauty in Autonomous Development\n'));
}

// Run initial sequence
runInitialSequence().catch((error) => {
  console.error(colors.yellow('初期セットアップでエラーが発生しました:'), error.message);
  console.error(colors.gray('問題が続く場合は手動で実行してください: npx miyabi\n'));
});
