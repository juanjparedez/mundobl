import { Prisma } from '@prisma/client';
import { prisma, type AppTransactionClient } from './prisma-client';
import { sqliteDate } from './d1';

export class LeaseBusyError extends Error {
  constructor(readonly key: string) {
    super(`LEASE_BUSY:${key}`);
  }
}

interface LeaseOptions {
  /** Cuanto dura el candado si el proceso muere sin soltarlo. */
  ttlMs?: number;
  /** Cuanto esperar a que otro lo suelte antes de rendirse (0 = no esperar). */
  waitMs?: number;
  /** Cliente a usar (los repositorios reciben el suyo). */
  db?: AppTransactionClient;
}

const POLL_MS = 50;

/**
 * Toma el candado `key` en una sola sentencia: inserta la fila o, si la que
 * hay ya vencio, la pisa. `changes = 1` significa que es nuestro. El
 * vencimiento hace de token, asi solo lo suelta quien lo tomo.
 */
async function acquire(
  db: AppTransactionClient,
  key: string,
  ttlMs: number
): Promise<string | null> {
  const now = new Date();
  const expiresAt = sqliteDate(new Date(now.getTime() + ttlMs));
  const taken = await db.$executeRaw(Prisma.sql`
    INSERT INTO "Lease" ("key", "expiresAt") VALUES (${key}, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET "expiresAt" = excluded."expiresAt"
    WHERE "Lease"."expiresAt" <= ${sqliteDate(now)}`);
  return taken ? expiresAt : null;
}

async function release(
  db: AppTransactionClient,
  key: string,
  expiresAt: string
) {
  await db.$executeRaw(Prisma.sql`
    DELETE FROM "Lease" WHERE "key" = ${key} AND "expiresAt" = ${expiresAt}`);
}

/**
 * Reemplazo de FOR UPDATE y pg_advisory_xact_lock en D1: corre `work` con el
 * candado `key` tomado, de a uno por clave. A diferencia de una transaccion,
 * NO deshace nada si `work` falla a la mitad; solo serializa.
 */
export async function withLease<T>(
  key: string,
  work: (db: AppTransactionClient) => Promise<T>,
  { ttlMs = 30_000, waitMs = 5_000, db = prisma }: LeaseOptions = {}
): Promise<T> {
  const deadline = Date.now() + waitMs;
  let token = await acquire(db, key, ttlMs);
  while (!token && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    token = await acquire(db, key, ttlMs);
  }
  if (!token) throw new LeaseBusyError(key);
  try {
    return await work(db);
  } finally {
    await release(db, key, token).catch((error: unknown) => {
      // Si no se pudo soltar, vence solo en ttlMs.
      console.error('[lease] release failed', key, error);
    });
  }
}
