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
  ReadOutlined,
  EyeInvisibleOutlined,
  TranslationOutlined,
  LikeOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  TrophyOutlined,
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { signIn, useSession } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { WatchableCarousel } from '@/components/common/WatchableCarousel/WatchableCarousel';
import { isDirectServedImageUrl, cardImageUrl } from '@/lib/image-helpers';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { getSeriesUrl } from '@/lib/slug';
import './LandingPage.css';

interface LatestSeries {
  id: number;
  title: string;
  year: number | null;
  imageUrl: string | null;
  imageThumbUrl?: string | null;
  country: { name: string; code: string | null } | null;
}

interface FeaturedReview {
  id: number;
  title: string;
  body: string;
  verdict: 'RECOMMENDED' | 'MIXED' | 'SKIP' | null;
  helpfulCount: number;
  user: { name: string | null; image: string | null } | null;
  series: {
    id: number;
    title: string;
    imageUrl: string | null;
    imageThumbUrl?: string | null;
  } | null;
}

interface WatchableLanding {
  id: number;
  title: string;
  imageUrl: string | null;
  imageThumbUrl?: string | null;
  imagePosition: string | null;
  year: number | null;
  type: string;
  country: { name: string; code: string | null } | null;
}

interface FeaturedGlossaryTerm {
  id: number;
  slug: string;
  term: string;
  transliteration: string | null;
  meaning: string;
  category: string;
  country: string;
}

interface LatestNewsItem {
  id: number;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  sourceName: string | null;
}

interface LandingStats {
  totalSeries: number;
  totalCompletedViews: number;
  totalPublicComments: number;
  totalReviews: number;
  latestSeries: LatestSeries[];
  featuredReview: FeaturedReview | null;
  watchableSeries?: WatchableLanding[];
  totalGlossaryTerms?: number;
  featuredGlossaryTerm?: FeaturedGlossaryTerm | null;
  latestNews?: LatestNewsItem[];
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

  // Novedad de "Asistente IA" oculta de la landing por ahora — la
  // funcionalidad sigue viva (helper en src/lib/gemini.ts), pero no
  // queremos promocionarla en home hasta que este pulida.
  const novedades = [
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
            <ReadOutlined /> {t('landing.heroBadge')}
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

          {/* Floating chips sobre la artwork. Chip 'AI' oculto por ahora
           * (mismo motivo que la novedad arriba). */}
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

      {/* ── Watchable series carousel ── (item 17 fine_tunning_1)
       * Anuncia la feature "Ver series completas" como un carousel
       * Netflix-like en la landing. Solo aparece si hay items. */}
      {stats.watchableSeries && stats.watchableSeries.length > 0 && (
        <section className="landing__watchable">
          <WatchableCarousel
            items={stats.watchableSeries}
            title={t('novedades.watchableTitle')}
          />
        </section>
      )}

      {/* ── Personal Tracker & Diary (Section 1: Retención & Diario) ── */}
      <section className="landing__narrative-section landing__tracker">
        <div className="landing__tracker-inner">
          <div className="landing__tracker-content">
            <header className="landing__section-head landing__section-head--start">
              <span className="landing__section-eyebrow">
                ⏱️ {t('landing.trackerEyebrow')}
              </span>
              <h2 className="landing__section-title">
                {t('landing.trackerTitle')}
              </h2>
              <p className="landing__section-subtitle">
                {t('landing.trackerSubtitle')}
              </p>
            </header>

            <div className="landing__tracker-features">
              <div className="landing__tracker-feature-item">
                <div className="landing__tracker-feature-icon">
                  <CheckCircleFilled />
                </div>
                <div>
                  <h3 className="landing__tracker-feature-title">
                    {t('landing.trackerFeature1Title')}
                  </h3>
                  <p className="landing__tracker-feature-desc">
                    {t('landing.trackerFeature1Desc')}
                  </p>
                </div>
              </div>

              <div className="landing__tracker-feature-item">
                <div className="landing__tracker-feature-icon">
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <h3 className="landing__tracker-feature-title">
                    {t('landing.trackerFeature2Title')}
                  </h3>
                  <p className="landing__tracker-feature-desc">
                    {t('landing.trackerFeature2Desc')}
                  </p>
                </div>
              </div>

              <div className="landing__tracker-feature-item">
                <div className="landing__tracker-feature-icon">
                  <FileTextOutlined />
                </div>
                <div>
                  <h3 className="landing__tracker-feature-title">
                    {t('landing.trackerFeature3Title')}
                  </h3>
                  <p className="landing__tracker-feature-desc">
                    {t('landing.trackerFeature3Desc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="landing__tracker-actions">
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={() => router.push(ROUTES.CATALOGO)}
              >
                {t('landing.trackerCta')}
              </Button>
            </div>
          </div>

          <div className="landing__tracker-visual" aria-hidden="true">
            <div className="landing__tracker-card">
              <div className="landing__tracker-card-header">
                <div>
                  <span className="landing__tracker-card-series">
                    {t('landing.trackerMockSeries')}
                  </span>
                  <div className="landing__tracker-card-meta">
                    <span>{t('landing.trackerMockProgress')}</span>
                  </div>
                </div>
                <Tag color="processing" className="landing__tracker-card-tag">
                  {t('landing.trackerMockStatus')}
                </Tag>
              </div>

              <div className="landing__tracker-card-bar">
                <div
                  className="landing__tracker-card-fill"
                  style={{ width: '50%' }}
                />
              </div>

              <div className="landing__tracker-card-spoiler">
                <EyeInvisibleOutlined />
                <span>{t('landing.trackerMockSpoiler')}</span>
              </div>

              <div className="landing__tracker-card-note">
                <div className="landing__tracker-card-note-head">
                  <FileTextOutlined />
                  <span>{t('landing.trackerMockNoteTitle')}</span>
                </div>
                <p className="landing__tracker-card-note-body">
                  {t('landing.trackerMockNoteText')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cultural Glossary & Quiz (Section 2: Glosario & Trivia) ── */}
      <section className="landing__narrative-section landing__glossary">
        <header className="landing__section-head">
          <span className="landing__section-eyebrow">
            📖 {t('landing.glossaryEyebrow')}
          </span>
          <h2 className="landing__section-title">
            {t('landing.glossaryTitle')}
          </h2>
          <p className="landing__section-subtitle">
            {t('landing.glossarySubtitle')}
          </p>
        </header>

        <div className="landing__glossary-grid">
          {/* Card 1: Featured Cultural Term */}
          <div className="landing__glossary-term-card">
            <div className="landing__glossary-term-tag-row">
              <Tag color="purple" className="landing__glossary-eyebrow-tag">
                {t('landing.glossaryTermOfTheDay')}
              </Tag>
              {stats.featuredGlossaryTerm?.category && (
                <Tag color="blue">{stats.featuredGlossaryTerm.category}</Tag>
              )}
            </div>

            <h3 className="landing__glossary-term-name">
              {stats.featuredGlossaryTerm?.term || 'Phi / Nong (พี่ / น้อง)'}
            </h3>

            {stats.featuredGlossaryTerm?.transliteration && (
              <span className="landing__glossary-term-translit">
                ({stats.featuredGlossaryTerm.transliteration})
              </span>
            )}

            <p className="landing__glossary-term-meaning">
              {stats.featuredGlossaryTerm?.meaning ||
                'Tratamiento de respeto y cercanía hacia alguien mayor (P\') o menor (N\'). Fundamental para entender dinámicas y afecto en el BL tailandés.'}
            </p>

            <div className="landing__glossary-term-action">
              <Link href="/glosario">
                <Button icon={<BookOutlined />}>
                  {t('landing.glossaryExploreCta')}{' '}
                  {stats.totalGlossaryTerms && stats.totalGlossaryTerms > 0
                    ? `(${stats.totalGlossaryTerms})`
                    : ''}
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: Mini-Quiz Challenge */}
          <div className="landing__quiz-card">
            <div className="landing__quiz-icon-wrap">
              <TrophyOutlined className="landing__quiz-trophy" />
            </div>
            <h3 className="landing__quiz-title">
              {t('landing.glossaryQuizCardTitle')}
            </h3>
            <p className="landing__quiz-desc">
              {t('landing.glossaryQuizCardDesc')}
            </p>
            <div className="landing__quiz-action">
              <Link href="/glosario?view=trivia">
                <Button type="primary" size="large" icon={<TrophyOutlined />}>
                  {t('landing.glossaryQuizCardCta')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Curated Industry News (Section 3: Noticias sin clickbait) ── */}
      {stats.latestNews && stats.latestNews.length > 0 && (
        <section className="landing__narrative-section landing__news">
          <header className="landing__section-head">
            <span className="landing__section-eyebrow">
              📰 {t('landing.newsEyebrow')}
            </span>
            <h2 className="landing__section-title">{t('landing.newsTitle')}</h2>
            <p className="landing__section-subtitle">
              {t('landing.newsSubtitle')}
            </p>
          </header>

          <div className="landing__news-grid">
            {stats.latestNews.map((item) => (
              <Link
                key={item.id}
                href={`/noticias/${item.id}`}
                className="landing__news-card"
              >
                {item.imageUrl && (
                  <div className="landing__news-card-image-wrap">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={380}
                      height={190}
                      className="landing__news-card-image"
                      quality={70}
                      unoptimized={shouldSkipOptimization(item.imageUrl)}
                    />
                  </div>
                )}
                <div className="landing__news-card-body">
                  <div className="landing__news-card-meta">
                    {item.publishedAt && (
                      <span className="landing__news-card-date">
                        <CalendarOutlined />{' '}
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                    {item.sourceName && (
                      <Tag className="landing__news-card-source">
                        {item.sourceName}
                      </Tag>
                    )}
                  </div>
                  <h3 className="landing__news-card-title">{item.title}</h3>
                  {item.summary && (
                    <p className="landing__news-card-summary">
                      {truncate(item.summary, 120)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="landing__news-footer">
            <Link href="/noticias" className="landing__section-link">
              {t('landing.newsCta')} <ArrowRightOutlined />
            </Link>
          </div>
        </section>
      )}

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
                href={getSeriesUrl(s.id, s.title)}
                className="landing__series-card"
                prefetch={false}
              >
                <div className="landing__series-cover">
                  {cardImageUrl(s) ? (
                    <Image
                      src={cardImageUrl(s)!}
                      alt={s.title}
                      width={180}
                      height={270}
                      sizes="(max-width: 600px) 130px, 180px"
                      quality={65}
                      unoptimized={
                        shouldSkipOptimization(cardImageUrl(s)) ||
                        isDirectServedImageUrl(cardImageUrl(s))
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
            href={getSeriesUrl(
              stats.featuredReview.series.id,
              stats.featuredReview.series.title
            )}
            className="landing__featured-review"
            prefetch={false}
          >
            {cardImageUrl(stats.featuredReview.series) && (
              <div className="landing__featured-review-cover">
                <Image
                  src={cardImageUrl(stats.featuredReview.series)!}
                  alt={stats.featuredReview.series.title}
                  width={130}
                  height={195}
                  quality={65}
                  unoptimized={
                    shouldSkipOptimization(
                      cardImageUrl(stats.featuredReview.series)
                    ) ||
                    isDirectServedImageUrl(
                      cardImageUrl(stats.featuredReview.series)
                    )
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

      {/* ── Open Ecosystem & Collaborators (Section 4: Comunidad & Transparencia) ── */}
      <section className="landing__narrative-section landing__ecosystem">
        <header className="landing__section-head">
          <span className="landing__section-eyebrow">
            🤝 {t('landing.ecosystemEyebrow')}
          </span>
          <h2 className="landing__section-title">
            {t('landing.ecosystemTitle')}
          </h2>
          <p className="landing__section-subtitle">
            {t('landing.ecosystemSubtitle')}
          </p>
        </header>

        <div className="landing__ecosystem-grid">
          <article className="landing__ecosystem-card">
            <div className="landing__ecosystem-card-icon">
              <GlobalOutlined />
            </div>
            <h3 className="landing__ecosystem-card-title">
              {t('landing.ecosystemPillar1Title')}
            </h3>
            <p className="landing__ecosystem-card-desc">
              {t('landing.ecosystemPillar1Desc')}
            </p>
          </article>

          <article className="landing__ecosystem-card">
            <div className="landing__ecosystem-card-icon">
              <HeartOutlined />
            </div>
            <h3 className="landing__ecosystem-card-title">
              {t('landing.ecosystemPillar2Title')}
            </h3>
            <p className="landing__ecosystem-card-desc">
              {t('landing.ecosystemPillar2Desc')}
            </p>
          </article>

          <article className="landing__ecosystem-card">
            <div className="landing__ecosystem-card-icon">
              <TeamOutlined />
            </div>
            <h3 className="landing__ecosystem-card-title">
              {t('landing.ecosystemPillar3Title')}
            </h3>
            <p className="landing__ecosystem-card-desc">
              {t('landing.ecosystemPillar3Desc')}
            </p>
          </article>
        </div>

        <div className="landing__ecosystem-cta-wrap">
          <Link href={ROUTES.ADMIN_COLABORADOR}>
            <Button size="large" icon={<TeamOutlined />}>
              {t('landing.ecosystemCta')}
            </Button>
          </Link>
        </div>
      </section>

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
