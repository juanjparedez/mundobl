export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
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

  return (
    <AppLayout>
      <TagPageClient tag={tag} />
    </AppLayout>
  );
}
