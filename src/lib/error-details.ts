/**
 * Datos de un error para los logs de Workers. Los errores del driver de
 * Postgres llegan con `message` vacio y la causa real en `code` o `cause`;
 * console.error(error) solo deja el stack y se pierde por que fallo.
 */
export function errorDetails(
  error: unknown,
  depth = 0
): Record<string, unknown> {
  if (!(error instanceof Error)) return { value: String(error) };
  const extra = error as Error & { code?: unknown; cause?: unknown };
  return {
    name: error.name,
    message: error.message,
    ...(extra.code !== undefined && { code: extra.code }),
    ...(extra.cause !== undefined &&
      depth < 3 && { cause: errorDetails(extra.cause, depth + 1) }),
    stack: error.stack?.split('\n').slice(0, 6).join('\n'),
  };
}
