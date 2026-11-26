#!/usr/bin/env node
// Copia de la base Postgres (Supabase) a un archivo SQLite con el schema de
// D1 (migrations/). Solo lee Postgres; no le escribe nada.
//
//   PG_URL=postgresql://... node scripts/db/copy-postgres-to-sqlite.mjs <destino.db>
//
// Despues: sqlite-dump.mjs --clear arma el SQL que carga esa copia en D1.
// Lo corre .github/workflows/copy-to-d1.yml. Cuando la base de produccion
// ya sea D1, este script (y la dependencia pg) se borran.
//
// Conversiones (las mismas que hace Prisma al escribir en SQLite/D1):
// - timestamp/date -> texto ISO 'YYYY-MM-DDTHH:MM:SS.sssZ' con +00:00
// - boolean -> 1/0
// - text[] y json/jsonb -> texto JSON
// - bigint/numeric -> numero

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import pg from 'pg';
import { RESTORE_ALL_LEASE } from '../../prisma/sqlite-extras.mjs';
import { migrateLocal } from './migrate-local.mjs';
import { dataTables } from './sqlite-dump.mjs';

const BATCH = 2000;

// Prisma guarda los DateTime de Postgres como timestamp SIN zona, en UTC.
// Sin esto, pg los leeria como hora local de la maquina.
const asUtc = (text) =>
  text === null ? null : new Date(text.replace(' ', 'T') + 'Z');
pg.types.setTypeParser(1114, asUtc); // timestamp
pg.types.setTypeParser(1082, (text) =>
  text === null ? null : new Date(`${text}T00:00:00Z`)
); // date
pg.types.setTypeParser(20, (text) => (text === null ? null : Number(text))); // int8
pg.types.setTypeParser(1700, (text) => (text === null ? null : Number(text))); // numeric

function toSqlite(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().replace('Z', '+00:00');
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

export async function copyPostgresToSqlite(pgUrl, targetFile) {
  migrateLocal(targetFile, { fresh: true });
  const db = new Database(targetFile);
  const client = new pg.Client({ connectionString: pgUrl });
  await client.connect();
  const report = [];
  try {
    db.pragma('foreign_keys = ON');
    const pgTables = new Set(
      (
        await client.query(
          `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
        )
      ).rows.map((row) => row.tablename)
    );
    // Todo en una transaccion de SQLite: las foreign keys se chequean al
    // final, y el lease apaga el trigger de historial (ya viene copiado).
    db.exec('BEGIN');
    db.pragma('defer_foreign_keys = ON');
    db.prepare(
      `INSERT INTO "Lease" ("key", "expiresAt") VALUES (?, '9999-12-31T00:00:00.000+00:00')`
    ).run(RESTORE_ALL_LEASE);
    for (const table of dataTables(db)) {
      if (!pgTables.has(table)) {
        report.push({ table, postgres: null, sqlite: 0, note: 'solo en D1' });
        continue;
      }
      const sqliteColumns = db
        .prepare('SELECT name FROM pragma_table_info(?)')
        .pluck()
        .all(table);
      const pgColumns = (
        await client.query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
          [table]
        )
      ).rows.map((row) => row.column_name);
      const columns = sqliteColumns.filter((c) => pgColumns.includes(c));
      const missing = sqliteColumns.filter((c) => !pgColumns.includes(c));
      const dropped = pgColumns.filter((c) => !sqliteColumns.includes(c));
      const insert = db.prepare(
        `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
      );
      const quoted = columns.map((c) => `"${c}"`).join(', ');
      let copied = 0;
      for (let offset = 0; ; offset += BATCH) {
        // ctid: orden fisico estable, sirve para paginar cualquier tabla.
        const { rows } = await client.query(
          `SELECT ${quoted} FROM "${table}" ORDER BY ctid LIMIT ${BATCH} OFFSET ${offset}`
        );
        for (const row of rows)
          insert.run(columns.map((c) => toSqlite(row[c])));
        copied += rows.length;
        if (rows.length < BATCH) break;
      }
      const [{ count }] = (
        await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`)
      ).rows;
      report.push({
        table,
        postgres: count,
        sqlite: copied,
        note: [
          missing.length ? `sin dato en Postgres: ${missing.join(', ')}` : '',
          dropped.length ? `no se copian: ${dropped.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('; '),
      });
    }
    db.prepare('DELETE FROM "Lease" WHERE "key" = ?').run(RESTORE_ALL_LEASE);
    db.exec('COMMIT');
    const broken = db.pragma('foreign_key_check');
    assert.equal(
      broken.length,
      0,
      `Foreign keys rotas: ${JSON.stringify(broken.slice(0, 5))}`
    );
    return report;
  } catch (error) {
    if (db.inTransaction) db.exec('ROLLBACK');
    throw error;
  } finally {
    await client.end();
    db.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  const url = process.env.PG_URL;
  if (!target || !url) {
    console.error(
      'Uso: PG_URL=postgresql://... node scripts/db/copy-postgres-to-sqlite.mjs <destino.db>'
    );
    process.exit(1);
  }
  const report = await copyPostgresToSqlite(url, path.resolve(target));
  console.table(report);
  const mismatched = report.filter(
    (row) => row.postgres !== null && row.postgres !== row.sqlite
  );
  if (mismatched.length) {
    console.error(
      'Filas distintas en:',
      mismatched.map((r) => r.table)
    );
    process.exit(1);
  }
}
