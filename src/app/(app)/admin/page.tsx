export const dynamic = 'force-dynamic';

import {
  TagsOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  UserOutlined,
} from '@/lib/client-icons';
import { prisma } from '@/lib/database';
import { AdminHomeClient } from './AdminHomeClient';
import type { AdminShortcutMetric } from './AdminShortcuts/AdminShortcuts';
import './admin.css';
import './admin-dashboard.css';

interface DashboardCounts {
  series: number;
  seriesWithoutReview: number;
  seriesWithoutContent: number;
  reviews: number;
  reviewsHidden: number;
  comments: number;
  commentsReported: number;
  users: number;
  actors: number;
  directors: number;
  productionCompanies: number;
  tags: number;
  universes: number;
  changelogItems: number;
  embeddableContent: number;
  recommendedSites: number;
  suggestedSitesPending: number;
}

async function loadCounts(): Promise<DashboardCounts> {
  const [
    series,
    seriesWithoutReview,
    seriesWithoutContent,
    reviews,
    reviewsHidden,
    comments,
    commentsReported,
    users,
    actors,
    directors,
    productionCompanies,
    tags,
    universes,
    changelogItems,
    embeddableContent,
    recommendedSites,
    suggestedSitesPending,
  ] = await Promise.all([
    prisma.series.count(),
    prisma.series.count({
      where: { reviews: { none: { status: 'PUBLISHED' } } },
    }),
    prisma.series.count({ where: { embeddableContent: { none: {} } } }),
    prisma.review.count({ where: { status: 'PUBLISHED' } }),
    prisma.review.count({ where: { status: 'HIDDEN' } }),
    prisma.comment.count({ where: { isPrivate: false } }),
    prisma.comment.count({ where: { reportCount: { gt: 0 } } }),
    prisma.user.count(),
    prisma.actor.count(),
    prisma.director.count(),
    prisma.productionCompany.count(),
    prisma.tag.count(),
    prisma.universe.count(),
    prisma.changelogItem.count(),
    prisma.embeddableContent.count(),
    prisma.recommendedSite.count(),
    prisma.suggestedSite.count({ where: { status: 'pendiente' } }),
  ]);

  return {
    series,
    seriesWithoutReview,
    seriesWithoutContent,
    reviews,
    reviewsHidden,
    comments,
    commentsReported,
    users,
    actors,
    directors,
    productionCompanies,
    tags,
    universes,
    changelogItems,
    embeddableContent,
    recommendedSites,
    suggestedSitesPending,
  };
}

export default async function AdminLandingPage() {
  const counts = await loadCounts();

  // Solo metricas, indexadas por el id del destino. Que destinos existen,
  // como se llaman y en que grupo viven lo decide adminDestinations —
  // esta pagina ya no duplica el mapa de sitio ni escribe titulos.
  const metrics: Record<string, AdminShortcutMetric | undefined> = {
    series: {
      count: counts.series,
      alert:
        counts.seriesWithoutReview > 0
          ? {
              count: counts.seriesWithoutReview,
              labelKey: 'adminShortcuts.alertWithoutReview',
            }
          : undefined,
    },
    content: {
      count: counts.embeddableContent,
      alert:
        counts.seriesWithoutContent > 0
          ? {
              count: counts.seriesWithoutContent,
              labelKey: 'adminShortcuts.alertWithoutContent',
            }
          : undefined,
    },
    sites: {
      count: counts.recommendedSites,
      alert:
        counts.suggestedSitesPending > 0
          ? {
              count: counts.suggestedSitesPending,
              labelKey: 'adminShortcuts.alertPendingSites',
            }
          : undefined,
    },
    comments: {
      count: counts.comments,
      alert:
        counts.commentsReported > 0
          ? {
              count: counts.commentsReported,
              labelKey: 'adminShortcuts.alertReported',
            }
          : undefined,
    },
    reviews: {
      count: counts.reviews,
      alert:
        counts.reviewsHidden > 0
          ? {
              count: counts.reviewsHidden,
              labelKey: 'adminShortcuts.alertHiddenReviews',
            }
          : undefined,
    },
    tags: { count: counts.tags },
    universes: { count: counts.universes },
    actors: { count: counts.actors },
    directors: { count: counts.directors },
    'production-companies': { count: counts.productionCompanies },
    users: { count: counts.users },
    changelog: { count: counts.changelogItems },
  };

  // Hero stats: inventario del catalogo (complementario al AdminKPIsWidget,
  // que muestra actividad: series/reseñas/comentarios/usuarios). Si los
  // dos espacios mostraban los mismos numeros se sentia duplicado.
  const heroStats = [
    {
      label: 'Tags',
      value: counts.tags,
      icon: <TagsOutlined />,
    },
    {
      label: 'Universos',
      value: counts.universes,
      icon: <GlobalOutlined />,
    },
    {
      label: 'Directores',
      value: counts.directors,
      icon: <VideoCameraOutlined />,
    },
    {
      label: 'Actores',
      value: counts.actors,
      icon: <UserOutlined />,
    },
  ];

  const kpiCounts = {
    series: counts.series,
    reviews: counts.reviews,
    comments: counts.comments,
    users: counts.users,
    seriesWithoutReview: counts.seriesWithoutReview,
    seriesWithoutContent: counts.seriesWithoutContent,
    commentsReported: counts.commentsReported,
    suggestedSitesPending: counts.suggestedSitesPending,
  };

  return (
    <>
      <AdminHomeClient
        heroStats={heroStats}
        metrics={metrics}
        kpiCounts={kpiCounts}
      />
    </>
  );
}
