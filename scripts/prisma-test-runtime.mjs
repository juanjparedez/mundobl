import assert from 'node:assert/strict';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

// PGlite has one backend. Keep its tests on one connection; do not change the app pool.
const url = new URL(process.env.DATABASE_URL ?? '');
assert.equal(process.env.MUNDOBL_TEST_RUNTIME, 'prisma-dev');
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.port, '55433');
assert.equal(url.pathname, '/template1');
globalThis.prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.toString(), max: 1 }),
});
