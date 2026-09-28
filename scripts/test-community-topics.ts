import assert from 'node:assert/strict';
import {
  prisma,
  createCommunityTopic,
  replyToCommunityTopic,
  getCommunityTopics,
  getCommunityTopic,
  manageCommunityTopic,
  deleteCommunityReply,
  searchCommunitySeries,
  getCommunityEpisodes,
} from '../src/lib/database';
import {
  parseCommunityTopic,
  CommunityError,
} from '../src/lib/community-input';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const key = `topics-${Date.now()}`;
  const ids: number[] = [];
  const users = [key, `${key}-other`, `${key}-limit`];
  try {
    await prisma.user.createMany({
      data: users.map((id) => ({
        id,
        name: 'Nombre Apellido',
        nickname: id === key ? 'Lector' : null,
        email: `${id}@example.invalid`,
      })),
    });
    const series = await prisma.series.create({
      data: {
        title: key,
        type: 'serie',
        seasons: {
          create: {
            seasonNumber: 1,
            episodes: { create: { episodeNumber: 1 } },
          },
        },
      },
      include: { seasons: { include: { episodes: true } } },
    });
    ids.push(series.id);
    const other = await prisma.series.create({
      data: {
        title: `${key}-hidden`,
        type: 'serie',
        visibility: 'HIDDEN',
        seasons: {
          create: {
            seasonNumber: 2,
            episodes: { create: { episodeNumber: 1 } },
          },
        },
      },
      include: { seasons: { include: { episodes: true } } },
    });
    ids.push(other.id);
    const input = {
      visibility: 'PUBLIC',
      kind: 'DISCUSSION',
      title: 'A discussion of the ending',
      body: 'This is a synthetic community conversation.',
      seriesId: series.id,
      episodeId: series.seasons[0].episodes[0].id,
    };
    const topic = await createCommunityTopic(key, parseCommunityTopic(input));
    const detail = await getCommunityTopic(topic.id);
    assert.ok(detail?.hasSpoilers);
    assert.equal(detail.author?.name, 'Lector');
    assert.equal(detail.episode?.seasonNumber, 1);
    const list = await getCommunityTopics(1, key);
    assert.equal(list.items[0].title, null);
    assert.equal(list.items[0].excerpt, null);
    assert.ok(!JSON.stringify(list).includes('Apellido'));
    assert.ok(!JSON.stringify(list).includes('@example.invalid'));
    const rejected = (status: number) => (error: unknown) =>
      error instanceof CommunityError && error.status === status;
    await assert.rejects(
      createCommunityTopic(
        key,
        parseCommunityTopic({
          ...input,
          episodeId: other.seasons[0].episodes[0].id,
        })
      ),
      rejected(400)
    );
    await assert.rejects(
      createCommunityTopic(
        key,
        parseCommunityTopic({ ...input, seriesId: other.id, episodeId: null })
      ),
      rejected(404)
    );
    assert.throws(
      () => parseCommunityTopic({ ...input, kind: 'REVIEW_REQUEST' }),
      rejected(400)
    );
    assert.throws(
      () => parseCommunityTopic({ ...input, seriesId: null }),
      rejected(400)
    );
    assert.throws(
      () => parseCommunityTopic({ ...input, title: ' ' }),
      rejected(400)
    );
    assert.throws(
      () => parseCommunityTopic({ ...input, body: 'a'.repeat(5001) }),
      rejected(400)
    );
    assert.equal(
      (await searchCommunitySeries(key)).some((row) => row.id === other.id),
      false
    );
    assert.equal((await getCommunityEpisodes(other.id)).length, 0);
    const recommendation = await createCommunityTopic(
      key,
      parseCommunityTopic({
        kind: 'RECOMMENDATION',
        visibility: 'PUBLIC',
        title: `${key} recommendations`,
        body: 'Looking for a gentle story with a happy ending.',
      })
    );
    const reviewRequest = await createCommunityTopic(
      key,
      parseCommunityTopic({ ...input, kind: 'REVIEW_REQUEST', episodeId: null })
    );
    assert.ok(
      (await getCommunityTopics(1, key, 'REVIEW_REQUEST')).items.some(
        (row) => row.id === reviewRequest.id
      )
    );
    assert.ok(
      (await getCommunityTopics(1, key, 'unanswered')).items.some(
        (row) => row.id === topic.id
      )
    );
    const reply = await replyToCommunityTopic(
      topic.id,
      users[1],
      'Here is my reply',
      false
    );
    assert.equal(reply.ownerId, key);
    assert.equal((await getCommunityTopic(topic.id))?.replyCount, 1);
    assert.ok(
      !(await getCommunityTopics(1, key, 'unanswered')).items.some(
        (row) => row.id === topic.id
      )
    );
    await assert.rejects(
      manageCommunityTopic(topic.id, users[1], true),
      rejected(404)
    );
    await manageCommunityTopic(topic.id, key, true);
    await assert.rejects(
      replyToCommunityTopic(topic.id, users[1], 'Closed thread', false),
      rejected(409)
    );
    await manageCommunityTopic(topic.id, key, false);
    await assert.rejects(
      deleteCommunityReply(topic.id, reply.id, key),
      rejected(404)
    );
    await deleteCommunityReply(topic.id, reply.id, users[1]);
    assert.equal((await getCommunityTopic(topic.id))?.replyCount, 0);
    await prisma.communityReply.createMany({
      data: Array.from({ length: 31 }, (_, i) => ({
        topicId: topic.id,
        userId: users[1],
        body: `Pagination ${i}`,
        createdAt: new Date('2020-01-01'),
      })),
    });
    const first = await getCommunityTopic(topic.id),
      second = await getCommunityTopic(topic.id, 2);
    assert.equal(first?.replies.length, 30);
    assert.equal(first?.hasMore, true);
    assert.equal(second?.replies.length, 1);
    assert.equal(second?.hasMore, false);
    await prisma.series.update({
      where: { id: series.id },
      data: { visibility: 'HIDDEN' },
    });
    assert.equal(await getCommunityTopic(topic.id), null);
    await assert.rejects(
      replyToCommunityTopic(topic.id, users[1], 'Hidden thread', false),
      rejected(404)
    );
    assert.ok(
      !(await getCommunityTopics(1, key)).items.some(
        (row) => row.id === topic.id
      )
    );
    assert.ok((await getCommunityTopic(recommendation.id)) !== null);
    await prisma.series.update({
      where: { id: series.id },
      data: { visibility: 'VISIBLE' },
    });
    const attempts = await Promise.allSettled(
      Array.from({ length: 7 }, () =>
        createCommunityTopic(
          users[2],
          parseCommunityTopic({
            kind: 'RECOMMENDATION',
            title: 'Rate limit topic',
            body: 'A synthetic recommendation request.',
          })
        )
      )
    );
    assert.equal(attempts.filter((r) => r.status === 'fulfilled').length, 5);
    assert.ok(
      attempts
        .filter((r) => r.status === 'rejected')
        .every((r) => r.status === 'rejected' && rejected(429)(r.reason))
    );
    const policies = await prisma.$queryRaw<
      Array<{ relname: string; relrowsecurity: boolean }>
    >`SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('CommunityTopic', 'CommunityReply')`;
    assert.equal(policies.length, 2);
    assert.ok(policies.every((row) => row.relrowsecurity));
    await manageCommunityTopic(topic.id, key);
    assert.equal(await getCommunityTopic(topic.id), null);
    assert.equal(
      await prisma.communityReply.count({ where: { topicId: topic.id } }),
      0
    );
    console.log(
      'PASS: topic kinds, episode ownership, spoilers, visibility, replies, closure, ownership/moderation, pagination, atomic limits and RLS'
    );
  } finally {
    await prisma.communityTopic.deleteMany({
      where: { userId: { in: users } },
    });
    await prisma.series.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
