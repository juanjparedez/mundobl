import assert from 'node:assert/strict';
import {
  prisma,
  changeBasedOnValue,
  getBasedOnDirectory,
  resolveBasedOnValue,
} from '../src/lib/database';
import { getBasedOnSuggestions } from '../src/lib/based-on';

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  assert.equal(url.hostname, '127.0.0.1');
  assert.equal(url.port, '55433');
  assert.equal(url.pathname, '/mundobl_replay');
  const fixtures = await Promise.all(
    ['manga', 'manga', 'Manga', 'GM', ' Web   novel '].map((basedOn, i) =>
      prisma.series.create({
        data: { title: `Based-on test ${i}`, type: 'serie', basedOn },
      })
    )
  );
  assert.deepEqual(getBasedOnSuggestions(['Manga', 'manga', 'manga', 'GM']), [
    'manga',
  ]);
  assert.equal(await resolveBasedOnValue(' MANGA '), 'manga');
  assert.equal(await resolveBasedOnValue('web novel'), 'Web novel');
  assert.equal(await resolveBasedOnValue(undefined), undefined);
  assert.equal(await resolveBasedOnValue('  '), null);
  assert.equal(
    (await getBasedOnDirectory()).filter(
      (entry) => entry.value.toLowerCase() === 'manga'
    ).length,
    2
  );
  await assert.rejects(
    changeBasedOnValue('Manga', 'manga', 'rename', [fixtures[2].id])
  );
  assert.equal(
    await changeBasedOnValue('Manga', 'manga', 'merge', [fixtures[2].id]),
    1
  );
  assert.equal(await prisma.series.count({ where: { basedOn: 'manga' } }), 3);
  await assert.rejects(
    changeBasedOnValue('manga', null, 'remove', [fixtures[0].id])
  );
  assert.equal(await prisma.series.count({ where: { basedOn: 'manga' } }), 3);
  await assert.rejects(
    changeBasedOnValue('GM', 'missing', 'merge', [fixtures[3].id])
  );
  assert.equal(
    await changeBasedOnValue('GM', 'Original', 'rename', [fixtures[3].id]),
    1
  );
  assert.equal(
    await changeBasedOnValue('Original', null, 'remove', [fixtures[3].id]),
    1
  );
  assert.equal(
    await prisma.series.count({
      where: { id: { in: fixtures.map((item) => item.id) } },
    }),
    5
  );
  assert.equal(
    (await prisma.series.findUniqueOrThrow({ where: { id: fixtures[3].id } }))
      .basedOn,
    null
  );
  // Two conflicting actions on one source: exactly one may commit.
  const concurrent = await Promise.allSettled(
    ['Novel', 'Book'].map((target) =>
      changeBasedOnValue(' Web   novel ', target, 'rename', [fixtures[4].id])
    )
  );
  assert.equal(
    concurrent.filter((item) => item.status === 'fulfilled').length,
    1
  );
  await prisma.user.create({
    data: {
      id: 'based-on-admin',
      email: 'based-on-admin@example.invalid',
      role: 'ADMIN',
    },
  });
  console.log(
    'PASS: manga visible, canonical writes, distinct variants, merge, rename, clear without deleting titles, stale preview rollback, missing destination and conflicting concurrent writes.'
  );
}
main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
