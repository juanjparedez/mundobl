'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Select,
  Table,
  Tag,
  Typography,
  Image,
  Space,
  Popconfirm,
  message,
} from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface PreviewEpisode {
  episodeNumber: number | null;
  title: string;
  rawTitle: string;
  videoId: string;
  embedUrl: string;
  embedPlatform: 'YouTube';
  embedChannelName: string;
  embedChannelUrl: string;
  thumbnailUrl: string;
  partNumber: number | null;
  partTotal: number | null;
  publishedAt: string;
  warnings: string[];
}

interface PreviewSeason {
  seasonNumber: number;
  episodes: PreviewEpisode[];
}

interface ImportPreview {
  source: {
    playlistId: string;
    playlistUrl: string;
    playlistTitle: string;
    playlistDescription: string;
    playlistThumbnailUrl: string;
    channelName: string;
    channelUrl: string;
    itemCount: number;
  };
  series: {
    title: string;
    synopsis: string | null;
    synopsisTranslated: boolean;
    suggestedYear: number | null;
    suggestedCountryCode: string | null;
    catalogScope: 'WATCHABLE_ONLY' | 'PERSONAL';
  };
  seasons: PreviewSeason[];
  warnings: string[];
  hasBlockingDuplicates: boolean;
}

const COUNTRY_OPTIONS = [
  { value: 'TH', label: 'Tailandia' },
  { value: 'KR', label: 'Corea del Sur' },
  { value: 'JP', label: 'Japon' },
  { value: 'CN', label: 'China' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'PH', label: 'Filipinas' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'MY', label: 'Malasia' },
  { value: 'HK', label: 'Hong Kong' },
];

export function ImportarClient() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [scope, setScope] = useState<'WATCHABLE_ONLY' | 'PERSONAL'>(
    'WATCHABLE_ONLY'
  );
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  // Editable copy of preview values that the admin can mutate.
  const [editTitle, setEditTitle] = useState('');
  const [editSynopsis, setEditSynopsis] = useState('');
  const [editYear, setEditYear] = useState<number | null>(null);
  const [editCountry, setEditCountry] = useState<string | null>(null);
  const [editSeasons, setEditSeasons] = useState<PreviewSeason[]>([]);

  const totalEpisodes = useMemo(
    () => editSeasons.reduce((acc, s) => acc + s.episodes.length, 0),
    [editSeasons]
  );

  const blockingDuplicates = useMemo(() => {
    let count = 0;
    for (const season of editSeasons) {
      const seen = new Map<number, number>();
      for (const ep of season.episodes) {
        if (ep.episodeNumber !== null) {
          seen.set(ep.episodeNumber, (seen.get(ep.episodeNumber) || 0) + 1);
        }
      }
      for (const c of seen.values()) {
        if (c > 1) count += c;
      }
    }
    return count;
  }, [editSeasons]);

  const missingNumbers = useMemo(
    () =>
      editSeasons.reduce(
        (acc, s) =>
          acc + s.episodes.filter((e) => e.episodeNumber === null).length,
        0
      ),
    [editSeasons]
  );

  async function handleLoadPreview() {
    if (!url.trim()) {
      message.warning('Pega una URL de playlist de YouTube');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/series/import-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          autoTranslate,
          catalogScope: scope,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const data: ImportPreview = await res.json();
      setPreview(data);
      setEditTitle(data.series.title);
      setEditSynopsis(data.series.synopsis || '');
      setEditYear(data.series.suggestedYear);
      setEditCountry(data.series.suggestedCountryCode);
      setEditSeasons(JSON.parse(JSON.stringify(data.seasons)));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Error al cargar preview');
    } finally {
      setLoading(false);
    }
  }

  function updateEpisode(
    seasonIdx: number,
    epIdx: number,
    patch: Partial<PreviewEpisode>
  ) {
    setEditSeasons((prev) => {
      const next = [...prev];
      next[seasonIdx] = {
        ...next[seasonIdx],
        episodes: next[seasonIdx].episodes.map((e, i) =>
          i === epIdx ? { ...e, ...patch } : e
        ),
      };
      return next;
    });
  }

  function deleteEpisode(seasonIdx: number, epIdx: number) {
    setEditSeasons((prev) => {
      const next = [...prev];
      next[seasonIdx] = {
        ...next[seasonIdx],
        episodes: next[seasonIdx].episodes.filter((_, i) => i !== epIdx),
      };
      return next;
    });
  }

  function renumberSeason(seasonIdx: number) {
    setEditSeasons((prev) => {
      const next = [...prev];
      next[seasonIdx] = {
        ...next[seasonIdx],
        episodes: next[seasonIdx].episodes.map((e, i) => ({
          ...e,
          episodeNumber: i + 1,
        })),
      };
      return next;
    });
    message.success('Episodios renumerados 1..N');
  }

  async function handleConfirm() {
    if (!editTitle.trim()) {
      message.warning('Falta el titulo de la serie');
      return;
    }
    if (blockingDuplicates > 0 || missingNumbers > 0) {
      message.warning('Resolvé los warnings antes de confirmar');
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch('/api/series/import-playlist/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          series: {
            title: editTitle.trim(),
            synopsis: editSynopsis.trim() || null,
            year: editYear,
            countryCode: editCountry,
            catalogScope: scope,
            type: 'serie',
          },
          seasons: editSeasons.map((s) => ({
            seasonNumber: s.seasonNumber,
            episodes: s.episodes.map((e) => ({
              episodeNumber: e.episodeNumber as number,
              title: e.title,
              videoId: e.videoId,
              embedUrl: e.embedUrl,
              embedPlatform: e.embedPlatform,
              embedChannelName: e.embedChannelName,
              embedChannelUrl: e.embedChannelUrl,
            })),
          })),
          source: {
            playlistId: preview?.source.playlistId,
            playlistUrl: preview?.source.playlistUrl,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const data = await res.json();
      message.success(`Serie "${data.title}" creada`);
      router.push(`/admin/series/${data.seriesId}/editar`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Error al confirmar');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <header className="importar-page__header">
        <h1 className="importar-page__title">
          <CloudDownloadOutlined /> Importar serie desde YouTube
        </h1>
        <p className="importar-page__subtitle">
          Pegá una playlist de YouTube (ej. la playlist oficial de una serie en
          GMMTV) y MundoBL crea la serie con sus episodios embebidos.
        </p>
      </header>

      <div className="importar-form">
        <Form layout="vertical">
          <Form.Item label="URL de playlist de YouTube" required>
            <Input
              size="large"
              placeholder="https://www.youtube.com/playlist?list=PL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPressEnter={handleLoadPreview}
            />
          </Form.Item>
          <div className="importar-form__row">
            <Form.Item label="Alcance del catalogo">
              <Select
                value={scope}
                onChange={(v) => setScope(v)}
                options={[
                  {
                    value: 'WATCHABLE_ONLY',
                    label: 'Solo en /ver (no en catalogo personal)',
                  },
                  {
                    value: 'PERSONAL',
                    label: 'En /catalogo + /ver (personal)',
                  },
                ]}
              />
            </Form.Item>
            <Form.Item label=" " colon={false}>
              <Checkbox
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
              >
                Traducir sinopsis al español con Gemini
              </Checkbox>
            </Form.Item>
            <Form.Item label=" " colon={false}>
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={handleLoadPreview}
                icon={<CloudDownloadOutlined />}
              >
                Cargar preview
              </Button>
            </Form.Item>
          </div>
        </Form>
      </div>

      {preview && (
        <div className="importar-preview">
          {(preview.warnings.length > 0 ||
            blockingDuplicates > 0 ||
            missingNumbers > 0) && (
            <div className="importar-preview__warnings">
              {preview.warnings.map((w, i) => (
                <Alert
                  key={i}
                  type="warning"
                  showIcon
                  title={w}
                  style={{ marginBottom: 8 }}
                />
              ))}
              {blockingDuplicates > 0 && (
                <Alert
                  type="error"
                  showIcon
                  title={`${blockingDuplicates} episodios duplicados — renumerá o eliminá antes de confirmar.`}
                  style={{ marginBottom: 8 }}
                />
              )}
              {missingNumbers > 0 && (
                <Alert
                  type="error"
                  showIcon
                  title={`${missingNumbers} episodios sin numero asignado — completalos antes de confirmar.`}
                  style={{ marginBottom: 8 }}
                />
              )}
            </div>
          )}

          <div className="importar-preview__section">
            <h2 className="importar-preview__section-title">
              Datos de la serie
            </h2>
            <Form layout="vertical">
              <Form.Item label="Titulo" required>
                <Input
                  size="large"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </Form.Item>
              <div className="importar-form__row">
                <Form.Item label="Año">
                  <InputNumber
                    size="large"
                    style={{ width: '100%' }}
                    value={editYear ?? undefined}
                    onChange={(v) =>
                      setEditYear(typeof v === 'number' ? v : null)
                    }
                    min={1900}
                    max={2100}
                  />
                </Form.Item>
                <Form.Item label="Pais">
                  <Select
                    size="large"
                    allowClear
                    value={editCountry}
                    onChange={(v) => setEditCountry(v ?? null)}
                    options={COUNTRY_OPTIONS}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </div>
              <Form.Item
                label={
                  <span>
                    Sinopsis{' '}
                    {preview.series.synopsisTranslated && (
                      <Tag color="purple">Traducida con IA</Tag>
                    )}
                  </span>
                }
              >
                <Input.TextArea
                  rows={4}
                  value={editSynopsis}
                  onChange={(e) => setEditSynopsis(e.target.value)}
                />
              </Form.Item>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Fuente:{' '}
                <a
                  href={preview.source.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {preview.source.channelName}
                </a>{' '}
                · {preview.source.itemCount} videos en la playlist
              </Typography.Text>
            </Form>
          </div>

          {editSeasons.map((season, sIdx) => (
            <div
              className="importar-preview__section"
              key={season.seasonNumber}
            >
              <Space
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <h2
                  className="importar-preview__section-title"
                  style={{ margin: 0 }}
                >
                  Temporada {season.seasonNumber} · {season.episodes.length}{' '}
                  episodios
                </h2>
                <Button
                  size="small"
                  icon={<SortAscendingOutlined />}
                  onClick={() => renumberSeason(sIdx)}
                >
                  Renumerar 1..{season.episodes.length}
                </Button>
              </Space>
              <Table
                size="small"
                pagination={false}
                rowKey={(r) => r.videoId}
                dataSource={season.episodes}
                columns={[
                  {
                    title: 'EP',
                    dataIndex: 'episodeNumber',
                    width: 90,
                    render: (val: number | null, _row, epIdx) => (
                      <InputNumber
                        size="small"
                        value={val ?? undefined}
                        min={1}
                        max={9999}
                        onChange={(v) =>
                          updateEpisode(sIdx, epIdx, {
                            episodeNumber: typeof v === 'number' ? v : null,
                          })
                        }
                        status={val === null ? 'error' : undefined}
                        style={{ width: 70 }}
                      />
                    ),
                  },
                  {
                    title: 'Thumbnail',
                    dataIndex: 'thumbnailUrl',
                    width: 100,
                    render: (url: string) =>
                      url ? (
                        <Image
                          src={url}
                          alt=""
                          width={80}
                          height={45}
                          className="importar-episode-thumb"
                          preview={false}
                        />
                      ) : null,
                  },
                  {
                    title: 'Titulo',
                    dataIndex: 'title',
                    render: (_val: string, row: PreviewEpisode, epIdx) => (
                      <div>
                        <Input
                          size="small"
                          value={row.title}
                          onChange={(e) =>
                            updateEpisode(sIdx, epIdx, {
                              title: e.target.value,
                            })
                          }
                        />
                        {row.partNumber !== null && (
                          <Tag color="orange" style={{ marginTop: 4 }}>
                            Parte {row.partNumber}
                            {row.partTotal ? `/${row.partTotal}` : ''}
                          </Tag>
                        )}
                        {row.warnings.map((w, i) => (
                          <span key={i} className="importar-episode-warning">
                            <WarningOutlined /> {w}
                          </span>
                        ))}
                      </div>
                    ),
                  },
                  {
                    title: 'Acciones',
                    width: 80,
                    render: (_, _row, epIdx) => (
                      <Popconfirm
                        title="¿Eliminar este episodio del preview?"
                        onConfirm={() => deleteEpisode(sIdx, epIdx)}
                      >
                        <Button
                          size="small"
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    ),
                  },
                ]}
              />
            </div>
          ))}

          <div className="importar-actions">
            <Button onClick={() => setPreview(null)}>Cancelar</Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              loading={confirming}
              disabled={
                blockingDuplicates > 0 ||
                missingNumbers > 0 ||
                totalEpisodes === 0
              }
              onClick={handleConfirm}
            >
              Confirmar e importar ({totalEpisodes} episodios)
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
