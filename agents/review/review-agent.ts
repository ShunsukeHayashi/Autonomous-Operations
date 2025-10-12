/**
 * ReviewAgent - Code Quality Assessment Agent
 *
 * Responsibilities:
 * - Static code analysis (ESLint, TypeScript)
 * - Security vulnerability scanning
 * - Quality scoring (0-100, passing threshold: 80)
 * - Review comments generation
 * - Escalation to CISO for critical security issues
 *
 * Scoring System:
 * - Base: 100 points
 * - ESLint error: -20 points each
 * - TypeScript error: -30 points each
 * - Critical security vulnerability: -40 points each
 * - Passing threshold: ≥80 points
 */

import { BaseAgent } from '../base-agent.js';
import {
  AgentResult,
  AgentConfig,
  Task,
  ReviewRequest,
  ReviewResult,
  QualityReport,
  QualityIssue,
  ReviewComment,
} from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

export class ReviewAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super('ReviewAgent', config);
  }

  /**
   * Main execution: Review code and assess quality
   */
  async execute(task: Task): Promise<AgentResult> {
    this.log('🔍 ReviewAgent starting code review');

    try {
      // 1. Create review request from task
      const reviewRequest = await this.createReviewRequest(task);

      // 2. Run static analysis
      const eslintIssues = await this.runESLint(reviewRequest.files);
      const typeScriptIssues = await this.runTypeScriptCheck(reviewRequest.files);

      // 3. Run security scan
      const securityIssues = await this.runSecurityScan(reviewRequest.files);

      // 4. Calculate quality score
      const qualityReport = this.calculateQualityScore(
        eslintIssues,
        typeScriptIssues,
        securityIssues
      );

      // 5. Generate review comments
      const comments = this.generateReviewComments(
        eslintIssues,
        typeScriptIssues,
        securityIssues
      );

      // 6. Determine if escalation is needed
      const escalationRequired = await this.checkEscalation(qualityReport);

      const reviewResult: ReviewResult = {
        qualityReport,
        approved: qualityReport.passed,
        escalationRequired,
        escalationTarget: escalationRequired ? this.determineEscalationTarget('security') : undefined,
        comments,
      };

      // 7. Escalate if critical security issues found
      if (escalationRequired) {
        await this.escalate(
          `Critical security issues found: ${securityIssues.filter(i => i.severity === 'critical').length} critical vulnerabilities`,
          'CISO',
          'Sev.1-Critical',
          {
            qualityScore: qualityReport.score,
            criticalIssues: securityIssues.filter(i => i.severity === 'critical').length,
          }
        );
      }

      this.log(`✅ Review complete: Score ${qualityReport.score}/100 (${qualityReport.passed ? 'PASSED' : 'FAILED'})`);

      return {
        status: escalationRequired ? 'escalated' : 'success',
        data: reviewResult,
        metrics: {
          taskId: task.id,
          agentType: this.agentType,
          durationMs: Date.now() - this.startTime,
          qualityScore: qualityReport.score,
          errorsFound: qualityReport.issues.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.log(`❌ Review failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ============================================================================
  // Review Request Creation
  // ============================================================================

  /**
   * Create review request from task
   */
  private async createReviewRequest(task: Task): Promise<ReviewRequest> {
    this.log('📋 Creating review request');

    // Get files to review from task metadata or scan changed files
    let files: string[] = [];

    if (task.metadata?.files) {
      files = task.metadata.files as string[];
    } else {
      // Scan for recently modified files
      files = await this.getRecentlyModifiedFiles();
    }

    return {
      files,
      branch: task.metadata?.branch as string || 'main',
      context: task.description || '',
    };
  }

  /**
   * Get recently modified TypeScript files
   */
  private async getRecentlyModifiedFiles(): Promise<string[]> {
    const files: string[] = [];

    const scanDir = async (dir: string) => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDir(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    await scanDir(process.cwd());
    return files;
  }

  // ============================================================================
  // Static Analysis - ESLint
  // ============================================================================

  /**
   * Run ESLint on files
   */
  private async runESLint(files: string[]): Promise<QualityIssue[]> {
    this.log('🔧 Running ESLint analysis');

    const issues: QualityIssue[] = [];

    try {
      const result = await this.executeCommand(
        'npx eslint --format json ' + files.map(f => `"${f}"`).join(' '),
        { timeout: 60000 }
      );

      await this.logToolInvocation(
        'eslint',
        result.code === 0 ? 'passed' : 'failed',
        `ESLint completed with ${result.code === 0 ? 'no' : 'some'} issues`,
        result.stdout
      );

      // Parse ESLint JSON output
      if (result.stdout) {
        try {
          const eslintResults = JSON.parse(result.stdout);
          for (const fileResult of eslintResults) {
            for (const message of fileResult.messages || []) {
              issues.push({
                type: 'eslint',
                severity: message.severity === 2 ? 'high' : 'medium',
                message: message.message,
                file: fileResult.filePath,
                line: message.line,
                column: message.column,
                scoreImpact: message.severity === 2 ? 20 : 10,
              });
            }
          }
        } catch (parseError) {
          this.log(`⚠️  Failed to parse ESLint output`);
        }
      }
    } catch (error) {
      this.log(`⚠️  ESLint execution failed: ${(error as Error).message}`);
      await this.logToolInvocation(
        'eslint',
        'failed',
        'ESLint execution error',
        undefined,
        (error as Error).message
      );
    }

    this.log(`   Found ${issues.length} ESLint issues`);
    return issues;
  }

  // ============================================================================
  // Static Analysis - TypeScript
  // ============================================================================

  /**
   * Run TypeScript type checking
   */
  private async runTypeScriptCheck(_files: string[]): Promise<QualityIssue[]> {
    this.log('📘 Running TypeScript type checking');

    const issues: QualityIssue[] = [];

    try {
      const result = await this.executeCommand(
        'npx tsc --noEmit --pretty false',
        { timeout: 60000 }
      );

      await this.logToolInvocation(
        'typescript',
        result.code === 0 ? 'passed' : 'failed',
        `TypeScript check ${result.code === 0 ? 'passed' : 'found errors'}`,
        result.stdout + result.stderr
      );

      // Parse TypeScript errors
      const errorPattern = /(.+?)\((\d+),(\d+)\):\s*error\s+TS\d+:\s*(.+)/g;
      const output = result.stdout + result.stderr;
      let match;

      while ((match = errorPattern.exec(output)) !== null) {
        issues.push({
          type: 'typescript',
          severity: 'high',
          message: match[4].trim(),
          file: match[1].trim(),
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          scoreImpact: 30,
        });
      }
    } catch (error) {
      this.log(`⚠️  TypeScript check failed: ${(error as Error).message}`);
      await this.logToolInvocation(
        'typescript',
        'failed',
        'TypeScript check execution error',
        undefined,
        (error as Error).message
      );
    }

    this.log(`   Found ${issues.length} TypeScript errors`);
    return issues;
  }

  // ============================================================================
  // Security Scanning
  // ============================================================================

  /**
   * Run security vulnerability scan
   */
  private async runSecurityScan(files: string[]): Promise<QualityIssue[]> {
    this.log('🔒 Running security scan');

    const issues: QualityIssue[] = [];

    // 1. Scan for hardcoded secrets
    const secretIssues = await this.scanForSecrets(files);
    issues.push(...secretIssues);

    // 2. Scan for common vulnerabilities
    const vulnIssues = await this.scanForVulnerabilities(files);
    issues.push(...vulnIssues);

    // 3. Run npm audit
    const auditIssues = await this.runNpmAudit();
    issues.push(...auditIssues);

    this.log(`   Found ${issues.length} security issues (${issues.filter(i => i.severity === 'critical').length} critical)`);
    return issues;
  }

  /**
   * Scan for hardcoded secrets
   */
  private async scanForSecrets(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    const secretPatterns = [
      { pattern: /(?:api[_-]?key|apikey)[\s]*[:=][\s]*['"]([^'"]+)['"]/gi, name: 'API Key' },
      { pattern: /(?:password|passwd|pwd)[\s]*[:=][\s]*['"]([^'"]+)['"]/gi, name: 'Password' },
      { pattern: /(?:secret|token)[\s]*[:=][\s]*['"]([^'"]+)['"]/gi, name: 'Secret/Token' },
      { pattern: /(?:sk-[a-zA-Z0-9]{20,})/g, name: 'Anthropic API Key' },
      { pattern: /(?:ghp_[a-zA-Z0-9]{36,})/g, name: 'GitHub Token' },
    ];

    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (const { pattern, name } of secretPatterns) {
            if (pattern.test(line)) {
              issues.push({
                type: 'security',
                severity: 'critical',
                message: `Possible hardcoded ${name} detected`,
                file,
                line: i + 1,
                scoreImpact: 40,
              });
            }
          }
        }
      } catch (error) {
        // Ignore file read errors
      }
    }

    return issues;
  }

  /**
   * Scan for common vulnerabilities
   */
  private async scanForVulnerabilities(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    const vulnPatterns = [
      { pattern: /eval\s*\(/g, name: 'Use of eval()', severity: 'critical' as const },
      { pattern: /innerHTML\s*=/g, name: 'XSS risk: innerHTML assignment', severity: 'high' as const },
      { pattern: /document\.write\s*\(/g, name: 'XSS risk: document.write', severity: 'high' as const },
      { pattern: /exec\s*\(/g, name: 'Command injection risk', severity: 'high' as const },
    ];

    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (const { pattern, name, severity } of vulnPatterns) {
            if (pattern.test(line)) {
              issues.push({
                type: 'security',
                severity,
                message: name,
                file,
                line: i + 1,
                scoreImpact: severity === 'critical' ? 40 : 20,
              });
            }
          }
        }
      } catch (error) {
        // Ignore file read errors
      }
    }

    return issues;
  }

  /**
   * Run npm audit for dependency vulnerabilities
   */
  private async runNpmAudit(): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    try {
      const result = await this.executeCommand(
        'npm audit --json',
        { timeout: 30000 }
      );

      await this.logToolInvocation(
        'npm_audit',
        result.code === 0 ? 'passed' : 'failed',
        'npm audit completed',
        result.stdout
      );

      if (result.stdout) {
        try {
          const audit = JSON.parse(result.stdout);

          if (audit.vulnerabilities) {
            for (const [pkgName, vuln] of Object.entries(audit.vulnerabilities)) {
              const v = vuln as any;
              if (v.severity === 'critical' || v.severity === 'high') {
                issues.push({
                  type: 'security',
                  severity: v.severity,
                  message: `Dependency vulnerability in ${pkgName}: ${v.via[0]?.title || 'Unknown issue'}`,
                  scoreImpact: v.severity === 'critical' ? 40 : 20,
                });
              }
            }
          }
        } catch (parseError) {
          // Ignore parse errors
        }
      }
    } catch (error) {
      this.log(`⚠️  npm audit failed: ${(error as Error).message}`);
    }

    return issues;
  }

  // ============================================================================
  // Quality Scoring
  // ============================================================================

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    eslintIssues: QualityIssue[],
    typeScriptIssues: QualityIssue[],
    securityIssues: QualityIssue[]
  ): QualityReport {
    this.log('📊 Calculating quality score');

    let score = 100;

    // Deduct points for each issue
    const allIssues = [...eslintIssues, ...typeScriptIssues, ...securityIssues];
    for (const issue of allIssues) {
      score -= issue.scoreImpact;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Calculate breakdown
    const eslintScore = 100 - eslintIssues.reduce((sum, i) => sum + i.scoreImpact, 0);
    const typeScriptScore = 100 - typeScriptIssues.reduce((sum, i) => sum + i.scoreImpact, 0);
    const securityScore = 100 - securityIssues.reduce((sum, i) => sum + i.scoreImpact, 0);

    // Generate recommendations
    const recommendations: string[] = [];
    if (eslintScore < 80) recommendations.push('Fix ESLint errors to improve code quality');
    if (typeScriptScore < 80) recommendations.push('Fix TypeScript errors for type safety');
    if (securityScore < 80) recommendations.push('Address security vulnerabilities immediately');
    if (score < 80) recommendations.push('Overall quality below threshold - review all issues');

    return {
      score: Math.round(score),
      passed: score >= 80,
      issues: allIssues,
      recommendations,
      breakdown: {
        eslintScore: Math.max(0, Math.round(eslintScore)),
        typeScriptScore: Math.max(0, Math.round(typeScriptScore)),
        securityScore: Math.max(0, Math.round(securityScore)),
        testCoverageScore: 100, // TODO: Implement actual coverage check
      },
    };
  }

  // ============================================================================
  // Review Comments
  // ============================================================================

  /**
   * Generate review comments for GitHub PR
   */
  private generateReviewComments(
    eslintIssues: QualityIssue[],
    typeScriptIssues: QualityIssue[],
    securityIssues: QualityIssue[]
  ): ReviewComment[] {
    const comments: ReviewComment[] = [];

    const allIssues = [...eslintIssues, ...typeScriptIssues, ...securityIssues];

    for (const issue of allIssues) {
      if (issue.file && issue.line) {
        comments.push({
          file: issue.file,
          line: issue.line,
          severity: issue.severity,
          message: `**[${issue.type.toUpperCase()}]** ${issue.message}`,
          suggestion: this.generateSuggestion(issue),
        });
      }
    }

    return comments;
  }

  /**
   * Generate fix suggestion for issue
   */
  private generateSuggestion(issue: QualityIssue): string | undefined {
    if (issue.type === 'security' && issue.message.includes('hardcoded')) {
      return 'Move this secret to environment variables using process.env.SECRET_NAME';
    }

    if (issue.type === 'security' && issue.message.includes('eval')) {
      return 'Replace eval() with safer alternatives like JSON.parse() or Function constructor';
    }

    if (issue.type === 'typescript' && issue.message.includes('implicitly has')) {
      return 'Add explicit type annotation';
    }

    return undefined;
  }

  // ============================================================================
  // Escalation
  // ============================================================================

  /**
   * Check if escalation is required
   */
  private async checkEscalation(qualityReport: QualityReport): Promise<boolean> {
    // Escalate if critical security issues found
    const criticalSecurityIssues = qualityReport.issues.filter(
      i => i.type === 'security' && i.severity === 'critical'
    );

    if (criticalSecurityIssues.length > 0) {
      this.log(`🚨 ${criticalSecurityIssues.length} critical security issues require escalation`);
      return true;
    }

    // Escalate if quality score is very low (<50)
    if (qualityReport.score < 50) {
      this.log(`🚨 Quality score ${qualityReport.score} is critically low - escalation required`);
      return true;
    }

    return false;
  }
}
