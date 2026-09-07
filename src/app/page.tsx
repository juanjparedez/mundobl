import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import type { WebSite } from 'schema-dts';
import { LandingPage } from './LandingPage/LandingPage';
import { prisma } from '@/lib/database';
import { getAutoThumbnailUrl, type Platform } from '@/lib/embed-helpers';
import {
  HAS_WATCHABLE_EPISODE,
  WATCHABLE_EPISODE_WHERE,
} from '@/lib/watchable';

export const revalidate = 300; // revalidar stats cada 5 min

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

async function getLandingStats() {
  try {
    const [
      totalSeries,
      totalCompletedViews,
      totalPublicComments,
      totalReviews,
      latestSeries,
      featuredReview,
      watchableSeries,
      totalGlossaryTerms,
      featuredGlossaryTerm,
      latestNews,
    ] = await Promise.all([
      prisma.series.count({ where: { origin: 'CURATED' } }),
      prisma.viewStatus.count({
        where: {
          status: 'VISTA',
          seriesId: { not: null },
          series: { origin: 'CURATED' },
        },
      }),
      prisma.comment.count({ where: { isPrivate: false } }),
      // Reseñas de USER_EMBED ya se permiten (ver /api/reviews), pero esta
      // vidriera es del catalogo curado de Flor — se filtran afuera.
      prisma.review.count({
        where: { status: 'PUBLISHED', series: { origin: 'CURATED' } },
      }),
      prisma.series.findMany({
        where: { origin: 'CURATED', catalogScope: 'PERSONAL' },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          year: true,
          imageUrl: true,
          imageThumbUrl: true,
          country: { select: { name: true, code: true } },
        },
      }),
      prisma.review.findFirst({
        // Idem: el spotlight de la landing es del catalogo curado, nunca
        // de un aporte USER_EMBED (colaborador o usuario comun).
        where: { status: 'PUBLISHED', series: { origin: 'CURATED' } },
        orderBy: [
          { isFeatured: 'desc' },
          { helpfulCount: 'desc' },
          { publishedAt: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          body: true,
          verdict: true,
          helpfulCount: true,
          user: { select: { name: true, image: true } },
          series: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              imageThumbUrl: true,
            },
          },
        },
      }),
      // Series watchable para el carousel Netflix-like en landing
      // (item 17 fine_tunning_1). Solo VISIBLE + tiene al menos un
      // episodio con embedUrl. Top 12 mas recientes.
      prisma.series.findMany({
        where: {
          visibility: 'VISIBLE',
          // Mismo criterio que /ver: con embed Y que no sea un trailer.
          ...HAS_WATCHABLE_EPISODE,
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          imageThumbUrl: true,
          imagePosition: true,
          year: true,
          type: true,
          country: { select: { name: true, code: true } },
          seasons: {
            select: {
              episodes: {
                where: WATCHABLE_EPISODE_WHERE,
                select: { embedPlatform: true, embedUrl: true },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.glossaryTerm.count({ where: { status: 'PUBLISHED' } }),
      prisma.glossaryTerm.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { term: 'asc' },
        select: {
          id: true,
          slug: true,
          term: true,
          transliteration: true,
          meaning: true,
          category: true,
          country: true,
        },
      }),
      prisma.news.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          summary: true,
          imageUrl: true,
          publishedAt: true,
          sourceName: true,
        },
      }),
    ]);

    const formattedWatchable = watchableSeries.map((s) => {
      let imageUrl = s.imageUrl;
      // El auto-thumbnail de YouTube reemplaza al poster propio cuando no
      // hay uno cargado — en ese caso no hay miniatura nuestra que ofrecer.
      let imageThumbUrl: string | null = s.imageThumbUrl;
      if (!imageUrl) {
        const firstWithEmbed = s.seasons
          .flatMap((season) => season.episodes)
          .find((e) => e.embedPlatform && e.embedUrl);
        if (firstWithEmbed) {
          imageUrl = getAutoThumbnailUrl(
            firstWithEmbed.embedPlatform as Platform,
            firstWithEmbed.embedUrl as string
          );
          imageThumbUrl = null;
        }
      }
      return {
        id: s.id,
        title: s.title,
        imageUrl,
        imageThumbUrl,
        imagePosition: s.imagePosition,
        year: s.year,
        type: s.type,
        country: s.country,
      };
    });

    const formattedNews = latestNews.map((n) => ({
      ...n,
      publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null,
    }));

    return {
      totalSeries,
      totalCompletedViews,
      totalPublicComments,
      totalReviews,
      latestSeries,
      featuredReview,
      watchableSeries: formattedWatchable,
      totalGlossaryTerms,
      featuredGlossaryTerm,
      latestNews: formattedNews,
    };
  } catch {
    return {
      totalSeries: 0,
      totalCompletedViews: 0,
      totalPublicComments: 0,
      totalReviews: 0,
      latestSeries: [],
      featuredReview: null,
      watchableSeries: [],
      totalGlossaryTerms: 0,
      featuredGlossaryTerm: null,
      latestNews: [],
    };
  }
}

export default async function HomePage() {
  const stats = await getLandingStats();

  return (
    <>
      <JsonLd<WebSite>
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'MundoBL',
          url: 'https://mundobl.com.ar',
          description:
            'Catálogo de series BL (Boys Love), GL (Girls Love) y doramas asiáticos.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate:
                'https://mundobl.com.ar/catalogo?q={search_term_string}',
            },

            // @ts-expect-error query-input is valid JSON-LD but not yet typed in schema-dts
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <LandingPage stats={stats} />
    </>
  );
}
