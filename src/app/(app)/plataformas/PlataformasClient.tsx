'use client';
import { isGagaUrl, recordPilotClick } from '@/lib/pilot-clicks';

import { useState } from 'react';
import { Radio, Tag } from 'antd';
import { SafetyCertificateOutlined, LinkOutlined } from '@ant-design/icons';
import { STREAMING_PLATFORMS } from '@/data/streaming-platforms';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './plataformas.css';

export function PlataformasClient() {
  const { t, locale } = useLocale();
  const [filter, setFilter] = useState<'all' | 'observed' | 'consult'>('all');
  const platforms = STREAMING_PLATFORMS.filter(
    (p) => filter === 'all' || p.pricing.status === filter
  );
  return (
    <div className="plataformas-container">
      <header className="plataformas-hero">
        <div className="plataformas-hero__badge">
          <SafetyCertificateOutlined /> {t('platformGuide.badge')}
        </div>
        <h1 className="plataformas-hero__title">{t('platformGuide.title')}</h1>
        <p className="plataformas-hero__subtitle">{t('platformGuide.intro')}</p>
        <div className="plataformas-filters">
          <Radio.Group
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="all">{t('platformGuide.all')}</Radio.Button>
            <Radio.Button value="observed">
              {t('platformGuide.observed')}
            </Radio.Button>
            <Radio.Button value="consult">
              {t('platformGuide.consult')}
            </Radio.Button>
          </Radio.Group>
        </div>
      </header>
      <div className="plataformas-transparency-note">
        <SafetyCertificateOutlined className="plataformas-transparency-note__icon" />
        <p className="plataformas-transparency-note__text">
          {t('platformGuide.transparency')}
        </p>
      </div>
      <div className="plataformas-grid">
        {platforms.map((platform) => (
          <article
            key={platform.id}
            className="plataforma-card"
            aria-labelledby={`platform-${platform.id}`}
          >
            <header className="plataforma-card__header">
              <h2
                id={`platform-${platform.id}`}
                className="plataforma-card__name"
              >
                {platform.name}
              </h2>
              <p className="plataforma-card__desc">
                {t(`platformGuide.${platform.descriptionKey}`)}
              </p>
            </header>
            <div>
              <Tag>
                {t(
                  platform.pricing.status === 'observed'
                    ? 'platformGuide.observed'
                    : platform.pricing.status === 'closing'
                      ? 'platformGuide.closing'
                      : 'platformGuide.consult'
                )}
              </Tag>
            </div>
            <dl className="plataforma-card__evidence">
              <div>
                <dt>{t('platformGuide.reviewed')}</dt>
                <dd>
                  <time dateTime={platform.reviewedOn}>
                    {platform.reviewedOn}
                  </time>
                </dd>
              </div>
              <div>
                <dt>{t('platformGuide.country')}</dt>
                <dd>
                  {platform.country === 'AR'
                    ? t('platformGuide.argentina')
                    : t('platformGuide.unknownCountry')}
                </dd>
              </div>
              <div>
                <dt>{t('platformGuide.channel')}</dt>
                <dd>{t('platformGuide.web')}</dd>
              </div>
            </dl>
            {platform.pricing.status === 'observed' ? (
              <>
                <div className="plataforma-card__plans-grid">
                  {platform.pricing.plans.map((plan) => (
                    <div
                      key={`${plan.name}-${plan.months}`}
                      className="plataforma-plan-box"
                    >
                      <span className="plataforma-plan-box__name">
                        {plan.name}
                      </span>
                      <span className="plataforma-plan-box__price">
                        {new Intl.NumberFormat(locale, {
                          style: 'currency',
                          currency: plan.currency,
                          currencyDisplay: 'code',
                        }).format(plan.amount)}
                      </span>
                      <span>
                        {t('platformGuide.period', { months: plan.months })}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="plataforma-card__desc">
                  {t('platformGuide.taxNote')}
                </p>
              </>
            ) : (
              <p className="plataforma-card__desc">
                {t(
                  platform.pricing.status === 'closing'
                    ? 'platformGuide.vimeoNotice'
                    : 'platformGuide.unconfirmed'
                )}
              </p>
            )}
            <a
              href={platform.sourceUrl}
              onClick={() => {
                if (isGagaUrl(platform.sourceUrl))
                  recordPilotClick('platforms');
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="plataforma-card__visit-btn"
            >
              {t('platformGuide.source')} <LinkOutlined />
            </a>
          </article>
        ))}
      </div>
      <p className="plataforma-card__desc">{t('platformGuide.availability')}</p>
    </div>
  );
}
