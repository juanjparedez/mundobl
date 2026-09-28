import assert from 'node:assert/strict';
import {
  prisma,
  restoreCommunityBackup,
  getCommunityAccountExport,
  getCommunityTopics,
  getRecommendationLists,
} from '../src/lib/database';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const key = `community-backup-${Date.now()}`;
  const users = [key, `${key}-original`, `${key}-parallel`];
  let seriesId: number | undefined;
  try {
    await prisma.user.createMany({
      data: users.map((id) => ({ id, email: `${id}@example.invalid` })),
    });
    seriesId = (
      await prisma.series.create({ data: { title: key, type: 'serie' } })
    ).id;
    const payload = {
      community: {
        profile: {
          userId: users[1],
          publicId: 'forged-id',
          displayName: 'Mi presentación',
          bio: 'Una bio importada',
          published: true,
          showAvatar: true,
          moderationHidden: false,
        },
        lists: [
          {
            id: 'forged-list-id',
            userId: users[1],
            title: 'Mi lista importada',
            description: 'Descripción',
            visibility: 'PUBLIC',
            kind: 'TOP_FIVE',
            items: [{ seriesId, note: 'Spoiler privado', hasSpoilers: true }],
          },
        ],
        topics: [
          {
            userId: users[1],
            title: 'Conversación importada',
            body: 'Este contenido era público y debe recuperarse privado.',
            kind: 'DISCUSSION',
            seriesId,
            visibility: 'PUBLIC',
            moderationHidden: false,
          },
        ],
        follows: [{ userId: users[1], topicId: 123, notify: true }],
        replies: [{ userId: users[1], body: 'No publicar automáticamente' }],
        blocks: [{ userId: key, targetId: users[1] }],
        reports: [{ targetType: 'TOPIC', targetId: '123', reason: 'OTHER' }],
      },
    };
    const preview = await restoreCommunityBackup(key, payload, true);
    assert.equal(preview.imported.communityLists, 1);
    assert.equal(preview.imported.communityTopics, 1);
    assert.equal(preview.imported.communityProfile, 1);
    assert.equal(preview.skipped.communityFollows, 1);
    assert.equal(
      await prisma.recommendationList.count({ where: { userId: key } }),
      0
    );
    assert.equal(
      await prisma.communityProfile.count({ where: { userId: key } }),
      0
    );
    assert.deepEqual(
      await restoreCommunityBackup(key, payload, false),
      preview
    );
    const exported = await getCommunityAccountExport(key);
    assert.equal(exported.lists[0].visibility, 'PRIVATE');
    assert.notEqual(exported.lists[0].id, 'forged-list-id');
    assert.equal(exported.topics[0].visibility, 'PRIVATE');
    assert.equal(exported.topics[0].userId, key);
    assert.equal(exported.profile?.published, false);
    assert.equal(exported.profile?.showAvatar, false);
    assert.notEqual(exported.profile?.publicId, 'forged-id');
    assert.equal(exported.profile?.promptChoice, 'STARTED');
    for (const rows of [
      exported.follows,
      exported.blocks,
      exported.reports,
      exported.replies,
    ])
      assert.equal(rows.length, 0);
    assert.equal(
      (await getRecommendationLists({ search: 'Mi lista importada' })).items
        .length,
      0
    );
    assert.equal(
      (await getCommunityTopics(1, 'Conversación importada')).items.length,
      0
    );
    const repeated = await restoreCommunityBackup(
      key,
      { community: exported },
      false
    );
    assert.ok(Object.values(repeated.imported).every((count) => count === 0));
    await prisma.communityProfile.update({
      where: { userId: key },
      data: { published: true, displayName: 'No reemplazar', showAvatar: true },
    });
    await restoreCommunityBackup(key, payload, false);
    assert.equal(
      (
        await prisma.communityProfile.findUniqueOrThrow({
          where: { userId: key },
        })
      ).displayName,
      'No reemplazar'
    );
    const concurrent = await Promise.all([
      restoreCommunityBackup(users[2], payload, false),
      restoreCommunityBackup(users[2], payload, false),
    ]);
    assert.equal(
      concurrent.reduce(
        (sum, result) => sum + result.imported.communityLists,
        0
      ),
      1
    );
    assert.equal(
      concurrent.reduce(
        (sum, result) => sum + result.imported.communityTopics,
        0
      ),
      1
    );
    await prisma.series.update({
      where: { id: seriesId },
      data: { visibility: 'HIDDEN' },
    });
    const hidden = await restoreCommunityBackup(users[1], payload, true);
    assert.equal(hidden.imported.communityLists, 0);
    assert.equal(hidden.imported.communityTopics, 0);
    assert.equal(hidden.missingRefs.length, 2);
    const malformed = await restoreCommunityBackup(
      key,
      {
        community: {
          lists: [null, { title: 'bad' }],
          topics: [{ role: 'ADMIN' }],
          profile: { displayName: 3 },
        },
      },
      false
    );
    assert.equal(malformed.skipped.communityLists, 2);
    assert.equal(malformed.skipped.communityTopics, 1);
    assert.equal(malformed.skipped.communityProfile, 1);
    assert.equal(
      (await prisma.user.findUniqueOrThrow({ where: { id: key } })).role,
      'VISITOR'
    );
    console.log(
      'PASS: community import preview, private content restoration, identity/permission stripping, concurrent idempotency, existing profile preservation, hidden targets, malformed data, and no restored notifications or public replies.'
    );
  } finally {
    await prisma.communityTopic.deleteMany({
      where: { userId: { in: users } },
    });
    if (seriesId) await prisma.series.delete({ where: { id: seriesId } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
