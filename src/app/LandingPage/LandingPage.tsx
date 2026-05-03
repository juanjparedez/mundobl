'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import {
  SearchOutlined,
  LoginOutlined,
  StarOutlined,
  CommentOutlined,
  BarChartOutlined,
  HeartOutlined,
  PlayCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { signIn, useSession } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './LandingPage.css';

interface LandingStats {
  totalSeries: number;
  totalCompletedViews: number;
  totalPublicComments: number;
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
  ];

  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="landing__hero">
        <div className="landing__hero-content">
          <div className="landing__logo">
            <Image
              src="/images/landing.png"
              alt="MundoBL"
              width={100}
              height={100}
              priority
              quality={85}
            />
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

        <div className="landing__hero-visual" aria-hidden>
          <Image
            src="/images/landing.png"
            alt=""
            width={480}
            height={480}
            quality={80}
            className="landing__hero-image"
          />
          <div className="landing__hero-glow" />
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
