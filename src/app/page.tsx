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
    const [totalSeries, totalCompletedViews, totalPublicComments] =
      await Promise.all([
        prisma.series.count(),
        prisma.viewStatus.count({
          where: { status: 'VISTA', seriesId: { not: null } },
        }),
        prisma.comment.count({ where: { isPrivate: false } }),
      ]);
    return { totalSeries, totalCompletedViews, totalPublicComments };
  } catch {
    return { totalSeries: 0, totalCompletedViews: 0, totalPublicComments: 0 };
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
          url: 'https://mundobl.win',
          description:
            'Catálogo de series BL (Boys Love), GL (Girls Love) y doramas asiáticos.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate:
                'https://mundobl.win/catalogo?q={search_term_string}',
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
