#!/usr/bin/env node
// Ensayo de restauracion: carga un volcado (sqlite-dump.mjs, o el .sql que
// exporta D1) en un archivo SQLite NUEVO y muestra las filas por tabla.
// Nunca toca la base real.
//
//   node scripts/db/restore-local.mjs <volcado.sql> <destino.db>
//
// Un volcado de datos se carga sobre las migraciones; uno completo de D1
// (trae CREATE TABLE) se carga en un archivo vacio.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { migrateLocal } from './migrate-local.mjs';
import { dataTables } from './sqlite-dump.mjs';

export function restoreLocal(dumpFile, targetFile) {
  for (const suffix of ['', '-wal', '-shm'])
    fs.rmSync(targetFile + suffix, { force: true });
  const sql = fs.readFileSync(dumpFile, 'utf8');
  const fullDump = /^\s*CREATE TABLE/im.test(sql);
  if (!fullDump) migrateLocal(targetFile);
  const db = new Database(targetFile);
  try {
    db.pragma('foreign_keys = ON');
    db.transaction(() => db.exec(sql))();
    const problems = db.pragma('foreign_key_check');
    if (problems.length)
      throw new Error(
        `Foreign keys rotas despues de restaurar: ${JSON.stringify(problems.slice(0, 5))}`
      );
    return Object.fromEntries(
      dataTables(db).map((table) => [
        table,
        db.prepare(`SELECT COUNT(*) FROM "${table}"`).pluck().get(),
      ])
    );
  } finally {
    db.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dump, target] = process.argv.slice(2);
  if (!dump || !target) {
    console.error(
      'Uso: node scripts/db/restore-local.mjs <volcado.sql> <destino.db>'
    );
    process.exit(1);
  }
  const counts = restoreLocal(path.resolve(dump), path.resolve(target));
  for (const [table, rows] of Object.entries(counts))
    if (rows) console.log(`${table}: ${rows}`);
}
