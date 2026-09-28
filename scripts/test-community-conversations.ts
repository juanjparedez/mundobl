import assert from 'node:assert/strict';
import {
  prisma,
  createCommunityTopic,
  getCommunityTopic,
  getPersonalCommunityTopics,
  getCommunityTopics,
  getCommunityConversationContext,
  replyToCommunityTopic,
  editCommunityTopic,
  setCommunityFollow,
  markCommunityRead,
  getCommunityReplyRecipients,
  saveCommunityRecommendation,
} from '../src/lib/database';
import {
  parseCommunityTopic,
  CommunityError,
} from '../src/lib/community-input';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const key = `community-follow-${Date.now()}`;
  const users = [key, `${key}-reader`, `${key}-author`, `${key}-staff`];
  const [owner, reader, author, staff] = users;
  const seriesIds: number[] = [];
  const rejected = (status: number) => (error: unknown) =>
    error instanceof CommunityError && error.status === status;
  try {
    await prisma.user.createMany({
      data: users.map((id) => ({
        id,
        email: `${id}@example.invalid`,
        role: id === staff ? 'ADMIN' : 'VISITOR',
      })),
    });
    const series = await prisma.series.create({
      data: { title: key, type: 'serie' },
    });
    seriesIds.push(series.id);
    assert.equal(
      (await getCommunityConversationContext(series.id))?.series.id,
      series.id
    );
    assert.equal(
      await getCommunityConversationContext(series.id, 2147483647),
      null
    );
    const input = parseCommunityTopic({
      kind: 'DISCUSSION',
      title: 'Our favorite scene',
      body: 'A synthetic conversation for privacy checks.',
      seriesId: series.id,
    });
    const topic = await createCommunityTopic(owner, input);
    assert.equal(
      (await getPersonalCommunityTopics(owner, 'drafts')).items[0]?.id,
      topic.id
    );
    assert.equal(
      (await getPersonalCommunityTopics(reader, 'drafts')).items.length,
      0
    );
    assert.equal(await getCommunityTopic(topic.id, 1, staff), null);
    await assert.rejects(
      setCommunityFollow(reader, topic.id, {
        following: true,
        notify: true,
        muted: false,
      }),
      rejected(404)
    );
    let detail = (await getCommunityTopic(topic.id, 1, owner))!;
    await assert.rejects(
      editCommunityTopic(reader, topic.id, detail.updatedAt, {
        published: true,
      }),
      rejected(404)
    );
    await editCommunityTopic(owner, topic.id, detail.updatedAt, {
      published: true,
    });
    await assert.rejects(
      editCommunityTopic(owner, topic.id, detail.updatedAt, { input }),
      rejected(409)
    );
    await setCommunityFollow(reader, topic.id, {
      following: true,
      notify: false,
      muted: false,
    });
    const reply = await replyToCommunityTopic(
      topic.id,
      author,
      'A public reply.',
      false
    );
    assert.equal(
      (await getPersonalCommunityTopics(reader, 'following')).items[0]?.unread,
      true
    );
    assert.equal(
      (await getPersonalCommunityTopics(owner, 'drafts')).items.length,
      0
    );
    assert.deepEqual(
      await getCommunityReplyRecipients(topic.id, reply.id, author),
      []
    );
    await setCommunityFollow(reader, topic.id, {
      following: true,
      notify: true,
      muted: false,
    });
    assert.deepEqual(
      await getCommunityReplyRecipients(topic.id, reply.id, author),
      [reader]
    );
    assert.equal((await getCommunityTopic(topic.id))!.follow, null);
    assert.deepEqual((await getCommunityTopic(topic.id, 1, reader))!.follow, {
      notify: true,
      muted: false,
    });
    await setCommunityFollow(reader, topic.id, {
      following: true,
      notify: true,
      muted: true,
    });
    assert.deepEqual(
      await getCommunityReplyRecipients(topic.id, reply.id, author),
      []
    );
    await setCommunityFollow(reader, topic.id, {
      following: true,
      notify: true,
      muted: false,
    });
    await prisma.communityBlock.create({
      data: { userId: author, targetId: reader },
    });
    assert.deepEqual(
      await getCommunityReplyRecipients(topic.id, reply.id, author),
      []
    );
    await assert.rejects(
      markCommunityRead(reader, topic.id, reply.id),
      rejected(404)
    );
    await prisma.communityBlock.deleteMany({ where: { userId: author } });
    await prisma.communityBlock.create({
      data: { userId: reader, targetId: owner },
    });
    assert.deepEqual(
      await getCommunityReplyRecipients(topic.id, reply.id, author),
      []
    );
    await prisma.communityBlock.deleteMany({ where: { userId: reader } });
    await prisma.user.update({ where: { id: reader }, data: { banned: true } });
    assert.deepEqual(
      await getCommunityReplyRecipients(topic.id, reply.id, author),
      []
    );
    await prisma.user.update({
      where: { id: reader },
      data: { banned: false },
    });
    const before = new Date(0);
    await prisma.communityFollow.update({
      where: { userId_topicId: { userId: reader, topicId: topic.id } },
      data: { lastReadAt: before },
    });
    await markCommunityRead(reader, topic.id, reply.id);
    assert.equal(
      (await getPersonalCommunityTopics(reader, 'following')).items[0]?.unread,
      false
    );
    const follow = await prisma.communityFollow.findUniqueOrThrow({
      where: { userId_topicId: { userId: reader, topicId: topic.id } },
    });
    assert.ok(follow.lastReadAt > before);
    detail = (await getCommunityTopic(topic.id, 1, owner))!;
    await editCommunityTopic(owner, topic.id, detail.updatedAt, {
      published: false,
    });
    assert.equal(await getCommunityTopic(topic.id, 1, reader), null);
    assert.equal(
      (await getPersonalCommunityTopics(reader, 'following')).items.length,
      0
    );
    assert.deepEqual(
      await getCommunityReplyRecipients(topic.id, reply.id, author),
      []
    );
    await setCommunityFollow(reader, topic.id, {
      following: false,
      notify: false,
      muted: false,
    });
    assert.equal(
      await prisma.communityFollow.count({ where: { userId: reader } }),
      0
    );
    const saved = await Promise.all([
      saveCommunityRecommendation(reader, series.id),
      saveCommunityRecommendation(reader, series.id),
    ]);
    assert.equal(saved.filter((row) => row.added).length, 1);
    const recommendationTopic = await createCommunityTopic(
      owner,
      parseCommunityTopic({
        ...input,
        visibility: 'PUBLIC',
        kind: 'RECOMMENDATION',
        seriesId: null,
      })
    );
    const scoped = await getCommunityTopics(1, '', 'all', reader, {
      seriesId: series.id,
    });
    assert.ok(scoped.items.every((item) => item.series?.id === series.id));
    assert.ok(!scoped.items.some((item) => item.id === recommendationTopic.id));
    const recommended = await replyToCommunityTopic(
      recommendationTopic.id,
      author,
      'Try this work.',
      false,
      series.id
    );
    assert.equal(
      (await getCommunityTopic(recommendationTopic.id))!.replies[0]
        .recommendedSeries?.id,
      series.id
    );
    await prisma.viewStatus.updateMany({
      where: { userId: reader, seriesId: series.id },
      data: { status: 'VISTA' },
    });
    assert.deepEqual(await saveCommunityRecommendation(reader, series.id), {
      added: false,
    });
    assert.equal(
      (
        await prisma.viewStatus.findFirstOrThrow({
          where: { userId: reader, seriesId: series.id },
        })
      ).status,
      'VISTA'
    );
    await prisma.series.update({
      where: { id: series.id },
      data: { visibility: 'HIDDEN' },
    });
    assert.equal(await getCommunityConversationContext(series.id), null);
    assert.equal(
      (await getCommunityTopic(recommendationTopic.id))!.replies[0]
        .recommendedSeries,
      null
    );
    assert.equal(
      (await getCommunityTopic(recommendationTopic.id))!.replies[0].id,
      recommended.id
    );
    await assert.rejects(
      replyToCommunityTopic(
        recommendationTopic.id,
        author,
        'A hidden recommendation.',
        false,
        series.id
      ),
      rejected(404)
    );
    await assert.rejects(
      saveCommunityRecommendation(author, series.id),
      rejected(404)
    );
    console.log(
      'PASS: private drafts, owner-only editing, concurrent edit conflicts, explicit notification opt-in, mute, reciprocal blocks, banned recipients, withdrawal, read markers and progress-preserving saves.'
    );
  } finally {
    await prisma.communityTopic.deleteMany({
      where: { userId: { in: users } },
    });
    await prisma.series.deleteMany({ where: { id: { in: seriesIds } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
