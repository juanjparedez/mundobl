import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { getBuildMetadata } from '../src/lib/build-metadata';

const directory = mkdtempSync(join(tmpdir(), 'mundobl-build-'));
try {
  const sha = 'abcdef0123456789abcdef0123456789abcdef0123';
  const date = '2026-10-12T22:00:00-03:00';
  assert.deepEqual(
    getBuildMetadata(directory, {
      MUNDOBL_BUILD_SHA: sha,
      MUNDOBL_BUILD_COMMIT_DATE: date,
    }),
    { buildId: sha.slice(0, 12), commitDate: date }
  );
  assert.equal(
    getBuildMetadata(directory, { VERCEL_GIT_COMMIT_SHA: sha }).buildId,
    sha.slice(0, 12)
  );
  const fallback = getBuildMetadata(directory, {});
  assert.match(fallback.buildId, /^[a-z0-9]+$/);
  assert.ok(Number.isFinite(Date.parse(fallback.commitDate)));
  writeFileSync(join(directory, '.git'), 'gitdir: missing-worktree');
  assert.doesNotThrow(() => getBuildMetadata(directory, {}));
  console.log(
    'Build metadata: CI without .git, provider SHA and missing/broken Git fallback passed.'
  );
} finally {
  assert.equal(dirname(directory), tmpdir());
  rmSync(directory, { recursive: true, force: true });
}
