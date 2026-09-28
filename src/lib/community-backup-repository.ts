import type { Prisma, PrismaClient } from '@/generated/prisma';
import { CommunityError, parseCommunityTopic } from './community-input';
import {
  parseRecommendationList,
  parseCommunityProfile,
} from './community-library-input';

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
const listKey = (value: ReturnType<typeof parseRecommendationList>) =>
  JSON.stringify([
    value.title,
    value.description,
    value.items.map((item) => [item.seriesId, item.note, item.hasSpoilers]),
  ]);
const topicKey = (value: ReturnType<typeof parseCommunityTopic>) =>
  JSON.stringify([
    value.kind,
    value.title,
    value.body,
    value.hasSpoilers,
    value.seriesId,
    value.episodeId,
  ]);

/** Restore content only. Visibility, identities, moderation and notification permissions never come from a backup. */
export function createCommunityBackupRepository(
  db: PrismaClient,
  publicSeries: Prisma.SeriesWhereInput
) {
  async function restoreCommunityBackup(
    userId: string,
    payload: Record<string, unknown>,
    dryRun: boolean
  ) {
    const imported: Record<string, number> = {},
      skipped: Record<string, number> = {};
    const missingRefs: { section: string; reason: string; ref: unknown }[] = [];
    const errors: string[] = [];
    const summary = { imported, skipped, missingRefs, errors };
    if (!object(payload.community)) return summary;
    const source = payload.community;
    const rawLists = array(source.lists),
      rawTopics = array(source.topics);
    for (const section of [
      'communityLists',
      'communityTopics',
      'communityProfile',
      'communityReplies',
      'communityFollows',
      'communityBlocks',
      'communityReports',
    ]) {
      imported[section] = 0;
      skipped[section] = 0;
    }
    for (const name of ['replies', 'follows', 'blocks', 'reports'] as const) {
      skipped[`community${name[0].toUpperCase()}${name.slice(1)}`] = array(
        source[name]
      ).length;
    }
    return db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`community-library:${userId}`}))::text`;
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR SHARE`;
        if (
          !(await tx.user.findFirst({
            where: { id: userId, banned: false },
            select: { id: true },
          }))
        )
          throw new CommunityError(403, 'unavailable');
        const [
          existingLists,
          existingTopics,
          existingProfile,
          series,
          episodes,
        ] = await Promise.all([
          tx.recommendationList.findMany({
            where: { userId },
            include: { items: { orderBy: { position: 'asc' } } },
          }),
          tx.communityTopic.findMany({ where: { userId } }),
          tx.communityProfile.findUnique({ where: { userId } }),
          tx.series.findMany({ where: publicSeries, select: { id: true } }),
          tx.episode.findMany({
            where: { season: { series: publicSeries } },
            select: { id: true, season: { select: { seriesId: true } } },
          }),
        ]);
        const seriesIds = new Set(series.map((row) => row.id));
        const episodeSeries = new Map(
          episodes.map((row) => [row.id, row.season.seriesId])
        );
        const lists = new Set(existingLists.map(listKey));
        const topics = new Set(existingTopics.map(topicKey));
        let topFive = existingLists.some((list) => list.kind === 'TOP_FIVE');
        const listCapacity = Math.max(0, 100 - existingLists.length);
        const topicCapacity = Math.max(0, 500 - existingTopics.length);
        skipped.communityLists += Math.max(0, rawLists.length - 100);
        for (const raw of rawLists.slice(0, 100)) {
          try {
            if (!object(raw)) throw new CommunityError(400, 'invalid');
            const input = parseRecommendationList(raw);
            const kind = raw.kind === 'TOP_FIVE' ? 'TOP_FIVE' : 'STANDARD';
            if (kind === 'TOP_FIVE' && input.items.length > 5)
              throw new CommunityError(400, 'invalid');
            const missing = input.items.find(
              (item) => !seriesIds.has(item.seriesId)
            );
            if (missing) {
              missingRefs.push({
                section: 'communityLists',
                reason: 'unavailable-work',
                ref: missing.seriesId,
              });
              skipped.communityLists++;
              continue;
            }
            const key = listKey(input);
            if (
              lists.has(key) ||
              (kind === 'TOP_FIVE' && topFive) ||
              imported.communityLists >= listCapacity
            ) {
              skipped.communityLists++;
              continue;
            }
            if (!dryRun)
              await tx.recommendationList.create({
                data: {
                  userId,
                  title: input.title,
                  description: input.description,
                  kind,
                  visibility: 'PRIVATE',
                  items: {
                    createMany: {
                      data: input.items.map((item, position) => ({
                        ...item,
                        position,
                      })),
                    },
                  },
                },
              });
            imported.communityLists++;
            lists.add(key);
            if (kind === 'TOP_FIVE') topFive = true;
          } catch (error) {
            if (!(error instanceof CommunityError)) throw error;
            skipped.communityLists++;
          }
        }
        skipped.communityTopics += Math.max(0, rawTopics.length - 500);
        const topicsToCreate: Prisma.CommunityTopicCreateManyInput[] = [];
        for (const raw of rawTopics.slice(0, 500)) {
          try {
            if (!object(raw)) throw new CommunityError(400, 'invalid');
            const input = parseCommunityTopic({
              ...raw,
              visibility: 'PRIVATE',
            });
            if (
              (input.seriesId && !seriesIds.has(input.seriesId)) ||
              (input.episodeId &&
                episodeSeries.get(input.episodeId) !== input.seriesId)
            ) {
              missingRefs.push({
                section: 'communityTopics',
                reason: 'unavailable-target',
                ref: input.episodeId ?? input.seriesId,
              });
              skipped.communityTopics++;
              continue;
            }
            const key = topicKey(input);
            if (topics.has(key) || imported.communityTopics >= topicCapacity) {
              skipped.communityTopics++;
              continue;
            }
            topicsToCreate.push({ ...input, userId, visibility: 'PRIVATE' });
            topics.add(key);
            imported.communityTopics++;
          } catch (error) {
            if (!(error instanceof CommunityError)) throw error;
            skipped.communityTopics++;
          }
        }
        if (!dryRun && topicsToCreate.length)
          await tx.communityTopic.createMany({ data: topicsToCreate });
        if (object(source.profile)) {
          try {
            const profile = parseCommunityProfile({
              ...source.profile,
              published: false,
              showAvatar: false,
            });
            if (existingProfile) skipped.communityProfile++;
            else {
              if (!dryRun)
                await tx.communityProfile.create({
                  data: {
                    userId,
                    ...profile,
                    promptChoice: topFive ? 'STARTED' : 'DISMISSED',
                  },
                });
              imported.communityProfile++;
            }
          } catch (error) {
            if (!(error instanceof CommunityError)) throw error;
            skipped.communityProfile++;
          }
        }
        if (!dryRun && topFive)
          await tx.communityProfile.upsert({
            where: { userId },
            create: { userId, promptChoice: 'STARTED' },
            update: { promptChoice: 'STARTED' },
          });
        return summary;
      },
      { timeout: 30000 }
    );
  }
  return { restoreCommunityBackup };
}
