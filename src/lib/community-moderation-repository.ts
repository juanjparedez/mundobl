import type {
  Prisma,
  PrismaClient,
  CommunityReportTarget,
  CommunityReportReason,
  CommunityModerationKind,
} from '@/generated/prisma';
import { CommunityError, communityId, communityText } from './community-input';

/** Moderation can inspect reported public content, never an author's private drafts. */
export function createCommunityModerationRepository(
  db: PrismaClient,
  publicSeries: Prisma.SeriesWhereInput,
  publicAuthor: (viewerId?: string) => Prisma.UserWhereInput
) {
  async function staff(tx: Prisma.TransactionClient, userId: string) {
    const user = await tx.user.findFirst({
      where: {
        id: userId,
        banned: false,
        role: { in: ['ADMIN', 'MODERATOR'] },
      },
      select: { id: true },
    });
    if (!user) throw new CommunityError(403, 'unavailable');
  }
  async function target(
    tx: Prisma.TransactionClient,
    type: CommunityReportTarget,
    id: string,
    viewerId?: string,
    moderation = false
  ) {
    const visible = moderation ? {} : { moderationHidden: false };
    const author = moderation ? {} : { user: publicAuthor(viewerId) };
    const topicWhere: Prisma.CommunityTopicWhereInput = {
      visibility: 'PUBLIC',
      ...visible,
      ...(moderation
        ? {}
        : {
            AND: [{ OR: [{ userId: null }, { user: publicAuthor(viewerId) }] }],
          }),
      OR: [{ seriesId: null }, { series: publicSeries }],
    };
    if (type === 'TOPIC') {
      const row = await tx.communityTopic.findFirst({
        where: { id: communityId(id), ...topicWhere },
        select: {
          userId: true,
          title: true,
          body: true,
          moderationHidden: true,
        },
      });
      return row
        ? {
            ownerId: row.userId,
            title: row.title,
            body: row.body,
            hidden: row.moderationHidden,
            href: `/comunidad/${id}`,
          }
        : null;
    }
    if (type === 'REPLY') {
      const row = await tx.communityReply.findFirst({
        where: {
          id: communityId(id),
          ...visible,
          ...(moderation
            ? {}
            : { OR: [{ userId: null }, { user: publicAuthor(viewerId) }] }),
          topic: topicWhere,
        },
        select: {
          userId: true,
          body: true,
          moderationHidden: true,
          topicId: true,
        },
      });
      return row
        ? {
            ownerId: row.userId,
            title: '',
            body: row.body,
            hidden: row.moderationHidden,
            href: `/comunidad/${row.topicId}`,
          }
        : null;
    }
    if (type === 'LIST') {
      const row = await tx.recommendationList.findFirst({
        where: { id, visibility: 'PUBLIC', ...visible, ...author },
        select: {
          userId: true,
          title: true,
          description: true,
          moderationHidden: true,
          items: {
            where: { series: publicSeries },
            orderBy: { position: 'asc' },
            select: { note: true, series: { select: { title: true } } },
          },
        },
      });
      return row
        ? {
            ownerId: row.userId,
            title: row.title,
            body: [
              row.description,
              ...row.items.map((item) => `${item.series.title}: ${item.note}`),
            ].join('\n'),
            hidden: row.moderationHidden,
            href: `/comunidad/listas/${id}`,
          }
        : null;
    }
    const row = await tx.communityProfile.findFirst({
      where: { publicId: id, published: true, ...visible, ...author },
      select: {
        userId: true,
        displayName: true,
        bio: true,
        moderationHidden: true,
      },
    });
    return row
      ? {
          ownerId: row.userId,
          title: row.displayName,
          body: row.bio,
          hidden: row.moderationHidden,
          href: `/comunidad/perfiles/${id}`,
        }
      : null;
  }
  async function reportCommunityContent(
    userId: string,
    type: CommunityReportTarget,
    id: string,
    reason: CommunityReportReason,
    detail: string
  ) {
    const safeDetail = communityText(detail, 0, 2000);
    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`community-reports:${userId}`}))::text`;
      if (
        !(await tx.user.findFirst({
          where: { id: userId, banned: false },
          select: { id: true },
        }))
      )
        throw new CommunityError(403, 'unavailable');
      const content = await target(tx, type, id, userId);
      if (!content || content.ownerId === userId)
        throw new CommunityError(404, 'unavailable');
      const existing = await tx.communityReport.findUnique({
        where: {
          reporterId_targetType_targetId: {
            reporterId: userId,
            targetType: type,
            targetId: id,
          },
        },
        select: { id: true },
      });
      if (existing) return { id: existing.id, created: false };
      if (
        (await tx.communityReport.count({
          where: {
            reporterId: userId,
            createdAt: { gte: new Date(Date.now() - 3600000) },
          },
        })) >= 5
      )
        throw new CommunityError(429, 'rateLimit');
      const report = await tx.communityReport.create({
        data: {
          reporterId: userId,
          targetType: type,
          targetId: id,
          reason,
          detail: safeDetail,
        },
        select: { id: true },
      });
      return { id: report.id, created: true };
    });
  }
  async function getCommunityModerationQueue(
    userId: string,
    page = 1,
    resolved = false
  ) {
    await staff(db, userId);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000)
      throw new CommunityError(400, 'invalid');
    const rows = await db.communityReport.findMany({
      where: { status: resolved ? { not: 'OPEN' } : 'OPEN' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * 20,
      take: 21,
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        detail: true,
        status: true,
        createdAt: true,
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, action: true, reason: true, createdAt: true },
        },
      },
    });
    return {
      hasNext: rows.length > 20,
      items: await Promise.all(
        rows.slice(0, 20).map(async (row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
          actions: row.actions.map((action) => ({
            ...action,
            createdAt: action.createdAt.toISOString(),
          })),
          content: await target(
            db,
            row.targetType,
            row.targetId,
            undefined,
            true
          ),
        }))
      ),
    };
  }
  async function moderateCommunityReport(
    userId: string,
    reportId: string,
    action: CommunityModerationKind,
    reason: string
  ) {
    const safeReason = communityText(reason, 5, 1000);
    await db.$transaction(async (tx) => {
      await staff(tx, userId);
      await tx.$queryRaw`SELECT id FROM "CommunityReport" WHERE id = ${reportId} FOR UPDATE`;
      const report = await tx.communityReport.findUnique({
        where: { id: reportId },
      });
      if (!report) throw new CommunityError(404, 'unavailable');
      if (action === 'HIDE' || action === 'RESTORE') {
        // Removing a moderation restriction never reads or publishes a withdrawn draft.
        // This lets the author correct and republish after a successful appeal.
        if (
          action === 'HIDE' &&
          !(await target(
            tx,
            report.targetType,
            report.targetId,
            undefined,
            true
          ))
        )
          throw new CommunityError(404, 'unavailable');
        const data = { moderationHidden: action === 'HIDE' };
        const result =
          report.targetType === 'TOPIC'
            ? await tx.communityTopic.updateMany({
                where: {
                  id: communityId(report.targetId),
                  ...(action === 'HIDE'
                    ? { visibility: 'PUBLIC' as const }
                    : {}),
                },
                data,
              })
            : report.targetType === 'REPLY'
              ? await tx.communityReply.updateMany({
                  where: {
                    id: communityId(report.targetId),
                    ...(action === 'HIDE'
                      ? { topic: { visibility: 'PUBLIC' as const } }
                      : {}),
                  },
                  data,
                })
              : report.targetType === 'LIST'
                ? await tx.recommendationList.updateMany({
                    where: {
                      id: report.targetId,
                      ...(action === 'HIDE'
                        ? { visibility: 'PUBLIC' as const }
                        : {}),
                    },
                    data,
                  })
                : await tx.communityProfile.updateMany({
                    where: {
                      publicId: report.targetId,
                      ...(action === 'HIDE' ? { published: true } : {}),
                    },
                    data,
                  });
        if (!result.count) throw new CommunityError(409, 'conflict');
      }
      await tx.communityModerationAction.create({
        data: { reportId, moderatorId: userId, action, reason: safeReason },
      });
      await tx.communityReport.update({
        where: { id: reportId },
        data: { status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED' },
      });
    });
  }
  async function saveCommunitySettings(
    userId: string,
    input: {
      conversationsEnabled: boolean;
      listsEnabled: boolean;
      profilesEnabled: boolean;
      promptEnabled: boolean;
    }
  ) {
    const admin = await db.user.findFirst({
      where: { id: userId, role: 'ADMIN', banned: false },
      select: { id: true },
    });
    if (!admin) throw new CommunityError(403, 'unavailable');
    return db.communitySettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...input },
      update: input,
    });
  }
  return {
    reportCommunityContent,
    getCommunityModerationQueue,
    moderateCommunityReport,
    saveCommunitySettings,
  };
}
