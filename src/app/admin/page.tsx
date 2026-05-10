export const dynamic = 'force-dynamic';

import {
  AppstoreOutlined,
  ReadOutlined,
  MessageOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { prisma } from '@/lib/database';
import { AdminHomeClient } from './AdminHomeClient';
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

interface ToolCard {
  href: string;
  icon: string;
  title: string;
  count?: number;
  alert?: { count: number; label: string };
}

interface ToolGroup {
  title: string;
  tools: ToolCard[];
}

export default async function AdminLandingPage() {
  const counts = await loadCounts();

  const groups: ToolGroup[] = [
    {
      title: 'Catálogo',
      tools: [
        {
          href: '/admin/series',
          icon: '🎬',
          title: 'Series',
          count: counts.series,
          alert:
            counts.seriesWithoutReview > 0
              ? { count: counts.seriesWithoutReview, label: 'sin reseña' }
              : undefined,
        },
        {
          href: '/admin/series/importar',
          icon: '📥',
          title: 'Importar serie (YouTube)',
        },
        {
          href: '/admin/tags',
          icon: '🏷️',
          title: 'Tags',
          count: counts.tags,
        },
        {
          href: '/admin/universos',
          icon: '🌐',
          title: 'Universos',
          count: counts.universes,
        },
        {
          href: '/admin/actores',
          icon: '👤',
          title: 'Actores',
          count: counts.actors,
        },
        {
          href: '/admin/directores',
          icon: '🎥',
          title: 'Directores',
          count: counts.directors,
        },
        {
          href: '/admin/productoras',
          icon: '🏛️',
          title: 'Productoras',
          count: counts.productionCompanies,
        },
        { href: '/admin/idiomas', icon: '🗣️', title: 'Idiomas' },
      ],
    },
    {
      title: 'Comunidad',
      tools: [
        {
          href: '/admin/usuarios',
          icon: '👥',
          title: 'Usuarios',
          count: counts.users,
        },
        {
          href: '/admin/contenido',
          icon: '▶️',
          title: 'Contenido',
          count: counts.embeddableContent,
          alert:
            counts.seriesWithoutContent > 0
              ? {
                  count: counts.seriesWithoutContent,
                  label: 'series sin contenido',
                }
              : undefined,
        },
        {
          href: '/admin/sitios',
          icon: '🔗',
          title: 'Sitios',
          count: counts.recommendedSites,
          alert:
            counts.suggestedSitesPending > 0
              ? {
                  count: counts.suggestedSitesPending,
                  label: 'sugeridos pendientes',
                }
              : undefined,
        },
        {
          href: '/admin/comentarios',
          icon: '💬',
          title: 'Comentarios',
          count: counts.comments,
          alert:
            counts.commentsReported > 0
              ? { count: counts.commentsReported, label: 'reportados' }
              : undefined,
        },
        {
          href: '/admin/resenas',
          icon: '📖',
          title: 'Reseñas',
          count: counts.reviews,
          alert:
            counts.reviewsHidden > 0
              ? { count: counts.reviewsHidden, label: 'ocultas' }
              : undefined,
        },
      ],
    },
    {
      title: 'Sistema',
      tools: [
        { href: '/admin/info', icon: 'ℹ️', title: 'Info del proyecto' },
        { href: '/admin/logs', icon: '📋', title: 'Logs de acceso' },
        {
          href: '/admin/changelog',
          icon: '📝',
          title: 'Changelog',
          count: counts.changelogItems,
        },
        { href: '/admin/stats', icon: '📊', title: 'Estadísticas' },
      ],
    },
  ];

  const headlineAlerts = [
    counts.commentsReported > 0 && {
      key: 'reports',
      icon: '🚩',
      label: `${counts.commentsReported} comentarios reportados`,
      href: '/admin/comentarios',
      tone: 'danger' as const,
    },
    counts.suggestedSitesPending > 0 && {
      key: 'pending-sites',
      icon: '📨',
      label: `${counts.suggestedSitesPending} sitios sugeridos esperando revisión`,
      href: '/admin/sitios',
      tone: 'warning' as const,
    },
    counts.seriesWithoutReview > 0 && {
      key: 'no-review',
      icon: '✍️',
      label: `${counts.seriesWithoutReview} series sin reseña`,
      href: '/admin/resenas',
      tone: 'info' as const,
    },
  ].filter(Boolean) as Array<{
    key: string;
    icon: string;
    label: string;
    href: string;
    tone: 'danger' | 'warning' | 'info';
  }>;

  const heroStats = [
    {
      label: 'Series',
      value: counts.series,
      icon: <AppstoreOutlined />,
    },
    {
      label: 'Reseñas',
      value: counts.reviews,
      icon: <ReadOutlined />,
    },
    {
      label: 'Comentarios',
      value: counts.comments,
      icon: <MessageOutlined />,
    },
    {
      label: 'Usuarios',
      value: counts.users,
      icon: <TeamOutlined />,
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
    <AppLayout>
      <AdminHomeClient
        heroStats={heroStats}
        groups={groups}
        headlineAlerts={headlineAlerts}
        kpiCounts={kpiCounts}
      />
    </AppLayout>
  );
}
