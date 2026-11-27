/**
 * D1 acepta 100 parametros por consulta (Prisma usa 98). Prisma parte solo
 * algunas listas `in` largas: con orderBy, take, count, groupBy, notIn o un
 * `not` en el mismo where falla con P2029 ("The query parameter limit
 * supported by your database is exceeded"). Toda lista que dependa de los
 * datos (series de una biblioteca, capitulos de una serie, ids que manda el
 * cliente) se parte aca antes de llegar a Prisma.
 *
 * Margen: deja lugar para los demas parametros del where.
 */
export const D1_PARAMETERS = 90;
export const D1_LIST_CHUNK = 80;

export function chunkList<T>(
  items: readonly T[],
  size: number = D1_LIST_CHUNK
): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    chunks.push(items.slice(i, i + size));
  return chunks;
}

/** Corre `query` por tanda, en serie, y junta las filas. Sin orden global:
 *  quien necesita orden lo aplica despues. */
export async function findInChunks<T, Row>(
  items: readonly T[],
  query: (chunk: T[]) => Promise<Row[]>,
  size: number = D1_LIST_CHUNK
): Promise<Row[]> {
  const rows: Row[] = [];
  for (const chunk of chunkList(items, size))
    rows.push(...(await query(chunk)));
  return rows;
}

/** Suma un conteo (count, o `count` de updateMany/deleteMany) por tanda. */
export async function countInChunks<T>(
  items: readonly T[],
  query: (chunk: T[]) => Promise<number | { count: number }>,
  size: number = D1_LIST_CHUNK
): Promise<number> {
  let total = 0;
  for (const chunk of chunkList(items, size)) {
    const result = await query(chunk);
    total += typeof result === 'number' ? result : result.count;
  }
  return total;
}

/** `countInChunks` para un where con dos listas: cada una va de a la mitad
 *  del tope y se cruzan todas las tandas. */
export async function countInChunkPairs<A, B>(
  first: readonly A[],
  second: readonly B[],
  query: (first: A[], second: B[]) => Promise<number | { count: number }>
): Promise<number> {
  const half = D1_LIST_CHUNK / 2;
  let total = 0;
  for (const a of chunkList(first, half))
    total += await countInChunks(second, (b) => query(a, b), half);
  return total;
}
