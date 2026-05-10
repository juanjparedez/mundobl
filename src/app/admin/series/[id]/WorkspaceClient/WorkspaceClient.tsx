'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, Button, Tag, Rate } from 'antd';
import {
  EditOutlined,
  StarFilled,
  CalendarOutlined,
  GlobalOutlined,
  ArrowLeftOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { getSeriesById } from '@/lib/database';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import './WorkspaceClient.css';

// Tipo derivado del helper para no duplicar el shape. Se actualiza
// automaticamente si getSeriesById cambia sus includes.
type WorkspaceSerie = NonNullable<Awaited<ReturnType<typeof getSeriesById>>>;

export interface WorkspaceClientProps {
  serie: WorkspaceSerie;
}

/** Workspace admin del catalogo (mock style-guide/catalogo.png).
 *  Layout: Hero compacto + Tabs + content. RightRail y Footer 4-cols
 *  en commits siguientes. La vista publica de la serie sigue siendo
 *  /catalogo/[id] con SerieDetailClient — esta es la vista de
 *  administracion densa. */
export function WorkspaceClient({ serie }: WorkspaceClientProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState('overview');

  const seasonCount = serie.seasons?.length ?? 0;
  const episodeCount = serie.seasons?.reduce(
    (acc, s) => acc + (s.episodes?.length ?? 0),
    0
  );
  const reviewCount = 0; // TODO: cargar reviews count cuando este endpoint
  const ratingValue = serie.overallRating
    ? Math.round((serie.overallRating / 10) * 50) / 10
    : null;

  const tabs = [
    {
      key: 'overview',
      label: t('workspace.tabOverview'),
      children: (
        <div className="mb-workspace__placeholder">
          {/* TODO commit siguiente: contenido real del tab Resumen */}
          <p>{t('workspace.tabOverviewPlaceholder')}</p>
        </div>
      ),
    },
    {
      key: 'analysis',
      label: t('workspace.tabAnalysis'),
      children: (
        <div className="mb-workspace__placeholder">
          <p>{t('workspace.tabAnalysisPlaceholder')}</p>
        </div>
      ),
    },
    {
      key: 'notes',
      label: t('workspace.tabNotes'),
      children: (
        <div className="mb-workspace__placeholder">
          <p>{t('workspace.tabNotesPlaceholder')}</p>
        </div>
      ),
    },
    {
      key: 'data',
      label: t('workspace.tabData'),
      children: (
        <div className="mb-workspace__placeholder">
          <p>{t('workspace.tabDataPlaceholder')}</p>
        </div>
      ),
    },
    {
      key: 'reviews',
      label: t('workspace.tabReviews'),
      children: (
        <div className="mb-workspace__placeholder">
          <p>{t('workspace.tabReviewsPlaceholder')}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="mb-workspace">
      <div className="mb-workspace__breadcrumb">
        <Link href="/catalogo">
          <Button type="text" size="small" icon={<ArrowLeftOutlined />}>
            {t('workspace.backToCatalog')}
          </Button>
        </Link>
        <Link href={`/catalogo/${serie.id}`}>
          <Button type="text" size="small" icon={<AppstoreOutlined />}>
            {t('workspace.viewPublic')}
          </Button>
        </Link>
      </div>

      {/* Hero compacto: poster + meta + rating + acciones admin */}
      <header className="mb-workspace__hero">
        {serie.imageUrl ? (
          <div className="mb-workspace__poster">
            <Image
              src={serie.imageUrl}
              alt={serie.title}
              width={160}
              height={224}
              sizes="160px"
              unoptimized={!isSupabaseImageUrl(serie.imageUrl)}
            />
          </div>
        ) : null}

        <div className="mb-workspace__hero-info">
          <h1 className="mb-workspace__title">{serie.title}</h1>
          {serie.originalTitle && (
            <p className="mb-workspace__original-title">
              {serie.originalTitle}
            </p>
          )}
          <div className="mb-workspace__badges">
            <Tag color="purple">{serie.type}</Tag>
            {serie.year && <Tag icon={<CalendarOutlined />}>{serie.year}</Tag>}
            {serie.country?.name && (
              <Tag icon={<GlobalOutlined />}>{serie.country.name}</Tag>
            )}
            {seasonCount > 0 && (
              <Tag>
                {seasonCount} {t('workspace.metaSeasons')}
              </Tag>
            )}
            {episodeCount > 0 && (
              <Tag>
                {episodeCount} {t('workspace.metaEpisodes')}
              </Tag>
            )}
            {serie.notesPrivate && (
              <Tag color="warning">{t('workspace.metaPrivateNotes')}</Tag>
            )}
          </div>

          {ratingValue !== null && (
            <div className="mb-workspace__rating">
              <StarFilled className="mb-workspace__rating-star" />
              <span className="mb-workspace__rating-value">
                {ratingValue.toFixed(1)}
              </span>
              <Rate
                disabled
                value={ratingValue}
                allowHalf
                className="mb-workspace__rating-stars"
              />
              {reviewCount > 0 && (
                <span className="mb-workspace__rating-count">
                  ({reviewCount} {t('workspace.metaReviews')})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mb-workspace__actions">
          <Link href={`/admin/series/${serie.id}/editar`}>
            <Button type="primary" icon={<EditOutlined />}>
              {t('workspace.actionEdit')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Tabs principales */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs}
        className="mb-workspace__tabs"
        size="large"
      />
    </div>
  );
}
