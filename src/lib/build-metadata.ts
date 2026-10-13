import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Build-time only: CLI deployments receive their identity from GitHub Actions. */
export function getBuildMetadata(
  cwd = process.cwd(),
  env: NodeJS.ProcessEnv = process.env
) {
  const readGit = (args: string[]) => {
    if (!existsSync(join(cwd, '.git'))) return '';
    try {
      return execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();
    } catch {
      return '';
    }
  };
  const sha =
    env.MUNDOBL_BUILD_SHA ||
    env.VERCEL_GIT_COMMIT_SHA ||
    readGit(['rev-parse', 'HEAD']);
  const date =
    env.MUNDOBL_BUILD_COMMIT_DATE || readGit(['log', '-1', '--format=%cI']);
  return {
    buildId: /^[a-f0-9]{7,64}$/i.test(sha)
      ? sha.slice(0, 12)
      : Date.now().toString(36),
    commitDate:
      date && Number.isFinite(Date.parse(date))
        ? date
        : new Date().toISOString(),
  };
}
