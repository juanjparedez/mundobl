// Elige la base para todo lo que corre en Node (next dev, next start de las
// pruebas, scripts con tsx). Se carga antes que la app:
//
//   node --import ./scripts/db/runtime.mjs ...
//
// DATABASE_URL:
//   file:./local.db  -> archivo SQLite local con la interfaz de D1 (local-d1.mjs)
//   d1:remote        -> D1 real por la API REST (remote-d1.mjs)
//
// Dentro del Worker no se usa: ahi src/lib/database.ts toma `env.DB`.

import path from 'node:path';

const url = process.env.DATABASE_URL ?? '';

async function resolveDatabase() {
  if (url.startsWith('file:')) {
    const { createLocalD1 } = await import('./local-d1.mjs');
    return createLocalD1(path.resolve(url.slice('file:'.length)));
  }
  if (url === 'd1:remote') {
    const { createRemoteD1 } = await import('./remote-d1.mjs');
    return createRemoteD1();
  }
  return null;
}

const database = await resolveDatabase();
if (database) globalThis.__mundoblD1 = database;
