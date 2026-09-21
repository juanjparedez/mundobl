import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Pool } from 'pg';

const source =
  process.env.BACKUP_TEST_SOURCE_URL ??
  'postgresql://mundobl:mundobl@127.0.0.1:55433/mundobl_replay';
const target =
  process.env.BACKUP_TEST_TARGET_URL ??
  'postgresql://mundobl:mundobl@127.0.0.1:55433/mundobl_restore';
for (const [connection, database] of [
  [source, '/mundobl_replay'],
  [target, '/mundobl_restore'],
]) {
  const url = new URL(connection);
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
  assert.equal(url.pathname, database);
}
const output = mkdtempSync(path.join(tmpdir(), 'mundobl-backup-test-'));
const run = (script: string, database: string, args: string[] = []) =>
  execFileSync(
    process.execPath,
    [path.resolve('node_modules/tsx/dist/cli.mjs'), script, ...args],
    {
      env: {
        ...process.env,
        DATABASE_URL: database,
        DIRECT_URL: database,
        BACKUP_OUTPUT_DIR: output,
      },
      stdio: 'pipe',
    }
  );

async function main() {
  const from = new Pool({ connectionString: source });
  const to = new Pool({ connectionString: target });
  try {
    const userId = 'backup-fixture-' + Date.now();
    await from.query(
      `INSERT INTO "User" (id, email, "updatedAt") VALUES ($1, $2, now())`,
      [userId, userId + '@example.invalid']
    );
    const series = await from.query<{ id: number }>(
      `INSERT INTO "Series" (title, type, "updatedAt") VALUES ('Restauración á 漢字', 'serie', now()) RETURNING id`
    );
    const company = await from.query<{ id: number }>(
      `INSERT INTO "ProductionCompany" (name, "updatedAt") VALUES ($1, now()) RETURNING id`,
      [userId]
    );
    await from.query(
      `INSERT INTO "SeriesProductionCompany" ("seriesId", "productionCompanyId") VALUES ($1, $2)`,
      [series.rows[0].id, company.rows[0].id]
    );
    await from.query(
      `INSERT INTO "PersonEnrichment" ("entityType", "entityId", source, payload, "updatedAt") VALUES ('PRODUCTION_COMPANY', $1, 'TEST', $2, now())`,
      [company.rows[0].id, { text: 'Á 漢字', items: [1, true, null] }]
    );
    const thread = await from.query<{ id: number }>(
      `INSERT INTO "SupportThread" (subject, "userId", "updatedAt") VALUES ('Fixture', $1, now()) RETURNING id`,
      [userId]
    );
    await from.query(
      `INSERT INTO "SupportMessage" (body, "threadId", "userId") VALUES ('Mensaje privado de prueba', $1, $2)`,
      [thread.rows[0].id, userId]
    );
    run('scripts/backup-db.ts', source);
    const file = path.join(
      output,
      readdirSync(output).find((name) => name.endsWith('.json'))!
    );
    console.log(
      run('scripts/restore-backup-local.ts', target, [file]).toString().trim()
    );
    const tables = await from.query<{ name: string }>(
      `SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename`
    );
    for (const { name } of tables.rows) {
      const sql = `SELECT row_to_json(t)::text AS row FROM public."${name.replaceAll('"', '""')}" t ORDER BY row_to_json(t)::text`;
      assert.deepEqual(
        (await to.query(sql)).rows,
        (await from.query(sql)).rows,
        name
      );
    }
    assert.throws(() => run('scripts/restore-backup-local.ts', target, [file]));
    const inserted = await to.query<{ id: number }>(
      `INSERT INTO "SupportThread" (subject, "userId", "updatedAt") VALUES ('Secuencia restaurada', $1, now()) RETURNING id`,
      [userId]
    );
    assert.ok(inserted.rows[0].id > thread.rows[0].id);
    console.log(
      `PASS: ${tables.rows.length} tablas idénticas, cuatro tablas antes omitidas con datos, secuencias y rechazo de destino ocupado.`
    );
  } finally {
    await from.end();
    await to.end();
  }
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
