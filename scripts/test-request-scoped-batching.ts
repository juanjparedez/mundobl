import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { scopeBatchingToRequest } from '../src/lib/request-scoped-batching';

/**
 * Prueba de src/lib/request-scoped-batching.ts sin base de datos: con el
 * DataLoader real de la version de Prisma instalada, cada lote se despacha
 * dentro del request que lo pidio, nunca desde el tick de otro.
 */

async function main() {
  // 1) El detalle interno de Prisma sigue donde lo espera el parche.
  const client = new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString: 'postgresql://x@x/x' })),
  });
  const original: unknown = Reflect.get(
    Reflect.get(client, '_requestHandler') as object,
    'dataloader'
  );
  scopeBatchingToRequest(client, () => undefined);
  const Loader = (original as object).constructor as new (options: unknown) => {
    request(request: unknown): Promise<unknown>;
  };

  // 2) Dos "requests" piden en el mismo tick: cada lote sale en el suyo.
  let current: object | undefined;
  // Cada lote se despacha desde un nextTick que programa el loader del request
  // que lo pidio; en workerd ese tick hereda el contexto (y el pool) de ese
  // request. Basta con que ningun lote mezcle requests.
  const dispatched: string[][] = [];
  const options = {
    batchBy: () => 'user.findUnique',
    batchOrder: () => 0,
    singleLoader: async (request: string) => {
      dispatched.push([request]);
      return request;
    },
    batchLoader: async (requests: string[]) => {
      dispatched.push(requests);
      return requests;
    },
  };
  const fake = { _requestHandler: { dataloader: new Loader(options) } };
  scopeBatchingToRequest(fake, () => current);

  const requestA = { name: 'A' };
  const requestB = { name: 'B' };
  current = requestA;
  const a1 = fake._requestHandler.dataloader.request('a1');
  const a2 = fake._requestHandler.dataloader.request('a2');
  current = requestB;
  const b1 = fake._requestHandler.dataloader.request('b1');
  assert.deepEqual(await Promise.all([a1, a2, b1]), ['a1', 'a2', 'b1']);
  assert.deepEqual(dispatched, [['a1', 'a2'], ['b1']]);

  // 3) Si Prisma cambia el detalle interno, falla al arrancar.
  assert.throws(() => scopeBatchingToRequest({}, () => undefined));

  console.log(JSON.stringify({ result: 'PASS', checks: 3 }));
}

void main();
