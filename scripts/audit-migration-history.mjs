import 'dotenv/config';
import pg from 'pg';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const client = new pg.Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const rows = (
    await client.query(
      'SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at'
    )
  ).rows;
  const local = readdirSync('prisma/migrations', { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  console.log(
    JSON.stringify(
      {
        applied: rows.filter((row) => row.finished_at && !row.rolled_back_at)
          .length,
        pending: local.filter(
          (n) =>
            !rows.some(
              (r) =>
                r.migration_name === n && r.finished_at && !r.rolled_back_at
            )
        ),
        issues: rows
          .filter((r) => !r.rolled_back_at)
          .flatMap((r) => {
            const p = `prisma/migrations/${r.migration_name}/migration.sql`;
            if (!existsSync(p))
              return [{ name: r.migration_name, issue: 'missing file' }];
            const sql = readFileSync(p, 'utf8');
            const hashes = [
              sql,
              sql.replace(/\r\n/g, '\n'),
              sql.replace(/\r?\n/g, '\r\n'),
            ].map((s) => createHash('sha256').update(s).digest('hex'));
            return hashes.includes(r.checksum) &&
              r.finished_at &&
              !r.rolled_back_at
              ? []
              : [
                  {
                    name: r.migration_name,
                    issue: 'checksum or status mismatch',
                  },
                ];
          }),
      },
      null,
      2
    )
  );
  console.log(
    JSON.stringify(
      (
        await client.query(
          `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN ('SeriesNote','SeriesSuggestion')`
        )
      ).rows
    )
  );
  await client.query('COMMIT');
} finally {
  await client.end();
}
