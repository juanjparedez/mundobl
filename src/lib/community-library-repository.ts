import type {
  Prisma,
  PrismaClient,
  RecommendationListKind,
} from '@/generated/prisma';
import { CommunityError, communityExcerpt } from './community-input';
import type {
  CommunityProfileInput,
  RecommendationListInput,
} from './community-library-input';
import { formatPublicName } from './user-display';
import { cardImageUrl } from './image-helpers';

/** Injected through database.ts to keep a single Prisma pool and public-work policy. */
export function createCommunityLibraryRepository(
  db: PrismaClient,
  publicSeries: Prisma.SeriesWhereInput
) {
  const publicAuthor = (viewerId?: string): Prisma.UserWhereInput => ({
    banned: false,
    ...(viewerId
      ? {
          communityBlocks: { none: { targetId: viewerId } },
          communityBlockedBy: { none: { userId: viewerId } },
        }
      : {}),
  });
  const authorSelect = {
    id: true,
    name: true,
    nickname: true,
    image: true,
    communityProfile: {
      select: {
        publicId: true,
        displayName: true,
        published: true,
        moderationHidden: true,
        showAvatar: true,
      },
    },
  } satisfies Prisma.UserSelect;
  const seriesSelect = {
    id: true,
    title: true,
    origin: true,
    catalogScope: true,
    imageUrl: true,
    imageThumbUrl: true,
  } satisfies Prisma.SeriesSelect;
  const listInclude = {
    user: { select: authorSelect },
    items: {
      where: { series: publicSeries },
      orderBy: { position: 'asc' as const },
      include: { series: { select: seriesSelect } },
    },
  } satisfies Prisma.RecommendationListInclude;
  type ListRow = Prisma.RecommendationListGetPayload<{
    include: typeof listInclude;
  }>;
  function authorDTO(user: ListRow['user']) {
    const profile = user.communityProfile;
    const publicProfile = profile?.published && !profile.moderationHidden;
    return {
      id: user.id,
      name: publicProfile ? profile.displayName : formatPublicName(user),
      image: publicProfile && profile.showAvatar ? user.image : null,
      profileId: publicProfile ? profile.publicId : null,
    };
  }
  function listDTO(row: ListRow, own: boolean) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      kind: row.kind,
      visibility: row.visibility,
      moderationHidden: row.moderationHidden,
      revision: own ? row.revision : null,
      own,
      author: authorDTO(row.user),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      publishedAt: row.publishedAt?.toISOString() ?? null,
      items: row.items.map((item) => ({
        seriesId: item.seriesId,
        position: item.position,
        note: item.note,
        hasSpoilers: item.hasSpoilers,
        series: { ...item.series, imageUrl: cardImageUrl(item.series) },
      })),
    };
  }
  const publicListWhere = (
    viewerId?: string
  ): Prisma.RecommendationListWhereInput => ({
    visibility: 'PUBLIC',
    moderationHidden: false,
    user: publicAuthor(viewerId),
  });
  async function actor(tx: Prisma.TransactionClient, userId: string) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { banned: true },
    });
    if (!user || user.banned) throw new CommunityError(403, 'unavailable');
  }
  async function lock(tx: Prisma.TransactionClient, userId: string) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`community-library:${userId}`}))::text`;
    await actor(tx, userId);
  }
  async function settings(tx: Prisma.TransactionClient = db) {
    return (
      (await tx.communitySettings.findUnique({ where: { id: 1 } })) ?? {
        id: 1,
        conversationsEnabled: true,
        listsEnabled: true,
        profilesEnabled: true,
        promptEnabled: true,
      }
    );
  }
  async function validateItems(
    tx: Prisma.TransactionClient,
    input: RecommendationListInput,
    kind: RecommendationListKind
  ) {
    if (input.items.length > (kind === 'TOP_FIVE' ? 5 : 100))
      throw new CommunityError(400, 'limit');
    const ids = input.items.map((item) => item.seriesId);
    if (
      ids.length !==
      (await tx.series.count({
        where: { AND: [publicSeries, { id: { in: ids } }] },
      }))
    )
      throw new CommunityError(400, 'unavailable');
  }
  function itemRows(input: RecommendationListInput) {
    return input.items.map((item, position) => ({ ...item, position }));
  }
  async function getRecommendationList(id: string, viewerId?: string) {
    const row = await db.recommendationList.findFirst({
      where: {
        id,
        OR: [
          publicListWhere(viewerId),
          ...(viewerId ? [{ userId: viewerId }] : []),
        ],
      },
      include: listInclude,
    });
    return row ? listDTO(row, row.userId === viewerId) : null;
  }
  async function getRecommendationLists(
    options: {
      viewerId?: string;
      mine?: boolean;
      page?: number;
      search?: string;
      authorId?: string;
    } = {}
  ) {
    const { viewerId, mine = false, page = 1, search = '', authorId } = options;
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 10000 ||
      search.length > 100
    )
      throw new CommunityError(400, 'invalid');
    if (mine && !viewerId) throw new CommunityError(401, 'unavailable');
    const rows = await db.recommendationList.findMany({
      where: {
        AND: [
          mine ? { userId: viewerId } : publicListWhere(viewerId),
          authorId ? { userId: authorId } : {},
          search ? { title: { contains: search, mode: 'insensitive' } } : {},
        ],
      },
      include: listInclude,
      orderBy: [
        ...(authorId ? [{ kind: 'desc' as const }] : []),
        { updatedAt: 'desc' },
        { id: 'desc' },
      ],
      take: 21,
      skip: (page - 1) * 20,
    });
    return {
      items: rows.slice(0, 20).map((row) => ({
        ...listDTO(row, row.userId === viewerId),
        // Discovery never exposes spoiler notes. Detail has an explicit reveal gate.
        items: listDTO(row, row.userId === viewerId)
          .items.slice(0, 5)
          .map((item) => ({
            ...item,
            note: item.hasSpoilers ? '' : communityExcerpt(item.note),
          })),
        itemCount: row.items.length,
      })),
      hasNext: rows.length > 20,
    };
  }
  async function createRecommendationList(
    userId: string,
    input: RecommendationListInput,
    kind: RecommendationListKind = 'STANDARD'
  ) {
    return db.$transaction(async (tx) => {
      await lock(tx, userId);
      if (!(await settings(tx)).listsEnabled)
        throw new CommunityError(403, 'paused');
      if (kind === 'TOP_FIVE') {
        const existing = await tx.recommendationList.findFirst({
          where: { userId, kind },
          select: { id: true },
        });
        if (existing) return existing;
      }
      if ((await tx.recommendationList.count({ where: { userId } })) >= 100)
        throw new CommunityError(429, 'limit');
      await validateItems(tx, input, kind);
      const result = await tx.recommendationList.create({
        data: {
          userId,
          title: input.title,
          description: input.description,
          kind,
          items: { create: itemRows(input) },
        },
        select: { id: true },
      });
      if (kind === 'TOP_FIVE')
        await tx.communityProfile.upsert({
          where: { userId },
          create: { userId, promptChoice: 'STARTED' },
          update: { promptChoice: 'STARTED', promptAfter: null },
        });
      return result;
    });
  }
  async function updateRecommendationList(
    userId: string,
    id: string,
    revision: number,
    input: RecommendationListInput
  ) {
    return db.$transaction(async (tx) => {
      await lock(tx, userId);
      const row = await tx.recommendationList.findFirst({
        where: { id, userId },
      });
      if (!row) throw new CommunityError(404, 'unavailable');
      if (row.revision !== revision) throw new CommunityError(409, 'conflict');
      await validateItems(tx, input, row.kind);
      if (row.visibility === 'PUBLIC' && !input.items.length)
        throw new CommunityError(400, 'empty');
      // An explicit save updates a public list; visibility never changes implicitly.
      await tx.recommendationListItem.deleteMany({ where: { listId: id } });
      return tx.recommendationList.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          revision: { increment: 1 },
          items: { create: itemRows(input) },
        },
        select: { id: true, revision: true },
      });
    });
  }
  async function publishRecommendationList(
    userId: string,
    id: string,
    revision: number,
    published: boolean
  ) {
    return db.$transaction(async (tx) => {
      await lock(tx, userId);
      const row = await tx.recommendationList.findFirst({
        where: { id, userId },
      });
      if (!row) throw new CommunityError(404, 'unavailable');
      if (row.revision !== revision) throw new CommunityError(409, 'conflict');
      if (published) {
        if (!(await settings(tx)).listsEnabled || row.moderationHidden)
          throw new CommunityError(403, 'paused');
        if (
          !(await tx.recommendationListItem.count({
            where: { listId: id, series: publicSeries },
          }))
        )
          throw new CommunityError(400, 'empty');
      }
      return tx.recommendationList.update({
        where: { id },
        data: {
          visibility: published ? 'PUBLIC' : 'PRIVATE',
          publishedAt: published ? (row.publishedAt ?? new Date()) : null,
          revision: { increment: 1 },
        },
        select: { id: true, revision: true },
      });
    });
  }
  async function deleteRecommendationList(userId: string, id: string) {
    const result = await db.recommendationList.deleteMany({
      where: { id, userId },
    });
    if (!result.count) throw new CommunityError(404, 'unavailable');
  }
  async function getCommunityProfileSettings(userId: string) {
    const [profile, config] = await Promise.all([
      db.communityProfile.findUnique({ where: { userId } }),
      settings(),
    ]);
    const choice = profile?.promptChoice ?? 'NEW';
    return {
      publicId: profile?.publicId ?? null,
      published: profile?.published ?? false,
      displayName: profile?.displayName ?? '',
      bio: profile?.bio ?? '',
      showAvatar: profile?.showAvatar ?? false,
      moderationHidden: profile?.moderationHidden ?? false,
      promptChoice: choice,
      promptEligible:
        config.promptEnabled &&
        config.listsEnabled &&
        (choice === 'NEW' ||
          (choice === 'LATER' &&
            !!profile?.promptAfter &&
            profile.promptAfter <= new Date())),
    };
  }
  async function saveCommunityProfile(
    userId: string,
    input: CommunityProfileInput
  ) {
    return db.$transaction(async (tx) => {
      await lock(tx, userId);
      const existing = await tx.communityProfile.findUnique({
        where: { userId },
      });
      if (
        input.published &&
        (!(await settings(tx)).profilesEnabled || existing?.moderationHidden)
      )
        throw new CommunityError(403, 'paused');
      return tx.communityProfile.upsert({
        where: { userId },
        create: { userId, ...input },
        update: input,
        select: { publicId: true, published: true },
      });
    });
  }
  async function setCommunityPrompt(
    userId: string,
    choice: 'LATER' | 'DISMISSED'
  ) {
    const data = {
      promptChoice: choice,
      promptAfter:
        choice === 'LATER' ? new Date(Date.now() + 30 * 86400000) : null,
    };
    await db.communityProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
  async function getPublicCommunityProfile(
    publicId: string,
    viewerId?: string,
    page = 1
  ) {
    const profile = await db.communityProfile.findFirst({
      where: {
        publicId,
        published: true,
        moderationHidden: false,
        user: publicAuthor(viewerId),
      },
      select: {
        publicId: true,
        userId: true,
        displayName: true,
        bio: true,
        showAvatar: true,
        user: { select: { image: true } },
      },
    });
    if (!profile) return null;
    return {
      publicId: profile.publicId,
      authorId: profile.userId,
      name: profile.displayName,
      bio: profile.bio,
      image: profile.showAvatar ? profile.user.image : null,
      lists: await getRecommendationLists({
        viewerId,
        authorId: profile.userId,
        page,
      }),
    };
  }
  async function setCommunityBlock(
    userId: string,
    targetId: string,
    blocked: boolean
  ) {
    if (targetId === userId) throw new CommunityError(400, 'invalid');
    await db.$transaction(async (tx) => {
      await lock(tx, userId);
      if (!blocked) {
        await tx.communityBlock.deleteMany({ where: { userId, targetId } });
        return;
      }
      const target = await tx.user.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!target) throw new CommunityError(404, 'unavailable');
      if ((await tx.communityBlock.count({ where: { userId } })) >= 1000)
        throw new CommunityError(429, 'limit');
      await tx.communityBlock.upsert({
        where: { userId_targetId: { userId, targetId } },
        create: { userId, targetId },
        update: {},
      });
      await tx.communityFollow.deleteMany({
        where: {
          OR: [
            { userId, topic: { userId: targetId } },
            { userId: targetId, topic: { userId } },
          ],
        },
      });
    });
  }
  async function getCommunityBlocks(userId: string) {
    const rows = await db.communityBlock.findMany({
      where: { userId },
      select: { target: { select: authorSelect } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    return rows.map((row) => authorDTO(row.target));
  }
  async function getCommunityAccountExport(userId: string) {
    const [profile, lists, topics, replies, follows, blocks, reports] =
      await Promise.all([
        db.communityProfile.findUnique({ where: { userId } }),
        db.recommendationList.findMany({
          where: { userId },
          include: { items: { orderBy: { position: 'asc' } } },
        }),
        db.communityTopic.findMany({ where: { userId } }),
        db.communityReply.findMany({ where: { userId } }),
        db.communityFollow.findMany({ where: { userId } }),
        db.communityBlock.findMany({ where: { userId } }),
        db.communityReport.findMany({
          where: { reporterId: userId },
          select: {
            id: true,
            targetType: true,
            targetId: true,
            reason: true,
            detail: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);
    return { profile, lists, topics, replies, follows, blocks, reports };
  }
  async function deleteAccountWithCommunity(
    userId: string,
    deletePublicContributions: boolean
  ) {
    await db.$transaction(async (tx) => {
      // Prevent a new private contribution racing between cleanup and user deletion.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      await tx.communityTopic.deleteMany({
        where: {
          userId,
          ...(deletePublicContributions ? {} : { visibility: 'PRIVATE' }),
        },
      });
      if (deletePublicContributions)
        await tx.communityReply.deleteMany({ where: { userId } });
      // Lists/profiles/follows/blocks cascade; public conversation authors become anonymous.
      await tx.user.delete({ where: { id: userId } });
    });
  }
  return {
    getCommunityAccountExport,
    deleteAccountWithCommunity,
    getRecommendationList,
    getRecommendationLists,
    createRecommendationList,
    updateRecommendationList,
    publishRecommendationList,
    deleteRecommendationList,
    getCommunityProfileSettings,
    saveCommunityProfile,
    setCommunityPrompt,
    getPublicCommunityProfile,
    setCommunityBlock,
    getCommunityBlocks,
    communityPublicAuthorWhere: publicAuthor,
    getCommunitySettings: settings,
  };
}
