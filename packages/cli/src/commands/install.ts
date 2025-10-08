/**
 * install command - Install Agentic OS into existing project
 *
 * Flow:
 * 1. Analyze existing project
 * 2. GitHub OAuth authentication
 * 3. Create/merge labels
 * 4. Auto-label existing Issues
 * 5. Deploy workflows (non-destructive)
 * 6. Link to Projects V2
 */

import ora from 'ora';
import chalk from 'chalk';
import { analyzeProject } from '../analyze/project.js';
import { githubOAuth } from '../auth/github-oauth.js';
import { setupLabels } from '../setup/labels.js';
import { autoLabelIssues } from '../analyze/issues.js';
import { deployWorkflows } from '../setup/workflows.js';

// @ts-ignore - inquirer is an ESM-only module
import inquirer from 'inquirer';
import { linkToProject } from '../setup/projects.js';

export interface InstallOptions {
  dryRun?: boolean;
}

export async function install(options: InstallOptions = {}) {
  console.log(chalk.gray('Analyzing your existing project...\n'));

  // Step 1: Analyze project
  const spinner = ora('Scanning project structure...').start();
  let analysis: any;

  try {
    analysis = await analyzeProject();
    spinner.succeed(chalk.green('Project analysis complete'));
  } catch (error) {
    spinner.fail(chalk.red('プロジェクトの解析に失敗しました'));
    if (error instanceof Error) {
      if (error.message.includes('Not a git repository')) {
        throw new Error('git repository not found: このディレクトリはGitリポジトリではありません');
      }
      if (error.message.includes('no origin remote')) {
        throw new Error('git remote not found: リモートリポジトリが設定されていません');
      }
      throw new Error(`Project analysis failed: ${error.message}`);
    }
    throw new Error('Project analysis failed: Unknown error');
  }

  // Display analysis results
  console.log(chalk.cyan('\n📊 Analysis Results:\n'));
  console.log(chalk.white(`  Repository: ${analysis.repo}`));
  console.log(chalk.white(`  Languages: ${analysis.languages.join(', ')}`));
  console.log(chalk.white(`  Framework: ${analysis.framework || 'None detected'}`));
  console.log(chalk.white(`  Open Issues: ${analysis.issueCount}`));
  console.log(chalk.white(`  Pull Requests: ${analysis.prCount}\n`));

  if (options.dryRun) {
    console.log(chalk.yellow('🔍 Dry run mode - no changes will be made\n'));
    console.log(chalk.gray('Would install:'));
    console.log(chalk.gray('  ✓ 53 labels (10 categories)'));
    console.log(chalk.gray('  ✓ 12+ GitHub Actions workflows'));
    console.log(chalk.gray('  ✓ Projects V2 integration'));
    console.log(chalk.gray(`  ✓ Auto-label ${analysis.issueCount} existing Issues\n`));
    return;
  }

  // Confirm installation
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Install Agentic OS into this project?',
      default: true,
    },
  ]);

  if (!confirmed) {
    console.log(chalk.yellow('\n⏸️  Installation cancelled\n'));
    return;
  }

  // Step 2: GitHub OAuth
  spinner.start('Authenticating with GitHub...');
  let token: string;

  try {
    token = await githubOAuth();
    spinner.succeed(chalk.green('GitHub authentication complete'));
  } catch (error) {
    spinner.fail(chalk.red('GitHub認証に失敗しました'));
    if (error instanceof Error) {
      throw new Error(`GitHub authentication failed: ${error.message}`);
    }
    throw new Error('GitHub authentication failed: Unknown error');
  }

  // Step 3: Setup labels
  spinner.start('Setting up labels (checking for conflicts)...');

  try {
    const result = await setupLabels(analysis.owner, analysis.repo, token, {
      merge: true,
    });
    spinner.succeed(
      chalk.green(`Labels setup complete (${result.created} created, ${result.updated} updated)`)
    );
  } catch (error) {
    spinner.fail(chalk.red('ラベルのセットアップに失敗しました'));
    if (error instanceof Error) {
      throw new Error(`Label setup failed: ${error.message}`);
    }
    throw new Error('Label setup failed: Unknown error');
  }

  // Step 4: Auto-label existing Issues
  if (analysis.issueCount > 0) {
    spinner.start(`Analyzing and labeling ${analysis.issueCount} existing Issues...`);

    try {
      const labeled = await autoLabelIssues(analysis.owner, analysis.repo, token);
      spinner.succeed(chalk.green(`${labeled} Issues labeled successfully`));
    } catch (error) {
      spinner.fail(chalk.red('自動ラベリングに失敗しました'));
      if (error instanceof Error) {
        throw new Error(`Auto-labeling failed: ${error.message}`);
      }
      throw new Error('Auto-labeling failed: Unknown error');
    }
  }

  // Step 5: Deploy workflows
  spinner.start('Deploying GitHub Actions workflows...');

  try {
    const workflowCount = await deployWorkflows(analysis.owner, analysis.repo, token, {
      skipExisting: true,
    });
    spinner.succeed(chalk.green(`${workflowCount} workflows deployed`));
  } catch (error) {
    spinner.fail(chalk.red('ワークフローのデプロイに失敗しました'));
    if (error instanceof Error) {
      throw new Error(`Workflow deployment failed: ${error.message}`);
    }
    throw new Error('Workflow deployment failed: Unknown error');
  }

  // Step 6: Link to Projects V2
  spinner.start('Connecting to GitHub Projects V2...');

  try {
    await linkToProject(analysis.owner, analysis.repo, token);
    spinner.succeed(chalk.green('Projects V2 connected'));
  } catch (error) {
    spinner.fail(chalk.red('Projects V2の接続に失敗しました'));
    if (error instanceof Error) {
      throw new Error(`Projects V2 connection failed: ${error.message}`);
    }
    throw new Error('Projects V2 connection failed: Unknown error');
  }

  // Success!
  console.log(chalk.green.bold('\n✅ Agentic OS installed successfully!\n'));
  console.log(chalk.cyan('Your project now has:'));
  console.log(chalk.white('  ✓ Automated Issue → PR pipeline'));
  console.log(chalk.white('  ✓ 6 AI agents ready to work'));
  console.log(chalk.white('  ✓ Label-based state management'));
  console.log(chalk.white('  ✓ Real-time progress tracking\n'));
  console.log(chalk.gray('💡 Create an Issue to see the magic:'));
  console.log(chalk.white('  gh issue create --title "Your task" --body "Description"\n'));
}
