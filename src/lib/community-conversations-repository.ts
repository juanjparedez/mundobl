import type { AppTransactionClient, AppPrismaClient } from './prisma-client';
import { createManySkippingDuplicates } from './create-many';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { CommunityTopicInput } from '@/types/community';
import { CommunityError } from './community-input';
import { inSequence } from './prisma-client';
import { withLease } from './lease';

export function createCommunityConversationsRepository(
  db: AppPrismaClient,
  publicSeries: Prisma.SeriesWhereInput,
  publicTopic: (viewerId?: string) => Prisma.CommunityTopicWhereInput,
  publicAuthor: (viewerId?: string) => Prisma.UserWhereInput
) {
  async function actor(tx: AppTransactionClient, userId: string) {
    if (
      !(await tx.user.findFirst({
        where: { id: userId, banned: false },
        select: { id: true },
      }))
    )
      throw new CommunityError(403, 'unavailable');
  }
  async function setCommunityFollow(
    userId: string,
    topicId: number,
    input: { following: boolean; notify: boolean; muted: boolean }
  ) {
    await withLease(
      `community-follow:${userId}`,
      async (tx) => {
        await actor(tx, userId);
        if (!input.following) {
          await tx.communityFollow.deleteMany({ where: { userId, topicId } });
          return;
        }
        if (
          !(await tx.communityTopic.findFirst({
            where: { id: topicId, ...publicTopic(userId) },
            select: { id: true },
          }))
        )
          throw new CommunityError(404, 'unavailable');
        const existing = await tx.communityFollow.findUnique({
          where: { userId_topicId: { userId, topicId } },
          select: { userId: true },
        });
        if (
          !existing &&
          (await tx.communityFollow.count({ where: { userId } })) >= 1000
        )
          throw new CommunityError(429, 'limit');
        const data = { notify: input.notify, muted: input.muted };
        await tx.communityFollow.upsert({
          where: { userId_topicId: { userId, topicId } },
          create: { userId, topicId, ...data },
          update: data,
        });
      },
      { db: db }
    );
  }
  async function markCommunityRead(
    userId: string,
    topicId: number,
    replyId: number
  ) {
    const reply = await db.communityReply.findFirst({
      where: {
        id: replyId,
        topicId,
        moderationHidden: false,
        topic: publicTopic(userId),
        OR: [{ userId: null }, { user: publicAuthor(userId) }],
      },
      select: { createdAt: true },
    });
    if (!reply) throw new CommunityError(404, 'unavailable');
    await db.communityFollow.updateMany({
      where: { userId, topicId, lastReadAt: { lt: reply.createdAt } },
      data: { lastReadAt: reply.createdAt },
    });
  }
  async function editCommunityTopic(
    userId: string,
    id: number,
    expectedUpdatedAt: string,
    change: { input: CommunityTopicInput } | { published: boolean }
  ) {
    const expected = new Date(expectedUpdatedAt);
    if (!Number.isFinite(expected.getTime()))
      throw new CommunityError(400, 'invalid');
    return withLease(
      `CommunityTopic:${id}`,
      async (tx) => {
        await actor(tx, userId);
        const row = await tx.communityTopic.findFirst({
          where: { id, userId },
          include: { _count: { select: { replies: true } } },
        });
        if (!row) throw new CommunityError(404, 'unavailable');
        if (row.updatedAt.getTime() !== expected.getTime())
          throw new CommunityError(409, 'conflict');
        const wantsPublic =
          'published' in change
            ? change.published
            : row.visibility === 'PUBLIC';
        if (
          wantsPublic &&
          (row.moderationHidden ||
            (await tx.communitySettings.findUnique({ where: { id: 1 } }))
              ?.conversationsEnabled === false)
        )
          throw new CommunityError(403, 'paused');
        const input = 'input' in change ? change.input : row;
        if (
          row._count.replies &&
          (input.seriesId !== row.seriesId ||
            input.episodeId !== row.episodeId ||
            input.kind !== row.kind)
        )
          throw new CommunityError(409, 'conflict');
        if (
          input.seriesId &&
          !(await tx.series.findFirst({
            where: { id: input.seriesId, ...publicSeries },
            select: { id: true },
          }))
        ) {
          // Withdrawing is always allowed, even if the linked work has been hidden.
          if ('input' in change || wantsPublic)
            throw new CommunityError(404, 'unavailable');
        }
        if (
          'input' in change &&
          input.episodeId &&
          !(await tx.episode.findFirst({
            where: {
              id: input.episodeId,
              season: { seriesId: input.seriesId! },
            },
            select: { id: true },
          }))
        )
          throw new CommunityError(400, 'invalid');
        const data =
          'input' in change
            ? {
                title: input.title,
                body: input.body,
                kind: input.kind,
                seriesId: input.seriesId,
                episodeId: input.episodeId,
                hasSpoilers: input.hasSpoilers || input.episodeId !== null,
              }
            : {
                visibility: change.published
                  ? ('PUBLIC' as const)
                  : ('PRIVATE' as const),
              };
        return tx.communityTopic.update({
          where: { id },
          data,
          select: { id: true },
        });
      },
      { db: db }
    );
  }
  async function getCommunityReplyRecipients(
    topicId: number,
    replyId: number,
    authorId: string
  ) {
    const reply = await db.communityReply.findFirst({
      where: {
        id: replyId,
        topicId,
        userId: authorId,
        user: publicAuthor(),
        moderationHidden: false,
        topic: publicTopic(authorId),
      },
      select: { topic: { select: { userId: true } } },
    });
    if (!reply) return [];
    const rows = await db.communityFollow.findMany({
      where: {
        topicId,
        notify: true,
        muted: false,
        userId: { not: authorId },
        user: {
          AND: [
            publicAuthor(authorId),
            ...(reply.topic.userId ? [publicAuthor(reply.topic.userId)] : []),
          ],
        },
      },
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }
  async function saveCommunityRecommendation(userId: string, seriesId: number) {
    return inSequence(async (tx) => {
      await actor(tx, userId);
      if (
        !(await tx.series.findFirst({
          where: { id: seriesId, ...publicSeries },
          select: { id: true },
        }))
      )
        throw new CommunityError(404, 'unavailable');
      // Shared unique constraint makes retries safe; never replace an existing progress state.
      const existing = await tx.viewStatus.findFirst({
        where: { userId, seriesId },
        select: { id: true },
      });
      if (existing) return { added: false };
      const created = await createManySkippingDuplicates(
        [{ userId, seriesId, status: 'SIN_VER' as const }],
        (rows) => tx.viewStatus.createMany({ data: rows })
      );
      return { added: created.count > 0 };
    }, db);
  }
  return {
    setCommunityFollow,
    markCommunityRead,
    editCommunityTopic,
    getCommunityReplyRecipients,
    saveCommunityRecommendation,
  };
}
