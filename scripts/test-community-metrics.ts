import assert from 'node:assert/strict';
import { prisma, getCommunityMetrics } from '../src/lib/database';
import { getPublicStats } from '../src/lib/public-stats';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const key = `community-metrics-${Date.now()}`;
  const users = [key, `${key}-admin`, `${key}-banned`, `${key}-viewer`];
  const ids: number[] = [];
  const before = await getCommunityMetrics();
  try {
    await prisma.user.createMany({
      data: users.map((id) => ({
        id,
        email: `${id}@example.invalid`,
        role: id === users[1] ? 'ADMIN' : 'VISITOR',
        banned: id === users[2],
      })),
    });
    const hidden = await prisma.series.create({
      data: { title: key, type: 'serie', visibility: 'HIDDEN' },
    });
    ids.push(hidden.id);
    const visible = await prisma.series.create({
      data: { title: `${key}-visible`, type: 'serie' },
    });
    ids.push(visible.id);
    const base = {
      title: key,
      body: 'Public fixture.',
      kind: 'DISCUSSION' as const,
      visibility: 'PUBLIC' as const,
      userId: key,
      seriesId: visible.id,
    };
    const topic = await prisma.communityTopic.create({ data: base });
    const draft = await prisma.communityTopic.create({
      data: { ...base, visibility: 'PRIVATE' },
    });
    await prisma.communityTopic.createMany({
      data: [
        { ...base, moderationHidden: true },
        { ...base, seriesId: hidden.id },
        { ...base, userId: users[1] },
        { ...base, userId: users[2] },
      ],
    });
    const request = await prisma.communityTopic.create({
      data: { ...base, kind: 'REVIEW_REQUEST' },
    });
    const answered = await prisma.communityTopic.create({
      data: { ...base, kind: 'RECOMMENDATION' },
    });
    await prisma.communityTopic.create({
      data: { ...base, kind: 'RECOMMENDATION', closed: true },
    });
    await prisma.communityReply.createMany({
      data: [
        { topicId: topic.id, userId: key, body: 'Visible response' },
        {
          topicId: topic.id,
          userId: key,
          body: 'Hidden response',
          moderationHidden: true,
        },
        { topicId: topic.id, userId: users[1], body: 'Team response' },
        { topicId: topic.id, userId: users[2], body: 'Banned response' },
        { topicId: draft.id, userId: key, body: 'Private response' },
        { topicId: answered.id, userId: key, body: 'An answer' },
      ],
    });
    await prisma.recommendationList.createMany({
      data: [
        { title: key, userId: key, visibility: 'PUBLIC' },
        { title: key, userId: key },
        {
          title: key,
          userId: key,
          visibility: 'PUBLIC',
          moderationHidden: true,
        },
        { title: key, userId: users[1], visibility: 'PUBLIC' },
        { title: key, userId: users[2], visibility: 'PUBLIC' },
      ],
    });
    const expected = {
      conversations: before.conversations + 4,
      replies: before.replies + 2,
      lists: before.lists + 1,
      unansweredRequests: before.unansweredRequests + 1,
    };
    assert.deepEqual(await getCommunityMetrics(), expected);
    assert.deepEqual((await getPublicStats()).community, expected);
    await prisma.communityReply.updateMany({
      where: { topicId: answered.id },
      data: { moderationHidden: true },
    });
    assert.equal(
      (await getCommunityMetrics()).unansweredRequests,
      before.unansweredRequests + 2
    );
    await prisma.communityTopic.update({
      where: { id: request.id },
      data: { visibility: 'PRIVATE' },
    });
    assert.equal(
      (await getCommunityMetrics()).unansweredRequests,
      before.unansweredRequests + 1
    );
    await prisma.communityBlock.create({
      data: { userId: key, targetId: users[3] },
    });
    assert.deepEqual(await getCommunityMetrics(users[3]), before);
    console.log(
      'PASS: public metrics exclude drafts, moderation-hidden content, hidden works, banned/admin authors, and blocked accounts; requests become unanswered when their only visible reply is hidden; public statistics use the same metrics.'
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
