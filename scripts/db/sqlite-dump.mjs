#!/usr/bin/env node
// Volcado de DATOS de una base SQLite (local o copia de D1) como SQL que se
// puede cargar en una base ya migrada: local con `restore-local.mjs`, o en
// D1 con `wrangler d1 execute mundobl --remote --file=<volcado>`.
//
//   node scripts/db/sqlite-dump.mjs <origen.db> <volcado.sql> [--clear]
//
// - Solo filas: el schema lo ponen las migraciones (migrations/).
// - Las foreign keys se chequean al final (defer_foreign_keys), asi el orden
//   de las tablas no importa.
// - Mientras carga, el lease "tracking-restore:*" apaga el trigger que
//   registra historial: el historial ya viene en el volcado (TrackingEvent).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { RESTORE_ALL_LEASE } from '../../prisma/sqlite-extras.mjs';

/** Tablas que no se copian: la cuenta de migraciones y los candados vivos. */
const SKIPPED = new Set(['d1_migrations', 'Lease', '_cf_KV', '_cf_METADATA']);
/** Filas por INSERT: D1 limita el tamaño de cada sentencia (100 KB). */
const ROWS_PER_INSERT = 50;
const MAX_STATEMENT_BYTES = 90_000;

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'bigint')
    return String(value);
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function dataTables(db) {
  return db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .pluck()
    .all()
    .filter((name) => !SKIPPED.has(name));
}

/** Escribe el volcado y devuelve las filas por tabla. */
export function dumpData(sourceFile, outFile, { clear = false } = {}) {
  const db = new Database(sourceFile, { readonly: true });
  const out = fs.openSync(outFile, 'w');
  const write = (sql) => fs.writeSync(out, sql + '\n');
  const counts = {};
  try {
    write('PRAGMA defer_foreign_keys = ON;');
    // --clear: reemplaza los datos de una base ya cargada (re-copia).
    if (clear)
      for (const table of dataTables(db)) write(`DELETE FROM "${table}";`);
    write(
      `INSERT OR REPLACE INTO "Lease" ("key", "expiresAt") VALUES (${literal(RESTORE_ALL_LEASE)}, '9999-12-31T00:00:00.000+00:00');`
    );
    for (const table of dataTables(db)) {
      const columns = db
        .prepare(`SELECT name FROM pragma_table_info(?)`)
        .pluck()
        .all(table);
      const head = `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES\n`;
      let batch = [];
      let bytes = 0;
      const flush = () => {
        if (batch.length) write(head + batch.join(',\n') + ';');
        batch = [];
        bytes = 0;
      };
      counts[table] = 0;
      for (const row of db
        .prepare(`SELECT * FROM "${table}"`)
        .raw()
        .iterate()) {
        const tuple = `(${row.map(literal).join(', ')})`;
        if (
          batch.length >= ROWS_PER_INSERT ||
          bytes + tuple.length > MAX_STATEMENT_BYTES
        )
          flush();
        batch.push(tuple);
        bytes += tuple.length;
        counts[table]++;
      }
      flush();
    }
    write(`DELETE FROM "Lease" WHERE "key" = ${literal(RESTORE_ALL_LEASE)};`);
    return counts;
  } finally {
    fs.closeSync(out);
    db.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [source, target] = process.argv
    .slice(2)
    .filter((a) => !a.startsWith('--'));
  if (!source || !target) {
    console.error(
      'Uso: node scripts/db/sqlite-dump.mjs <origen.db> <volcado.sql>'
    );
    process.exit(1);
  }
  const counts = dumpData(path.resolve(source), path.resolve(target), {
    clear: process.argv.includes('--clear'),
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(
    `${total} filas de ${Object.keys(counts).length} tablas -> ${target}`
  );
}
