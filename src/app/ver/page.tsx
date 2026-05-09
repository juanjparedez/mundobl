import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { getWatchableSeries } from '@/lib/database';
import { VerPage } from './VerPage';
import './ver.css';

const VER_DESCRIPTION =
  'Mirá series BL y GL completas, embebidas desde los canales oficiales de productoras como GMMTV, Be On Cloud, Idol Factory y más.';

export const metadata: Metadata = {
  title: 'Ver Series BL Completas',
  description: VER_DESCRIPTION,
  alternates: { canonical: '/ver' },
  openGraph: {
    type: 'website',
    title: 'Ver Series BL Completas | MundoBL',
    description: VER_DESCRIPTION,
    url: '/ver',
    siteName: 'MundoBL',
  },
};

export const dynamic = 'force-dynamic';

export default async function VerPageRoute() {
  const series = await getWatchableSeries();

  const items = series.map((s) => ({
    id: s.id,
    title: s.title,
    year: s.year,
    type: s.type,
    imageUrl: s.imageUrl,
    synopsis: s.synopsis,
    catalogScope: s.catalogScope,
    country: s.country ? { name: s.country.name, code: s.country.code } : null,
    episodesWithEmbed: s.episodesWithEmbed,
    platforms: Array.from(
      new Set(
        s.seasons.flatMap(
          (season) =>
            season.episodes
              .map((e) => e.embedPlatform)
              .filter(Boolean) as string[]
        )
      )
    ),
    channels: Array.from(
      new Set(
        s.seasons.flatMap(
          (season) =>
            season.episodes
              .map((e) => e.embedChannelName)
              .filter(Boolean) as string[]
        )
      )
    ),
  }));

  return (
    <AppLayout>
      <div className="ver-page">
        <Breadcrumbs items={[{ name: 'Inicio', href: '/' }, { name: 'Ver' }]} />
        <VerPage items={items} />
      </div>
    </AppLayout>
  );
}
