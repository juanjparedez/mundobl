// Lista ordenada de las migraciones de D1 (carpeta migrations/, la misma que
// usa `wrangler d1 migrations apply`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MIGRATIONS_DIR = path.join(root, 'migrations');

export function listMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f))
    .sort()
    .map((f) => ({ name: f, file: path.join(MIGRATIONS_DIR, f) }));
}
