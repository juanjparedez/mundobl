import { Suspense } from 'react';
import { prisma } from '@/lib/database';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import type { CollectionPage } from 'schema-dts';
import { NoticiasListClient } from './NoticiasListClient';
import './noticias.css';

export const revalidate = 120; // 2 minutos

const NOTICIAS_DESCRIPTION =
  'Últimas noticias del mundo BL y GL: estrenos, anuncios, fechas de emisión y novedades curadas para la comunidad hispanohablante.';

export const metadata: Metadata = {
  title: 'Noticias BL/GL',
  description: NOTICIAS_DESCRIPTION,
  alternates: { canonical: '/noticias' },
  openGraph: {
    type: 'website',
    title: 'Noticias BL/GL | MundoBL',
    description: NOTICIAS_DESCRIPTION,
    url: '/noticias',
    siteName: 'MundoBL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noticias BL/GL | MundoBL',
    description: NOTICIAS_DESCRIPTION,
  },
};

export default async function NoticiasPage() {
  // Pre-carga las noticias más recientes para SSR inicial
  const initialNews = await prisma.news.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      summary: true,
      originalUrl: true,
      sourceName: true,
      sourceLogo: true,
      imageUrl: true,
      publishedAt: true,
      aiGenerated: true,
      tags: { select: { tag: { select: { id: true, name: true } } } },
      relatedSeries: { select: { id: true, title: true } },
    },
  });

  const total = await prisma.news.count({ where: { status: 'PUBLISHED' } });

  return (
    <main className="noticias-page">
      <JsonLd<CollectionPage>
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Noticias BL/GL',
          description: NOTICIAS_DESCRIPTION,
          url: 'https://mundobl.com.ar/noticias',
          isPartOf: {
            '@type': 'WebSite',
            name: 'MundoBL',
            url: 'https://mundobl.com.ar',
          },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: total,
            itemListElement: initialNews.map((n, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `https://mundobl.com.ar/noticias/${n.id}`,
              name: n.title,
            })),
          },
        }}
      />
      <Breadcrumbs
        items={[{ name: 'Inicio', href: '/' }, { name: 'Noticias' }]}
      />
      <Suspense>
        <NoticiasListClient initialNews={initialNews} initialTotal={total} />
      </Suspense>
    </main>
  );
}
