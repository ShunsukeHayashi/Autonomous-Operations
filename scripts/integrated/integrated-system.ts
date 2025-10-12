/**
 * Integrated System - Water Spider + Feedback Loop
 *
 * Complete autonomous development system combining:
 * - Water Spider Pattern (auto-continue)
 * - Feedback Loop System (quality improvement)
 */

import { WaterSpiderAgent } from '../../agents/water-spider/water-spider-agent.js';
import { GoalManager } from '../../agents/feedback-loop/goal-manager.js';
import { ConsumptionValidator } from '../../agents/feedback-loop/consumption-validator.js';
import { InfiniteLoopOrchestrator } from '../../agents/feedback-loop/infinite-loop-orchestrator.js';
import type {
  GoalDefinition,
  ActualMetrics,
  FeedbackLoop,
  Task,
} from '../../agents/types/index.js';
import { startServer as startWebhookServer } from '../webhook/webhook-server.js';
import { TmuxManager } from '../tmux/tmux-manager.js';

export interface IntegratedSystemConfig {
  // Water Spider config
  waterSpider: {
    monitorInterval: number;
    maxIdleTime: number;
    autoRestart: boolean;
    webhookUrl: string;
  };

  // Feedback Loop config
  feedbackLoop: {
    maxIterations: number;
    convergenceThreshold: number;
    minIterationsBeforeConvergence: number;
    autoRefinementEnabled: boolean;
  };

  // Integration config
  integration: {
    syncInterval: number;
    autoEscalation: boolean;
    maxConcurrentSessions: number;
  };

  // Directories
  directories: {
    goals: string;
    reports: string;
    loops: string;
    logs: string;
  };
}

/**
 * IntegratedSystem - Water Spider + Feedback Loop統合システム
 *
 * 完全自律実行 + 無限品質改善
 */
export class IntegratedSystem {
  private config: IntegratedSystemConfig;
  private goalManager: GoalManager;
  private consumptionValidator: ConsumptionValidator;
  private feedbackLoopOrchestrator: InfiniteLoopOrchestrator;
  private waterSpiderAgent: WaterSpiderAgent;

  private activeGoals: Map<string, GoalDefinition> = new Map();
  private activeLoops: Map<string, FeedbackLoop> = new Map();
  private isRunning: boolean = false;

  constructor(config: IntegratedSystemConfig) {
    this.config = config;

    // Initialize Goal Manager
    this.goalManager = new GoalManager({
      goalsDirectory: config.directories.goals,
      autoSave: true,
    });

    // Initialize Consumption Validator
    this.consumptionValidator = new ConsumptionValidator({
      reportsDirectory: config.directories.reports,
      autoSave: true,
      strictMode: false,
    });

    // Initialize Feedback Loop Orchestrator
    this.feedbackLoopOrchestrator = new InfiniteLoopOrchestrator(
      {
        maxIterations: config.feedbackLoop.maxIterations,
        convergenceThreshold: config.feedbackLoop.convergenceThreshold,
        minIterationsBeforeConvergence:
          config.feedbackLoop.minIterationsBeforeConvergence,
        autoRefinementEnabled: config.feedbackLoop.autoRefinementEnabled,
        logsDirectory: config.directories.loops,
        autoSave: true,
      },
      this.goalManager,
      this.consumptionValidator
    );

    // Initialize Water Spider Agent
    this.waterSpiderAgent = new WaterSpiderAgent({
      deviceIdentifier: process.env.DEVICE_IDENTIFIER || 'localhost',
      githubToken: process.env.GITHUB_TOKEN || '',
      useTaskTool: false,
      useWorktree: true,
      logDirectory: config.directories.logs,
      reportDirectory: config.directories.reports,
      monitorInterval: config.waterSpider.monitorInterval,
      maxIdleTime: config.waterSpider.maxIdleTime,
      autoRestart: config.waterSpider.autoRestart,
      webhookUrl: config.waterSpider.webhookUrl,
    });
  }

  /**
   * Start integrated system
   */
  async start(): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   🔗 Integrated System: Water Spider + Feedback Loop        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    this.isRunning = true;

    // 1. Start Webhook Server
    console.log('1️⃣ Starting Webhook Server...');
    startWebhookServer();
    await sleep(1000);

    // 2. Create Tmux Sessions
    console.log('');
    console.log('2️⃣ Creating Tmux Sessions...');
    TmuxManager.createAllSessions();
    await sleep(2000);

    // 3. Start Water Spider
    console.log('');
    console.log('3️⃣ Starting Water Spider Agent...');
    const waterSpiderTask: Task = {
      id: 'integrated-water-spider',
      title: 'Water Spider Monitoring',
      description: 'Monitor and auto-continue sessions',
      type: 'deployment',
      priority: 0,
      severity: 'Sev.3-Medium',
      impact: 'High',
      assignedAgent: 'WaterSpiderAgent',
      dependencies: [],
      estimatedDuration: 0,
      status: 'running',
    };

    // Start Water Spider in background
    this.waterSpiderAgent.execute(waterSpiderTask).catch((error) => {
      console.error('❌ Water Spider error:', error);
    });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ Integrated System is now running');
    console.log('');
    console.log('📊 Monitoring Dashboard:');
    console.log('   http://localhost:3002/api/sessions');
    console.log('');
    console.log('🔄 Water Spider: Auto-continue enabled');
    console.log('🎯 Feedback Loop: Ready for goal execution');
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await this.stop();
    });
  }

  /**
   * Execute goal with integrated system
   */
  async executeGoal(params: {
    title: string;
    description: string;
    issueNumber?: number;
    taskId?: string;
    successCriteria: GoalDefinition['successCriteria'];
    testSpecs: GoalDefinition['testSpecs'];
    acceptanceCriteria: string[];
  }): Promise<void> {
    console.log('');
    console.log('🎯 Executing Goal with Integrated System');
    console.log(`   Title: ${params.title}`);
    console.log('');

    // 1. Create goal
    const goal = this.goalManager.createGoal({
      title: params.title,
      description: params.description,
      successCriteria: params.successCriteria,
      testSpecs: params.testSpecs,
      acceptanceCriteria: params.acceptanceCriteria,
      priority: 1,
      issueNumber: params.issueNumber,
      taskId: params.taskId,
    });

    this.activeGoals.set(goal.id, goal);

    console.log(`✅ Goal created: ${goal.id}`);
    console.log('');

    // 2. Start feedback loop
    const loop = await this.feedbackLoopOrchestrator.startLoop(goal.id);
    this.activeLoops.set(loop.loopId, loop);

    console.log(`✅ Feedback Loop started: ${loop.loopId}`);
    console.log('');

    // 3. Execute iterations (Water Spider handles auto-continue)
    let iteration = 0;
    while (this.feedbackLoopOrchestrator.shouldContinue(loop.loopId)) {
      iteration++;
      console.log(`🔄 Iteration ${iteration}...`);

      // Simulate metrics collection (in real scenario, this comes from actual execution)
      const metrics = await this.collectMetrics(goal.id);

      // Execute iteration
      const iterationRecord = await this.feedbackLoopOrchestrator.executeIteration(
        loop.loopId,
        `session-${iteration}`,
        metrics
      );

      console.log(`   Score: ${iterationRecord.consumptionReport.overallScore}/100`);
      console.log(
        `   Goal Achieved: ${iterationRecord.consumptionReport.goalAchieved}`
      );
      console.log(`   ${iterationRecord.feedback.summary}`);
      console.log('');

      if (iterationRecord.consumptionReport.goalAchieved) {
        console.log('🎉 Goal achieved!');
        break;
      }

      // Wait for next iteration (Water Spider handles session continuation)
      await sleep(this.config.integration.syncInterval);
    }

    const finalLoop = this.feedbackLoopOrchestrator.getLoop(loop.loopId);
    if (finalLoop) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('📊 Final Report');
      console.log(`   Status: ${finalLoop.status}`);
      console.log(`   Iterations: ${finalLoop.iteration}`);
      console.log(
        `   Final Score: ${finalLoop.iterations[finalLoop.iterations.length - 1]?.consumptionReport.overallScore || 0}/100`
      );
      console.log('');
    }
  }

  /**
   * Stop integrated system
   */
  async stop(): Promise<void> {
    console.log('');
    console.log('🛑 Stopping Integrated System...');

    this.isRunning = false;

    // Stop Water Spider
    await this.waterSpiderAgent.stop();

    console.log('✅ Integrated System stopped');
    process.exit(0);
  }

  /**
   * Get system status
   */
  getStatus(): {
    isRunning: boolean;
    activeGoals: number;
    activeLoops: number;
    waterSpiderStatus: string;
  } {
    return {
      isRunning: this.isRunning,
      activeGoals: this.activeGoals.size,
      activeLoops: this.activeLoops.size,
      waterSpiderStatus: this.isRunning ? 'running' : 'stopped',
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async collectMetrics(goalId: string): Promise<ActualMetrics> {
    // In real scenario, this would collect metrics from actual execution
    // For now, return simulated progressive improvement

    const goal = this.activeGoals.get(goalId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    const loop = Array.from(this.activeLoops.values()).find(
      (l) => l.goalId === goalId
    );
    const iteration = loop?.iteration || 0;

    // Simulate progressive improvement
    const baseScore = 40 + iteration * 12;
    const qualityScore = Math.min(100, baseScore);

    return {
      qualityScore,
      eslintErrors: Math.max(0, 10 - iteration * 2),
      typeScriptErrors: Math.max(0, 5 - iteration),
      securityIssues: Math.max(0, 2 - Math.floor(iteration / 2)),
      testCoverage: Math.min(100, 50 + iteration * 8),
      testsPassed: Math.min(15, 5 + iteration * 2),
      testsFailed: Math.max(0, 5 - iteration),
      buildTimeMs: Math.max(10000, 25000 - iteration * 2000),
      linesOfCode: 500 + iteration * 50,
      cyclomaticComplexity: Math.max(5, 12 - iteration),
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const command = process.argv[2];

  const config: IntegratedSystemConfig = {
    waterSpider: {
      monitorInterval: 5000,
      maxIdleTime: 30000,
      autoRestart: true,
      webhookUrl: 'http://localhost:3002',
    },
    feedbackLoop: {
      maxIterations: 10,
      convergenceThreshold: 5,
      minIterationsBeforeConvergence: 3,
      autoRefinementEnabled: true,
    },
    integration: {
      syncInterval: 10000,
      autoEscalation: true,
      maxConcurrentSessions: 4,
    },
    directories: {
      goals: './data/goals',
      reports: './data/consumption-reports',
      loops: './data/feedback-loops',
      logs: './logs',
    },
  };

  const system = new IntegratedSystem(config);

  switch (command) {
    case 'start':
      await system.start();
      break;

    case 'demo':
      await system.start();
      await sleep(2000);

      // Execute demo goal
      await system.executeGoal({
        title: 'Demo: User Authentication Feature',
        description: 'Implement secure authentication with JWT',
        successCriteria: {
          minQualityScore: 85,
          maxEslintErrors: 0,
          maxTypeScriptErrors: 0,
          maxSecurityIssues: 0,
          minTestCoverage: 80,
          minTestsPassed: 10,
        },
        testSpecs: [],
        acceptanceCriteria: [
          'User can register',
          'User can login',
          'JWT token issued',
        ],
      });
      break;

    case 'status':
      const status = system.getStatus();
      console.log('Integrated System Status:');
      console.log(`  Running: ${status.isRunning}`);
      console.log(`  Active Goals: ${status.activeGoals}`);
      console.log(`  Active Loops: ${status.activeLoops}`);
      console.log(`  Water Spider: ${status.waterSpiderStatus}`);
      break;

    default:
      console.log('Integrated System - Water Spider + Feedback Loop');
      console.log('');
      console.log('Commands:');
      console.log('  start   Start integrated system');
      console.log('  demo    Run demonstration');
      console.log('  status  Show system status');
      process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}
