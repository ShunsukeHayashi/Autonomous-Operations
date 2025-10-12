/**
 * GitHub Token Helper
 *
 * Securely retrieves GitHub token with the following priority:
 * 1. gh CLI authentication (recommended)
 * 2. GITHUB_TOKEN environment variable (fallback for CI/CD)
 * 3. Throws error if neither is available
 */
/**
 * Get GitHub token with priority: gh CLI > environment variable
 * @returns GitHub personal access token
 * @throws Error if no valid token is found
 */
export declare function getGitHubToken(): Promise<string>;
/**
 * Synchronous version of getGitHubToken for compatibility
 * @returns GitHub personal access token
 * @throws Error if no valid token is found
 */
export declare function getGitHubTokenSync(): string;
/**
 * Check if gh CLI is available and authenticated
 * @returns true if gh CLI is authenticated
 */
export declare function isGhCliAuthenticated(): boolean;
/**
 * Validate token format (basic check)
 * @param token GitHub token to validate
 * @returns true if token format looks valid
 */
export declare function isValidTokenFormat(token: string): boolean;
//# sourceMappingURL=github-token-helper.d.ts.map