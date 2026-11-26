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

/** Abre la base recien al primer uso: este preload corre tambien en procesos
 *  que nunca la tocan (prisma generate, tsc, next build workers). */
function lazy(open) {
  let db;
  const get = () => (db ??= open());
  return {
    prepare: (sql) => get().prepare(sql),
    batch: (statements) => get().batch(statements),
    exec: (sql) => get().exec(sql),
  };
}

async function resolveDatabase() {
  if (url.startsWith('file:')) {
    const { createLocalD1 } = await import('./local-d1.mjs');
    const file = path.resolve(url.slice('file:'.length));
    return lazy(() => createLocalD1(file));
  }
  if (url === 'd1:remote') {
    const { createRemoteD1 } = await import('./remote-d1.mjs');
    return lazy(createRemoteD1);
  }
  return null;
}

const database = await resolveDatabase();
if (database) globalThis.__mundoblD1 = database;
