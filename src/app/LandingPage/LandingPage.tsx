'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Segmented, Select, Switch, Tag } from 'antd';
import {
  SearchOutlined,
  LoginOutlined,
  StarOutlined,
  BarChartOutlined,
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
  AppstoreOutlined,
  SettingOutlined,
  BgColorsOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { signIn, useSession } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { SectionHeader } from '@/components/design-system';
import { WeeklySchedule } from '@/components/estrenos/WeeklySchedule/WeeklySchedule';
import { useWeeklyScheduleLabels } from '@/components/estrenos/WeeklySchedule/useWeeklyScheduleLabels';
import type { AiringScheduleRow } from '@/lib/database';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { LoggedInHomeRedirect } from '@/components/common/LoggedInHomeRedirect/LoggedInHomeRedirect';
import { WatchableCarousel } from '@/components/common/WatchableCarousel/WatchableCarousel';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
import { isDirectServedImageUrl, cardImageUrl } from '@/lib/image-helpers';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config';
import type { TranslationKey } from '@/i18n/messages';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useSpoilerFree } from '@/lib/providers/SpoilerFreeProvider';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { getSeriesUrl } from '@/lib/slug';
import {
  START_PAGE_CHANGED_EVENT,
  getStartPagePreference,
  setStartPagePreference,
  type StartPageOption,
} from '@/lib/start-page-preference';
import { ACCENT_PRESETS, getSkinSwatches } from '@/lib/theme.config';
import type { AccentPresetKey, SkinKey, ToneKey } from '@/types/theme.types';
import { ContinueWatchingRow } from '@/components/watching/ContinueWatchingRow/ContinueWatchingRow';
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
  /** Series curadas agregadas en los ultimos 7 dias. COUNT real. */
  newThisWeek?: number;
  /** Parrilla semanal de emision (CURATED + PERSONAL, ventana de 16 semanas). */
  airingSchedule?: AiringScheduleRow[];
  /** Episodios marcados como vistos en los ultimos 7 dias. */
  episodesMarkedThisWeek?: number;
  /** Episodios marcados como vistos, historico. Fallback de la stat semanal. */
  episodesMarkedTotal?: number;
  /** Usuarios no-admin con al menos una serie en VIENDO. */
  usersFollowing?: number;
  /** Series que se ven en /ver (misma condicion que esa pagina). */
  watchableCount?: number;
}

interface LandingPageProps {
  stats: LandingStats;
}

const SKIN_OPTIONS: {
  key: SkinKey;
  nameKey: TranslationKey;
  descKey: TranslationKey;
}[] = [
  {
    key: 'default',
    nameKey: 'settings.skinDefault',
    descKey: 'settings.skinDefaultDesc',
  },
  {
    key: 'premium',
    nameKey: 'settings.skinPremium',
    descKey: 'settings.skinPremiumDesc',
  },
  {
    key: 'sakura',
    nameKey: 'settings.skinSakura',
    descKey: 'settings.skinSakuraDesc',
  },
  {
    key: 'midnight',
    nameKey: 'settings.skinMidnight',
    descKey: 'settings.skinMidnightDesc',
  },
  {
    key: 'journal',
    nameKey: 'settings.skinJournal',
    descKey: 'settings.skinJournalDesc',
  },
  {
    key: 'neon',
    nameKey: 'settings.skinNeon',
    descKey: 'settings.skinNeonDesc',
  },
];

export function LandingPage({ stats }: LandingPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { locale, setLocale, t } = useLocale();
  const {
    theme,
    setTheme,
    skin,
    setSkin,
    accent,
    setAccent,
    customAccent,
    tone,
    setTone,
  } = useTheme();
  const { enabled: spoilerFree, setEnabled: setSpoilerFree } = useSpoilerFree();
  const scheduleLabels = useWeeklyScheduleLabels();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startPage, setStartPage] = useState<StartPageOption>(() =>
    getStartPagePreference()
  );

  useEffect(() => {
    const syncStartPage = () => setStartPage(getStartPagePreference());
    window.addEventListener(START_PAGE_CHANGED_EVENT, syncStartPage);
    return () =>
      window.removeEventListener(START_PAGE_CHANGED_EVENT, syncStartPage);
  }, []);

  const episodesThisWeek = stats.episodesMarkedThisWeek ?? 0;
  const episodesStat =
    episodesThisWeek > 0
      ? { value: episodesThisWeek, label: t('landing.statEpisodesWeek') }
      : {
          value: stats.episodesMarkedTotal ?? 0,
          label: t('landing.statEpisodesTotal'),
        };

  const statItems = [
    {
      value: episodesStat.value,
      label: episodesStat.label,
      icon: <CheckCircleFilled />,
    },
    {
      value: stats.totalSeries,
      label: t('landing.statSeries'),
      icon: <GlobalOutlined />,
    },
    {
      value: stats.watchableCount ?? 0,
      label: t('landing.statWatchable'),
      icon: <VideoCameraOutlined />,
    },
    {
      value: stats.usersFollowing ?? 0,
      label: t('landing.statUsersFollowing'),
      icon: <TeamOutlined />,
    },
  ];

  const pillars = [
    {
      key: 'watch',
      href: ROUTES.VER,
      icon: <VideoCameraOutlined />,
      badge: t('landing.pillarWatchBadge'),
      title: t('navSections.watch'),
      count: interpolateMessage(t('landing.offerSeriesCount'), {
        n: (stats.watchableCount ?? 0).toLocaleString(),
      }),
      desc: t('landing.offerWatchDesc'),
      cta: t('landing.offerWatchCta'),
      highlight: true,
    },
    {
      key: 'catalog',
      href: ROUTES.CATALOGO,
      icon: <AppstoreOutlined />,
      badge: t('landing.pillarCatalogBadge'),
      title: t('navSections.follow'),
      count: interpolateMessage(t('landing.offerSeriesCount'), {
        n: stats.totalSeries.toLocaleString(),
      }),
      desc: t('landing.offerFollowDesc'),
      cta: t('landing.exploreCatalog'),
      highlight: false,
    },
    {
      key: 'track',
      href: ROUTES.WATCHING,
      icon: <PlayCircleOutlined />,
      badge: t('landing.pillarTrackBadge'),
      title: t('landing.pillarTrackTitle'),
      count: null,
      desc: t('landing.pillarTrackDesc'),
      cta: t('landing.pillarTrackCta'),
      highlight: false,
    },
    {
      key: 'schedule',
      href: ROUTES.ESTRENOS,
      icon: <CalendarOutlined />,
      badge: t('landing.pillarScheduleBadge'),
      title: t('landing.pillarScheduleTitle'),
      count: null,
      desc: t('landing.pillarScheduleDesc'),
      cta: t('landing.pillarScheduleCta'),
      highlight: false,
    },
    {
      key: 'review',
      href: ROUTES.COMMUNITY,
      icon: <StarOutlined />,
      badge: t('landing.pillarReviewBadge'),
      title: t('landing.pillarReviewTitle'),
      count: null,
      desc: t('landing.pillarReviewDesc'),
      cta: t('landing.pillarReviewCta'),
      highlight: false,
    },
    {
      key: 'stats',
      href: ROUTES.ESTADISTICAS,
      icon: <BarChartOutlined />,
      badge: t('landing.pillarStatsBadge'),
      title: t('landing.pillarStatsTitle'),
      count: null,
      desc: t('landing.pillarStatsDesc'),
      cta: t('landing.pillarStatsCta'),
      highlight: false,
    },
  ];

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: ROUTES.WATCHING });
  };

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

  const accentIsAuto = !customAccent && accent === null;

  return (
    <div className="landing">
      <LoggedInHomeRedirect />

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
          <p className="landing__subtitle">{t('landing.heroSubtitle')}</p>
          <p className="landing__description">{t('landing.description')}</p>

          <div className="landing__actions">
            {session?.user ? (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={() => router.push(ROUTES.WATCHING)}
                className="landing__cta-primary"
              >
                {t('landing.ctaGoWatching')}
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={() => router.push(ROUTES.CATALOGO)}
                className="landing__cta-primary"
              >
                {t('landing.exploreCatalog')}
              </Button>
            )}

            <Button
              size="large"
              icon={<VideoCameraOutlined />}
              onClick={() => router.push(ROUTES.VER)}
            >
              {t('landing.offerWatchCta')}
              {(stats.watchableCount ?? 0) > 0
                ? ` (${(stats.watchableCount ?? 0).toLocaleString()})`
                : ''}
            </Button>

            {session?.user ? (
              <Button
                size="large"
                icon={<SearchOutlined />}
                onClick={() => router.push(ROUTES.CATALOGO)}
              >
                {t('landing.exploreCatalog')}
              </Button>
            ) : (
              <Button
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={() => router.push(ROUTES.WATCHING)}
              >
                {t('landing.ctaPrimary')}
              </Button>
            )}
          </div>

          {/* Sin cuenta vs Con cuenta / Preferencia de inicio si ya inició sesión */}
          {session?.user ? (
            <div className="landing__start-pref">
              <div className="landing__start-pref-row">
                <Tag color="success" className="landing__start-pref-tag">
                  {t('landing.loggedInBadge')}
                </Tag>
                <label
                  htmlFor="landing-start-page-select"
                  className="landing__start-pref-label"
                >
                  {t('landing.startPageInlineLabel')}
                </label>
                <Select
                  id="landing-start-page-select"
                  size="small"
                  value={startPage}
                  onChange={(value: StartPageOption) => {
                    setStartPage(value);
                    setStartPagePreference(value);
                  }}
                  className="landing__start-pref-select"
                  options={[
                    {
                      value: 'landing',
                      label: t('settings.startPageLanding'),
                    },
                    {
                      value: 'watching',
                      label: t('settings.startPageWatching'),
                    },
                    {
                      value: 'catalogo',
                      label: t('settings.startPageCatalogo'),
                    },
                    { value: 'ver', label: t('settings.startPageVer') },
                    {
                      value: 'estrenos',
                      label: t('settings.startPageEstrenos'),
                    },
                  ]}
                  aria-label={t('landing.startPageInlineLabel')}
                />
              </div>
              <p className="landing__start-pref-hint">
                {t('landing.startPageInlineHint')}
              </p>
            </div>
          ) : (
            <div className="landing__auth-card">
              <div className="landing__auth-cols">
                <div className="landing__auth-col">
                  <span className="landing__auth-col-title">
                    <CheckCircleFilled className="landing__auth-icon" />{' '}
                    {t('landing.authNoAccountTitle')}
                  </span>
                  <p className="landing__auth-col-desc">
                    {t('landing.authNoAccountDesc')}
                  </p>
                </div>
                <div className="landing__auth-col">
                  <span className="landing__auth-col-title">
                    <SafetyCertificateOutlined className="landing__auth-icon" />{' '}
                    {t('landing.authWithAccountTitle')}
                  </span>
                  <p className="landing__auth-col-desc">
                    {t('landing.authWithAccountDesc')}
                  </p>
                </div>
              </div>
              <div className="landing__auth-action">
                <Button
                  size="middle"
                  icon={<LoginOutlined />}
                  onClick={handleGoogleSignIn}
                >
                  {t('landing.authSignInGoogle')}
                </Button>
              </div>
            </div>
          )}
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

          <div className="landing__floating-chip landing__floating-chip--lang">
            <TranslationOutlined /> {t('landing.heroChipLanguages')}
          </div>
          <div className="landing__floating-chip landing__floating-chip--reviews">
            <CheckCircleFilled /> {t('landing.heroChipTracking')}
          </div>
        </div>
      </section>

      {/* Sin cuenta: lo que se dejo a mitad en este navegador. */}
      <ContinueWatchingRow />

      {/* ── Stats band + enlace a /estadisticas ── */}
      <section className="landing__stats">
        <div className="landing__stats-items">
          {statItems.map((item) => (
            <div key={item.label} className="landing__stat">
              <span className="landing__stat-icon">{item.icon}</span>
              <span className="landing__stat-value">
                {item.value.toLocaleString()}
              </span>
              <span className="landing__stat-label">{item.label}</span>
            </div>
          ))}
        </div>
        <Link href={ROUTES.ESTADISTICAS} className="landing__stats-cta">
          <BarChartOutlined /> {t('landing.statsExploreCta')}
        </Link>
      </section>

      {/* ── Mapa interactivo: Todo lo que podés hacer en MundoBL ── */}
      <section className="landing__offer" aria-labelledby="landing-offer-title">
        <h2 id="landing-offer-title" className="landing__offer-title">
          {t('landing.offerTitle')}
        </h2>
        <div className="landing__pillars-grid">
          {pillars.map((pillar) => (
            <Link
              key={pillar.key}
              href={pillar.href}
              className={`landing__offer-card${
                pillar.highlight ? ' landing__offer-card--watch' : ''
              }`}
            >
              <div className="landing__offer-card-top">
                <span className="landing__offer-icon" aria-hidden="true">
                  {pillar.icon}
                </span>
                <Tag
                  color={pillar.highlight ? 'magenta' : 'default'}
                  className="landing__offer-badge"
                >
                  {pillar.badge}
                </Tag>
              </div>
              <h3 className="landing__offer-card-title">{pillar.title}</h3>
              {pillar.count && (
                <span className="landing__offer-count">{pillar.count}</span>
              )}
              <p className="landing__offer-desc">{pillar.desc}</p>
              <span className="landing__offer-link">
                {pillar.cta} <ArrowRightOutlined />
              </span>
            </Link>
          ))}
        </div>
        <p className="landing__offer-note">{t('landing.offerNote')}</p>
      </section>

      {/* ── Probador en vivo: Temas, Skins, Colores y Modo Sin Spoilers ── */}
      <section className="landing__narrative-section landing__personalize">
        <div className="landing__personalize-card">
          <header className="landing__section-head landing__section-head--start">
            <span className="landing__section-eyebrow">
              <BgColorsOutlined /> {t('landing.personalizeEyebrow')}
            </span>
            <h2 className="landing__section-title">
              {t('landing.personalizeTitle')}
            </h2>
            <p className="landing__section-subtitle">
              {t('landing.personalizeSubtitle')}
            </p>
          </header>

          <div className="landing__personalize-controls">
            {/* Fila 1: Tema Claro/Oscuro + Modo sin spoilers + Idioma */}
            <div className="landing__personalize-top-row">
              <div className="landing__personalize-group">
                <span className="landing__personalize-label">
                  {t('settings.themeLabel')}
                </span>
                <Segmented
                  value={theme}
                  onChange={(v) => setTheme(v as 'light' | 'dark')}
                  options={[
                    { value: 'light', label: t('settings.themeLight') },
                    { value: 'dark', label: t('settings.themeDark') },
                  ]}
                />
              </div>

              <div className="landing__personalize-group">
                <span className="landing__personalize-label">
                  {t('settings.toneLabel')}
                </span>
                <Segmented
                  value={tone}
                  onChange={(v) => setTone(v as ToneKey)}
                  options={[
                    { value: 'default', label: t('settings.toneDefault') },
                    { value: 'warm', label: t('settings.toneWarm') },
                    { value: 'cool', label: t('settings.toneCool') },
                    { value: 'contrast', label: t('settings.toneContrast') },
                  ]}
                />
              </div>

              <div className="landing__personalize-group">
                <span className="landing__personalize-label">
                  {t('settings.spoilerFreeLabel')}
                </span>
                <div className="landing__personalize-switch-row">
                  <Switch
                    checked={spoilerFree}
                    onChange={setSpoilerFree}
                    aria-label={t('settings.spoilerFreeLabel')}
                  />
                  <span className="landing__personalize-switch-text">
                    {t('landing.novedadSpoilerTag')}
                  </span>
                </div>
              </div>

              <div className="landing__personalize-group">
                <span className="landing__personalize-label">
                  {t('settings.sectionLanguage')}
                </span>
                <Select
                  size="middle"
                  value={locale}
                  onChange={setLocale}
                  className="landing__personalize-lang-select"
                  options={SUPPORTED_LOCALES.map((code) => ({
                    value: code,
                    label: LOCALE_LABELS[code],
                  }))}
                  aria-label={t('common.language')}
                />
              </div>
            </div>

            {/* Fila 2: Galería de 6 Skins en vivo */}
            <div className="landing__personalize-group">
              <span className="landing__personalize-label">
                {t('settings.skinLabel')}
              </span>
              <div
                className="landing__skins-grid"
                role="radiogroup"
                aria-label={t('settings.skinLabel')}
              >
                {SKIN_OPTIONS.map((opt) => {
                  const isActive = skin === opt.key;
                  const swatches = getSkinSwatches(opt.key, theme);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={`landing__skin-btn${
                        isActive ? ' landing__skin-btn--active' : ''
                      }`}
                      onClick={() => setSkin(opt.key)}
                    >
                      <div className="landing__skin-btn-head">
                        <span className="landing__skin-btn-name">
                          {t(opt.nameKey)}
                        </span>
                        <span className="landing__skin-swatches">
                          {swatches.map((colorHex, idx) => (
                            <span
                              key={idx}
                              className="landing__skin-swatch"
                              style={{ background: colorHex }}
                            />
                          ))}
                        </span>
                      </div>
                      <span className="landing__skin-btn-desc">
                        {t(opt.descKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fila 3: Colores de acento + Botón para abrir todos los ajustes */}
            <div className="landing__personalize-bottom-row">
              <div className="landing__personalize-group">
                <span className="landing__personalize-label">
                  {t('settings.accentLabel')}
                </span>
                <div
                  className="landing__accent-list"
                  role="radiogroup"
                  aria-label={t('settings.accentLabel')}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={accentIsAuto}
                    title={t('settings.accentAuto')}
                    aria-label={t('settings.accentAuto')}
                    onClick={() => setAccent(null)}
                    className={`landing__accent-dot landing__accent-dot--auto${
                      accentIsAuto ? ' landing__accent-dot--active' : ''
                    }`}
                  >
                    A
                  </button>
                  {(Object.keys(ACCENT_PRESETS) as AccentPresetKey[]).map(
                    (key) => {
                      const preset = ACCENT_PRESETS[key];
                      const isActive = !customAccent && accent === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          title={preset.name}
                          aria-label={preset.name}
                          onClick={() => setAccent(key)}
                          className={`landing__accent-dot${
                            isActive ? ' landing__accent-dot--active' : ''
                          }`}
                          style={{ background: preset.swatch }}
                        />
                      );
                    }
                  )}
                </div>
              </div>

              <Button
                icon={<SettingOutlined />}
                onClick={() => setSettingsOpen(true)}
              >
                {t('landing.personalizeOpenAll')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Parrilla semanal de emision ── */}
      {stats.airingSchedule && stats.airingSchedule.length > 0 && (
        <section className="landing__estrenos">
          <SectionHeader
            title={t('estrenos.title')}
            subtitle={t('estrenos.subtitle')}
            icon={<CalendarOutlined />}
            actions={
              <Link href={ROUTES.ESTRENOS} className="landing__estrenos-link">
                {t('estrenos.seeAll')} →
              </Link>
            }
          />
          <WeeklySchedule
            rows={stats.airingSchedule}
            labels={scheduleLabels}
            maxPerDay={4}
          />
        </section>
      )}

      {/* ── Watchable series carousel ── */}
      {stats.watchableSeries && stats.watchableSeries.length > 0 && (
        <section className="landing__watchable">
          <WatchableCarousel
            items={stats.watchableSeries}
            title={t('novedades.watchHereTitle')}
          />
        </section>
      )}

      {/* ── Personal Tracker, Diary & Feedback Loop ── */}
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

              <div className="landing__tracker-feature-item">
                <div className="landing__tracker-feature-icon">
                  <StarOutlined />
                </div>
                <div>
                  <h3 className="landing__tracker-feature-title">
                    {t('landing.trackerFeature4Title')}
                  </h3>
                  <p className="landing__tracker-feature-desc">
                    {t('landing.trackerFeature4Desc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="landing__tracker-actions">
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={() => router.push(ROUTES.WATCHING)}
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

              <div className="landing__tracker-card-rating">
                <StarOutlined />
                <span>{t('landing.trackerMockRatingLabel')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest series teaser ── */}
      {stats.latestSeries.length > 0 && (
        <section className="landing__latest">
          <header className="landing__section-head">
            <div>
              <h2 className="landing__section-title">
                {t('landing.latestSeriesTitle')}
              </h2>
              {(stats.newThisWeek ?? 0) > 0 && (
                <p className="landing__section-note">
                  {t('landing.latestSeriesThisWeek', {
                    n: stats.newThisWeek ?? 0,
                  })}
                </p>
              )}
            </div>
            <Link href={ROUTES.NOVEDADES} className="landing__section-link">
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

      {/* ── Cultural Glossary & Quiz ── */}
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
                "Tratamiento de respeto y cercanía hacia alguien mayor (P') o menor (N'). Fundamental para entender dinámicas y afecto en el BL tailandés."}
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

      {/* ── Curated Industry News ── */}
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

      {/* ── Open Ecosystem & Collaborators ── */}
      <section className="landing__narrative-section landing__ecosystem">
        <header className="landing__section-head">
          <span className="landing__section-eyebrow">
            🤝 {t('landing.ecosystemEyebrow')}
          </span>
          <h2 className="landing__section-title">
            {t('landing.ecosystemTitle')}
          </h2>
          <p className="landing__section-subtitle">
            {t('landing.ecosystemIntro')}
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
              <SafetyCertificateOutlined />
            </div>
            <h3 className="landing__ecosystem-card-title">
              {t('landing.ecosystemOfficialTitle')}
            </h3>
            <p className="landing__ecosystem-card-desc">
              {t('landing.ecosystemOfficialDesc')}
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
          <Link
            href={`${ROUTES.FEEDBACK}?type=idea&title=${encodeURIComponent(
              t('landing.ecosystemCta')
            )}`}
          >
            <Button size="large" icon={<TeamOutlined />}>
              {t('landing.ecosystemCta')}
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="landing__footer-cta">
        <p className="landing__footer-cta-text">{t('landing.footerCtaText')}</p>
        <div className="landing__footer-cta-actions">
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={() => router.push(ROUTES.CATALOGO)}
          >
            {t('landing.exploreCatalog')}
          </Button>
          <Button
            size="large"
            icon={<VideoCameraOutlined />}
            onClick={() => router.push(ROUTES.VER)}
          >
            {t('landing.offerWatchCta')}
          </Button>
        </div>
      </section>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
