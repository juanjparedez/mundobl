import { Suspense } from 'react';
import { prisma } from '@/lib/database';
import type { Metadata } from 'next';
import { NoticiasListClient } from './NoticiasListClient';
import './noticias.css';

export const revalidate = 120; // 2 minutos

export const metadata: Metadata = {
  title: 'Noticias BL/GL',
  description:
    'Últimas noticias del mundo BL y GL: estrenos, anuncios y novedades curadas para la comunidad.',
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
      <Suspense>
        <NoticiasListClient initialNews={initialNews} initialTotal={total} />
      </Suspense>
    </main>
  );
}
