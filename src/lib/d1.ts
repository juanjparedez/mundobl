import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Prisma } from '@prisma/client';

/**
 * Lo minimo del binding de D1 (`env.DB`) que usa la app. En el Worker es el
 * binding real; en Node lo pone scripts/db/runtime.mjs (archivo SQLite local
 * o la API REST de D1), siempre con esta misma interfaz.
 */
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<{ meta: { changes?: number } }>;
  raw(options?: { columnNames?: boolean }): Promise<unknown[][]>;
}

export interface D1Like {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
  exec(sql: string): Promise<unknown>;
}

declare global {
  var __mundoblD1: D1Like | undefined;
}

function isD1Like(value: unknown): value is D1Like {
  return (
    typeof value === 'object' &&
    value !== null &&
    'prepare' in value &&
    'batch' in value
  );
}

/** La base del contexto actual: override de Node, o `env.DB` del Worker. */
export function currentD1(): D1Like {
  if (globalThis.__mundoblD1) return globalThis.__mundoblD1;
  let binding: unknown;
  try {
    binding = Reflect.get(getCloudflareContext().env, 'DB');
  } catch {
    binding = undefined;
  }
  if (!isD1Like(binding)) {
    throw new Error(
      'Base no configurada: en el Worker falta el binding DB (wrangler.jsonc d1_databases); ' +
        'en Node, DATABASE_URL=file:./local.db o d1:remote con node --import ./scripts/db/runtime.mjs.'
    );
  }
  return binding;
}

/**
 * D1 que resuelve la base recien al usarla. El PrismaClient es uno solo por
 * isolate y se crea al cargar el modulo, cuando en el Worker todavia no hay
 * request (ni `env`).
 */
export const lazyD1: D1Like = {
  prepare: (sql) => currentD1().prepare(sql),
  batch: (statements) => currentD1().batch(statements),
  exec: (sql) => currentD1().exec(sql),
};

/** Mismo formato de fecha que escribe Prisma en SQLite/D1. */
export function sqliteDate(date: Date): string {
  return date.toISOString().replace('Z', '+00:00');
}

function toD1Value(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return sqliteDate(value);
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

/**
 * Escrituras que tienen que pasar todas o ninguna. D1 no tiene transacciones
 * interactivas (Prisma ejecuta `$transaction` como consultas sueltas), pero
 * un `batch` de D1 SI es atomico: si una sentencia falla, se deshace todo el
 * lote. Las sentencias no pueden depender del resultado de otra en JS, solo
 * en SQL (subconsultas).
 */
export async function atomicWrite(statements: Prisma.Sql[]): Promise<number[]> {
  if (!statements.length) return [];
  const db = currentD1();
  const results = await db.batch(
    statements.map((statement) =>
      db.prepare(statement.sql).bind(...statement.values.map(toD1Value))
    )
  );
  return results.map((result) => {
    const meta =
      typeof result === 'object' && result !== null && 'meta' in result
        ? (result as { meta?: { changes?: number } }).meta
        : undefined;
    return meta?.changes ?? 0;
  });
}
