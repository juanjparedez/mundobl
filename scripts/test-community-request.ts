import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  readCommunityMutation,
  assertCommunityOrigin,
} from '../src/lib/community-response';
import { CommunityError } from '../src/lib/community-input';

async function main() {
  const rejected = (status: number) => (error: unknown) =>
    error instanceof CommunityError && error.status === status;
  const request = (body: string, headers: Record<string, string> = {}) =>
    new Request('https://mundobl.example/api/community/lists', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body,
    });
  assert.deepEqual(
    await readCommunityMutation(
      request('{"title":"Lista"}', { origin: 'https://mundobl.example' })
    ),
    { title: 'Lista' }
  );
  assertCommunityOrigin(
    new NextRequest('http://127.0.0.1:3223/api/community/lists', {
      method: 'POST',
      headers: { host: '127.0.0.1:3223', origin: 'http://127.0.0.1:3223' },
    })
  );
  assert.throws(
    () =>
      assertCommunityOrigin(
        new NextRequest('http://127.0.0.1:3223/api/community/lists', {
          method: 'POST',
          headers: { host: '127.0.0.1:3223', origin: 'http://localhost:3223' },
        })
      ),
    rejected(403)
  );
  assert.throws(
    () =>
      assertCommunityOrigin(
        request('{}', {
          host: 'mundobl.example',
          origin: 'https://attacker.example',
          'x-forwarded-host': 'attacker.example',
        })
      ),
    rejected(403)
  );
  await assert.rejects(
    readCommunityMutation(
      request('{}', { origin: 'https://attacker.example' })
    ),
    rejected(403)
  );
  await assert.rejects(
    readCommunityMutation(request('{}', { 'sec-fetch-site': 'cross-site' })),
    rejected(403)
  );
  await assert.rejects(
    readCommunityMutation(request('{}', { 'content-type': 'text/plain' })),
    rejected(415)
  );
  await assert.rejects(
    readCommunityMutation(request(' '.repeat(256 * 1024 + 1))),
    rejected(413)
  );
  await assert.rejects(
    readCommunityMutation(request('{}', { 'content-length': '10000000' })),
    rejected(413)
  );
  await assert.rejects(readCommunityMutation(request('{')), SyntaxError);
  assert.throws(
    () =>
      assertCommunityOrigin(
        new Request('https://mundobl.example/api/community/lists/1', {
          method: 'DELETE',
          headers: { origin: 'https://attacker.example' },
        })
      ),
    rejected(403)
  );
  console.log(
    'PASS: same-origin JSON mutations, cross-site rejection including DELETE, bounded actual payload, malformed JSON.'
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
