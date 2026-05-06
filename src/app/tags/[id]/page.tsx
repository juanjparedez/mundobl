export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import type { CollectionPage } from 'schema-dts';
import { getTagById } from '@/lib/database';
import { TagPageClient } from './TagPageClient';

interface TagPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { id } = await params;
  const tagId = parseInt(id, 10);
  if (isNaN(tagId)) return {};

  const tag = await getTagById(tagId);
  if (!tag) return {};

  const seriesCount = tag.series.length;
  const description = `Series, películas y especiales con la etiqueta "${tag.name}". ${seriesCount} título${seriesCount === 1 ? '' : 's'} en MundoBL.`;

  return {
    title: `${tag.name} - Tag`,
    description,
    alternates: {
      canonical: `/tags/${tag.id}`,
    },
    openGraph: {
      title: tag.name,
      description,
      url: `/tags/${tag.id}`,
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { id } = await params;
  const tagId = parseInt(id, 10);

  if (isNaN(tagId)) {
    notFound();
  }

  const tag = await getTagById(tagId);

  if (!tag) {
    notFound();
  }

  const seriesCount = tag.series.length;

  return (
    <AppLayout>
      <JsonLd<CollectionPage>
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `Series con tag "${tag.name}"`,
          description: `Series, películas y especiales con la etiqueta "${tag.name}". ${seriesCount} título${seriesCount === 1 ? '' : 's'} en MundoBL.`,
          url: `https://mundobl.com.ar/tags/${tag.id}`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'MundoBL',
            url: 'https://mundobl.com.ar',
          },
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: seriesCount,
            itemListElement: tag.series.slice(0, 20).map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `https://mundobl.com.ar/series/${s.series.id}`,
              name: s.series.title,
            })),
          },
        }}
      />
      <Breadcrumbs
        items={[
          { name: 'Inicio', href: '/' },
          { name: 'Tags', href: '/catalogo' },
          { name: tag.name },
        ]}
      />
      <TagPageClient tag={tag} />
    </AppLayout>
  );
}
