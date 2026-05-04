'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Tag } from 'antd';
import {
  SearchOutlined,
  LoginOutlined,
  StarOutlined,
  CommentOutlined,
  BarChartOutlined,
  HeartOutlined,
  PlayCircleOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  ReadOutlined,
  EyeInvisibleOutlined,
  TranslationOutlined,
  LikeOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { signIn, useSession } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './LandingPage.css';

interface LatestSeries {
  id: number;
  title: string;
  year: number | null;
  imageUrl: string | null;
  country: { name: string; code: string | null } | null;
}

interface FeaturedReview {
  id: number;
  title: string;
  body: string;
  verdict: 'RECOMMENDED' | 'MIXED' | 'SKIP' | null;
  helpfulCount: number;
  user: { name: string | null; image: string | null } | null;
  series: { id: number; title: string; imageUrl: string | null } | null;
}

interface LandingStats {
  totalSeries: number;
  totalCompletedViews: number;
  totalPublicComments: number;
  totalReviews: number;
  latestSeries: LatestSeries[];
  featuredReview: FeaturedReview | null;
}

interface LandingPageProps {
  stats: LandingStats;
}

export function LandingPage({ stats }: LandingPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLocale();

  const features = [
    {
      icon: <SearchOutlined />,
      title: t('landing.featureCatalogTitle'),
      desc: t('landing.featureCatalogDesc'),
    },
    {
      icon: <StarOutlined />,
      title: t('landing.featureRatingsTitle'),
      desc: t('landing.featureRatingsDesc'),
    },
    {
      icon: <PlayCircleOutlined />,
      title: t('landing.featureTrackingTitle'),
      desc: t('landing.featureTrackingDesc'),
    },
    {
      icon: <CommentOutlined />,
      title: t('landing.featureCommentsTitle'),
      desc: t('landing.featureCommentsDesc'),
    },
    {
      icon: <HeartOutlined />,
      title: t('landing.featureFavoritesTitle'),
      desc: t('landing.featureFavoritesDesc'),
    },
    {
      icon: <BarChartOutlined />,
      title: t('landing.featureStatsTitle'),
      desc: t('landing.featureStatsDesc'),
    },
  ];

  const novedades = [
    {
      icon: <ThunderboltOutlined />,
      tag: t('landing.novedadAiTag'),
      title: t('landing.novedadAiTitle'),
      desc: t('landing.novedadAiDesc'),
      color: 'gold' as const,
    },
    {
      icon: <ReadOutlined />,
      tag: t('landing.novedadReviewsTag'),
      title: t('landing.novedadReviewsTitle'),
      desc: t('landing.novedadReviewsDesc'),
      color: 'blue' as const,
    },
    {
      icon: <EyeInvisibleOutlined />,
      tag: t('landing.novedadSpoilerTag'),
      title: t('landing.novedadSpoilerTitle'),
      desc: t('landing.novedadSpoilerDesc'),
      color: 'magenta' as const,
    },
    {
      icon: <FileTextOutlined />,
      tag: t('landing.novedadNotesTag'),
      title: t('landing.novedadNotesTitle'),
      desc: t('landing.novedadNotesDesc'),
      color: 'cyan' as const,
    },
    {
      icon: <TranslationOutlined />,
      tag: t('landing.novedadI18nTag'),
      title: t('landing.novedadI18nTitle'),
      desc: t('landing.novedadI18nDesc'),
      color: 'purple' as const,
    },
    {
      icon: <LikeOutlined />,
      tag: t('landing.novedadVotesTag'),
      title: t('landing.novedadVotesTitle'),
      desc: t('landing.novedadVotesDesc'),
      color: 'green' as const,
    },
  ];

  const statItems = [
    {
      value: stats.totalSeries,
      label: t('landing.statSeries'),
      icon: <GlobalOutlined />,
    },
    {
      value: stats.totalCompletedViews,
      label: t('landing.statViews'),
      icon: <PlayCircleOutlined />,
    },
    {
      value: stats.totalPublicComments,
      label: t('landing.statComments'),
      icon: <CommentOutlined />,
    },
    {
      value: stats.totalReviews,
      label: t('landing.statReviews'),
      icon: <ReadOutlined />,
    },
  ];

  const verdictMap = {
    RECOMMENDED: { color: 'green', key: 'reviews.verdictRecommended' },
    MIXED: { color: 'gold', key: 'reviews.verdictMixed' },
    SKIP: { color: 'red', key: 'reviews.verdictSkip' },
  } as const;

  const truncate = (text: string, max = 200): string => {
    if (text.length <= max) return text;
    const slice = text.slice(0, max);
    const lastSpace = slice.lastIndexOf(' ');
    return slice.slice(0, lastSpace > 0 ? lastSpace : max).trim() + '…';
  };

  const shouldSkipOptimization = (url: string | null): boolean => {
    if (!url) return false;
    if (url.startsWith('/')) return false;
    return true;
  };

  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="landing__hero">
        <div className="landing__hero-aurora" aria-hidden="true" />

        {/* Artwork visible solo en mobile, arriba del titulo */}
        <div
          className="landing__hero-visual landing__hero-visual--mobile"
          aria-hidden
        >
          <Image
            src="/images/landing.png"
            alt=""
            width={720}
            height={720}
            quality={78}
            unoptimized
            priority
            className="landing__hero-image"
          />
          <div className="landing__hero-glow" />
        </div>

        <div className="landing__hero-content">
          <div className="landing__hero-badge">
            <ThunderboltOutlined /> {t('landing.heroBadge')}
          </div>
          <h1 className="landing__title">MundoBL</h1>
          <p className="landing__subtitle">{t('landing.subtitle')}</p>
          <p className="landing__description">{t('landing.description')}</p>

          <div className="landing__actions">
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={() => router.push(ROUTES.CATALOGO)}
              className="landing__cta-primary"
            >
              {t('landing.exploreCatalog')}
            </Button>

            {!session?.user && (
              <Button
                size="large"
                icon={<LoginOutlined />}
                onClick={() =>
                  signIn('google', { callbackUrl: ROUTES.CATALOGO })
                }
              >
                {t('landing.signIn')}
              </Button>
            )}

            {session?.user && (
              <Link href="/perfil">
                <Button size="large" icon={<BarChartOutlined />}>
                  {t('landing.goToProfile')}
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div
          className="landing__hero-visual landing__hero-visual--desktop"
          aria-hidden
        >
          <Image
            src="/images/landing.png"
            alt=""
            width={520}
            height={520}
            quality={75}
            unoptimized
            className="landing__hero-image"
          />
          <div className="landing__hero-glow" />

          {/* Floating chips sobre la artwork */}
          <div className="landing__floating-chip landing__floating-chip--ai">
            <ThunderboltOutlined /> AI
          </div>
          <div className="landing__floating-chip landing__floating-chip--lang">
            <TranslationOutlined /> 10 idiomas
          </div>
          <div className="landing__floating-chip landing__floating-chip--reviews">
            <ReadOutlined /> Reseñas
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="landing__stats">
        {statItems.map((item) => (
          <div key={item.label} className="landing__stat">
            <span className="landing__stat-icon">{item.icon}</span>
            <span className="landing__stat-value">
              {item.value.toLocaleString()}
            </span>
            <span className="landing__stat-label">{item.label}</span>
          </div>
        ))}
      </section>

      {/* ── Novedades / Lo nuevo ── */}
      <section className="landing__novedades">
        <header className="landing__section-head">
          <span className="landing__section-eyebrow">
            ✨ {t('landing.novedadesEyebrow')}
          </span>
          <h2 className="landing__section-title">
            {t('landing.novedadesTitle')}
          </h2>
          <p className="landing__section-subtitle">
            {t('landing.novedadesSubtitle')}
          </p>
        </header>
        <div className="landing__novedades-grid">
          {novedades.map((item) => (
            <article
              key={item.title}
              className={`landing__novedad landing__novedad--${item.color}`}
            >
              <div className="landing__novedad-icon">{item.icon}</div>
              <Tag color={item.color} className="landing__novedad-tag">
                {item.tag}
              </Tag>
              <h3 className="landing__novedad-title">{item.title}</h3>
              <p className="landing__novedad-desc">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Latest series teaser ── */}
      {stats.latestSeries.length > 0 && (
        <section className="landing__latest">
          <header className="landing__section-head">
            <h2 className="landing__section-title">
              {t('landing.latestSeriesTitle')}
            </h2>
            <Link href={ROUTES.CATALOGO} className="landing__section-link">
              {t('landing.latestSeriesCta')} <ArrowRightOutlined />
            </Link>
          </header>
          <div className="landing__latest-strip">
            {stats.latestSeries.map((s) => (
              <Link
                key={s.id}
                href={`/series/${s.id}`}
                className="landing__series-card"
                prefetch={false}
              >
                <div className="landing__series-cover">
                  {s.imageUrl ? (
                    <Image
                      src={s.imageUrl}
                      alt={s.title}
                      width={180}
                      height={270}
                      sizes="(max-width: 600px) 130px, 180px"
                      quality={65}
                      unoptimized={
                        shouldSkipOptimization(s.imageUrl) ||
                        isSupabaseImageUrl(s.imageUrl)
                      }
                    />
                  ) : (
                    <div className="landing__series-cover-placeholder">
                      <PlayCircleOutlined />
                    </div>
                  )}
                  {s.country?.code && (
                    <span className="landing__series-flag">
                      <CountryFlag code={s.country.code} />
                    </span>
                  )}
                </div>
                <div className="landing__series-info">
                  <span className="landing__series-title">{s.title}</span>
                  <span className="landing__series-meta">
                    {s.year ?? ''}
                    {s.country?.name ? ` · ${s.country.name}` : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured review ── */}
      {stats.featuredReview && stats.featuredReview.series && (
        <section className="landing__review-spotlight">
          <header className="landing__section-head">
            <span className="landing__section-eyebrow">
              💬 {t('landing.reviewSpotlightEyebrow')}
            </span>
            <h2 className="landing__section-title">
              {t('landing.reviewSpotlightTitle')}
            </h2>
          </header>
          <Link
            href={`/series/${stats.featuredReview.series.id}`}
            className="landing__featured-review"
            prefetch={false}
          >
            {stats.featuredReview.series.imageUrl && (
              <div className="landing__featured-review-cover">
                <Image
                  src={stats.featuredReview.series.imageUrl}
                  alt={stats.featuredReview.series.title}
                  width={130}
                  height={195}
                  quality={65}
                  unoptimized={
                    shouldSkipOptimization(
                      stats.featuredReview.series.imageUrl
                    ) ||
                    isSupabaseImageUrl(stats.featuredReview.series.imageUrl)
                  }
                />
              </div>
            )}
            <div className="landing__featured-review-body">
              <div className="landing__featured-review-meta">
                <span className="landing__featured-review-series">
                  {stats.featuredReview.series.title}
                </span>
                {stats.featuredReview.verdict && (
                  <Tag color={verdictMap[stats.featuredReview.verdict].color}>
                    {t(
                      verdictMap[stats.featuredReview.verdict]
                        .key as Parameters<typeof t>[0]
                    )}
                  </Tag>
                )}
                {stats.featuredReview.helpfulCount > 0 && (
                  <span className="landing__featured-review-helpful">
                    <LikeOutlined /> {stats.featuredReview.helpfulCount}
                  </span>
                )}
              </div>
              <h3 className="landing__featured-review-title">
                {stats.featuredReview.title}
              </h3>
              <p className="landing__featured-review-text">
                {truncate(stats.featuredReview.body)}
              </p>
              <span className="landing__featured-review-author">
                {stats.featuredReview.user?.name ?? t('reviews.anonymous')}
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* ── Features ── */}
      <section className="landing__features">
        <h2 className="landing__features-title">
          {t('landing.featuresTitle')}
        </h2>
        <div className="landing__features-grid">
          {features.map((f) => (
            <div key={f.title} className="landing__feature-card">
              <span className="landing__feature-icon">{f.icon}</span>
              <h3 className="landing__feature-title">{f.title}</h3>
              <p className="landing__feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="landing__footer-cta">
        <p className="landing__footer-cta-text">{t('landing.footerCtaText')}</p>
        <Button
          type="primary"
          size="large"
          icon={<SearchOutlined />}
          onClick={() => router.push(ROUTES.CATALOGO)}
        >
          {t('landing.exploreCatalog')}
        </Button>
      </section>
    </div>
  );
}
