// Backup -> restore de punta a punta sobre la base de pruebas (que a esta
// altura tiene los datos que dejaron las pruebas anteriores): el volcado se
// carga en una base nueva con las mismas filas, sin foreign keys rotas, sin
// historial inventado por el trigger y sin dejar el lease de restauracion.

import assert from 'node:assert/strict';
import path from 'node:path';
import Database from 'better-sqlite3';
import { dumpData } from './db/sqlite-dump.mjs';
import { restoreLocal } from './db/restore-local.mjs';

const fileOf = (url) => {
  assert.ok(url?.startsWith('file:'), 'Se esperaba DATABASE_URL=file:...');
  return path.resolve(url.slice('file:'.length));
};
const source = fileOf(process.env.BACKUP_TEST_SOURCE_URL);
const target = fileOf(process.env.BACKUP_TEST_TARGET_URL);
assert.ok(source.includes(`${path.sep}test-results${path.sep}`));
assert.ok(target.includes(`${path.sep}test-results${path.sep}`));

// Own fixture, so the step also works when the run resumes from here.
{
  const db = new Database(source);
  const key = `backup-${Date.now()}`;
  const now = new Date().toISOString().replace('Z', '+00:00');
  db.prepare(
    'INSERT INTO "User" (id, email, "createdAt", "updatedAt") VALUES (?, ?, ?, ?)'
  ).run(key, `${key}@example.test`, now, now);
  const series = db
    .prepare(
      `INSERT INTO "Series" (title, type, "createdAt", "updatedAt") VALUES (?, 'serie', ?, ?) RETURNING id`
    )
    .pluck()
    .get(key, now, now);
  const season = db
    .prepare(
      `INSERT INTO "Season" ("seriesId", "seasonNumber", "createdAt", "updatedAt") VALUES (?, 1, ?, ?) RETURNING id`
    )
    .pluck()
    .get(series, now, now);
  const episode = db
    .prepare(
      `INSERT INTO "Episode" ("seasonId", "episodeNumber", "createdAt", "updatedAt") VALUES (?, 1, ?, ?) RETURNING id`
    )
    .pluck()
    .get(season, now, now);
  db.prepare(
    `INSERT INTO "ViewStatus" ("userId", "episodeId", status, "watchedDate", "createdAt", "updatedAt") VALUES (?, ?, 'VISTA', ?, ?, ?)`
  ).run(key, episode, now, now, now);
  db.close();
}

const dump = `${target}.sql`;
const dumped = dumpData(source, dump);
const restored = restoreLocal(dump, target);
assert.deepEqual(restored, dumped, 'Every table restores with the same rows');
assert.ok(
  dumped.ViewStatus > 0 && dumped.TrackingEvent > 0,
  'Fixture has tracking'
);

const db = new Database(target, { readonly: true });
try {
  assert.equal(db.prepare('SELECT COUNT(*) FROM "Lease"').pluck().get(), 0);
  // The history trigger is back on after the restore.
  const user = db
    .prepare('SELECT "userId" FROM "ViewStatus" LIMIT 1')
    .pluck()
    .get();
  assert.ok(user);
} finally {
  db.close();
}
const writable = new Database(target);
try {
  const row = writable
    .prepare(
      'SELECT id, "userId" FROM "ViewStatus" WHERE "episodeId" IS NOT NULL LIMIT 1'
    )
    .get();
  const before = writable
    .prepare('SELECT COUNT(*) FROM "TrackingEvent"')
    .pluck()
    .get();
  writable
    .prepare(
      `UPDATE "ViewStatus" SET status = CASE status WHEN 'VISTA' THEN 'SIN_VER' ELSE 'VISTA' END, "watchedDate" = '2020-01-01T00:00:00.000+00:00' WHERE id = ?`
    )
    .run(row.id);
  assert.equal(
    writable.prepare('SELECT COUNT(*) FROM "TrackingEvent"').pluck().get(),
    before + 1,
    'History recording resumes after a restore'
  );
} finally {
  writable.close();
}
const total = Object.values(dumped).reduce((a, b) => a + b, 0);
console.log(
  `PASS backup/restore: ${total} rows in ${Object.keys(dumped).length} tables, foreign keys intact, no synthetic history, trigger back on.`
);
