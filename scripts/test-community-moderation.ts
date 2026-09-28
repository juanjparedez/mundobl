import assert from 'node:assert/strict';
import {
  prisma,
  createRecommendationList,
  publishRecommendationList,
  getRecommendationList,
  reportCommunityContent,
  getCommunityModerationQueue,
  moderateCommunityReport,
  saveCommunitySettings,
  createCommunityTopic,
  replyToCommunityTopic,
  getCommunityTopic,
  getCommunityTopics,
  setCommunityBlock,
  saveCommunityProfile,
  getPublicCommunityProfile,
} from '../src/lib/database';
import {
  CommunityError,
  parseCommunityTopic,
} from '../src/lib/community-input';
import { assertLocalTestDatabase } from './assert-local-test-database';

async function main() {
  assertLocalTestDatabase();
  const key = `community-moderation-${Date.now()}`;
  const owner = `${key}-owner`,
    reporter = `${key}-reporter`,
    admin = `${key}-admin`;
  const users = [owner, reporter, admin];
  let seriesId: number | undefined;
  const oldSettings = await prisma.communitySettings.findUnique({
    where: { id: 1 },
  });
  const rejected = (status: number) => (error: unknown) =>
    error instanceof CommunityError && error.status === status;
  try {
    await prisma.user.createMany({
      data: users.map((id) => ({
        id,
        email: `${id}@example.invalid`,
        role: id === admin ? 'ADMIN' : 'VISITOR',
      })),
    });
    const series = await prisma.series.create({
      data: { title: key, type: 'serie' },
    });
    seriesId = series.id;
    const { id: listId } = await createRecommendationList(owner, {
      title: key,
      description: 'Texto público',
      items: [{ seriesId, note: 'Nota denunciada', hasSpoilers: false }],
    });
    await assert.rejects(
      reportCommunityContent(
        reporter,
        'LIST',
        listId,
        'OTHER',
        'No puede leer el borrador'
      ),
      rejected(404)
    );
    await publishRecommendationList(owner, listId, 1, true);
    await assert.rejects(
      reportCommunityContent(owner, 'LIST', listId, 'OTHER', ''),
      rejected(404)
    );
    const report = await reportCommunityContent(
      reporter,
      'LIST',
      listId,
      'SPAM',
      'Explicación privada del denunciante'
    );
    const repeated = await reportCommunityContent(
      reporter,
      'LIST',
      listId,
      'SPAM',
      'Otra explicación'
    );
    assert.equal(report.id, repeated.id, 'Repeated report is idempotent');
    await assert.rejects(getCommunityModerationQueue(owner), rejected(403));
    await assert.rejects(
      moderateCommunityReport(owner, report.id, 'HIDE', 'No soy del equipo'),
      rejected(403)
    );
    let queue = await getCommunityModerationQueue(admin);
    assert.ok(
      queue.items
        .find((row) => row.id === report.id)
        ?.content?.body.includes('Nota denunciada')
    );
    assert.ok(
      !JSON.stringify(await getRecommendationList(listId)).includes(
        'Explicación privada'
      )
    );
    await moderateCommunityReport(
      admin,
      report.id,
      'HIDE',
      'Oculto por contenido no permitido'
    );
    assert.equal(await getRecommendationList(listId), null);
    assert.ok(await getRecommendationList(listId, owner));
    await moderateCommunityReport(
      admin,
      report.id,
      'RESTORE',
      'Revisión posterior: contenido permitido'
    );
    assert.ok(await getRecommendationList(listId));
    assert.equal(
      await prisma.communityModerationAction.count({
        where: { reportId: report.id },
      }),
      2
    );
    await publishRecommendationList(owner, listId, 2, false);
    queue = await getCommunityModerationQueue(admin, 1, true);
    assert.equal(
      queue.items.find((row) => row.id === report.id)?.content,
      null,
      'Reports never retain private content snapshots'
    );
    await assert.rejects(
      moderateCommunityReport(
        admin,
        report.id,
        'HIDE',
        'Retirado por su autor'
      ),
      rejected(404)
    );
    await moderateCommunityReport(
      admin,
      report.id,
      'RESOLVE',
      'Resuelto porque su autor retiró el contenido'
    );
    const topic = await createCommunityTopic(
      owner,
      parseCommunityTopic({
        kind: 'DISCUSSION',
        title: `${key} conversación`,
        body: 'Conversación publicada para probar moderación',
        seriesId,
        visibility: 'PUBLIC',
      })
    );
    const reply = await replyToCommunityTopic(
      topic.id,
      reporter,
      'Respuesta que requiere revisión',
      false
    );
    const replyReport = await reportCommunityContent(
      owner,
      'REPLY',
      String(reply.id),
      'HARASSMENT',
      'Motivo'
    );
    await moderateCommunityReport(
      admin,
      replyReport.id,
      'HIDE',
      'Respuesta oculta durante revisión'
    );
    const detail = await getCommunityTopic(topic.id);
    assert.equal(detail?.replies.length, 0);
    assert.equal(detail?.replyCount, 0, 'Counts do not expose hidden replies');
    assert.ok(
      (await getCommunityTopics(1, key, 'unanswered')).items.some(
        (row) => row.id === topic.id
      )
    );
    await setCommunityBlock(reporter, owner, true);
    assert.equal(await getCommunityTopic(topic.id, 1, reporter), null);
    assert.equal(
      (await getCommunityTopics(1, key, 'all', reporter)).items.length,
      0
    );
    await assert.rejects(
      replyToCommunityTopic(topic.id, reporter, 'Bloqueado', false),
      rejected(404)
    );
    await setCommunityBlock(reporter, owner, false);
    const profile = await saveCommunityProfile(owner, {
      displayName: 'Perfil elegido',
      bio: 'Presentación pública',
      published: true,
      showAvatar: false,
    });
    const profileReport = await reportCommunityContent(
      reporter,
      'PROFILE',
      profile.publicId,
      'OTHER',
      'Revisar presentación'
    );
    await moderateCommunityReport(
      admin,
      profileReport.id,
      'HIDE',
      'Presentación requiere cambios'
    );
    assert.equal(await getPublicCommunityProfile(profile.publicId), null);
    await assert.rejects(
      saveCommunityProfile(owner, {
        displayName: 'Otro nombre',
        bio: '',
        published: true,
        showAvatar: false,
      }),
      rejected(403)
    );
    await saveCommunityProfile(owner, {
      displayName: 'Otro nombre',
      bio: '',
      published: false,
      showAvatar: false,
    });
    queue = await getCommunityModerationQueue(admin, 1, true);
    assert.equal(
      queue.items.find((row) => row.id === profileReport.id)?.content,
      null
    );
    await moderateCommunityReport(
      admin,
      profileReport.id,
      'RESTORE',
      'Restricción retirada sin leer ni publicar el borrador'
    );
    assert.equal(await getPublicCommunityProfile(profile.publicId), null);
    await saveCommunityProfile(owner, {
      displayName: 'Nombre revisado',
      bio: '',
      published: true,
      showAvatar: false,
    });
    assert.ok(await getPublicCommunityProfile(profile.publicId));
    await assert.rejects(
      saveCommunitySettings(owner, {
        conversationsEnabled: false,
        listsEnabled: false,
        profilesEnabled: false,
        promptEnabled: false,
      }),
      rejected(403)
    );
    await saveCommunitySettings(admin, {
      conversationsEnabled: false,
      listsEnabled: false,
      profilesEnabled: false,
      promptEnabled: false,
    });
    await assert.rejects(
      createCommunityTopic(
        owner,
        parseCommunityTopic({
          kind: 'RECOMMENDATION',
          title: 'Una pregunta nueva',
          body: 'Debería esperar a que vuelva a habilitarse.',
        })
      ),
      rejected(403)
    );
    await assert.rejects(
      createRecommendationList(owner, {
        title: 'Otra lista',
        description: '',
        items: [],
      }),
      rejected(403)
    );
    assert.ok(
      await getCommunityTopic(topic.id),
      'Pausing creation does not erase existing publications'
    );
    console.log(
      'PASS: reports, idempotency, staff authorization, hide/restore audit, withdrawn content privacy, reply counts, reciprocal topic blocks and admin-only feature configuration.'
    );
  } finally {
    if (oldSettings)
      await prisma.communitySettings.upsert({
        where: { id: 1 },
        create: oldSettings,
        update: oldSettings,
      });
    else await prisma.communitySettings.deleteMany({ where: { id: 1 } });
    await prisma.communityReport.deleteMany({
      where: { reporterId: { in: users } },
    });
    await prisma.communityTopic.deleteMany({
      where: { userId: { in: users } },
    });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    if (seriesId) await prisma.series.delete({ where: { id: seriesId } });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
