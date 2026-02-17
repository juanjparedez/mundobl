import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSeriesById } from '@/lib/database';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { SeasonsList } from '@/components/series/SeasonsList';
import { SeriesInfo } from '@/components/series/SeriesInfo';
import { RatingSection } from '@/components/series/RatingSection';
import { CommentsSection } from '@/components/series/CommentsSection';
import { ViewStatusToggle } from '@/components/series/ViewStatusToggle';
import { SeriesDetailClient } from '@/components/series/SeriesDetailClient';
import { shouldShowSeasons, getContentTypeConfig } from '@/types/content';
import { FloatButton } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import './page.css';

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Disable static generation for now (causes slow dev performance)
export const dynamic = 'force-dynamic';

export default async function SeriesPage({ params }: SeriesPageProps) {
  const resolvedParams = await params;
  const seriesId = parseInt(resolvedParams.id, 10);

  if (isNaN(seriesId)) {
    notFound();
  }

  const serie = await getSeriesById(seriesId);

  if (!serie) {
    notFound();
  }

  const config = getContentTypeConfig(serie.type);
  const showSeasons = shouldShowSeasons(serie.type);

  const seasonLabel =
    'seasonLabel' in config ? config.seasonLabel : 'Temporadas';

  return (
    <AppLayout>
      <div className="series-detail-page">
        <SeriesHeader series={serie} />

        <div className="series-actions">
          <ViewStatusToggle
            seriesId={serie.id}
            initialStatus={serie.viewStatus?.[0]?.watched || false}
            initialCurrentlyWatching={
              serie.viewStatus?.[0]?.currentlyWatching || false
            }
            seasons={serie.seasons}
          />
        </div>

        <SeriesDetailClient
          seriesId={serie.id}
          showSeasons={showSeasons}
          seasonLabel={seasonLabel}
          seasonCount={serie.seasons?.length || 0}
          infoSection={<SeriesInfo series={serie} />}
          seasonsSection={<SeasonsList seasons={serie.seasons || []} />}
          ratingsSection={
            <RatingSection
              seriesId={serie.id}
              existingRatings={serie.ratings || []}
            />
          }
          commentsSection={
            <CommentsSection
              seriesId={serie.id}
              comments={serie.comments || []}
            />
          }
        />

        {/* Botón flotante para editar */}
        <Link href={`/admin/series/${serie.id}/editar`}>
          <FloatButton
            icon={<EditOutlined />}
            type="primary"
            style={{ right: 24, bottom: 24, zIndex: 100 }}
            tooltip="Editar serie"
          />
        </Link>
      </div>
    </AppLayout>
  );
}
