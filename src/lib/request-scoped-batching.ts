/**
 * Prisma junta en un solo "tick" los findUnique/findUniqueOrThrow (y las
 * transacciones en lote) con un DataLoader interno y los despacha todos
 * juntos desde un `process.nextTick`. Con un solo PrismaClient global en
 * Cloudflare Workers, ese tick lo programa el primer request que llega y
 * despacha tambien las consultas de los requests que llegaron despues: corren
 * en el contexto (y con el pool de RequestScopedPool) del primero. Si ese
 * request termina antes, workerd le cierra los sockets y la consulta del otro
 * muere ("Client socket closed while state was busy" en Supavisor, "A promise
 * was resolved or rejected from a different request context" en el Worker,
 * 500 en la app). Pasa mas cuando un usuario abre una pagina que dispara
 * varias APIs juntas con el token por refrescar: todas hacen el mismo
 * user.findUnique en auth.ts.
 *
 * Aca cada request recibe su propio DataLoader (mismas opciones que el de
 * Prisma), asi el lote se despacha siempre dentro del request que lo pidio.
 * Dentro de un mismo request el batching sigue igual.
 *
 * Depende de un detalle interno de Prisma (`_requestHandler.dataloader`,
 * probado con 7.10.1): si cambia, falla al arrancar en vez de volver al
 * comportamiento roto. scripts/test-request-scoped-batching.ts lo verifica.
 */

interface DataLoaderLike {
  options: unknown;
  request(request: unknown): Promise<unknown>;
}

interface RequestHandlerLike {
  dataloader: DataLoaderLike;
}

function isDataLoader(value: unknown): value is DataLoaderLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'options' in value &&
    'request' in value &&
    typeof value.request === 'function'
  );
}

export function scopeBatchingToRequest(
  client: object,
  requestKey: () => object | undefined
): void {
  const handler: unknown = Reflect.get(client, '_requestHandler');
  const shared: unknown =
    typeof handler === 'object' && handler !== null
      ? Reflect.get(handler, 'dataloader')
      : undefined;
  if (!isDataLoader(shared)) {
    throw new Error(
      'scopeBatchingToRequest: cambio el DataLoader interno de Prisma; revisar src/lib/request-scoped-batching.ts'
    );
  }
  const Loader = shared.constructor as new (options: unknown) => DataLoaderLike;
  const loaders = new WeakMap<object, DataLoaderLike>();
  const scoped: DataLoaderLike = {
    options: shared.options,
    request(request) {
      const key = requestKey();
      // Fuera de un request (build, scripts) no hay nada que separar.
      if (!key) return shared.request(request);
      let loader = loaders.get(key);
      if (!loader) {
        loader = new Loader(shared.options);
        loaders.set(key, loader);
      }
      return loader.request(request);
    },
  };
  (handler as RequestHandlerLike).dataloader = scoped;
}
