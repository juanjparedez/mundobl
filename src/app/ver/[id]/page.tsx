import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import type { TVSeries } from 'schema-dts';
import { getWatchableSeriesById } from '@/lib/database';
import { VerSerieClient } from './VerSerieClient';
import './ver-serie.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const seriesId = parseInt(id, 10);
  if (isNaN(seriesId)) return {};
  const serie = await getWatchableSeriesById(seriesId);
  if (!serie) return {};

  const title = `Ver ${serie.title}${serie.year ? ` (${serie.year})` : ''}`;
  const description =
    serie.synopsis?.slice(0, 160) ??
    `Mirá ${serie.title} embebida desde el canal oficial.`;

  return {
    title,
    description,
    alternates: { canonical: `/ver/${serie.id}` },
    openGraph: {
      title,
      description,
      url: `/ver/${serie.id}`,
      ...(serie.imageUrl && { images: [{ url: serie.imageUrl }] }),
    },
  };
}

export default async function VerSeriePage({ params }: PageProps) {
  const { id } = await params;
  const seriesId = parseInt(id, 10);
  if (isNaN(seriesId)) notFound();

  const serie = await getWatchableSeriesById(seriesId);
  if (!serie) notFound();

  const seasons = serie.seasons
    .map((s) => ({
      id: s.id,
      seasonNumber: s.seasonNumber,
      title: s.title,
      episodes: s.episodes
        .filter((e) => e.embedUrl)
        .map((e) => ({
          id: e.id,
          episodeNumber: e.episodeNumber,
          title: e.title,
          synopsis: e.synopsis,
          duration: e.duration,
          embedUrl: e.embedUrl,
          embedPlatform: e.embedPlatform,
          embedVideoId: e.embedVideoId,
          embedChannelName: e.embedChannelName,
          embedChannelUrl: e.embedChannelUrl,
        })),
    }))
    .filter((s) => s.episodes.length > 0);

  if (seasons.length === 0) {
    notFound();
  }

  const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodes.length, 0);

  return (
    <AppLayout>
      <JsonLd<TVSeries>
        data={{
          '@context': 'https://schema.org',
          '@type': 'TVSeries',
          name: serie.title,
          ...(serie.originalTitle && { alternateName: serie.originalTitle }),
          ...(serie.synopsis && { description: serie.synopsis }),
          ...(serie.imageUrl && { image: serie.imageUrl }),
          ...(serie.year && { datePublished: String(serie.year) }),
          ...(serie.country?.name && {
            countryOfOrigin: {
              '@type': 'Country',
              name: serie.country.name,
            },
          }),
          ...(serie.genres &&
            serie.genres.length > 0 && {
              genre: serie.genres.map((sg) => sg.genre.name),
            }),
          numberOfSeasons: seasons.length,
          numberOfEpisodes: totalEpisodes,
          potentialAction: {
            '@type': 'WatchAction',
            target: `https://mundobl.com.ar/ver/${serie.id}`,
          },
          url: `https://mundobl.com.ar/ver/${serie.id}`,
        }}
      />
      <div className="ver-serie-page">
        <Breadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Ver', href: '/ver' },
            { name: serie.title },
          ]}
        />
        <div className="ver-serie-back">
          <Link href="/ver">
            <Button icon={<LeftOutlined />} type="link">
              Volver al catálogo de series mirables
            </Button>
          </Link>
        </div>
        <VerSerieClient
          series={{
            id: serie.id,
            title: serie.title,
            originalTitle: serie.originalTitle,
            year: serie.year,
            synopsis: serie.synopsis,
            imageUrl: serie.imageUrl,
            catalogScope: serie.catalogScope,
            origin: serie.origin,
            submittedByName:
              serie.submittedBy?.nickname ?? serie.submittedBy?.name ?? null,
            country: serie.country
              ? { name: serie.country.name, code: serie.country.code }
              : null,
            tags: serie.tags.map((st) => st.tag.name),
            genres: serie.genres.map((sg) => sg.genre.name),
          }}
          seasons={seasons}
        />
      </div>
    </AppLayout>
  );
}
