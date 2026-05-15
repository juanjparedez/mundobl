import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import type { WebSite } from 'schema-dts';
import { LandingPage } from './LandingPage/LandingPage';
import { prisma } from '@/lib/database';

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
      prisma.review.count({ where: { status: 'PUBLISHED' } }),
      prisma.series.findMany({
        where: { origin: 'CURATED', catalogScope: 'PERSONAL' },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          year: true,
          imageUrl: true,
          country: { select: { name: true, code: true } },
        },
      }),
      prisma.review.findFirst({
        where: { status: 'PUBLISHED' },
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
          series: { select: { id: true, title: true, imageUrl: true } },
        },
      }),
      // Series watchable para el carousel Netflix-like en landing
      // (item 17 fine_tunning_1). Solo VISIBLE + tiene al menos un
      // episodio con embedUrl. Top 12 mas recientes.
      prisma.series.findMany({
        where: {
          visibility: 'VISIBLE',
          seasons: {
            some: { episodes: { some: { embedUrl: { not: null } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          imagePosition: true,
          year: true,
          type: true,
          country: { select: { name: true, code: true } },
        },
      }),
    ]);
    return {
      totalSeries,
      totalCompletedViews,
      totalPublicComments,
      totalReviews,
      latestSeries,
      featuredReview,
      watchableSeries,
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
