import { Pool, type PoolConfig } from 'pg';

type ErrorListener = (error: Error) => void;

/**
 * Pool de pg para Cloudflare Workers: un solo PrismaClient global (un solo
 * compilador de consultas WASM, ~10 MB de heap cada uno), pero los sockets
 * son de cada request.
 *
 * En workerd un socket abierto en un request no se puede usar desde otro
 * ("Cannot perform I/O on behalf of a different request"). Con un pool
 * global, cuando el request A libera una conexion, pg abre la siguiente para
 * el request B dentro del contexto de A: B queda colgado hasta el
 * connectionTimeout (10 s -> 500). Un PrismaClient por request lo evita pero
 * multiplica la memoria del isolate (128 MB) por los requests en paralelo.
 *
 * Esta clase extiende Pool (PrismaPg exige `instanceof Pool`) y deriva
 * `query`/`connect` al pool real del request actual, que vive en un WeakMap
 * atado a su ExecutionContext y se libera con el request.
 */
export class RequestScopedPool extends Pool {
  private readonly pools = new WeakMap<object, Pool>();
  private readonly errorListeners = new Set<ErrorListener>();

  constructor(
    private readonly config: PoolConfig,
    private readonly requestKey: () => object | undefined
  ) {
    super(config);
  }

  private current(): Pool {
    const key = this.requestKey();
    if (!key) {
      throw new Error('RequestScopedPool: consulta fuera de un request');
    }
    let pool = this.pools.get(key);
    if (!pool) {
      pool = new Pool(this.config);
      for (const listener of this.errorListeners) pool.on('error', listener);
      this.pools.set(key, pool);
    }
    return pool;
  }

  override query(...args: unknown[]): never {
    const pool = this.current();
    return (pool.query as (...a: unknown[]) => never).apply(pool, args);
  }

  override connect(...args: unknown[]): never {
    const pool = this.current();
    return (pool.connect as (...a: unknown[]) => never).apply(pool, args);
  }

  override on(event: string, listener: (...args: never[]) => void): this {
    if (event === 'error') this.errorListeners.add(listener as ErrorListener);
    return this;
  }

  override removeListener(
    event: string,
    listener: (...args: never[]) => void
  ): this {
    if (event === 'error') {
      this.errorListeners.delete(listener as ErrorListener);
    }
    return this;
  }
}
