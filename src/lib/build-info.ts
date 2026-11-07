/**
 * Identidad del build, inyectada por next.config.ts (`env`). Se lee asi y no
 * del filesystem (.next/BUILD_ID, .git, package.json) porque en Cloudflare
 * Workers no hay filesystem en runtime.
 */
export interface BuildInfo {
  buildId: string;
  version: string;
  env: string;
  deployedAt: string | null;
}

export function getBuildInfo(): BuildInfo {
  return {
    buildId: process.env.MUNDOBL_BUILD_ID || 'dev',
    version: process.env.MUNDOBL_PACKAGE_VERSION || '0.0.0',
    env: process.env.NODE_ENV ?? 'production',
    deployedAt: process.env.BUILD_COMMIT_DATE ?? null,
  };
}

/** Ultimos commits (`<hash> <asunto>` por linea), tomados al buildear. */
export function getBuildRecentCommits(): string {
  return process.env.MUNDOBL_RECENT_COMMITS ?? '';
}
