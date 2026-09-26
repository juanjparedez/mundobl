import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

// Disposable PGlite database provided by the installed Prisma dev dependency.
// Never loads .env or attaches to an existing database. Port conflicts fail.
// Use the socket directly: Prisma dev's extra workers can contend for PGlite's one backend.
const db = await PGlite.create();
const shadowDb = await PGlite.create();
const server = new PGLiteSocketServer({ db, port: 55433, host: '127.0.0.1' });
const shadowServer = new PGLiteSocketServer({
  db: shadowDb,
  port: 55434,
  host: '127.0.0.1',
});
await server.start();
await shadowServer.start();
console.log(
  'Disposable Prisma/PGlite database ready on 127.0.0.1:55433/template1; shadow database on 55434. Data is lost when stopped.'
);
async function close() {
  await server.stop();
  await shadowServer.stop();
  await db.close();
  await shadowDb.close();
  process.exit(0);
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
