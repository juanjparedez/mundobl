'use client';

import { useState } from 'react';
import { Tag, Radio, Tooltip } from 'antd';
import {
  SafetyCertificateOutlined,
  CheckOutlined,
  GlobalOutlined,
  TranslationOutlined,
  FireOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { STREAMING_PLATFORMS } from '@/data/streaming-platforms';
import './plataformas.css';

export function PlataformasClient() {
  const [filter, setFilter] = useState<'all' | 'uncut' | 'free' | 'no-vpn'>(
    'all'
  );

  const filteredPlatforms = STREAMING_PLATFORMS.filter((p) => {
    if (filter === 'uncut') return p.uncutAvailable;
    if (filter === 'free') return p.freeTier;
    if (filter === 'no-vpn') return !p.vpnRequiredLatam;
    return true;
  });

  return (
    <div className="plataformas-container">
      {/* Hero explicativo */}
      <header className="plataformas-hero">
        <div className="plataformas-hero__badge">
          <SafetyCertificateOutlined /> Fuentes Oficiales & Arbitraje
        </div>
        <h1 className="plataformas-hero__title">
          Comparador de Plataformas & Suscripciones
        </h1>
        <p className="plataformas-hero__subtitle">
          El ecosistema BL/GL está dividido entre varios servicios. Acá tenés
          una guía transparente con precios reales, versiones sin censura
          (Uncut), subtítulos en español y qué conviene contratar según tus
          gustos.
        </p>

        {/* Filtros rápidos */}
        <div className="plataformas-filters">
          <Radio.Group
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="all">
              Todas ({STREAMING_PLATFORMS.length})
            </Radio.Button>
            <Radio.Button value="free">Con opción Gratis</Radio.Button>
            <Radio.Button value="uncut">
              Versiones Uncut (Sin censura)
            </Radio.Button>
            <Radio.Button value="no-vpn">
              Sin VPN (Disponibles en LATAM/ES)
            </Radio.Button>
          </Radio.Group>
        </div>
      </header>

      {/* Grid de Plataformas */}
      <div className="plataformas-grid">
        {filteredPlatforms.map((platform) => (
          <div key={platform.id} className="plataforma-card">
            <div
              className="plataforma-card__header"
              style={{ borderTopColor: platform.color }}
            >
              <div className="plataforma-card__title-row">
                <h2
                  className="plataforma-card__name"
                  style={{ color: platform.color }}
                >
                  {platform.name}
                </h2>
                <a
                  href={platform.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="plataforma-card__visit-btn"
                  style={{ borderColor: platform.color, color: platform.color }}
                >
                  Visitar web <LinkOutlined />
                </a>
              </div>
              <p className="plataforma-card__tagline">{platform.tagline}</p>
            </div>

            {/* Badges de prestaciones */}
            <div className="plataforma-card__badges">
              {platform.uncutAvailable && (
                <Tag color="magenta" icon={<FireOutlined />}>
                  Versión Uncut (Sin Censura)
                </Tag>
              )}
              {platform.freeTier && (
                <Tag color="green" icon={<DollarOutlined />}>
                  Plan Gratis disponible
                </Tag>
              )}
              {platform.spanishSubs && (
                <Tag color="blue" icon={<TranslationOutlined />}>
                  Subtítulos en Español
                </Tag>
              )}
              <Tag color="cyan" icon={<GlobalOutlined />}>
                Calidad: {platform.maxQuality}
              </Tag>
            </div>

            <p className="plataforma-card__desc">{platform.description}</p>

            {/* Veredicto / Para qué es ideal */}
            <div className="plataforma-card__best-for">
              <ThunderboltOutlined className="plataforma-card__best-for-icon" />
              <div>
                <strong>Ideal para:</strong> {platform.bestFor}
              </div>
            </div>

            {/* Planes y Precios */}
            <div className="plataforma-card__plans-section">
              <h3 className="plataforma-card__plans-title">
                Planes y Precios:
              </h3>
              <div className="plataforma-card__plans-grid">
                {platform.plans.map((plan, idx) => (
                  <div key={idx} className="plataforma-plan-box">
                    <div className="plataforma-plan-box__head">
                      <span className="plataforma-plan-box__name">
                        {plan.name}
                      </span>
                      <span className="plataforma-plan-box__price">
                        {plan.price}
                        <small>/{plan.period}</small>
                      </span>
                    </div>
                    <ul className="plataforma-plan-box__features">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx}>
                          <CheckOutlined className="plataforma-plan-box__check" />{' '}
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights destacados */}
            <div className="plataforma-card__highlights">
              {platform.highlights.map((h, hIdx) => (
                <span key={hIdx} className="plataforma-highlight-chip">
                  ✓ {h}
                </span>
              ))}
            </div>

            {/* Aviso de Afiliado sutil y con clase */}
            {platform.hasAffiliateProgram ? (
              <div className="plataforma-card__affiliate-tag">
                <Tooltip title={platform.affiliateDisclaimer}>
                  <Tag
                    color="purple"
                    style={{ fontSize: '0.75rem', cursor: 'help' }}
                  >
                    🤝 Enlace de afiliado oficial
                  </Tag>
                </Tooltip>
              </div>
            ) : (
              <div className="plataforma-card__affiliate-tag">
                <Tag color="default" style={{ fontSize: '0.75rem' }}>
                  🌐 Enlace oficial directo
                </Tag>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Manifiesto de Transparencia Ética */}
      <div className="plataformas-transparency-note">
        <SafetyCertificateOutlined className="plataformas-transparency-note__icon" />
        <div className="plataformas-transparency-note__text">
          <strong>Transparencia de MundoBL:</strong> Algunos enlaces de
          streaming son programas de afiliados oficiales autorizados. Si decidís
          contratar un plan a través de ellos, la plataforma destina una pequeña
          comisión para ayudarnos a cubrir los servidores de MundoBL, sin que
          vos pagues un solo centavo extra. Siempre priorizamos las opciones
          gratuitas y legales por encima de cualquier otra.
        </div>
      </div>

      {/* Guía de Arbitraje / Preguntas Frecuentes */}
      <section className="plataformas-faq">
        <h2 className="plataformas-faq__title">
          <InfoCircleOutlined /> Guía de Arbitraje: ¿Dónde ver cada tipo de
          serie?
        </h2>
        <div className="plataformas-faq__cards">
          <div className="plataformas-faq__card">
            <h3>🇹🇭 Series Tailandesas de GMMTV, Mandee y Wabi Sabi</h3>
            <p>
              La gran mayoría se emiten{' '}
              <strong>gratis y completas en YouTube oficial</strong> semana a
              semana con subtítulos en español. Si querés ver la versión
              extendida sin censura (Uncut), habitualmente se publica en{' '}
              <strong>iQIYI VIP</strong> o <strong>GagaOOLala VIP</strong>.
            </p>
          </div>

          <div className="plataformas-faq__card">
            <h3>🇰🇷 K-Dramas y BLs Coreanos</h3>
            <p>
              Los K-BLs suelen estrenarse en <strong>Rakuten Viki</strong> o{' '}
              <strong>GagaOOLala</strong>. Para películas independientes de
              autor (como las de <em>Strongberry</em>), el mejor lugar es{' '}
              <strong>Vimeo On Demand</strong>, donde compras el título
              individual y apoyas directo a la productora.
            </p>
          </div>

          <div className="plataformas-faq__card">
            <h3>🇹🇼 BLs Taiwaneses y Japoneses</h3>
            <p>
              Taiwán y Japón apuestan fuertemente por{' '}
              <strong>GagaOOLala</strong> y <strong>Rakuten Viki</strong> para
              su distribución mundial con traducción oficial y sin cortes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
