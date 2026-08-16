'use client';

import { Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './EpisodeAnalysisTable.css';

const { Text } = Typography;

interface EpisodeRow {
  key: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string | null;
  duration: number | null;
  synopsis: string | null;
  noteBody: string | null;
}

export interface SeasonInput {
  seasonNumber: number;
  episodes?: Array<{
    id: number;
    episodeNumber: number;
    title: string | null;
    duration: number | null;
    synopsis: string | null;
    // EpisodeNote viene como relacion adentro de episodes via include en
    // getSeriesById; el shape exacto depende del query. Aca tipamos
    // tolerante para no romper si el include no trae notes.
    notes?: Array<{ body: string; userId: string }>;
  }>;
}

export interface EpisodeAnalysisTableProps {
  seasons: SeasonInput[];
  /** userId actual para filtrar EpisodeNote propias. */
  currentUserId?: string | null;
}

/** Tabla densa de analisis por episodio para el workspace admin.
 *  Columnas: Temporada/Episodio | Tiempo | Titulo | Sinopsis | Notas
 *  (notas del user actual). Los campos editoriales nuevos (tono,
 *  subtramas, personajes, tags por episodio) requieren migration de
 *  modelo Episode — se agregan en commit posterior. Por ahora muestra
 *  los campos que ya existen en DB. */
export function EpisodeAnalysisTable({
  seasons,
  currentUserId,
}: EpisodeAnalysisTableProps) {
  const { t } = useLocale();

  const data: EpisodeRow[] = seasons
    .flatMap((season) =>
      (season.episodes ?? []).map((ep) => {
        const note = currentUserId
          ? (ep.notes ?? []).find((n) => n.userId === currentUserId)
          : null;
        return {
          key: `${season.seasonNumber}-${ep.episodeNumber}`,
          seasonNumber: season.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          duration: ep.duration,
          synopsis: ep.synopsis,
          noteBody: note?.body ?? null,
        };
      })
    )
    .sort((a, b) =>
      a.seasonNumber === b.seasonNumber
        ? a.episodeNumber - b.episodeNumber
        : a.seasonNumber - b.seasonNumber
    );

  const columns: ColumnsType<EpisodeRow> = [
    {
      title: t('workspace.tableColEpisode'),
      key: 'episode',
      width: 90,
      render: (_, row) => (
        <Text strong className="mb-episode-table__id">
          T{row.seasonNumber} · E{String(row.episodeNumber).padStart(2, '0')}
        </Text>
      ),
    },
    {
      title: t('workspace.tableColDuration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 90,
      render: (duration: number | null) =>
        duration ? <Text>{duration}m</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: t('workspace.tableColTitle'),
      dataIndex: 'title',
      key: 'title',
      render: (title: string | null) =>
        title ? title : <Text type="secondary">—</Text>,
    },
    {
      title: (
        <Tooltip title={t('workspace.tableColToneHint')}>
          <span>{t('workspace.tableColTone')}</span>
        </Tooltip>
      ),
      key: 'tone',
      width: 110,
      render: () => (
        <Text type="secondary" className="mb-episode-table__placeholder">
          {t('workspace.tableCellPending')}
        </Text>
      ),
    },
    {
      title: (
        <Tooltip title={t('workspace.tableColSubplotsHint')}>
          <span>{t('workspace.tableColSubplots')}</span>
        </Tooltip>
      ),
      key: 'subplots',
      width: 140,
      render: () => (
        <Text type="secondary" className="mb-episode-table__placeholder">
          {t('workspace.tableCellPending')}
        </Text>
      ),
    },
    {
      title: t('workspace.tableColSynopsis'),
      dataIndex: 'synopsis',
      key: 'synopsis',
      render: (synopsis: string | null) =>
        synopsis ? (
          <Tooltip title={synopsis} mouseEnterDelay={0.5}>
            <span className="mb-episode-table__synopsis">
              {synopsis.length > 80 ? synopsis.slice(0, 80) + '…' : synopsis}
            </span>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: t('workspace.tableColNotes'),
      dataIndex: 'noteBody',
      key: 'notes',
      width: 200,
      render: (noteBody: string | null) =>
        noteBody ? (
          <Tooltip title={noteBody} mouseEnterDelay={0.5}>
            <Tag color="purple" className="mb-episode-table__note-tag">
              {noteBody.length > 30 ? noteBody.slice(0, 30) + '…' : noteBody}
            </Tag>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  if (data.length === 0) {
    return (
      <div className="mb-episode-table__empty">{t('workspace.tableEmpty')}</div>
    );
  }

  return (
    <Table<EpisodeRow>
      columns={columns}
      dataSource={data}
      size="small"
      pagination={{ pageSize: 30, hideOnSinglePage: true }}
      className="mb-episode-table"
      scroll={{ x: 800 }}
    />
  );
}
