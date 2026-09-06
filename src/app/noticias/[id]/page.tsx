import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LeftOutlined,
  LinkOutlined,
  RobotOutlined,
  ArrowRightOutlined,
} from '@/lib/client-icons';
import { prisma } from '@/lib/database';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { getSeriesUrl } from '@/lib/slug';
import type { NewsArticle } from 'schema-dts';
import './noticia-detail.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 300;

function cleanText(text: string): string {
  return text.replace(/[*_`[\]#>]/g, '').trim();
}

function formatDate(d: Date | string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const newsId = parseInt(id, 10);
  if (isNaN(newsId)) return {};

  const item = await prisma.news.findUnique({
    where: { id: newsId },
    select: {
      id: true,
      title: true,
      summary: true,
      imageUrl: true,
      status: true,
      publishedAt: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  if (!item || item.status !== 'PUBLISHED') return {};

  const description = cleanText(item.summary).slice(0, 160);
  const keywords = [
    item.title,
    'noticias BL',
    'series BL noticias',
    'estrenos BL',
    ...item.tags.map((t) => t.tag.name),
  ];

  return {
    title: `${item.title} | Noticias BL/GL - MundoBL`,
    description,
    keywords,
    alternates: {
      canonical: `/noticias/${item.id}`,
    },
    openGraph: {
      type: 'article',
      title: item.title,
      description,
      url: `/noticias/${item.id}`,
      publishedTime: item.publishedAt?.toISOString(),
      ...(item.imageUrl && {
        images: [{ url: item.imageUrl, alt: item.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description,
      ...(item.imageUrl && { images: [item.imageUrl] }),
    },
  };
}

export default async function NoticiaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const newsId = parseInt(id, 10);
  if (isNaN(newsId)) notFound();

  const item = await prisma.news.findUnique({
    where: { id: newsId },
    include: {
      tags: { include: { tag: true } },
      relatedSeries: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          year: true,
          type: true,
        },
      },
    },
  });

  if (!item || item.status !== 'PUBLISHED') {
    notFound();
  }

  const publishedIso =
    item.publishedAt?.toISOString() ?? item.createdAt.toISOString();
  const canonicalUrl = `https://mundobl.com.ar/noticias/${item.id}`;

  return (
    <main className="noticia-detail">
      <JsonLd<NewsArticle>
        data={{
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: item.title,
          description: cleanText(item.summary).slice(0, 200),
          image: item.imageUrl ? [item.imageUrl] : undefined,
          datePublished: publishedIso,
          dateModified: item.updatedAt.toISOString(),
          mainEntityOfPage: canonicalUrl,
          author: [
            {
              '@type': 'Organization',
              name: item.sourceName || 'MundoBL',
              url: item.originalUrl,
            },
          ],
          publisher: {
            '@type': 'Organization',
            name: 'MundoBL',
            logo: {
              '@type': 'ImageObject',
              url: 'https://mundobl.com.ar/icons/icon-512x512.png',
            },
          },
        }}
      />

      <Breadcrumbs
        items={[
          { name: 'Inicio', href: '/' },
          { name: 'Noticias', href: '/noticias' },
          { name: item.title },
        ]}
      />

      <div className="noticia-detail__back">
        <Link href="/noticias" className="noticia-detail__back-link">
          <LeftOutlined /> Volver a noticias
        </Link>
      </div>

      <article>
        <header className="noticia-detail__header">
          <div className="noticia-detail__meta">
            {item.sourceLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.sourceLogo}
                alt={item.sourceName}
                className="noticia-detail__source-logo"
              />
            )}
            <span className="noticia-detail__source-name">
              {item.sourceName}
            </span>
            {item.publishedAt && <span>· {formatDate(item.publishedAt)}</span>}
            {item.aiGenerated && (
              <span className="noticias-card__ai-badge">
                <RobotOutlined /> Curado con IA
              </span>
            )}
          </div>

          <h1 className="noticia-detail__title">{item.title}</h1>

          {item.tags.length > 0 && (
            <div className="noticia-detail__tags">
              {item.tags.map((t) => (
                <span key={t.tag.id} className="noticia-detail__tag">
                  {t.tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {item.imageUrl && (
          <div className="noticia-detail__img-wrap">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              priority
              sizes="(max-width: 860px) 100vw, 860px"
              className="noticia-detail__img"
              unoptimized
            />
          </div>
        )}

        <div className="noticia-detail__content">{item.summary}</div>

        {item.relatedSeries && (
          <div className="noticia-detail__series-box">
            <div className="noticia-detail__series-info">
              <span className="noticia-detail__series-label">
                Serie relacionada
              </span>
              <span className="noticia-detail__series-title">
                {item.relatedSeries.title}{' '}
                {item.relatedSeries.year ? `(${item.relatedSeries.year})` : ''}
              </span>
            </div>
            <Link
              href={getSeriesUrl(
                item.relatedSeries.id,
                item.relatedSeries.title
              )}
              className="noticia-detail__series-link"
            >
              Ver ficha en catálogo <ArrowRightOutlined />
            </Link>
          </div>
        )}

        <footer className="noticia-detail__source-footer">
          <span>
            Esta noticia es un resumen curado para la comunidad de MundoBL.
          </span>
          <a
            href={item.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="noticia-detail__original-btn"
          >
            <LinkOutlined /> Leer nota original en {item.sourceName}
          </a>
        </footer>
      </article>
    </main>
  );
}
