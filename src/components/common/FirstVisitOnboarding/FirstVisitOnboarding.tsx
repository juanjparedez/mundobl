'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Select, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { MediaCard, PanelModal } from '@/components/design-system';
import { ROUTES } from '@/constants/navigation';
import { ONBOARDING_MAX_PICKS } from '@/constants/onboarding';
import type { OnboardingSeriesRow } from '@/lib/database';
import { cardImageUrl, isDirectServedImageUrl } from '@/lib/image-helpers';
import { readPendingTrack } from '@/lib/pending-track';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  clearUserSummaryCache,
  getUserSummary,
} from '@/lib/user-summary-client';
import { useMessage } from '@/hooks/useMessage';
import './FirstVisitOnboarding.css';

/** Donde el modal estorba: paneles de staff y textos legales. */
const SKIPPED_PATH_PREFIXES = ['/admin', '/legal', '/privacidad'];

/** 0 = "recien empiezo". */
type Picks = Map<number, number>;

// Una vez por documento, como LoggedInHomeRedirect: navegar dentro del sitio
// no vuelve a consultar.
let checked = false;

/**
 * "Que estas viendo?" para quien entra logueado y todavia no sigue nada.
 * Elige series al aire y por que capitulo va; con eso queda en VIENDO,
 * suscripto a avisos y con una lista a la que volver. Ver src/lib/onboarding.ts
 * para los numeros que lo justifican.
 *
 * Se muestra una sola vez: guardar, "Ahora no" y cerrar lo dan por hecho.
 * Montado en el layout raiz. De paso, el resumen que consulta anota el dia
 * como activo (UserActiveDay).
 */
export function FirstVisitOnboarding() {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const message = useMessage();
  const [series, setSeries] = useState<OnboardingSeriesRow[]>([]);
  const [open, setOpen] = useState(false);
  const [picks, setPicks] = useState<Picks>(() => new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || checked) return;
    checked = true;

    let cancelled = false;
    const run = async () => {
      const summary = await getUserSummary();
      if (!summary || summary.onboardingCompletedAt) return;
      if (summary.trackedSeriesCount > 0) return;
      // Volvio del login para seguir una serie puntual: eso ya lo resuelve
      // PendingTrackApplier en la ficha.
      if (readPendingTrack()) return;
      if (SKIPPED_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return;

      const response = await fetch('/api/user/onboarding');
      if (!response.ok) return;
      const data = (await response.json()) as {
        series: OnboardingSeriesRow[];
      };
      if (cancelled || data.series.length === 0) return;
      setSeries(data.series);
      setOpen(true);
    };
    run().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [status, pathname]);

  const togglePick = (seriesId: number) => {
    setPicks((prev) => {
      const next = new Map(prev);
      if (next.has(seriesId)) {
        next.delete(seriesId);
      } else if (next.size < ONBOARDING_MAX_PICKS) {
        next.set(seriesId, 0);
      } else {
        message.info(t('onboarding.limit', { n: ONBOARDING_MAX_PICKS }));
      }
      return next;
    });
  };

  const setEpisode = (seriesId: number, episode: number) => {
    setPicks((prev) => new Map(prev).set(seriesId, episode));
  };

  const submit = async (chosen: Picks) => {
    setSaving(true);
    try {
      const body = {
        picks: [...chosen].map(([seriesId, episode]) => {
          const season = series.find((s) => s.id === seriesId)?.latestSeason;
          return {
            seriesId,
            seasonNumber: episode > 0 && season ? season.seasonNumber : null,
            episodeNumber: episode > 0 && season ? episode : null,
          };
        }),
      };
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();

      clearUserSummaryCache();
      setOpen(false);
      if (chosen.size > 0) {
        message.success(t('onboarding.saved'));
        router.push(ROUTES.WATCHING);
      }
    } catch {
      message.error(t('onboarding.error'));
    } finally {
      setSaving(false);
    }
  };

  const skip = () => {
    if (!saving) void submit(new Map());
  };

  const episodeOptions = (season: OnboardingSeriesRow['latestSeason']) => {
    if (!season) return [];
    const options = [{ value: 0, label: t('onboarding.justStarting') }];
    for (let n = 1; n <= season.episodeCount; n += 1) {
      options.push({
        value: n,
        label:
          season.seasonNumber > 1
            ? t('onboarding.seasonEpisodeOption', {
                season: season.seasonNumber,
                n,
              })
            : t('onboarding.episodeOption', { n }),
      });
    }
    return options;
  };

  return (
    <PanelModal
      open={open}
      onClose={skip}
      title={t('onboarding.title')}
      size="lg"
      footer={
        <div className="first-visit-onboarding__footer">
          <Button onClick={skip} disabled={saving}>
            {t('onboarding.skip')}
          </Button>
          <Button
            type="primary"
            loading={saving}
            disabled={picks.size === 0}
            onClick={() => void submit(picks)}
          >
            {t('onboarding.follow', { n: picks.size })}
          </Button>
        </div>
      }
    >
      <div className="first-visit-onboarding">
        <Typography.Paragraph className="first-visit-onboarding__intro">
          {t('onboarding.subtitle', { n: ONBOARDING_MAX_PICKS })}
        </Typography.Paragraph>
        <ul className="first-visit-onboarding__grid">
          {series.map((serie) => {
            const image = cardImageUrl(serie);
            const picked = picks.get(serie.id);
            const isPicked = picked !== undefined;
            const options = episodeOptions(serie.latestSeason);
            return (
              <li key={serie.id}>
                <MediaCard
                  className={
                    isPicked
                      ? 'first-visit-onboarding__card first-visit-onboarding__card--picked'
                      : 'first-visit-onboarding__card'
                  }
                  onClick={() => togglePick(serie.id)}
                  imageUrl={image}
                  imageAlt={serie.title}
                  unoptimizedImage={isDirectServedImageUrl(image)}
                  title={serie.title}
                  subtitle={
                    [serie.year ? String(serie.year) : null, serie.countryName]
                      .filter(Boolean)
                      .join(' · ') || undefined
                  }
                  overlayTags={
                    isPicked ? (
                      <CheckCircleFilled
                        className="first-visit-onboarding__check"
                        aria-label={t('onboarding.picked')}
                      />
                    ) : undefined
                  }
                  footer={
                    isPicked && options.length > 1 ? (
                      <Select
                        className="first-visit-onboarding__episode"
                        size="small"
                        value={picked}
                        options={options}
                        onChange={(value: number) =>
                          setEpisode(serie.id, value)
                        }
                        aria-label={t('onboarding.episodeLabel')}
                        popupMatchSelectWidth={false}
                      />
                    ) : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
        <Link
          href={ROUTES.CATALOGO}
          className="first-visit-onboarding__browse"
          onClick={() => setOpen(false)}
        >
          {t('onboarding.browseCatalog')}
        </Link>
      </div>
    </PanelModal>
  );
}
