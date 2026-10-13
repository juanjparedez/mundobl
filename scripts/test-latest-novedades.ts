import assert from 'node:assert/strict';
import { createLatestNovedadesReader } from '../src/lib/latest-novedades';

async function main() {
  let clock = 0;
  let calls = 0;
  let fail = false;
  const read = createLatestNovedadesReader(
    async () => {
      calls++;
      return fail
        ? new Response('', { status: 503 })
        : Response.json({ timestamp: calls });
    },
    () => clock
  );
  assert.deepEqual(await Promise.all([read(), read(), read()]), [1, 1, 1]);
  assert.equal(calls, 1);
  clock = 59_999;
  assert.equal(await read(), 1);
  assert.equal(calls, 1);
  clock = 60_000;
  assert.equal(await read(), 2);
  fail = true;
  clock = 120_000;
  await assert.rejects(read());
  fail = false;
  assert.equal(await read(), 4);
  const empty = createLatestNovedadesReader(async () =>
    Response.json({ timestamp: null })
  );
  assert.equal(await empty(), null);
  console.log(
    'Novedades: concurrent reads deduplicated, TTL, expiry, retry after failure and empty data passed.'
  );
}
void main();
