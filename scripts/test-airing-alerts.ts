import assert from 'node:assert/strict';
import { prisma } from '../src/lib/database';
import {
  formatAirWeekdays,
  runAirDayAlerts,
  runWeeklyDigest,
} from '../src/lib/airing-alerts';
import { renderWeeklyDigestEmail } from '../src/lib/email-templates';
import type { SendEmailOptions } from '../src/lib/email';
import { MESSAGES } from '../src/i18n/messages';
import { assertLocalTestDatabase } from './assert-local-test-database';

const PREFIX = 'Airing alerts test';
const DAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

function templateCases() {
  const es = MESSAGES.es!;
  assert.equal(formatAirWeekdays([5, 6], es, 'es'), 'Viernes y Sábado');
  const rendered = renderWeeklyDigestEmail({
    labels: es.airingAlert,
    airing: [{ title: 'A <b>', url: 'https://x.test/a', detail: 'Viernes' }],
    watching: [],
    unsubscribeUrl: 'https://x.test/baja',
  });
  assert.ok(rendered.html.includes('A &lt;b&gt;'), 'titles are escaped');
  assert.ok(!rendered.html.includes(es.airingAlert.digestWatching));
  assert.ok(rendered.text.includes('https://x.test/baja'));
}

async function main() {
  assertLocalTestDatabase();
  templateCases();

  const now = new Date();
  const today = now.getUTCDay();
  const year = now.getUTCFullYear();
  const make = (title: string, airDays: string | null) =>
    prisma.series.create({
      data: {
        title: `${PREFIX} ${title}`,
        type: 'serie',
        origin: 'CURATED',
        catalogScope: 'PERSONAL',
        visibility: 'VISIBLE',
        airDays,
        year,
      },
    });

  const todaySeries = await make('Today', DAY_NAMES[today]);
  const otherDay = await make('Other day', DAY_NAMES[(today + 3) % 7]);
  const ended = await make('Ended', null);
  const stamp = Date.now();
  const [fan, staff, quiet] = await Promise.all(
    ['fan', 'staff', 'quiet'].map((name) =>
      prisma.user.create({
        data: {
          email: `airing-${name}-${stamp}@example.test`,
          role: name === 'staff' ? 'ADMIN' : 'VISITOR',
        },
      })
    )
  );

  try {
    for (const user of [fan, staff, quiet]) {
      await prisma.seriesSubscription.createMany({
        data: [todaySeries, otherDay].map((series) => ({
          userId: user.id,
          seriesId: series.id,
        })),
      });
    }
    await prisma.viewStatus.create({
      data: { userId: fan.id, seriesId: ended.id, status: 'VIENDO' },
    });
    await prisma.notificationPrefs.createMany({
      data: [
        { userId: fan.id, emailEnabled: true },
        { userId: staff.id, emailEnabled: true },
        // Silencio las novedades de sus series: no recibe el aviso.
        { userId: quiet.id, emailEnabled: false, notifySeasonAdded: false },
      ],
    });

    // --- Aviso del dia de estreno ---
    const airDay = await runAirDayAlerts(now);
    assert.ok(airDay.series >= 1);
    const alerts = () =>
      prisma.notification.findMany({
        where: { userId: fan.id, type: 'air_day' },
        select: { id: true, title: true, refId: true, linkPath: true },
      });
    let fanAlerts = await alerts();
    assert.equal(fanAlerts.length, 1, 'only the series that airs today');
    assert.equal(
      fanAlerts[0].refId,
      `${todaySeries.id}:${now.toISOString().slice(0, 10)}`
    );
    assert.ok(fanAlerts[0].title.includes(todaySeries.title));
    assert.ok(fanAlerts[0].linkPath?.startsWith(`/series/${todaySeries.id}`));
    assert.equal(
      await prisma.notification.count({
        where: { userId: quiet.id, type: 'air_day' },
      }),
      0,
      'respects notifySeasonAdded'
    );

    // Leido o no, una segunda corrida el mismo dia no repite.
    await prisma.notification.updateMany({
      where: { userId: fan.id, type: 'air_day' },
      data: { readAt: new Date() },
    });
    await runAirDayAlerts(now);
    fanAlerts = await alerts();
    assert.equal(fanAlerts.length, 1, 'idempotent per day');

    // --- Resumen semanal ---
    const outbox: SendEmailOptions[] = [];
    const send = async (options: SendEmailOptions) => {
      outbox.push(options);
      return { success: true };
    };
    const notMonday = new Date(now);
    notMonday.setUTCDate(now.getUTCDate() + ((2 - now.getUTCDay() + 7) % 7));
    assert.equal((await runWeeklyDigest(notMonday, { send })).recipients, 0);

    await runWeeklyDigest(now, { force: true, send });
    const mine = outbox.filter((mail) => mail.to === fan.email);
    assert.equal(mine.length, 1, 'one digest for the fan');
    assert.ok(!outbox.some((mail) => mail.to === staff.email), 'no staff');
    assert.ok(!outbox.some((mail) => mail.to === quiet.email), 'no opt-in');
    const html = mine[0].html;
    assert.ok(
      html.includes(todaySeries.title) && html.includes(otherDay.title)
    );
    assert.ok(html.includes(ended.title), 'continue watching section');
    assert.ok(mine[0].unsubscribeUrl, 'bulk email carries unsubscribe');

    const prefs = await prisma.notificationPrefs.findUniqueOrThrow({
      where: { userId: fan.id },
    });
    assert.ok(prefs.digestSentAt, 'claimed before sending');

    outbox.length = 0;
    await runWeeklyDigest(now, { force: true, send });
    assert.ok(
      !outbox.some((mail) => mail.to === fan.email),
      'not twice in the same week'
    );
    console.log('airing alerts: ok');
  } finally {
    await prisma.user.deleteMany({
      where: { id: { in: [fan.id, staff.id, quiet.id] } },
    });
    await prisma.series.deleteMany({
      where: { title: { startsWith: PREFIX } },
    });
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
