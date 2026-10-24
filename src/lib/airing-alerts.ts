import { prisma } from './database';
import {
  airingSeriesWhere,
  isAiringNow,
  parseAirDays,
} from './airing-schedule';
import { notifyUser } from './notifications';
import { getSeriesUrl } from './slug';
import { interpolateMessage } from './i18n-format';
import { mapWithConcurrency } from './concurrency';
import { isEmailConfigured, sendEmail, unsubscribeUrl } from './email';
import {
  renderWeeklyDigestEmail,
  SITE_URL,
  type WeeklyDigestItem,
} from './email-templates';
import { loadLocaleMessages, type TranslationShape } from '@/i18n/messages';
import { DEFAULT_LOCALE, type SupportedLocale } from '@/i18n/config';

/**
 * Avisos que no dependen de que alguien suba un video.
 *
 * Hasta aca los avisos a quien sigue una serie solo salian cuando un episodio
 * recibia su video (notifyEpisodesAvailable), y eso casi nunca pasaba: 54
 * personas seguian 53 series y nunca se mando ninguno (medido 2026-10-24). El
 * dia de estreno si lo sabemos, porque Flor carga `Series.airDays`.
 *
 * Corre en /api/cron/alerts a las 12:00 UTC: mismo dia de la semana en
 * Argentina (09:00) y en Tailandia (19:00, antes de la emision), y no a las
 * 02:00 de Argentina como el cron diario de mantenimiento.
 */

const CONCURRENCY = 5;
const DIGEST_MIN_GAP_MS = 6 * 24 * 60 * 60 * 1000;
const DIGEST_WATCHING_LIMIT = 5;
const STAFF_ROLES = ['ADMIN', 'MODERATOR'] as const;

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

const WEEKDAY_KEYS = [
  'daySunday',
  'dayMonday',
  'dayTuesday',
  'dayWednesday',
  'dayThursday',
  'dayFriday',
  'daySaturday',
] as const satisfies ReadonlyArray<keyof TranslationShape['estrenos']>;

/** "Viernes y Sábado", con los mismos nombres que la parrilla de /estrenos. */
export function formatAirWeekdays(
  weekdays: number[],
  messages: TranslationShape,
  locale: SupportedLocale
): string {
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(
    weekdays.map((day) => messages.estrenos[WEEKDAY_KEYS[day]])
  );
}

/**
 * Los avisos y el mail salen en español, como el resto de los avisos
 * guardados: el idioma elegido vive solo en el navegador, no en la cuenta.
 */
const ALERT_LOCALE: SupportedLocale = DEFAULT_LOCALE;

export interface AirDayAlertResult {
  series: number;
  notified: number;
}

/**
 * "Hoy sale capitulo de X" a quien sigue una serie en su dia de estreno.
 * Idempotente: el refId lleva la fecha, y se saltea a quien ya tiene el aviso
 * de hoy aunque lo haya leido (notifyUser solo mira los no leidos).
 */
export async function runAirDayAlerts(
  now: Date = new Date()
): Promise<AirDayAlertResult> {
  const today = now.getUTCDay();
  const candidates = await prisma.series.findMany({
    where: {
      ...airingSeriesWhere(now),
      visibility: 'VISIBLE',
      subscriptions: { some: {} },
    },
    select: {
      id: true,
      title: true,
      airDays: true,
      year: true,
      createdAt: true,
    },
  });
  const airingToday = candidates.filter(
    (series) =>
      isAiringNow(series, now) && parseAirDays(series.airDays).includes(today)
  );
  if (airingToday.length === 0) return { series: 0, notified: 0 };

  const refIds = airingToday.map((series) => `${series.id}:${dayKey(now)}`);
  const [subscriptions, already] = await Promise.all([
    prisma.seriesSubscription.findMany({
      where: {
        seriesId: { in: airingToday.map((series) => series.id) },
        user: { banned: false },
      },
      select: { seriesId: true, userId: true },
    }),
    prisma.notification.findMany({
      where: { type: 'air_day', refType: 'air_day', refId: { in: refIds } },
      select: { userId: true, refId: true },
    }),
  ]);
  const sent = new Set(already.map((row) => `${row.userId}|${row.refId}`));
  const byId = new Map(airingToday.map((series) => [series.id, series]));
  const { airingAlert } = await loadLocaleMessages(ALERT_LOCALE);

  const pending = subscriptions.filter(
    (row) => !sent.has(`${row.userId}|${row.seriesId}:${dayKey(now)}`)
  );
  await mapWithConcurrency(pending, CONCURRENCY, async (row) => {
    const series = byId.get(row.seriesId);
    if (!series) return;
    await notifyUser({
      userId: row.userId,
      type: 'air_day',
      title: interpolateMessage(airingAlert.notificationTitle, {
        title: series.title,
      }),
      body: airingAlert.notificationBody,
      linkPath: getSeriesUrl(series.id, series.title),
      refType: 'air_day',
      refId: `${series.id}:${dayKey(now)}`,
    }).catch((error: unknown) =>
      console.error('[airing-alerts] air_day', row.userId, error)
    );
  });

  return { series: airingToday.length, notified: pending.length };
}

export interface WeeklyDigestResult {
  recipients: number;
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Resumen de los lunes por mail, solo con opt-in (`emailEnabled`). Lleva las
 * series seguidas que estrenan esta semana y lo que la persona tiene en
 * "Viendo". Si no hay nada que contar, no se manda.
 *
 * Cada envio se reclama antes en `digestSentAt` con un update condicional:
 * dos corridas a la vez no le escriben dos veces a nadie.
 */
export async function runWeeklyDigest(
  now: Date = new Date(),
  {
    force = false,
    send,
  }: {
    /** Corre aunque no sea lunes (tests, envio manual). */
    force?: boolean;
    /** Reemplaza a Resend en los tests. */
    send?: typeof sendEmail;
  } = {}
): Promise<WeeklyDigestResult> {
  const empty = { recipients: 0, sent: 0, skipped: 0, failed: 0 };
  if (!force && now.getUTCDay() !== 1) return empty;
  if (!send && !isEmailConfigured()) return empty;
  const deliver = send ?? sendEmail;

  const cutoff = new Date(now.getTime() - DIGEST_MIN_GAP_MS);
  const due = {
    emailEnabled: true,
    OR: [{ digestSentAt: null }, { digestSentAt: { lt: cutoff } }],
  };
  const users = await prisma.user.findMany({
    where: {
      banned: false,
      role: { notIn: [...STAFF_ROLES] },
      notificationPrefs: { is: due },
    },
    select: {
      id: true,
      email: true,
      seriesSubscriptions: {
        select: {
          series: {
            select: {
              id: true,
              title: true,
              airDays: true,
              year: true,
              createdAt: true,
              visibility: true,
            },
          },
        },
      },
      viewStatuses: {
        where: { seriesId: { not: null }, status: 'VIENDO' },
        orderBy: { updatedAt: 'desc' },
        take: DIGEST_WATCHING_LIMIT * 2,
        select: {
          series: { select: { id: true, title: true, visibility: true } },
        },
      },
    },
  });

  const messages = await loadLocaleMessages(ALERT_LOCALE);
  const locale = ALERT_LOCALE;
  const result = { ...empty, recipients: users.length };

  await mapWithConcurrency(users, CONCURRENCY, async (user) => {
    if (!user.email) {
      result.skipped += 1;
      return;
    }
    const url = (id: number, title: string) =>
      SITE_URL + getSeriesUrl(id, title);

    const airing: WeeklyDigestItem[] = user.seriesSubscriptions
      .map((row) => row.series)
      .filter(
        (series) => series.visibility === 'VISIBLE' && isAiringNow(series, now)
      )
      .map((series) => ({
        title: series.title,
        url: url(series.id, series.title),
        detail: formatAirWeekdays(
          parseAirDays(series.airDays),
          messages,
          locale
        ),
      }));
    const airingTitles = new Set(airing.map((item) => item.title));
    const watching: WeeklyDigestItem[] = user.viewStatuses
      .flatMap((row) => (row.series ? [row.series] : []))
      .filter(
        (series) =>
          series.visibility === 'VISIBLE' && !airingTitles.has(series.title)
      )
      .slice(0, DIGEST_WATCHING_LIMIT)
      .map((series) => ({
        title: series.title,
        url: url(series.id, series.title),
      }));

    if (airing.length === 0 && watching.length === 0) {
      result.skipped += 1;
      return;
    }

    const claim = await prisma.notificationPrefs.updateMany({
      where: { userId: user.id, ...due },
      data: { digestSentAt: now },
    });
    if (claim.count === 0) {
      result.skipped += 1;
      return;
    }

    const unsubUrl = unsubscribeUrl(user.id, SITE_URL);
    const rendered = renderWeeklyDigestEmail({
      labels: messages.airingAlert,
      locale,
      airing,
      watching,
      unsubscribeUrl: unsubUrl,
    });
    const sent = await deliver({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      unsubscribeUrl: unsubUrl,
    });
    if (sent.success) {
      result.sent += 1;
    } else {
      result.failed += 1;
      console.error('[airing-alerts] digest', user.id, sent.error);
    }
  });

  return result;
}
