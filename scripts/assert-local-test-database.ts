import assert from 'node:assert/strict';

/** Deliberately narrow: local replay database, or explicitly selected disposable Prisma dev runtime. */
export function assertLocalTestDatabase() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55433');
  assert.ok(
    url.pathname === '/mundobl_replay' ||
      (url.pathname === '/template1' &&
        process.env.MUNDOBL_TEST_RUNTIME === 'prisma-dev'),
    'Tests require mundobl_replay or the explicitly selected disposable Prisma dev database'
  );
}
