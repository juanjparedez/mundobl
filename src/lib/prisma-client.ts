import { getCloudflareContext } from '@opennextjs/cloudflare';
import { PrismaD1 } from '@prisma/adapter-d1';
import { Prisma, PrismaClient } from '@prisma/client';
import { lazyD1 } from './d1';

// El binding real cumple la interfaz completa; lazyD1 implementa solo lo que
// usa el adapter (prepare/batch/exec).
type D1Database = ConstructorParameters<typeof PrismaD1>[0];
import { scopeBatchingToRequest } from './request-scoped-batching';
import { toStringList } from './string-list';

const globalForPrisma = globalThis as unknown as {
  prisma?: AppPrismaClient;
};

const IS_WORKERD =
  typeof navigator !== 'undefined' &&
  navigator.userAgent === 'Cloudflare-Workers';

/** ExecutionContext del request actual en workerd (clave del pool). */
function currentRequestKey(): object | undefined {
  try {
    return getCloudflareContext().ctx;
  } catch {
    return undefined;
  }
}

function createPrismaClient() {
  // Un solo PrismaClient por isolate (cada uno pesa ~30 MB). La base se
  // resuelve en cada consulta (lazyD1): `env.DB` en el Worker, el archivo
  // local o la API REST en Node (scripts/db/runtime.mjs).
  //
  // D1 no tiene transacciones interactivas: Prisma corre `$transaction` como
  // consultas sueltas. Lo que tiene que ser todo-o-nada usa atomicWrite()
  // (src/lib/d1.ts), que va en un batch de D1.
  const client = new PrismaClient({
    adapter: new PrismaD1(lazyD1 as unknown as D1Database),
  });
  // Sin esto, Prisma despacha juntos los findUnique de requests distintos
  // desde el contexto del primero (ver request-scoped-batching.ts).
  if (IS_WORKERD) scopeBatchingToRequest(client, currentRequestKey);
  return withStringLists(client);
}

const stringList = <Field extends string>(field: Field) => ({
  needs: { [field]: true } as Record<Field, true>,
  compute: (row: Record<Field, Prisma.JsonValue>) => toStringList(row[field]),
});

/**
 * SQLite no tiene columnas de tipo lista: estas se guardan como JSON. Con
 * esta extension Prisma las sigue devolviendo como string[] en toda la app
 * (tambien dentro de include/select anidados); al escribir se pasa el
 * string[] como siempre.
 */
function withStringLists(client: PrismaClient) {
  return client.$extends({
    result: {
      series: { contentWarnings: stringList('contentWarnings') },
      episode: { playbackBlockedMarkets: stringList('playbackBlockedMarkets') },
      actor: {
        funFacts: stringList('funFacts'),
        aliases: stringList('aliases'),
        awards: stringList('awards'),
      },
      director: {
        aliases: stringList('aliases'),
        awards: stringList('awards'),
      },
      writer: { aliases: stringList('aliases') },
      announcement: { pages: stringList('pages') },
    },
  });
}

export type AppPrismaClient = ReturnType<typeof withStringLists>;

export const prisma: AppPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

export type AppTransactionClient = Omit<
  AppPrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

/**
 * Corre pasos que en Postgres iban en `$transaction`. D1 no tiene
 * transacciones interactivas: los pasos se ejecutan en orden con el cliente
 * normal y, si uno falla, los anteriores YA quedaron escritos. Por eso cada
 * uso tiene que estar pensado para eso: pasos idempotentes, escrituras
 * condicionales (updateMany con la condicion en el where) o, si de verdad
 * tiene que ser todo-o-nada, atomicWrite() de src/lib/d1.ts.
 *
 * `prisma.$transaction` esta prohibido por lint para que no vuelva a
 * aparecer creyendo que es atomico.
 */
export function inSequence<T>(
  steps: (db: AppTransactionClient) => Promise<T>,
  db: AppTransactionClient = prisma
): Promise<T> {
  return steps(db);
}
