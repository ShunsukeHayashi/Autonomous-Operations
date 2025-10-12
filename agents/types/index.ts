/**
 * Agent Types and Interfaces
 *
 * Core type definitions for the Autonomous Operations Agent system
 */

// ============================================================================
// Base Types
// ============================================================================

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'escalated';

export type EscalationTarget = 'TechLead' | 'PO' | 'CISO' | 'CTO' | 'DevOps';

export type AgentType =
  | 'CoordinatorAgent'
  | 'CodeGenAgent'
  | 'ReviewAgent'
  | 'IssueAgent'
  | 'PRAgent'
  | 'DeploymentAgent'
  | 'AutoFixAgent';

export type Severity =
  | 'Sev.1-Critical'
  | 'Sev.2-High'
  | 'Sev.3-Medium'
  | 'Sev.4-Low'
  | 'Sev.5-Trivial';

export type ImpactLevel = 'Critical' | 'High' | 'Medium' | 'Low';

// ============================================================================
// Task & Issue Types
// ============================================================================

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'refactor' | 'docs' | 'test' | 'deployment';
  priority: number;
  severity?: Severity;
  impact?: ImpactLevel;
  assignedAgent?: AgentType;
  dependencies: string[]; // Task IDs
  estimatedDuration?: number; // minutes
  status?: AgentStatus;
  startTime?: number;
  endTime?: number;
  metadata?: Record<string, any>;
}

export interface Issue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface DAG {
  nodes: Task[];
  edges: Array<{ from: string; to: string }>;
  levels: string[][]; // Topologically sorted levels
}

// ============================================================================
// Agent Result Types
// ============================================================================

export interface AgentResult {
  status: 'success' | 'failed' | 'escalated';
  data?: any;
  error?: string;
  metrics?: Partial<AgentMetrics>;
  escalation?: EscalationInfo;
}

export interface AgentMetrics {
  taskId: string;
  agentType: AgentType;
  durationMs: number;
  qualityScore?: number;
  linesChanged?: number;
  testsAdded?: number;
  coveragePercent?: number;
  errorsFound?: number;
  timestamp: string;
}

export interface EscalationInfo {
  reason: string;
  target: EscalationTarget;
  severity: Severity;
  context: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// Quality Assessment Types
// ============================================================================

export interface QualityReport {
  score: number; // 0-100
  passed: boolean; // score >= 80
  issues: QualityIssue[];
  recommendations: string[];
  breakdown: {
    eslintScore: number;
    typeScriptScore: number;
    securityScore: number;
    testCoverageScore: number;
  };
}

export interface QualityIssue {
  type: 'eslint' | 'typescript' | 'security' | 'coverage';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  scoreImpact: number; // Points deducted
}

// ============================================================================
// Coordinator Types
// ============================================================================

export interface TaskDecomposition {
  originalIssue: Issue;
  tasks: Task[];
  dag: DAG;
  estimatedTotalDuration: number;
  hasCycles: boolean;
  recommendations: string[];
}

export interface ExecutionPlan {
  sessionId: string;
  deviceIdentifier: string;
  concurrency: number;
  tasks: Task[];
  dag: DAG;
  estimatedDuration: number;
  startTime: number;
}

export interface ExecutionReport {
  sessionId: string;
  deviceIdentifier: string;
  startTime: number;
  endTime: number;
  totalDurationMs: number;
  summary: {
    total: number;
    completed: number;
    failed: number;
    escalated: number;
    successRate: number;
  };
  tasks: TaskResult[];
  metrics: AgentMetrics[];
  escalations: EscalationInfo[];
}

export interface TaskResult {
  taskId: string;
  status: AgentStatus;
  agentType: AgentType;
  durationMs: number;
  result?: AgentResult;
  error?: string;
}

// ============================================================================
// Code Generation Types
// ============================================================================

export interface CodeSpec {
  feature: string;
  requirements: string[];
  context: {
    existingFiles: string[];
    architecture: string;
    dependencies: string[];
  };
  constraints: string[];
}

export interface GeneratedCode {
  files: Array<{
    path: string;
    content: string;
    type: 'new' | 'modified';
  }>;
  tests: Array<{
    path: string;
    content: string;
  }>;
  documentation: string;
  summary: string;
}

// ============================================================================
// Review Types
// ============================================================================

export interface ReviewRequest {
  files: string[];
  branch: string;
  context: string;
}

export interface ReviewResult {
  qualityReport: QualityReport;
  approved: boolean;
  escalationRequired: boolean;
  escalationTarget?: EscalationTarget;
  comments: ReviewComment[];
}

export interface ReviewComment {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  suggestion?: string;
}

// ============================================================================
// PR Types
// ============================================================================

export interface PRRequest {
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  draft: boolean;
  issueNumber?: number;
  labels?: string[];
  reviewers?: string[];
}

export interface PRResult {
  number: number;
  url: string;
  state: 'draft' | 'open' | 'merged' | 'closed';
  createdAt: string;
}

// ============================================================================
// Deployment Types
// ============================================================================

export interface DeploymentConfig {
  environment: 'staging' | 'production';
  version: string;
  projectId: string;
  targets: string[]; // Firebase targets: ['hosting', 'functions']
  skipTests?: boolean;
  autoRollback: boolean;
  healthCheckUrl: string;
}

export interface DeploymentResult {
  environment: 'staging' | 'production';
  version: string;
  projectId: string;
  deploymentUrl: string;
  deployedAt: string;
  durationMs: number;
  status: 'success' | 'failed' | 'rolled_back';
}

// ============================================================================
// Log-Driven Development (LDD) Types
// ============================================================================

export interface CodexPromptChain {
  intent: string;
  plan: string[];
  implementation: string[];
  verification: string[];
}

export interface ToolInvocation {
  command: string;
  workdir: string;
  timestamp: string;
  status: 'passed' | 'failed';
  notes: string;
  output?: string;
  error?: string;
}

export interface LDDLog {
  sessionId: string;
  date: string;
  deviceIdentifier: string;
  codexPromptChain: CodexPromptChain;
  toolInvocations: ToolInvocation[];
  memoryBankUpdates: string[];
  nextSteps: string;
}

// ============================================================================
// Parallel Execution Types
// ============================================================================

export interface WorkerPool {
  maxConcurrency: number;
  activeWorkers: number;
  queue: Task[];
  running: Map<string, Task>;
  completed: Map<string, TaskResult>;
  failed: Map<string, TaskResult>;
}

export interface ProgressStatus {
  total: number;
  completed: number;
  running: number;
  waiting: number;
  failed: number;
  percentage: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AgentConfig {
  deviceIdentifier: string;
  githubToken: string;
  useTaskTool: boolean;
  useWorktree: boolean;
  worktreeBasePath?: string;
  logDirectory: string;
  reportDirectory: string;
  techLeadGithubUsername?: string;
  cisoGithubUsername?: string;
  poGithubUsername?: string;
  // Deployment config
  firebaseProductionProject?: string;
  firebaseStagingProject?: string;
  productionUrl?: string;
  stagingUrl?: string;
}

export interface ExecutionOptions {
  issues?: number[];
  todos?: string[];
  concurrency: number;
  dryRun?: boolean;
  ignoreDependencies?: boolean;
  timeout?: number; // minutes
}

// ============================================================================
// Error Types
// ============================================================================

export class AgentError extends Error {
  constructor(
    message: string,
    public agentType: AgentType,
    public taskId?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class EscalationError extends Error {
  constructor(
    message: string,
    public target: EscalationTarget,
    public severity: Severity,
    public context: Record<string, any>
  ) {
    super(message);
    this.name = 'EscalationError';
  }
}

export class CircularDependencyError extends Error {
  constructor(
    message: string,
    public cycle: string[]
  ) {
    super(message);
    this.name = 'CircularDependencyError';
  }
}

// ============================================================================
// Plans.md Auto-Generation Types (Phase 2 - Issue #100)
// ============================================================================

/**
 * PlansDocument - "Living Documentation" for long-running Claude Code sessions
 *
 * Inspired by OpenAI Dev Day - Feler's 7-hour session approach
 * Goal: Maintain trajectory during extended sessions (1.5B tokens, 15k lines refactor)
 */
export interface PlansDocument {
  overview: string;
  tasks: TaskLevel[];
  progress: ProgressSummary;
  decisions: DecisionLog[];
  timeline: Timeline;
}

/**
 * TaskLevel - Tasks grouped by DAG level for parallel execution
 */
export interface TaskLevel {
  level: number;
  tasks: Task[];
  canRunInParallel: boolean;
}

/**
 * DecisionLog - Captures technical decisions during execution
 * Why: Document reasoning for future reference
 */
export interface DecisionLog {
  timestamp: string;
  decision: string;
  reason: string;
  alternatives?: string[];
  implementation?: string;
}

/**
 * Timeline - Execution timeline tracking
 */
export interface Timeline {
  started: string;
  lastUpdate: string;
  expectedCompletion: string;
}

/**
 * ProgressSummary - Real-time progress tracking
 */
export interface ProgressSummary {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  failed: number;
  percentage: number;
}

// ============================================================================
// Discord Community Types (E13)
// ============================================================================

export interface DiscordCommunity {
  // Identification
  serverId: string;
  serverName: string;

  // Channels
  channels: DiscordChannel[];

  // Roles
  roles: DiscordRole[];

  // Members
  members: number;

  // Webhook integrations
  webhooks: WebhookConfig[];

  // Bot integrations
  botIntegrations: BotConfig[];

  // Metadata
  createdAt: string;
}

export interface DiscordChannel {
  id: string;
  name: string; // e.g., "#announcements"
  type: 'text' | 'voice' | 'forum';
  category: string; // e.g., "Information & Announcements"
  purpose: string;
}

export interface DiscordRole {
  id: string;
  name: string; // e.g., "🌱 Newcomer"
  level: number; // 1-5
  requirements: string;
}

export interface WebhookConfig {
  channelId: string;
  webhookUrl: string;
  triggerEvents: string[]; // e.g., ['issue.created', 'pr.merged']
}

export interface BotConfig {
  name: string; // e.g., "MEE6", "GitHub Bot", "Custom Miyabi Bot"
  enabled: boolean;
  commands: BotCommand[];
}

export interface BotCommand {
  name: string; // e.g., "/miyabi status"
  description: string;
  usage: string;
}
