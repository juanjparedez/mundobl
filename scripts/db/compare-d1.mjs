#!/usr/bin/env node
// Compara filas por tabla entre una copia SQLite local y la D1 remota
// (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN).
// Sale con error si alguna tabla no coincide. Solo cuenta: no imprime datos.
//
//   node scripts/db/compare-d1.mjs <copia.db>

import path from 'node:path';
import Database from 'better-sqlite3';
import { createRemoteD1 } from './remote-d1.mjs';
import { dataTables } from './sqlite-dump.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/db/compare-d1.mjs <copia.db>');
  process.exit(1);
}
const local = new Database(path.resolve(file), { readonly: true });
const remote = createRemoteD1();
const tables = dataTables(local);
const rows = [];
// De a tandas: cada consulta a la API REST es un request.
for (let i = 0; i < tables.length; i += 20) {
  const chunk = tables.slice(i, i + 20);
  const sql = chunk
    .map((t) => `SELECT '${t}' AS t, COUNT(*) AS n FROM "${t}"`)
    .join(' UNION ALL ');
  const [, ...remoteRows] = await remote
    .prepare(sql)
    .raw({ columnNames: true });
  const counts = new Map(remoteRows.map(([t, n]) => [t, Number(n)]));
  for (const table of chunk) {
    const expected = local
      .prepare(`SELECT COUNT(*) FROM "${table}"`)
      .pluck()
      .get();
    rows.push({ table, local: expected, d1: counts.get(table) ?? null });
  }
}
local.close();
const bad = rows.filter((r) => r.local !== r.d1);
console.table(rows.filter((r) => r.local || r.d1));
const total = rows.reduce((sum, r) => sum + r.local, 0);
if (bad.length) {
  console.error(`No coinciden: ${bad.map((r) => r.table).join(', ')}`);
  process.exit(1);
}
console.log(`OK: ${total} filas en ${rows.length} tablas, iguales en D1.`);
