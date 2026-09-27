import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

// Run the actual profile calendar queries against a session-local fixture.
// No application tables, permissions, or production connections are changed.
const connectionString = process.env.DATABASE_URL;
assert.ok(connectionString, 'Set the isolated local test DATABASE_URL');
const url = new URL(connectionString);
assert.equal(url.hostname, '127.0.0.1');
assert.equal(url.port, '55433');
assert.equal(url.pathname, '/mundobl_replay');
const source = readFileSync('src/app/api/user/profile/route.ts', 'utf8');
const queries = [
  ...source.matchAll(/prisma\.\$queryRaw<RawDayRow\[\]>`([\s\S]*?)`/g),
].map((match) => match[1].replaceAll('${userId}', '$1'));
assert.equal(queries.length, 2, 'Verify both weekly and heatmap queries');
const client = new Client({ connectionString });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(`CREATE TEMP TABLE "ViewStatus" (
    "userId" text, status text, "episodeId" integer,
    "watchedDate" timestamp, "updatedAt" timestamp
  ) ON COMMIT DROP`);
  await client.query(`INSERT INTO "ViewStatus" VALUES
    ('owner', 'VISTA', 1, NOW() - INTERVAL '1 day', NOW()),
    ('owner', 'VISTA', 2, NOW() - INTERVAL '8 days', NOW()),
    ('owner', 'VISTA', 3, NOW() - INTERVAL '30 days', NOW()),
    ('owner', 'VISTA', 4, NULL, NOW()),
    ('owner', 'VISTA', 5, NOW() + INTERVAL '1 day', NOW()),
    ('owner', 'VISTA', 6, NOW() - INTERVAL '100 days', NOW()),
    ('other', 'VISTA', 7, NOW(), NOW()),
    ('owner', 'SIN_VER', 8, NOW(), NOW()),
    ('owner', 'VISTA', NULL, NOW(), NOW())`);
  assert.equal((await client.query(queries[0], ['owner'])).rowCount, 1);
  assert.equal((await client.query(queries[1], ['owner'])).rowCount, 4);
  assert.equal((await client.query(queries[0], ['other'])).rowCount, 1);
  assert.equal((await client.query(queries[1], ['unknown'])).rowCount, 0);
  await client.query('ALTER TABLE "ViewStatus" ADD COLUMN "seriesId" integer');
  await client.query(`INSERT INTO "ViewStatus" ("userId", status, "seriesId", "watchedDate") VALUES
    ('owner', 'VISTA', 101, '2020-05-01'),
    ('owner', 'VISTA', 102, '2020-10-01'),
    ('owner', 'VISTA', 103, '2021-01-01'),
    ('owner', 'VISTA', 104, NULL),
    ('owner', 'VISTA', 105, NOW() + INTERVAL '1 year'),
    ('owner', 'VIENDO', 106, '2020-01-01'),
    ('other', 'VISTA', 107, '2020-01-01')`);
  const yearsQuery = source
    .match(/prisma\.\$queryRaw<RawYearRow\[\]>`([\s\S]*?)`/)[1]
    .replaceAll('${userId}', '$1');
  const years = (await client.query(yearsQuery, ['owner'])).rows;
  assert.deepEqual(
    years.map(({ year, count }) => [year, Number(count)]),
    [
      [2021, 1],
      [2020, 2],
    ],
    'Completion years depend on watch dates, not catalog release dates'
  );
  await client.query(
    `CREATE TEMP TABLE "Episode" (id integer, duration integer, "durationSeconds" integer) ON COMMIT DROP`
  );
  await client.query(
    `INSERT INTO "Episode" VALUES (1,30,NULL),(2,999,3600),(3,NULL,NULL),(4,0,0),(5,-2,-3),(6,20,NULL),(7,999,NULL),(8,999,NULL)`
  );
  const minutesQuery = source
    .match(/prisma\.\$queryRaw<RawMinutesRow\[\]>`([\s\S]*?)`/)[1]
    .replaceAll('${userId}', '$1');
  const minutes = (await client.query(minutesQuery, ['owner'])).rows[0];
  assert.equal(
    Number(minutes.total_minutes),
    110,
    'Prefer measured seconds, otherwise positive minute durations'
  );
  assert.equal(
    Number(minutes.unknown_durations),
    3,
    'Unknown, zero and negative durations do not become watched hours'
  );
  console.log(
    'PASS: profile calendars use watch dates; old edits, unknown/future dates, other accounts and non-episode states do not inflate activity.'
  );
} finally {
  await client.query('ROLLBACK');
  await client.end();
}
