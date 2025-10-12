/**
 * CoordinatorAgent - The Orchestrator of Autonomous Operations
 *
 * Responsibilities:
 * - Task decomposition (Issue → Tasks)
 * - DAG construction (dependency graph)
 * - Topological sorting
 * - Agent assignment
 * - Parallel execution control
 * - Progress monitoring
 *
 * This is the MOST IMPORTANT agent in the hierarchy.
 */

import { BaseAgent } from '../base-agent.js';
import {
  AgentType,
  AgentResult,
  AgentConfig,
  Task,
  Issue,
  DAG,
  TaskDecomposition,
  ExecutionPlan,
  ExecutionReport,
  TaskResult,
  AgentStatus,
  PlansDocument,
  TaskLevel,
  DecisionLog,
  Timeline,
  ProgressSummary,
} from '../types/index.js';
import { IssueAnalyzer } from '../utils/issue-analyzer.js';
import { DAGManager } from '../utils/dag-manager.js';
import * as fs from 'fs';
import * as path from 'path';

export class CoordinatorAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super('CoordinatorAgent', config);
  }

  /**
   * Main execution: Coordinate full task lifecycle
   */
  async execute(task: Task): Promise<AgentResult> {
    this.log('🎯 CoordinatorAgent starting orchestration');

    try {
      // 1. If task has issue reference, decompose it
      const issue = await this.fetchIssue(task);
      if (!issue) {
        return {
          status: 'failed',
          error: 'No Issue found for coordination',
        };
      }

      // 2. Decompose Issue into Tasks
      const decomposition = await this.decomposeIssue(issue);

      // 3. Build DAG and check for cycles
      const dag = decomposition.dag;
      if (decomposition.hasCycles) {
        await this.escalate(
          `Circular dependency detected in Issue #${issue.number}`,
          'TechLead',
          'Sev.2-High',
          { cycle: decomposition.tasks.map((t) => t.id) }
        );
      }

      // 4. Create execution plan
      const plan = await this.createExecutionPlan(decomposition.tasks, dag);

      // 5. Execute tasks in parallel (respecting dependencies)
      const report = await this.executeParallel(plan);

      this.log(`✅ Orchestration complete: ${report.summary.successRate}% success rate`);

      return {
        status: 'success',
        data: report,
        metrics: {
          taskId: task.id,
          agentType: this.agentType,
          durationMs: report.totalDurationMs,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.log(`❌ Orchestration failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ============================================================================
  // Task Decomposition
  // ============================================================================

  /**
   * Decompose GitHub Issue into executable Tasks
   */
  async decomposeIssue(issue: Issue): Promise<TaskDecomposition> {
    this.log(`🔍 Decomposing Issue #${issue.number}: ${issue.title}`);

    // Extract task information from Issue body
    const tasks = await this.extractTasks(issue);

    // Build dependency graph using DAGManager
    const dag = DAGManager.buildDAG(tasks);

    // Check for circular dependencies using DAGManager
    const hasCycles = DAGManager.detectCycles(dag);

    // Estimate total duration
    const estimatedTotalDuration = tasks.reduce(
      (sum, task) => sum + task.estimatedDuration,
      0
    );

    // Generate recommendations using DAGManager
    const recommendations = DAGManager.generateRecommendations(tasks, dag);

    return {
      originalIssue: issue,
      tasks,
      dag,
      estimatedTotalDuration,
      hasCycles,
      recommendations,
    };
  }

  /**
   * Extract tasks from Issue body
   * Supports formats:
   * - [ ] Task description
   * - 1. Task description
   * - ## Task Title
   */
  private async extractTasks(issue: Issue): Promise<Task[]> {
    const tasks: Task[] = [];
    const lines = issue.body.split('\n');

    let taskCounter = 0;

    for (const line of lines) {
      // Match checkbox tasks: - [ ] or - [x]
      const checkboxMatch = line.match(/^-\s*\[[ x]\]\s+(.+)$/i);
      if (checkboxMatch) {
        tasks.push(this.createTask(issue, checkboxMatch[1], taskCounter++));
        continue;
      }

      // Match numbered tasks: 1. Task or 1) Task
      const numberedMatch = line.match(/^\d+[\.)]\s+(.+)$/);
      if (numberedMatch) {
        tasks.push(this.createTask(issue, numberedMatch[1], taskCounter++));
        continue;
      }

      // Match heading tasks: ## Task Title
      const headingMatch = line.match(/^##\s+(.+)$/);
      if (headingMatch) {
        tasks.push(this.createTask(issue, headingMatch[1], taskCounter++));
        continue;
      }
    }

    // If no tasks found, create a single task from the issue
    if (tasks.length === 0) {
      tasks.push(this.createTask(issue, issue.title, 0));
    }

    this.log(`   Found ${tasks.length} tasks`);
    return tasks;
  }

  /**
   * Create Task from Issue information
   */
  private createTask(issue: Issue, title: string, index: number): Task {
    // Detect dependencies in title (e.g., "Task A (depends: #270)")
    const dependencyMatch = title.match(/#(\d+)/g);
    const dependencies = dependencyMatch
      ? dependencyMatch.map((d) => d.replace('#', 'issue-'))
      : [];

    // Use IssueAnalyzer for consistent analysis
    const type = IssueAnalyzer.determineType(issue.labels, title, issue.body);
    const severity = IssueAnalyzer.determineSeverity(issue.labels, title, issue.body);
    const impact = IssueAnalyzer.determineImpact(issue.labels, title, issue.body);
    const estimatedDuration = IssueAnalyzer.estimateDuration(title, issue.body, type);

    // Assign agent based on task type
    const assignedAgent = this.assignAgent(type);

    return {
      id: `task-${issue.number}-${index}`,
      title: title.trim(),
      description: `Task from Issue #${issue.number}`,
      type,
      priority: index,
      severity,
      impact,
      assignedAgent,
      dependencies,
      estimatedDuration,
      status: 'idle',
      metadata: {
        issueNumber: issue.number,
        issueUrl: issue.url,
      },
    };
  }

  /**
   * Assign Agent based on task type
   */
  private assignAgent(type: Task['type']): AgentType {
    const agentMap: Record<Task['type'], AgentType> = {
      feature: 'CodeGenAgent',
      bug: 'CodeGenAgent',
      refactor: 'CodeGenAgent',
      docs: 'CodeGenAgent',
      test: 'CodeGenAgent',
      deployment: 'DeploymentAgent',
    };

    return agentMap[type];
  }

  // ============================================================================
  // DAG Construction (Delegated to DAGManager)
  // ============================================================================
  // Note: All DAG operations now handled by DAGManager utility class
  // - DAGManager.buildDAG(tasks)
  // - DAGManager.detectCycles(dag)
  // - DAGManager.generateRecommendations(tasks, dag)
  // - DAGManager.calculateCriticalPath(tasks, dag)

  // ============================================================================
  // Execution Planning & Control
  // ============================================================================

  /**
   * Create execution plan
   */
  private async createExecutionPlan(
    tasks: Task[],
    dag: DAG
  ): Promise<ExecutionPlan> {
    const sessionId = `session-${Date.now()}`;
    const deviceIdentifier = this.config.deviceIdentifier || 'unknown';
    const concurrency = Math.min(tasks.length, 5); // Max 5 parallel

    const estimatedDuration = tasks.reduce(
      (sum, task) => sum + task.estimatedDuration,
      0
    );

    return {
      sessionId,
      deviceIdentifier,
      concurrency,
      tasks,
      dag,
      estimatedDuration,
      startTime: Date.now(),
    };
  }

  /**
   * Execute tasks in parallel (respecting DAG levels)
   */
  private async executeParallel(plan: ExecutionPlan): Promise<ExecutionReport> {
    this.log(`⚡ Starting parallel execution (concurrency: ${plan.concurrency})`);

    const results: TaskResult[] = [];
    const startTime = Date.now();

    // Execute level by level
    for (let levelIdx = 0; levelIdx < plan.dag.levels.length; levelIdx++) {
      const level = plan.dag.levels[levelIdx];
      this.log(`📍 Executing level ${levelIdx + 1}/${plan.dag.levels.length} (${level.length} tasks)`);

      // Execute tasks in this level in parallel
      const levelResults = await this.executeLevelParallel(
        level,
        plan.tasks,
        plan.concurrency
      );

      results.push(...levelResults);

      // Update progress
      this.logProgress(results, plan.tasks.length);
    }

    const endTime = Date.now();

    // Generate report
    const report: ExecutionReport = {
      sessionId: plan.sessionId,
      deviceIdentifier: plan.deviceIdentifier,
      startTime,
      endTime,
      totalDurationMs: endTime - startTime,
      summary: {
        total: plan.tasks.length,
        completed: results.filter((r) => r.status === 'completed').length,
        failed: results.filter((r) => r.status === 'failed').length,
        escalated: results.filter((r) => r.status === 'escalated').length,
        successRate: (results.filter((r) => r.status === 'completed').length / plan.tasks.length) * 100,
      },
      tasks: results,
      metrics: [],
      escalations: [],
    };

    // Save report
    await this.saveExecutionReport(report);

    return report;
  }

  /**
   * Execute all tasks in a level in parallel (OPTIMIZED: Real agent execution)
   *
   * Performance: Now calls actual specialist agents instead of simulation
   */
  private async executeLevelParallel(
    taskIds: string[],
    allTasks: Task[],
    _concurrency: number
  ): Promise<TaskResult[]> {
    const tasks = taskIds
      .map((id) => allTasks.find((t) => t.id === id))
      .filter((t): t is Task => t !== undefined);

    // Execute real agents in parallel
    const results = await Promise.all(
      tasks.map(async (task) => {
        const startTime = Date.now();
        this.log(`   🏃 Executing: ${task.id} (${task.assignedAgent})`);

        try {
          // Instantiate and execute the appropriate specialist agent
          const agent = await this.createSpecialistAgent(task.assignedAgent);
          const result = await agent.execute(task);
          const durationMs = Date.now() - startTime;

          return {
            taskId: task.id,
            status: result.status === 'success' ? ('completed' as AgentStatus) : ('failed' as AgentStatus),
            agentType: task.assignedAgent,
            durationMs,
            result,
          };
        } catch (error) {
          const durationMs = Date.now() - startTime;
          this.log(`   ❌ Task ${task.id} failed: ${(error as Error).message}`);

          return {
            taskId: task.id,
            status: 'failed' as AgentStatus,
            agentType: task.assignedAgent,
            durationMs,
            result: {
              status: 'failed' as const,
              error: (error as Error).message,
            },
          };
        }
      })
    );

    return results;
  }

  /**
   * Create a specialist agent instance based on agent type
   */
  private async createSpecialistAgent(agentType: AgentType): Promise<BaseAgent> {
    // Dynamically import agents to avoid circular dependencies
    switch (agentType) {
      case 'CodeGenAgent': {
        const { CodeGenAgent } = await import('../codegen/codegen-agent.js');
        return new CodeGenAgent(this.config);
      }
      case 'DeploymentAgent': {
        const { DeploymentAgent } = await import('../deployment/deployment-agent.js');
        return new DeploymentAgent(this.config);
      }
      case 'ReviewAgent': {
        const { ReviewAgent } = await import('../review/review-agent.js');
        return new ReviewAgent(this.config);
      }
      case 'IssueAgent': {
        const { IssueAgent } = await import('../issue/issue-agent.js');
        return new IssueAgent(this.config);
      }
      case 'PRAgent': {
        const { PRAgent } = await import('../pr/pr-agent.js');
        return new PRAgent(this.config);
      }
      default: {
        // Default to CodeGenAgent for unknown types
        const { CodeGenAgent } = await import('../codegen/codegen-agent.js');
        return new CodeGenAgent(this.config);
      }
    }
  }

  /**
   * Log execution progress
   */
  private logProgress(results: TaskResult[], total: number): void {
    const completed = results.filter((r) => r.status === 'completed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const running = 0; // Not tracked yet
    const waiting = total - results.length;

    this.log(
      `📊 Progress: Completed ${completed}/${total} | Running ${running} | Waiting ${waiting} | Failed ${failed}`
    );
  }

  /**
   * Save execution report to file
   */
  private async saveExecutionReport(report: ExecutionReport): Promise<void> {
    const reportsDir = this.config.reportDirectory;
    await this.ensureDirectory(reportsDir);

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportFile = `${reportsDir}/execution-report-${timestamp}.json`;

    await this.appendToFile(reportFile, JSON.stringify(report, null, 2));

    this.log(`📄 Execution report saved: ${reportFile}`);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Fetch Issue from GitHub (or local metadata)
   */
  private async fetchIssue(task: Task): Promise<Issue | null> {
    // Check if task has issue metadata
    if (task.metadata?.issueNumber) {
      // TODO: Fetch from GitHub API
      // For now, return mock issue
      return {
        number: task.metadata.issueNumber,
        title: task.title,
        body: task.description,
        state: 'open',
        labels: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: task.metadata.issueUrl || '',
      };
    }

    return null;
  }

  // ============================================================================
  // Plans.md Auto-Generation (Phase 2 - Issue #100)
  // ============================================================================

  /**
   * Generate execution plan (Plans.md) from Issue and DAG
   *
   * Inspired by OpenAI Dev Day - Feler's 7-hour session approach
   * Goal: Maintain trajectory during extended Claude Code sessions
   *
   * @param issue - GitHub Issue being processed
   * @param dag - Dependency graph with topologically sorted levels
   * @returns PlansDocument for Markdown generation
   */
  async generateExecPlan(issue: Issue, dag: DAG): Promise<PlansDocument> {
    this.log('📝 Generating execution plan (Plans.md)');

    // Extract overview from issue
    const overview = this.extractOverview(issue);

    // Organize tasks by DAG level
    const tasks = this.organizeTasks(dag);

    // Calculate progress summary
    const progress = this.calculateProgress(dag.nodes);

    // Initialize empty decision log (will be populated during execution)
    const decisions: DecisionLog[] = [];

    // Estimate timeline
    const timeline = this.estimateTimeline(dag.nodes);

    return {
      overview,
      tasks,
      progress,
      decisions,
      timeline,
    };
  }

  /**
   * Extract overview from Issue (first 1-2 sentences)
   */
  private extractOverview(issue: Issue): string {
    // Try to extract from ## Overview section
    const overviewMatch = issue.body.match(/##\s+Overview\s*\n([^\n]+(?:\n[^\n]+)?)/i);
    if (overviewMatch) {
      return overviewMatch[1].trim();
    }

    // Try to extract from ## 📋 Task Description section
    const descMatch = issue.body.match(/##\s+📋\s+Task Description\s*\n([^\n]+(?:\n[^\n]+)?)/i);
    if (descMatch) {
      return descMatch[1].trim();
    }

    // Fallback: Use issue title
    return issue.title;
  }

  /**
   * Organize tasks by DAG level
   */
  private organizeTasks(dag: DAG): TaskLevel[] {
    return dag.levels.map((level, index) => {
      const levelTasks = level
        .map((taskId) => dag.nodes.find((t) => t.id === taskId))
        .filter((t): t is Task => t !== undefined);

      return {
        level: index,
        tasks: levelTasks,
        canRunInParallel: levelTasks.length > 1,
      };
    });
  }

  /**
   * Calculate progress summary from tasks
   */
  private calculateProgress(tasks: Task[]): ProgressSummary {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'running').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    const pending = tasks.filter((t) => t.status === 'idle' || !t.status).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      failed,
      percentage,
    };
  }

  /**
   * Estimate timeline based on task durations
   */
  private estimateTimeline(tasks: Task[]): Timeline {
    const now = new Date();
    const started = now.toISOString().replace('T', ' ').split('.')[0];

    // Estimate completion time (sum of all durations)
    const totalMinutes = tasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);
    const expectedCompletion = new Date(now.getTime() + totalMinutes * 60 * 1000);
    const expectedCompletionStr = expectedCompletion.toISOString().replace('T', ' ').split('.')[0];

    return {
      started,
      lastUpdate: started,
      expectedCompletion: expectedCompletionStr,
    };
  }

  /**
   * Convert PlansDocument to Markdown
   *
   * @param plan - The execution plan
   * @param issueNumber - GitHub Issue number
   * @returns Markdown string
   */
  planToMarkdown(plan: PlansDocument, issueNumber: number): string {
    let md = `# Execution Plan - Issue #${issueNumber}\n\n`;

    // Overview
    md += `## Overview\n${plan.overview}\n\n`;

    // Tasks (grouped by level)
    md += `## Tasks\n`;
    for (const level of plan.tasks) {
      md += `### Level ${level.level}${level.canRunInParallel ? ' (並行実行可能)' : ''}\n`;
      for (const task of level.tasks) {
        const checkbox = task.status === 'completed' ? '[x]' : '[ ]';
        md += `- ${checkbox} Task ${task.id}: ${task.title}\n`;
        md += `  - Agent: ${task.assignedAgent}\n`;
        md += `  - Duration: ${task.estimatedDuration || 0}分\n`;
        md += `  - Status: ${task.status || 'idle'}\n`;
        if (task.dependencies.length > 0) {
          md += `  - Dependencies: ${task.dependencies.join(', ')}\n`;
        }
        md += `\n`;
      }
    }

    // Progress
    md += `## Progress\n`;
    md += `- Total: ${plan.progress.total} tasks\n`;
    md += `- Completed: ${plan.progress.completed}/${plan.progress.total} (${plan.progress.percentage}%)\n`;
    md += `- In Progress: ${plan.progress.inProgress}\n`;
    md += `- Pending: ${plan.progress.pending}\n`;
    md += `- Failed: ${plan.progress.failed}\n\n`;

    // Decisions
    if (plan.decisions.length > 0) {
      md += `## Decisions\n`;
      for (const decision of plan.decisions) {
        md += `### ${decision.timestamp}\n`;
        md += `- **Decision**: ${decision.decision}\n`;
        md += `- **Reason**: ${decision.reason}\n`;
        if (decision.alternatives) {
          md += `- **Alternatives**: ${decision.alternatives.join(', ')}\n`;
        }
        if (decision.implementation) {
          md += `- **Implementation**: ${decision.implementation}\n`;
        }
        md += `\n`;
      }
    }

    // Timeline
    md += `## Timeline\n`;
    md += `- Started: ${plan.timeline.started}\n`;
    md += `- Last Update: ${plan.timeline.lastUpdate}\n`;
    md += `- Expected Completion: ${plan.timeline.expectedCompletion}\n`;

    return md;
  }

  /**
   * Write Plans.md to Worktree
   *
   * @param plan - The execution plan
   * @param issueNumber - GitHub Issue number
   * @param worktreePath - Path to worktree directory
   */
  async writePlansToWorktree(
    plan: PlansDocument,
    issueNumber: number,
    worktreePath: string
  ): Promise<void> {
    const markdown = this.planToMarkdown(plan, issueNumber);
    const filePath = path.join(worktreePath, 'plans.md');

    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    // Write file
    await fs.promises.writeFile(filePath, markdown, 'utf-8');

    this.log(`✅ Plans.md written to ${filePath}`);
  }
}
