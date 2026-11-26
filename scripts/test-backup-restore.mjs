// Backup -> restore de punta a punta sobre la base de pruebas (que a esta
// altura tiene los datos que dejaron las pruebas anteriores): el volcado se
// carga en una base nueva con las mismas filas, sin foreign keys rotas, sin
// historial inventado por el trigger y sin dejar el lease de restauracion.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { dumpData } from './db/sqlite-dump.mjs';
import { restoreLocal } from './db/restore-local.mjs';
import { migrateLocal } from './db/migrate-local.mjs';

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
  // Self references whose parent has the higher id: a dump in id order
  // would load the child first.
  const maxId = (table) =>
    db.prepare(`SELECT COALESCE(MAX(id), 0) FROM "${table}"`).pluck().get();
  const parentComment = maxId('Comment') + 1000;
  const childComment = maxId('Comment') + 1;
  db.prepare(
    'INSERT INTO "Comment" (id, content, "seriesId", "userId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)'
  ).run(parentComment, 'parent', series, key, now, now);
  db.prepare(
    'INSERT INTO "Comment" (id, content, "seriesId", "userId", "parentId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(childComment, 'child', series, key, parentComment, now, now);
  const linked = db
    .prepare(
      `INSERT INTO "Series" (id, title, type, "createdAt", "updatedAt") VALUES (?, ?, 'serie', ?, ?) RETURNING id`
    )
    .pluck()
    .get(maxId('Series') + 1000, `${key}-linked`, now, now);
  db.prepare('UPDATE "Series" SET "linkedSeriesId" = ? WHERE id = ?').run(
    linked,
    series
  );
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
// D1 (`wrangler d1 execute --file`) commits the file in parts and checks
// foreign keys at each commit, so defer_foreign_keys does not help. Load the
// dump the strictest way: one statement per commit, foreign keys enforced
// immediately. Twice, the second time with --clear over the loaded data.
{
  const strict = `${target}.strict.db`;
  migrateLocal(strict, { fresh: true });
  const db = new Database(strict);
  try {
    db.pragma('foreign_keys = ON');
    for (const clear of [false, true]) {
      const file = `${target}.strict.sql`;
      dumpData(source, file, { clear });
      const sql = fs.readFileSync(file, 'utf8');
      for (const statement of sql.split(/;\n(?=[A-Z])/)) {
        if (/^PRAGMA defer_foreign_keys/.test(statement)) continue;
        db.exec(statement.endsWith(';') ? statement : `${statement};`);
      }
      fs.rmSync(file);
    }
    for (const [table, rows] of Object.entries(dumped))
      assert.equal(
        db.prepare(`SELECT COUNT(*) FROM "${table}"`).pluck().get(),
        rows,
        `${table} after a statement-by-statement load`
      );
  } finally {
    db.close();
    for (const suffix of ['', '-wal', '-shm'])
      fs.rmSync(strict + suffix, { force: true });
  }
}

const total = Object.values(dumped).reduce((a, b) => a + b, 0);
console.log(
  `PASS backup/restore: ${total} rows in ${Object.keys(dumped).length} tables, foreign keys intact, loads one statement at a time with keys enforced, no synthetic history, trigger back on.`
);
