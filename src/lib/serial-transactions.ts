import type { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma lanza en paralelo las subconsultas de un `include` dentro de una
 * transaccion (explicita, o la implicita de un update/create con include),
 * todas sobre la unica conexion de esa transaccion. pg hoy las encola solo,
 * avisa con un DeprecationWarning y en pg@9 va a fallar. Prisma 7.10.1 sigue
 * igual, asi que aca se encolan de forma explicita: mismo orden que ya
 * aplicaba pg, sin depender de su cola interna. Fuera de transacciones no se
 * toca nada: cada consulta usa su propia conexion del pool.
 */

type PgAdapter = Awaited<ReturnType<PrismaPg['connect']>>;
type PgTransaction = Awaited<ReturnType<PgAdapter['startTransaction']>>;
type AsyncMethod = (...args: unknown[]) => Promise<unknown>;

const TRANSACTION_IO = new Set<PropertyKey>([
  'queryRaw',
  'executeRaw',
  'commit',
  'rollback',
  'createSavepoint',
  'rollbackToSavepoint',
  'releaseSavepoint',
]);

/** Los metodos siguen viendo su objeto real como `this`, no el Proxy. */
function readBound(target: object, prop: PropertyKey): unknown {
  const value: unknown = Reflect.get(target, prop);
  return typeof value === 'function' ? value.bind(target) : value;
}

function serializeTransaction(transaction: PgTransaction): PgTransaction {
  let tail: Promise<unknown> = Promise.resolve();
  return new Proxy(transaction, {
    get(target, prop) {
      const value = readBound(target, prop);
      if (!TRANSACTION_IO.has(prop) || typeof value !== 'function') {
        return value;
      }
      const method = value as AsyncMethod;
      return (...args: unknown[]) => {
        const result = tail.then(() => method(...args));
        tail = result.catch(() => undefined);
        return result;
      };
    },
  });
}

function serializeAdapter(adapter: PgAdapter): PgAdapter {
  return new Proxy(adapter, {
    get(target, prop) {
      const value = readBound(target, prop);
      if (prop !== 'startTransaction' || typeof value !== 'function') {
        return value;
      }
      const start = value as PgAdapter['startTransaction'];
      return async (...args: Parameters<PgAdapter['startTransaction']>) =>
        serializeTransaction(await start(...args));
    },
  });
}

export function withSerialTransactions(factory: PrismaPg): PrismaPg {
  return new Proxy(factory, {
    get(target, prop) {
      const value = readBound(target, prop);
      if (prop !== 'connect' || typeof value !== 'function') return value;
      const connect = value as PrismaPg['connect'];
      return async () => serializeAdapter(await connect());
    },
  });
}
