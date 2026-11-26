#!/usr/bin/env node
// Aplica migrations/*.sql a un archivo SQLite local, llevando la cuenta en la
// misma tabla que usa `wrangler d1 migrations apply` (d1_migrations), asi un
// archivo local y la D1 real se comparan igual.
//
//   node scripts/db/migrate-local.mjs ./local.db
//   node scripts/db/migrate-local.mjs ./local.db --fresh   (lo borra antes)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { listMigrations } from '../d1-migrations.mjs';

export function migrateLocal(file, { fresh = false } = {}) {
  if (fresh) {
    for (const suffix of ['', '-wal', '-shm'])
      fs.rmSync(file + suffix, { force: true });
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  try {
    db.pragma('foreign_keys = ON');
    db.exec(`CREATE TABLE IF NOT EXISTS d1_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`);
    const applied = new Set(
      db.prepare('SELECT name FROM d1_migrations').pluck().all()
    );
    const pending = listMigrations().filter((m) => !applied.has(m.name));
    for (const m of pending) {
      db.transaction(() => {
        db.exec(fs.readFileSync(m.file, 'utf8'));
        db.prepare('INSERT INTO d1_migrations (name) VALUES (?)').run(m.name);
      })();
      console.log(`aplicada ${m.name}`);
    }
    if (!pending.length) console.log('sin migraciones pendientes');
    return pending.length;
  } finally {
    db.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    console.error(
      'Uso: node scripts/db/migrate-local.mjs <archivo.db> [--fresh]'
    );
    process.exit(1);
  }
  migrateLocal(path.resolve(target), {
    fresh: process.argv.includes('--fresh'),
  });
}
