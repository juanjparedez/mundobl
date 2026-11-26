// Para pruebas de UI que siembran datos directo en la base: la misma forma
// que `pg.Pool#query` (texto con $1, $2... y { rows, rowCount }), sobre el archivo
// SQLite local que usa la app de prueba. Solo acepta bases descartables.

import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

function toSqlite(value) {
  if (value instanceof Date) return value.toISOString().replace('Z', '+00:00');
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value !== null && typeof value === 'object') return JSON.stringify(value);
  return value ?? null;
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%f+00:00', 'now')";

/** El SQL de Postgres que usan las pruebas, en su forma de SQLite. */
export function toSqliteSql(text) {
  return text
    .replace(
      /=\s*ANY\(\$(\d+)(::\w+\[\])?\)/gi,
      ' IN (SELECT value FROM json_each($$$1))'
    )
    .replace(/::\w+(\[\])?/g, '')
    .replace(/\bNOW\(\)/gi, NOW)
    .replace(/\$(\d+)/g, '?$1');
}

export function createTestPool(url = process.env.DATABASE_URL ?? '') {
  assert.ok(url.startsWith('file:'), 'Las pruebas usan DATABASE_URL=file:...');
  const file = path.resolve(url.slice('file:'.length));
  assert.ok(
    [path.resolve('test-results'), path.resolve(os.tmpdir())].some((dir) =>
      file.startsWith(dir + path.sep)
    ),
    'Solo bases descartables (test-results/ o la carpeta temporal)'
  );
  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  return {
    async query(text, values = []) {
      const statement = db.prepare(toSqliteSql(text));
      const params = Object.fromEntries(
        values.map((value, index) => [index + 1, toSqlite(value)])
      );
      if (statement.reader) {
        const rows = statement.all(params);
        return { rows, rowCount: rows.length };
      }
      const info = statement.run(params);
      return { rows: [], rowCount: info.changes };
    },
    async end() {
      db.close();
    },
  };
}
