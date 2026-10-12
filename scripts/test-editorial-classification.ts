import assert from 'node:assert/strict';
import { prisma, restoreTrackingBackup } from '../src/lib/database';
import {
  assertTrackingCanBeRemoved,
  TrackingPreservationError,
} from '../src/lib/tracking-preservation';
import { assertLocalTestDatabase } from './assert-local-test-database';
import { saveEditorialClassification } from '../src/lib/editorial-classification';
import { parseContentClassification } from '../src/lib/content-rating';
import {
  saveSeriesFromForm,
  SeriesEditConflictError,
} from '../src/lib/series-save';
import {
  signContentConsent,
  verifyContentConsent,
  CONTENT_COOKIE_AGE,
} from '../src/lib/content-consent';
import { isGagaUrl } from '../src/lib/pilot-clicks';
import { loadLocaleMessages } from '../src/i18n/messages';
import { SUPPORTED_LOCALES } from '../src/i18n/config';
import {
  renderWelcomeEmail,
  renderAnnouncementEmail,
} from '../src/lib/email-templates';

async function main() {
  assertLocalTestDatabase();
  const now = Date.now();
  const valid = signContentConsent(now + 10000, 'test-only');
  assert.ok(verifyContentConsent(valid, 'test-only', now));
  for (const token of [
    undefined,
    valid + '0',
    signContentConsent(now - 1, 'test-only'),
    signContentConsent(now + CONTENT_COOKIE_AGE * 1000 + 5000, 'test-only'),
  ]) {
    assert.equal(verifyContentConsent(token, 'test-only', now), false);
  }
  assert.equal(verifyContentConsent(valid, 'wrong', now), false);
  assert.equal(
    parseContentClassification({
      rating: 'BL',
      warnings: [],
      source: '',
      editVersion: 0,
    }),
    null
  );
  assert.equal(
    parseContentClassification({
      rating: 'GENERAL',
      warnings: ['GL'],
      source: '',
      editVersion: 0,
    }),
    null
  );
  for (const url of [
    'http://www.gagaoolala.com',
    'https://www.gagaoolala.com.evil.test',
    'https://gagaoolala.com@evil.test',
    'https://evil.test/gagaoolala.com',
  ])
    assert.equal(isGagaUrl(url), false);
  assert.ok(isGagaUrl('https://www.gagaoolala.com/en/videos/123'));
  for (const locale of SUPPORTED_LOCALES) {
    const labels = await loadLocaleMessages(locale);
    assert.notEqual(labels.editorial.GENERAL, labels.editorial.UNREVIEWED);
    const mail = renderWelcomeEmail({
      name: '<script>alert(1)</script>',
      labels: labels.welcomeEmail,
      locale,
    });
    assert.ok(mail.html.includes(`lang="${locale}"`));
    assert.ok(!mail.html.includes('<script>'));
    assert.ok(mail.text.includes(labels.welcomeEmail.consent));
    assert.ok(mail.html.includes('/watching'));
  }
  const bulk = renderAnnouncementEmail({
    title: 'Draft',
    body: 'Body',
    unsubscribeUrl: 'https://example.test/unsubscribe',
    siteUrl: 'https://example.test',
  });
  assert.ok(bulk.html.includes('https://example.test/unsubscribe'));
  assert.ok(bulk.text.includes('https://example.test/unsubscribe'));

  const prefix = `editorial-${now}`;
  const admin = prefix + '-admin',
    visitor = prefix + '-visitor',
    moderator = prefix + '-moderator';
  await prisma.user.createMany({
    data: [
      { id: admin, role: 'ADMIN' },
      { id: visitor, role: 'VISITOR' },
      { id: moderator, role: 'MODERATOR' },
    ].map((u) => ({ ...u, email: u.id + '@example.test' })),
  });
  const series = await prisma.series.create({
    data: {
      title: prefix,
      type: 'serie',
      seasons: {
        create: { seasonNumber: 1, episodes: { create: { episodeNumber: 1 } } },
      },
    },
    include: { seasons: { include: { episodes: true } } },
  });
  const episodeId = series.seasons[0].episodes[0].id;
  try {
    assert.equal(series.contentRating, 'UNREVIEWED');
    await restoreTrackingBackup(
      visitor,
      {
        viewStatuses: [
          {
            episodeId,
            status: 'VISTA',
            watchedDate: '2020-01-01T12:00:00.000Z',
          },
        ],
        seriesNotes: [{ seriesId: series.id, body: 'Private diary' }],
        episodeNotes: [{ episodeId, body: 'Private part note' }],
      },
      false
    );
    const snapshot = async () => ({
      statuses: await prisma.viewStatus.findMany({
        where: { userId: visitor },
      }),
      notes: await prisma.seriesNote.findMany({ where: { userId: visitor } }),
      episodeNotes: await prisma.episodeNote.findMany({
        where: { userId: visitor },
      }),
      history: await prisma.trackingEvent.findMany({
        where: { userId: visitor },
      }),
    });
    const before = await snapshot();
    const input = {
      rating: 'ADULT18',
      warnings: ['SEX'],
      source: 'Human review',
      editVersion: 0,
    };
    for (const user of [visitor, moderator])
      await assert.rejects(
        saveEditorialClassification(series.id, user, input),
        /FORBIDDEN/
      );
    await saveEditorialClassification(series.id, admin, input);
    await assert.rejects(
      saveEditorialClassification(series.id, admin, input),
      SeriesEditConflictError
    );
    const revision = await prisma.seriesRevision.findFirstOrThrow({
      where: { seriesId: series.id },
    });
    assert.equal(
      (revision.snapshot as { contentRating: string }).contentRating,
      'UNREVIEWED'
    );
    // The normal form/import curation path ignores injected editorial fields.
    const body = {
      title: prefix,
      type: 'serie',
      editVersion: 1,
      contentRating: 'GENERAL',
      contentWarnings: [],
      synopsis: 'Updated synopsis',
    };
    await saveSeriesFromForm(
      series.id,
      body,
      { url: null, thumbUrl: null },
      admin
    );
    const saved = await prisma.series.findUniqueOrThrow({
      where: { id: series.id },
    });
    assert.equal(saved.contentRating, 'ADULT18');
    assert.equal(saved.contentReviewedBy, admin);
    assert.deepEqual(saved.contentWarnings, ['SEX']);
    assert.deepEqual(await snapshot(), before);
    await assert.rejects(
      saveSeriesFromForm(
        series.id,
        { ...body, editVersion: saved.editVersion, seasons: [] },
        { url: null, thumbUrl: null },
        admin
      ),
      TrackingPreservationError
    );
    await assert.rejects(
      prisma.$transaction((tx) => assertTrackingCanBeRemoved(tx, series.id)),
      TrackingPreservationError
    );
    assert.deepEqual(await snapshot(), before);
    assert.equal(await prisma.episode.count({ where: { id: episodeId } }), 1);
    await prisma.user.update({ where: { id: admin }, data: { banned: true } });
    await assert.rejects(
      saveEditorialClassification(series.id, admin, {
        ...input,
        editVersion: saved.editVersion,
      }),
      /FORBIDDEN/
    );
    console.log(
      'PASS: classification authority, stale edits, snapshot, importer/form preservation, progress/notes/history unchanged; consent signatures, Gaga URLs, 10 welcome locales and opt-in wording. No emails sent.'
    );
  } finally {
    await prisma.series.delete({ where: { id: series.id } });
    await prisma.seriesRevision.deleteMany({ where: { seriesId: series.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [admin, visitor, moderator] } },
    });
  }
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
