import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Deliberately narrow: tests only run against a disposable local SQLite file
 * (test-results/ or the OS temp folder), never the real D1 or a dev database.
 */
export function assertLocalTestDatabase() {
  const url = process.env.DATABASE_URL ?? '';
  assert.ok(url.startsWith('file:'), 'Tests require DATABASE_URL=file:...');
  const file = path.resolve(url.slice('file:'.length));
  const allowed = [path.resolve('test-results'), path.resolve(tmpdir())];
  assert.ok(
    allowed.some((dir) => file.startsWith(dir + path.sep)),
    `Tests require a disposable database under test-results/ or ${tmpdir()}`
  );
}
