import assert from 'node:assert/strict';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma';
import { createSupportRepository } from '../src/lib/support-repository';
import {
  EMPTY_SUPPORT,
  parseSupportContent,
  isSupportOwner,
} from '../src/lib/support-input';
import { assertLocalTestDatabase } from './assert-local-test-database';
assertLocalTestDatabase();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
const repo = createSupportRepository(db);
const prefix = `support-test-${Date.now()}`;
const owner = prefix + '-owner',
  other = prefix + '-other';
process.env.ADMIN_EMAILS = `${owner}@example.test,${other}@example.test`;
const content = {
  intro: 'Presentación',
  purpose: 'Infraestructura',
  thanks: 'Gracias',
  methods: [
    {
      kind: 'link' as const,
      label: 'Método',
      enabled: true,
      url: 'https://example.test/support',
      alias: '',
      holder: '',
      bank: '',
      currency: '',
    },
  ],
};
async function main() {
  assert.equal(
    await db.supportSettings.count(),
    0,
    'Use a fresh disposable database'
  );
  await db.user.createMany({
    data: [
      { id: owner, email: owner + '@example.test', role: 'ADMIN' },
      { id: other, email: other + '@example.test', role: 'ADMIN' },
      { id: prefix, email: prefix + '@example.test', role: 'ADMIN' },
      {
        id: prefix + '-mod',
        email: prefix + '-mod@example.test',
        role: 'MODERATOR',
      },
    ],
  });
  try {
    assert.equal(
      isSupportOwner(
        { role: 'ADMIN', email: 'EXAMPLE@test', banned: false },
        ' example@test '
      ),
      true
    );
    assert.equal(
      isSupportOwner(
        { role: 'ADMIN', email: 'EXAMPLE@test', banned: true },
        'example@test'
      ),
      false
    );
    for (const id of [prefix, prefix + '-mod', 'missing'])
      await assert.rejects(repo.getSupportAdmin(id), { status: 403 });
    assert.equal(await repo.getSupportPublic(), null);
    await assert.rejects(
      repo.mutateSupport(owner, {
        action: 'publish',
        version: 0,
        content: undefined,
      }),
      { status: 400 }
    );
    assert.equal(
      await db.supportSettings.count(),
      0,
      'invalid publication rolls back'
    );
    assert.throws(() =>
      parseSupportContent({
        ...content,
        methods: [{ ...content.methods[0], url: 'javascript:alert(1)' }],
      })
    );
    assert.throws(() =>
      parseSupportContent({
        ...content,
        methods: [
          { ...content.methods[0], url: 'https://user:secret@example.test' },
        ],
      })
    );
    assert.throws(() => parseSupportContent(EMPTY_SUPPORT, true));
    let state = await repo.mutateSupport(owner, {
      action: 'save',
      version: 0,
      content,
    });
    assert.equal(state.enabled, false);
    assert.equal(await repo.getSupportPublic(), null);
    state = await repo.mutateSupport(owner, {
      action: 'publish',
      version: state.version,
      content: undefined,
    });
    assert.equal((await repo.getSupportPublic())?.intro, content.intro);
    state = await repo.mutateSupport(owner, {
      action: 'save',
      version: state.version,
      content: { ...content, intro: 'Draft only' },
    });
    assert.equal(
      (await repo.getSupportPublic())?.intro,
      content.intro,
      'draft cannot leak'
    );
    const attempts = await Promise.allSettled(
      [owner, other].map((id) =>
        repo.mutateSupport(id, {
          action: 'save',
          version: state.version,
          content: { ...content, intro: id },
        })
      )
    );
    assert.equal(attempts.filter((x) => x.status === 'fulfilled').length, 1);
    assert.equal(
      attempts.filter((x) => x.status === 'rejected' && x.reason.status === 409)
        .length,
      1
    );
    state = await repo.getSupportAdmin(owner);
    state = await repo.mutateSupport(owner, {
      action: 'hide',
      version: state.version,
      content: undefined,
    });
    assert.equal(await repo.getSupportPublic(), null);
    assert.equal(state.enabled, false);
    await db.user.update({ where: { id: owner }, data: { banned: true } });
    await assert.rejects(
      repo.mutateSupport(owner, {
        action: 'publish',
        version: state.version,
        content: undefined,
      }),
      { status: 403 }
    );
    const rls = await pool.query(
      `SELECT relrowsecurity FROM pg_class WHERE relname='SupportSettings'`
    );
    assert.equal(rls.rows[0].relrowsecurity, true);
    console.log(
      'PASS support: permissions, validation, rollback, draft isolation, publish/hide, concurrent conflict, banned owner, RLS'
    );
  } finally {
    await db.supportSettings.deleteMany();
    await db.user.deleteMany({
      where: { id: { in: [owner, other, prefix, prefix + '-mod'] } },
    });
  }
}
main().finally(async () => {
  await db.$disconnect();
  await pool.end();
});
