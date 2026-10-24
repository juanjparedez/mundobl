/**
 * Corre las tareas de a `limit` a la vez. Para envios (Resend, push) que no
 * pueden ir todos juntos por rate limit ni de a uno por el tiempo de la lambda.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await task(items[index]);
      }
    })()
  );
  await Promise.all(workers);
  return results;
}
