import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';

// Run the actual profile calendar queries against an in-memory SQLite fixture
// (same engine as D1). No application database is touched.
const iso = (date) => date.toISOString().replace('Z', '+00:00');
const now = new Date();
const days = (n) => iso(new Date(now.getTime() + n * 86_400_000));

/** The query text from the source, with its ${...} placeholders as named params. */
function sqlite(text) {
  const params = {};
  const sql = text.replace(/\$\{([^}]+)\}/g, (_, expression) => {
    const key = `p${Object.keys(params).length}`;
    const ago = expression.match(/^daysAgo\((\d+)\)$/);
    params[key] =
      expression === 'userId'
        ? '__user__'
        : expression === 'now'
          ? iso(now)
          : ago
            ? days(-Number(ago[1]))
            : assert.fail(`Unknown placeholder ${expression}`);
    return `@${key}`;
  });
  return (user) =>
    db
      .prepare(sql)
      .all(
        Object.fromEntries(
          Object.entries(params).map(([k, v]) => [
            k,
            v === '__user__' ? user : v,
          ])
        )
      );
}

const source = readFileSync('src/app/api/user/profile/route.ts', 'utf8');
const queries = [
  ...source.matchAll(/prisma\.\$queryRaw<RawDayRow\[\]>`([\s\S]*?)`/g),
].map((match) => match[1]);
assert.equal(queries.length, 2, 'Verify both weekly and heatmap queries');

const db = new Database(':memory:');
try {
  db.exec(`CREATE TABLE "ViewStatus" (
    "userId" text, status text, "episodeId" integer, "seriesId" integer,
    "watchedDate" text, "updatedAt" text
  )`);
  const insert = db.prepare(
    `INSERT INTO "ViewStatus" ("userId", status, "episodeId", "seriesId", "watchedDate", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (const [user, status, episode, date] of [
    ['owner', 'VISTA', 1, days(-1)],
    ['owner', 'VISTA', 2, days(-8)],
    ['owner', 'VISTA', 3, days(-30)],
    ['owner', 'VISTA', 4, null],
    ['owner', 'VISTA', 5, days(1)],
    ['owner', 'VISTA', 6, days(-100)],
    ['other', 'VISTA', 7, iso(now)],
    ['owner', 'SIN_VER', 8, iso(now)],
    ['owner', 'VISTA', null, iso(now)],
  ])
    insert.run(user, status, episode, null, date, iso(now));
  const [weekly, heatmap] = queries.map(sqlite);
  assert.equal(weekly('owner').length, 1);
  assert.equal(heatmap('owner').length, 4);
  assert.equal(weekly('other').length, 1);
  assert.equal(heatmap('unknown').length, 0);

  for (const [user, status, series, date] of [
    ['owner', 'VISTA', 101, '2020-05-01T00:00:00.000+00:00'],
    ['owner', 'VISTA', 102, '2020-10-01T00:00:00.000+00:00'],
    ['owner', 'VISTA', 103, '2021-01-01T00:00:00.000+00:00'],
    ['owner', 'VISTA', 104, null],
    ['owner', 'VISTA', 105, days(365)],
    ['owner', 'VIENDO', 106, '2020-01-01T00:00:00.000+00:00'],
    ['other', 'VISTA', 107, '2020-01-01T00:00:00.000+00:00'],
  ])
    insert.run(user, status, null, series, date, iso(now));
  const years = sqlite(
    source.match(/prisma\.\$queryRaw<RawYearRow\[\]>`([\s\S]*?)`/)[1]
  )('owner');
  assert.deepEqual(
    years.map(({ year, count }) => [year, Number(count)]),
    [
      [2021, 1],
      [2020, 2],
    ],
    'Completion years depend on watch dates, not catalog release dates'
  );

  db.exec(
    `CREATE TABLE "Episode" (id integer, duration integer, "durationSeconds" integer)`
  );
  db.exec(
    `INSERT INTO "Episode" VALUES (1,30,NULL),(2,999,3600),(3,NULL,NULL),(4,0,0),(5,-2,-3),(6,20,NULL),(7,999,NULL),(8,999,NULL)`
  );
  // Las horas viven en getWatchedTime (database.ts), que comparten el
  // perfil y los logros.
  const minutes = sqlite(
    readFileSync('src/lib/database.ts', 'utf8').match(
      /function getWatchedTime\([\s\S]*?>`([\s\S]*?)`/
    )[1]
  )('owner')[0];
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
  db.close();
}
