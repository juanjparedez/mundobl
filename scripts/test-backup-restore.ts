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
  if (database === '/mundobl_restore') {
    assert.match(url.pathname, /^\/mundobl_restore(?:_[a-z0-9_]+)?$/);
  } else assert.equal(url.pathname, database);
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
  const userId = 'backup-fixture-' + Date.now();
  const secondUserId = userId + '-moderator';
  let settingsCreated = false;
  let seriesId: number | undefined;
  let companyId: number | undefined;
  let writerId: number | undefined;
  try {
    await from.query(
      `INSERT INTO "User" (id, email, "updatedAt") VALUES ($1, $2, now())`,
      [userId, userId + '@example.invalid']
    );
    await from.query(
      `INSERT INTO "User" (id, email, role, "updatedAt") VALUES ($1, $2, 'ADMIN', now())`,
      [secondUserId, secondUserId + '@example.invalid']
    );
    const series = await from.query<{ id: number }>(
      `INSERT INTO "Series" (title, type, "updatedAt") VALUES ('Restauración á 漢字', 'serie', now()) RETURNING id`
    );
    seriesId = series.rows[0].id;
    const topic = await from.query<{ id: number }>(
      `INSERT INTO "CommunityTopic" (kind, title, body, "seriesId", "userId", "updatedAt") VALUES ('DISCUSSION', 'Conversación 漢字', 'Contenido de prueba', $1, $2, now()) RETURNING id`,
      [seriesId, userId]
    );
    await from.query(
      `INSERT INTO "CommunityReply" ("topicId", "userId", body, "hasSpoilers") VALUES ($1, $2, 'Respuesta á 漢字', true)`,
      [topic.rows[0].id, userId]
    );
    await from.query(
      `INSERT INTO "CommunityProfile" ("userId", "publicId", "displayName", bio, "promptChoice", "updatedAt") VALUES ($1, $2, 'Perfil á 漢字', 'Privado', 'DISMISSED', now())`,
      [userId, userId + '-profile']
    );
    await from.query(
      `INSERT INTO "RecommendationList" (id, "userId", title, kind, "updatedAt") VALUES ($1, $2, 'Top cinco 漢字', 'TOP_FIVE', now())`,
      [userId + '-list', userId]
    );
    await from.query(
      `INSERT INTO "RecommendationListItem" (id, "listId", "seriesId", position, note, "hasSpoilers") VALUES ($1, $2, $3, 0, 'Motivo privado á', true)`,
      [userId + '-item', userId + '-list', seriesId]
    );
    await from.query(
      `INSERT INTO "CommunityFollow" ("userId", "topicId", notify, muted) VALUES ($1, $2, true, true)`,
      [userId, topic.rows[0].id]
    );
    await from.query(
      `INSERT INTO "CommunityBlock" ("userId", "targetId") VALUES ($1, $2)`,
      [userId, secondUserId]
    );
    await from.query(
      `INSERT INTO "CommunityReport" (id, "reporterId", "targetType", "targetId", reason, detail, status, "updatedAt") VALUES ($1, $2, 'TOPIC', $3, 'OTHER', 'Revisión 漢字', 'RESOLVED', now())`,
      [userId + '-report', userId, String(topic.rows[0].id)]
    );
    await from.query(
      `INSERT INTO "CommunityModerationAction" (id, "reportId", "moderatorId", action, reason) VALUES ($1, $2, $3, 'RESOLVE', 'Motivo de revisión 漢字')`,
      [userId + '-action', userId + '-report', secondUserId]
    );
    settingsCreated = !!(
      await from.query(
        `INSERT INTO "CommunitySettings" (id, "updatedAt") VALUES (1, now()) ON CONFLICT (id) DO NOTHING RETURNING id`
      )
    ).rowCount;
    const writer = await from.query<{ id: number }>(
      `INSERT INTO "Writer" (name, aliases, "imageAttribution", "bioSourceUrl", "updatedAt") VALUES ($1, $2, $3, $4, now()) RETURNING id`,
      [
        userId,
        ['Alias á 漢字'],
        'Atribución de prueba',
        'https://example.invalid/bio',
      ]
    );
    writerId = writer.rows[0].id;
    await from.query(
      `INSERT INTO "SeriesWriter" ("seriesId", "writerId", "sourceUrl") VALUES ($1, $2, $3)`,
      [seriesId, writerId, 'https://example.invalid/credit']
    );
    const company = await from.query<{ id: number }>(
      `INSERT INTO "ProductionCompany" (name, "updatedAt") VALUES ($1, now()) RETURNING id`,
      [userId]
    );
    companyId = company.rows[0].id;
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
    const nextWriter = await to.query<{ id: number }>(
      `INSERT INTO "Writer" (name,"updatedAt") VALUES ($1,now()) RETURNING id`,
      [userId + '-sequence']
    );
    assert.ok(nextWriter.rows[0].id > writerId);
    console.log(
      `PASS: ${tables.rows.length} tablas idénticas, ocho modelos de comunidad con datos y relaciones, secuencias y rechazo de destino ocupado.`
    );
  } finally {
    // Remove only fixtures created by this run from the source database.
    await from.query('DELETE FROM "CommunityReport" WHERE id=$1', [
      userId + '-report',
    ]);
    if (settingsCreated)
      await from.query('DELETE FROM "CommunitySettings" WHERE id=1');
    if (seriesId)
      await from.query('DELETE FROM "Series" WHERE id=$1', [seriesId]);
    if (writerId)
      await from.query('DELETE FROM "Writer" WHERE id=$1', [writerId]);
    if (companyId) {
      await from.query(
        'DELETE FROM "PersonEnrichment" WHERE "entityType"=$1 AND "entityId"=$2',
        ['PRODUCTION_COMPANY', companyId]
      );
      await from.query('DELETE FROM "ProductionCompany" WHERE id=$1', [
        companyId,
      ]);
    }
    await from.query('DELETE FROM "User" WHERE id=$1', [userId]);
    await from.query('DELETE FROM "User" WHERE id=$1', [secondUserId]);
    await from.end();
    await to.end();
  }
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
