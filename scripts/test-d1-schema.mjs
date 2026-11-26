#!/usr/bin/env node
// La base migrada tiene todo lo que Prisma no sabe expresar (CHECKs como
// triggers, indices parciales, triggers de historial). `prisma migrate diff`
// no los ve, asi que una migracion que recrea una tabla podria perderlos en
// silencio; esta prueba lo frena.

import assert from 'node:assert/strict';
import path from 'node:path';
import Database from 'better-sqlite3';
import { extraObjectNames } from '../prisma/sqlite-extras.mjs';

const url = process.env.DATABASE_URL ?? '';
assert.ok(url.startsWith('file:'), 'DATABASE_URL tiene que ser file:...');
const db = new Database(path.resolve(url.slice('file:'.length)), {
  readonly: true,
});
const present = new Set(
  db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type IN ('index', 'trigger')"
    )
    .pluck()
    .all()
);
const missing = extraObjectNames().filter((name) => !present.has(name));
assert.deepEqual(
  missing,
  [],
  `Faltan en la base migrada: ${missing.join(', ')}`
);
assert.equal(db.pragma('foreign_key_check').length, 0);
console.log(`OK: ${extraObjectNames().length} extras presentes.`);
db.close();
