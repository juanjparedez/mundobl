#!/usr/bin/env node
// Genera la proxima migracion de D1 a partir de prisma/schema.prisma.
//
//   npm run db:migration -- nombre_corto
//
// 1. Aplica migrations/*.sql a una base SQLite temporal (lo que hay hoy).
// 2. `prisma migrate diff` de esa base contra el schema -> SQL.
// 3. Si el SQL recrea una tabla que tiene CHECKs/indices/triggers propios
//    (prisma/sqlite-extras.mjs), los vuelve a agregar: el DROP de Prisma se
//    los lleva y no hay otro aviso.
// 4. Lo escribe en migrations/NNNN_nombre.sql. Se aplica con
//    `npm run migrate:d1` (produccion) o `npm run local:db` (local).
//
// No toca ninguna base real.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { EXTRA_TABLES, renderExtras } from '../prisma/sqlite-extras.mjs';
import { listMigrations } from './d1-migrations.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const name = (process.argv[2] ?? '').trim();
if (!/^[a-z0-9_]+$/.test(name)) {
  console.error('Uso: npm run db:migration -- nombre_en_snake_case');
  process.exit(1);
}

const migrations = listMigrations();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mundobl-migration-'));
const dbFile = path.join(tmp, 'current.db');
const db = new Database(dbFile);
for (const m of migrations) db.exec(fs.readFileSync(m.file, 'utf8'));
db.close();

const diff = spawnSync(
  process.execPath,
  [
    path.join(root, 'node_modules/prisma/build/index.js'),
    'migrate',
    'diff',
    migrations.length ? '--from-config-datasource' : '--from-empty',
    '--to-schema',
    'prisma/schema.prisma',
    '--script',
  ],
  {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: `file:${dbFile}`, DIRECT_URL: '' },
  }
);
fs.rmSync(tmp, { recursive: true, force: true });
if (diff.status !== 0) {
  console.error(diff.stderr || diff.stdout);
  process.exit(diff.status ?? 1);
}

let sql = diff.stdout.replace(/^Loaded Prisma config.*\n/m, '').trim();
if (!sql || /^-- This is an empty migration\.?$/.test(sql)) {
  console.log('El schema no cambio: no hay migracion para generar.');
  process.exit(0);
}

// Prisma escribe `DEFAULT []` para Json @default("[]"), que SQLite rechaza.
sql = sql.replace(/DEFAULT \[\]/g, "DEFAULT '[]'");
// Ojo: `DEFAULT CURRENT_TIMESTAMP` escribe "2026-11-26 03:46:50", no el
// formato de Prisma ("2026-11-26T03:46:50.123+00:00"). Prisma siempre manda
// la fecha, asi que solo importa en SQL a mano: ahi pasar la fecha explicita
// (ver SQL_NOW en prisma/sqlite-extras.mjs). No se cambia el DEFAULT porque
// Prisma lo veria distinto al schema y recrearia todas las tablas.

const recreated = migrations.length
  ? EXTRA_TABLES.filter((table) =>
      new RegExp(`DROP TABLE "${table}";`).test(sql)
    )
  : null; // baseline: todos
sql += '\n' + renderExtras(recreated ?? undefined);

const next = String(migrations.length + 1).padStart(4, '0');
const file = path.join(root, 'migrations', `${next}_${name}.sql`);
fs.writeFileSync(file, sql.trimEnd() + '\n');
console.log(`Escrita ${path.relative(root, file)}`);
if (recreated?.length)
  console.log(`Se re-crearon los extras de: ${recreated.join(', ')}`);
