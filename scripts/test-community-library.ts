import assert from 'node:assert/strict';
import {
  prisma,
  createRecommendationList,
  updateRecommendationList,
  publishRecommendationList,
  deleteRecommendationList,
  getRecommendationList,
  getRecommendationLists,
  getCommunityProfileSettings,
  saveCommunityProfile,
  setCommunityPrompt,
  getPublicCommunityProfile,
  setCommunityBlock,
  getCommunityBlocks,
  createCommunityTopic,
  getCommunityTopic,
  getCommunityTopics,
  getCommunityAccountExport,
  deleteAccountWithCommunity,
} from '../src/lib/database';
import {
  parseRecommendationList,
  parseCommunityProfile,
} from '../src/lib/community-library-input';
import {
  CommunityError,
  parseCommunityTopic,
} from '../src/lib/community-input';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const key = `community-library-${Date.now()}`;
  const owner = `${key}-owner`,
    other = `${key}-other`,
    admin = `${key}-admin`;
  const users = [owner, other, admin];
  const seriesIds: number[] = [];
  const rejected = (status: number) => (error: unknown) =>
    error instanceof CommunityError && error.status === status;
  try {
    await prisma.user.createMany({
      data: users.map((id) => ({
        id,
        email: `${id}@example.invalid`,
        name: 'Nombre Privado',
        nickname: 'Alias público',
        image: 'https://example.invalid/private-oauth-avatar',
        role: id === admin ? 'ADMIN' : 'VISITOR',
      })),
    });
    for (let i = 0; i < 6; i++) {
      const series = await prisma.series.create({
        data: { title: `${key}-${i}`, type: 'serie' },
      });
      seriesIds.push(series.id);
    }
    const input = parseRecommendationList({
      title: `${key} Mi lista`,
      description: 'Recomendaciones elegidas por mí',
      items: [
        { seriesId: seriesIds[0], note: 'Un motivo para verla' },
        {
          seriesId: seriesIds[1],
          note: 'Secreto que requiere revelar',
          hasSpoilers: true,
        },
      ],
    });
    assert.throws(
      () =>
        parseRecommendationList({
          ...input,
          items: [input.items[0], input.items[0]],
        }),
      rejected(400)
    );
    const { id } = await createRecommendationList(owner, input);
    assert.equal(
      (await getRecommendationList(id, owner))?.visibility,
      'PRIVATE'
    );
    assert.equal(await getRecommendationList(id), null);
    assert.equal(await getRecommendationList(id, other), null);
    assert.equal(
      await getRecommendationList(id, admin),
      null,
      'Staff cannot read private drafts'
    );
    assert.equal(
      (await getRecommendationLists({ mine: true, viewerId: owner })).items
        .length,
      1
    );
    assert.equal(
      (await getRecommendationLists({ search: key })).items.length,
      0
    );
    await assert.rejects(getRecommendationLists({ mine: true }), rejected(401));
    await assert.rejects(
      updateRecommendationList(other, id, 1, input),
      rejected(404)
    );
    await assert.rejects(
      publishRecommendationList(other, id, 1, true),
      rejected(404)
    );
    const published = await publishRecommendationList(owner, id, 1, true);
    assert.equal(published.revision, 2);
    const publicList = await getRecommendationList(id);
    assert.equal(publicList?.visibility, 'PUBLIC');
    assert.equal(publicList?.author.image, null);
    assert.equal(publicList?.author.profileId, null);
    assert.ok(!JSON.stringify(publicList).includes('@example.invalid'));
    assert.ok(!JSON.stringify(publicList).includes('Nombre Privado'));
    assert.equal(
      (await getRecommendationLists({ search: key })).items[0].items[1].note,
      ''
    );
    await assert.rejects(
      updateRecommendationList(owner, id, 1, input),
      rejected(409)
    );
    const reversed = { ...input, items: [...input.items].reverse() };
    const races = await Promise.allSettled([
      updateRecommendationList(owner, id, 2, reversed),
      updateRecommendationList(owner, id, 2, input),
    ]);
    assert.equal(races.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(
      races.filter((r) => r.status === 'rejected' && rejected(409)(r.reason))
        .length,
      1
    );
    const saved = await getRecommendationList(id, owner);
    assert.equal(saved?.revision, 3);
    assert.equal(
      saved?.visibility,
      'PUBLIC',
      'An edit preserves chosen visibility'
    );
    assert.equal(saved?.items.length, 2);
    assert.equal(saved?.items[0].position, 0);
    await publishRecommendationList(owner, id, 3, false);
    assert.equal(
      await getRecommendationList(id),
      null,
      'Unpublishing immediately revokes shared URL'
    );
    const empty = await createRecommendationList(owner, {
      ...input,
      items: [],
    });
    await assert.rejects(
      publishRecommendationList(owner, empty.id, 1, true),
      rejected(400)
    );
    const topFive = await Promise.all([
      createRecommendationList(owner, input, 'TOP_FIVE'),
      createRecommendationList(owner, input, 'TOP_FIVE'),
    ]);
    assert.equal(
      topFive[0].id,
      topFive[1].id,
      'Concurrent invitations create one Top 5'
    );
    assert.equal(
      (await getCommunityProfileSettings(owner)).promptEligible,
      false
    );
    assert.equal((await getCommunityProfileSettings(owner)).published, false);
    await assert.rejects(
      updateRecommendationList(owner, topFive[0].id, 1, {
        ...input,
        items: seriesIds.map((seriesId) => ({
          seriesId,
          note: '',
          hasSpoilers: false,
        })),
      }),
      rejected(400)
    );
    assert.equal(
      (await getCommunityProfileSettings(other)).promptEligible,
      true
    );
    await setCommunityPrompt(other, 'LATER');
    assert.equal(
      (await getCommunityProfileSettings(other)).promptEligible,
      false
    );
    await setCommunityPrompt(other, 'DISMISSED');
    assert.equal(
      (await getCommunityProfileSettings(other)).promptChoice,
      'DISMISSED'
    );
    assert.equal(
      (await getCommunityProfileSettings(other)).promptEligible,
      false
    );
    assert.throws(
      () =>
        parseCommunityProfile({
          displayName: '',
          bio: '',
          published: true,
          showAvatar: false,
        }),
      rejected(400)
    );
    const profileInput = parseCommunityProfile({
      displayName: 'Mi alias elegido',
      bio: 'Me gustan las historias',
      published: false,
      showAvatar: false,
    });
    const profile = await saveCommunityProfile(owner, profileInput);
    assert.equal(await getPublicCommunityProfile(profile.publicId), null);
    await saveCommunityProfile(owner, { ...profileInput, published: true });
    let publicProfile = await getPublicCommunityProfile(profile.publicId);
    assert.equal(publicProfile?.name, 'Mi alias elegido');
    assert.equal(publicProfile?.image, null);
    assert.equal(
      publicProfile?.lists.items.length,
      0,
      'Publishing profile cannot publish private lists'
    );
    assert.ok(!JSON.stringify(publicProfile).includes('promptChoice'));
    assert.ok(!JSON.stringify(publicProfile).includes('@example.invalid'));
    await publishRecommendationList(owner, id, 4, true);
    publicProfile = await getPublicCommunityProfile(profile.publicId);
    assert.equal(publicProfile?.lists.items.length, 1);
    await setCommunityBlock(other, owner, true);
    assert.equal(await getRecommendationList(id, other), null);
    assert.equal(
      await getPublicCommunityProfile(profile.publicId, other),
      null
    );
    const othersList = await createRecommendationList(other, input);
    await publishRecommendationList(other, othersList.id, 1, true);
    assert.equal(
      await getRecommendationList(othersList.id, owner),
      null,
      'Blocks are reciprocal'
    );
    assert.ok(
      await getRecommendationList(id),
      'Public content stays accessible anonymously'
    );
    assert.equal((await getCommunityBlocks(other))[0].id, owner);
    await assert.rejects(setCommunityBlock(owner, owner, true), rejected(400));
    await setCommunityBlock(other, owner, false);
    assert.ok(await getRecommendationList(id, other));
    await prisma.series.update({
      where: { id: seriesIds[0] },
      data: { visibility: 'HIDDEN' },
    });
    assert.equal((await getRecommendationList(id))?.items.length, 1);
    await assert.rejects(
      updateRecommendationList(owner, id, 5, input),
      rejected(400)
    );
    await prisma.recommendationList.update({
      where: { id },
      data: { moderationHidden: true },
    });
    assert.equal(await getRecommendationList(id), null);
    assert.ok(await getRecommendationList(id, owner));
    await assert.rejects(
      publishRecommendationList(owner, id, 5, true),
      rejected(403)
    );
    await saveCommunityProfile(owner, { ...profileInput, published: false });
    assert.equal(await getPublicCommunityProfile(profile.publicId), null);
    await prisma.user.update({ where: { id: other }, data: { banned: true } });
    assert.equal(await getRecommendationList(othersList.id), null);
    await assert.rejects(createRecommendationList(other, input), rejected(403));
    const topic = await createCommunityTopic(
      owner,
      parseCommunityTopic({
        kind: 'RECOMMENDATION',
        title: `${key} Conversación`,
        body: 'Todavía estoy preparando mi pregunta.',
      })
    );
    assert.equal(await getCommunityTopic(topic.id), null);
    assert.ok(await getCommunityTopic(topic.id, 1, owner));
    assert.equal(
      (await getCommunityTopics(1, key)).items.length,
      0,
      'Topic drafts cannot leak to discovery'
    );
    const rls = await prisma.$queryRaw<
      { relname: string; relrowsecurity: boolean }[]
    >`SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('CommunityProfile','RecommendationList','RecommendationListItem','CommunityFollow','CommunityBlock','CommunityReport','CommunityModerationAction','CommunitySettings')`;
    assert.equal(rls.length, 8);
    assert.ok(rls.every((row) => row.relrowsecurity));
    const exported = await getCommunityAccountExport(owner);
    assert.ok(exported.lists.some((list) => list.id === topFive[0].id));
    assert.ok(exported.topics.some((row) => row.id === topic.id));
    assert.ok(exported.replies.every((row) => row.userId === owner));
    assert.ok(!exported.lists.some((list) => list.userId === other));
    await deleteRecommendationList(owner, id);
    assert.equal(
      await prisma.recommendationListItem.count({ where: { listId: id } }),
      0
    );
    await deleteAccountWithCommunity(owner, false);
    assert.equal(
      await prisma.communityTopic.count({ where: { id: topic.id } }),
      0,
      'Account deletion removes drafts instead of orphaning private text'
    );
    assert.equal(
      await prisma.recommendationList.count({ where: { userId: owner } }),
      0
    );
    assert.equal(
      await prisma.communityProfile.count({ where: { userId: owner } }),
      0
    );
    console.log(
      'PASS: private defaults, explicit publication/revocation, no staff draft access, profile opt-in, avatar privacy, spoiler previews, ordering/conflicts, one Top 5, persistent prompt choices, reciprocal blocks, hidden works, banned users, RLS and cascades.'
    );
  } finally {
    await prisma.communityTopic.deleteMany({
      where: { userId: { in: users } },
    });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.series.deleteMany({ where: { id: { in: seriesIds } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
