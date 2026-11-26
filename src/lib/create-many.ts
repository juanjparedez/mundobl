import { Prisma } from '@prisma/client';

export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/** Parametros de D1 por consulta, con margen para columnas por defecto. */
const D1_PARAMETERS = 90;

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
