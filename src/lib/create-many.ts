import { Prisma } from '@prisma/client';
import { D1_PARAMETERS } from './d1-lists';

/** Unique violation from Prisma (P2002) or from a raw D1 batch (atomicWrite). */
export function isUniqueViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError)
    return error.code === 'P2002';
  return (
    error instanceof Error && error.message.includes('UNIQUE constraint failed')
  );
}

/**
 * `createMany({ skipDuplicates: true })` para SQLite/D1, donde Prisma no lo
 * soporta. Inserta en tandas que entran en una sola sentencia (una sentencia
 * de SQLite es atomica); si una tanda choca con un unique, esa tanda se
 * reintenta fila por fila salteando las repetidas. El conteo es exacto: solo
 * cuenta filas que se insertaron de verdad.
 */
export async function createManySkippingDuplicates<Row extends object>(
  rows: readonly Row[],
  createMany: (rows: Row[]) => Promise<{ count: number }>
): Promise<{ count: number }> {
  if (!rows.length) return { count: 0 };
  const columns = Math.max(1, ...rows.map((row) => Object.keys(row).length));
  // +3: columnas que agrega Prisma (id generado, createdAt, updatedAt).
  const perStatement = Math.max(1, Math.floor(D1_PARAMETERS / (columns + 3)));
  let count = 0;
  for (let i = 0; i < rows.length; i += perStatement) {
    const chunk = rows.slice(i, i + perStatement);
    try {
      count += (await createMany(chunk)).count;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Una sola fila: ya se sabe que esta repetida, no hace falta reintentar.
      if (chunk.length === 1) continue;
      for (const row of chunk) {
        try {
          count += (await createMany([row])).count;
        } catch (rowError) {
          if (!isUniqueViolation(rowError)) throw rowError;
        }
      }
    }
  }
  return { count };
}
